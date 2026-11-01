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
| **14** | **Background Task Polling Trap (`manage_task(status)` loop & tin nhắn "Đang...")** | Chạy lệnh nhanh với `WaitMsBeforeAsync` thấp (<5s) đẩy ra background, sau đó poll status và chat rác mỗi turn | 🔴 **CRITICAL** (~10,000 - 40,000 tokens/session, nhân đôi turns) |
| **15** | **Lạm dụng DevTools Screenshot + nạp ảnh Multimodal nhiều lần** | Chụp 3-4 screenshot liên tiếp và gọi `view_file` xem ảnh chỉ để canh lề/font-size CSS | 🔴 **CRITICAL** (~15,000 - 35,000 tokens/session) |
| **16** | **Lan man mở file tiêu thụ không liên quan (Exploration Bloat / Scope Creep)** | Yêu cầu sửa UI 1 component nhưng mở đọc 5-6 component consumer khác | 🟠 **HIGH** (~8,000 - 20,000 tokens/session) |
| **17** | **Đọc cuốn chiếu / Chắp vá khi giải quyết xung đột Git (Fragmented Patching)** | Đọc 20 dòng rồi sửa, đọc tiếp 20 dòng rồi sửa gây vỡ cấu trúc cú pháp (unclosed bracket) | 🟠 **HIGH** (~5,000 - 15,000 tokens/turn) |
| **18** | **Đọc lặp lại schema JSON của MCP tools & Thử-sai cú pháp Windows/JSX** | Gọi `view_file` đọc schema JSON từng tool; dùng cú pháp Linux (`tail`, `|`) trên PowerShell | 🟡 **MEDIUM** (~2,000 - 6,000 tokens/session) |
| **19** | **Nạp ảnh Multimodal liên tiếp bằng `view_file` (.png/.jpg)** | Gọi `view_file` nạp 2-3 ảnh độ phân giải cao vào context cùng lúc; tích lũy ngốn context | 🔴 **CRITICAL** (~10,000 - 30,000 tokens/session) |
| **20** | **Sửa script/code bằng PowerShell `-replace` inline** | Dùng regex replace qua dòng lệnh bị lỗi escaping chuỗi, chạy AST parser 7-10 turns liên tiếp | 🔴 **CRITICAL** (~15,000 - 25,000 tokens/session) |
| **21** | **Mò mẫm in ấn & tạo script tạm vụn vặt (`check_*.ps1`, `print_*.ps1`)** | Mỗi lần in lại viết script mới, thăm dò máy in từ đầu và poll `Get-PrintJob` liên tục | 🟠 **HIGH** (~10,000 - 30,000 tokens/session) |
| **22** | **Bẫy Sandbox Access Denied (`C:\: Access is denied`)** | Quên `BypassSandbox: true` khi chạy lệnh chạm đường dẫn hệ thống/ngoài repo | 🟡 **MEDIUM** (~2,000 - 5,000 tokens/session) |
| **23** | **Báo cáo giải thích dài dòng (>2000 ký tự) cho lệnh thực thi nhanh** | Viết đoạn văn dài lý thuyết in ấn/màu sắc khi user chỉ yêu cầu "in đi", "chạy lại" | 🟠 **HIGH** (~1,000 - 3,000 tokens/turn) |
| **24** | **Dump output dài không lọc trên terminal (`Get-ChildItem -Recurse`, `Format-List *`)** | Xả 600-1000 dòng file bin/obj nuget hoặc dump nguyên bảng CIM/WMI properties rác vào context | 🔴 **CRITICAL** (~4,000 - 15,000 tokens/call) |
| **25** | **Polling process thủ công (`Get-Process` + `Start-Sleep` loop) hàng chục lần** | Gọi lặp lại `Get-Process` 40-70 lần trong PowerShell để chờ app/service thay vì dùng cơ chế reactive | 🔴 **CRITICAL** (~20,000 - 60,000 tokens/session) |
| **26** | **Thử-sai mò mẫm công cụ in/convert (SumatraPDF, Ghostscript, pdfium) không xác thực** | Gọi hàng loạt công cụ không cài sẵn rồi fail liên tiếp, chạy lệnh Edge print lỗi cú pháp | 🟠 **HIGH** (~5,000 - 15,000 tokens/session) |
| **27** | **Tạo script tạm vụn vặt cho từng bước nhỏ của tác vụ file/dọn đĩa (`check_*.ps1`, `move_*.ps1`, `verify_*.ps1`)** | Tạo 8-12 file script riêng cho từng thao tác kiểm tra/copy/xóa/shortcut, biến 1 tác vụ 5 phút thành 78 turns | 🔴 **CRITICAL** (~25,000 - 60,000 tokens/session) |
| **28** | **Scan đệ quy sâu không giới hạn (`Get-ChildItem -Recurse`) trên thư mục người dùng / toàn ổ** | Quét đệ quy `C:\Users` hoặc `AppData` gây nghẽn IO, timeout, crash phải thử lại nhiều lần | 🔴 **CRITICAL** (~15,000 - 35,000 tokens/session) |
| **29** | **Nhảy cóc thử-sai ngôn ngữ kịch bản (Python <-> PowerShell) cho tác vụ hệ thống Windows** | Viết Python rồi lỗi môi trường đổi sang PowerShell, rồi lại chuyển về Python, tiêu tốn turn vô ích | 🟠 **HIGH** (~8,000 - 20,000 tokens/session) |

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

