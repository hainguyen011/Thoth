// content.js - Thoth AI Webpage Content Script

let activeInputElement = null;
let tooltipElement = null;
let lastSelectedText = "";
let isInspecting = false;
let inspectOverlay = null;
let currentHoveredEl = null;
let selectedElement = null;
let selectedOverlay = null;

// Helper kiểm tra xem extension context còn hiệu lực hay không
function isContextValid() {
  return typeof chrome !== "undefined" && chrome.runtime && !!chrome.runtime.id;
}

// Dọn dẹp tài nguyên khi extension bị reload/tải lại để tránh lỗi "context invalidated"
function cleanupInvalidatedContext() {
  if (tooltipElement) {
    tooltipElement.remove();
    tooltipElement = null;
  }
  if (inspectOverlay) {
    inspectOverlay.remove();
    inspectOverlay = null;
  }
  document.removeEventListener("focusin", handleFocusIn);
  document.removeEventListener("mouseup", handleMouseUp);
  document.removeEventListener("mousedown", handleMouseDown);
  document.removeEventListener("mousemove", handleInspectMouseMove, true);
  document.removeEventListener("click", handleInspectClick, true);
  document.removeEventListener("keydown", handleInspectKeyDown, true);
  console.log("Thoth AI: Đã tự động dọn dẹp các listeners cũ do Extension được tải lại.");
}

// Đâm xuyên qua Shadow DOM để tìm activeElement thực tế ở lá
function getActiveElementRecursive(root = document) {
  let activeEl = root.activeElement;
  if (!activeEl) return null;

  while (activeEl.shadowRoot && activeEl.shadowRoot.activeElement) {
    activeEl = activeEl.shadowRoot.activeElement;
  }
  
  return activeEl;
}

// Kiểm tra và lấy phần tử nhập liệu thực tế (input, textarea hoặc contenteditable)
function getEditableElement(el) {
  if (!el) return null;
  
  const isEditable = el.tagName === "INPUT" || 
                     el.tagName === "TEXTAREA" || 
                     el.isContentEditable || 
                     el.getAttribute("contenteditable") !== null;
                     
  if (isEditable) {
    return el;
  }
  
  // Tìm trong con của shadowRoot
  if (el.shadowRoot) {
    const inner = el.shadowRoot.querySelector("input, textarea, [contenteditable]");
    if (inner) return inner;
  }
  
  // Tìm trong con trực tiếp
  const innerChild = el.querySelector("input, textarea, [contenteditable]");
  if (innerChild) return innerChild;
  
  return null;
}

// 1. Theo dõi ô nhập đang được focus
function handleFocusIn(e) {
  if (!isContextValid()) {
    cleanupInvalidatedContext();
    return;
  }
  let el = e.target;
  
  // Nếu target nằm trong shadow DOM, lấy phần tử cụ thể bên trong shadow DOM
  if (e.composedPath) {
    const path = e.composedPath();
    if (path && path.length > 0) {
      el = path[0]; // composedPath[0] là phần tử thực sự kích hoạt sự kiện bên trong shadow DOM
    }
  }

  const editableEl = getEditableElement(el);
  if (editableEl) {
    activeInputElement = editableEl;
  }
}

// 2. Theo dõi bôi đen văn bản (text selection) để hiển thị Tooltip nổi
function handleMouseUp(e) {
  if (!isContextValid()) {
    cleanupInvalidatedContext();
    return;
  }

  // Tránh bắt sự kiện click vào chính tooltip
  if (tooltipElement && tooltipElement.contains(e.target)) {
    return;
  }

  const selection = window.getSelection();
  const selectedText = selection.toString().trim();

  if (!selectedText) {
    hideTooltip();
    return;
  }

  lastSelectedText = selectedText;

  // Lấy tọa độ của đoạn văn bản được chọn
  try {
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    
    // Tạo tooltip nếu chưa có
    if (!tooltipElement) {
      createTooltip();
    }
    setTooltipState("idle");

    // Định vị tooltip nổi ngay phía trên đoạn text được bôi đen
    const tooltipHeight = 32;
    const tooltipWidth = 140;
    
    let top = rect.top + window.scrollY - tooltipHeight - 8;
    let left = rect.left + window.scrollX + (rect.width / 2) - (tooltipWidth / 2);

    // Đảm bảo không bay ra ngoài lề trên màn hình
    if (top < window.scrollY) {
      top = rect.bottom + window.scrollY + 8;
    }

    tooltipElement.style.top = `${top}px`;
    tooltipElement.style.left = `${left}px`;
    tooltipElement.style.display = "flex";
  } catch (err) {
    console.error("Lỗi xác định vị trí bôi đen: ", err);
  }
}

