import { PhotoItem, Album } from '../types/album';
import { getBaseFileName } from './driveParser';

export interface CopyProgress {
  total: number;
  current: number;
  currentFileName: string;
  category: string;
  status: 'scanning' | 'copying' | 'completed' | 'error';
  copiedFiles: string[];
  skippedFiles: string[];
  errors: string[];
}

/**
 * Kiểm tra xem trình duyệt hiện tại có hỗ trợ Web File System Access API không
 */
export function isFileSystemAccessSupported(): boolean {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
}

/**
 * Lọc ảnh theo từng mục đích hậu kỳ
 */
export function categorizePhotosForPostProduction(photos: PhotoItem[]) {
  const largePrintPhotos = photos.filter(p => p.isLargePrint);
  const framedPhotos = photos.filter(p => p.isFramed);
  const likedPhotos = photos.filter(p => p.isLiked);
  const notesPhotos = photos.filter(p => p.clientNote && p.clientNote.trim() !== '');

  return {
    largePrintPhotos,
    framedPhotos,
    likedPhotos,
    notesPhotos,
  };
}

/**
 * Sao chép file RAW (ARW / CR2 / NEF) trực tiếp từ ổ cứng bằng File System Access API
 */
export async function copyRawFilesFromHardDrive(
  album: Album,
  onProgress?: (progress: CopyProgress) => void
): Promise<{ success: boolean; copiedCount: number; message: string }> {
  if (!isFileSystemAccessSupported()) {
    throw new Error('Trình duyệt của bạn chưa hỗ trợ File System Access API. Vui lòng dùng Chrome, Edge hoặc tải file Script PowerShell bên dưới để chạy tự động.');
  }

  const { largePrintPhotos, framedPhotos, likedPhotos } = categorizePhotosForPostProduction(album.photos);
  
  // Danh sách các nhóm cần copy
  const groups = [
    { dirName: '01_Anh_Phong_Cong', list: largePrintPhotos, label: 'Ảnh phóng & Cổng' },
    { dirName: '02_Anh_Khung_De_Ban', list: framedPhotos, label: 'Ảnh khung để bàn' },
    { dirName: '03_Anh_Tim_Da_Chon', list: likedPhotos, label: 'Ảnh khách thả tim' }
  ];

  // Tính tổng số lượng file cần copy (loại trừ trùng lặp trong từng danh mục)
  const allTargetBaseNames = new Set<string>();
  groups.forEach(g => g.list.forEach(p => allTargetBaseNames.add(p.baseName)));
  
  if (allTargetBaseNames.size === 0) {
    throw new Error('Chưa có ảnh nào được khách thả tim hoặc chọn phóng/khung.');
  }

  // 1. Yêu cầu người dùng chọn thư mục nguồn (chứa file RAW máy ảnh: .ARW, .CR2,...)
  // @ts-ignore - showDirectoryPicker
  const sourceHandle: FileSystemDirectoryHandle = await window.showDirectoryPicker({
    id: 'studio-raw-source',
    mode: 'read',
    startIn: 'pictures'
  });

  // 2. Yêu cầu người dùng chọn thư mục đích (nơi lưu các thư mục phân loại)
  // @ts-ignore - showDirectoryPicker
  const destHandle: FileSystemDirectoryHandle = await window.showDirectoryPicker({
    id: 'studio-raw-destination',
    mode: 'readwrite',
    startIn: 'pictures'
  });

  const progress: CopyProgress = {
    total: allTargetBaseNames.size,
    current: 0,
    currentFileName: '',
    category: 'Đang quét thư mục nguồn...',
    status: 'scanning',
    copiedFiles: [],
    skippedFiles: [],
    errors: []
  };

  if (onProgress) onProgress({ ...progress });

  // 3. Quét danh sách file trong thư mục nguồn và xây dựng bản đồ BaseName -> FileHandle
  const rawFileMap = new Map<string, { handle: FileSystemFileHandle; fullName: string }>();
  
  // Hỗ trợ đuôi file RAW thông dụng và JPG
  const supportedExtensions = ['.arw', '.cr2', '.cr3', '.nef', '.dng', '.raf', '.rw2', '.jpg', '.jpeg'];

  // @ts-ignore - entries()
  for await (const [name, handle] of sourceHandle.entries()) {
    if (handle.kind === 'file') {
      const lower = name.toLowerCase();
      const isMatchExt = supportedExtensions.some(ext => lower.endsWith(ext));
      if (isMatchExt) {
        const base = getBaseFileName(name);
        // Ưu tiên file RAW hơn file JPG nếu trùng tên
        const isCurrentRaw = lower.endsWith('.arw') || lower.endsWith('.cr2') || lower.endsWith('.cr3') || lower.endsWith('.nef');
        if (!rawFileMap.has(base) || isCurrentRaw) {
          rawFileMap.set(base, { handle: handle as FileSystemFileHandle, fullName: name });
        }
      }
    }
  }

  // 4. Tiến hành tạo thư mục đích và sao chép theo từng danh mục
  progress.status = 'copying';
  let totalCopied = 0;

  for (const group of groups) {
    if (group.list.length === 0) continue;

    progress.category = group.label;
    // Tạo thư mục con tương ứng: 01_Anh_Phong_Cong, 02_Anh_Khung_De_Ban, 03_Anh_Tim_Da_Chon
    const groupDirHandle = await destHandle.getDirectoryHandle(group.dirName, { create: true });

    for (const photo of group.list) {
      const matched = rawFileMap.get(photo.baseName);
      progress.currentFileName = photo.filename;
      progress.current = totalCopied;

      if (!matched) {
        progress.skippedFiles.push(`${photo.filename} (Không tìm thấy file RAW tương ứng trên ổ cứng)`);
        if (onProgress) onProgress({ ...progress });
        continue;
      }

      try {
        const file = await matched.handle.getFile();
        const newFileHandle = await groupDirHandle.getFileHandle(matched.fullName, { create: true });
        // @ts-ignore
        const writable = await newFileHandle.createWritable();
        await writable.write(file);
        await writable.close();

        totalCopied++;
        progress.copiedFiles.push(`${matched.fullName} -> ${group.dirName}`);
      } catch (err: any) {
        progress.errors.push(`Lỗi khi sao chép ${matched.fullName}: ${err.message || err}`);
      }

      if (onProgress) onProgress({ ...progress });
    }
  }

  progress.status = 'completed';
  if (onProgress) onProgress({ ...progress });

  return {
    success: true,
    copiedCount: totalCopied,
    message: `Đã sao chép thành công ${totalCopied} file vào các thư mục riêng biệt trên ổ cứng.`
  };
}

