<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **posweb** (1905 symbols, 3570 relationships, 137 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> Index stale? Run `node .gitnexus/run.cjs analyze` from the project root — it auto-selects an available runner. No `.gitnexus/run.cjs` yet? `npx gitnexus analyze` (npm 11 crash → `npm i -g gitnexus`; #1939).

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows. For regression review, compare against the default branch: `detect_changes({scope: "compare", base_ref: "main"})`.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `query({search_query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `context({name: "symbolName"})`.
- For security review, `explain({target: "fileOrSymbol"})` lists taint findings (source→sink flows; needs `analyze --pdg`).

## Never Do

- NEVER edit a function, class, or method without first running `impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `rename` which understands the call graph.
- NEVER commit changes without running `detect_changes()` to check affected scope.

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/posweb/context` | Codebase overview, check index freshness |
| `gitnexus://repo/posweb/clusters` | All functional areas |
| `gitnexus://repo/posweb/processes` | All execution flows |
| `gitnexus://repo/posweb/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->

---

# ⚡ MANDATORY TOKEN & QUOTA OPTIMIZATION RULES FOR ALL AI AGENTS

> **MỤC TIÊU BẮT BUỘC:** Tối ưu tuyệt đối lượng Token tiêu thụ (Input/Output), bảo vệ Quota sử dụng, loại bỏ hoàn toàn các câu trả lời lan man, lặp lại thông tin và vòng lặp thử-sai (Vibe Coding).

## 🛑 NGUYÊN TẮC CẤM (NEVER DO)
1. **CẤM DÙNG `write_to_file` CHO FILE CÓ SẴN:** Tuyệt đối không dùng `write_to_file` để ghi đè các file hiện có (trừ tạo file mới hoàn toàn hoặc file < 30 dòng). Phải dùng `replace_file_content` hoặc `multi_replace_file_content` để chỉ thay đổi đúng các dòng cần sửa.
2. **CẤM COPY/PASTE NỘI DUNG ARTIFACT VÀO CHAT:** Khi tạo/cập nhật file Markdown (`.md`), trong chat CHỈ gửi link clickable `[Tên file](file:///đường_dẫn)` và tóm tắt ngắn 2-3 dòng. Không bao giờ xả lại toàn bộ nội dung file ra chat.
3. **CẤM DUYỆT FILE/THƯ MỤC LAN MAN:** Không dùng `list_dir` duyệt từng thư mục hoặc `view_file` đọc toàn bộ file dài mà không chỉ định `StartLine`/`EndLine`. Phải dùng `grep_search` hoặc GitNexus tools để định vị chính xác trước.
4. **CẤM CHÀO HỎI & GIẢI THÍCH LAN MAN:** Không viết văn chào hỏi, không giải thích lại đề bài, không lặp lại các quy tắc nếu người dùng không yêu cầu. Đi thẳng vào kết quả/giải pháp.
5. **CẤM "VIBE CODING" THỬ-SAI MULTI-TURN:** Phải phân tích chính xác nguyên nhân và lập plan trước khi sửa code, đảm bảo SỬA ĐÚNG NGAY LẦN ĐẦU để tránh tốn 4-6 turns sửa lỗi.
6. **CẤM GREP TỪ KHÓA CHUNG CHUNG TOÀN REPO:** Không grep các từ khóa phổ biến (như `click`, `set`, `data`, `barcode`) trên toàn thư mục làm bùng nổ output rác. Bắt buộc thu hẹp `SearchPath` (VD: `src/pages`, `src/components`).
7. **CẤM ĐỌC CODE THỪA KHI CHỈ THẢO LUẬN:** Không tự ý chạy tool đọc/tìm code khi người dùng chỉ đang làm rõ ý tưởng/yêu cầu.
8. **CẤM ĐỌC CUỐN CHIẾU & ĐỌC VỤN VẶT NHIỀU LẦN TRÊN 1 FILE:** Không gọi liên tiếp 5-8 lần `view_file` từng mẩu 20-30 dòng trên cùng 1 file. Định vị chính xác và chỉ đọc 1 lần bao trọn khối code cần sửa (50-80 dòng).
9. **CẤM TỰ Ý CHẠY `npm run build`:** Không tự ý chạy full build gây log dài và tốn turn trừ khi user yêu cầu hoặc chuẩn bị release.
10. **CẤM THỬ-SAI LỆNH SHELL PHỨC TẠP INLINE:** Cấm gõ lệnh PowerShell/Node inline phức tạp dẫn đến lỗi crash chuỗi/quote lặp đi lặp lại. Viết script ra file tạm nếu lệnh dài > 1 dòng.
11. **CẤM SEARCH WEB DÀN TRẢI CHO CÂU HỎI THÔNG THƯỜNG:** Trả lời trực tiếp từ tri thức mô hình, không spam công cụ tìm kiếm web khi không được yêu cầu.
12. **CẤM BẪY POLLING BACKGROUND TASK & CHAT RÁC "ĐANG...":** Đặt `WaitMsBeforeAsync: 8000-10000` cho mọi lệnh CLI. Tuyệt đối không gọi `manage_task(status)` để poll và không gửi tin nhắn chat "Đang kiểm tra..." làm lãng phí turn; hãy kết thúc turn để hệ thống tự động wakeup.
13. **CẤM LẠM DỤNG SCREENSHOT DEVTOOLS ĐỂ SOI CSS:** Bắt buộc dùng `evaluate_script` lấy tọa độ/computedStyle (<50 tokens). Cấm chụp ảnh liên tiếp và gọi `view_file` nạp ảnh vào context nhiều lần.
14. **CẤM LAN MAN MỞ FILE CONSUMER KHÔNG LIÊN QUAN (SCOPE CREEP):** Khi người dùng yêu cầu sửa UI ở 1 component cụ thể, chỉ đọc và sửa đúng component đó; không mở đọc hàng loạt file consumer xung quanh.
15. **CẤM CHẮP VÁ KHI RESOLVE CONFLICT HOẶC SỬA HÀM DÀI:** Đọc trọn 1 khối block (50-80 dòng) để nhìn rõ mở/đóng ngoặc và cấu trúc, sửa dứt điểm trong 1 lần, tránh chắp vá gây lỗi cú pháp (unclosed bracket).
16. **CẤM NẠP NHIỀU ẢNH VÀO CONTEXT BẰNG `view_file`:** Không gọi `view_file` nạp nhiều ảnh (.png/.jpg) làm bùng nổ context hàng chục ngàn multimodal tokens. Dùng script trích xuất metadata (size/bounds) và chỉ xem 1 ảnh khi user yêu cầu kiểm tra trực quan.
17. **CẤM SỬA CODE/SCRIPT BẰNG LỆNH POWERSHELL `-replace` INLINE:** Cấm dùng regex `-replace` qua PowerShell/CLI gây bẫy escaping và lỗi AST parser lặp đi lặp lại 10-15 turns. Luôn dùng `replace_file_content`.
18. **CẤM TẠO SCRIPT TẠM RẢI RÁC & POLLING `Get-PrintJob` KHI IN ẤN:** Tái sử dụng script in chuẩn qua tham số (`-Copies`, `-ColorMode`), cấm tạo hàng chục file `.ps1` tạm và không polling `Get-PrintJob` liên tục khi lệnh đã vào Windows Spooler.
19. **CẤM BẪY SANDBOX LỖI TRUY CẬP HỆ THỐNG TRÊN WINDOWS:** Chủ động đặt `BypassSandbox: true` cho mọi lệnh thao tác in ấn, Desktop, Downloads hoặc đường dẫn ngoài repo để tránh lỗi Access Denied `C:\`.
20. **CẤM GIẢI THÍCH DÀI DÒNG CHO LỆNH HÀNH ĐỘNG ĐƠN GIẢN:** Khi user yêu cầu "in đi", "chạy lại", phản hồi siêu ngắn gọn (< 100 từ, 1-2 câu báo kết quả), cấm viết văn lý thuyết dông dài.
21. **CẤM DUMP OUTPUT DÀI KHÔNG LỌC TRÊN SHELL:** Cấm chạy `Get-ChildItem -Recurse` trên thư mục lớn hoặc dùng `Format-List *` dump toàn bộ CIM/WMI properties. Bắt buộc dùng `Select-Object -First N` và chỉ chọn các thuộc tính cần thiết.
22. **CẤM DÙNG `Start-Sleep` & POLLING PROCESS LIÊN TỤC:** Cấm dùng lệnh PowerShell `Get-Process`/`Get-PrintJob` kết hợp `Start-Sleep` lặp đi lặp lại để chờ process. Tận dụng cơ chế reactive wakeup của hệ thống hoặc đặt `WaitMsBeforeAsync: 8000-10000`.
23. **CẤM THỬ-SAI MÒ MẪM CÔNG CỤ NGOÀI KHÔNG CÀI SẴN:** Cấm thử gọi các công cụ không tồn tại (`SumatraPDF`, `Ghostscript`, `pdfium`...). Dùng đúng script và công cụ chuẩn đã xác thực trên môi trường Windows.
24. **CẤM TẠO SCRIPT TẠM VỤN VẶT TỪNG BƯỚC CHO TÁC VỤ FILE/OS:** Cấm tạo 5-10 file script riêng lẻ (`check_*.ps1`, `move_*.ps1`, `verify_*.ps1`). Phải gom trọn chu trình (kiểm tra -> copy/move -> xác thực -> shortcut -> dọn dẹp) vào 1 script duy nhất.
25. **CẤM QUÉT ĐỆ QUY TỔNG THỂ KHÔNG GIỚI HẠN (`Get-ChildItem -Recurse`):** Cấm chạy quét đệ quy sâu toàn bộ `C:\` hoặc `C:\Users` gây nghẽn IO, timeout và tràn context. Bắt buộc quét tầng 1 (`-Depth 1` hoặc `Get-ChildItem -Directory`) và chỉ đào sâu vào thư mục cụ thể đã xác định.
26. **CẤM NHẢY CÓC THỬ-SAI NGÔN NGỮ (PYTHON <-> POWERSHELL) TRÊN WINDOWS:** Nhất quán dùng PowerShell thuần với `BypassSandbox: true` cho mọi tác vụ OS/file/shortcut trên Windows; cấm viết Python rồi lỗi lại đổi sang PowerShell và ngược lại.

## ✅ NGUYÊN TẮC BẮT BUỘC (ALWAYS DO)
1. **CHỈNH SỬA TOÁN CỤC SÚC TÍCH:** Dùng `replace_file_content` với chunk tối thiểu.
2. **KẾT QUẢ NGẮN GỌN (OUTPUT < 500 TOKENS/TURN):** Phản hồi chat bằng tiếng Việt súc tích, dạng bullet-points.
3. **THAM CHIẾU TOKEN OPTIMIZATION SPEC:** Xem thông tin chi tiết tại [TOKEN_OPTIMIZATION_RULES.md](file:///d:/posweb2/TOKEN_OPTIMIZATION_RULES.md).

