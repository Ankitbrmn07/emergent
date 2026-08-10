import React, { useEffect, useState } from 'react';
import { BookOpen, Upload, Search, FileText, CheckCircle2, Trash2, Database, Layers, Sparkles } from 'lucide-react';
import { apiClient } from '../services/apiClient';
import type { KnowledgeBase, DocumentItem } from '../types';

export const KnowledgeBasePage: React.FC = () => {
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [selectedKb, setSelectedKb] = useState<KnowledgeBase | null>(null);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [newKbName, setNewKbName] = useState('');

  useEffect(() => {
    loadKnowledgeBases();
  }, []);

  const loadKnowledgeBases = async () => {
    try {
      const resp = await apiClient.get('/knowledge');
      setKnowledgeBases(resp.data);
      if (resp.data.length > 0) {
        setSelectedKb(resp.data[0]);
        loadDocuments(resp.data[0].id);
      }
    } catch (err) {
      console.error('Error loading knowledge bases:', err);
    }
  };

  const loadDocuments = async (kbId: string) => {
    try {
      const resp = await apiClient.get(`/knowledge/${kbId}/documents`);
      setDocuments(resp.data);
    } catch (err) {
      console.error('Error loading documents:', err);
    }
  };

  const handleCreateKb = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKbName.trim()) return;
    try {
      await apiClient.post('/knowledge', { name: newKbName, description: 'Knowledge repository' });
      setNewKbName('');
      await loadKnowledgeBases();
    } catch (err) {
      console.error('Error creating KB:', err);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !selectedKb) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);

    setIsUploading(true);
    try {
      await apiClient.post(`/knowledge/${selectedKb.id}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      await loadDocuments(selectedKb.id);
      await loadKnowledgeBases();
    } catch (err) {
      alert('Upload failed: ' + err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleVectorSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || !selectedKb) return;
    try {
      const resp = await apiClient.post(`/knowledge/${selectedKb.id}/search?query=${encodeURIComponent(searchQuery)}`);
      setSearchResults(resp.data);
    } catch (err) {
      console.error('Vector search error:', err);
    }
  };

  const handleDeleteDoc = async (docId: string) => {
    if (confirm('Delete document and associated vector chunks?')) {
      await apiClient.delete(`/knowledge/documents/${docId}`);
      if (selectedKb) await loadDocuments(selectedKb.id);
      await loadKnowledgeBases();
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            <span>RAG Knowledge Base Engine</span>
          </h1>
          <p className="text-xs text-slate-400">Upload documents (PDF, TXT, DOCX, CSV, MD, JSON) to index vector chunks for agent reasoning context</p>
        </div>

        {/* Quick KB Creation */}
        <form onSubmit={handleCreateKb} className="flex items-center space-x-2">
          <input
            type="text"
            value={newKbName}
            onChange={(e) => setNewKbName(e.target.value)}
            placeholder="New Knowledge Base..."
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-lg shadow-indigo-600/20"
          >
            + Create KB
          </button>
        </form>
      </div>

      {/* Main Grid: KB Switcher & Document List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: KB Selector List */}
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Knowledge Stores</h2>
          <div className="space-y-2">
            {knowledgeBases.map(kb => (
              <div
                key={kb.id}
                onClick={() => {
                  setSelectedKb(kb);
                  loadDocuments(kb.id);
                  setSearchResults([]);
                }}
                className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-2 ${
                  selectedKb?.id === kb.id
                    ? 'bg-indigo-600/15 border-indigo-500/50 shadow-lg shadow-indigo-600/10'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-white">{kb.name}</h3>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400 font-mono">
                    {kb.total_documents} Docs
                  </span>
                </div>
                <p className="text-xs text-slate-400 line-clamp-1">{kb.description || 'Vector knowledge repository'}</p>
                <div className="text-[11px] text-slate-500 font-mono">
                  {kb.total_chunks} Chunks Indexed
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 2 Cols: Document Upload & Vector Search Test */}
        <div className="lg:col-span-2 space-y-6">
          {selectedKb && (
            <>
              {/* Document Upload Area */}
              <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <div>
                    <h3 className="font-bold text-sm text-white flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-indigo-400" />
                      <span>Documents in {selectedKb.name}</span>
                    </h3>
                    <p className="text-[11px] text-slate-400">PDF, TXT, DOCX, CSV, Markdown, JSON supported</p>
                  </div>

                  <label className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium text-xs shadow-lg shadow-indigo-600/20 cursor-pointer flex items-center space-x-2 transition-all">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isUploading ? 'Indexing...' : 'Upload Document'}</span>
                    <input type="file" onChange={handleFileUpload} disabled={isUploading} className="hidden" />
                  </label>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {documents.length === 0 ? (
                    <p className="text-xs text-slate-500 py-6 text-center">No documents uploaded yet in this knowledge base.</p>
                  ) : (
                    documents.map(doc => (
                      <div key={doc.id} className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-3">
                          <FileText className="w-4 h-4 text-purple-400" />
                          <div>
                            <span className="font-bold text-white">{doc.filename}</span>
                            <span className="text-[10px] text-slate-500 block font-mono">
                              {doc.file_type.toUpperCase()} • {(doc.file_size / 1024).toFixed(1)} KB • {doc.chunk_count} Chunks
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Indexed</span>
                          </span>
                          <button onClick={() => handleDeleteDoc(doc.id)} className="text-slate-500 hover:text-rose-400">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Vector Similarity Search Playground */}
              <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
                <div className="border-b border-slate-800/80 pb-3">
                  <h3 className="font-bold text-sm text-white flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Vector Similarity Search Inspector</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">Test semantic cosine vector query retrieval against indexed document chunks</p>
                </div>

                <form onSubmit={handleVectorSearch} className="flex items-center space-x-3">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search queries (e.g. 'Groq function calling specs')..."
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-lg shadow-indigo-600/20 flex items-center space-x-1.5"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Search Vectors</span>
                  </button>
                </form>

                {searchResults.length > 0 && (
                  <div className="space-y-3 font-mono text-xs pt-2">
                    {searchResults.map((res, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl bg-slate-900 border border-indigo-500/30 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-purple-300 font-bold">Doc: {res.document_filename}</span>
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/30">
                            Similarity Score: {(res.score * 100).toFixed(1)}%
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 font-sans leading-relaxed">{res.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
