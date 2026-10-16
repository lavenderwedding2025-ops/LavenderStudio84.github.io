import React, { useState } from 'react';
import { 
  Edit3, X, Save, RefreshCw, Image as ImageIcon, Link as LinkIcon, 
  Trash2, Plus, Check, CheckCircle2, AlertCircle, Sparkles, FolderSync
} from 'lucide-react';
import { Album, PhotoItem } from '../types/album';
import { fetchDriveFolderPhotos, parseIndividualDriveLinks, extractDriveFolderId } from '../utils/driveParser';

interface EditAlbumModalProps {
  album: Album;
  isOpen: boolean;
  onClose: () => void;
  onSaveAlbum: (updatedAlbum: Album) => void;
}

export const EditAlbumModal: React.FC<EditAlbumModalProps> = ({
  album,
  isOpen,
  onClose,
  onSaveAlbum
}) => {
  const [title, setTitle] = useState(album.title);
  const [clientName, setClientName] = useState(album.clientName);
  const [coverUrl, setCoverUrl] = useState(album.coverUrl);
  const [driveFolderUrl, setDriveFolderUrl] = useState(album.driveFolderUrl);
  const [maxLargePrint, setMaxLargePrint] = useState(album.settings.maxLargePrint || 2);
  const [maxFramed, setMaxFramed] = useState(album.settings.maxFramed || 5);
  const [maxHeart, setMaxHeart] = useState(album.settings.maxHeart || 60);
  const [status, setStatus] = useState(album.status);
  const [photos, setPhotos] = useState<PhotoItem[]>(album.photos);

  const [isSyncingDrive, setIsSyncingDrive] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'photos'>('info');

  if (!isOpen) return null;

  // Xử lý nạp / đồng bộ ảnh trực tiếp từ link Google Drive mới
  const handleSyncFromDrive = async () => {
    if (!driveFolderUrl.trim()) {
      setSyncStatusMsg({ type: 'error', text: 'Vui lòng nhập đường dẫn thư mục Google Drive trước khi đồng bộ.' });
      return;
    }

    setIsSyncingDrive(true);
    setSyncStatusMsg(null);

    try {
      const result = await fetchDriveFolderPhotos(driveFolderUrl);
      if (result.success && result.photos.length > 0) {
        // Hợp nhất danh sách ảnh: giữ lại các ảnh cũ đã có ghi chú/thả tim nếu trùng filename, và thêm ảnh mới
        const existingMap = new Map(photos.map(p => [p.baseName, p]));
        const mergedPhotos: PhotoItem[] = result.photos.map(newP => {
          const old = existingMap.get(newP.baseName);
          if (old) {
            return {
              ...newP,
              isLiked: old.isLiked,
              isLargePrint: old.isLargePrint,
              isFramed: old.isFramed,
              clientNote: old.clientNote
            };
          }
          return newP;
        });

        setPhotos(mergedPhotos);
        // Tự động cập nhật cover nếu cần
        if (mergedPhotos[0]?.fullUrl) {
          setCoverUrl(mergedPhotos[0].fullUrl);
        }

        setSyncStatusMsg({
          type: 'success',
          text: `Đã nạp thành công ${result.photos.length} ảnh trực tiếp từ Google Drive!`
        });
      } else {
        setSyncStatusMsg({
          type: 'error',
          text: result.message || 'Không tìm thấy ảnh nào trong thư mục Google Drive này.'
        });
      }
    } catch (err: any) {
      setSyncStatusMsg({
        type: 'error',
        text: err.message || 'Có lỗi xảy ra khi kết nối tới Google Drive.'
      });
    } finally {
      setIsSyncingDrive(false);
    }
  };

  const handleDeletePhoto = (photoId: string) => {
    setPhotos(prev => prev.filter(p => p.id !== photoId));
  };

  const handleSelectCover = (photoUrl: string) => {
    setCoverUrl(photoUrl);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const updatedAlbum: Album = {
      ...album,
      title: title.trim(),
      clientName: clientName.trim(),
      coverUrl: coverUrl.trim(),
      driveFolderUrl: driveFolderUrl.trim(),
      driveFolderId: extractDriveFolderId(driveFolderUrl) || album.driveFolderId,
      status,
      photos,
      settings: {
        ...album.settings,
        maxHeart,
        maxLargePrint,
        maxFramed
      }
    };

    onSaveAlbum(updatedAlbum);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-150 my-8">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
              <Edit3 className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Sửa Thông Tin Album
              </h2>
              <p className="text-xs text-slate-500">
                Cập nhật tên album, link Google Drive, ảnh bìa và danh sách ảnh
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

        {/* Tab switch */}
        <div className="flex items-center gap-2 pt-4 border-b border-slate-100 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('info')}
            className={`pb-2.5 px-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'info'
                ? 'border-rose-600 text-rose-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Thông tin & Cài đặt Drive
          </button>
          <button
            onClick={() => setActiveTab('photos')}
            className={`pb-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'photos'
                ? 'border-rose-600 text-rose-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Quản lý ảnh ({photos.length})</span>
          </button>
        </div>

        {/* Status Messages */}
        {syncStatusMsg && (
          <div
            className={`mt-4 p-3 rounded-xl text-xs flex items-center gap-2 font-medium ${
              syncStatusMsg.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border border-rose-200 text-rose-800'
            }`}
          >
            {syncStatusMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{syncStatusMsg.text}</span>
          </div>
        )}

        {/* Tab 1: Info & Drive Settings */}
        {activeTab === 'info' && (
          <form onSubmit={handleSave} className="py-4 space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tên Album <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tên Khách hàng / Dâu rể <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>
            </div>

            {/* Google Drive Link with Re-sync button */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
              <label className="block font-semibold text-slate-800 mb-1">
                Đường dẫn thư mục Google Drive:
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={driveFolderUrl}
                    onChange={(e) => setDriveFolderUrl(e.target.value)}
                    placeholder="https://drive.google.com/drive/folders/..."
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-xs"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSyncFromDrive}
                  disabled={isSyncingDrive}
                  className={`px-3.5 py-2 text-xs font-semibold rounded-lg text-white flex items-center gap-1.5 transition-colors cursor-pointer ${
                    isSyncingDrive
                      ? 'bg-slate-400 cursor-not-allowed'
                      : 'bg-slate-900 hover:bg-slate-800'
                  }`}
                >
                  <FolderSync className={`w-3.5 h-3.5 ${isSyncingDrive ? 'animate-spin' : ''}`} />
                  <span>{isSyncingDrive ? 'Đang nạp...' : 'Nạp lại ảnh từ Drive'}</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5">
                Nhấn "Nạp lại ảnh từ Drive" để hệ thống quét lại các ảnh mới tải lên trong thư mục Google Drive này.
              </p>
            </div>

            {/* Cover image picker */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Ảnh bìa Album (Cover)
              </label>
              <div className="flex items-center gap-3">
                <div className="w-16 h-12 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                  <img
                    src={coverUrl}
                    alt="Cover"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <input
                  type="text"
                  value={coverUrl}
                  onChange={(e) => setCoverUrl(e.target.value)}
                  placeholder="URL ảnh bìa..."
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Hoặc bạn có thể chọn trực tiếp từ danh sách ảnh trong tab "Quản lý ảnh".
              </p>
            </div>

            {/* Limits & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Giới hạn ảnh phóng cổng
                </label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={maxLargePrint}
                  onChange={(e) => setMaxLargePrint(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Giới hạn ảnh khung để bàn
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={maxFramed}
                  onChange={(e) => setMaxFramed(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Trạng thái Album
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                >
                  <option value="selecting">Đang chọn (Khách có thể chọn)</option>
                  <option value="locked">Đã chốt (Khóa chọn ảnh)</option>
                  <option value="completed">Đã hoàn thành hậu kỳ</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors cursor-pointer"
              >
                Hủy
              </button>

              <button
                type="submit"
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Lưu thay đổi</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Photos Management */}
        {activeTab === 'photos' && (
          <div className="py-4 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700">
                Tổng cộng {photos.length} ảnh trong album
              </span>
              <span className="text-slate-400 text-[11px]">
                Nhấn vào ảnh để đặt làm Ảnh Bìa (Cover)
              </span>
            </div>

            <div className="max-h-80 overflow-y-auto grid grid-cols-2 sm:grid-cols-4 gap-3 p-1">
              {photos.map((p) => {
                const isCurrentCover = p.fullUrl === coverUrl || p.thumbnailUrl === coverUrl;

                return (
                  <div
                    key={p.id}
                    onClick={() => handleSelectCover(p.fullUrl)}
                    className={`group relative rounded-xl overflow-hidden border aspect-4/3 cursor-pointer transition-all ${
                      isCurrentCover
                        ? 'ring-2 ring-rose-500 border-rose-500 shadow-md'
                        : 'border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    <img
                      src={p.thumbnailUrl}
                      alt={p.filename}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />

                    {isCurrentCover && (
                      <span className="absolute top-1.5 left-1.5 bg-rose-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs">
                        Ảnh Bìa
                      </span>
                    )}

                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-1.5 text-white flex items-center justify-between text-[10px]">
                      <span className="truncate max-w-[80px] font-mono">{p.filename}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePhoto(p.id);
                        }}
                        className="p-1 hover:bg-rose-600 rounded text-white/80 hover:text-white transition-colors"
                        title="Xóa ảnh này khỏi album"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors cursor-pointer"
              >
                Hủy
              </button>

              <button
                type="button"
                onClick={handleSave}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Lưu album</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
