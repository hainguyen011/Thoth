# Thoth - Trợ lý Ngôn ngữ & Phản hồi Bình luận AI (AI-Native Workspace)

**Thoth** là một tiện ích mở rộng Chrome (Chrome Extension MV3) thế hệ mới được xây dựng bằng React và Vite, khai thác sức mạnh của mô hình ngôn ngữ lớn Google Gemini để hỗ trợ phân tích ngôn ngữ nguồn, dịch thuật ngữ cảnh tức thì và tạo lập tự động các phương án gợi ý phản hồi bình luận theo nhiều tông giọng thông minh.

Giao diện của Thoth được lấy cảm hứng từ ngôn ngữ thiết kế tối giản, phẳng hiện đại của Google Gemini và NotebookLM với các góc bo nhỏ mềm mại, không sử dụng hiệu ứng bóng đổ hay biến đổi tỉ lệ (scale) để tối đa hoá hiệu suất tập trung cho người sử dụng.

---

## Tính năng nổi bật

### 1. Bong bóng Tiện ích Đa năng (Minimalist Selection Tooltip)
* **Phân tích Ngôn ngữ**: Chỉ cần bôi đen bất kỳ đoạn văn bản nào trên trình duyệt, menu nổi siêu gọn `Phân tích | Dịch | Tóm tắt` sẽ xuất hiện để tự động nhận diện ngôn ngữ và cấu hình đích dịch cho Side Panel.
* **Dịch thuật Tức thì (Inline Translation)**: Click nút **Dịch** để chuyển ngữ văn bản được bôi đen sang ngôn ngữ mẹ đẻ của bạn trực tiếp trên trang, kèm theo nút copy nhanh tiện lợi.
* **Tóm tắt & Giải nghĩa (Summarize & Explain)**: Click nút **Tóm tắt** để rút gọn nội dung và giải thích các cụm từ khó một cách trực quan, dễ hiểu bằng chính ngôn ngữ mẹ đẻ của bạn.

### 2. Dò tìm & Khoá chọn Phần tử (DOM Inspect Element Picker)
* **Hỗ trợ Shadow DOM & Iframe**: Hỗ trợ xuyên qua các cấu trúc Shadow DOM phức tạp và các Iframe phụ (như khung chat YouTube Live Chat, Facebook Messenger).
* **Trích xuất thông minh**: Cho phép rà và click chọn bất kỳ phần tử DOM nào để tự động kéo văn bản về Side Panel làm ngữ cảnh gợi ý mà không cần bôi đen thủ công.
* **Khung viền chỉ báo bền bỉ**: Định vị cố định vị trí (`position: fixed`/`absolute`) theo kích thước phần tử và tự động cập nhật lại toạ độ khi cuộn trang hoặc co giãn màn hình.

### 3. Hộp thoại Gợi ý Phản hồi Đa tông giọng
* Tự động chuyển đổi ý tưởng thô sơ của bạn thành 4 phiên bản phản hồi ngôn ngữ đích tự nhiên:
  1. **Chuyên nghiệp** (Professional)
  2. **Thân thiện** (Friendly)
  3. **Lịch sự** (Respectful)
  4. **Hài hước** (Witty)
* Nút **Điền ô nhập** giúp đưa trực tiếp văn bản gợi ý được chọn vào các khung soạn thảo đích của trang web (hỗ trợ giả lập thay đổi sự kiện an toàn cho các React/Vue/Angular/Polymer app).

---

## Công nghệ sử dụng

* **Frontend Framework**: React 18, Vite.
* **Styling**: Vanilla CSS (tối giản, phẳng, hạn chế độ trễ hiển thị).
* **Icons**: Lucide React.
* **AI Engine**: Google Gemini API (Gemini 1.5 Flash, Gemini 2.5 Flash, Gemini 1.5 Pro).
* **Extension Platform**: Manifest V3 (Chrome Extension APIs).

---

## Hướng dẫn cài đặt & Phát triển

### 1. Chuẩn bị môi trường
Yêu cầu hệ thống đã cài đặt sẵn **Node.js** (Phiên bản 16 trở lên).

### 2. Cài đặt các gói phụ thuộc
Di chuyển vào thư mục dự án và chạy lệnh cài đặt:
```bash
npm install
```

### 3. Biên dịch dự án
Biên dịch dự án ra thư mục sản phẩm `dist/`:
```bash
npm run build
```
Để tự động biên dịch lại khi phát triển (Watch mode):
```bash
npm run dev
```

### 4. Tải tiện ích lên Google Chrome
1. Mở trình duyệt Chrome và truy cập vào địa chỉ: `chrome://extensions/`.
2. Bật chế độ nhà phát triển (**Developer mode**) ở góc trên bên phải.
3. Nhấp vào nút **Load unpacked** (Tải tiện ích đã giải nén).
4. Chọn thư mục `dist` trong thư mục dự án của bạn để nạp tiện ích.

---

## Cấu hình ban đầu

1. **Gemini API Key**:
   * Truy cập [Google AI Studio](https://aistudio.google.com/) để nhận API Key miễn phí.
   * Click vào biểu tượng Thoth trên thanh công cụ tiện ích để mở bảng cấu hình Popup và lưu API Key của bạn.
2. **Cấu hình Ngôn ngữ mẹ đẻ**:
   * Trong màn hình cài đặt Popup, chọn ngôn ngữ mẹ đẻ (ví dụ: `Tiếng Việt`) để hệ thống tối ưu hóa chất lượng dịch dịch thuật khi click nút **Dịch** ngoài trang web.
