import React, { useState } from 'react';
import { Github, Globe, Check, Copy, ExternalLink, Download, Upload, Terminal, Sparkles, X, ShieldCheck } from 'lucide-react';
import { Album } from '../types/album';

interface GitHubDeployModalProps {
  albums: Album[];
  onImportAlbums: (albums: Album[]) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const GitHubDeployModal: React.FC<GitHubDeployModalProps> = ({
  albums,
  onImportAlbums,
  isOpen,
  onClose
}) => {
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(id);
    setTimeout(() => setCopiedSnippet(null), 2500);
  };

  const handleExportBackup = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(albums, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `Studio_Albums_Backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          onImportAlbums(parsed);
          alert(`Đã khôi phục thành công ${parsed.length} album từ file sao lưu!`);
        } else {
          alert('File JSON không đúng định dạng danh sách album.');
        }
      } catch (err) {
        alert('Lỗi khi đọc file JSON.');
      }
    };
    reader.readAsText(file);
  };

  const gitCommands = `# 1. Khởi tạo Git và thêm toàn bộ file
git init
git add .
git commit -m "Khoi tao he thong chon anh studio phong cach Shotpik"

# 2. Kết nối với kho lưu trữ GitHub của bạn (thay bằng link repo của bạn)
git branch -M main
git remote add origin https://github.com/USERNAME/studio-photo-selection.git
git push -u origin main`;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-150 my-8">
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center">
              <Github className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Hướng Dẫn Đưa Lên GitHub & Online 24/7
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Giúp website hoạt động liên tục với tên miền riêng của Studio hoàn toàn miễn phí
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

        <div className="py-4 space-y-5 text-xs text-slate-600">
          {/* Step 1: Push to GitHub */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Terminal className="w-4 h-4 text-slate-700" />
                Bước 1: Đẩy mã nguồn lên GitHub
              </span>

              <button
                onClick={() => copyToClipboard(gitCommands, 'git')}
                className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-700 transition-colors cursor-pointer"
              >
                {copiedSnippet === 'git' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" /> Đã chép lệnh
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Sao chép lệnh
                  </>
                )}
              </button>
            </div>

            <p className="mb-2 text-slate-500">
              Mở Terminal trong thư mục dự án và chạy các lệnh sau để đẩy lên GitHub:
            </p>

            <pre className="bg-slate-900 text-emerald-400 p-3 rounded-lg font-mono text-[11px] overflow-x-auto select-all">
              {gitCommands}
            </pre>
          </div>

          {/* Step 2: Hosting 24/7 options */}
          <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-4">
            <div className="flex items-center gap-2 font-bold text-emerald-950 text-sm mb-1.5">
              <Globe className="w-4 h-4 text-emerald-600" />
              Bước 2: Kích hoạt chạy Online 24/7 miễn phí
            </div>
            <p className="text-emerald-800 mb-3">
              Sau khi code đã nằm trên GitHub, bạn có thể triển khai hệ thống online vĩnh viễn qua 2 nền tảng tốt nhất:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-white p-3 rounded-xl border border-emerald-200/80 shadow-xs">
                <strong className="block font-bold text-slate-900 mb-1">
                  Cách A: Dùng Vercel (Khuyên dùng nhất)
                </strong>
                <p className="text-[11px] text-slate-500">
                  Vào <strong>vercel.com</strong> -&gt; Đăng nhập bằng GitHub -&gt; Chọn repository vừa đẩy lên -&gt; Nhấn <strong>Deploy</strong>. Website sẽ online ngay lập tức và hỗ trợ gán tên miền riêng (ví dụ: <code>chonanh.lavenderstudio.vn</code>).
                </p>
              </div>

              <div className="bg-white p-3 rounded-xl border border-emerald-200/80 shadow-xs">
                <strong className="block font-bold text-slate-900 mb-1">
                  Cách B: Dùng GitHub Pages
                </strong>
                <p className="text-[11px] text-slate-500">
                  Tại GitHub repository -&gt; vào tab <strong>Settings</strong> -&gt; <strong>Pages</strong> -&gt; Chọn nguồn <strong>GitHub Actions</strong> (Vite). Web sẽ chạy online tại địa chỉ <code>https://username.github.io/repo</code>.
                </p>
              </div>
            </div>
          </div>

          {/* Backup & Restore Studio Data */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <span className="font-bold text-slate-900 text-sm block mb-1">
              Sao Lưu & Phục Hồi Dữ Liệu Album Studio
            </span>
            <p className="text-slate-500 mb-3">
              Xuất toàn bộ danh sách album, ảnh khách đã thả tim, ghi chú ra file JSON để đồng bộ giữa các máy tính hoặc chuyển sang server mới.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleExportBackup}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Tải file sao lưu (JSON)</span>
              </button>

              <label className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl transition-colors cursor-pointer">
                <Upload className="w-4 h-4" />
                <span>Nhập dữ liệu sao lưu</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportBackup}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end pt-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
