import React, { useState, useEffect } from 'react';
import { 
  Heart, Image as ImageIcon, MessageSquare, Share2, RotateCw, Lock, Unlock, 
  Filter, Download, ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut, Check, 
  Sparkles, SlidersHorizontal, ArrowLeft, Frame, Bookmark, FileText, CheckCircle2,
  HardDrive, Edit3, Camera, Eye
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Album, PhotoItem, FilterCategory } from '../types/album';

interface ClientGalleryViewProps {
  album: Album;
  onUpdatePhoto: (albumId: string, photoId: string, updates: Partial<PhotoItem>) => void;
  onToggleLockAlbum: (albumId: string) => void;
  onOpenRawModal: (album: Album) => void;
  onOpenEditModal: (album: Album) => void;
  onBackToDashboard: () => void;
  isClientMode?: boolean;
  onExitClientMode?: () => void;
  onEnterClientMode?: () => void;
}

export const ClientGalleryView: React.FC<ClientGalleryViewProps> = ({
  album,
  onUpdatePhoto,
  onToggleLockAlbum,
  onOpenRawModal,
  onOpenEditModal,
  onBackToDashboard,
  isClientMode = false,
  onExitClientMode,
  onEnterClientMode
}) => {
  const [activeTab, setActiveTab] = useState<FilterCategory>('all');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [lightboxZoom, setLightboxZoom] = useState<number>(1);
  const [noteEditPhotoId, setNoteEditPhotoId] = useState<string | null>(null);
  const [tempNoteText, setTempNoteText] = useState<string>('');
  const [showConfirmLockModal, setShowConfirmLockModal] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Filtered photos based on active tab
  const filteredPhotos = album.photos.filter((photo) => {
    switch (activeTab) {
      case 'liked':
        return photo.isLiked;
      case 'largePrint':
        return photo.isLargePrint;
      case 'framed':
        return photo.isFramed;
      case 'hasNote':
        return Boolean(photo.clientNote && photo.clientNote.trim() !== '');
      case 'unselected':
        return !photo.isLiked && !photo.isLargePrint && !photo.isFramed;
      case 'all':
      default:
        return true;
    }
  });

  const totalPhotosCount = album.photos.length;
  const likedCount = album.photos.filter(p => p.isLiked).length;
  const largePrintCount = album.photos.filter(p => p.isLargePrint).length;
  const framedCount = album.photos.filter(p => p.isFramed).length;
  const hasNoteCount = album.photos.filter(p => p.clientNote && p.clientNote.trim() !== '').length;

  // Keyboard navigation for Lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxIndex === null) return;
      if (e.key === 'Escape') {
        setLightboxIndex(null);
        setLightboxZoom(1);
      } else if (e.key === 'ArrowRight') {
        setLightboxIndex((prev) => (prev !== null && prev < filteredPhotos.length - 1 ? prev + 1 : 0));
        setLightboxZoom(1);
      } else if (e.key === 'ArrowLeft') {
        setLightboxIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : filteredPhotos.length - 1));
        setLightboxZoom(1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, filteredPhotos.length]);

  const handleToggleLike = (photo: PhotoItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (album.status === 'locked') {
      showToast('Album đã được chốt và khóa chọn ảnh!');
      return;
    }
    const newLiked = !photo.isLiked;
    onUpdatePhoto(album.id, photo.id, { isLiked: newLiked });
    if (newLiked) {
      showToast(`Đã thích ảnh ${photo.filename}`);
    }
  };

  const handleToggleLargePrint = (photo: PhotoItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (album.status === 'locked') {
      showToast('Album đã được chốt và khóa chọn ảnh!');
      return;
    }
    const newStatus = !photo.isLargePrint;
    // Nếu chọn ảnh phóng thì tự động thích ảnh đó luôn
    onUpdatePhoto(album.id, photo.id, { 
      isLargePrint: newStatus,
      isLiked: newStatus ? true : photo.isLiked
    });
    showToast(newStatus ? `Đã chọn ${photo.filename} làm ảnh phóng cổng!` : `Đã hủy chọn ảnh phóng ${photo.filename}`);
  };

  const handleToggleFramed = (photo: PhotoItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (album.status === 'locked') {
      showToast('Album đã được chốt và khóa chọn ảnh!');
      return;
    }
    const newStatus = !photo.isFramed;
    // Nếu chọn ảnh khung thì tự động thích ảnh đó luôn
    onUpdatePhoto(album.id, photo.id, { 
      isFramed: newStatus,
      isLiked: newStatus ? true : photo.isLiked
    });
    showToast(newStatus ? `Đã chọn ${photo.filename} làm ảnh khung để bàn!` : `Đã hủy chọn ảnh khung ${photo.filename}`);
  };

  const handleOpenNoteModal = (photo: PhotoItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setNoteEditPhotoId(photo.id);
    setTempNoteText(photo.clientNote || '');
  };

  const handleSaveNote = () => {
    if (noteEditPhotoId) {
      onUpdatePhoto(album.id, noteEditPhotoId, { clientNote: tempNoteText });
      setNoteEditPhotoId(null);
      showToast('Đã lưu ghi chú cho ảnh!');
    }
  };

  const handleShareLink = () => {
    const origin = window.location.origin;
    const path = window.location.pathname;
    const clientUrl = `${origin}${path}?album=${album.id}&mode=client`;
    navigator.clipboard.writeText(clientUrl);
    showToast('Đã sao chép link gửi khách (Giao diện tối giản chỉ chọn ảnh)!');
  };

  const handleConfirmLockSelection = () => {
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 }
    });
    onToggleLockAlbum(album.id);
    setShowConfirmLockModal(false);
    showToast('🎉 Chúc mừng! Đã chốt danh sách chọn ảnh thành công!');
  };

  const currentLightboxPhoto = lightboxIndex !== null ? filteredPhotos[lightboxIndex] : null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-xs font-medium animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Back button & quick studio control (Chỉ hiện khi ở quyền Studio Admin) */}
      {!isClientMode ? (
        <div className="bg-white border-b border-slate-200 px-4 sm:px-8 py-2.5 flex items-center justify-between text-xs">
          <button
            onClick={onBackToDashboard}
            className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 font-medium transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại Quản lý Album</span>
          </button>

          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-slate-500 hidden sm:inline">
              Khách: <strong className="text-slate-800">{album.clientName}</strong>
            </span>
            {onEnterClientMode && (
              <button
                onClick={onEnterClientMode}
                className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold rounded-lg transition-colors cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Xem thử link khách</span>
              </button>
            )}
            <button
              onClick={() => onOpenEditModal(album)}
              className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-slate-500" />
              <span>Sửa album</span>
            </button>
            <button
              onClick={() => onOpenRawModal(album)}
              className="flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-600 hover:bg-rose-100 font-semibold rounded-lg transition-colors cursor-pointer"
            >
              <HardDrive className="w-3.5 h-3.5" />
              <span>Sao chép file RAW ổ cứng</span>
            </button>
          </div>
        </div>
      ) : (
        /* Header tối giản cho khách hàng: Chỉ có Logo Studio + Tên Album + Nút Chốt danh sách */
        <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 shadow-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#996515] via-[#D4AF37] to-[#F5D77F] flex items-center justify-center text-slate-900 shadow-xs font-bold">
                <Camera className="w-5 h-5 text-slate-900" />
              </div>
              <div>
                <span
                  className="font-bold tracking-wider text-xl sm:text-2xl block leading-tight"
                  style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    color: '#D4AF37',
                    textShadow: '0 2px 4px rgba(0, 0, 0, 0.25), 0 1px 2px rgba(180, 130, 20, 0.4)'
                  }}
                >
                  LAVENDER STUDIO
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  {album.title} · {album.clientName}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 text-xs font-semibold">
                <span className="flex items-center gap-1 text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg">
                  <Heart className="w-3.5 h-3.5 fill-rose-600" />
                  <span>{likedCount} đã chọn</span>
                </span>
              </div>

              <button
                onClick={() => setShowConfirmLockModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Chốt danh sách ({likedCount})</span>
              </button>
            </div>
          </div>
        </header>
      )}

      {/* 1. Header Banner (Khổ lớn với tên dâu rể / sự kiện) */}
      <div className="relative w-full h-56 sm:h-72 lg:h-80 bg-slate-900 overflow-hidden">
        <img
          src={album.coverUrl}
          alt={album.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover opacity-85"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

        <div className="absolute bottom-6 left-4 sm:left-8 right-4 text-white z-10">
          <div className="flex items-center gap-2 text-xs font-semibold text-rose-400 mb-1 tracking-wider uppercase">
            <span>Album Chọn Ảnh</span>
            {album.status === 'locked' && (
              <span className="bg-amber-400 text-amber-950 px-2 py-0.5 rounded text-[10px] font-bold">
                ĐÃ CHỐT DANH SÁCH
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight drop-shadow-md text-white">
            {album.title}
          </h1>
          <p className="text-sm sm:text-base text-white/80 mt-1 font-medium">
            {album.clientName}
          </p>
        </div>
      </div>

      {/* 2. Action & Stats Toolbar */}
      <div className={`bg-white border-b border-slate-200 sticky ${isClientMode ? 'top-16' : 'top-16'} z-30 shadow-xs`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Left Stats counters */}
            <div className="flex items-center gap-4 text-xs font-semibold">
              <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
                <ImageIcon className="w-3.5 h-3.5" />
                <span className="tabular-nums">{totalPhotosCount}</span>
                <span className="font-normal text-[11px] text-emerald-600 hidden sm:inline">ảnh</span>
              </div>

              <div className="flex items-center gap-1.5 text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md">
                <Heart className="w-3.5 h-3.5 fill-rose-600 text-rose-600" />
                <span className="tabular-nums">{likedCount}</span>
                <span className="font-normal text-[11px] text-rose-600 hidden sm:inline">thả tim</span>
              </div>

              <div className="flex items-center gap-1.5 text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md">
                <Frame className="w-3.5 h-3.5 text-indigo-600" />
                <span className="tabular-nums">{largePrintCount}</span>
                <span className="font-normal text-[11px] text-indigo-600 hidden sm:inline">ảnh cổng</span>
              </div>

              <div className="flex items-center gap-1.5 text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md">
                <Bookmark className="w-3.5 h-3.5 text-amber-600" />
                <span className="tabular-nums">{framedCount}</span>
                <span className="font-normal text-[11px] text-amber-600 hidden sm:inline">ảnh khung</span>
              </div>

              <div className="flex items-center gap-1.5 text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md">
                <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                <span className="tabular-nums">{hasNoteCount}</span>
                <span className="font-normal text-[11px] text-slate-500 hidden sm:inline">ghi chú</span>
              </div>
            </div>

            {/* Right Action buttons */}
            <div className="flex items-center gap-2 text-xs">
              {!isClientMode ? (
                <>
                  <button
                    onClick={() => onOpenEditModal(album)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors cursor-pointer"
                    title="Sửa thông tin album, đổi ảnh bìa, hoặc nạp lại ảnh từ Drive"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                    <span>Sửa album</span>
                  </button>

                  <button
                    onClick={() => onToggleLockAlbum(album.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 font-medium rounded-lg transition-colors cursor-pointer ${
                      album.status === 'locked'
                        ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {album.status === 'locked' ? (
                      <>
                        <Unlock className="w-3.5 h-3.5" />
                        <span>Mở khoá</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        <span>Khoá album</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleShareLink}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Chia sẻ link khách</span>
                  </button>
                </>
              ) : null}

              <button
                onClick={() => setShowConfirmLockModal(true)}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Chốt danh sách</span>
              </button>
            </div>
          </div>
        </div>

        {/* 3. Category Filter Tabs (Zero-pill, clean segmented buttons) */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-100">
          <div className="flex items-center gap-2 overflow-x-auto py-2.5 no-scrollbar">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Tất cả ({totalPhotosCount})
            </button>

            <button
              onClick={() => setActiveTab('liked')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'liked'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${activeTab === 'liked' ? 'fill-white' : 'fill-rose-500 text-rose-500'}`} />
              Đã thả tim ({likedCount})
            </button>

            <button
              onClick={() => setActiveTab('largePrint')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'largePrint'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Frame className="w-3.5 h-3.5" />
              Ảnh phóng lớn / Cổng ({largePrintCount})
            </button>

            <button
              onClick={() => setActiveTab('framed')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'framed'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              Ảnh khung để bàn ({framedCount})
            </button>

            <button
              onClick={() => setActiveTab('hasNote')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'hasNote'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Có ghi chú ({hasNoteCount})
            </button>

            <button
              onClick={() => setActiveTab('unselected')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === 'unselected'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Chưa chọn ({totalPhotosCount - likedCount})
            </button>
          </div>
        </div>
      </div>

      {/* 4. Photos Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {filteredPhotos.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
            <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-700">Chưa có ảnh nào trong mục này</h3>
            <p className="text-xs text-slate-400 mt-1">
              Hãy quay lại tab "Tất cả" và nhấn tim hoặc đánh dấu ảnh bạn yêu thích.
            </p>
            <button
              onClick={() => setActiveTab('all')}
              className="mt-4 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors"
            >
              Xem tất cả ảnh
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {filteredPhotos.map((photo, index) => {
              const isSelected = photo.isLiked || photo.isLargePrint || photo.isFramed;

              return (
                <div
                  key={photo.id}
                  onClick={() => setLightboxIndex(index)}
                  className={`group relative flex flex-col bg-white rounded-xl overflow-hidden border transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'border-rose-300 ring-2 ring-rose-500/20 shadow-md'
                      : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                  }`}
                >
                  {/* Photo Container */}
                  <div className="relative aspect-4/3 w-full bg-slate-100 overflow-hidden">
                    <img
                      src={photo.thumbnailUrl}
                      alt={photo.filename}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Gradient scrim for top buttons readability */}
                    <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />

                    {/* Top Right Heart Action Button (Shotpik prominent red heart) */}
                    <button
                      type="button"
                      onClick={(e) => handleToggleLike(photo, e)}
                      title={photo.isLiked ? 'Bỏ thích' : 'Thích ảnh này'}
                      className="absolute top-2.5 right-2.5 z-20 p-2 rounded-full transition-all transform active:scale-90 hover:scale-110 cursor-pointer bg-black/40 hover:bg-black/60 backdrop-blur-xs"
                    >
                      <Heart
                        className={`w-5 h-5 transition-colors ${
                          photo.isLiked
                            ? 'fill-rose-500 text-rose-500 drop-shadow-sm'
                            : 'text-white hover:text-rose-300'
                        }`}
                      />
                    </button>

                    {/* Top Left Tags / Badges */}
                    <div className="absolute top-2.5 left-2.5 z-20 flex flex-col gap-1.5">
                      {photo.isLargePrint && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold bg-indigo-600/90 text-white rounded-md shadow-xs backdrop-blur-xs">
                          <Frame className="w-3 h-3" /> Ảnh cổng 60x90
                        </span>
                      )}
                      {photo.isFramed && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold bg-amber-500/90 text-white rounded-md shadow-xs backdrop-blur-xs">
                          <Bookmark className="w-3 h-3" /> Khung để bàn
                        </span>
                      )}
                    </div>

                    {/* Hover Quick Action Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                      <button
                        type="button"
                        onClick={(e) => handleToggleLargePrint(photo, e)}
                        className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg backdrop-blur-md transition-colors flex items-center gap-1 ${
                          photo.isLargePrint
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white/90 text-slate-800 hover:bg-white'
                        }`}
                      >
                        <Frame className="w-3.5 h-3.5" />
                        <span>{photo.isLargePrint ? 'Ảnh cổng ✓' : 'Làm ảnh cổng'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleToggleFramed(photo, e)}
                        className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg backdrop-blur-md transition-colors flex items-center gap-1 ${
                          photo.isFramed
                            ? 'bg-amber-600 text-white'
                            : 'bg-white/90 text-slate-800 hover:bg-white'
                        }`}
                      >
                        <Bookmark className="w-3.5 h-3.5" />
                        <span>{photo.isFramed ? 'Khung bàn ✓' : 'Làm khung bàn'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Photo Info Bar Below */}
                  <div className="p-3 flex flex-col gap-1.5 bg-white">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 tracking-tight font-mono">
                        {photo.filename}
                      </span>

                      <button
                        type="button"
                        onClick={(e) => handleOpenNoteModal(photo, e)}
                        className={`p-1 rounded-md text-xs transition-colors flex items-center gap-1 cursor-pointer ${
                          photo.clientNote && photo.clientNote.trim() !== ''
                            ? 'text-rose-600 bg-rose-50 hover:bg-rose-100 font-semibold'
                            : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                        }`}
                        title="Thêm hoặc sửa ghi chú cho ảnh"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        {photo.clientNote && photo.clientNote.trim() !== '' && (
                          <span className="text-[10px]">Đã ghi chú</span>
                        )}
                      </button>
                    </div>

                    {/* Note Preview if exists */}
                    {photo.clientNote && photo.clientNote.trim() !== '' && (
                      <p className="text-[11px] text-slate-600 line-clamp-1 italic bg-slate-50 p-1.5 rounded border border-slate-100">
                        "{photo.clientNote}"
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Minimal Client Footer */}
      {isClientMode && (
        <footer className="mt-16 py-8 border-t border-slate-200 text-center text-xs text-slate-400">
          <p className="font-medium text-slate-600">© SHOTPIK STUDIO · Cổng chọn ảnh & ghi chú trực tuyến</p>
          <p className="text-[11px] text-slate-400 mt-1">Cảm ơn bạn đã lựa chọn dịch vụ của Studio!</p>
          {onExitClientMode && (
            <div className="mt-4">
              <button
                onClick={onExitClientMode}
                className="text-[11px] text-slate-400 hover:text-slate-600 underline cursor-pointer"
              >
                Quay lại giao diện Quản trị Studio
              </button>
            </div>
          )}
        </footer>
      )}

      {/* 6. Fullscreen Lightbox Modal */}
      {currentLightboxPhoto && lightboxIndex !== null && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-between animate-in fade-in duration-200">
          {/* Lightbox Top Header */}
          <div className="px-6 py-4 flex items-center justify-between text-white z-20 bg-gradient-to-b from-black/80 to-transparent">
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold font-mono tracking-wider">
                {currentLightboxPhoto.filename}
              </span>
              <span className="text-xs text-white/60">
                ({lightboxIndex + 1} / {filteredPhotos.length})
              </span>
              {currentLightboxPhoto.categoryTag && (
                <span className="hidden sm:inline-block text-xs bg-white/20 px-2 py-0.5 rounded text-white/90">
                  {currentLightboxPhoto.categoryTag}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setLightboxZoom(prev => (prev === 1 ? 1.75 : 1))}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                title={lightboxZoom === 1 ? 'Phóng to' : 'Thu nhỏ'}
              >
                {lightboxZoom === 1 ? <ZoomIn className="w-4 h-4" /> : <ZoomOut className="w-4 h-4" />}
              </button>

              <button
                onClick={() => setLightboxIndex(null)}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                title="Đóng xem ảnh"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Lightbox Main Image & Navigation Arrows */}
          <div className="relative flex-1 flex items-center justify-center p-4 overflow-hidden">
            {/* Prev Button */}
            <button
              onClick={() => setLightboxIndex((lightboxIndex > 0 ? lightboxIndex - 1 : filteredPhotos.length - 1))}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-black/50 hover:bg-black/80 text-white transition-all transform hover:scale-110 cursor-pointer"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            {/* Next Button */}
            <button
              onClick={() => setLightboxIndex((lightboxIndex < filteredPhotos.length - 1 ? lightboxIndex + 1 : 0))}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-black/50 hover:bg-black/80 text-white transition-all transform hover:scale-110 cursor-pointer"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Image itself */}
            <div
              className="transition-transform duration-200 max-w-full max-h-[75vh] flex items-center justify-center"
              style={{ transform: `scale(${lightboxZoom})` }}
            >
              <img
                src={currentLightboxPhoto.fullUrl}
                alt={currentLightboxPhoto.filename}
                referrerPolicy="no-referrer"
                className="max-w-full max-h-[75vh] object-contain select-none rounded-lg shadow-2xl"
              />
            </div>
          </div>

          {/* Lightbox Bottom Controls & Note Input */}
          <div className="bg-slate-900/90 backdrop-blur-md border-t border-white/10 px-6 py-4 text-white z-20">
            <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
              {/* Category Toggles */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleToggleLike(currentLightboxPhoto)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    currentLightboxPhoto.isLiked
                      ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${currentLightboxPhoto.isLiked ? 'fill-white' : ''}`} />
                  <span>{currentLightboxPhoto.isLiked ? 'Đã thích ❤️' : 'Thích ảnh'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleLargePrint(currentLightboxPhoto)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    currentLightboxPhoto.isLargePrint
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                >
                  <Frame className="w-4 h-4" />
                  <span>{currentLightboxPhoto.isLargePrint ? 'Ảnh cổng 60x90 ✓' : 'Chọn ảnh cổng'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleFramed(currentLightboxPhoto)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    currentLightboxPhoto.isFramed
                      ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                >
                  <Bookmark className="w-4 h-4" />
                  <span>{currentLightboxPhoto.isFramed ? 'Khung để bàn ✓' : 'Chọn khung để bàn'}</span>
                </button>
              </div>

              {/* Quick Note Input in Lightbox */}
              <div className="flex items-center gap-2 w-full md:w-auto flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Ghi chú yêu cầu chỉnh sửa cho ảnh này..."
                  value={currentLightboxPhoto.clientNote || ''}
                  onChange={(e) => onUpdatePhoto(album.id, currentLightboxPhoto.id, { clientNote: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-3.5 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Edit Note Modal (from photo card) */}
      {noteEditPhotoId && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-rose-600" />
                Ghi chú cho ảnh
              </h3>
              <button
                onClick={() => setNoteEditPhotoId(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4">
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Yêu cầu chỉnh sửa cụ thể cho thợ Photoshop:
              </label>
              <textarea
                rows={4}
                value={tempNoteText}
                onChange={(e) => setTempNoteText(e.target.value)}
                placeholder="Ví dụ: Làm sáng da dâu rể, bóp eo nhẹ, xóa người đi đường phía sau, chỉnh tone màu vintage..."
                className="w-full p-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
              <p className="text-[11px] text-slate-400 mt-1.5">
                Ghi chú này sẽ được lưu kèm vào danh sách xuất file cho bộ phận hậu kỳ của studio.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setNoteEditPhotoId(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleSaveNote}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors"
              >
                Lưu ghi chú
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Confirm Selection & Lock Album Modal */}
      {showConfirmLockModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="text-center pb-4">
              <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Xác nhận chốt danh sách chọn ảnh?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Studio sẽ căn cứ vào danh sách này để tiến hành lọc file RAW và thiết kế hậu kỳ cho bạn.
              </p>
            </div>

            {/* Selection Summary */}
            <div className="bg-slate-50 rounded-xl p-4 my-4 space-y-2.5 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                <span className="text-slate-600 font-medium">❤️ Tổng số ảnh đã thả tim:</span>
                <span className="font-bold text-rose-600 text-sm tabular-nums">{likedCount} ảnh</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                <span className="text-slate-600 font-medium">🖼️ Ảnh phóng lớn & cổng tiệc:</span>
                <span className="font-bold text-indigo-600 text-sm tabular-nums">{largePrintCount} ảnh</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                <span className="text-slate-600 font-medium">🪟 Ảnh khung để bàn gallery:</span>
                <span className="font-bold text-amber-600 text-sm tabular-nums">{framedCount} ảnh</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-medium">📝 Số ảnh kèm ghi chú:</span>
                <span className="font-bold text-slate-800 text-sm tabular-nums">{hasNoteCount} ảnh</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowConfirmLockModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Tôi muốn xem lại
              </button>

              <button
                onClick={handleConfirmLockSelection}
                className="px-5 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md shadow-rose-600/30 transition-all cursor-pointer"
              >
                Hoàn tất & Chốt danh sách
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
