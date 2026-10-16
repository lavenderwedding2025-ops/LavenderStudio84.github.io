# Studio Photo Selection - Nền Tảng Chọn Ảnh & Lọc RAW Hậu Kỳ Phong Cách Shotpik

Hệ thống chuyên biệt dành cho studio nhiếp ảnh giúp khách hàng trải nghiệm xem và chọn ảnh cưới, tiệc, phóng sự trực quan phong cách Shotpik từ Google Drive, đồng thời cung cấp công cụ tự động phân loại và sao chép file RAW (.ARW, .CR2, .NEF) trực tiếp từ ổ cứng của Admin phục vụ quy trình hậu kỳ mượt mà.

### User Review & Critical Decisions

> [!IMPORTANT]
> Các quyết định nghiệp vụ đã được xác nhận từ thông tin khảo sát:

- **Nguồn nạp Album**: Hỗ trợ dán đường dẫn (URL) thư mục Google Drive hoặc ID thư mục công khai. Hệ thống tự động phân tích ID thư mục, trích xuất danh sách ảnh kèm ảnh thu nhỏ (thumbnail) chất lượng cao và ảnh xem phóng to.
- **Tiêu chí & Phân loại ảnh của khách**:
  - **Thả tim (Yêu thích)**: Đánh dấu ảnh khách ưng ý.
  - **Ảnh phóng lớn & ảnh cổng**: Dành cho ảnh cổng tiệc cưới, ảnh treo tường phòng khách/phòng ngủ.
  - **Ảnh khung để bàn**: Dành cho khung để bàn gallery, bàn tiệc, bàn trang điểm.
  - **Ghi chú cụ thể**: Khách hàng có thể ghi yêu cầu chỉnh sửa (ví dụ: bóp eo, chỉnh váy, đổi tone màu, xóa người phía sau).
- **Quy trình sao chép file RAW (ARW / CR2) trên ổ cứng Admin**:
  - Ứng dụng tích hợp chuẩn **Web File System Access API** hiện đại (`showDirectoryPicker`): Admin chỉ cần nhấn "Chọn thư mục RAW ổ cứng" (chọn ổ D:, E: nơi lưu file gốc máy Sony `.ARW` hoặc Canon `.CR2`), hệ thống sẽ tự động quét đối chiếu tên file và sao chép/tổ chức vào các thư mục riêng biệt:
    - `01_Anh_Phong_Cong/`
    - `02_Anh_Khung_De_Ban/`
    - `03_Anh_Tim_Da_Chon/`
  - Bổ sung tùy chọn xuất **Script tự động (PowerShell .ps1 & Batch .bat)** và file text danh sách tên file dành cho trường hợp chuyển giao máy tính khác.
- **Triển khai Online & GitHub**: Cấu trúc ứng dụng hoàn chỉnh, không phụ thuộc backend phức tạp, có thể đưa lên GitHub và triển khai trên Cloud Run / Vercel / GitHub Pages hoạt động 24/7 ổn định.

---

### 1. Overview & Core Concept

- **Mục tiêu**: Xóa bỏ hoàn toàn cách làm việc thủ công (khách ghi số thứ tự ảnh ra giấy hoặc chat Zalo, thợ photoshop mất hàng giờ dò từng file RAW 50-80MB giữa hàng ngàn file trong ổ cứng).
- **Đối tượng sử dụng**:
  - *Khách hàng của Studio*: Trải nghiệm giao diện sang trọng, mượt mà trên cả điện thoại và máy tính, vuốt chạm dễ dàng, thả tim, gán nhãn ảnh phóng/ảnh khung và ghi chú tức thì.
  - *Chủ Studio & Retoucher (Photoshop Team)*: Quản lý album, gửi link cho khách với mã album/mật khẩu (nếu cần), xem báo cáo tiến độ chọn ảnh, và 1-click lọc toàn bộ file gốc RAW vào đúng thư mục hậu kỳ.

---

### 2. User Experience & Visual Design

Lấy cảm hứng trực tiếp từ giao diện Shotpik tối giản, tập trung 100% vào vẻ đẹp của ảnh:

#### Key User Flows:
1. **Studio Dashboard (Quản lý Album)**:
   - Danh sách các album khách hàng (Cover ảnh cưới/tiệc, tên dâu rể, ngày tạo, số ảnh đã chọn, trạng thái: Đang chọn / Đã chốt).
   - Modal tạo album mới: Dán link Google Drive Folder, nhập tên khách hàng, chọn ảnh bìa, đặt giới hạn số ảnh được chọn (nếu có gói chụp).
