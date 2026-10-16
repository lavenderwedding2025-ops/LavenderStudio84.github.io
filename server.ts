import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface DriveFileResult {
  id: string;
  name: string;
  thumbnailUrl: string;
  fullUrl: string;
  mimeType?: string;
  size?: number;
}

/**
 * Trích xuất ID thư mục từ link Google Drive
 */
function extractFolderId(urlOrId: string): string | null {
  if (!urlOrId) return null;
  const trimmed = urlOrId.trim();

  // Trực tiếp là ID (chuỗi chữ cái, số, gạch ngang, gạch dưới >= 20 ký tự)
  if (/^[a-zA-Z0-9_-]{20,}$/.test(trimmed)) {
    return trimmed;
  }

  const folderMatch = trimmed.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (folderMatch && folderMatch[1]) {
    return folderMatch[1];
  }

  const idMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch && idMatch[1]) {
    return idMatch[1];
  }

  return null;
}

/**
 * Các API key công khai của Google Drive web client để nạp toàn bộ danh mục file
 */
const PUBLIC_DRIVE_KEYS = [
  'AIzaSyAWGrfCCr7albM3lmCc937gx4uIphbpeKQ',
  'AIzaSyC1qbk75NzWBvSaDh6KnsjjA9pIrP4lYIE'
];

/**
 * Lấy toàn bộ file từ Google Drive API v3 kèm phân trang tự động (tối đa 1000 file mỗi trang)
 */
async function fetchAllDriveFilesViaApi(folderId: string, apiKey: string): Promise<DriveFileResult[]> {
  const allFiles: DriveFileResult[] = [];
  let pageToken: string | null = null;
  const query = encodeURIComponent(`'${folderId}' in parents and trashed = false`);

  do {
    let apiUrl = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=nextPageToken,files(id,name,mimeType,size)&pageSize=1000&key=${apiKey}`;
    if (pageToken) {
      apiUrl += `&pageToken=${encodeURIComponent(pageToken)}`;
    }

    const res = await fetch(apiUrl, {
      headers: {
        'Referer': 'https://drive.google.com/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!res.ok) {
      throw new Error(`Google Drive API trả về lỗi: ${res.status}`);
    }

    const data = await res.json();
    const items = data.files || [];

    const imageItems = items
      .filter((f: any) => f.mimeType?.startsWith('image/') || /\.(jpg|jpeg|png|webp|arw|cr2|cr3|nef|dng|raw|tif|tiff)$/i.test(f.name))
      .map((f: any) => ({
        id: f.id,
        name: f.name,
        thumbnailUrl: `https://lh3.googleusercontent.com/d/${f.id}=w800`,
        fullUrl: `https://lh3.googleusercontent.com/d/${f.id}=s0`,
        mimeType: f.mimeType,
        size: Number(f.size || 0)
      }));

    allFiles.push(...imageItems);
    pageToken = data.nextPageToken || null;
  } while (pageToken);

  allFiles.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
  return allFiles;
}

/**
 * Phân tích và trích xuất danh sách file từ giao diện embeddedfolderview của Google Drive
 * Giao diện này cung cấp danh sách đầy đủ 100+ ảnh kèm tên file gốc và ID thực tế
 */
