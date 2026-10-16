import React, { useState } from 'react';
import { Plus, X, Folder, Link as LinkIcon, Check, Image as ImageIcon, Sparkles, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Album, PhotoItem } from '../types/album';
import { extractDriveFolderId, generateSampleDrivePhotos, fetchDriveFolderPhotos, parseIndividualDriveLinks } from '../utils/driveParser';

interface CreateAlbumModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateAlbum: (album: Album) => void;
}

export const CreateAlbumModal: React.FC<CreateAlbumModalProps> = ({
  isOpen,
  onClose,
  onCreateAlbum
}) => {
  const [title, setTitle] = useState('');
  const [clientName, setClientName] = useState('');
  const [driveUrl, setDriveUrl] = useState('');
  const [filePrefix, setFilePrefix] = useState('DSC');
  const [maxLargePrint, setMaxLargePrint] = useState(2);
  const [maxFramed, setMaxFramed] = useState(4);
  const [isLoadingDrive, setIsLoadingDrive] = useState(false);
  const [fetchedDrivePhotos, setFetchedDrivePhotos] = useState<PhotoItem[] | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  if (!isOpen) return null;

  // Xử lý quét và nạp ảnh thực tế từ Drive trước khi tạo
  const handleFetchFromDrive = async () => {
    if (!driveUrl.trim()) {
      setStatusMsg({ type: 'error', text: 'Vui lòng dán link hoặc ID thư mục Google Drive.' });
      return;
    }

    setIsLoadingDrive(true);
    setStatusMsg({ type: 'info', text: 'Đang kết nối với Google Drive để nạp danh sách ảnh...' });

    try {
      const result = await fetchDriveFolderPhotos(driveUrl);
      if (result.success && result.photos.length > 0) {
        setFetchedDrivePhotos(result.photos);
        
        // Tự động điền tên Album nếu chưa nhập
        if (result.folderTitle && !title.trim()) {
          setTitle(result.folderTitle);
        }
        // Tự động gợi ý tên khách hàng nếu chưa nhập
        if (result.folderTitle && !clientName.trim()) {
          const suggestedClient = result.folderTitle.replace(/^[0-9\-\s\._]+/, '').trim() || result.folderTitle;
          setClientName(suggestedClient.startsWith('GĐ') ? suggestedClient.replace('GĐ', 'Gia đình') : `Khách hàng ${suggestedClient}`);
        }

        setStatusMsg({
          type: 'success',
          text: `Đã tìm thấy ${result.photos.length} hình ảnh thực tế từ Google Drive!`
        });
      } else {
        // Kiểm tra xem có paste nhiều link file đơn lẻ không
        const individual = parseIndividualDriveLinks(driveUrl);
        if (individual.length > 0) {
          const mappedPhotos: PhotoItem[] = individual.map((item, idx) => ({
            id: item.id,
            filename: `${filePrefix}_${String(idx + 1).padStart(4, '0')}.JPG`,
            baseName: `${filePrefix}_${String(idx + 1).padStart(4, '0')}`,
            thumbnailUrl: `https://lh3.googleusercontent.com/d/${item.id}=w800`,
            fullUrl: `https://lh3.googleusercontent.com/d/${item.id}=s0`,
            isLiked: false,
            isLargePrint: false,
            isFramed: false,
            clientNote: '',
            driveFileId: item.id
          }));
          setFetchedDrivePhotos(mappedPhotos);
          setStatusMsg({
            type: 'success',
            text: `Đã trích xuất ${mappedPhotos.length} ảnh từ danh sách link Google Drive!`
          });
        } else {
          setStatusMsg({
            type: 'info',
            text: result.message + ' Hệ thống sẽ nạp bộ ảnh cưới mẫu chất lượng cao để bạn trải nghiệm ngay.'
          });
          setFetchedDrivePhotos(null);
        }
      }
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: err.message || 'Lỗi khi kết nối Google Drive.'
      });
    } finally {
      setIsLoadingDrive(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setStatusMsg({ type: 'error', text: 'Vui lòng nhập tên Album!' });
      return;
    }
    if (!clientName.trim()) {
      setStatusMsg({ type: 'error', text: 'Vui lòng nhập tên khách hàng!' });
      return;
    }

    const folderId = extractDriveFolderId(driveUrl) || `drive_${Date.now()}`;
    
    // Sử dụng ảnh đã nạp từ Drive hoặc ảnh mẫu chất lượng cao
    const photos: PhotoItem[] = (fetchedDrivePhotos && fetchedDrivePhotos.length > 0)
      ? fetchedDrivePhotos
      : generateSampleDrivePhotos(filePrefix.trim() || 'DSC', 24);

    const coverUrl = photos[0]?.fullUrl || 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=80';

    const now = new Date();
    const formattedDate = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`;

    const newAlbum: Album = {
      id: `album_${Date.now()}`,
      title: title.trim(),
      clientName: clientName.trim(),
      coverUrl,
      driveFolderUrl: driveUrl.trim() || `https://drive.google.com/drive/folders/${folderId}`,
      driveFolderId: folderId,
      createdAt: formattedDate,
      status: 'selecting',
      photos,
      settings: {
        maxHeart: 60,
        maxLargePrint,
        maxFramed,
        allowClientDownload: true
      }
    };

    onCreateAlbum(newAlbum);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-150 my-8">
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Tạo Album Chọn Ảnh Mới
              </h2>
              <p className="text-xs text-slate-500">
                Nhập link Google Drive để tự động nạp ảnh thực tế cho khách chọn
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {statusMsg && (
          <div className={`mt-4 p-3 text-xs rounded-xl font-medium flex items-center gap-2 ${
            statusMsg.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : statusMsg.type === 'error'
              ? 'bg-rose-50 border border-rose-200 text-rose-800'
              : 'bg-blue-50 border border-blue-200 text-blue-800'
          }`}>
            {statusMsg.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
            {statusMsg.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
            {statusMsg.type === 'info' && <RefreshCw className="w-4 h-4 text-blue-600 shrink-0 animate-spin" />}
            <span>{statusMsg.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="py-4 space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Tên Album hiển thị <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ví dụ: 15-10 AH Minh Tuan hoặc PRE WEDDING DUC - LINH"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Tên Cô dâu & Chú rể / Khách hàng <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ví dụ: Khách hàng Minh Tuấn & Mai Lan"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            />
          </div>

          {/* Google Drive Link Input & Fetch button */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
            <label className="block font-semibold text-slate-800 mb-1">
              Link Thư mục Google Drive (hoặc ID thư mục):
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="https://drive.google.com/drive/folders/... (quyền công khai xem)"
                  value={driveUrl}
                  onChange={(e) => setDriveUrl(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-xs"
                />
              </div>

              <button
                type="button"
                onClick={handleFetchFromDrive}
                disabled={isLoadingDrive}
                className={`px-3.5 py-2 text-xs font-semibold rounded-lg text-white flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                  isLoadingDrive
                    ? 'bg-slate-400 cursor-not-allowed'
                    : 'bg-slate-900 hover:bg-slate-800'
                }`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingDrive ? 'animate-spin' : ''}`} />
                <span>{isLoadingDrive ? 'Đang nạp...' : 'Lấy ảnh từ Drive'}</span>
              </button>
            </div>

            {/* Preview strip if Drive photos fetched */}
            {fetchedDrivePhotos && fetchedDrivePhotos.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-200">
                <span className="text-[11px] font-semibold text-slate-700 block mb-1.5">
                  Xem trước ảnh từ Google Drive ({fetchedDrivePhotos.length} ảnh):
                </span>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {fetchedDrivePhotos.slice(0, 6).map((p) => (
                    <div key={p.id} className="w-14 h-14 rounded-lg overflow-hidden bg-slate-200 shrink-0 border border-slate-200">
                      <img
                        src={p.thumbnailUrl}
                        alt={p.filename}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                  {fetchedDrivePhotos.length > 6 && (
                    <div className="w-14 h-14 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] text-slate-500 font-bold shrink-0">
                      +{fetchedDrivePhotos.length - 6} ảnh
                    </div>
                  )}
                </div>
              </div>
            )}

            <p className="text-[11px] text-slate-400 mt-1.5">
              Hệ thống sẽ kết nối trực tiếp đến Drive, trích xuất toàn bộ ảnh để khách hàng xem chất lượng cao, thả tim và ghi chú.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Giới hạn ảnh phóng cổng
              </label>
              <input
                type="number"
                min={1}
                max={10}
                value={maxLargePrint}
                onChange={(e) => setMaxLargePrint(Number(e.target.value))}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Giới hạn ảnh khung để bàn
              </label>
              <input
                type="number"
                min={1}
                max={20}
                value={maxFramed}
                onChange={(e) => setMaxFramed(Number(e.target.value))}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
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
              <Plus className="w-4 h-4" />
              <span>Khởi tạo Album</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