// Ẩn tooltip khi nhấn chuột xuống ở chỗ khác
function handleMouseDown(e) {
  if (!isContextValid()) {
    cleanupInvalidatedContext();
    return;
  }
  if (tooltipElement && !tooltipElement.contains(e.target)) {
    hideTooltip();
  }
}

// Đăng ký các sự kiện lắng nghe DOM
document.addEventListener("focusin", handleFocusIn);
document.addEventListener("mouseup", handleMouseUp);
document.addEventListener("mousedown", handleMouseDown);

// Tạo phần tử Tooltip nổi
function createTooltip() {
  tooltipElement = document.createElement("div");
  tooltipElement.id = "thoth-floating-tooltip";
  setTooltipState("idle");

  document.body.appendChild(tooltipElement);

  // Sự kiện khi click vào các nút bên trong hoặc chính tooltip
  tooltipElement.addEventListener("click", (e) => {
    if (!isContextValid()) {
      cleanupInvalidatedContext();
      alert("Thoth AI: Tiện ích đã được tải lại hoặc cập nhật mới. Anh vui lòng F5 (tải lại) trang web này để tiếp tục sử dụng nha!");
      return;
    }

    // Nếu click vào nút Phân tích ở trạng thái idle
    const analyzeTrigger = e.target.closest(".thoth-analyze-trigger");
    if (analyzeTrigger) {
      e.stopPropagation();
      startAnalysis();
      return;
    }

    // Nếu click vào nút Dịch ở trạng thái idle
    const translateTrigger = e.target.closest(".thoth-translate-trigger");
    if (translateTrigger) {
      e.stopPropagation();
      startTranslation();
      return;
    }

    // Nếu người dùng click vào nút Approve (✓) ở trạng thái kết quả phân tích
    const approveBtn = e.target.closest(".thoth-approve-btn");
    if (approveBtn) {
      e.stopPropagation();
      const detectedLang = approveBtn.getAttribute("data-lang");
      const detectedCode = approveBtn.getAttribute("data-code");
      chrome.runtime.sendMessage({
        type: "COMMIT_LANGUAGE",
        language: detectedLang,
        code: detectedCode,
        text: lastSelectedText
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.warn("Lỗi đồng ý ngôn ngữ: ", chrome.runtime.lastError);
        }
      });
      hideTooltip();
      return;
    }

    // Nếu người dùng click vào nút Reject (✗)
    const rejectBtn = e.target.closest(".thoth-reject-btn");
    if (rejectBtn) {
      e.stopPropagation();
      hideTooltip();
      return;
    }

    // Nếu click vào nút Copy kết quả dịch thuật
    const copyBtn = e.target.closest(".thoth-copy-btn");
    if (copyBtn) {
      e.stopPropagation();
      const transText = copyBtn.getAttribute("data-trans");
      navigator.clipboard.writeText(transText);
      
      const originalHTML = copyBtn.innerHTML;
      copyBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#81c784" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`;
      setTimeout(() => {
        if (copyBtn) copyBtn.innerHTML = originalHTML;
      }, 1500);
      return;
    }

    // Nếu click vào nút Đóng kết quả dịch (✗)
    const closeBtn = e.target.closest(".thoth-close-btn");
    if (closeBtn) {
      e.stopPropagation();
      hideTooltip();
      return;
    }
  });
}

// Bắt đầu gọi phân tích ngôn ngữ bằng AI
function startAnalysis() {
  setTooltipState("analyzing");

  chrome.runtime.sendMessage({
    type: "ANALYZE_TEXT",
    text: lastSelectedText
  }, (response) => {
    if (!isContextValid()) {
      cleanupInvalidatedContext();
      return;
    }

    if (chrome.runtime.lastError || !response || !response.success) {
      console.warn("Lỗi gửi text phân tích: ", chrome.runtime.lastError || response?.error);
      setTooltipState("idle");
      return;
    }

    const { language, code } = response.data;
    setTooltipState("result", { language, code });
  });
}

