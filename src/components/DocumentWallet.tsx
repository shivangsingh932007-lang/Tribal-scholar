import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { WalletDocument, DocumentType, DOCUMENT_TYPE_LABELS } from '../types';
import { FolderLock, Upload, Trash2, Eye, FileText, CheckCircle2, ShieldCheck, X, LogIn, GraduationCap, Award } from 'lucide-react';

interface DocumentWalletProps {
  onOpenAuth?: (tab?: 'demo' | 'signin' | 'register') => void;
}

export const DocumentWallet: React.FC<DocumentWalletProps> = ({ onOpenAuth }) => {
  const { apiFetch, user } = useAuth();
  const { t, lang } = useLanguage();

  const [documents, setDocuments] = useState<WalletDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState<DocumentType>('MARKSHEET_10TH');
  const [activeCategory, setActiveCategory] = useState<'ALL' | 'MARKSHEETS' | 'CASTE_INCOME' | 'INSTITUTE'>('ALL');
  const [previewDoc, setPreviewDoc] = useState<WalletDocument | null>(null);

  const fetchDocs = async () => {
    if (!user) {
      setLoading(false);
      setDocuments([]);
      return;
    }
    try {
      setLoading(true);
      const data = await apiFetch('/api/documents');
      if (Array.isArray(data)) setDocuments(data);
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, [user]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const reader = new FileReader();
      reader.onload = async () => {
        const fileDataUrl = reader.result as string;
        await apiFetch('/api/documents', {
          method: 'POST',
          body: JSON.stringify({
            docName: file.name,
            docType: selectedDocType,
            fileDataUrl,
            mimeType: file.type
          })
        });
        fetchDocs();
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId: string) => {
    if (!confirm('Are you sure you want to remove this document?')) return;
    try {
      await apiFetch(`/api/documents/${docId}`, { method: 'DELETE' });
      setDocuments(documents.filter((d) => d.id !== docId));
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  if (!user) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm text-center max-w-xl mx-auto my-8 space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mx-auto shadow-inner">
          <FolderLock className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">{t.walletTitle}</h2>
          <p className="text-xs text-slate-600 mt-2 max-w-md mx-auto leading-relaxed">
            {'Please sign in or select a demo persona to view and manage your verified certificates and DigiLocker documents.'}
          </p>
        </div>
        {onOpenAuth && (
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => onOpenAuth('signin')}
              className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow transition flex items-center gap-1.5"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{'Sign In'}</span>
            </button>
            <button
              onClick={() => onOpenAuth('demo')}
              className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-xs font-bold shadow transition"
            >
              {'1-Click Demo'}
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Wallet Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center flex-shrink-0">
            <FolderLock className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-slate-900">{t.walletTitle}</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                DigiLocker Integrated
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
              {t.walletSubtitle}
            </p>
          </div>
        </div>

        {/* Upload Action */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedDocType}
            onChange={(e) => setSelectedDocType(e.target.value as DocumentType)}
            className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
          >
            <option value="MARKSHEET_10TH">10th Class Marksheet (Secondary)</option>
            <option value="MARKSHEET_12TH">12th Class Marksheet (Higher Secondary)</option>
            <option value="MARKSHEET">Other / Graduation Marksheet</option>
            <option value="ST_CERTIFICATE">ST Certificate</option>
            <option value="INCOME_CERTIFICATE">Income Certificate</option>
            <option value="BONAFIDE_CERTIFICATE">Bonafide Certificate</option>
            <option value="BANK_PASSBOOK">Bank Passbook</option>
            <option value="DOMICILE_CERTIFICATE">Domicile Certificate</option>
          </select>

          <label className="cursor-pointer px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5 flex-shrink-0">
            <Upload className="w-4 h-4" />
            <span>{uploading ? t.loading : t.uploadDocument}</span>
            <input
              type="file"
              onChange={handleFileUpload}
              className="hidden"
              accept=".pdf,.png,.jpg,.jpeg"
              disabled={uploading}
            />
          </label>
        </div>
      </div>

      {/* Quick Marksheets & Certificate Action Bar */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-blue-700" />
            <h3 className="text-xs font-bold text-blue-950 uppercase tracking-wide">
              Quick Marksheet & Certificate Upload
            </h3>
          </div>
          <span className="text-[11px] text-blue-800">
            Keep separate 10th and 12th marksheet PDFs ready for automated verification
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* Quick 10th Marksheet */}
          <label className="cursor-pointer bg-white hover:bg-blue-50 border border-blue-300 rounded-xl p-2.5 flex items-center justify-between shadow-xs transition group">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 font-extrabold text-[11px] flex items-center justify-center group-hover:scale-105 transition">
                10th
              </span>
              <div className="text-left">
                <span className="text-xs font-bold text-slate-900 block leading-tight">10th Marksheet</span>
                <span className="text-[10px] text-slate-500">Secondary Board</span>
              </div>
            </div>
            <Upload className="w-3.5 h-3.5 text-blue-600" />
            <input
              type="file"
              className="hidden"
              accept=".pdf,.png,.jpg,.jpeg"
              disabled={uploading}
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                setSelectedDocType('MARKSHEET_10TH');
                setUploading(true);
                const reader = new FileReader();
                reader.onload = async () => {
                  await apiFetch('/api/documents', {
                    method: 'POST',
                    body: JSON.stringify({
                      docName: f.name || 'Class_10_Marksheet.pdf',
                      docType: 'MARKSHEET_10TH',
                      fileDataUrl: reader.result as string,
                      mimeType: f.type
                    })
                  });
                  fetchDocs();
                  setUploading(false);
                };
                reader.readAsDataURL(f);
              }}
            />
          </label>

          {/* Quick 12th Marksheet */}
          <label className="cursor-pointer bg-white hover:bg-indigo-50 border border-indigo-300 rounded-xl p-2.5 flex items-center justify-between shadow-xs transition group">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-800 font-extrabold text-[11px] flex items-center justify-center group-hover:scale-105 transition">
                12th
              </span>
              <div className="text-left">
                <span className="text-xs font-bold text-slate-900 block leading-tight">12th Marksheet</span>
                <span className="text-[10px] text-slate-500">Higher Secondary</span>
              </div>
            </div>
            <Upload className="w-3.5 h-3.5 text-indigo-600" />
            <input
              type="file"
              className="hidden"
              accept=".pdf,.png,.jpg,.jpeg"
              disabled={uploading}
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                setSelectedDocType('MARKSHEET_12TH');
                setUploading(true);
                const reader = new FileReader();
                reader.onload = async () => {
                  await apiFetch('/api/documents', {
                    method: 'POST',
                    body: JSON.stringify({
                      docName: f.name || 'Class_12_Marksheet.pdf',
                      docType: 'MARKSHEET_12TH',
                      fileDataUrl: reader.result as string,
                      mimeType: f.type
                    })
                  });
                  fetchDocs();
                  setUploading(false);
                };
                reader.readAsDataURL(f);
              }}
            />
          </label>

          {/* Quick ST Caste Certificate */}
          <label className="cursor-pointer bg-white hover:bg-emerald-50 border border-emerald-300 rounded-xl p-2.5 flex items-center justify-between shadow-xs transition group">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-extrabold text-[11px] flex items-center justify-center group-hover:scale-105 transition">
                ST
              </span>
              <div className="text-left">
                <span className="text-xs font-bold text-slate-900 block leading-tight">ST Certificate</span>
                <span className="text-[10px] text-slate-500">Revenue Registry</span>
              </div>
            </div>
            <Upload className="w-3.5 h-3.5 text-emerald-600" />
            <input
              type="file"
              className="hidden"
              accept=".pdf,.png,.jpg,.jpeg"
              disabled={uploading}
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                setSelectedDocType('ST_CERTIFICATE');
                setUploading(true);
                const reader = new FileReader();
                reader.onload = async () => {
                  await apiFetch('/api/documents', {
                    method: 'POST',
                    body: JSON.stringify({
                      docName: f.name || 'ST_Certificate.pdf',
                      docType: 'ST_CERTIFICATE',
                      fileDataUrl: reader.result as string,
                      mimeType: f.type
                    })
                  });
                  fetchDocs();
                  setUploading(false);
                };
                reader.readAsDataURL(f);
              }}
            />
          </label>

          {/* Quick Income Certificate */}
          <label className="cursor-pointer bg-white hover:bg-amber-50 border border-amber-300 rounded-xl p-2.5 flex items-center justify-between shadow-xs transition group">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 font-extrabold text-[11px] flex items-center justify-center group-hover:scale-105 transition">
                ₹
              </span>
              <div className="text-left">
                <span className="text-xs font-bold text-slate-900 block leading-tight">Income Cert</span>
                <span className="text-[10px] text-slate-500">Current FY Valid</span>
              </div>
            </div>
            <Upload className="w-3.5 h-3.5 text-amber-600" />
            <input
              type="file"
              className="hidden"
              accept=".pdf,.png,.jpg,.jpeg"
              disabled={uploading}
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                setSelectedDocType('INCOME_CERTIFICATE');
                setUploading(true);
                const reader = new FileReader();
                reader.onload = async () => {
                  await apiFetch('/api/documents', {
                    method: 'POST',
                    body: JSON.stringify({
                      docName: f.name || 'Income_Certificate.pdf',
                      docType: 'INCOME_CERTIFICATE',
                      fileDataUrl: reader.result as string,
                      mimeType: f.type
                    })
                  });
                  fetchDocs();
                  setUploading(false);
                };
                reader.readAsDataURL(f);
              }}
            />
          </label>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveCategory('ALL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${
            activeCategory === 'ALL'
              ? 'bg-blue-700 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All Documents ({documents.length})
        </button>
        <button
          onClick={() => setActiveCategory('MARKSHEETS')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
            activeCategory === 'MARKSHEETS'
              ? 'bg-blue-700 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5" />
          <span>Marksheets (10th & 12th)</span>
          <span className="text-[10px] px-1.5 py-0.2 bg-white/20 rounded-full font-mono">
            {documents.filter((d) => ['MARKSHEET_10TH', 'MARKSHEET_12TH', 'MARKSHEET'].includes(d.docType)).length}
          </span>
        </button>
        <button
          onClick={() => setActiveCategory('CASTE_INCOME')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${
            activeCategory === 'CASTE_INCOME'
              ? 'bg-blue-700 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          ST & Income Certificates
        </button>
        <button
          onClick={() => setActiveCategory('INSTITUTE')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${
            activeCategory === 'INSTITUTE'
              ? 'bg-blue-700 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Bonafide & Bank Passbook
        </button>
      </div>

      {/* Documents Grid */}
      {(() => {
        const filteredDocs = documents.filter((doc) => {
          if (activeCategory === 'MARKSHEETS') return ['MARKSHEET_10TH', 'MARKSHEET_12TH', 'MARKSHEET'].includes(doc.docType);
          if (activeCategory === 'CASTE_INCOME') return ['ST_CERTIFICATE', 'INCOME_CERTIFICATE', 'DOMICILE_CERTIFICATE', 'AADHAAR_PROOF'].includes(doc.docType);
          if (activeCategory === 'INSTITUTE') return ['BONAFIDE_CERTIFICATE', 'BANK_PASSBOOK', 'ADMISSION_PROOF', 'INSTITUTION_CERTIFICATE'].includes(doc.docType);
          return true;
        });

        if (loading) {
          return (
            <div className="p-12 text-center text-slate-500 text-xs">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              {t.loading}
            </div>
          );
        }

        if (filteredDocs.length === 0) {
          return (
            <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-slate-300">
              <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-700">
                {activeCategory === 'MARKSHEETS' ? 'No marksheets found' : 'No documents in this view'}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {activeCategory === 'MARKSHEETS'
                  ? 'Use the Quick Upload buttons above to upload your Class 10th or 12th marksheet.'
                  : 'Uploaded and DigiLocker-pulled documents will appear here automatically.'}
              </p>
            </div>
          );
        }

        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocs.map((doc) => {
              const is10th = doc.docType === 'MARKSHEET_10TH';
              const is12th = doc.docType === 'MARKSHEET_12TH';
              const isMarksheet = is10th || is12th || doc.docType === 'MARKSHEET';
              const label = DOCUMENT_TYPE_LABELS[doc.docType]?.en || doc.docType.replace('_', ' ');

              return (
                <div
                  key={doc.id}
                  className={`bg-white rounded-xl p-4 border shadow-sm transition flex flex-col justify-between ${
                    is10th
                      ? 'border-blue-300 hover:border-blue-500'
                      : is12th
                      ? 'border-indigo-300 hover:border-indigo-500'
                      : 'border-slate-200 hover:border-blue-400'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`p-2 rounded-lg ${
                          is10th
                            ? 'bg-blue-100 text-blue-700 font-extrabold'
                            : is12th
                            ? 'bg-indigo-100 text-indigo-700 font-extrabold'
                            : 'bg-blue-50 text-blue-700'
                        }`}>
                          {isMarksheet ? <GraduationCap className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                        </span>
                        <div>
                          <h4 className="font-bold text-xs text-slate-900 truncate max-w-[170px]" title={doc.docName}>
                            {doc.docName}
                          </h4>
                          <span className={`text-[10px] font-semibold block ${
                            is10th ? 'text-blue-700' : is12th ? 'text-indigo-700' : 'text-slate-500'
                          }`}>
                            {label}
                          </span>
                        </div>
                      </div>

                      {Boolean(doc.digilockerVerified) ? (
                        <span className="flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          DigiLocker
                        </span>
                      ) : (
                        <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          Uploaded
                        </span>
                      )}
                    </div>

                    {doc.certNumber && (
                      <div className="mt-3 p-2 bg-slate-50 rounded text-[11px] font-mono text-slate-700 flex justify-between">
                        <span className="text-slate-500">Cert / Roll No:</span>
                        <strong>{doc.certNumber}</strong>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[10px] text-slate-400 font-mono">
                      {(doc.fileSize / 1024).toFixed(0)} KB • {new Date(doc.uploadedAt).toLocaleDateString()}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPreviewDoc(doc)}
                        className="p-1.5 text-blue-700 hover:bg-blue-50 rounded transition"
                        title="View Document"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900">{previewDoc.docName}</h3>
                <span className="text-xs text-slate-500">{previewDoc.docType}</span>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="p-1 rounded hover:bg-slate-100 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="h-80 bg-slate-50 rounded-xl border border-slate-200 flex flex-col items-center justify-center p-6 text-center">
              <FileText className="w-16 h-16 text-blue-600 mb-3" />
              <p className="font-bold text-sm text-slate-800">{previewDoc.docName}</p>
              <p className="text-xs text-slate-500 mt-1 font-mono">
                URI: {previewDoc.fileUri || 'Mock DigiLocker Secure Vault Asset'}
              </p>
              {Boolean(previewDoc.digilockerVerified) && (
                <div className="mt-3 px-3 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full text-xs font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  DigiLocker Cryptographically Verified via MoTA Mock Gateway
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
