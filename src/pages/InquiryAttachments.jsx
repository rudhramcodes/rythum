import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FileText, Image, Music, Paperclip, Download, Trash2,
  UploadCloud, Check, AlertCircle, Filter, Loader2, X
} from 'lucide-react';
import { adminRequest, getAttachmentDownloadUrl } from './adminApi';
import Dropdown from '../components/booking/Dropdown';
import Folder from '../components/Folder';

const LABELS = ['Contract', 'Tech Rider', 'Stage Plot', 'Event Brief', 'Schedule', 'Document'];

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  if (bytes < k * k) return `${Math.round(bytes / k)} KB`;
  return `${(bytes / (k * k)).toFixed(1)} MB`;
}

function getFileIcon(mimeType = '', name = '') {
  const ext = name.split('.').pop()?.toLowerCase();
  if (mimeType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp', 'svg'].includes(ext)) {
    return <Image size={20} aria-hidden="true" />;
  }
  if (mimeType.startsWith('audio/') || ['mp3', 'wav', 'aac'].includes(ext)) {
    return <Music size={20} aria-hidden="true" />;
  }
  if (mimeType === 'application/pdf' || ext === 'pdf') {
    return <FileText size={20} aria-hidden="true" />;
  }
  return <Paperclip size={20} aria-hidden="true" />;
}

function uploadWithProgress(audience, reference, formData, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const base = (import.meta.env?.VITE_API_URL || '').replace(/\/$/, '');
    xhr.open('POST', `${base}/api/${audience}/inquiries/${encodeURIComponent(reference)}/attachments`);
    xhr.withCredentials = true;

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress({ loaded: event.loaded, total: event.total, percent });
      }
    };

    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(data);
        } else {
          const err = new Error(data?.error?.message || data?.message || 'Upload failed.');
          err.status = xhr.status;
          reject(err);
        }
      } catch {
        reject(new Error('Server returned an unexpected response.'));
      }
    };

    xhr.onerror = () => reject(new Error('Network error during file upload. Check your connection.'));
    xhr.send(formData);
  });
}

