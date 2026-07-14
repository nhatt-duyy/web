# KẾ HOẠCH CHI TIẾT THEO PHASE
## Dự án: Website bán Source Code + Dịch vụ Custom Development

---

## TỔNG QUAN LỘ TRÌNH

| Phase | Tên | Thời gian dự kiến | Mục tiêu chính |
|---|---|---|---|
| Phase 0 | Discovery & Chuẩn bị | Tuần 1-2 | Xác định scope, thiết kế hệ thống, chọn stack |
| Phase 1 | Nền tảng & MVP lõi | Tuần 3-6 | Website bán hàng cơ bản hoạt động được |
| Phase 2 | Marketplace nâng cao | Tuần 7-9 | Trải nghiệm mua hàng đầy đủ |
| Phase 3 | Admin Panel mạnh | Tuần 10-13 | Quản trị vận hành toàn diện |
| Phase 4 | Module Dịch vụ Custom | Tuần 14-16 | Quy trình nhận & quản lý dự án custom |
| Phase 5 | Bảo mật & Chống rò rỉ | Tuần 17-18 | Bảo vệ source code, license |
| Phase 6 | Kiểm thử & Tối ưu | Tuần 19-20 | QA toàn diện, performance |
| Phase 7 | Ra mắt (Launch) | Tuần 21 | Go-live chính thức |
| Phase 8 | Tăng trưởng & Mở rộng | Sau launch | SEO, affiliate, scale |

Tổng thời gian ước tính: **~5 tháng** đến khi launch chính thức (có thể co giãn tùy quy mô đội ngũ).

---

## PHASE 0 — DISCOVERY & CHUẨN BỊ (Tuần 1-2)

**Mục tiêu:** Có bộ tài liệu đặc tả đầy đủ trước khi code.

