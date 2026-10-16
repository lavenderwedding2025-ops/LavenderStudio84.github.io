import { PhotoItem } from '../types/album';

/**
 * Phân tích đường dẫn Google Drive Folder hoặc file ID
 */
export function extractDriveFolderId(urlOrId: string): string | null {
  if (!urlOrId) return null;
  const trimmed = urlOrId.trim();

  // Kiểm tra nếu trực tiếp là folder ID (thường gồm chữ cái, số, gạch ngang, gạch dưới >= 20 ký tự)
  if (/^[a-zA-Z0-9_-]{20,}$/.test(trimmed)) {
    return trimmed;
  }

  // Khớp định dạng https://drive.google.com/drive/folders/{folderId}
  const folderMatch = trimmed.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (folderMatch && folderMatch[1]) {
    return folderMatch[1];
  }

  // Khớp định dạng ?id={folderId}
  const idMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch && idMatch[1]) {
    return idMatch[1];
  }

  return null;
}

/**
 * Trích xuất các link hoặc File ID đơn lẻ nếu người dùng dán danh sách link ảnh Google Drive
 */
export function parseIndividualDriveLinks(text: string): { id: string; name: string }[] {
  if (!text) return [];
  const results: { id: string; name: string }[] = [];
  const seen = new Set<string>();

  // Khớp định dạng /file/d/{fileId}
  const fileRegex = /\/file\/d\/([a-zA-Z0-9_-]{25,})/g;
  let match;
  let idx = 1;
  while ((match = fileRegex.exec(text)) !== null) {
    const fileId = match[1];
    if (!seen.has(fileId)) {
      seen.add(fileId);
      results.push({
        id: fileId,
        name: `DRIVE_${String(idx++).padStart(4, '0')}.JPG`
      });
    }
  }

  // Khớp định dạng id={fileId}
  const idRegex = /[?&]id=([a-zA-Z0-9_-]{25,})/g;
  while ((match = idRegex.exec(text)) !== null) {
    const fileId = match[1];
    if (!seen.has(fileId)) {
      seen.add(fileId);
      results.push({
        id: fileId,
        name: `DRIVE_${String(idx++).padStart(4, '0')}.JPG`
      });
    }
  }

  return results;
}

/**
 * Tạo URL xem ảnh thumbnail từ Google Drive file ID
 */
export function getDriveThumbnailUrl(fileId: string, size: number = 800): string {
  return `https://lh3.googleusercontent.com/d/${fileId}=w${size}`;
}

/**
 * Tạo URL xem trực tiếp / tải ảnh từ Google Drive file ID
 */
export function getDriveDirectViewUrl(fileId: string): string {
  return `https://lh3.googleusercontent.com/d/${fileId}=s0`;
}

/**
 * Trích xuất tên gốc của file bỏ phần mở rộng (Ví dụ: DSC08920.JPG -> DSC08920)
 */
export function getBaseFileName(filename: string): string {
  if (!filename) return '';
  const lastDot = filename.lastIndexOf('.');
  if (lastDot <= 0) return filename.toUpperCase();
  return filename.substring(0, lastDot).toUpperCase();
}

/**
 * Gọi API backend để lấy danh sách ảnh thực tế từ thư mục Google Drive
 */
export async function fetchDriveFolderPhotos(
  driveUrlOrId: string,
  apiKey?: string
): Promise<{ success: boolean; photos: PhotoItem[]; folderTitle?: string; message: string }> {
  try {
    const folderId = extractDriveFolderId(driveUrlOrId);
    if (!folderId) {
      return {
        success: false,
        photos: [],
        message: 'Đường dẫn Google Drive không hợp lệ hoặc thiếu ID thư mục.'
      };
    }

    const response = await fetch('/api/drive/fetch-folder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ urlOrId: driveUrlOrId, apiKey })
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      return {
        success: false,
        photos: [],
        message: data.error || 'Không thể nạp ảnh từ Google Drive.'
      };
    }

    if (!data.files || data.files.length === 0) {
      return {
        success: true,
        photos: [],
        folderTitle: data.folderTitle || '',
        message: 'Thư mục Google Drive này chưa có ảnh hoặc chưa được đặt quyền công khai "Bất kỳ ai có đường liên kết đều có thể xem".'
      };
    }

    const photos: PhotoItem[] = data.files.map((f: any, index: number) => {
      const filename = f.name || `DSC_${String(index + 1).padStart(4, '0')}.JPG`;
      const baseName = getBaseFileName(filename);
      return {
        id: f.id || `drive_${index + 1}`,
        filename,
        baseName,
        thumbnailUrl: f.thumbnailUrl || getDriveThumbnailUrl(f.id, 800),
        fullUrl: f.fullUrl || getDriveDirectViewUrl(f.id),
        isLiked: false,
        isLargePrint: false,
        isFramed: false,
        clientNote: '',
        driveFileId: f.id,
        categoryTag: 'Google Drive',
        uploadedAt: new Date().toISOString().slice(0, 10)
      };
    });

    return {
      success: true,
      photos,
      folderTitle: data.folderTitle || '',
      message: `Đã nạp thành công ${photos.length} hình ảnh thực tế từ Google Drive!`
    };
  } catch (error: any) {
    console.error('Lỗi khi fetchDriveFolderPhotos:', error);
    return {
      success: false,
      photos: [],
      message: error.message || 'Lỗi kết nối tới máy chủ nạp ảnh Google Drive.'
    };
  }
}

