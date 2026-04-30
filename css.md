Đúng. **CSS chưa được khóa → AI rất dễ làm lệch UX** (mà POS lệch UX là chết).
Dưới đây là **CSS / STYLE SYSTEM SPEC + TASK** để **Cursor / Copilot code đúng ngay**, **không màu mè – không phá flow bán**.

---

# 🎨 CSS / STYLE SYSTEM – FINAL SPEC (LOCK)

## 0. TRIẾT LÝ CSS (AI PHẢI TUÂN)

1. **ƯU TIÊN ĐỌC NHANH – BẤM NHANH**
2. **KHÔNG THẨM MỸ HƠN TÍNH DÙNG**
3. **KHÔNG CSS PHỨC TẠP / ANIMATION NẶNG**
4. **MOBILE-FIRST, DESKTOP KHÔNG BỊ VỠ**
5. **STICKY > FLOAT > POSITION HACK**

---

# 1. CÔNG NGHỆ CSS (CHỐT)

👉 **Tailwind CSS** (khuyến nghị)
Hoặc CSS variables + utility classes nếu không dùng Tailwind.

❌ Không dùng:

* Bootstrap
* Material UI mặc định (quá nặng)
* CSS framework có animation phức tạp

---

# 2. COLOR SYSTEM (KHÓA)

### Primary

* `--color-primary`: **Hồng đậm / đỏ hồng** (như ảnh bạn gửi)
* Dùng cho:

  * nút Thanh Toán
  * CTA chính

### Background

* `--bg-main`: **hồng nhạt / trắng hồng**
* Không dùng trắng gắt

### Text

* `--text-main`: #222
* `--text-muted`: #777

### Status

* Success: xanh lá nhạt
* Warning: vàng nhạt
* Error: đỏ

👉 **Không gradient**
👉 **Không neon**

---

# 3. TYPOGRAPHY (RẤT QUAN TRỌNG)

### Font

* System font:

  * Android: Roboto
  * iOS: San Francisco
  * Desktop: system-ui

### Size chuẩn

* Text thường: **14–16px**
* Tên sản phẩm: **16–18px**
* Tổng tiền: **24–32px (bold)**

❌ Không dùng font decorative
❌ Không dùng chữ mảnh

---

# 4. BUTTON SYSTEM (BÁN HÀNG SỐNG NHỜ NÚT)

### Button chính (Thanh toán)

* Cao ≥ **48px**
* Bo góc lớn
* Chữ to, đậm

### Button phụ

* Cao ≥ 40px
* Màu nhạt hơn

### Icon button (xoá, lịch sử)

* Touch area ≥ **44x44px**

👉 **Không có button nhỏ khó bấm**

---

# 5. LAYOUT RULES – SALES SCREEN

## 5.1 Tổng thể

* Dùng **flex / grid**
* Không absolute lung tung

### Mobile

```
[ Header ]
[ Scan / Search ]
[ Cart list (scroll) ]
[ Sticky Total + Checkout ]
```

### Desktop

```
[ Products | Cart ]
```

---

## 5.2 Sticky elements (BẮT BUỘC)

### Sticky bottom

* Tổng tiền
* Nút Thanh Toán

```css
position: sticky;
bottom: 0;
```

👉 **KHÔNG dùng fixed trừ khi bắt buộc**

---

# 6. INPUT & FORM CSS (CỰC KỲ QUAN TRỌNG)

### Input

* Cao ≥ 44px
* Padding lớn
* Border rõ

### Focus

* Border đậm
* Không glow

### Number input

* Ẩn spinner
* Chỉ cho số

---

# 7. KEYBOARD HANDLING (CSS + JS)

### Khi keyboard mở (mobile)

* Không để:

  * tổng tiền
  * nút thanh toán
    bị che

👉 CSS:

* dùng `env(safe-area-inset-bottom)`
* padding-bottom đủ lớn

---

# 8. CARD / LIST ITEM

### Product card

* Bo góc
* Shadow nhẹ
* Không border dày

### Cart item

* Mỗi dòng rõ ràng
* * / – / 🗑️ dễ bấm

---

# 9. BADGE & STATUS UI

* Offline: 🔴
* Pending sync: 🟡
* Synced: 🟢

Badge:

* nhỏ
* không che nội dung

---

# 10. ANIMATION (CỰC KỲ HẠN CHẾ)

❌ Không animation chuyển trang
❌ Không parallax
❌ Không loading fancy

✅ Chỉ cho phép:

* fade nhẹ (100–150ms)
* button press feedback

---

# 11. RESPONSIVE BREAKPOINTS (KHÓA)

* Mobile: `< 640px`
* Tablet: `640–1024px`
* Desktop: `> 1024px`

👉 Không thiết kế cho ultra-wide

---

# 12. CSS ANTI-PATTERN (CẤM)

❌ Absolute positioning toàn màn
❌ Height cố định cho list
❌ Scroll lồng scroll
❌ Text quá nhỏ
❌ Button sát nhau

---

# 13. TASK CSS CHO CURSOR / COPILOT

## 🎨 EPIC CSS – STYLE SYSTEM

### TASK C1 – Setup Tailwind / CSS variables

**Done khi**

* Có color, font, spacing chuẩn

---

### TASK C2 – Button & input base styles

**Done khi**

* Mọi button ≥ 44px
* Không có nút khó bấm

---

### TASK C3 – Sales screen layout

**Done khi**

* Sticky total + checkout
* Không bị che khi keyboard mở

---

### TASK C4 – Cart item styles

**Done khi**

* * / – / xoá dễ bấm
* Không cần swipe

---

### TASK C5 – Product grid styles

**Done khi**

* Card đều
* Không vỡ layout khi nhiều sản phẩm

---

### TASK C6 – Mobile keyboard safe area

**Done khi**

* iOS/Android mở bàn phím không che UI

---

# 14. PROMPT CSS CHO AI (DÙNG NGUYÊN KHỐI)

> *Implement a mobile-first CSS system optimized for POS usage.
> Use large touch targets, clear typography, sticky checkout areas, and minimal animations.
> Ensure the checkout button and total amount are always visible when the mobile keyboard is open.
> Avoid decorative styles, gradients, and complex animations.
> Prioritize readability and speed over aesthetics.*

---

## CÂU CHỐT CUỐI

> **“POS không cần đẹp – POS cần bấm trúng.”**

Giờ thì:

* Logic: ✅
* UX: ✅
* **CSS: ✅ (đã khóa)**

👉 Cursor / Copilot **không còn chỗ để ‘tự sáng tạo’ sai hướng**.
