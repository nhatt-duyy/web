# KẾ HOẠCH XÂY DỰNG WEBSITE BÁN SOURCE CODE + DỊCH VỤ CUSTOM

## 1. Tổng quan mô hình kinh doanh

**Mô hình:** Marketplace bán source code có sẵn (ready-made) kết hợp dịch vụ phát triển theo yêu cầu (custom development).

**Nguồn doanh thu:**
- Bán license source code có sẵn (Regular License / Extended License)
- Nhận dự án custom (báo giá theo scope, deposit trước – thanh toán sau)
- Gói bảo trì / hỗ trợ kỹ thuật định kỳ (subscription hàng tháng)
- Gói cài đặt (installation service) cho khách không rành kỹ thuật
- Addon / plugin mở rộng cho các source đã bán

**Đối tượng khách hàng:**
- Developer/agency mua source để tùy biến lại
- Doanh nghiệp nhỏ cần website/app nhanh, chi phí thấp
- Khách hàng cần giải pháp riêng (custom) không có sẵn trên thị trường

---

## 2. Cấu trúc website (Frontend – phía khách hàng)

### 2.1 Trang chủ
- Hero banner giới thiệu giá trị cốt lõi + CTA chính (Xem sản phẩm / Yêu cầu báo giá)
- Danh mục sản phẩm nổi bật, best-seller
- Số liệu uy tín (số dự án đã bán, khách hàng, rating trung bình)
- Testimonial / case study khách hàng
- Banner dẫn đến dịch vụ custom

### 2.2 Trang danh sách sản phẩm (Marketplace)
- Bộ lọc: ngôn ngữ/framework, danh mục, mức giá, rating
- Tìm kiếm full-text
- Sắp xếp: mới nhất, bán chạy, đánh giá cao
- Card sản phẩm: ảnh preview, tên, giá, rating, tag công nghệ

### 2.3 Trang chi tiết sản phẩm
- Gallery ảnh/video demo, link demo trực tiếp (live preview)
- Mô tả tính năng, tech stack, yêu cầu hệ thống
- Changelog (lịch sử cập nhật phiên bản)
- Tài liệu đi kèm (documentation) trước khi mua
- Review & rating từ người mua thực tế
- Giá theo từng loại license
- Nút mua ngay / thêm vào giỏ
- Sản phẩm liên quan

### 2.4 Trang dịch vụ Custom Development
- Quy trình làm việc (Brief → Báo giá → Ký hợp đồng → Phát triển → Bàn giao → Bảo hành)
- Form yêu cầu báo giá (mô tả dự án, ngân sách dự kiến, deadline mong muốn)
- Portfolio các dự án custom đã thực hiện
- Bảng giá tham khảo theo độ phức tạp

### 2.5 Giỏ hàng & Thanh toán
- Giỏ hàng, áp dụng mã giảm giá
- Thanh toán: thẻ quốc tế, ví điện tử, chuyển khoản, cổng thanh toán nội địa
- Hóa đơn tự động, email xác nhận

### 2.6 Khu vực tài khoản khách hàng (Customer Dashboard)
- Lịch sử đơn hàng & tải lại source đã mua (download có giới hạn/license key)
- Theo dõi tiến độ dự án custom (nếu có)
- Trung tâm hỗ trợ (ticket system)
- Quản lý license, gia hạn support

### 2.7 Blog / Tài nguyên
- Bài viết kỹ thuật, hướng dẫn cài đặt, SEO content để kéo traffic tự nhiên

---

## 3. Admin Panel (Quản trị mạnh)

### 3.1 Dashboard tổng quan
- KPI: doanh thu theo ngày/tháng, đơn hàng mới, dự án custom đang chạy, tỷ lệ chuyển đổi
- Biểu đồ doanh thu, top sản phẩm bán chạy
- Hoạt động gần đây (recent activity feed)

### 3.2 Quản lý sản phẩm
- CRUD sản phẩm, upload file source (mã hóa/nén), ảnh, video demo
- Quản lý phiên bản (versioning) và changelog
- Quản lý license & giới hạn số lượt download

### 3.3 Quản lý đơn hàng & thanh toán
- Danh sách đơn hàng, trạng thái (pending, paid, refunded)
- Đối soát thanh toán với cổng thanh toán
- Xuất hóa đơn, báo cáo doanh thu