### 📌 Quy Tắc 15: CẤM BẪY POLLING BACKGROUND TASK & CHAT RÁC "ĐANG..."
- Với mọi lệnh CLI thông thường (`git`, `node`, kiểm tra file), bắt buộc đặt `WaitMsBeforeAsync` từ **8000 đến 10000ms** để lệnh hoàn tất đồng bộ trong 1 turn duy nhất.
- Nếu lệnh vô tình chuyển sang background task: **TUYỆT ĐỐI CẤM** gọi `manage_task(Action: 'status')` để polling ngay lập tức.
- **CẤM** phát sinh tin nhắn rỗng kiểu "Đang kiểm tra...", "Đang tạo nhánh..." làm lãng phí turn chat; hãy dừng gọi tool và kết thúc lượt để hệ thống tự động đánh thức (reactive wakeup) khi lệnh hoàn tất.

### 📌 Quy Tắc 16: CẤM LẠM DỤNG SCREENSHOT DEVTOOLS ĐỂ SOI CSS (ƯU TIÊN DOM EVALUATION)
- Khi kiểm tra giao diện CSS (font-size, khoảng cách, màu sắc, sticky header, vị trí phần tử): Bắt buộc dùng `evaluate_script` trả về JSON số đo tọa độ (`getBoundingClientRect()`, `window.getComputedStyle()`) với chi phí chỉ < 50 tokens.
- **CẤM** chụp ảnh liên tiếp và gọi `view_file` nạp ảnh (`.png`/`.jpg`) vào context nhiều lần liên tục làm bùng nổ hàng chục ngàn multimodal tokens. Chỉ chụp 1 ảnh cuối cùng khi hoàn thiện và người dùng yêu cầu xem lại.
- **CẤM** đọc đi đọc lại các file schema JSON của MCP server (`navigate_page.json`, `take_screenshot.json`...).

### 📌 Quy Tắc 17: GIỮ ĐÚNG PHẠM VI CỤC BỘ CẦN SỬA (STRICT LOCAL SCOPE)
- Khi người dùng cung cấp ảnh hoặc yêu cầu chỉnh sửa một component cụ thể: **CHỈ tập trung đọc và sửa đúng file component đó**.
- **CẤM** lan man mở và đọc các file component tiêu thụ (consumers) xung quanh nếu không có yêu cầu tái cấu trúc toàn diện.

### 📌 Quy Tắc 18: ĐỌC TRỌN KHỐI BLOCK KHI RESOLVE CONFLICT HOẶC SỬA HÀM DÀI
- Khi xử lý xung đột Git (conflict markers `<<<<<<<`) hoặc hàm có cấu trúc lồng nhau: Đọc bao quát 1 lần toàn bộ khối block liên quan (50–80 dòng) để nhìn rõ mở/đóng ngoặc `{ }` và cấu trúc `try/catch`.
- Sửa dứt điểm trong 1 lần `replace_file_content` duy nhất, tránh tình trạng chắp vá 10 dòng một gây vỡ cú pháp (unclosed bracket/PostCSS error).

### 📌 Quy Tắc 19: CHUẨN HÓA CÚ PHÁP POWERSHELL & TEXT LITERAL TRONG JSX
- Trên Windows PowerShell: Tuyệt đối không dùng cú pháp Linux pipes (`2>&1 | tail -n`, `grep`, `head`). Dùng lệnh PowerShell chuẩn hoặc không pipe dài.
- Trong JSX: Không dùng HTML entities (`&amp;`) trong text node gây lỗi hiển thị lặp; viết trực tiếp ký tự thông thường hoặc bao trong chuỗi `{' & '}`.

