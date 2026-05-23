import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Upload, Search, Grid2x2 as Grid, List, Trash2, Download, Copy, CheckCircle, Image as ImageIcon, Film, FileText, Filter, X, FolderOpen, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLang } from '../../contexts/LanguageContext';
import { supabase } from '../../lib/supabase';

type MediaItem = {
  id: string;
  filename: string;
  original_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  mime_type: string;
  width?: number;
  height?: number;
  alt_text: string;
  folder: string;
  watermark_applied: boolean;
  is_public: boolean;
  created_at: string;
};

type UploadJob = {
  id: string;
  name: string;
  progress: number;
  status: 'uploading' | 'done' | 'error';
  preview?: string;
};

const FOLDERS = ['general', 'weddings', 'gallery', 'services', 'halls', 'staff', 'documents'];

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

async function compressToWebP(file: File, maxWidth = 1920, quality = 0.85): Promise<{ blob: Blob; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxWidth) {
        height = Math.round((height / width) * maxWidth);
        width = maxWidth;
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(blob => {
        if (blob) resolve({ blob, width, height });
        else reject(new Error('Compression failed'));
      }, 'image/webp', quality);
    };
    img.onerror = reject;
    img.src = url;
  });
}

export default function MediaPage() {
  const { t } = useLang();
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [folder, setFolder] = useState('all');
  const [search, setSearch] = useState('');
  const [uploads, setUploads] = useState<UploadJob[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [preview, setPreview] = useState<MediaItem | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    let query = supabase.from('media').select('*').order('created_at', { ascending: false });
    if (folder !== 'all') query = query.eq('folder', folder);
    if (search) query = query.ilike('original_name', `%${search}%`);
    const { data } = await query.limit(200);
    if (data) setItems(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [folder, search]);

  const uploadFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const jobs: UploadJob[] = fileArray.map(f => ({
      id: crypto.randomUUID(),
      name: f.name,
      progress: 0,
      status: 'uploading' as const,
      preview: f.type.startsWith('image/') ? URL.createObjectURL(f) : undefined,
    }));
    setUploads(prev => [...prev, ...jobs]);

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      const job = jobs[i];

      try {
        let uploadBlob: Blob = file;
        let width: number | undefined;
        let height: number | undefined;
        let mimeType = file.type;
        let ext = file.name.split('.').pop()?.toLowerCase() || 'bin';

        if (file.type.startsWith('image/') && file.type !== 'image/svg+xml') {
          const compressed = await compressToWebP(file);
          uploadBlob = compressed.blob;
          width = compressed.width;
          height = compressed.height;
          mimeType = 'image/webp';
          ext = 'webp';
        }

        const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const storagePath = `${folder === 'all' ? 'general' : folder}/${filename}`;

        setUploads(prev => prev.map(u => u.id === job.id ? { ...u, progress: 40 } : u));

        const { data: storageData, error: storageErr } = await supabase.storage
          .from('media')
          .upload(storagePath, uploadBlob, { contentType: mimeType, upsert: false });

        if (storageErr) throw storageErr;

        setUploads(prev => prev.map(u => u.id === job.id ? { ...u, progress: 80 } : u));

        const { data: publicUrlData } = supabase.storage.from('media').getPublicUrl(storagePath);
        const fileUrl = publicUrlData.publicUrl;

        const { data: mediaRecord } = await supabase.from('media').insert({
          filename,
          original_name: file.name,
          file_url: fileUrl,
          file_type: file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'document',
          file_size: uploadBlob.size,
          mime_type: mimeType,
          width: width || null,
          height: height || null,
          alt_text: '',
          folder: folder === 'all' ? 'general' : folder,
          watermark_applied: false,
          is_public: true,
        }).select().maybeSingle();

        if (mediaRecord) {
          setItems(prev => [mediaRecord, ...prev]);
        }

        setUploads(prev => prev.map(u => u.id === job.id ? { ...u, progress: 100, status: 'done' } : u));
      } catch (err) {
        console.error(err);
        setUploads(prev => prev.map(u => u.id === job.id ? { ...u, status: 'error' } : u));
      }
    }

    setTimeout(() => {
      setUploads(prev => prev.filter(u => u.status !== 'done'));
    }, 3000);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) uploadFiles(e.dataTransfer.files);
  }, [folder]);

  const handleDelete = async (id: string, filename: string, folderName: string) => {
    if (!confirm(t('هل تريد حذف هذا الملف؟', 'Delete this file?'))) return;
    await supabase.storage.from('media').remove([`${folderName}/${filename}`]);
    await supabase.from('media').delete().eq('id', id);
    setItems(prev => prev.filter(i => i.id !== id));
    setSelected(prev => prev.filter(s => s !== id));
  };

  const handleBulkDelete = async () => {
    if (!confirm(t(`حذف ${selected.length} ملف؟`, `Delete ${selected.length} files?`))) return;
    const toDelete = items.filter(i => selected.includes(i.id));
    const paths = toDelete.map(i => `${i.folder}/${i.filename}`);
    await supabase.storage.from('media').remove(paths);
    for (const item of toDelete) {
      await supabase.from('media').delete().eq('id', item.id);
    }
    setItems(prev => prev.filter(i => !selected.includes(i.id)));
    setSelected([]);
  };

  const copyUrl = async (url: string, id: string) => {
    await navigator.clipboard.writeText(url);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const fileIcon = (type: string) => {
    if (type === 'image') return <ImageIcon className="w-5 h-5 text-blue-400" />;
    if (type === 'video') return <Film className="w-5 h-5 text-purple-400" />;
    return <FileText className="w-5 h-5 text-gray-400" />;
  };

  const totalSize = items.reduce((s, i) => s + i.file_size, 0);
  const imageCount = items.filter(i => i.file_type === 'image').length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white font-arabic">{t('مكتبة الميديا', 'Media Library')}</h1>
          <p className="text-xs text-gray-500 mt-0.5 font-arabic">
            {items.length} {t('ملف', 'files')} · {formatBytes(totalSize)} · {imageCount} {t('صورة', 'images')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selected.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm hover:bg-red-500/20 transition-colors font-arabic"
            >
              <Trash2 className="w-4 h-4" />
              {t(`حذف ${selected.length}`, `Delete ${selected.length}`)}
            </button>
          )}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-arabic font-semibold hover:bg-amber-600 transition-colors"
          >
            <Upload className="w-4 h-4" />
            {t('رفع ملفات', 'Upload Files')}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*,application/pdf"
            className="hidden"
            onChange={e => e.target.files && uploadFiles(e.target.files)}
          />
        </div>
      </div>

      {/* Upload Progress */}
      <AnimatePresence>
        {uploads.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="bg-gray-900 rounded-2xl border border-white/5 p-4 space-y-2">
            {uploads.map(job => (
              <div key={job.id} className="flex items-center gap-3">
                {job.preview && <img src={job.preview} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />}
                {!job.preview && <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0"><FileText className="w-4 h-4 text-gray-500" /></div>}
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-300 truncate mb-1">{job.name}</div>
                  <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <motion.div
                      animate={{ width: `${job.progress}%` }}
                      className={`h-full rounded-full transition-all ${job.status === 'error' ? 'bg-red-500' : job.status === 'done' ? 'bg-green-500' : 'bg-amber-500'}`}
                    />
                  </div>
                </div>
                <span className={`text-xs flex-shrink-0 ${job.status === 'error' ? 'text-red-400' : job.status === 'done' ? 'text-green-400' : 'text-amber-400'}`}>
                  {job.status === 'done' ? t('تم', 'Done') : job.status === 'error' ? t('خطأ', 'Error') : `${job.progress}%`}
                </span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col sm:flex-row gap-3">
        {/* Sidebar */}
        <div className="sm:w-44 flex-shrink-0 bg-gray-900 rounded-2xl border border-white/5 p-3 space-y-0.5 h-fit">
          <button
            onClick={() => setFolder('all')}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-arabic transition-all ${folder === 'all' ? 'bg-amber-500/15 text-amber-400' : 'text-gray-400 hover:bg-white/5'}`}
          >
            <Grid className="w-3.5 h-3.5" />
            {t('الكل', 'All Files')}
          </button>
          {FOLDERS.map(f => (
            <button
              key={f}
              onClick={() => setFolder(f)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-arabic transition-all ${folder === f ? 'bg-amber-500/15 text-amber-400' : 'text-gray-400 hover:bg-white/5'}`}
            >
              <FolderOpen className="w-3.5 h-3.5" />
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-3">
          {/* Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-40">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={t('بحث في الملفات...', 'Search files...')}
                className="w-full pl-3 pr-9 py-2 bg-gray-900 border border-white/10 rounded-xl text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-amber-500/50 transition-colors"
              />
            </div>
            <div className="flex items-center gap-1 bg-gray-900 border border-white/10 rounded-xl p-1">
              <button onClick={() => setView('grid')} className={`p-1.5 rounded-lg transition-colors ${view === 'grid' ? 'bg-amber-500 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
                <Grid className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setView('list')} className={`p-1.5 rounded-lg transition-colors ${view === 'list' ? 'bg-amber-500 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Drop Zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${dragOver ? 'border-amber-500 bg-amber-500/5' : 'border-white/10 hover:border-white/20'}`}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className={`w-6 h-6 mx-auto mb-2 transition-colors ${dragOver ? 'text-amber-400' : 'text-gray-600'}`} />
            <p className={`text-sm font-arabic transition-colors ${dragOver ? 'text-amber-300' : 'text-gray-500'}`}>
              {t('اسحب وأفلت الملفات هنا أو انقر للاختيار', 'Drag & drop files here or click to browse')}
            </p>
            <p className="text-xs text-gray-700 mt-1">
              {t('يتم ضغط الصور تلقائياً إلى WebP', 'Images auto-compressed to WebP')} · Max 50MB
            </p>
          </div>

          {/* Grid/List */}
          {loading ? (
            <div className={view === 'grid' ? 'grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3' : 'space-y-2'}>
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className={`bg-gray-900 rounded-xl animate-pulse border border-white/5 ${view === 'grid' ? 'aspect-square' : 'h-14'}`} />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="py-16 text-center">
              <ImageIcon className="w-10 h-10 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500 font-arabic">{t('لا توجد ملفات', 'No files found')}</p>
            </div>
          ) : view === 'grid' ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              {items.map(item => (
                <div
                  key={item.id}
                  onClick={() => toggleSelect(item.id)}
                  className={`relative group aspect-square rounded-xl overflow-hidden bg-gray-900 border-2 cursor-pointer transition-all ${
                    selected.includes(item.id) ? 'border-amber-500' : 'border-white/5 hover:border-white/20'
                  }`}
                >
                  {item.file_type === 'image' ? (
                    <img src={item.file_url} alt={item.alt_text || item.original_name} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-800">
                      {fileIcon(item.file_type)}
                    </div>
                  )}
                  {selected.includes(item.id) && (
                    <div className="absolute inset-0 bg-amber-500/20 flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-amber-400" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end">
                    <div className="p-2 w-full flex justify-between items-center">
                      <button
                        onClick={e => { e.stopPropagation(); setPreview(item); }}
                        className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 text-white transition-colors"
                      >
                        <Eye className="w-3 h-3" />
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); copyUrl(item.file_url, item.id); }}
                        className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 text-white transition-colors"
                      >
                        {copied === item.id ? <CheckCircle className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); handleDelete(item.id, item.filename, item.folder); }}
                        className="p-1.5 bg-red-500/20 rounded-lg hover:bg-red-500/30 text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-1.5">
              {items.map(item => (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                    selected.includes(item.id) ? 'bg-amber-500/5 border-amber-500/20' : 'bg-gray-900 border-white/5 hover:border-white/10'
                  }`}
                  onClick={() => toggleSelect(item.id)}
                >
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-800 flex-shrink-0">
                    {item.file_type === 'image' ? (
                      <img src={item.file_url} alt="" className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">{fileIcon(item.file_type)}</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-gray-200 truncate">{item.original_name}</div>
                    <div className="text-xs text-gray-600 flex items-center gap-2 mt-0.5">
                      <span>{formatBytes(item.file_size)}</span>
                      {item.width && item.height && <span>{item.width}×{item.height}</span>}
                      <span className="px-1.5 py-0.5 bg-gray-800 rounded text-gray-500">{item.folder}</span>
                      {item.watermark_applied && <span className="text-amber-600">{t('محمي', 'Watermarked')}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={e => { e.stopPropagation(); copyUrl(item.file_url, item.id); }}
                      className="p-2 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-colors">
                      {copied === item.id ? <CheckCircle className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <a href={item.file_url} download target="_blank" rel="noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="p-2 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-colors">
                      <Download className="w-3.5 h-3.5" />
                    </a>
                    <button onClick={e => { e.stopPropagation(); handleDelete(item.id, item.filename, item.folder); }}
                      className="p-2 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-400/10 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {preview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setPreview(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 rounded-2xl border border-white/10 max-w-2xl w-full overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {preview.file_type === 'image' && (
                <img src={preview.file_url} alt={preview.alt_text} className="w-full max-h-96 object-contain bg-gray-950" />
              )}
              <div className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-gray-200">{preview.original_name}</div>
                    <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                      <span>{formatBytes(preview.file_size)}</span>
                      {preview.width && preview.height && <span>{preview.width}×{preview.height}px</span>}
                      <span className="uppercase">{preview.mime_type.split('/')[1]}</span>
                    </div>
                  </div>
                  <button onClick={() => setPreview(null)} className="p-2 rounded-lg text-gray-500 hover:bg-white/5">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => copyUrl(preview.file_url, preview.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-amber-500 text-white rounded-xl text-sm font-arabic hover:bg-amber-600 transition-colors"
                  >
                    {copied === preview.id ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied === preview.id ? t('تم النسخ!', 'Copied!') : t('نسخ الرابط', 'Copy URL')}
                  </button>
                  <a href={preview.file_url} download target="_blank" rel="noreferrer"
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-800 text-gray-300 rounded-xl text-sm font-arabic hover:bg-gray-700 transition-colors">
                    <Download className="w-4 h-4" />
                    {t('تحميل', 'Download')}
                  </a>
                </div>
                <div className="text-xs font-mono text-gray-600 break-all bg-gray-950 p-2 rounded-lg">{preview.file_url}</div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
