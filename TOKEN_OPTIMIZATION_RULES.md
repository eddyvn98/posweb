# ⚡ QUY TẮC TỐI ƯU TOKEN & HẠN MỨC QUOTA SỬ DỤNG AI (TOKEN EFFICIENCY & QUOTA SPEC)

> **Mục đích:** Đảm bảo mọi AI Agent làm việc trên dự án **posweb** tối ưu tuyệt đối dung lượng Token tiêu thụ (Input/Output), tránh tiêu tốn Quota vô ích, loại bỏ các hành vi trao đổi lan man và vòng lặp sửa code thử-sai.

---

## 🔍 1. PHÂN TÍCH NGUYÊN NHÂN NỔI BỔNG GÂY HAO TOKEN TRONG CÁC SESSION QUA

Sau khi kiểm tra các session làm việc gần đây, các điểm gây tổn hao token nghiêm trọng nhất bao gồm:

| STT | Hành vi gây hao Token | Tác hại | Mức độ tổn hao |
|---|---|---|---|
| **1** | **Dùng `write_to_file` ghi đè toàn bộ file lớn** | Phải output lại 400-600 dòng code không thay đổi mỗi lần sửa | 🔴 **CRITICAL** (~3,000 - 8,000 tokens/turn) |
| **2** | **Đọc file lan man bằng `view_file` & `list_dir` hàng loạt** | Đưa hàng nghìn dòng code không liên quan vào Context Window | 🔴 **CRITICAL** (~10,000 - 30,000 tokens/session) |
| **3** | **Lặp lại toàn bộ nội dung Artifact vào câu trả lời Chat** | Tạo ra câu trả lời cực dài dù đã có file `.md` | 🟠 **HIGH** (~2,000 - 5,000 tokens/turn) |
| **4** | **"Vibe Coding" thử-sai nhiều vòng** | Sửa code không có Spec -> Lỗi -> Sửa lại (tốn 4-6 turns) | 🔴 **CRITICAL** (~20,000 - 50,000 tokens/bug) |
| **5** | **Trả lời dài dòng, giải thích lại quy trình** | Sinh ra các đoạn văn chào hỏi & giải thích lại SDD thừa thãi | 🟡 **MEDIUM** (~500 - 1,500 tokens/turn) |
| **6** | **Grep từ khóa chung chung (VD: `click`, `data`, `id`) toàn repo** | Đưa hàng trăm kết quả tìm kiếm rác vào Context | 🔴 **CRITICAL** (~5,000 - 15,000 tokens/call) |
| **7** | **Đọc/tìm code khi người dùng chỉ đang làm rõ ý tưởng** | Gọi tool đọc file hàng trăm dòng trước khi chốt yêu cầu | 🟠 **HIGH** (~5,000 - 10,000 tokens/turn) |
| **8** | **Đọc cuốn chiếu toàn bộ file lớn bằng nhiều lần `view_file`** | Nạp hàng nghìn dòng JSX/JS không cần thiết vào context | 🔴 **CRITICAL** (~10,000 - 30,000 tokens/turn) |
| **9** | **Tự ý chạy full production build `npm run build` cho đổi nhỏ** | Sinh log build hàng trăm dòng + tốn thêm 1 turn background | 🟠 **HIGH** (~3,000 - 8,000 tokens/turn) |
| **10** | **Chạy lệnh CLI / PowerShell thử-sai lỗi escaping lặp đi lặp lại** | Sinh ra log lỗi cú pháp đỏ dài dặc nhiều lần liên tiếp | 🟠 **HIGH** (~3,000 - 10,000 tokens/session) |
| **11** | **Đọc vụn vặt nhiều lát cắt nhỏ trên cùng một file (5-8 lần view_file)** | Gây bùng nổ tool calls và trùng lặp ngữ cảnh context | 🟠 **HIGH** (~5,000 - 15,000 tokens/session) |
| **12** | **Spam `find_by_name` / `list_dir` cho đường dẫn đã rõ ràng** | Tốn tool calls không cần thiết khi đường dẫn đã biết | 🟡 **MEDIUM** (~2,000 - 5,000 tokens/session) |
| **13** | **Search web dàn trải cho các câu hỏi tư vấn / kiến thức phổ thông** | Bơm hàng loạt nội dung web không cần thiết vào context | 🟠 **HIGH** (~5,000 - 12,000 tokens/session) |

---

## 🛡️ 2. QUY TẮC BẮT BUỘC TUÂN THỦ (STRICT TOKEN-EFFICIENCY RULES)

### 📌 Quy Tắc 1: CẤM DÙNG `write_to_file` CHO FILE ĐÃ TỒN TẠI (TRỪ FILE MỚI)
- **Bắt buộc:** Dùng `replace_file_content` hoặc `multi_replace_file_content` để chỉ chỉnh sửa đúng khối dòng code cần thay đổi.
- **Ngoại lệ duy nhất:** Tạo file mới hoàn toàn hoặc file cực nhỏ (<30 dòng).

### 📌 Quy Tắc 2: TÌM KIẾM CÓ MỤC TIÊU (TARGETED EXPLORATION)
- **Bắt buộc:** Dùng `grep_search` hoặc `gitnexus` (`context`, `query`, `impact`) để định vị chính xác vị trí code cần đọc.
- **Cấm:** Duyệt từng thư mục bằng `list_dir` hoặc đọc hết file dài bằng `view_file` không có chỉ định dòng `StartLine` / `EndLine`.

