import json
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from app.core.database import get_db
from app.models.all_models import KnowledgeBase, Document, DocumentChunk
from app.services.rag_engine import RAGEngineService

router = APIRouter(prefix="/knowledge", tags=["Knowledge Base"])

class CreateKnowledgeBaseSchema(BaseModel):
    name: str
    description: Optional[str] = None

@router.get("")
async def list_knowledge_bases(user_id: str = "default_user", db: AsyncSession = Depends(get_db)):
    stmt = select(KnowledgeBase).order_by(KnowledgeBase.created_at.desc())
    res = await db.execute(stmt)
    kbs = res.scalars().all()

    output = []
    for kb in kbs:
        output.append({
            "id": kb.id,
            "name": kb.name,
            "description": kb.description,
            "total_documents": kb.total_documents,
            "total_chunks": kb.total_chunks,
            "created_at": kb.created_at.isoformat() if kb.created_at else None
        })
    return output

@router.post("")
async def create_knowledge_base(payload: CreateKnowledgeBaseSchema, user_id: str = "default_user", db: AsyncSession = Depends(get_db)):
    kb = KnowledgeBase(
        user_id=user_id,
        name=payload.name,
        description=payload.description
    )
    db.add(kb)
    await db.commit()
    await db.refresh(kb)
    return {"id": kb.id, "name": kb.name, "status": "created"}

@router.get("/{kb_id}/documents")
async def list_kb_documents(kb_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(Document).where(Document.knowledge_base_id == kb_id).order_by(Document.created_at.desc())
    res = await db.execute(stmt)
    docs = res.scalars().all()

    return [{
        "id": d.id,
        "filename": d.filename,
        "file_type": d.file_type,
        "file_size": d.file_size,
        "status": d.status,
        "chunk_count": d.chunk_count,
        "created_at": d.created_at.isoformat() if d.created_at else None
    } for d in docs]

@router.post("/{kb_id}/upload")
async def upload_document_to_kb(
    kb_id: str,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(KnowledgeBase).where(KnowledgeBase.id == kb_id)
    res = await db.execute(stmt)
    kb = res.scalar_one_or_none()
    if not kb:
        raise HTTPException(status_code=404, detail="Knowledge Base not found.")

    content_bytes = await file.read()
    filename = file.filename
    ext = filename.split(".")[-1].lower() if "." in filename else "txt"

    # Process Document with RAG Engine
    text_content = RAGEngineService.extract_text_from_file(content_bytes, filename)
    chunks = RAGEngineService.chunk_text(text_content)

    doc = Document(
        knowledge_base_id=kb_id,
        filename=filename,
        file_type=ext,
        file_size=len(content_bytes),
        status="indexed",
        chunk_count=len(chunks)
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)

    # Save Chunks and Embeddings
    for idx, chunk_text in enumerate(chunks):
        emb = RAGEngineService.generate_embedding(chunk_text)
        db_chunk = DocumentChunk(
            document_id=doc.id,
            chunk_index=idx,
            content=chunk_text,
            embedding_json=json.dumps(emb)
        )
        db.add(db_chunk)

    # Update Knowledge Base Totals
    kb.total_documents += 1
    kb.total_chunks += len(chunks)
    await db.commit()

    return {
        "document_id": doc.id,
        "filename": doc.filename,
        "chunk_count": len(chunks),
        "status": "indexed"
    }

@router.post("/{kb_id}/search")
async def search_knowledge_base(kb_id: str, query: str, top_k: int = 3, db: AsyncSession = Depends(get_db)):
    # Fetch all chunks in this knowledge base
    stmt = select(DocumentChunk, Document.filename).join(Document, DocumentChunk.document_id == Document.id).where(Document.knowledge_base_id == kb_id)
    res = await db.execute(stmt)
    rows = res.all()

    chunks_data = []
    for chunk, fname in rows:
        chunks_data.append({
            "id": chunk.id,
            "filename": fname,
            "content": chunk.content,
            "embedding_json": chunk.embedding_json
        })

    results = RAGEngineService.search_chunks(query, chunks_data, top_k=top_k)
    return results

@router.delete("/documents/{doc_id}")
async def delete_document(doc_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(Document).where(Document.id == doc_id)
    res = await db.execute(stmt)
    doc = res.scalar_one_or_none()

    if doc:
        # Update KB counts
        kb_stmt = select(KnowledgeBase).where(KnowledgeBase.id == doc.knowledge_base_id)
        kb_res = await db.execute(kb_stmt)
        kb = kb_res.scalar_one_or_none()
        if kb:
            kb.total_documents = max(0, kb.total_documents - 1)
            kb.total_chunks = max(0, kb.total_chunks - doc.chunk_count)

        await db.delete(doc)
        await db.commit()
    return {"status": "deleted"}