export default function InquiryAttachments({ reference, audience = 'admin', onExpired, realtime }) {
  const [items, setItems] = useState([]);
  const [preview, setPreview] = useState(null);
  const previewDialog = useRef(null);
  const fileList = useRef(null);
  useEffect(() => {
    if (!preview) return;
    const dialog = previewDialog.current;
    const previousFocus = document.activeElement;
    const overflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    return () => { dialog.close(); document.body.style.overflow = overflow; previousFocus?.focus(); };
  }, [preview]);
  const [loading, setLoading] = useState(true);
  const [uploadTask, setUploadTask] = useState(null); // { file, label, percent, loaded, total, status: 'uploading' | 'processing' | 'done' }
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [label, setLabel] = useState('Contract');
  const [isDragging, setIsDragging] = useState(false);
  const [filterCategory, setFilterCategory] = useState('All');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const fileInputRef = useRef(null);
  const dragCounter = useRef(0);

  const loadAttachments = useCallback(async (signal) => {
    try {
      const data = await adminRequest(`${audience}/inquiries/${encodeURIComponent(reference)}/attachments`, { signal });
      setItems(data.attachments || []);
      setError('');
    } catch (err) {
      if (signal?.aborted) return;
      if (err.status === 401) onExpired?.();
      else setError(err.message || 'Unable to load attachments.');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [audience, reference, onExpired]);

  useEffect(() => {
    const controller = new AbortController();
    loadAttachments(controller.signal);
    return () => controller.abort();
  }, [loadAttachments]);

  // Realtime updates
  useEffect(() => {
    if (!realtime?.event) return;
    if (realtime.event.kind === 'attachment' && (!realtime.event.reference || realtime.event.reference === reference)) {
      loadAttachments();
    }
  }, [realtime?.sequence, realtime?.event, reference, loadAttachments]);

  async function handleFileUpload(file) {
    if (!file || uploadTask) return;

    if (file.size > 20 * 1024 * 1024) {
      setError('File exceeds 20 MB size limit.');
      return;
    }

    setError('');
    setNotice('');

    const currentTask = {
      name: file.name,
      size: file.size,
      mimeType: file.mimetype || file.type,
      label,
      percent: 0,
      loaded: 0,
      total: file.size,
      status: 'uploading',
    };
    setUploadTask(currentTask);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('label', label);

    try {
      const data = await uploadWithProgress(audience, reference, formData, ({ loaded, total, percent }) => {
        setUploadTask(prev => prev ? {
          ...prev,
          loaded,
          total,
          percent,
          status: percent >= 100 ? 'processing' : 'uploading',
        } : null);
      });

      if (data.attachment) {
        setUploadTask(prev => prev ? { ...prev, percent: 100, status: 'done' } : null);
        setTimeout(() => {
          setItems(prev => [data.attachment, ...prev.filter(item => item._id !== data.attachment._id)]);
          setUploadTask(null);
          setNotice(`Uploaded “${file.name}”`);
          setTimeout(() => setNotice(''), 3500);
        }, 700);
      }
    } catch (err) {
      setUploadTask(null);
      if (err.status === 401) onExpired?.();
      else setError(err.message || 'Failed to upload attachment.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function onFileChange(e) {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  }

  function handleDragEnter(e) {
    e.preventDefault();
    dragCounter.current += 1;
    if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }

  function handleDragOver(e) {
    e.preventDefault();
  }

  function handleDragLeave(e) {
    e.preventDefault();
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setIsDragging(false);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    dragCounter.current = 0;
    setIsDragging(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) handleFileUpload(file);
  }

  async function handleDelete(id) {
    if (deleting) return;
    setDeleting(true);
    setError('');
    try {
      await adminRequest(`${audience}/inquiries/${encodeURIComponent(reference)}/attachments/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      setItems(prev => prev.filter(item => item._id !== id));
      setConfirmDeleteId(null);
      setNotice('Attachment deleted.');
      setTimeout(() => setNotice(''), 3000);
    } catch (err) {
      if (err.status === 401) onExpired?.();
      else setError(err.message || 'Failed to delete attachment.');
    } finally { setDeleting(false); }
  }

  async function handleDownload(item) {
    if (!item?._id || downloadingId === item._id) return;
    setDownloadingId(item._id);
    setError('');
    try {
      const url = getAttachmentDownloadUrl(audience, reference, item._id);
      const res = await fetch(url, {
        credentials: 'include',
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        if (res.status === 401) {
          onExpired?.();
          throw new Error('Please sign in again to download files.');
        }
        throw new Error(errJson?.error?.message || errJson?.message || 'Download failed.');
      }
      const blob = await res.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = item.originalName || 'document';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => window.URL.revokeObjectURL(objectUrl), 2000);
    } catch (err) {
      setError(err.message || 'Failed to download file.');
    } finally {
      setDownloadingId(null);
    }
  }

  // Categories present in items for filter chips
  const presentCategories = ['All', ...new Set(items.map(it => it.label || 'Document'))];
  const filteredItems = filterCategory === 'All'
    ? items
    : items.filter(it => (it.label || 'Document') === filterCategory);

  const folderItems = useMemo(() => {
    return items.slice(0, 3).map(att => {
      const isImg = att.mimeType?.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp'].includes(att.originalName?.split('.').pop()?.toLowerCase());
      const cleanTitle = att.label || 'Event Document';
      if (isImg) {
        return {
          image: `${getAttachmentDownloadUrl(audience, reference, att._id)}?inline=1`,
          title: cleanTitle,
          alt: cleanTitle
        };
      }
      return {
        title: cleanTitle,
        description: `${formatBytes(att.size)} · Verified`
      };
    });
  }, [items, audience, reference]);

  const totalBytes = useMemo(() => {
    return items.reduce((acc, it) => acc + (it.size || 0), 0);
  }, [items]);

  const uniqueCategories = useMemo(() => {
    return Array.from(new Set(items.map(it => it.label || 'Document')));
  }, [items]);

  const latestUploadDate = useMemo(() => {
    if (!items.length || !items[0]?.createdAt) return null;
    const date = new Date(items[0].createdAt);
    return isNaN(date.getTime()) ? null : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }, [items]);

  return (
    <section className="admin-attachments-card" aria-label="Attachments and documents">
      {/* Header */}
      <div className="admin-attachments-header">
        <div>
          <div className="admin-attachments-title-wrap">
            <h3>Documents & Attachments</h3>
            <span className="admin-attachments-count">
              {items.length} {items.length === 1 ? 'file' : 'files'}
            </span>
          </div>
          <p>Contracts, tech riders, event schedules, and stage plots for this inquiry.</p>
        </div>
      </div>

      {/* Interactive Dropzone */}
      <div
        className={`admin-upload-dropzone ${isDragging ? 'is-dragging' : ''} ${uploadTask ? 'is-busy' : ''}`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          id={`attachment-file-input-${reference}`}
          type="file"
          className="admin-file-hidden"
          onChange={onFileChange}
          disabled={Boolean(uploadTask)}
          accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.txt,.mp3,.wav"
        />

        {isDragging ? (
          <div className="admin-dropzone-drag-overlay">
            <div className="admin-drag-icon-pulse">
              <UploadCloud size={36} aria-hidden="true" />
            </div>
            <h4>Drop your document here</h4>
            <p>We'll upload and securely attach it to this inquiry.</p>
          </div>
        ) : (
          <>
            <div className="admin-upload-controls">
              <div className="admin-upload-label-select">
                <span className="admin-upload-label-tag">Category</span>
                <Dropdown
                  id={`attachment-label-dropdown-${reference}`}
                  label="Select category"
                  value={label}
                  options={LABELS.map(l => ({ value: l, label: l }))}
                  onChange={setLabel}
                />
              </div>

              <label
                htmlFor={`attachment-file-input-${reference}`}
                className="admin-upload-trigger-btn"
              >
                <UploadCloud size={16} aria-hidden="true" />
                <span>Choose file or drag here</span>
              </label>
            </div>

            <p className="admin-upload-hint">
              PDF, Images, Word (.docx), Audio · Max 20 MB per file.
            </p>
          </>
        )}
      </div>

      {/* Live Apple-Style Upload Progress Card */}
      {uploadTask && (
        <div className="admin-upload-live-card" role="status" aria-live="polite">
          <div className="admin-upload-live-info">
            <span className="admin-upload-live-icon">
              {getFileIcon(uploadTask.mimeType, uploadTask.name)}
            </span>
            <div className="admin-upload-live-meta">
              <div className="admin-upload-live-name-row">
                <strong title={uploadTask.name}>{uploadTask.name}</strong>
                <span className="admin-attachment-label-pill">{uploadTask.label}</span>
              </div>
              <div className="admin-upload-live-sub">
                <span>{formatBytes(uploadTask.loaded)} of {formatBytes(uploadTask.total)}</span>
                <span className="admin-meta-dot">•</span>
                <span className={`admin-upload-status-tag is-${uploadTask.status}`}>
                  {uploadTask.status === 'uploading' ? `Uploading ${uploadTask.percent}%` : uploadTask.status === 'processing' ? 'Processing…' : 'Complete!'}
                </span>
              </div>
            </div>
          </div>

          <div className="admin-upload-progress-track">
            <div
              className={`admin-upload-progress-bar ${uploadTask.status === 'done' ? 'is-complete' : ''}`}
              style={{ width: `${Math.max(4, uploadTask.percent)}%` }}
            />
          </div>
        </div>
      )}

      {/* Alerts */}
      {error && (
        <div className="admin-attachment-alert is-error" role="alert">
          <AlertCircle size={15} aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}
      {notice && (
        <div className="admin-attachment-alert is-success" role="status">
          <Check size={15} aria-hidden="true" />
          <span>{notice}</span>
        </div>
      )}

      {/* Folder Visual & Information Summary */}
      {!loading && items.length > 0 && (
        <div className="admin-folder-showcase">
          <div className="admin-folder-stage-container">
            <Folder
              label="Documents"
              tabPosition="left"
              mode="flap"
              variant="solid"
              color="#324027"
              paperColor="#f5f7f2"
              theme="dark"
              size={0.92}
              speed={1.6}
              bounce={0.12}
              tilt={0}
              intro={true}
              draggable={false}
              zoomOnClick={false}
              items={folderItems}
              onItemClick={(item, index) => {
                const target = items[index];
                if (target) {
                  setPreview(target);
                }
              }}
            />
            {items.length > 3 && <button type="button" className="admin-more-files" onClick={() => {
              setFilterCategory('All');
              fileList.current?.scrollIntoView({ block: 'start', behavior: 'instant' });
              fileList.current?.focus({ preventScroll: true });
            }}>+{items.length - 3} more {items.length - 3 === 1 ? 'file' : 'files'}</button>}
          </div>

          <div className="admin-folder-info-card">
            <div className="admin-folder-info-top">
              <span className="admin-folder-info-title">Attached Files Summary</span>
            </div>

            <div className="admin-folder-stats-grid">
              <div className="admin-folder-stat-cell">
                <span className="admin-folder-stat-label">Files</span>
                <strong className="admin-folder-stat-value">{items.length}</strong>
              </div>
              <div className="admin-folder-stat-cell">
                <span className="admin-folder-stat-label">Total Size</span>
                <strong className="admin-folder-stat-value">{formatBytes(totalBytes)}</strong>
              </div>
              {latestUploadDate && (
                <div className="admin-folder-stat-cell">
                  <span className="admin-folder-stat-label">Last Upload</span>
                  <strong className="admin-folder-stat-value">{latestUploadDate}</strong>
                </div>
              )}
            </div>

            {uniqueCategories.length > 0 && (
              <div className="admin-folder-cats-wrap">
                <span className="admin-folder-stat-label">Categories</span>
                <div className="admin-folder-cats-tags">
                  {uniqueCategories.map(cat => (
                    <span key={cat} className="admin-folder-cat-tag">{cat}</span>
                  ))}
                </div>
              </div>
            )}

            <span className="admin-folder-hint-line">
              Click a document in the folder to view it. All files are listed below.
            </span>
          </div>
        </div>
      )}

      {/* Category Filter Chips (Only show if multiple categories exist) */}
      {items.length > 1 && presentCategories.length > 2 && (
        <div className="admin-attachment-chips" role="group" aria-label="Filter documents by category">
          <span className="admin-chips-label"><Filter size={12} aria-hidden="true" /> Filter:</span>
          {presentCategories.map(cat => (
            <button
              type="button"
              key={cat}
              aria-pressed={filterCategory === cat}
              className={`admin-chip-btn ${filterCategory === cat ? 'is-active' : ''}`}
              onClick={() => setFilterCategory(cat)}
            >
              {cat} {cat === 'All' ? `(${items.length})` : `(${items.filter(i => (i.label || 'Document') === cat).length})`}
            </button>
          ))}
        </div>
      )}

      {/* Attachments List */}
      <div className="admin-attachments-list" ref={fileList} tabIndex={-1} aria-label="All attached files">
        {loading ? (
          <div className="admin-attachments-skeleton" aria-busy="true">
            {[1, 2].map(i => (
              <div key={i} className="admin-skeleton-row" style={{ minHeight: 64, marginBottom: 8 }} />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="admin-attachments-empty">
            <Paperclip size={24} strokeWidth={1.5} aria-hidden="true" />
            <p>
              {filterCategory === 'All'
                ? 'No documents uploaded yet. Upload a contract, tech rider, or event brief above.'
                : `No documents under “${filterCategory}”.`}
            </p>
          </div>
        ) : (
          <ul className="admin-attachments-items">
            {filteredItems.map(item => {
              const isConfirming = confirmDeleteId === item._id;
              const isTeam = item.uploadedBy?.role === 'team';

              return (
                <li key={item._id} className="admin-attachment-item">
                  <div className="admin-attachment-fileinfo">
                    <span className="admin-attachment-type-icon" aria-hidden="true">
                      {getFileIcon(item.mimeType, item.originalName)}
                    </span>
                    <div className="admin-attachment-meta">
                      <div className="admin-attachment-title-row">
                        <strong className="admin-attachment-name" title={item.originalName}>
                          {item.originalName}
                        </strong>
                        <span className="admin-attachment-label-pill">{item.label || 'Document'}</span>
                      </div>
                      <div className="admin-attachment-submeta">
                        <span>{formatBytes(item.size)}</span>
                        <span className="admin-meta-dot">•</span>
                        <span>{isTeam ? 'Team upload' : 'Client upload'}</span>
                        <span className="admin-meta-dot">•</span>
                        <time dateTime={item.createdAt}>
                          {new Date(item.createdAt).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </time>
                      </div>
                    </div>
                  </div>

                  <div className="admin-attachment-actions">
                    <button
                      type="button"
                      className="admin-attachment-btn is-primary"
                      title={`Download ${item.originalName}`}
                      disabled={downloadingId === item._id}
                      onClick={() => handleDownload(item)}
                    >
                      {downloadingId === item._id ? (
                        <Loader2 size={14} className="admin-spin" aria-hidden="true" />
                      ) : (
                        <Download size={14} aria-hidden="true" />
                      )}
                      <span>{downloadingId === item._id ? 'Downloading…' : 'Download'}</span>
                    </button>

                    {audience === 'admin' && (
                      isConfirming ? (
                        <div className="admin-delete-confirm-group" role="group" aria-label={`Delete ${item.originalName}?`}>
                          <button
                            type="button"
                            disabled={deleting} className="admin-attachment-btn is-delete-confirm"
                            onClick={() => handleDelete(item._id)}
                          >
                            {deleting ? 'Deleting…' : 'Confirm delete'}
                          </button>
                          <button
                            type="button"
                            disabled={deleting} className="admin-attachment-btn is-cancel"
                            onClick={() => setConfirmDeleteId(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="admin-attachment-btn is-delete"
                          onClick={() => setConfirmDeleteId(item._id)}
                          title="Delete file"
                          aria-label={`Delete ${item.originalName}`}
                        >
                          <Trash2 size={14} aria-hidden="true" />
                          <span>Delete</span>
                        </button>
                      )
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {preview && <dialog ref={previewDialog} className="attachment-preview" aria-labelledby="attachment-preview-title" onCancel={() => setPreview(null)} onClick={event => { if (event.target === previewDialog.current) setPreview(null); }}>
        <header><h3 id="attachment-preview-title">{preview.originalName}</h3><button type="button" className="chat-icon" aria-label="Close preview" onClick={() => setPreview(null)}><X size={22} /></button></header>
        <div className="attachment-preview-body">
          { /\.(png|jpe?g|webp)$/i.test(preview.originalName) ? <img src={`${getAttachmentDownloadUrl(audience, reference, preview._id)}?inline=1`} alt={preview.originalName} />
            : /\.(mp3|wav)$/i.test(preview.originalName) ? <audio controls src={`${getAttachmentDownloadUrl(audience, reference, preview._id)}?inline=1`} />
            : /\.(pdf|txt)$/i.test(preview.originalName) ? <iframe title={preview.originalName} src={`${getAttachmentDownloadUrl(audience, reference, preview._id)}?inline=1`} />
            : <p>This file type cannot be previewed here. Use its Download button in the file list to open it on your device.</p>}
        </div>
      </dialog>}
    </section>
  );
}