2. **Client Gallery (Giao diện khách chọn ảnh phong cách Shotpik)**:
   - Header banner sang trọng với tên cô dâu chú rể, bộ đếm thời gian thực: `Tổng ảnh`, `Đã thả tim`, `Ảnh cổng`, `Ảnh khung`, `Ghi chú`.
   - Thanh công cụ điều hướng: Lọc theo tab (`Tất cả`, `Đã thả tim`, `Ảnh phóng & cổng`, `Ảnh khung để bàn`, `Chưa chọn`), sắp xếp theo tên file hoặc thứ tự chụp.
   - Lưới ảnh đa kích thước (Masonry / Justified Grid) chống giật, tải ảnh mượt mà:
     - Nút thả tim nhanh góc trên mỗi ảnh (chuyển sang màu đỏ rực rỡ khi nhấn).
     - Nút đánh dấu ảnh phóng và ảnh khung trực tiếp trên thẻ ảnh.
     - Ô ghi chú tinh tế hoặc icon ghi chú hiển thị số nhận xét.
   - Trình xem ảnh toàn màn hình (Lightbox View):
     - Xem ảnh độ phân giải cao, nút phóng to (zoom), chuyển ảnh bằng phím mũi tên / vuốt cảm ứng.
     - Bảng điều khiển chọn mục đích ảnh (Tim, Phóng lớn, Để bàn) kèm ô ghi chú chi tiết.
   - Nút "Chốt danh sách chọn" gửi thông báo và khóa album để chuyển sang khâu hậu kỳ.
3. **Admin Hậu Kỳ & Sao chép File RAW**:
   - Tab "Hậu kỳ & Xuất file":
     - Tổng hợp chính xác danh sách các ảnh đã chọn theo từng hạng mục.
     - Nút **"Sao chép file RAW từ ổ cứng"**: Mở bộ chọn thư mục Windows/Mac, tự động tìm kiếm file tương ứng (hỗ trợ .ARW, .CR2, .CR3, .NEF, .DNG, .JPG) và sao chép vào các thư mục mục tiêu.
     - Tiến trình sao chép hiển thị thanh trạng thái thời gian thực (Progress bar, số file đã xong/tổng số, thông báo lỗi nếu thiếu file).

#### Visual Identity & Theme:
- **Phong cách**: Minimalist Wedding & Fashion Editorial - nền sáng trang nhã, viền mảnh hairline tinh tế, không bóng đổ lòe loẹt.
- **Màu sắc**:
  - Canvas nền: `#FAFAFA` và `#FFFFFF` tôn ảnh tối đa.
  - Màu nhấn chính: Hồng san hô đỏ `#E11D48` cho nút Tim yêu thích; Xanh navy thanh lịch `#1E293B` cho nút chức năng và thanh điều hướng.
  - Thẻ phân loại: Nhãn tinh tế không đóng khung viên thuốc màu mè (Anti-slop Zero-Pill).
- **Typography**: Phông chữ hiển thị hiện đại `Plus Jakarta Sans` kết hợp số đo `tabular-nums` rõ nét.

---

### 3. Key Product Decisions & Trade-Offs

- **Quyết định 1: Trình xử lý Google Drive**:
  - *Phương án chọn*: Hỗ trợ tự động phân tích Google Drive Folder ID từ link chia sẻ, tích hợp bộ nạp ảnh thông minh (Google Drive direct preview/thumbnail proxy) đồng thời hỗ trợ nạp danh sách ảnh mẫu chất lượng cao sẵn có để studio có thể sử dụng ngay lập tức mà không gặp rào cản CORS hay phân quyền.
  - *Lý do*: Khách hàng không cần đăng nhập Google rườm rà, studio chỉ cần paste link chia sẻ bất kỳ.
- **Quyết định 2: Công nghệ sao chép file RAW trên máy tính Admin**:
  - *Phương án chọn*: Kết hợp kép:
    1. **Web File System Access API**: Chạy trực tiếp trên trình duyệt (Chrome, Edge, Opera, v.v.), đọc thư mục gốc chứa hàng trăm GB file ARW/CR2 trên ổ cứng của studio và tạo thư mục đích đã phân loại mà không cần cài thêm phần mềm ngoài.
    2. **Bộ tạo Script PowerShell (.ps1) / Batch (.bat)**: Tải về chỉ bằng 1 cú nhấp chuột cho mọi máy tính Windows/Mac nếu trình duyệt không hỗ trợ File System Access API.
- **Quyết định 3: Lưu trữ dữ liệu chọn ảnh**:
  - *Phương án chọn*: Quản lý trạng thái đa tầng (Local Database / IndexedDB + LocalStorage) với khả năng xuất/nhập JSON cấu hình album và sẵn sàng kết nối Cloud / GitHub.

---

