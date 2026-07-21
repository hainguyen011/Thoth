// background.js - Thoth AI Service Worker

// Khởi tạo context menu khi cài đặt
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "openSidePanel",
    title: "Mở thanh bên Thoth",
    contexts: ["all"]
  });
});

// Xử lý khi click context menu
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "openSidePanel") {
    chrome.sidePanel.open({ windowId: tab.windowId });
  }
});

// Lắng nghe tin nhắn từ Content Script hoặc Side Panel
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "ANALYZE_TEXT") {
    handleAnalyzeText(message.text, sender.tab.id, sender.tab.windowId)
      .then(result => sendResponse({ success: true, data: result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Giữ kết nối async
  }

  if (message.type === "COMMIT_LANGUAGE") {
    handleCommitLanguage(message.language, message.code, message.text, sender.tab.id, sender.tab.windowId)
      .then(() => sendResponse({ success: true }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Giữ kết nối async
  }

  if (message.type === "TRANSLATE_TEXT") {
    handleTranslateText(message.text)
      .then(result => sendResponse({ success: true, translatedText: result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Giữ kết nối async
  }

  if (message.type === "GENERATE_SUGGESTIONS") {
    handleGenerateSuggestions(message.text, message.targetLang, message.targetLangCode)
      .then(result => sendResponse({ success: true, suggestions: result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Giữ kết nối async
  }
});

// Hàm gọi Gemini API chung
async function callGemini(prompt, responseJson = true) {
  const settings = await chrome.storage.local.get(["geminiApiKey", "aiModel"]);
  const apiKey = settings.geminiApiKey;
  const model = settings.aiModel || "gemini-1.5-flash";

  if (!apiKey) {
    throw new Error("Chưa cấu hình API Key của Gemini. Hãy click vào biểu tượng Thoth để cài đặt.");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  
  const requestBody = {
    contents: [{
      parts: [{ text: prompt }]
    }]
  };

  if (responseJson) {
    requestBody.generationConfig = {
      responseMimeType: "application/json"
    };
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    const errMsg = errData.error?.message || response.statusText;
    throw new Error(`Lỗi Gemini API: ${errMsg}`);
  }

  const data = await response.json();
  const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!textResponse) {
    throw new Error("Không nhận được phản hồi từ AI model.");
  }

  return textResponse;
}

// Xử lý phân tích ngôn ngữ của đoạn văn bản được bôi đen (Chỉ phân tích, chưa lưu)
async function handleAnalyzeText(text, tabId, windowId) {
  const prompt = `Analyze the language of the following text. Return ONLY the language name in English (e.g. 'Japanese', 'English', 'French', 'Vietnamese', 'German', 'Chinese', 'Korean', 'Spanish') and its ISO 2-letter code (e.g. 'ja', 'en', 'fr', 'vi', 'de', 'zh', 'ko', 'es') in a JSON format: {"language": "...", "code": "..."}. Do not include any markdown format or other text.\n\nText: ${text}`;
  
  const responseText = await callGemini(prompt, true);
  const parsed = JSON.parse(responseText.trim());
  return parsed;
}

// Lưu ngôn ngữ, mở Side Panel và gửi tin nhắn đồng bộ sau khi người dùng Approve
async function handleCommitLanguage(language, code, text, tabId, windowId) {
  // Mở Side Panel đồng bộ ngay lập tức (giữ user gesture)
  if (chrome.sidePanel && typeof chrome.sidePanel.open === "function") {
    chrome.sidePanel.open({ windowId: windowId }).catch(err => {
      console.warn("Lỗi mở Side Panel: ", err);
    });
  }

  // Lưu ngôn ngữ đích mới vào storage
  await chrome.storage.local.set({
    targetLanguage: language,
    targetLanguageCode: code,
    lastAnalyzedText: text
  });

  // Phát tín hiệu thông báo cho Side Panel cập nhật giao diện
  chrome.runtime.sendMessage({
    type: "TARGET_LANGUAGE_CHANGED",
    language: language,
    code: code,
    contextText: text
  }).catch(() => {
    // Bỏ qua lỗi nếu Side Panel chưa mở
  });
}

// Xử lý dịch thuật văn bản bôi đen sang ngôn ngữ mẹ đẻ được cấu hình
async function handleTranslateText(text) {
  // Đọc ngôn ngữ mẹ đẻ từ cấu hình, mặc định là Tiếng Việt
  const settings = await chrome.storage.local.get(["nativeLanguage", "nativeLanguageCode"]);
  const targetLang = settings.nativeLanguage || "Vietnamese";
  const targetLangCode = settings.nativeLanguageCode || "vi";

  const prompt = `You are Thoth, a highly sophisticated AI communication and translation assistant.
Translate the following text into ${targetLang} (ISO code: ${targetLangCode}).
Make the translation natural, accurate, and flow beautifully in the target language, preserving the tone and nuances of the original text.
Return ONLY the translation output with no extra explanations, no markdown styling, no conversational intro/outro.

Original text:
${text}`;

  const responseText = await callGemini(prompt, false); // Response JSON is false since we want flat text
  return responseText.trim();
}

// Xử lý tạo gợi ý câu phản hồi dựa trên văn bản người dùng gõ (dịch/chuyển đổi ý tưởng)
async function handleGenerateSuggestions(text, targetLang, targetLangCode) {
  if (!text || !text.trim()) return [];
  
  const prompt = `You are Thoth, a highly sophisticated AI communication assistant. 
Your goal is to translate and adapt the user's input text (draft response idea) into the target language in 4 distinct tones.
The output must represent direct translations/expressions of the user's draft response idea in those styles, not replies to another comment.

Target Language: ${targetLang} (ISO Code: ${targetLangCode})
User's input text: "${text}"

Provide 4 unique variations corresponding to these styles (in Vietnamese labels for UI):
1. "Chuyên nghiệp" (Professional, polite, business-appropriate)
2. "Thân thiện" (Friendly, casual, engaging)
3. "Lịch sự" (Formal, respectful, elegant)
4. "Hài hước" (Witty, funny, lighthearted)

You must translate/transform the user's input text into the target language matching each style.
If the target language is Vietnamese, write natural Vietnamese. If it's English, write natural English. If it's Japanese, write natural Japanese (use appropriate Keigo/Formality for Formal/Professional, and casual/polite form for Friendly).

Format the output strictly as a JSON array of objects, with no markdown tags:
[
  {"tone": "Chuyên nghiệp", "reply": "..."},
  {"tone": "Thân thiện", "reply": "..."},
  {"tone": "Lịch sự", "reply": "..."},
  {"tone": "Hài hước", "reply": "..."}
]`;

  const responseText = await callGemini(prompt, true);
  return JSON.parse(responseText.trim());
}