// Bắt đầu gọi dịch thuật văn bản bằng AI sang ngôn ngữ mẹ đẻ
function startTranslation() {
  setTooltipState("translating");

  chrome.runtime.sendMessage({
    type: "TRANSLATE_TEXT",
    text: lastSelectedText
  }, (response) => {
    if (!isContextValid()) {
      cleanupInvalidatedContext();
      return;
    }

    if (chrome.runtime.lastError || !response || !response.success) {
      console.warn("Lỗi dịch thuật văn bản: ", chrome.runtime.lastError || response?.error);
      setTooltipState("idle");
      return;
    }

    setTooltipState("translation-result", { translatedText: response.translatedText });
  });
}

// Thiết lập nội dung HTML và Class cho từng trạng thái của tooltip
function setTooltipState(state, data = {}) {
  if (!tooltipElement) return;

  tooltipElement.className = state;

  if (state === "idle") {
    tooltipElement.innerHTML = `
      <button class="thoth-mode-btn thoth-analyze-trigger" title="Phân tích ngôn ngữ">
        <span>Phân tích</span>
      </button>
      <div class="thoth-divider"></div>
      <button class="thoth-mode-btn thoth-translate-trigger" title="Dịch sang ngôn ngữ mẹ đẻ">
        <span>Dịch</span>
      </button>
    `;
  } else if (state === "analyzing") {
    tooltipElement.innerHTML = `
      <svg class="thoth-spin" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="cyan" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
      <span>Đang phân tích...</span>
    `;
  } else if (state === "translating") {
    tooltipElement.innerHTML = `
      <svg class="thoth-spin" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="cyan" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
      <span>Đang dịch...</span>
    `;
  } else if (state === "result") {
    tooltipElement.innerHTML = `
      <span class="thoth-res-text">${data.language} (${data.code})</span>
      <div class="thoth-actions">
        <button class="thoth-btn thoth-approve-btn" data-lang="${data.language}" data-code="${data.code}" title="Chấp nhận ngôn ngữ">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
        </button>
        <button class="thoth-btn thoth-reject-btn" title="Từ chối">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
      </div>
    `;
  } else if (state === "translation-result") {
    tooltipElement.innerHTML = `
      <div class="thoth-trans-container">
        <div class="thoth-trans-content">${data.translatedText}</div>
      </div>
      <div class="thoth-actions">
        <button class="thoth-btn thoth-copy-btn" data-trans="${data.translatedText.replace(/"/g, '&quot;')}" title="Sao chép kết quả">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
        </button>
        <button class="thoth-btn thoth-close-btn" title="Đóng">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
      </div>
    `;
  }
}

// Ẩn tooltip
function hideTooltip() {
  if (tooltipElement) {
    tooltipElement.style.display = "none";
  }
}

// 3. Lắng nghe yêu cầu chèn bình luận từ Side Panel
if (isContextValid()) {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!isContextValid()) {
      cleanupInvalidatedContext();
      return;
    }

    if (message.type === "FILL_INPUT") {
      let targetEl = getActiveElementRecursive();
      if (targetEl) {
        targetEl = getEditableElement(targetEl);
      }
      
      if (!targetEl && activeInputElement) {
        targetEl = getEditableElement(activeInputElement);
      }

      if (targetEl) {
        fillValue(targetEl, message.text);
        sendResponse({ success: true });
      } else {
        sendResponse({ success: false, error: "Vui lòng click chọn hoặc Inspect ô nhập bình luận trước!" });
      }
    } else if (message.type === "START_INSPECT_MODE") {
      startInspectMode();
      // Gửi tin nhắn đến toàn bộ iframe cùng nguồn (same-origin)
      for (let i = 0; i < window.frames.length; i++) {
        try {
          window.frames[i].postMessage({ type: "THOTH_START_INSPECT" }, "*");
        } catch (err) {}
      }
      sendResponse({ success: true });
    } else if (message.type === "CANCEL_INSPECT_MODE") {
      cancelInspectMode();
      for (let i = 0; i < window.frames.length; i++) {
        try {
          window.frames[i].postMessage({ type: "THOTH_CANCEL_INSPECT" }, "*");
        } catch (err) {}
      }
      sendResponse({ success: true });
    } else if (message.type === "CLEAR_SELECTION") {
      removeSelectedOverlay();
      selectedElement = null;
      activeInputElement = null;
      // Đồng thời gửi tin nhắn thông báo cho các iframe khác dọn dẹp
      for (let i = 0; i < window.frames.length; i++) {
        try {
          window.frames[i].postMessage({ type: "THOTH_CLEAR_SELECTION" }, "*");
        } catch (err) {}
      }
      sendResponse({ success: true });
    }
  });
}