/**
 * Tạo danh sách ảnh mẫu chất lượng cao cho studio test nhanh khi tạo album mới
 */
export function generateSampleDrivePhotos(albumPrefix: string = 'DSC', count: number = 24): PhotoItem[] {
  const sampleImages = [
    {
      url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=80',
      thumb: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=700&q=75',
      tag: 'Nghi lễ rước dâu'
    },
    {
      url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1600&q=80',
      thumb: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=700&q=75',
      tag: 'Cổng hoa & Gia đình'
    },
    {
      url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1600&q=80',
      thumb: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=700&q=75',
      tag: 'Cô dâu & Chú rể'
    },
    {
      url: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=1600&q=80',
      thumb: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=700&q=75',
      tag: 'Trao nhẫn cưới'
    },
    {
      url: 'https://images.unsplash.com/photo-1532712938310-34cb3982ef74?auto=format&fit=crop&w=1600&q=80',
      thumb: 'https://images.unsplash.com/photo-1532712938310-34cb3982ef74?auto=format&fit=crop&w=700&q=75',
      tag: 'Chụp cùng bạn bè'
    },
    {
      url: 'https://images.unsplash.com/photo-1544077960-604201fe74bc?auto=format&fit=crop&w=1600&q=80',
      thumb: 'https://images.unsplash.com/photo-1544077960-604201fe74bc?auto=format&fit=crop&w=700&q=75',
      tag: 'Chân dung cô dâu'
    },
    {
      url: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=1600&q=80',
      thumb: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=700&q=75',
      tag: 'Pre-wedding ngoại cảnh'
    },
    {
      url: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=1600&q=80',
      thumb: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=700&q=75',
      tag: 'Lối đi sân khấu'
    },
    {
      url: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=1600&q=80',
      thumb: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=700&q=75',
      tag: 'Hoàng hôn lãng mạn'
    },
    {
      url: 'https://images.unsplash.com/photo-1591604466107-ec97de577aff?auto=format&fit=crop&w=1600&q=80',
      thumb: 'https://images.unsplash.com/photo-1591604466107-ec97de577aff?auto=format&fit=crop&w=700&q=75',
      tag: 'Nụ cười hạnh phúc'
    },
    {
      url: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=1600&q=80',
      thumb: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=700&q=75',
      tag: 'Chi tiết hoa cưới'
    },
    {
      url: 'https://images.unsplash.com/photo-1549417229-aa67d3263c09?auto=format&fit=crop&w=1600&q=80',
      thumb: 'https://images.unsplash.com/photo-1549417229-aa67d3263c09?auto=format&fit=crop&w=700&q=75',
      tag: 'Ảnh kỷ niệm gia đình'
    }
  ];

  const photos: PhotoItem[] = [];
  const startNumber = 8900;

  for (let i = 0; i < count; i++) {
    const imgInfo = sampleImages[i % sampleImages.length];
    const num = String(startNumber + i).padStart(4, '0');
    const filename = `${albumPrefix}_${num}.JPG`;
    const baseName = `${albumPrefix}_${num}`;

    photos.push({
      id: `p-${i + 1}`,
      filename,
      baseName,
      thumbnailUrl: imgInfo.thumb,
      fullUrl: imgInfo.url,
      isLiked: false,
      isLargePrint: false,
      isFramed: false,
      clientNote: '',
      categoryTag: imgInfo.tag,
      uploadedAt: '2026-10-13'
    });
  }

  return photos;
}
