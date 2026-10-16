import React, { useState } from 'react';
import { 
  HardDrive, FolderArchive, FileText, Download, CheckCircle2, AlertTriangle, 
  RefreshCw, Copy, Check, X, Sparkles, Folder, ArrowRight, ShieldCheck, Terminal
} from 'lucide-react';
import { Album } from '../types/album';
import { 
  copyRawFilesFromHardDrive, 
  generatePowerShellScript, 
  generateClientNotesCSV, 
  triggerFileDownload, 
  isFileSystemAccessSupported, 
  categorizePhotosForPostProduction,
  CopyProgress
} from '../utils/rawCopier';

interface RawFilterModalProps {
  album: Album;
  isOpen: boolean;
  onClose: () => void;
}

export const RawFilterModal: React.FC<RawFilterModalProps> = ({
  album,
  isOpen,
  onClose
}) => {
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<CopyProgress | null>(null);
  const [copySuccessMsg, setCopySuccessMsg] = useState<string | null>(null);
  const [copiedFilenamesFeedback, setCopiedFilenamesFeedback] = useState<boolean>(false);

  if (!isOpen) return null;

  const { largePrintPhotos, framedPhotos, likedPhotos, notesPhotos } = categorizePhotosForPostProduction(album.photos);
  const isApiSupported = isFileSystemAccessSupported();

  const handleStartCopying = async () => {
    setIsProcessing(true);
    setProgress(null);
    setCopySuccessMsg(null);

    try {
      const result = await copyRawFilesFromHardDrive(album, (prog) => {
        setProgress(prog);
      });
      setCopySuccessMsg(result.message);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        alert(err.message || 'Có lỗi xảy ra khi đọc hoặc ghi file.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadPowerShell = () => {
    const script = generatePowerShellScript(album);
    triggerFileDownload(script, `Copy_RAW_${album.title.replace(/\s+/g, '_')}.ps1`);
  };

  const handleDownloadCSV = () => {
    const csv = generateClientNotesCSV(album);
    triggerFileDownload(csv, `Danh_Sach_Anh_Khach_Chon_${album.title.replace(/\s+/g, '_')}.csv`, 'text/csv;charset=utf-8');
  };

  const handleCopyFilenamesList = () => {
    const filenames = likedPhotos.map(p => p.baseName).join(' ');
    navigator.clipboard.writeText(filenames);
    setCopiedFilenamesFeedback(true);
    setTimeout(() => setCopiedFilenamesFeedback(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-150 my-8">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <HardDrive className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Lọc & Sao Chép File RAW (.ARW / .CR2 / .NEF)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Album: <strong className="text-slate-800">{album.title}</strong> · Khách: {album.clientName}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Overview of categorized folders to create */}
        <div className="py-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            Cấu trúc thư mục hậu kỳ sẽ được tạo tự động:
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-indigo-50/70 border border-indigo-100 p-3 rounded-xl">
              <div className="flex items-center gap-2 font-bold text-indigo-900 mb-1">
                <Folder className="w-4 h-4 text-indigo-600" />
                <span>01_Anh_Phong_Cong</span>
              </div>
              <p className="text-[11px] text-indigo-700">
                Gồm <strong className="font-bold">{largePrintPhotos.length}</strong> file RAW phục vụ in ảnh cổng 60x90, 70x110.
              </p>
            </div>

            <div className="bg-amber-50/70 border border-amber-100 p-3 rounded-xl">
              <div className="flex items-center gap-2 font-bold text-amber-900 mb-1">
                <Folder className="w-4 h-4 text-amber-600" />
                <span>02_Anh_Khung_De_Ban</span>
              </div>
              <p className="text-[11px] text-amber-700">
                Gồm <strong className="font-bold">{framedPhotos.length}</strong> file RAW in ảnh khung để bàn gallery tiệc cưới.
              </p>
            </div>

            <div className="bg-rose-50/70 border border-rose-100 p-3 rounded-xl">
              <div className="flex items-center gap-2 font-bold text-rose-900 mb-1">
                <Folder className="w-4 h-4 text-rose-600" />
                <span>03_Anh_Tim_Da_Chon</span>
              </div>
              <p className="text-[11px] text-rose-700">
                Gồm <strong className="font-bold">{likedPhotos.length}</strong> file RAW toàn bộ ảnh khách đã thả tim.
              </p>
            </div>
          </div>
        </div>

        {/* Primary Option: Web File System Access (Direct hard drive folder picker) */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 my-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-sm">
                  Cách 1: Chọn trực tiếp thư mục ổ cứng trên trình duyệt (Khuyên dùng)
                </span>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  1-Click Tự Động
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 max-w-xl">
                Hệ thống sẽ mở hộp thoại để bạn chọn thư mục chứa file RAW máy ảnh (Sony .ARW, Canon .CR2/.CR3, Nikon .NEF) trên ổ cứng máy tính, tự động quét đối chiếu và sao chép vào đúng 3 thư mục riêng biệt ở trên.
              </p>
            </div>

            <button
              onClick={handleStartCopying}
              disabled={isProcessing}
              className={`shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-sm transition-all cursor-pointer ${
                isProcessing
                  ? 'bg-slate-400 cursor-not-allowed'
                  : 'bg-rose-600 hover:bg-rose-700 active:scale-95'
              }`}
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Đang sao chép...</span>
                </>
              ) : (
                <>
                  <HardDrive className="w-4 h-4" />
                  <span>Chọn ổ cứng & Copy</span>
                </>
              )}
            </button>
          </div>

          {/* Live Progress Bar and Logs */}
          {progress && (
            <div className="mt-4 pt-4 border-t border-slate-200/80">
              <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                <span className="text-slate-700">{progress.category}</span>
                <span className="text-slate-900 font-bold tabular-nums">
                  {progress.current} / {progress.total} file
                </span>
              </div>

              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-rose-600 transition-all duration-200"
                  style={{ width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%` }}
                />
              </div>

              {progress.currentFileName && (
                <p className="text-[11px] text-slate-500 mt-1.5 font-mono truncate">
                  Đang xử lý: {progress.currentFileName}
                </p>
              )}

              {progress.errors.length > 0 && (
                <div className="mt-2 text-rose-600 text-[11px] space-y-1">
                  {progress.errors.map((e, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>{e}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {copySuccessMsg && (
            <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{copySuccessMsg}</span>
            </div>
          )}
        </div>

        {/* Secondary Options: Scripts & Manifest Exports */}
        <div className="pt-4 border-t border-slate-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            Cách 2: Xuất file Script & Danh sách gửi Photoshop Team:
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* PowerShell Script */}
            <button
              onClick={handleDownloadPowerShell}
              className="p-3 text-left bg-white border border-slate-200 hover:border-slate-300 rounded-xl hover:shadow-xs transition-all flex flex-col justify-between cursor-pointer"
            >
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-1">
                  <Terminal className="w-4 h-4 text-blue-600" />
                  <span>Script PowerShell (.ps1)</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Chạy 1-click trên máy tính Windows, tự động lọc và copy file RAW.
                </p>
              </div>
              <div className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600">
                <Download className="w-3.5 h-3.5" /> Tải Script (.ps1)
              </div>
            </button>

            {/* Excel / CSV with Notes */}
            <button
              onClick={handleDownloadCSV}
              className="p-3 text-left bg-white border border-slate-200 hover:border-slate-300 rounded-xl hover:shadow-xs transition-all flex flex-col justify-between cursor-pointer"
            >
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-1">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span>Danh sách Excel & Ghi chú</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  File CSV ghi rõ yêu cầu chỉnh sửa của khách cho từng ảnh.
                </p>
              </div>
              <div className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                <Download className="w-3.5 h-3.5" /> Tải Excel (.csv)
              </div>
            </button>

            {/* Copy file list for Lightroom */}
            <button
              onClick={handleCopyFilenamesList}
              className="p-3 text-left bg-white border border-slate-200 hover:border-slate-300 rounded-xl hover:shadow-xs transition-all flex flex-col justify-between cursor-pointer"
            >
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-1">
                  <Copy className="w-4 h-4 text-purple-600" />
                  <span>Sao chép chuỗi tìm kiếm</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Copy mã tên file để dán nhanh vào thanh tìm kiếm Lightroom / Capture One.
                </p>
              </div>
              <div className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-purple-600">
                {copiedFilenamesFeedback ? (
                  <>
                    <Check className="w-3.5 h-3.5" /> Đã sao chép!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Copy danh sách tên
                  </>
                )}
              </div>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100 mt-6">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            Đóng cửa sổ
          </button>
        </div>
      </div>
    </div>
  );
};
