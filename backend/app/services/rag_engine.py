import json
import math
import re
from typing import List, Dict, Any

class RAGEngineService:
    @staticmethod
    def extract_text_from_file(file_content: bytes, filename: str) -> str:
        """
        Extract text from PDF, TXT, DOCX, CSV, MD, JSON
        """
        ext = filename.split(".")[-1].lower()
        if ext in ["txt", "md", "csv", "json"]:
            return file_content.decode("utf-8", errors="ignore")
        elif ext == "pdf":
            try:
                import pypdf
                import io
                reader = pypdf.PdfReader(io.BytesIO(file_content))
                text = ""
                for page in reader.pages:
                    text += page.extract_text() + "\n"
                return text
            except Exception as e:
                return f"[PDF Extraction Error: {str(e)}]"
        elif ext == "docx":
            try:
                import docx
                import io
                doc = docx.Document(io.BytesIO(file_content))
                return "\n".join([p.text for p in doc.paragraphs])
            except Exception as e:
                return f"[DOCX Extraction Error: {str(e)}]"
        else:
            return file_content.decode("utf-8", errors="ignore")

    @staticmethod
    def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> List[str]:
        """
        Splits text into overlapping chunks
        """
        cleaned = re.sub(r'\s+', ' ', text).strip()
        if not cleaned:
            return []
        
        chunks = []
        start = 0
        while start < len(cleaned):
            end = min(start + chunk_size, len(cleaned))
            chunks.append(cleaned[start:end])
            start += (chunk_size - overlap)
        return chunks

    @staticmethod
    def generate_embedding(text: str) -> List[float]:
        """
        Generates lightweight embedding vector (128 dimensions) for semantic cosine search
        """
        # Deterministic lightweight pseudo-embedding vector for zero-dependency speed
        words = text.lower().split()
        vector = [0.0] * 128
        for word in words:
            for i, char in enumerate(word[:128]):
                idx = (ord(char) * (i + 1)) % 128
                vector[idx] += 1.0
        
        # Normalize vector
        magnitude = math.sqrt(sum(x * x for x in vector)) or 1.0
        return [x / magnitude for x in vector]

    @staticmethod
    def cosine_similarity(v1: List[float], v2: List[float]) -> float:
        if not v1 or not v2 or len(v1) != len(v2):
            return 0.0
        dot = sum(a * b for a, b in zip(v1, v2))
        return max(0.0, min(1.0, dot))

    @classmethod
    def search_chunks(cls, query: str, chunks_data: List[Dict[str, Any]], top_k: int = 3) -> List[Dict[str, Any]]:
        """
        Ranks chunks using cosine similarity
        """
        query_vec = cls.generate_embedding(query)
        scored = []

        for item in chunks_data:
            emb_str = item.get("embedding_json")
            if emb_str:
                emb = json.loads(emb_str)
            else:
                emb = cls.generate_embedding(item["content"])
            
            score = cls.cosine_similarity(query_vec, emb)
            scored.append({
                "chunk_id": item.get("id"),
                "document_filename": item.get("filename", "document.txt"),
                "content": item["content"],
                "score": score
            })

        scored.sort(key=lambda x: x["score"], reverse=True)
        return scored[:top_k]
