# Project Memory & Learnings

File này lưu trữ những bài học, sở thích, và quy tắc ngầm được rút ra trong quá trình làm việc. Agent CÓ QUYỀN và PHẢI tự động cập nhật file này khi phát hiện thông tin quan trọng cần ghi nhớ lâu dài.

## User Preferences
- (Ví dụ: User thích dùng `const` thay vì `let` nếu có thể)

## Project Specifics
- (Ví dụ: API `/login` luôn trả về 200 kể cả khi lỗi, kiểm tra body.error)

## Lessons Learned
- **[2026-07-21]**: **Completed plan: init_extension_and_ui_plan.md**. Tri thức từ nhiệm vụ này đã được tích hợp vào hệ thống lưu trữ vĩnh cửu.
- [YYYY-MM-DD]: Lỗi XYZ xảy ra do xung đột thư viện A và B.     


### [LEARN] - 7/21/2026, 4:40:58 PM
[MAP α:init_extension_and_ui_plan]
[REF [F1]:/HTML/CSS]
[LEARNING FROM α.md]
Khi phát triển Chrome Extension trên env giới hạn câu lệnh C... [PRUNED]


### [LEARN] - 7/21/2026, 4:51:16 PM
[MAP α:init_extension_and_ui_plan]
[LEARNING FROM α.md]
Tách biệt phần giao diện UI (biên dịch bằng Vite + React) & phần logic ngầm (Background Service Worker, Content Script - sao chép trực tiếp) giúp tránh hoàn toàn các KO xung đột ESM/IIFE trong env Chrome Extension, đồng thời tăng tính mô-đun hóa qua JSX.
