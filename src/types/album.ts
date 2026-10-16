export interface PhotoItem {
  id: string;
  filename: string;           // Ví dụ: DSC08920.JPG hoặc _MG_1234.JPG
  baseName: string;           // DSC08920 (dùng để khớp với file RAW ARW / CR2)
  thumbnailUrl: string;
  fullUrl: string;
  isLiked: boolean;           // Nhấn tim
  isLargePrint: boolean;      // Ảnh phóng lớn / ảnh cổng
  isFramed: boolean;          // Ảnh khung để bàn
  clientNote?: string;        // Ghi chú yêu cầu chỉnh sửa của khách
  driveFileId?: string;
  categoryTag?: string;       // Tiệc / Cổng / Đón khách / Nghi thức
  uploadedAt?: string;
}

export interface AlbumSettings {
  maxHeart?: number;
  maxLargePrint?: number;
  maxFramed?: number;
  allowClientDownload: boolean;
  clientPassword?: string;
}

export interface Album {
  id: string;
  title: string;              // VD: "13-10 AH Huy Tinh"
  clientName: string;         // VD: "Khách hàng Huy Tình"
  coverUrl: string;
  driveFolderUrl: string;
  driveFolderId?: string;
  createdAt: string;
  status: 'selecting' | 'locked' | 'completed';
  photos: PhotoItem[];
  settings: AlbumSettings;
}

export type FilterCategory = 'all' | 'liked' | 'largePrint' | 'framed' | 'hasNote' | 'unselected';

export type AppView = 'dashboard' | 'clientGallery' | 'postProduction' | 'githubGuide';