### 📌 Quy Tắc 20: CẤM NẠP NHIỀU ẢNH MULTIMODAL LIÊN TIẾP BẰNG `view_file` (IMAGE TOKEN OVERLOAD)
- Mỗi file ảnh nạp vào context qua `view_file` tiêu tốn **1,500 - 3,000+ tokens** và tồn tại vĩnh viễn trong context lịch sử của toàn bộ session.
- **CẤM** gọi `view_file` 2-3 ảnh trong cùng 1 turn hoặc gọi xem ảnh lặp đi lặp lại chỉ để kiểm tra kích thước/biên độ ảnh.
- **Bắt buộc:** Dùng script (Node.js/PowerShell `System.Drawing`) đọc và in ra metadata (Width, Height, Bounds) ở dạng text (<50 tokens). CHỈ mở xem đúng 1 ảnh duy nhất khi người dùng yêu cầu đánh giá trực quan.

### 📌 Quy Tắc 21: CẤM SỬA FILE/SCRIPT BẰNG LỆNH POWERSHELL `-replace` HOẶC REGEX INLINE
- Tuyệt đối không dùng `Get-Content ... -replace ... | Set-Content` hoặc bash `sed` qua `run_command` để chỉnh sửa file code/script.
- Hành vi này luôn dẫn tới bẫy quote escaping, vỡ cú pháp và kéo theo 7-15 turns sửa lỗi AST parser vô ích.
- **Bắt buộc:** Luôn dùng `replace_file_content` với TargetContent chính xác để sửa đổi code hoặc script.

### 📌 Quy Tắc 22: TÁI SỬ DỤNG SCRIPT CHUẨN CHO TÁC VỤ IN ẤN & OS (CẤM TẠO SCRIPT VỤN VẶT & CẤM POLL `Get-PrintJob`)
- Khi thực hiện các tác vụ in ấn hoặc thao tác OS:
  - Tái sử dụng script chuẩn dùng chung (như `Print-BagTopperA4.ps1` hoặc module in ấn tập trung) bằng cách truyền tham số (`-Copies`, `-ColorMode`, `-ImagePath`).
  - **CẤM** mỗi lần in lại tạo 1 script tạm mới (`check_printer.ps1`, `print_all.ps1`, `print_bw.ps1`, `print_additional_copy.ps1`...).
  - **CẤM** liên tục gọi `Get-PrintJob` trong nhiều turns liên tiếp để thăm dò. Lệnh in đã được chuyển vào Windows Spooler là hoàn tất phía Agent; thông báo kết quả ngay cho người dùng.