### Công việc cụ thể
1. Xác định danh sách tính năng bắt buộc (MoSCoW: Must/Should/Could/Won't)
2. Phân tích đối thủ (CodeCanyon, Envato, các marketplace source Việt Nam)
3. Thiết kế database schema tổng thể (ERD): users, products, orders, licenses, projects, tickets, payments
4. Thiết kế wireframe cho toàn bộ trang (Frontend + Admin) — dùng Figma
5. Chốt tech stack cuối cùng (frontend, backend, database, hosting, thanh toán)
6. Thiết kế API contract (danh sách endpoint, request/response mẫu)
7. Lên kế hoạch bảo mật (license key, mã hóa file, watermark)
8. Thiết lập môi trường: repo Git, CI/CD cơ bản, môi trường dev/staging

### Deliverables
- Tài liệu đặc tả tính năng (Feature Spec)
- ERD database
- Wireframe/UI mockup toàn bộ trang
- Tech stack document
- API contract document
- Repo dự án đã khởi tạo

### Vai trò cần có
Product Owner/bạn, UI/UX Designer, Backend Lead, Frontend Lead

---

## PHASE 1 — NỀN TẢNG & MVP LÕI (Tuần 3-6)

**Mục tiêu:** Có thể bán được ít nhất 1 sản phẩm source code thật, nhận thanh toán thật.

### 1.1 Hạ tầng kỹ thuật
- Setup backend framework (auth, database connection, cấu trúc module)
- Setup frontend (Next.js) với layout chính, routing
- Cấu hình object storage lưu file source (S3-compatible)
- Cấu hình môi trường staging/production

### 1.2 Xác thực & Tài khoản
- Đăng ký/đăng nhập (email, Google OAuth)
- Quên mật khẩu, xác thực email
- Phân quyền cơ bản (Customer / Admin)

### 1.3 Trang chủ & Danh mục sản phẩm
- Trang chủ với hero, sản phẩm nổi bật
- Trang danh sách sản phẩm: filter theo danh mục/công nghệ, sort, phân trang
- Trang chi tiết sản phẩm: mô tả, ảnh, giá, nút mua

### 1.4 Giỏ hàng & Thanh toán cơ bản
- Giỏ hàng (thêm/xóa sản phẩm)
- Tích hợp 1 cổng thanh toán (ví dụ Stripe hoặc VNPay)
- Trang xác nhận đơn hàng + email tự động

### 1.5 Admin cơ bản (giai đoạn đầu)
- CRUD sản phẩm (upload file, ảnh, mô tả, giá)
- Danh sách đơn hàng, cập nhật trạng thái thủ công

### Deliverables
- Website public có thể duyệt sản phẩm và mua hàng thật
- Admin có thể thêm sản phẩm và xem đơn hàng
- Hệ thống auth hoạt động ổn định

### Tiêu chí hoàn thành (Definition of Done)
- Một khách hàng test có thể: đăng ký → xem sản phẩm → mua → nhận email → tải file

---

## PHASE 2 — MARKETPLACE NÂNG CAO (Tuần 7-9)

**Mục tiêu:** Trải nghiệm mua hàng đạt chuẩn sản phẩm SaaS thật sự.

### 2.1 Trang chi tiết sản phẩm nâng cao
- Gallery ảnh/video, link demo trực tiếp
- Tab: Mô tả, Tài liệu, Changelog, Reviews
- Sản phẩm liên quan (related products)

### 2.2 Tìm kiếm & Lọc nâng cao
- Full-text search (Meilisearch/Elasticsearch nếu số lượng SP lớn)
- Bộ lọc đa tiêu chí: giá, ngôn ngữ, rating, ngày đăng

### 2.3 Đánh giá & Review
- Khách mua hàng để lại review + rating
- Admin duyệt/ẩn review

### 2.4 Dashboard khách hàng
- Lịch sử đơn hàng
- Tải lại file đã mua (giới hạn số lần download)
- Quản lý license key
- Trung tâm hỗ trợ (tạo ticket)

### 2.5 Mã giảm giá & Khuyến mãi
- Coupon code, giảm giá theo %/số tiền cố định
- Chương trình giảm giá theo thời gian (flash sale)

### 2.6 Đa loại License
- Regular License / Extended License với giá khác nhau
- Điều khoản sử dụng theo từng loại

### Deliverables
- Trải nghiệm mua hàng hoàn chỉnh, có review, đa license
- Dashboard khách hàng đầy đủ chức năng cơ bản

---

## PHASE 3 — ADMIN PANEL MẠNH (Tuần 10-13)

**Mục tiêu:** Vận hành nội bộ hiệu quả, ra quyết định dựa trên số liệu.

### 3.1 Dashboard tổng quan
- KPI: doanh thu, đơn hàng, tỷ lệ chuyển đổi, top sản phẩm
- Biểu đồ doanh thu theo thời gian (ngày/tuần/tháng)

### 3.2 Quản lý sản phẩm nâng cao
- Quản lý phiên bản (versioning) + changelog
- Quản lý license & giới hạn download chi tiết
- Bulk actions (ẩn/xóa/publish hàng loạt)

### 3.3 Quản lý đơn hàng & tài chính
- Đối soát thanh toán với cổng thanh toán
- Xử lý hoàn tiền (refund)
- Xuất hóa đơn tự động, báo cáo doanh thu (Excel/PDF)

### 3.4 CRM cơ bản
- Hồ sơ khách hàng: lịch sử mua, giá trị vòng đời (LTV)
- Ghi chú nội bộ, gắn tag khách VIP
- Phân đoạn khách hàng để email marketing

### 3.5 Quản lý người dùng nội bộ & Phân quyền
- Role: Super Admin, Sales, Developer, Support, Content
- Ma trận phân quyền chi tiết theo module

### 3.6 Quản lý nội dung
- CMS cho blog, banner trang chủ
- Quản lý email template (order confirmation, marketing)

### 3.7 Hệ thống hỗ trợ (Ticket/Helpdesk)
- Admin trả lời ticket từ khách hàng
- Phân loại mức độ ưu tiên, gán người xử lý

### Deliverables
- Admin panel đầy đủ chức năng vận hành, phân quyền rõ ràng
- Báo cáo tài chính, CRM cơ bản sẵn sàng dùng thực tế

---

## PHASE 4 — MODULE DỊCH VỤ CUSTOM (Tuần 14-16)

**Mục tiêu:** Quy trình nhận và quản lý dự án custom chuyên nghiệp, không phụ thuộc email/Excel thủ công.

### 4.1 Trang & Form yêu cầu báo giá (Frontend)
- Form chi tiết: loại dự án, mô tả, ngân sách dự kiến, deadline, đính kèm tài liệu
- Portfolio dự án custom đã làm (case study)

### 4.2 Quản lý dự án Custom (Admin)
- Kanban board: Yêu cầu mới → Đang báo giá → Đã chốt → Đang phát triển → Review → Bàn giao → Bảo hành
- Gắn deadline, người phụ trách (assignee), mức độ ưu tiên
- Đính kèm file, trao đổi nội bộ theo từng dự án

### 4.3 Hợp đồng & Thanh toán theo Milestone
- Tạo hợp đồng điện tử / xác nhận scope
- Chia thanh toán theo milestone (deposit, giữa kỳ, hoàn tất)
- Theo dõi công nợ theo từng dự án

### 4.4 Giao tiếp với khách hàng
- Khu vực trao đổi trực tiếp trong dashboard khách hàng (thay vì chỉ qua email)
- Thông báo tiến độ tự động (email/notification)

### 4.5 Bàn giao & Bảo hành
- Upload file bàn giao cuối cùng qua hệ thống (có versioning)
- Theo dõi thời hạn bảo hành, ticket bảo hành riêng

### Deliverables
- Quy trình end-to-end cho dự án custom, từ yêu cầu đến bàn giao, quản lý tập trung trên hệ thống

---

## PHASE 5 — BẢO MẬT & CHỐNG RÒ RỈ SOURCE CODE (Tuần 17-18)

**Mục tiêu:** Giảm thiểu rủi ro rò rỉ/crack source code, bảo vệ doanh thu.

### Công việc cụ thể
1. License key kiểm tra domain/IP khi khách kích hoạt sản phẩm
2. Giới hạn số lần download theo license (VD: tối đa 5 lần)
3. Watermark ẩn trong source code để truy vết nếu rò rỉ
4. Mã hóa link download (link tạm thời, hết hạn sau X phút)
5. Logging & cảnh báo hành vi bất thường (download hàng loạt, IP lạ)
6. Rà soát bảo mật ứng dụng: kiểm tra OWASP Top 10 (SQL injection, XSS, CSRF...)
7. Cấu hình HTTPS, rate-limiting API, chống brute-force đăng nhập
8. Backup dữ liệu tự động định kỳ

### Deliverables
- Hệ thống license & download an toàn
- Báo cáo audit bảo mật cơ bản đã thực hiện

---

## PHASE 6 — KIỂM THỬ & TỐI ƯU (Tuần 19-20)

**Mục tiêu:** Đảm bảo chất lượng trước khi ra mắt.

### 6.1 Testing
- Unit test cho các module quan trọng (thanh toán, license, auth)
- Test tích hợp (integration test) toàn bộ luồng mua hàng
- Test thủ công (manual QA) toàn bộ trang Frontend + Admin
- Test bảo mật (penetration test cơ bản)

### 6.2 Performance
- Tối ưu tốc độ tải trang (lazy load ảnh, cache, CDN)
- Tối ưu truy vấn database (index, query chậm)
- Load testing (giả lập nhiều người dùng cùng lúc)

### 6.3 Responsive & Accessibility
- Kiểm tra hiển thị trên desktop/tablet/mobile
- Kiểm tra accessibility (contrast, keyboard navigation)

### 6.4 UAT (User Acceptance Testing)
- Cho một nhóm nhỏ người dùng thật trải nghiệm, thu thập phản hồi
- Sửa lỗi/điều chỉnh theo phản hồi

### Deliverables
- Báo cáo QA, danh sách bug đã fix
- Website đạt chuẩn performance/accessibility trước khi launch

---

## PHASE 7 — RA MẮT (LAUNCH) (Tuần 21)

**Mục tiêu:** Go-live chính thức, ổn định vận hành ngay từ ngày đầu.

### Công việc cụ thể
1. Chuẩn bị dữ liệu sản phẩm ban đầu (ít nhất 10-20 sản phẩm chất lượng)
2. Kiểm tra lại toàn bộ cổng thanh toán ở môi trường production
3. Cấu hình domain, SSL, monitoring (uptime, error tracking)
4. Kế hoạch truyền thông ra mắt (email danh sách chờ, đăng bài cộng đồng dev)
5. Theo dõi sát trong 48-72 giờ đầu (log lỗi, phản hồi khách hàng)
6. Chuẩn bị đội support trực trong giai đoạn đầu

### Deliverables
- Website chính thức hoạt động, có đơn hàng thật
- Kênh giám sát lỗi/vận hành đã thiết lập

---

## PHASE 8 — TĂNG TRƯỞNG & MỞ RỘNG (Sau Launch)

**Mục tiêu:** Tăng traffic, tăng doanh thu, mở rộng tính năng.

### Các hạng mục ưu tiên
1. **SEO & Content:** viết blog kỹ thuật, tối ưu on-page SEO, backlink
2. **Chương trình Affiliate:** cho phép dev khác giới thiệu khách để nhận hoa hồng
3. **Đa ngôn ngữ/đa tiền tệ:** mở rộng thị trường quốc tế
4. **Email Marketing tự động:** remarketing giỏ hàng bỏ dở, upsell
5. **Gói subscription bảo trì:** doanh thu định kỳ (recurring revenue)
6. **Mở marketplace cho seller khác** (nếu muốn chuyển sang mô hình đa người bán)
7. **Phân tích nâng cao:** heatmap, funnel analysis để tối ưu tỷ lệ chuyển đổi

### Deliverables
- Kế hoạch tăng trưởng 6-12 tháng tiếp theo, có số liệu đo lường cụ thể

---

## GHI CHÚ QUAN TRỌNG

- Các phase có thể **chạy song song một phần** (VD: Phase 3 Admin nâng cao có thể bắt đầu từ giữa Phase 2) nếu có đủ nhân sự chia 2 nhóm Frontend/Admin riêng.
- Nên có **buổi review cuối mỗi phase** để đánh giá tiến độ và điều chỉnh kế hoạch phase sau.
- Ưu tiên launch sớm ở cuối Phase 1 với phạm vi tối thiểu nếu muốn có doanh thu/feedback thực tế sớm, sau đó tiếp tục hoàn thiện các phase còn lại song song với vận hành.