### 3.4 Quản lý dự án Custom
- Kanban board theo trạng thái (Báo giá → Đang làm → Review → Bàn giao → Bảo hành)
- Gắn deadline, người phụ trách, file đính kèm, trao đổi với khách
- Lịch sử thanh toán theo từng milestone

### 3.5 Quản lý khách hàng (CRM cơ bản)
- Thông tin khách hàng, lịch sử mua hàng, giá trị vòng đời (LTV)
- Ghi chú nội bộ, phân loại khách VIP

### 3.6 Quản lý người dùng & phân quyền (Roles & Permissions)
- Role: Super Admin, Sales, Developer, Support
- Phân quyền chi tiết theo module

### 3.7 Quản lý nội dung
- Blog, banner, mã giảm giá, email marketing template

### 3.8 Báo cáo & Thống kê
- Doanh thu theo sản phẩm/nhân viên/kênh
- Xuất báo cáo Excel/PDF

### 3.9 Cấu hình hệ thống
- Cổng thanh toán, email SMTP, thuế, đa ngôn ngữ, đa tiền tệ

---

## 4. Đề xuất kiến trúc kỹ thuật

| Thành phần | Đề xuất |
|---|---|
| Frontend khách hàng | Next.js (SEO tốt, SSR/ISR cho tốc độ tải) |
| Admin Panel | React (SPA) + component library riêng, đồng bộ design system |
| Backend/API | Node.js (NestJS) hoặc Laravel – tùy đội dev quen |
| Database | PostgreSQL (dữ liệu quan hệ: đơn hàng, license, user) |
| Lưu trữ file source | Object storage (S3-compatible) có kiểm soát quyền truy cập |
| Thanh toán | Cổng quốc tế (Stripe/PayPal) + cổng nội địa (VNPay/MoMo) |
| Tìm kiếm sản phẩm | Elasticsearch/Meilisearch nếu số lượng sản phẩm lớn |
| Hosting | VPS/Cloud (AWS, GCP, hoặc nhà cung cấp trong nước) + CDN |
| Bảo mật file | Mã hóa link download, giới hạn số lần tải, license key kiểm tra domain |

---

## 5. Bảo mật & Chống rò rỉ source code

- License key kiểm tra domain/IP khi sử dụng
- Giới hạn số lần download theo license
- Watermark ẩn trong source để truy vết rò rỉ
- Theo dõi log truy cập, cảnh báo hành vi bất thường
- NDA/hợp đồng rõ ràng cho dự án custom

---

## 6. Chiến lược ra mắt & tăng trưởng

**Giai đoạn 1 – MVP (tháng 1-2):**
- Trang chủ, danh sách sản phẩm, chi tiết sản phẩm, thanh toán cơ bản, admin quản lý sản phẩm/đơn hàng

**Giai đoạn 2 – Mở rộng (tháng 3-4):**
- Dashboard khách hàng, hệ thống ticket hỗ trợ, quản lý dự án custom, CRM cơ bản

**Giai đoạn 3 – Tối ưu & Scale (tháng 5+):**
- Tối ưu SEO, đa ngôn ngữ, chương trình affiliate, báo cáo nâng cao, tự động hóa marketing

**Kênh marketing:**
- SEO content (blog kỹ thuật)
- Cộng đồng dev (Facebook groups, Discord, diễn đàn)
- Affiliate cho dev khác giới thiệu khách
- Quảng cáo Google/Facebook nhắm target agency, startup

---

## 7. Rủi ro cần lưu ý

- **Vi phạm bản quyền:** đảm bảo source tự phát triển hoặc có quyền phân phối hợp pháp
- **Chống crack/leak:** không có giải pháp tuyệt đối, cần kết hợp nhiều lớp bảo vệ + xử lý pháp lý khi phát hiện
- **Quản lý dự án custom:** cần quy trình rõ ràng, hợp đồng chặt chẽ để tránh phát sinh scope creep

---

## 8. Bước tiếp theo đề xuất

1. Chốt danh sách tính năng MVP bắt buộc
2. Thiết kế wireframe/UI cho các trang chính
3. Lựa chọn tech stack cuối cùng dựa trên đội ngũ hiện có
4. Xây dựng database schema (sản phẩm, đơn hàng, license, dự án custom)
5. Phát triển theo từng giai đoạn đã đề xuất ở mục 6s