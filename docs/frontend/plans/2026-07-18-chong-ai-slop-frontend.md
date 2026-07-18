# Plan: Chống AI-slop cho Frontend (Nhat Duy Market)

> **Ngày:** 2026-07-18
> **Mục tiêu:** Loại bỏ các dấu hiệu "giống AI làm" trên frontend (đặc biệt trang chủ v
à hệ thống component), biến giao diện thành thứ **có chủ ý, có cá tính**, không phải te
mplate sinh tự động.
> **Tham chiếu:** Skill `hallmark` (anti-AI-slop design), 58 slop-test gates.
> **Phạm vi:** `apps/web/src/app/page.tsx`, `header.tsx`, `footer.tsx`, `globals.css`,
`components/ui/*`, các trang con (`products`, `du-an`, `bao-gia`, `blog`, `dashboard`).

---

## 0. Pre-flight (thực trạng đã quét)

| Hạng mục | Phát hiện |
|----------|-----------|
| Font | Sora (display) + IBM Plex Sans (body) + JetBrains Mono — đã qua `next/font` (g
lobals.css L113-115) |
| Palette | "Terminal Luxe" — primary `#2563eb` (blue), accent `#0891b2` (cyan), dark-f
irst, glow/blur (globals.css L3) |
| Motion | `animate-float`, `animate-shimmer`, `Reveal` fade-up, `card-hover` translate
Y (globals.css L122-128) |
| Framework | Next.js 15 App Router, Tailwind v4 |
| Macrostructure trang chủ | Hero → Stats → Categories → Featured → How-it-works(3) → F
eatures(4) → Testimonials → CTA |

**Quyết định:** Giữ lại font stack, token màu nền, spacing scale (vì đã nhất quán). Chỉ
 sửa **cấu trúc (macrostructure)**, **giảm glow/blur**, **bỏ số liệu bịa**, **đổi nav/f
ooter archetype**, **thêm cá tính typographic**.

---

## 1. Các lỗi AI-slop cần sửa (ưu tiên cao → thấp)

### P0 — Nghiêm trọng (làm trang trông "template")

- **[G46] Số liệu bịa:** `STATS` (1.200+, 50K+, 4.9/5, 24/7) và `TESTIMONIALS` (3 người
 + quote) là dữ liệu tưởng tượng.
  - *Sửa:* Thay bằng placeholder trung thực (`—` + nhãn "số liệu cần xác nhận"), hoặc b
ỏ hẳn khối stats, hoặc lấy số thật từ DB (đếm products thực tế qua API). Testimonials →
 bỏ hoặc thay section "đối tác công nghệ" dùng logo thật (Next.js/NestJS…) hoặc quote c
ó thật từ user.
- **[Macrostructure] Nhịp hero→stats→3-step→4-feature→testimonial→CTA quá phổ biến.**
  - *Sửa:* Đảo cấu trúc. Xem §2 — chuyển sang macrostructure ít template hơn (vd. *Work
bench* hoặc *Letter* hoặc *Manifesto* thay vì landing 8-section chuẩn).
- **[G54] Eyebrow/kicker giả:** `eyebrow="Được yêu thích" / "Cách hoạt động" / "Tại sao
..."` ở mọi SectionHeading.
  - *Sửa:* Bỏ eyebrow trừ khi content thực sự phân loại. Đặt heading trực tiếp, giọng v
ăn cụ thể hơn.

### P1 — Trung bình (dấu hiệu style)