// Hàm chèn giá trị an toàn vào các ô nhập của trang web (hỗ trợ React/Vue/Angular/Polymer)
function fillValue(element, value) {
  element.focus();

  const isContentEditable = element.isContentEditable || element.getAttribute("contenteditable") !== null;

  if (isContentEditable) {
    element.innerText = value;
    
    // Gửi các sự kiện để các framework phát hiện thay đổi
    element.dispatchEvent(new Event("input", { bubbles: true, cancelable: true }));
    element.dispatchEvent(new Event("change", { bubbles: true, cancelable: true }));
    
    // Phát sự kiện textInput cho một số trình soạn thảo đặc biệt
    const textInputEvent = new CustomEvent("textInput", {
      bubbles: true,
      cancelable: true
    });
    element.dispatchEvent(textInputEvent);
  } else {
    element.value = value;
    element.dispatchEvent(new Event("input", { bubbles: true, cancelable: true }));
    element.dispatchEvent(new Event("change", { bubbles: true, cancelable: true }));
  }
}

// Bắt đầu Inspect Mode
function startInspectMode() {
  if (isInspecting) return;
  isInspecting = true;
  
  if (!inspectOverlay) {
    inspectOverlay = document.createElement("div");
    inspectOverlay.id = "thoth-inspect-overlay";
    inspectOverlay.style.position = "fixed";
    inspectOverlay.style.pointerEvents = "none";
    inspectOverlay.style.border = "2px solid #a8c7fa";
    inspectOverlay.style.background = "rgba(168, 199, 250, 0.12)";
    inspectOverlay.style.zIndex = "2147483646";
    inspectOverlay.style.boxSizing = "border-box";
    inspectOverlay.style.transition = "all 0.05s ease";
    inspectOverlay.style.display = "none";
    document.body.appendChild(inspectOverlay);
  }
  
  document.addEventListener("mousemove", handleInspectMouseMove, true);
  document.addEventListener("click", handleInspectClick, true);
  document.addEventListener("keydown", handleInspectKeyDown, true);
}

// Hủy Inspect Mode
function cancelInspectMode() {
  if (!isInspecting) return;
  isInspecting = false;
  
  if (inspectOverlay) {
    inspectOverlay.remove();
    inspectOverlay = null;
  }
  
  document.removeEventListener("mousemove", handleInspectMouseMove, true);
  document.removeEventListener("click", handleInspectClick, true);
  document.removeEventListener("keydown", handleInspectKeyDown, true);
  currentHoveredEl = null;

  // Nếu là iframe, báo cho cha hủy chế độ chọn ở các frame khác
  if (window !== window.top) {
    try {
      window.parent.postMessage({ type: "THOTH_CANCEL_INSPECT_FROM_SUB" }, "*");
    } catch (e) {}
  }
}

// Xử lý di chuyển chuột khi chọn (cho phép rê chuột qua bất kỳ phần tử nào)
function handleInspectMouseMove(e) {
  if (!isInspecting) return;
  
  let el = e.composedPath ? e.composedPath()[0] : e.target;
  if (!el || el === document.body || el === document.documentElement) {
    inspectOverlay.style.display = "none";
    currentHoveredEl = null;
    return;
  }
  
  // Bỏ qua các thành phần của chính Thoth để tránh lặp đè
  if (el.id === "thoth-floating-tooltip" || 
      el.id === "thoth-inspect-overlay" || 
      el.id === "thoth-selected-overlay" ||
      el.closest("#thoth-floating-tooltip")) {
    inspectOverlay.style.display = "none";
    currentHoveredEl = null;
    return;
  }
  
  const rect = el.getBoundingClientRect();
  inspectOverlay.style.top = `${rect.top}px`;
  inspectOverlay.style.left = `${rect.left}px`;
  inspectOverlay.style.width = `${rect.width}px`;
  inspectOverlay.style.height = `${rect.height}px`;
  inspectOverlay.style.display = "block";
  currentHoveredEl = el;
}