### 📌 Quy Tắc 23: CHỦ ĐỘNG DÙNG `BypassSandbox: true` KHI CHẠY LỆNH LIÊN QUAN ĐẾN ĐƯỜNG DẪN NGOÀI REPO / IN ẤN TRÊN WINDOWS
- Trên môi trường Windows, Standard Sandbox sẽ chặn truy cập `C:\` dẫn tới lỗi `granting access to C:\: Access is denied.`
- Khi chạy lệnh PowerShell, Node CLI, in ấn, hoặc truy cập file ngoài thư mục dự án (Desktop, Downloads, thư mục scratch trong brain), **chủ động đặt `BypassSandbox: true` ngay từ đầu** để tránh tốn 1 turn nhận lỗi Access Denied và phải retry lại.

### 📌 Quy Tắc 24: PHẢN HỒI THỰC THI SIÊU GỌN CHO CÁC LỆNH HÀNH ĐỘNG ("IN ĐI", "CHẠY LẠI")
- Khi người dùng gửi lệnh hành động ngắn gọn ("in luôn đi", "in tờ 3", "in lại trắng đen"):
  - **CẤM** viết đoạn văn dài > 500 từ giải thích lý thuyết màu sắc, DPI, vi sai căn lề hay các bước kỹ thuật rườm rà.
  - **Bắt buộc:** Phản hồi siêu ngắn gọn (< 100 từ, 1-2 câu):
    - Đã in file nào, tới máy in nào, số lượng bao nhiêu bản, chế độ in (màu/trắng đen).
    - Hết lượt (stop turn).

### 📌 Quy Tắc 25: CẤM DUMP OUTPUT DÀI KHÔNG LỌC TRÊN TERMINAL (`Select-Object` BẮT BUỘC)
- **CẤM** chạy `Get-ChildItem -Recurse` trên các thư mục lớn (`src`, `node_modules`, `bin`, `obj`) làm tràn 500-1,000 dòng file rác vào context.
- **CẤM** dùng `Format-List *` hoặc dump toàn bộ CIM/WMI object của printer/process.
- **Bắt buộc:** Luôn lọc thuộc tính cần thiết (`Select-Object -First 10 -Property Name, Length, LastWriteTime`), hoặc giới hạn độ sâu `-Depth 1` và trỏ thẳng vào thư mục cụ thể.

### 📌 Quy Tắc 26: CẤM DÙNG `Start-Sleep` & POLLING PROCESS (`Get-Process`) LIÊN TỤC TRÊN SHELL
- **CẤM** chạy vòng lặp lệnh PowerShell liên tục kiểm tra `Get-Process` hoặc `Get-PrintJob` kết hợp `Start-Sleep` để chờ process kết thúc (đã phát hiện lặp lại 40-70 lần trong các session dài).
- Tuân thủ nghiêm ngặt chỉ dẫn hệ thống: "Never run a background 'sleep' command to set a timer".
- Nếu cần chạy lệnh lâu dài: chuyển sang background daemon hoặc tăng `WaitMsBeforeAsync` và để hệ thống tự động wakeup khi hoàn tất.

### 📌 Quy Tắc 27: CHUẨN HÓA XUẤT FILE & IN ẤN TRÊN WINDOWS (XÁC THỰC TRƯỚC, TRÁNH THỬ-SAI)
- Khi thực hiện xuất PDF (headless Edge/Chrome) hoặc in tài liệu:
  - Kiểm tra đường dẫn chính xác (dùng forward slash hoặc escape backslash chuẩn cho URL/file).
  - Không mò mẫm các công cụ bên ngoài không được cài đặt (`SumatraPDF`, `Ghostscript`, `pdfium`).
  - Tái sử dụng script in chuẩn đã có trong dự án với tham số rõ ràng.

### 📌 Quy Tắc 28: GOM LUỒNG TÁC VỤ FILE & QUẢN TRỊ HỆ THỐNG VÀO 1 SCRIPT DUY NHẤT (CẤM TẠO SCRIPT VỤN VẶT TỪNG BƯỚC)
- Khi thực hiện dọn dẹp, sao chép hoặc di chuyển thư mục/file:
  - **CẤM** tạo hàng loạt file script rải rác (`check_*.ps1`, `move_*.ps1`, `verify_*.ps1`, `cleanup_*.ps1`) biến 1 tác vụ đơn giản thành 60-80 turns.
  - **Bắt buộc:** Gom trọn vẹn chu trình (Kiểm tra dung lượng -> Copy bảo toàn -> Xác thực khớp dung lượng/file count -> Tạo Shortcut nếu cần -> Xóa nguồn khi an toàn) vào DUY NHẤT 1 script PowerShell hoặc 1 file script tạm chuẩn.
  - Phản hồi kết quả tổng hợp trong 1 turn sau khi script hoàn thành.

### 📌 Quy Tắc 29: QUÉT DUNG LƯỢNG Ổ ĐĨA & THƯ MỤC PHÂN TẦNG CÓ CHỌN LỌC (CẤM QUÉT ĐỆ QUY TỔNG THỂ KHÔNG GIỚI HẠN)
- **CẤM** chạy `Get-ChildItem -Recurse` đệ quy sâu từ gốc ổ đĩa (`C:\`) hoặc toàn bộ thư mục User Profile (`C:\Users\...` chứa `AppData`, symlinks, quyền Admin) gây nghẽn I/O, tràn context và timeout treo session.
- **Bắt buộc:** Quét phân tầng (Layered Scanning):
  1. Tầng 1: Kiểm tra dung lượng các thư mục cấp 1 bằng `Get-ChildItem -Directory` hoặc `-Depth 1`.
  2. Tầng 2: Chỉ khi người dùng yêu cầu hoặc phát hiện thư mục chiếm dung lượng lớn cụ thể mới đào sâu vào đúng thư mục mục tiêu đó.

### 📌 Quy Tắc 30: NHẤT QUÁN CÔNG CỤ TRÊN WINDOWS (ƯU TIÊN POWERSHELL THUẦN CHO TÁC VỤ OS & FILE)
- Với mọi tác vụ quản trị hệ thống Windows (dung lượng đĩa, SMART/health, file/folder operations, shortcut `.lnk`, tiến trình, service):
  - **Bắt buộc:** Dùng PowerShell chuẩn kết hợp `BypassSandbox: true`.
  - **CẤM:** Nhảy cóc thử-sai giữa Python và PowerShell (viết script Python rồi thiếu module/lỗi đường dẫn lại đổi sang PowerShell rồi lại quay lại).

---

## 📌 3. THƯỚC ĐO HIỆU QUẢ (KPIS TỐI ƯU TOKEN)
- **Output Token/Turn:** Không vượt quá 500 - 800 tokens cho mỗi câu trả lời chat.
- **Turns to Resolve Task:** Tối đa 2-3 turns cho các công việc chỉnh sửa vừa và nhỏ.
- **Code Edit Method:** 100% các file sửa đổi hiện có phải dùng `replace_file_content`.