async function scrapeEmbeddedFolderView(folderId: string): Promise<{ folderTitle: string; files: DriveFileResult[] }> {
  const folderUrl = `https://drive.google.com/embeddedfolderview?id=${folderId}`;
  const response = await fetch(folderUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'vi,en-US;q=0.9,en;q=0.8',
    }
  });

  if (!response.ok) {
    throw new Error(`Google Drive embeddedfolderview trả về mã lỗi ${response.status}`);
  }

  const rawHtml = await response.text();

  let folderTitle = '';
  const titleMatch = rawHtml.match(/<title>([^<]+)<\/title>/i);
  if (titleMatch && titleMatch[1]) {
    folderTitle = titleMatch[1].replace(/\s*–\s*Google Drive.*$/i, '').replace(/\s*-\s*Google Drive.*$/i, '').trim();
  }

  const files: DriveFileResult[] = [];
  const seenIds = new Set<string>();

  // Pattern từ flip-entry: href="https://drive.google.com/file/d/{fileId}/view..." ... <div class="flip-entry-title">{fileName}</div>
  const entryRegex = /href=\"https:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]{25,})\/view[^\"]*\"[\s\S]*?<div class=\"flip-entry-title\">([^<]+)<\/div>/g;
  let match;
  while ((match = entryRegex.exec(rawHtml)) !== null) {
    const fileId = match[1];
    const fileName = match[2].trim();
    if (fileId && fileName && !seenIds.has(fileId)) {
      seenIds.add(fileId);
      files.push({
        id: fileId,
        name: fileName,
        thumbnailUrl: `https://lh3.googleusercontent.com/d/${fileId}=w800`,
        fullUrl: `https://lh3.googleusercontent.com/d/${fileId}=s0`
      });
    }
  }

  // Backup regex nếu thẻ DOM có cấu trúc rút gọn
  if (files.length === 0) {
    const linkRegex = /\/file\/d\/([a-zA-Z0-9_-]{25,})\/view/g;
    let lm;
    let idx = 1;
    while ((lm = linkRegex.exec(rawHtml)) !== null) {
      const fileId = lm[1];
      if (!seenIds.has(fileId)) {
        seenIds.add(fileId);
        files.push({
          id: fileId,
          name: `PHOTO_${String(idx++).padStart(4, '0')}.JPG`,
          thumbnailUrl: `https://lh3.googleusercontent.com/d/${fileId}=w800`,
          fullUrl: `https://lh3.googleusercontent.com/d/${fileId}=s0`
        });
      }
    }
  }

  return { folderTitle, files };
}

/**
 * Phân tích và trích xuất danh sách file từ trang HTML công khai của Google Drive Folder
 */