### 📌 Quy Tắc 3: KHÔNG COPY/PASTE NỘI DUNG ARTIFACT VÀO CHAT
- Khi đã tạo file Artifact (`.md`), câu trả lời trong chat **chỉ chứa:**
  1. Clickable Link tới file Artifact: `[Tên file](file:///đường_dẫn)`.
  2. Tóm tắt súc tích trong 2-3 dòng.
  3. Các câu hỏi/lựa chọn chốt ý cho người dùng.

### 📌 Quy Tắc 4: PHẢI CÓ SPEC TRƯỚC KHI CODE (TRÁNH THỬ-SAI MULTI-TURN)
- Tuân thủ Bước 1 & Bước 2 của quy trình SDD (`SPEC_DRIVEN_WORKFLOW.md`).
- Xác định rõ logic và testcase trước khi sửa code để đảm bảo **ĐÚNG NGAY LẦN ĐẦU**, tránh vòng lặp sửa lỗi tốn 5-6 turn.

### 📌 Quy Tắc 5: PHẢN HỒI NGẮN GỌN & ĐI THẲNG VÀO VẤN ĐỀ
- Dùng tiếng Việt ngắn gọn, dạng danh sách (bullet points).
- Không chào hỏi xã giao rườm rà, không viết lại đề bài của người dùng, không re-explain quy tắc SDD nếu người dùng không hỏi.

### 📌 Quy Tắc 6: TRÁNH CHẠY LẠI LỆNH TRÙNG LẮP & DÙNG SYNC TIMEOUT HỢP LÝ
- Đặt `WaitMsBeforeAsync` đủ (3000-5000ms) để lệnh kết thúc đồng bộ, tránh đẩy ra background rồi tốn thêm turn gọi `manage_task` lặp đi lặp lại.
- Tránh polling hoặc lặp lại các lệnh status không cần thiết.

### 📌 Quy Tắc 7: CẤM GREP TỪ KHÓA CHUNG CHUNG TRÊN TOÀN BỘ REPO
- Không grep từ quá phổ biến (`click`, `set`, `data`, `handle`, `change`, `barcode`).
- Bắt buộc thu hẹp `SearchPath` tới 1 file/thư mục cụ thể (`src/pages`, `src/components`) hoặc dùng `gitnexus`.

### 📌 Quy Tắc 8: KHÔNG DÙNG TOOL ĐỌC CODE KHÔNG CẦN THIẾT KHI CHỈ THẢO LUẬN Ý TƯỞNG
- Khi người dùng đang giải thích/làm rõ ý tưởng, chỉ phản hồi chat ngắn gọn xác nhận. KHÔNG tự ý chạy grep/view_file cho đến khi người dùng yêu cầu thực thi code.

### 📌 Quy Tắc 9: CẤM ĐỌC CUỐN CHIẾU TOÀN BỘ FILE LỚN (PAGING `view_file` HÀNG LOẠT)
- Tuyệt đối không gọi 4-5 lần `view_file` liên tiếp để đọc toàn bộ file 500-1000 dòng.
- Phải dùng grep định vị chính xác vị trí hàm/thành phần cần sửa và chỉ đọc tối đa 30-50 dòng quanh vị trí đó.

### 📌 Quy Tắc 10: CẤM TỰ Ý CHẠY `npm run build` CHO CHỈNH SỬA UI/LOGIC NHỎ
- Không chạy production build gây log dài và tốn turn trừ khi người dùng yêu cầu hoặc release.
- Sử dụng dev server HMR hoặc kiểm tra lỗi cú pháp nhanh.

### 📌 Quy Tắc 11: CẤM THỬ-SAI LỆNH SHELL PHỨC TẠP INLINE (COMMAND TRIAL-AND-ERROR)
- Với script Node hoặc PowerShell phức tạp có nhiều dấu ngoặc/chuỗi thoát, phải kiểm tra cú pháp chuẩn hoặc ghi file script tạm thay vì gõ lệnh inline gây lỗi crash 5-8 lần liên tiếp.

### 📌 Quy Tắc 12: CẤM ĐỌC VỤN VẶT NHIỀU LẦN (FRAGMENTED RE-READING) TRÊN CÙNG 1 FILE
- Không chia nhỏ `view_file` thành 5-8 lần đọc từng khúc 20-30 dòng trên cùng một file. Phải định vị hàm / block cần sửa và đọc 1 lần bao trọn 50-80 dòng liên quan.

### 📌 Quy Tắc 13: CẤM TÌM KIẾM ĐƯỜNG DẪN ĐÃ BIẾT (REFLEXIVE PATH SEARCHING)
- Không gọi `find_by_name` hoặc `list_dir` phản xạ khi đường dẫn đã rõ ràng (ví dụ: các file chuẩn trong `src/pages`, `src/components`, `bot_backend`). Truy cập trực tiếp đường dẫn.

### 📌 Quy Tắc 14: CẤM SEARCH WEB DÀN TRẢI CHO CÂU HỎI TƯ VẤN THÔNG THƯỜNG
- Với các câu hỏi giải thích, kiến thức phổ thông, tư vấn thiết kế/kỹ thuật, trả lời trực tiếp từ tri thức mô hình. Không tự ý gọi `search_web` / `read_url_content` liên tục trừ khi có yêu cầu tra cứu tài liệu mới hoặc link bên ngoài.

---

## 📌 3. THƯỚC ĐO HIỆU QUẢ (KPIS TỐI ƯU TOKEN)
- **Output Token/Turn:** Không vượt quá 500 - 800 tokens cho mỗi câu trả lời chat.
- **Turns to Resolve Task:** Tối đa 2-3 turns cho các công việc chỉnh sửa vừa và nhỏ.
- **Code Edit Method:** 100% các file sửa đổi hiện có phải dùng `replace_file_content`.