// Xử lý click chuột chọn phần tử
function handleInspectClick(e) {
  if (!isInspecting) return;
  
  e.preventDefault();
  e.stopPropagation();
  
  if (currentHoveredEl) {
    removeSelectedOverlay();
    selectedElement = currentHoveredEl;
    
    // Kiểm tra xem phần tử được chọn là ô nhập liệu hay text thường
    const editableEl = getEditableElement(selectedElement);
    let extractedText = "";
    let isInput = false;
    let label = "";

    if (editableEl) {
      activeInputElement = editableEl;
      isInput = true;
      const placeholder = editableEl.placeholder || 
                          editableEl.getAttribute("placeholder") || 
                          editableEl.getAttribute("aria-label") || 
                          editableEl.id || 
                          "Ô nhập liệu";
      label = `Input: ${placeholder.trim()}`;
    } else {
      extractedText = selectedElement.innerText || selectedElement.textContent || "";
      label = `Text: ${extractedText.trim().substring(0, 15)}`;
    }
    
    // Tạo viền xanh lá hiển thị bền bỉ xung quanh phần tử được chọn
    createSelectedOverlay(selectedElement);
    
    const displayLabel = label.substring(0, 18) + (label.length > 18 ? '...' : '');
    
    chrome.runtime.sendMessage({ 
      type: "ELEMENT_SELECTED", 
      placeholder: displayLabel,
      isInput: isInput,
      extractedText: extractedText.trim()
    });
  }
  
  cancelInspectMode();
}

// Xử lý Escape để hủy chọn
function handleInspectKeyDown(e) {
  if (!isInspecting) return;
  if (e.key === "Escape") {
    e.preventDefault();
    e.stopPropagation();
    cancelInspectMode();
    chrome.runtime.sendMessage({ type: "INSPECT_CANCELLED" });
    if (window !== window.top) {
      try {
        window.parent.postMessage({ type: "THOTH_CANCEL_INSPECT_FROM_SUB" }, "*");
      } catch (err) {}
    }
  }
}

// Tạo khung viền xanh lá hiển thị bền bỉ
function createSelectedOverlay(el) {
  removeSelectedOverlay();
  
  selectedOverlay = document.createElement("div");
  selectedOverlay.id = "thoth-selected-overlay";
  selectedOverlay.style.position = "absolute";
  selectedOverlay.style.pointerEvents = "none";
  selectedOverlay.style.border = "2px solid #81c784";
  selectedOverlay.style.background = "rgba(129, 199, 132, 0.05)";
  selectedOverlay.style.zIndex = "2147483645";
  selectedOverlay.style.boxSizing = "border-box";
  
  const rect = el.getBoundingClientRect();
  selectedOverlay.style.top = `${rect.top + window.scrollY}px`;
  selectedOverlay.style.left = `${rect.left + window.scrollX}px`;
  selectedOverlay.style.width = `${rect.width}px`;
  selectedOverlay.style.height = `${rect.height}px`;
  
  document.body.appendChild(selectedOverlay);
  
  window.addEventListener("scroll", updateSelectedOverlayPosition, { passive: true });
  window.addEventListener("resize", updateSelectedOverlayPosition, { passive: true });
}

// Xóa khung viền xanh lá
function removeSelectedOverlay() {
  if (selectedOverlay) {
    selectedOverlay.remove();
    selectedOverlay = null;
  }
  window.removeEventListener("scroll", updateSelectedOverlayPosition);
  window.removeEventListener("resize", updateSelectedOverlayPosition);
}

// Cập nhật vị trí của khung viền xanh lá khi trang web cuộn/thay đổi kích thước
function updateSelectedOverlayPosition() {
  if (selectedOverlay && selectedElement) {
    const rect = selectedElement.getBoundingClientRect();
    selectedOverlay.style.top = `${rect.top + window.scrollY}px`;
    selectedOverlay.style.left = `${rect.left + window.scrollX}px`;
    selectedOverlay.style.width = `${rect.width}px`;
    selectedOverlay.style.height = `${rect.height}px`;
  }
}

// Lắng nghe tin nhắn giao tiếp chéo iframe và lệnh dọn dẹp
window.addEventListener("message", (e) => {
  if (!e.data) return;
  
  if (e.data.type === "THOTH_START_INSPECT") {
    startInspectMode();
  } else if (e.data.type === "THOTH_CANCEL_INSPECT") {
    cancelInspectMode();
  } else if (e.data.type === "THOTH_CANCEL_INSPECT_FROM_SUB") {
    cancelInspectMode();
    for (let i = 0; i < window.frames.length; i++) {
      try {
        window.frames[i].postMessage({ type: "THOTH_CANCEL_INSPECT" }, "*");
      } catch (err) {}
    }
  } else if (e.data.type === "THOTH_CLEAR_SELECTION") {
    removeSelectedOverlay();
    selectedElement = null;
    activeInputElement = null;
  }
});