/**
 * Tạo Script PowerShell (.ps1) tự động sao chép file RAW trên Windows
 */
export function generatePowerShellScript(album: Album): string {
  const { largePrintPhotos, framedPhotos, likedPhotos, notesPhotos } = categorizePhotosForPostProduction(album.photos);

  const largePrintList = largePrintPhotos.map(p => `"${p.baseName}"`).join(',');
  const framedList = framedPhotos.map(p => `"${p.baseName}"`).join(',');
  const likedList = likedPhotos.map(p => `"${p.baseName}"`).join(',');

  const script = `# ========================================================
# AUTO COPY RAW FILES (.ARW / .CR2 / .NEF) CHO HẬU KỲ
# Album: ${album.title}
# Khách hàng: ${album.clientName}
# Ngày tạo: ${album.createdAt}
# Tạo tự động bởi Studio Photo Selection Tool
# ========================================================

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   STUDIO PHOTO RETOUCH - COPY FILE RAW TỰ ĐỘNG         " -ForegroundColor Green
Write-Host "   Album: ${album.title} - ${album.clientName}          " -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan

# Nhập đường dẫn thư mục nguồn (chứa file RAW của máy ảnh)
$SourceFolder = Read-Host "Nhập đường dẫn thư mục RAW gốc (Ví dụ: D:\\Photos\\PreWedding\\RAW)"
while (!(Test-Path $SourceFolder)) {
    Write-Host "Đường dẫn không tồn tại! Vui lòng nhập lại." -ForegroundColor Red
    $SourceFolder = Read-Host "Nhập đường dẫn thư mục RAW gốc"
}

# Nhập đường dẫn thư mục lưu ảnh hậu kỳ
$DestFolder = Read-Host "Nhập đường dẫn thư mục lưu ảnh hậu kỳ (Ví dụ: D:\\HauKy\\${album.title})"
if (!(Test-Path $DestFolder)) {
    New-Item -ItemType Directory -Force -Path $DestFolder | Out-Null
}

$DirLargePrint = Join-Path $DestFolder "01_Anh_Phong_Cong"
$DirFramed     = Join-Path $DestFolder "02_Anh_Khung_De_Ban"
$DirLiked      = Join-Path $DestFolder "03_Anh_Tim_Da_Chon"

New-Item -ItemType Directory -Force -Path $DirLargePrint | Out-Null
New-Item -ItemType Directory -Force -Path $DirFramed | Out-Null
New-Item -ItemType Directory -Force -Path $DirLiked | Out-Null

# Danh sách tên file cần tìm (không tính phần mở rộng)
$ListLarge = @(${largePrintList || '""'})
$ListFramed = @(${framedList || '""'})
$ListLiked = @(${likedList || '""'})

$SupportedExt = @("*.arw", "*.cr2", "*.cr3", "*.nef", "*.dng", "*.jpg")

function Copy-MatchedFiles {
    param(
        [string[]]$Names,
        [string]$TargetDir,
        [string]$CategoryLabel
    )
    if ($Names.Count -eq 0 -or [string]::IsNullOrWhiteSpace($Names[0])) { return }

    Write-Host "\`nĐang lọc và sao chép: $CategoryLabel..." -ForegroundColor Cyan
    $Count = 0

    foreach ($name in $Names) {
        $found = $false
        foreach ($ext in $SupportedExt) {
            $files = Get-ChildItem -Path $SourceFolder -Filter "$name$ext" -Recurse -File -ErrorAction SilentlyContinue
            if ($files) {
                foreach ($file in $files) {
                    $destPath = Join-Path $TargetDir $file.Name
                    Copy-Item -Path $file.FullName -Destination $destPath -Force
                    Write-Host " [OK] Đã copy: $($file.Name) -> $CategoryLabel" -ForegroundColor Green
                    $found = $true
                    $Count++
                    break
                }
            }
            if ($found) { break }
        }
        if (!$found) {
            Write-Host " [!] KHÔNG TÌM THẤY: $name trong thư mục nguồn" -ForegroundColor Yellow
        }
    }
    Write-Host "-> Hoàn thành $CategoryLabel: $Count file" -ForegroundColor Magenta
}

Copy-MatchedFiles -Names $ListLarge -TargetDir $DirLargePrint -CategoryLabel "01_Anh_Phong_Cong"
Copy-MatchedFiles -Names $ListFramed -TargetDir $DirFramed -CategoryLabel "02_Anh_Khung_De_Ban"
Copy-MatchedFiles -Names $ListLiked -TargetDir $DirLiked -CategoryLabel "03_Anh_Tim_Da_Chon"

Write-Host "\`n==========================================================" -ForegroundColor Green
Write-Host "   ĐÃ HOÀN TẤT SAO CHÉP TOÀN BỘ FILE HẬU KỲ!           " -ForegroundColor Green
Write-Host "   Thư mục lưu: $DestFolder                               " -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Green
Pause
`;

  return script;
}

/**
 * Tạo file danh sách và ghi chú của khách (CSV / Excel UTF-8)
 */
export function generateClientNotesCSV(album: Album): string {
  const headers = ['STT', 'Tên File', 'Mã Gốc (RAW)', 'Thả Tim', 'Ảnh Phóng Cổng', 'Ảnh Khung Để Bàn', 'Ghi Chú Yêu Cầu Chỉnh Sửa'];
  
  const rows = album.photos
    .filter(p => p.isLiked || p.isLargePrint || p.isFramed || (p.clientNote && p.clientNote.trim() !== ''))
    .map((p, index) => {
      return [
        index + 1,
        `"${p.filename}"`,
        `"${p.baseName}"`,
        p.isLiked ? 'Có' : '',
        p.isLargePrint ? 'Ảnh phóng 60x90 / Cổng' : '',
        p.isFramed ? 'Ảnh khung để bàn' : '',
        `"${(p.clientNote || '').replace(/"/g, '""')}"`
      ].join(',');
    });

  return '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
}

/**
 * Tải file văn bản về máy tính
 */
export function triggerFileDownload(content: string, filename: string, mimeType: string = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