- **[Atmospheric slop] Quá nhiều glow/blur orb:** Hero (2 quả radial blur + `animate-fl
oat`), CTA (`
s-reduced-motion`.
- **[G38a] Text-gradient + gradient buttons lặp:** `text-gradient` (source code), logo
gradient, nút `from-primary to-primary-strong` lặp 6+ chỗ.
  - *Sửa:* Chỉ dùng gradient ở 1 chỗ (vd. logo hoặc 1 từ nhấn trong hero). Nút chuyển s
ang solid `bg-primary` flat, hoặc outline tinh tế. Không gradient chữ ở heading phụ.
- **[Slop] Card hover translateY(-4px):** `.card-hover:hover` (globals.css L277).
  - *Sửa:* Đổi thành `border-color` + `box-shadow` nhẹ, KHÔNG nhảy transform; hoặc nhảy
 rất nhỏ (1px) + ease-out.
- **[Slop] Icon-in-rounded-square lặp:** mọi icon trong `rounded-xl bg-primary-soft tex
t-primary` (FEATURES, STEPS, footer highlights).
  - *Sửa:* Luân phiên kiểu trình bày icon — một số dùng icon line đơn sắc không hộp, mộ
t số dùng dấu đầu dòng ký hiệu, break sự đồng nhất.
- **[G34/49] Reveal stagger nhàm chán:** `<Reveal delay={i*60}>` khắp nơi.
  - *Sửa:* Chỉ Reveal ở hero + 1-2 section trọng tâm. Các section còn lại hiện tĩnh hoặ
c dùng chuyển động khác biệt (clip/scale nhẹ thay fade-up).

### P2 — Thấp (cấu trúc nav/footer)

- **[Ft3] Footer 4 cột link + social + copyright** (footer.tsx) — footer AI phổ biến nh
ất.
  - *Sửa:* Đổi sang footer có cá tính: vd. *Statement footer* (1 câu tuyên ngôn lớn + l
ink nhóm nhỏ) hoặc *mega footer có search/highlight sản phẩm nổi bật*. Xem §3.
- **[N1b-ish] Header glass pill** — chấp nhận được nhưng nên thêm điểm nhấn riêng (vd.
badge trạng thái live, hoặc menu không dùng pill trôi nổi).

---

## 2. Đề xuất Macrostructure mới (trang chủ)

Thay vì landing 8-section, chọn **1 trong 2 hướng** (không phải cả hai):

**Hướng A — "Workbench" (khuyên dùng cho marketplace dev):**
- Hero assymetric (trái: headline + search; phải: một "terminal/image" thật hoặc previe
w sản phẩm nổi bật, KHÔNG phải blur orb).
- Ngay dưới: Product grid nổi bật (trọng tâm, chiếm diện tích lớn) thay vì giấu ở secti
on 4.
- Một dải "công nghệ hỗ trợ" (logo thật, không bịa).
- Một section "quy trình" ngắn gọn (không 3-card lặp).
- CTA cuối đơn giản, không glow.

**Hướng B — "Letter / Editorial":**
- Mở đầu bằng tuyên ngôn ngắn (manifesto 2-3 dòng lớn), giọng trực tiếp.
- Danh sách sản phẩm theo dạng danh mục dọc có phân loại rõ, ít card tròn.
- Phù hợp nếu muốn tone "độc lập, có gu" thay vì SaaS.

> **Diversification:** Không dùng lại nhịp cũ. Không có 2 khối card icon lặp (Steps vs
Features) — gộp hoặc loại một.

---

## 3. Nav & Footer mới

- **Nav:** Giữ Header hiện tại (glass pill, có search + cart + auth) — đã ổn. Thêm: act
ive state rõ hơn, có thể đổi `rounded-2xl` pill thành thanh phẳng có border dưới mềm (t
ùy chọn).
- **Footer (thay Ft3):** Chuyển sang **Ft5 Statement** — dòng tuyên ngôn lớn ("Source c
ode Việt, được kiểm duyệt bởi developer Việt") + 2-3 nhóm link nhỏ + bản quyền 1 dòng.
Bỏ cột "Công ty/Dịch vụ" rỗng trỏ về `/`.

---

## 4. Tokens & globals.css — sửa nhẹ

| Hiện tại | Đề xuất |
|----------|---------|
| `--glow`, `--glow-accent` dùng ở nhiều `shadow` | Giảm tần suất; chỉ giữ ở nút chính
và logo |
| `.card-hover` translateY(-4px) | `translateY(-1px)` + border + shadow, hoặc bỏ transf
orm |
| `animate-float` hero | Bỏ, hoặc `translateY` 6px/8s + reduced-motion |
| `.text-gradient` ở nhiều heading | Chỉ 1 chỗ (hero headline từ khóa) |
| `bg-grid` mask radial | Giữ nhưng giảm opacity 0.7→0.4 |

**Không đổi:** font stack, palette cơ bản (blue/cyan), spacing scale, dark mode.

---

## 5. Checklist sửa đổi (theo file)

- [ ] `apps/web/src/app/page.tsx`
  - [ ] Bỏ `STATS` bịa → placeholder/đếm thật hoặc xóa
  - [ ] Bỏ `TESTIMONIALS` bịa → xóa hoặc thay content thật
  - [ ] Gộp/bỏ `STEPS` + `FEATURES` trùng pattern
  - [ ] Bỏ `eyebrow` giả ở SectionHeading
  - [ ] Hero: giảm glow orb, bỏ `animate-float` (hoặc thu nhỏ)
  - [ ] CTA cuối: bỏ `glow-orb`
  - [ ] Reveal: chỉ giữ ở hero + 1 section
- [ ] `apps/web/src/components/footer.tsx`
  - [ ] Đổi sang Statement footer (Ft5)
  - [ ] Sửa link rỗng trỏ `/` → route thật hoặc bỏ
- [ ] `apps/web/src/components/header.tsx`
  - [ ] Giữ nguyên hoặc tinh chỉnh active state
- [ ] `apps/web/src/app/globals.css`
  - [ ] `.card-hover` bỏ nhảy -4px
  - [ ] Giảm `--glow` abuse
  - [ ] `.text-gradient` chỉ dùng tối đa 1 chỗ (kiểm soát tại component)
- [ ] `apps/web/src/components/product-card.tsx`, `portfolio-card.tsx`
  - [ ] Hover tinh tế, không bounce lớn
- [ ] Trang con (`products`, `du-an`, `bao-gia`, `blog`): quét cùng pattern, áp dụng nh
ất quán

---

## 6. Slop test (chạy sau khi sửa — mục tiêu 58/58)

Trọng tâm kiểm:
- G34 no horizontal scroll / overflow-x clip
- G38a không italic heading
- G46 không số liệu bịa
- G47 không vẽ fake browser/UI chrome
- G48 không inline token giữa chừng (dùng var)
- G49/50/51/52 responsive 320/375/414/768
- G53 không scroll-jump
- G54 không eyebrow/kicker giả lặp

---

## 7. Thứ tự thực hiện (gợi ý)

1. Sửa `page.tsx` (loại stats/testimonials bịa, gộp Steps/Features, bỏ eyebrow, giảm gl
ow).
2. Sửa `footer.tsx` (Statement footer).
3. Sửa `globals.css` (card-hover, glow, gradient discipline).
4. Quét trang con áp dụng nhất quán.
5. Chạy slop test, chụp screenshot 320/768/desktop để đối chiếu.
6. (Tùy chọn) `hallmark lock the system` → xuất `design.md` để lần sau đồng bộ.

---

*Plan này tuân thủ skill hallmark: giữ token/font có sẵn, chỉ sửa cấu trúc + giảm slop
visual, không xóa route hay component production.*