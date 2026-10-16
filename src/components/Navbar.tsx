import React from 'react';
import { Camera, HardDrive, LayoutGrid, Image as ImageIcon, Github, Bell, Moon, Sun, Plus, Eye, ShieldCheck, ArrowRight } from 'lucide-react';
import { AppView } from '../types/album';

interface NavbarProps {
  currentView: AppView;
  onViewChange: (view: AppView) => void;
  onOpenCreateModal: () => void;
  onOpenRawModal: () => void;
  activeAlbumTitle?: string;
  isClientMode?: boolean;
  onToggleClientMode?: (clientMode: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onViewChange,
  onOpenCreateModal,
  onOpenRawModal,
  activeAlbumTitle,
  isClientMode = false,
  onToggleClientMode
}) => {
  // GIAO DIỆN KHÁCH HÀNG: Chỉ đơn giản có logo và hiển thị tiêu đề album
  if (isClientMode) {
    return (
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Zone 1: Chỉ hiển thị Logo Studio */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#996515] via-[#D4AF37] to-[#F5D77F] text-slate-900 flex items-center justify-center shadow-xs">
                <Camera className="w-5 h-5 text-slate-900" />
              </div>
              <div className="flex flex-col">
                <span
                  className="text-2xl font-bold tracking-wide"
                  style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    color: '#D4AF37',
                    textShadow: '0 2px 4px rgba(0, 0, 0, 0.25), 0 1px 2px rgba(180, 130, 20, 0.4)'
                  }}
                >
                  Lavender
                </span>
                <span className="text-[10px] text-amber-600/90 font-medium -mt-1 tracking-wider uppercase">
                  Studio Selection
                </span>
              </div>

              {activeAlbumTitle && (
                <div className="hidden sm:flex items-center gap-2 border-l border-slate-200 pl-3 ml-1">
                  <span className="text-xs font-semibold text-slate-700 font-mono">
                    {activeAlbumTitle}
                  </span>
                </div>
              )}
            </div>

            {/* Zone 3: Nút chuyển về chế độ Quản trị cho chủ Studio */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => onToggleClientMode?.(false)}
                className="text-[11px] font-medium text-slate-400 hover:text-slate-700 px-2.5 py-1 rounded-lg hover:bg-slate-100 transition-colors flex items-center gap-1 cursor-pointer"
                title="Dành cho chủ studio: quay lại giao diện quản trị"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                <span>Chế độ Studio</span>
              </button>
            </div>
          </div>
        </div>
      </header>
    );
  }

  // GIAO DIỆN QUẢN TRỊ STUDIO ĐẦY ĐỦ
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
            {/* Zone 1: Single text element wordmark / Brand */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onViewChange('dashboard')}
              className="flex items-center gap-2 group text-left cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#996515] via-[#D4AF37] to-[#F5D77F] text-slate-900 flex items-center justify-center shadow-xs group-hover:opacity-95 transition-all">
                <Camera className="w-5 h-5 text-slate-900" />
              </div>
              <div className="flex flex-col">
                <span
                  className="text-2xl font-bold tracking-wide"
                  style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    color: '#D4AF37',
                    textShadow: '0 2px 4px rgba(0, 0, 0, 0.25), 0 1px 2px rgba(180, 130, 20, 0.4)'
                  }}
                >
                  Lavender
                </span>
                <span className="text-[10px] text-amber-600/90 font-medium -mt-1 tracking-wider uppercase">
                  Studio Admin
                </span>
              </div>
            </button>

            <button
              onClick={onOpenCreateModal}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Tạo album
            </button>
          </div>

          {/* Zone 2: Clean single-line text navigation links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <button
              onClick={() => onViewChange('dashboard')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                currentView === 'dashboard' ? 'text-slate-900 font-semibold border-b-2 border-slate-900 pb-0.5' : ''
              }`}
            >
              Quản lý Album
            </button>
            <button
              onClick={() => onViewChange('clientGallery')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                currentView === 'clientGallery' ? 'text-slate-900 font-semibold border-b-2 border-slate-900 pb-0.5' : ''
              }`}
            >
              Xem Album {activeAlbumTitle ? `(${activeAlbumTitle})` : ''}
            </button>
            <button
              onClick={onOpenRawModal}
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer text-rose-600 font-medium"
            >
              <HardDrive className="w-4 h-4 text-rose-500" />
              Lọc file RAW ổ cứng
            </button>
            <button
              onClick={() => onViewChange('githubGuide')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer ${
                currentView === 'githubGuide' ? 'text-slate-900 font-semibold border-b-2 border-slate-900 pb-0.5' : ''
              }`}
            >
              <Github className="w-4 h-4 text-slate-500" />
              Đưa lên GitHub
            </button>
          </nav>

          {/* Zone 3: Chuyển sang xem thử giao diện khách & Admin profile */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onToggleClientMode?.(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              title="Xem trước giao diện giản lược mà khách hàng sẽ thấy"
            >
              <Eye className="w-3.5 h-3.5 text-slate-500" />
              <span>Giao diện Khách xem</span>
            </button>

            <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
              <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-bold">
                HP
              </div>
              <span className="hidden sm:inline-block text-xs font-semibold text-rose-600">
                Hùng Phạm
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
