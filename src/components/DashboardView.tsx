import React, { useState } from 'react';
import { Plus, Heart, MessageSquare, MoreHorizontal, Search, ArrowUpDown, Grid, LayoutList, Share2, HardDrive, Lock, Unlock, ExternalLink, Trash2, CheckCircle2, Edit3 } from 'lucide-react';
import { Album } from '../types/album';

interface DashboardViewProps {
  albums: Album[];
  onSelectAlbum: (album: Album) => void;
  onOpenCreateModal: () => void;
  onOpenRawModalForAlbum: (album: Album) => void;
  onOpenEditModalForAlbum: (album: Album) => void;
  onToggleLockAlbum: (albumId: string) => void;
  onDeleteAlbum: (albumId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  albums,
  onSelectAlbum,
  onOpenCreateModal,
  onOpenRawModalForAlbum,
  onOpenEditModalForAlbum,
  onToggleLockAlbum,
  onDeleteAlbum
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const filteredAlbums = albums.filter(a =>
    a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.clientName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleShareLink = (album: Album, e: React.MouseEvent) => {
    e.stopPropagation();
    const origin = window.location.origin;
    const path = window.location.pathname;
    const clientUrl = `${origin}${path}?album=${album.id}&mode=client`;
    navigator.clipboard.writeText(clientUrl);
    setCopyFeedback(album.id);
    setTimeout(() => setCopyFeedback(null), 2500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Sub-bar inspired directly by Shotpik screenshot */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-200 text-sm">
        <div className="flex flex-wrap items-center gap-6 text-slate-600">
          <button className="flex items-center gap-1.5 hover:text-slate-900 transition-colors cursor-pointer">
            <ArrowUpDown className="w-4 h-4 text-slate-500" />
            <span>Sắp xếp</span>
          </button>

          <button className="flex items-center gap-1.5 hover:text-slate-900 transition-colors cursor-pointer">
            <Grid className="w-4 h-4 text-slate-500" />
            <span>Cách hiển thị</span>
          </button>

          <div className="hidden sm:flex items-center gap-4 text-xs text-slate-500 border-l border-slate-200 pl-4">
            <div>
              Tổng số album đã tạo: <strong className="text-slate-900 font-semibold tabular-nums">194</strong>
            </div>
            <span aria-hidden="true">·</span>
            <div>
              Số album tạo mới trong tháng này: <strong className="text-slate-900 font-semibold tabular-nums">12/5</strong>
            </div>
            <span aria-hidden="true">·</span>
            <div>
              Số website album: <strong className="text-slate-900 font-semibold tabular-nums">0/1</strong>
            </div>
          </div>

          <div className="hidden xl:inline-flex items-center gap-1.5 px-3 py-1 bg-amber-400 text-amber-950 font-semibold text-xs rounded-full shadow-xs">
            <span>🎁 Nhận thưởng</span>
          </div>
        </div>

        {/* Search bar */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm album..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all"
          />
        </div>
      </div>

      {/* Copy link toast feedback */}
      {copyFeedback && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-xs font-medium animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Đã sao chép đường dẫn chọn ảnh cho khách hàng!</span>
        </div>
      )}

      {/* Grid of albums */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pt-6">
        {/* + Tạo album Card (Shotpik dashed card) */}
        <button
          onClick={onOpenCreateModal}
          className="group relative flex flex-col items-center justify-center min-h-[300px] border-2 border-dashed border-rose-300 hover:border-rose-500 rounded-2xl bg-white hover:bg-rose-50/40 transition-all p-6 text-center cursor-pointer shadow-xs"
        >
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 group-hover:scale-110 flex items-center justify-center transition-transform mb-3">
            <Plus className="w-6 h-6" />
          </div>
          <span className="text-base font-semibold text-slate-800 group-hover:text-rose-600 transition-colors">
            Tạo album
          </span>
          <p className="text-xs text-slate-400 mt-1 max-w-[200px]">
            Dán link Google Drive hoặc ID thư mục công khai
          </p>
        </button>

        {/* Existing Album Cards */}
        {filteredAlbums.map((album) => {
          const heartCount = album.photos.filter(p => p.isLiked).length;
          const noteCount = album.photos.filter(p => p.clientNote && p.clientNote.trim() !== '').length;
          const largeCount = album.photos.filter(p => p.isLargePrint).length;
          const framedCount = album.photos.filter(p => p.isFramed).length;

          return (
            <div
              key={album.id}
              onClick={() => onSelectAlbum(album)}
              className="group relative flex flex-col justify-between min-h-[300px] rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all cursor-pointer bg-slate-900 text-white border border-slate-100"
            >
              {/* Background Cover Image with measured scrim */}
              <div className="absolute inset-0 z-0">
                <img
                  src={album.coverUrl}
                  alt={album.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
              </div>

              {/* Card Header Status */}
              <div className="relative z-10 p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {album.status === 'locked' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold bg-slate-900/80 backdrop-blur-sm text-amber-300 rounded-md">
                      <Lock className="w-3 h-3" /> Đã chốt
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold bg-emerald-500/80 backdrop-blur-sm text-white rounded-md">
                      Đang chọn
                    </span>
                  )}
                  {largeCount > 0 && (
                    <span className="text-[10px] bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded text-white">
                      {largeCount} ảnh phóng
                    </span>
                  )}
                </div>

                {/* More Action Menu Trigger */}
                <div className="relative" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => setMenuOpenId(menuOpenId === album.id ? null : album.id)}
                    className="p-1.5 rounded-lg bg-black/40 hover:bg-black/70 text-white/90 transition-colors"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>

                  {/* Dropdown Menu */}
                  {menuOpenId === album.id && (
                    <div className="absolute right-0 top-8 z-50 w-52 bg-white text-slate-800 rounded-xl shadow-xl border border-slate-100 py-1.5 text-xs animate-in fade-in duration-150">
                      <button
                        onClick={() => {
                          setMenuOpenId(null);
                          onSelectAlbum(album);
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2 font-medium"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                        Vào trang chọn ảnh
                      </button>

                      <button
                        onClick={() => {
                          setMenuOpenId(null);
                          onOpenEditModalForAlbum(album);
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2 font-medium text-slate-800"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-rose-500" />
                        Sửa thông tin album
                      </button>

                      <button
                        onClick={(e) => {
                          setMenuOpenId(null);
                          handleShareLink(album, e);
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2 font-medium"
                      >
                        <Share2 className="w-3.5 h-3.5 text-slate-500" />
                        Sao chép link gửi khách
                      </button>

                      <button
                        onClick={() => {
                          setMenuOpenId(null);
                          onOpenRawModalForAlbum(album);
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-rose-50 text-rose-600 flex items-center gap-2 font-medium"
                      >
                        <HardDrive className="w-3.5 h-3.5 text-rose-500" />
                        Lọc file RAW ổ cứng
                      </button>

                      <button
                        onClick={() => {
                          setMenuOpenId(null);
                          onToggleLockAlbum(album.id);
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2"
                      >
                        {album.status === 'locked' ? (
                          <>
                            <Unlock className="w-3.5 h-3.5 text-slate-500" />
                            Mở khóa cho khách chọn lại
                          </>
                        ) : (
                          <>
                            <Lock className="w-3.5 h-3.5 text-slate-500" />
                            Khóa album (Chốt danh sách)
                          </>
                        )}
                      </button>

                      <div className="border-t border-slate-100 my-1" />

                      <button
                        onClick={() => {
                          setMenuOpenId(null);
                          if (confirm(`Bạn có chắc muốn xóa album "${album.title}"?`)) {
                            onDeleteAlbum(album.id);
                          }
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-rose-50 text-rose-600 flex items-center gap-2"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Xóa album này
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Card Bottom Meta (Title, Date, Heart, Comment) */}
              <div className="relative z-10 p-5">
                <h3 className="text-lg font-bold tracking-tight text-white line-clamp-1 mb-1">
                  {album.title}
                </h3>
                <p className="text-xs text-white/70 mb-3">
                  {album.clientName} · Ngày tạo: {album.createdAt}
                </p>

                {/* Footer counters exactly matching Shotpik */}
                <div className="flex items-center justify-between pt-2 border-t border-white/20 text-xs text-white/90 font-medium">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5">
                      <Heart className={`w-3.5 h-3.5 ${heartCount > 0 ? 'fill-rose-500 text-rose-500' : 'text-white/70'}`} />
                      <span className="tabular-nums font-semibold">{heartCount}</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-white/70" />
                      <span className="tabular-nums font-semibold">{noteCount}</span>
                    </span>
                  </div>

                  <span className="text-[11px] text-white/70">
                    {album.photos.length} ảnh
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
