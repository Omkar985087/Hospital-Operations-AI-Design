import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Bot,
  CheckCircle2,
  FileText,
  FileUp,
  Info,
  Loader2,
  MessageSquare,
  Send,
  Sparkles,
  Trash2,
  UploadCloud,
  User,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { EmptyState } from '../components/ui/EmptyState';
import { FormField, SelectInput, TextInput } from '../components/ui/FormControls';
import { askDocumentQuestion, uploadDocument } from '../services/documentService';
import { getErrorMessage } from '../services/api';
import { useWorkspace } from '../hooks/useWorkspaceData';
import { useToast } from '../hooks/useToast';
import {
  formatDateTime,
  formatDistanceScore,
  formatFileSize,
  truncateId,
} from '../utils/formatters';
import { validatePdfFile } from '../utils/validators';
import { readStorage, STORAGE_KEYS, writeStorage } from '../utils/storage';

const SUGGESTED_QUESTIONS = [
  'Summarize key findings and diagnostic results in this report.',
  'What medications, dosages, or lab values are documented?',
  'Are any follow-up instructions or dates mentioned?',
];

export function DocumentsPage() {
  const [searchParams] = useSearchParams();
  const initialQueryPatientId = searchParams.get('patientId') || '';

  const { patients, documents, addDocumentRecord, addNotification, globalSearch } =
    useWorkspace();
  const toast = useToast();

  // Patient context shared across upload & Q&A
  const [patientId, setPatientId] = useState(
    () => initialQueryPatientId || documents[0]?.patient_id || patients[0]?.patient_id || ''
  );

  // Upload state
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef(null);

  // RAG chat state (keyed by patient_id in localStorage)
  const [chatsByPatient, setChatsByPatient] = useState(() =>
    readStorage(STORAGE_KEYS.RAG_CHATS, {})
  );
  const [question, setQuestion] = useState('');
  const [asking, setAsking] = useState(false);
  const [askError, setAskError] = useState('');
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (initialQueryPatientId) {
      setPatientId(initialQueryPatientId);
    }
  }, [initialQueryPatientId]);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.RAG_CHATS, chatsByPatient);
  }, [chatsByPatient]);

  const activePatientKey = patientId.trim() || '__default__';
  const messages = chatsByPatient[activePatientKey] || [];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, asking]);

  const patientNameMap = useMemo(() => {
    const map = {};
    patients.forEach((p) => {
      map[p.patient_id] = p.full_name;
    });
    return map;
  }, [patients]);

  const filteredDocuments = useMemo(() => {
    const query = (globalSearch || '').trim().toLowerCase();
    if (!query) return documents;
    return documents.filter(
      (doc) =>
        doc.file_name?.toLowerCase().includes(query) ||
        doc.document_id?.toLowerCase().includes(query) ||
        doc.patient_id?.toLowerCase().includes(query)
    );
  }, [documents, globalSearch]);

  const handleFilePicked = (file) => {
    if (!file) return;
    const validationErr = validatePdfFile(file);
    if (validationErr) {
      setUploadError(validationErr);
      setSelectedFile(null);
      return;
    }
    setUploadError('');
    setSelectedFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer?.files?.[0];
    handleFilePicked(file);
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!patientId.trim()) {
      setUploadError('Please enter or select a Patient ID before uploading.');
      return;
    }

    const fileErr = validatePdfFile(selectedFile);
    if (fileErr) {
      setUploadError(fileErr);
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setUploadError('');

    try {
      const result = await uploadDocument({
        file: selectedFile,
        patientId,
        onUploadProgress: (evt) => {
          if (evt.total) {
            setUploadProgress(Math.round((evt.loaded / evt.total) * 100));
          }
        },
      });

      const docEntry = {
        document_id: result.document_id,
        patient_id: result.patient_id || patientId.trim(),
        file_name: selectedFile.name,
        file_size: selectedFile.size,
        total_chunks: result.total_chunks ?? 0,
        status: result.status === 'success' ? 'INGESTED' : result.status || 'INGESTED',
        uploaded_at: new Date().toISOString(),
      };

      addDocumentRecord(docEntry);
      addNotification({
        title: 'Document ingested',
        detail: `${docEntry.file_name} (${docEntry.total_chunks} chunks indexed)`,
      });
      toast.success(
        'Document processed',
        `${selectedFile.name} indexed (${docEntry.total_chunks} chunks).`
      );
      setSelectedFile(null);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      const msg = getErrorMessage(err, 'Document upload or processing failed.');
      setUploadError(msg);
      toast.error('Upload failed', msg);
    } finally {
      setUploading(false);
    }
  };

  const submitQuestion = async (promptText) => {
    const q = (promptText ?? question).trim();
    const pid = patientId.trim();

    if (!pid) {
      setAskError('Patient ID is required to query patient documents.');
      return;
    }
    if (!q) {
      setAskError('Please enter a question about the uploaded documents.');
      return;
    }

    setAskError('');
    setAsking(true);
    if (!promptText) setQuestion('');

    const userMsg = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: q,
      timestamp: new Date().toISOString(),
    };

    setChatsByPatient((prev) => ({
      ...prev,
      [pid]: [...(prev[pid] || []), userMsg],
    }));

    try {
      const res = await askDocumentQuestion({ patientId: pid, question: q });
      const assistantMsg = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: res?.answer || 'No response returned by the backend.',
        sources: Array.isArray(res?.sources) ? res.sources : [],
        timestamp: new Date().toISOString(),
      };

      setChatsByPatient((prev) => ({
        ...prev,
        [pid]: [...(prev[pid] || []), assistantMsg],
      }));
    } catch (err) {
      const msg = getErrorMessage(err, 'Document question answering failed.');
      setAskError(msg);
      toast.error('RAG query failed', msg);
      const errMsg = {
        id: `e-${Date.now()}`,
        role: 'error',
        content: msg,
        timestamp: new Date().toISOString(),
      };
      setChatsByPatient((prev) => ({
        ...prev,
        [pid]: [...(prev[pid] || []), errMsg],
      }));
    } finally {
      setAsking(false);
    }
  };

  const handleClearChat = () => {
    if (!patientId.trim()) return;
    setChatsByPatient((prev) => {
      const next = { ...prev };
      delete next[patientId.trim()];
      return next;
    });
  };

  return (
    <div className="space-y-6">
      {/* Patient Context Selector Bar */}
      <div className="rounded-lg border border-[#E2E8F0] bg-white p-5 shadow-card">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-5">
            <h2 className="text-base font-semibold text-[#0F172A]">
              Document Intelligence &amp; Clinical RAG
            </h2>
            <p className="mt-1 flex items-start gap-1.5 text-xs text-[#64748B]">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#0F766E]" />
              <span>
                PDFs are extracted, OCR-processed when scanned, chunked, and queried scoped to a{' '}
                <code className="font-mono text-[#0F172A]">patient_id</code>.
              </span>
            </p>
          </div>

          {patients.length > 0 && (
            <div className="lg:col-span-3">
              <FormField id="doc-patient-select" label="Registered Patient">
                <SelectInput
                  id="doc-patient-select"
                  value={patients.some((p) => p.patient_id === patientId) ? patientId : ''}
                  onChange={(e) => {
                    if (e.target.value) setPatientId(e.target.value);
                  }}
                  disabled={uploading || asking}
                >
                  <option value="">Select workspace patient…</option>
                  {patients.map((p) => (
                    <option key={p.patient_id} value={p.patient_id}>
                      {p.full_name} ({truncateId(p.patient_id, 6, 4)})
                    </option>
                  ))}
                </SelectInput>
              </FormField>
            </div>
          )}

          <div className={patients.length > 0 ? 'lg:col-span-4' : 'lg:col-span-7'}>
            <FormField
              id="doc-patient-id"
              label="Active Patient ID"
              required
            >
              <TextInput
                id="doc-patient-id"
                value={patientId}
                onChange={(e) => {
                  setPatientId(e.target.value);
                  if (uploadError) setUploadError('');
                  if (askError) setAskError('');
                }}
                placeholder="e.g. P003 or patient UUID"
                className="font-mono text-xs"
                disabled={uploading || asking}
              />
            </FormField>
          </div>
        </div>
      </div>

      {/* Main Two-Column Interface */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Upload & Document List */}
        <div className="space-y-6 lg:col-span-5">
          {/* Drag-and-Drop PDF Upload */}
          <form
            onSubmit={handleUploadSubmit}
            className="rounded-lg border border-[#E2E8F0] bg-white p-5 shadow-card space-y-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-[#0F172A]">Upload PDF Document</h3>
                <p className="text-xs text-[#64748B]">
                  Ingests via <code className="font-mono">POST /documents/upload</code>
                </p>
              </div>
              <StatusBadge status="LIVE" showDot={false} className="!text-[10px]" />
            </div>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                if (!uploading) setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => !uploading && fileInputRef.current?.click()}
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && !uploading) {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              role="button"
              tabIndex={0}
              aria-label="Upload PDF dropzone"
              className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors ${
                isDragging
                  ? 'border-[#0F766E] bg-[#CCFBF1]/40'
                  : selectedFile
                  ? 'border-teal-300 bg-[#F8FAFC]'
                  : 'border-[#E2E8F0] bg-[#F8FAFC] hover:border-[#0F766E]/60 hover:bg-slate-50'
              } ${uploading ? 'pointer-events-none opacity-60' : ''}`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                onChange={(e) => handleFilePicked(e.target.files?.[0])}
                className="sr-only"
                disabled={uploading}
              />

              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-[#CCFBF1] text-[#0F766E]">
                <UploadCloud className="h-5 w-5" />
              </div>

              {selectedFile ? (
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-[#0F172A]">{selectedFile.name}</p>
                  <p className="text-[11px] text-[#64748B]">
                    {formatFileSize(selectedFile.size)} · Ready to ingest
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-[#0F172A]">
                    Drag &amp; drop a PDF report here, or{' '}
                    <span className="text-[#0F766E] underline">browse</span>
                  </p>
                  <p className="text-[11px] text-[#64748B]">
                    Supports digital &amp; scanned clinical PDFs up to 50 MB
                  </p>
                </div>
              )}
            </div>

            {uploading && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-[#64748B]">
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-[#0F766E]" />
                    Running OCR, chunking &amp; vector indexing…
                  </span>
                  <span className="tabular-nums font-medium">{uploadProgress}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full bg-[#0F766E] transition-all duration-300"
                    style={{ width: `${Math.max(15, uploadProgress)}%` }}
                  />
                </div>
              </div>
            )}

            {uploadError && (
              <div
                role="alert"
                className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-[#DC2626]"
              >
                {uploadError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2">
              {selectedFile && !uploading && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setSelectedFile(null);
                    setUploadError('');
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                >
                  Clear
                </Button>
              )}
              <Button
                type="submit"
                icon={FileUp}
                loading={uploading}
                disabled={!selectedFile || !patientId.trim()}
                className="w-full sm:w-auto"
              >
                {uploading ? 'Processing PDF…' : 'Upload & Index PDF'}
              </Button>
            </div>
          </form>

          {/* Uploaded Documents List */}
          <section className="rounded-lg border border-[#E2E8F0] bg-white p-5 shadow-card">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-[#0F172A]">Uploaded Documents</h3>
                <p className="text-xs text-[#64748B]">
                  {filteredDocuments.length} ingested document
                  {filteredDocuments.length === 1 ? '' : 's'} in workspace
                </p>
              </div>
            </div>

            {filteredDocuments.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No uploaded documents yet"
                description="Upload a PDF above to extract text, index vector embeddings, and enable Q&A."
                className="py-8"
              />
            ) : (
              <div className="max-h-80 divide-y divide-[#E2E8F0] overflow-y-auto">
                {filteredDocuments.map((doc) => {
                  const isActive = doc.patient_id === patientId.trim();
                  return (
                    <button
                      key={doc.document_id}
                      type="button"
                      onClick={() => setPatientId(doc.patient_id)}
                      className={`flex w-full items-start justify-between gap-3 py-3 px-2 text-left transition-colors rounded-md ${
                        isActive ? 'bg-[#CCFBF1]/35' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-100 text-[#0F766E]">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-[#0F172A]">
                            {doc.file_name}
                          </p>
                          <p className="mt-0.5 truncate font-mono text-[11px] text-[#64748B]">
                            Patient: {patientNameMap[doc.patient_id] || truncateId(doc.patient_id, 8, 4)}
                          </p>
                          <p className="mt-0.5 text-[11px] text-[#64748B]">
                            {doc.total_chunks} chunks · {formatDateTime(doc.uploaded_at)}
                          </p>
                        </div>
                      </div>
                      <StatusBadge status={doc.status || 'INGESTED'} className="shrink-0" />
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Chat-style RAG Question & Answer Panel */}
        <section className="flex h-[650px] flex-col rounded-lg border border-[#E2E8F0] bg-white shadow-card lg:col-span-7">
          {/* Panel Header */}
          <div className="flex items-center justify-between gap-3 border-b border-[#E2E8F0] px-5 py-4">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#0F172A] text-[#2DD4BF]">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-[#0F172A]">
                  Clinical Document Q&amp;A Assistant
                </h3>
                <p className="truncate text-xs text-[#64748B]">
                  {patientId.trim()
                    ? `Context scoped to Patient ${
                        patientNameMap[patientId.trim()] || patientId.trim()
                      }`
                    : 'Enter a Patient ID above to ask questions'}
                </p>
              </div>
            </div>

            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                icon={Trash2}
                onClick={handleClearChat}
                disabled={asking}
              >
                Clear chat
              </Button>
            )}
          </div>

          {/* Chat Thread */}
          <div className="flex-1 overflow-y-auto bg-[#F8FAFC]/60 p-5 space-y-4">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center px-4">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg border border-[#E2E8F0] bg-white text-[#0F766E] shadow-card">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <h4 className="text-sm font-semibold text-[#0F172A]">
                  Ask questions about uploaded patient PDFs
                </h4>
                <p className="mt-1 max-w-md text-xs leading-relaxed text-[#64748B]">
                  Questions are answered strictly from retrieved document chunks via{' '}
                  <code className="font-mono text-[#0F172A]">POST /documents/ask</code> with
                  source chunk citations.
                </p>

                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  {SUGGESTED_QUESTIONS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      disabled={!patientId.trim() || asking}
                      onClick={() => submitQuestion(prompt)}
                      className="rounded-full border border-[#E2E8F0] bg-white px-3 py-1.5 text-xs font-medium text-[#1E293B] transition-colors hover:border-[#0F766E] hover:bg-[#CCFBF1]/40 hover:text-[#0F766E] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg) => {
                  if (msg.role === 'user') {
                    return (
                      <div key={msg.id} className="flex items-start justify-end gap-2.5">
                        <div className="max-w-[82%] rounded-lg bg-[#0F766E] px-4 py-2.5 text-sm text-white shadow-card">
                          <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                        </div>
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#0F172A] text-white">
                          <User className="h-4 w-4" />
                        </div>
                      </div>
                    );
                  }

                  if (msg.role === 'error') {
                    return (
                      <div key={msg.id} className="flex items-start gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-red-100 text-[#DC2626]">
                          <Bot className="h-4 w-4" />
                        </div>
                        <div className="max-w-[85%] rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-[#DC2626]">
                          {msg.content}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={msg.id} className="flex items-start gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#CCFBF1] text-[#0F766E]">
                        <Bot className="h-4 w-4" />
                      </div>
                      <div className="max-w-[85%] space-y-2.5 rounded-lg border border-[#E2E8F0] bg-white px-4 py-3 shadow-card">
                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#1E293B]">
                          {msg.content}
                        </p>

                        {msg.sources && msg.sources.length > 0 && (
                          <div className="border-t border-[#E2E8F0] pt-2.5">
                            <p className="mb-1.5 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                              <CheckCircle2 className="h-3 w-3 text-[#16A34A]" />
                              Retrieved Sources ({msg.sources.length})
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {msg.sources.map((src, idx) => (
                                <span
                                  key={`${src.document_id}-${src.chunk_index}-${idx}`}
                                  title={`Document ${src.document_id} · Cosine distance: ${src.distance}`}
                                  className="inline-flex items-center gap-1.5 rounded border border-[#E2E8F0] bg-[#F8FAFC] px-2 py-0.5 font-mono text-[11px] text-[#1E293B]"
                                >
                                  <span>Doc {truncateId(src.document_id, 6, 4)}</span>
                                  <span className="text-slate-400">·</span>
                                  <span>Chunk #{src.chunk_index}</span>
                                  {src.distance !== undefined && src.distance !== null && (
                                    <>
                                      <span className="text-slate-400">·</span>
                                      <span className="text-[#0F766E]">
                                        {formatDistanceScore(src.distance)}
                                      </span>
                                    </>
                                  )}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {asking && (
                  <div className="flex items-start gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#CCFBF1] text-[#0F766E]">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className="flex items-center gap-2 rounded-lg border border-[#E2E8F0] bg-white px-4 py-3 text-xs text-[#64748B] shadow-card">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-[#0F766E]" />
                      Retrieving document chunks and generating grounded answer…
                    </div>
                  </div>
                )}

                <div ref={chatEndRef} />
              </>
            )}
          </div>

          {/* Question Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submitQuestion();
            }}
            className="border-t border-[#E2E8F0] bg-white p-4 rounded-b-lg space-y-2"
          >
            {askError && (
              <p role="alert" className="text-xs text-[#DC2626]">
                {askError}
              </p>
            )}
            <div className="flex items-center gap-2">
              <TextInput
                value={question}
                onChange={(e) => {
                  setQuestion(e.target.value);
                  if (askError) setAskError('');
                }}
                placeholder={
                  patientId.trim()
                    ? 'Ask a question about this patient’s documents…'
                    : 'Enter a Patient ID above first…'
                }
                aria-label="Ask a question about uploaded documents"
                disabled={asking}
                className="flex-1"
              />
              <Button
                type="submit"
                icon={Send}
                loading={asking}
                disabled={!patientId.trim() || !question.trim()}
              >
                Ask AI
              </Button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}

export default DocumentsPage;