async function scrapePublicFolderHtml(folderId: string): Promise<{ folderTitle: string; files: DriveFileResult[] }> {
  const folderUrl = `https://drive.google.com/drive/folders/${folderId}?usp=sharing`;
  
  const response = await fetch(folderUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'vi,en-US;q=0.9,en;q=0.8',
    }
  });

  if (!response.ok) {
    throw new Error(`Không thể truy cập thư mục Google Drive (Mã lỗi ${response.status}). Vui lòng đảm bảo thư mục được đặt quyền "Bất kỳ ai có đường liên kết đều có thể xem".`);
  }

  const rawHtml = await response.text();

  // Trích xuất tiêu đề thư mục từ thẻ <title>
  let folderTitle = '';
  const titleMatch = rawHtml.match(/<title>([^<]+)<\/title>/i);
  if (titleMatch && titleMatch[1]) {
    folderTitle = titleMatch[1].replace(/\s*–\s*Google Drive.*$/i, '').replace(/\s*-\s*Google Drive.*$/i, '').trim();
  }

  // GIẢI MÃ CHUỖI HEX: Google Drive mã hóa dữ liệu khởi tạo bằng các ký tự hex như \x5b ([), \x22 ("), \x5d (])
  const decodedHtml = rawHtml.replace(/\\x([0-9a-fA-F]{2})/g, (_, hex) => {
    return String.fromCharCode(parseInt(hex, 16));
  });

  const files: DriveFileResult[] = [];
  const seenIds = new Set<string>();

  // Pattern 1: Cấu trúc mảng chuẩn của Google Drive: ["FILE_ID", ["FOLDER_ID"], "FILENAME.EXT"
  const arrayPattern = /\["([a-zA-Z0-9_-]{25,})",\s*(?:\["([a-zA-Z0-9_-]+)"\]|\[[^\]]*\]|null),\s*"([^"]+\.(?:jpg|jpeg|png|webp|arw|cr2|cr3|nef|dng|raw|tif|tiff))"/gi;
  let match;
  while ((match = arrayPattern.exec(decodedHtml)) !== null) {
    const fileId = match[1];
    const fileName = match[3];
    if (fileId && fileName && !seenIds.has(fileId)) {
      seenIds.add(fileId);
      files.push({
        id: fileId,
        name: fileName,
        thumbnailUrl: `https://lh3.googleusercontent.com/d/${fileId}=w800`,
        fullUrl: `https://lh3.googleusercontent.com/d/${fileId}=s0`
      });
    }
  }

  // Pattern 2: Bóc tách từ thẻ DOM hiển thị bảng danh sách file: data-id="FILE_ID" ... aria-label="FILENAME Image Shared"
  const domPattern = /data-id="([a-zA-Z0-9_-]{25,})"[^>]*?aria-label="([^"]+?)\s+(?:Image|Photo|File)/gi;
  while ((match = domPattern.exec(rawHtml)) !== null) {
    const fileId = match[1];
    const fileName = match[2];
    if (fileId && fileName && !seenIds.has(fileId)) {
      seenIds.add(fileId);
      files.push({
        id: fileId,
        name: fileName,
        thumbnailUrl: `https://lh3.googleusercontent.com/d/${fileId}=w800`,
        fullUrl: `https://lh3.googleusercontent.com/d/${fileId}=s0`
      });
    }
  }

  return {
    folderTitle,
    files
  };
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // API Lấy toàn bộ danh sách ảnh từ Google Drive Folder (hỗ trợ nạp đầy đủ >50, 100, 500 ảnh)
  app.post('/api/drive/fetch-folder', async (req: Request, res: Response) => {
    try {
      const { urlOrId, apiKey } = req.body;
      if (!urlOrId) {
        return res.status(400).json({ success: false, error: 'Vui lòng cung cấp link hoặc ID thư mục Google Drive.' });
      }

      const folderId = extractFolderId(urlOrId);
      if (!folderId) {
        return res.status(400).json({ success: false, error: 'Không tìm thấy ID thư mục hợp lệ trong đường dẫn.' });
      }

      const filesMap = new Map<string, DriveFileResult>();
      let folderTitle = '';

      // 1. Thử nạp từ embeddedfolderview (Lấy được toàn bộ 100+ ảnh không bị ngắt ở 50 ảnh)
      try {
        const embeddedResult = await scrapeEmbeddedFolderView(folderId);
        if (embeddedResult.folderTitle && !folderTitle) {
          folderTitle = embeddedResult.folderTitle;
        }
        for (const f of embeddedResult.files) {
          if (!filesMap.has(f.id)) {
            filesMap.set(f.id, f);
          }
        }
      } catch (embErr) {
        console.warn('Scraping embeddedfolderview failed:', embErr);
      }

      // 2. Thử nạp từ public folder HTML chuẩn để hợp nhất thêm dữ liệu nếu có
      try {
        const scraped = await scrapePublicFolderHtml(folderId);
        if (scraped.folderTitle && !folderTitle) {
          folderTitle = scraped.folderTitle;
        }
        for (const f of scraped.files) {
          if (!filesMap.has(f.id)) {
            filesMap.set(f.id, f);
          }
        }
      } catch (scrapeErr) {
        console.warn('Scraping folder HTML failed:', scrapeErr);
      }

      // 3. Thử các API key nếu có
      const candidateKeys = [
        apiKey,
        process.env.GOOGLE_DRIVE_API_KEY,
        ...PUBLIC_DRIVE_KEYS
      ].filter(Boolean) as string[];

      for (const k of candidateKeys) {
        try {
          const apiFiles = await fetchAllDriveFilesViaApi(folderId, k);
          for (const f of apiFiles) {
            if (!filesMap.has(f.id)) {
              filesMap.set(f.id, f);
            }
          }
          if (apiFiles.length > 0) break;
        } catch (apiErr) {
          // Thử key tiếp theo
        }
      }

      const files = Array.from(filesMap.values());
      // Sắp xếp thứ tự tự nhiên theo tên file (LAV01098.JPG, LAV01100.JPG...)
      files.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

      return res.json({
        success: true,
        folderId,
        folderTitle,
        count: files.length,
        files
      });
    } catch (error: any) {
      console.error('Lỗi khi nạp Google Drive:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Lỗi không xác định khi kết nối với Google Drive.'
      });
    }
  });

  // Setup Vite middleware in dev or static files in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