### 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        STUDIO SELECTION SUITE                          │
├──────────────────────────────────┬─────────────────────────────────────┤
│        CLIENT VIEW (Khách)       │         ADMIN WORKSPACE (Studio)    │
│  - Danh mục album & bìa sang     │  - Tạo & Quản lý Album Drive        │
│  - Bộ lọc: Tim / Cổng / Bàn      │  - Xem thống kê lựa chọn của khách  │
│  - Lưới ảnh tối ưu Shotpik       │  - Khóa album / Mở khóa duyệt       │
│  - Lightbox phóng to + Ghi chú   │  - Trình quét & Copy RAW (ARW/CR2)  │
│  - Tải ảnh / Gửi chốt album      │  - Xuất file Script & Excel/CSV     │
└─────────────────┬────────────────┴──────────────────┬──────────────────┘
                  │                                   │
                  ▼                                   ▼
┌──────────────────────────────────┐ ┌───────────────────────────────────┐
│     Google Drive Link Parser     │ │     Local RAW File Matcher Engine │
│  - Trích xuất Drive Folder ID    │ │  - Quét tên file không phân biệt  │
│  - Tối ưu URL xem trước ảnh      │ │    phần mở rộng (IMG_001.JPG ->   │
│  - Cache thumbnail & CDN tải     │ │    IMG_001.ARW / IMG_001.CR2)     │
└──────────────────────────────────┘ └─────────────────┬─────────────────┘
                                                       │
                                                       ▼
                                     ┌───────────────────────────────────┐
                                     │   Web File System Access API /    │
                                     │   PowerShell Auto-Copy Script     │
                                     │   Tự động tách vào các thư mục:   │
                                     │   - /01_Anh_Phong_Cong            │
                                     │   - /02_Anh_Khung_De_Ban          │
                                     │   - /03_Anh_Tim_Da_Chon           │
                                     └───────────────────────────────────┘
```

#### Cấu trúc dữ liệu chính:
```typescript
interface PhotoItem {
  id: string;
  filename: string;           // Ví dụ: DSC08920.JPG hoặc _MG_1234.JPG
  baseName: string;           // DSC08920 (dùng để map sang DSC08920.ARW / CR2)
  thumbnailUrl: string;
  fullUrl: string;
  isLiked: boolean;           // Nhấn tim
  isFramed: boolean;          // Ảnh khung để bàn
  isLargePrint: boolean;      // Ảnh phóng lớn / ảnh cổng
  clientNote?: string;        // Ghi chú của khách (sửa váy, xóa người,...)
  driveFileId?: string;
}

interface Album {
  id: string;
  title: string;              // VD: "PRE WEDDING HUY - QUYNH"
  clientName: string;         // VD: "Huy Tình"
  coverUrl: string;
  driveFolderUrl: string;
  createdAt: string;
  status: 'selecting' | 'locked' | 'completed';
  photos: PhotoItem[];
  settings: {
    maxHeart?: number;
    maxLargePrint?: number;
    maxFramed?: number;
    allowClientDownload: boolean;
  };
}
```

---

### Kế hoạch triển khai theo các bước cụ thể:
1. **Thiết lập Khung Dự án & Visual Tokens**: Cấu hình Typography, bảng màu trang nhã phong cách Shotpik, Top Bar tiêu chuẩn 3 vùng.
2. **Xây dựng Giao diện Studio Dashboard**: Quản trị danh sách album, thống kê số lượng ảnh, trạng thái chọn.
3. **Xây dựng Bộ nạp Album Google Drive**: Cho phép dán link Google Drive chia sẻ công khai hoặc nạp danh sách ảnh vào album một cách dễ dàng.
4. **Xây dựng Giao diện Khách Chọn Ảnh (Client Gallery)**:
   - Header album với banner khách hàng y như ảnh mẫu Shotpik.
   - Thanh công cụ lọc: Tất cả, Đã thả tim, Ảnh cổng, Ảnh khung, Đã có ghi chú.
   - Thẻ ảnh tương tác với nút thả tim nổi bật, nút gán nhãn phóng/khung và khu vực ghi chú.
   - Lightbox toàn màn hình có nút phóng to thu nhỏ, phím tắt điều hướng bàn phím.
5. **Xây dựng Động cơ Sao chép File RAW Hậu Kỳ (ARW / CR2 Copier)**:
   - Giao diện chọn thư mục ổ cứng admin trên trình duyệt.
   - Khớp nối tự động tên file không phân biệt phần mở rộng (ví dụ ảnh khách chọn là `DSC_1234.JPG` sẽ tự khớp với `DSC_1234.ARW` hoặc `DSC_1234.CR2`).
   - Tự động tạo cấu trúc thư mục con và copy file gốc vào đúng thư mục hậu kỳ.
   - Xuất file script PowerShell / CMD / Text dự phòng cho các máy tính khác.
6. **Kiểm tra và xác thực toàn diện (Build & Verification)**: Chạy kiểm tra biên dịch applet, đảm bảo không lỗi cú pháp và chạy hoàn hảo.
