import { createRoute } from '@tanstack/react-router';
import { rootRoute } from './__root';
import { useMedplum, useMedplumProfile } from '@medplum/react';
import { useEffect, useState } from 'react';
import {
  Search,
  FileText,
  Download,
  Eye,
  X,
  Calendar,
  AlertCircle,
  FileDigit,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { DocumentReference } from '@medplum/fhirtypes';

const CATEGORIES = [
  { label: 'All Records', code: 'all' },
  { label: 'Lab Result', code: '11502-2' },
  { label: 'Prescription', code: '57833-6' },
  { label: 'Imaging Report', code: '18748-4' },
  { label: 'Diagnosis / Note', code: '11488-4' },
  { label: 'Vaccination', code: '11369-6' },
  { label: 'General', code: '34117-2' },
];

function DocumentsPage() {
  const medplum = useMedplum();
  const currentProfile = useMedplumProfile();
  const [documents, setDocuments] = useState<DocumentReference[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDoc, setSelectedDoc] = useState<DocumentReference | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState(false);

  const loadDocuments = async () => {
    try {
      if (currentProfile) {
        const docBundle = await medplum.search(
          'DocumentReference',
          `subject=${currentProfile.resourceType}/${currentProfile.id}`
        );
        if (docBundle?.entry) {
          const docs = docBundle.entry
            .map((e: any) => e.resource as DocumentReference)
            .filter((r: any): r is DocumentReference => !!r);
          setDocuments(docs);
        }
      }
    } catch (err) {
      console.error('Error fetching documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [medplum, currentProfile]);

  /**
   * Returns an authenticated pre-signed URL for a Binary resource.
   * Uses the FHIR Binary endpoint which redirects to a pre-signed S3 URL.
   * We get the redirect URL from Medplum's token endpoint instead of
   * fetching the binary directly (which causes CORS issues with storage.medplum.com).
   */
  

  const handleDownload = async (doc: DocumentReference) => {
  const attachment = doc.content?.[0]?.attachment;
  if (!attachment?.url) return;

  try {
    const rawUrl = attachment.url;
    const token = await medplum.getAccessToken();

// Fetch from Medplum API — this redirects to S3
const apiPath = rawUrl.startsWith('http')
  ? rawUrl.replace('https://api.medplum.com', '')
  : `/fhir/R4/${rawUrl}`;

const medplumRes = await fetch(`/api${apiPath}`, {
  headers: { Authorization: `Bearer ${token}` },
  redirect: 'manual',
});

// Follow the S3 redirect through our proxy
const location = medplumRes.headers.get('location');
const fetchUrl = location
  ? location.replace('https://storage.medplum.com', '/storage-proxy')
  : `/api${apiPath}`;

const res = await fetch(fetchUrl);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    const objectUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = attachment.title || 'medical-record';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(objectUrl);
  } catch (err) {
    console.error('Download failed:', err);
    alert('Failed to download document. Please try again.');
  }
};

const handleViewPreview = async (doc: DocumentReference) => {
  const attachment = doc.content?.[0]?.attachment;
  if (!attachment?.url) return;

  setSelectedDoc(doc);
  setPreviewLoading(true);
  setPreviewUrl(null);
  setPreviewError(false);

  try {
    const rawUrl = attachment.url;
    const token = await medplum.getAccessToken();

// Fetch from Medplum API — this redirects to S3
const apiPath = rawUrl.startsWith('http')
  ? rawUrl.replace('https://api.medplum.com', '')
  : `/fhir/R4/${rawUrl}`;

const medplumRes = await fetch(`/api${apiPath}`, {
  headers: { Authorization: `Bearer ${token}` },
  redirect: 'manual',
});

// Follow the S3 redirect through our proxy
const location = medplumRes.headers.get('location');
const fetchUrl = location
  ? location.replace('https://storage.medplum.com', '/storage-proxy')
  : `/api${apiPath}`;

const res = await fetch(fetchUrl);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    setPreviewUrl(window.URL.createObjectURL(blob));
  } catch (err) {
    console.error('Preview failed:', err);
    setPreviewError(true);
  } finally {
    setPreviewLoading(false);
  }
};

  const closePreviewModal = () => {
    setSelectedDoc(null);
    if (previewUrl) {
      window.URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setPreviewError(false);
  };

  const filteredDocuments = documents.filter((doc) => {
    if (selectedCategory !== 'all') {
      const loincCode = doc.category?.[0]?.coding?.[0]?.code;
      if (loincCode !== selectedCategory) return false;
    }
    if (searchQuery.trim()) {
      const title = doc.content?.[0]?.attachment?.title || '';
      const description = doc.description || '';
      const catText = doc.category?.[0]?.text || '';
      const query = searchQuery.toLowerCase();
      return (
        title.toLowerCase().includes(query) ||
        description.toLowerCase().includes(query) ||
        catText.toLowerCase().includes(query)
      );
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-teal-400 font-display animate-pulse">Loading medical records...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-3xl font-extrabold font-display tracking-tight text-slate-100">Document Library</h2>
        <p className="text-slate-400 text-sm mt-1">Manage and access your medical history documents.</p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by report name, provider or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/60 border border-slate-800 hover:border-slate-700 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 rounded-2xl py-3 pl-11 pr-4 text-sm font-medium text-slate-200 outline-none transition-all placeholder:text-slate-600"
          />
        </div>
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="text-xs text-slate-500 hover:text-slate-300 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 self-start md:self-auto cursor-pointer"
          >
            Clear Search
          </button>
        )}
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.code}
            onClick={() => setSelectedCategory(cat.code)}
            id={`tab_cat_${cat.code.replace('-', '_')}`}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap border transition-all cursor-pointer ${
              selectedCategory === cat.code
                ? 'bg-teal-500 text-slate-950 border-teal-500'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-300'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Document Grid */}
      {filteredDocuments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
          <AlertCircle className="w-10 h-10 text-slate-700" />
          <p className="text-slate-400 font-semibold text-sm">No documents found</p>
          <p className="text-slate-600 text-xs max-w-xs">
            {searchQuery ? 'Try a different search term.' : 'Upload your first health document to get started.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map((doc) => {
            const docTitle = doc.content?.[0]?.attachment?.title || 'Untitled Document';
            const catName = doc.category?.[0]?.text || 'General';
            const docDate = doc.date ? new Date(doc.date).toLocaleDateString() : 'Unknown date';

            return (
              <div
                key={doc.id}
                className="group glass-panel p-5 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all duration-300 flex flex-col justify-between gap-4"
              >
                <div className="flex flex-col gap-4">
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 group-hover:bg-teal-500 group-hover:text-slate-950 transition-all duration-300">
                      <FileText className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800 font-bold uppercase truncate max-w-[120px]">
                      {catName}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-slate-200 group-hover:text-slate-100 transition-colors line-clamp-1">
                      {docTitle}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 min-h-[2rem]">
                      {doc.description || 'No additional notes provided.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-800/60">
                  <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{docDate}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleViewPreview(doc)}
                      id={`btn_preview_${doc.id}`}
                      title="Preview Document"
                      className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-teal-400 hover:border-slate-700 transition-all cursor-pointer"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDownload(doc)}
                      id={`btn_download_${doc.id}`}
                      title="Download File"
                      className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-teal-400 hover:border-slate-700 transition-all cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Preview Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-200">
          <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-indigo-400 font-bold border border-slate-800/80 uppercase">
                  {selectedDoc.category?.[0]?.text || 'Medical Document'}
                </span>
                <h3 className="font-display font-bold text-lg text-slate-100 mt-2">
                  {selectedDoc.content?.[0]?.attachment?.title || 'Document View'}
                </h3>
              </div>
              <button
                onClick={closePreviewModal}
                className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 flex flex-col md:flex-row gap-6">
              {/* Preview Area */}
              <div className="flex-1 min-h-[300px] bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden flex items-center justify-center p-4">
                {previewLoading ? (
                  <div className="flex flex-col items-center gap-2 text-slate-500">
                    <Loader2 className="w-8 h-8 animate-spin text-teal-400" />
                    <span className="text-xs font-semibold">Loading document...</span>
                  </div>
                ) : previewError ? (
                  <div className="flex flex-col items-center gap-3 text-center">
                    <AlertCircle className="w-10 h-10 text-rose-400/60" />
                    <p className="text-slate-400 text-sm font-semibold">Failed to load preview</p>
                    <button
                      onClick={() => handleViewPreview(selectedDoc)}
                      className="text-xs text-teal-400 hover:text-teal-300 underline cursor-pointer"
                    >
                      Try again
                    </button>
                  </div>
                ) : previewUrl ? (
                  selectedDoc.content?.[0]?.attachment?.contentType?.startsWith('image/') ? (
                    <img
                      src={previewUrl}
                      alt="Medical Record Preview"
                      className="max-h-[50vh] object-contain rounded-lg"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-4 text-center">
                      <FileDigit className="w-16 h-16 text-indigo-400/60" />
                      <div>
                        <p className="font-bold text-slate-300 text-sm">PDF ready</p>
                        <p className="text-xs text-slate-500 mt-1 max-w-xs">
                          Open in a new tab or download to view this document.
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href={previewUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold rounded-xl transition-all"
                        >
                          <span>Open in New Tab</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <button
                          onClick={() => handleDownload(selectedDoc)}
                          className="flex items-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold rounded-xl transition-all cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download</span>
                        </button>
                      </div>
                    </div>
                  )
                ) : null}
              </div>

              {/* Sidebar */}
              <div className="w-full md:w-80 flex flex-col gap-6 shrink-0">
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Document Details</h4>
                  <div className="mt-3 flex flex-col gap-2.5 text-xs text-slate-300 bg-slate-950/40 p-4 rounded-xl border border-slate-800/80">
                    <div>
                      <span className="text-slate-500">FHIR Status:</span>
                      <span className="ml-1 text-emerald-400 font-semibold uppercase">{selectedDoc.status}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Category Code:</span>
                      <span className="ml-1 font-mono text-slate-400">
                        {selectedDoc.category?.[0]?.coding?.[0]?.code || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Content Type:</span>
                      <span className="ml-1 text-slate-400">
                        {selectedDoc.content?.[0]?.attachment?.contentType || 'Unknown'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Document Date:</span>
                      <span className="ml-1 text-slate-400">
                        {selectedDoc.date ? new Date(selectedDoc.date).toLocaleString() : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Patient Notes</h4>
                  <div className="mt-2 text-xs text-slate-400 leading-relaxed bg-slate-950/40 p-4 rounded-xl border border-slate-800/80 min-h-[80px]">
                    {selectedDoc.description || 'No additional notes provided for this health entry.'}
                  </div>
                </div>

                <button
                  onClick={() => handleDownload(selectedDoc)}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-teal-500 hover:bg-teal-400 text-slate-950 text-sm font-bold rounded-xl transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Original File</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const documentsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/documents',
  component: DocumentsPage,
});

export { documentsRoute };