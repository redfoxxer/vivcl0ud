import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const api = (token) => axios.create({
  baseURL: '/api',
  headers: { Authorization: `Bearer ${token}` }
});

export default function Dashboard({ token, onLogout }) {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const [versions, setVersions] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInput = useRef();

  const notify = (msg, type = 'success') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 3500);
  };

  const loadFiles = async () => {
    try {
      const res = await api(token).get('/files');
      setFiles(res.data.files);
    } catch {
      notify('Failed to load files', 'error');
    }
  };

  useEffect(() => { loadFiles(); }, []);

  const handleUpload = async (fileList) => {
    if (!fileList || fileList.length === 0) return;
    setUploading(true);
    try {
      for (const file of fileList) {
        const form = new FormData();
        form.append('file', file);
        const res = await api(token).post('/files/upload', form);
        notify(res.data.message);
      }
      loadFiles();
    } catch (err) {
      notify(err.response?.data?.error || 'Upload failed', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (filename) => {
    try {
      const res = await api(token).get(`/files/download/${encodeURIComponent(filename)}`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url; a.download = filename; a.click();
      URL.revokeObjectURL(url);
      notify(`⬇️ Downloaded "${filename}"`);
    } catch {
      notify('Download failed', 'error');
    }
  };

  const handleDelete = async (filename) => {
    if (!window.confirm(`Delete "${filename}"? A backup version will be saved.`)) return;
    try {
      const res = await api(token).delete(`/files/${encodeURIComponent(filename)}`);
      notify(res.data.message);
      loadFiles();
    } catch {
      notify('Delete failed', 'error');
    }
  };

  const loadVersions = async (filename) => {
    try {
      const res = await api(token).get(`/files/versions/${encodeURIComponent(filename)}`);
      setVersions(res.data.versions);
      setSelectedFile(filename);
    } catch {
      notify('Could not load versions', 'error');
    }
  };

  const handleRestore = async (version) => {
    try {
      const res = await api(token).post(`/files/restore/${encodeURIComponent(selectedFile)}/${encodeURIComponent(version)}`);
      notify(res.data.message);
      setVersions(null);
      loadFiles();
    } catch {
      notify('Restore failed', 'error');
    }
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1024 / 1024).toFixed(1) + ' MB';
  };

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={S.header}>
        <div style={S.logo}>☁️ <span style={S.logoText}>viviCL0UD</span></div>
        <div style={S.headerRight}>
          <span style={S.badge}>🔐 Encrypted</span>
          <button style={S.logoutBtn} onClick={onLogout}>Sign Out</button>
        </div>
      </div>

      {/* Notification */}
      {message && <div style={{ ...S.toast, background: messageType === 'error' ? '#ff4757' : '#2ed573' }}>{message}</div>}

      <div style={S.content}>
        {/* Upload Zone */}
        <div
          style={{ ...S.dropzone, ...(dragOver ? S.dropzoneActive : {}) }}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); handleUpload(e.dataTransfer.files); }}
          onClick={() => fileInput.current.click()}
        >
          <input
            ref={fileInput}
            type="file"
            multiple
            style={{ display: 'none' }}
            onChange={e => handleUpload(e.target.files)}
          />
          <div style={S.dropIcon}>{uploading ? '⏳' : '📂'}</div>
          <p style={S.dropText}>{uploading ? 'Encrypting & uploading...' : 'Drop files here or click to upload'}</p>
          <p style={S.dropSub}>All files encrypted with AES-256 before saving</p>
        </div>

        {/* File List */}
        <div style={S.section}>
          <h2 style={S.sectionTitle}>Your Files ({files.length})</h2>
          {files.length === 0
            ? <p style={S.empty}>No files yet. Upload something above!</p>
            : files.map(file => (
              <div key={file.name} style={S.fileRow}>
                <div style={S.fileInfo}>
                  <span style={S.fileName}>{file.name}</span>
                  <span style={S.fileMeta}>{formatSize(file.size)} · {new Date(file.uploadedAt).toLocaleDateString()}</span>
                </div>
                <div style={S.fileActions}>
                  <button style={S.btnBlue} onClick={() => handleDownload(file.name)}>⬇️ Download</button>
                  <button style={S.btnPurple} onClick={() => loadVersions(file.name)}>🕐 Versions</button>
                  <button style={S.btnRed} onClick={() => handleDelete(file.name)}>🗑️ Delete</button>
                </div>
              </div>
            ))}
        </div>

        {/* Versions Panel */}
        {versions && (
          <div style={S.section}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={S.sectionTitle}>Versions of "{selectedFile}"</h2>
              <button style={S.closeBtn} onClick={() => setVersions(null)}>✕ Close</button>
            </div>
            {versions.length === 0
              ? <p style={S.empty}>No previous versions found.</p>
              : versions.map(v => (
                <div key={v.name} style={S.versionRow}>
                  <span style={S.versionName}>📦 {v.name.replace('.enc', '')}</span>
                  <button style={S.btnPurple} onClick={() => handleRestore(v.name)}>↩️ Restore</button>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

const S = {
  page: { minHeight: '100vh', background: '#0f0f1a', color: '#fff', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 32px', background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.08)' },
  logo: { fontSize: 22 },
  logoText: { fontWeight: 700, marginLeft: 8 },
  headerRight: { display: 'flex', alignItems: 'center', gap: 12 },
  badge: { background: 'rgba(46,213,115,0.15)', color: '#2ed573', border: '1px solid rgba(46,213,115,0.3)', borderRadius: 20, padding: '4px 12px', fontSize: 12 },
  logoutBtn: { background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 13 },
  toast: { position: 'fixed', top: 20, right: 20, color: '#fff', padding: '12px 20px', borderRadius: 10, fontWeight: 600, fontSize: 14, zIndex: 1000, boxShadow: '0 4px 20px rgba(0,0,0,0.3)' },
  content: { maxWidth: 860, margin: '0 auto', padding: 32 },
  dropzone: { border: '2px dashed rgba(255,255,255,0.15)', borderRadius: 16, padding: '40px 20px', textAlign: 'center', cursor: 'pointer', marginBottom: 32, transition: 'all 0.2s' },
  dropzoneActive: { border: '2px dashed #667eea', background: 'rgba(102,126,234,0.08)' },
  dropIcon: { fontSize: 40, marginBottom: 12 },
  dropText: { color: '#fff', fontSize: 16, fontWeight: 500, margin: '0 0 6px' },
  dropSub: { color: 'rgba(255,255,255,0.4)', fontSize: 13, margin: 0 },
  section: { background: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: 24, marginBottom: 24, border: '1px solid rgba(255,255,255,0.07)' },
  sectionTitle: { margin: '0 0 20px', fontSize: 16, fontWeight: 600, color: 'rgba(255,255,255,0.7)' },
  empty: { color: 'rgba(255,255,255,0.35)', textAlign: 'center', padding: '20px 0', margin: 0 },
  fileRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' },
  fileInfo: { display: 'flex', flexDirection: 'column', gap: 3 },
  fileName: { fontWeight: 500, fontSize: 15 },
  fileMeta: { fontSize: 12, color: 'rgba(255,255,255,0.4)' },
  fileActions: { display: 'flex', gap: 8 },
  btnBlue: { background: 'rgba(86,171,255,0.15)', color: '#56abff', border: '1px solid rgba(86,171,255,0.3)', borderRadius: 7, padding: '6px 12px', cursor: 'pointer', fontSize: 13 },
  btnPurple: { background: 'rgba(102,126,234,0.15)', color: '#a78bfa', border: '1px solid rgba(102,126,234,0.3)', borderRadius: 7, padding: '6px 12px', cursor: 'pointer', fontSize: 13 },
  btnRed: { background: 'rgba(255,71,87,0.12)', color: '#ff6b6b', border: '1px solid rgba(255,71,87,0.25)', borderRadius: 7, padding: '6px 12px', cursor: 'pointer', fontSize: 13 },
  versionRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' },
  versionName: { fontSize: 13, color: 'rgba(255,255,255,0.6)', fontFamily: 'monospace' },
  closeBtn: { background: 'none', color: 'rgba(255,255,255,0.4)', border: 'none', cursor: 'pointer', fontSize: 13 },
};
