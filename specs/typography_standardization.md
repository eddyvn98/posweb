# CHUẨN HÓA TYPOGRAPHY & KÍCH THƯỚC FONT CHỮ DÀNH CHO POSWEB

## 1. MỤC TIÊU (GOAL & CONTEXT)
Chuẩn hóa hệ thống Typography và kích thước font chữ trên tất cả các màn hình (Trang chủ, Bán hàng, Sản phẩm, Nhập hàng, Sổ quỹ, Lịch sử, Báo cáo, Cài đặt, In tem, Import sheet) và các Modal popup. Đảm bảo giao diện đồng bộ, chuyên nghiệp, tuân thủ đúng định hướng POS: "Dễ đọc, bấm nhanh, phân cấp rõ ràng".

---

## 2. KỊCH BẢN BDD (GHERKIN SPECIFICATION)

### Feature: Chuẩn hóa hệ thống Typography POSWeb

  Scenario: Tiêu đề trang (Page Header H1) đồng bộ trên tất cả các màn hình chính
    Given người dùng chuyển đổi qua lại giữa các trang (Home, Products, Sales, Imports, Cashbook, History, Reports, Settings, PriceTagPrint, SheetImport)
    When tiêu đề màn hình được hiển thị tại thanh trên cùng (Page Header)
    Then tiêu đề tất cả các trang phải thống nhất sử dụng class `text-2xl font-bold text-gray-900`
    And phụ đề hoặc mô tả trang (nếu có) phải sử dụng class `text-xs text-gray-500`

  Scenario: Tiêu đề Modal (Modal Title H2) đồng bộ trên tất cả các hộp thoại popup
    Given người dùng mở bất kỳ Modal nào (CheckoutModal, QuickSaleModal, ProductFormModal, InvoiceModal, BulkImportModal, SupplierFormModal, SupplierManagerModal, VoidModal)
    When tiêu đề của Modal xuất hiện ở phần Header của hộp thoại
    Then tất cả tiêu đề Modal phải thống nhất sử dụng class `text-xl font-bold text-gray-900`

  Scenario: Tiêu đề phân đoạn (Section Header H3) và Tiêu đề bảng/nhóm (Group Title H4)
    Given người dùng xem các thẻ thông tin (Card), phân đoạn cấu hình hoặc bảng dữ liệu
    When các tiêu đề phân đoạn hoặc tiêu đề cột của bảng được dựng
    Then tiêu đề phân đoạn (Section Header) sử dụng class `text-lg font-bold text-gray-800`
    And tiêu đề cột bảng hoặc tên nhóm thông tin (Subheader/Group Title) sử dụng class `text-xs font-bold uppercase tracking-wider text-gray-500`

  Scenario: Nhãn form, văn bản nhập liệu và nút bấm
    Given người dùng tương tác với các form nhập liệu, ô tìm kiếm và các nút hành động
    When các thành phần form và button hiển thị
    Then nhãn ô nhập liệu (Form Label) sử dụng `text-sm font-medium text-gray-700`
    And nội dung ô nhập liệu (Input Text) và nút bấm chuẩn sử dụng `text-sm font-medium` (với min-height ≥ 44px/48px)

  Scenario: Hiển thị chỉ số tài chính và tổng tiền
    Given người dùng xem tổng tiền thanh toán, số dư sổ quỹ hoặc các chỉ số báo cáo
    When các con số điểm thưởng, tổng tiền, doanh thu hiển thị
    Then tổng tiền thanh toán và chỉ số KPI chính hiển thị nổi bật với `text-3xl font-black text-primary` hoặc `text-2xl font-bold`

---

## 3. QUY ĐỊNH BẢNG TỪ ĐỂN TYPOGRAPHY (TYPOGRAPHY SCALE MAP)

| Phân cấp | Size Tailwind | Kích thước CSS | Weight | Ứng dụng |
| :--- | :--- | :--- | :--- | :--- |
| **Page Header (H1)** | `text-2xl` | 24px / 1.5rem | `font-bold` | Header chính trên cùng của tất cả các trang |
| **Modal Header (H2)** | `text-xl` | 20px / 1.25rem | `font-bold` | Header tất cả popup / modal |
| **Section Title (H3)** | `text-lg` | 18px / 1.125rem | `font-bold` | Tiêu đề khối / card lớn |
| **Subsection (H4)** | `text-base` | 16px / 1rem | `font-semibold` | Sub-section / card phụ / tên sản phẩm nổi bật |
| **Table Header / Label** | `text-xs` | 12px / 0.75rem | `font-bold uppercase tracking-wider` | Tiêu đề cột bảng, nhãn nhóm |
| **Form Label** | `text-sm` | 14px / 0.875rem | `font-medium` | Nhãn của ô input, select, textarea |
| **Body / Input Text** | `text-sm` | 14px / 0.875rem | `font-normal` / `font-medium` | Nội dung ô nhập liệu, danh sách dòng, bảng dữ liệu |
| **Caption / Subtitle** | `text-xs` | 12px / 0.75rem | `font-normal text-gray-500` | Mô tả phụ, thời gian, chú thích bên dưới |
| **Hero Metric / Total** | `text-3xl` / `text-2xl` | 24-30px | `font-black` / `font-extrabold` | Tổng tiền giỏ hàng, doanh thu, tổng thu/chi |

---

## 4. TIÊU CHÍ CHẤP NHẬN (ACCEPTANCE CRITERIA)
1. 100% tiêu đề trang (H1) trên tất cả 10+ màn hình thống nhất font size `text-2xl font-bold`.
2. 100% tiêu đề Modal (H2) trên tất cả các Modal popups thống nhất font size `text-xl font-bold`.
3. Loại bỏ hoàn toàn sự khập khiễng giữa `text-2xl`, `text-xl`, `text-3xl font-black` ở vị trí tiêu đề trang.
4. Bổ sung utility classes trong `src/index.css` để định nghĩa rõ typography tokens nếu cần.
5. Kiểm thử ứng dụng xây dựng thành công (`npm run build`), không có lỗi vỡ layout hoặc lỗi syntax.
