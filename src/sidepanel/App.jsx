import React, { useState, useEffect } from 'react';
import { Sparkles, MessageSquare, Settings } from 'lucide-react';
import Logo from '../components/Logo';
import ConnectionStatus from '../components/ConnectionStatus';
import LanguageSelector from '../components/LanguageSelector';
import ContextBox from '../components/ContextBox';
import SketchInput from '../components/SketchInput';
import SuggestionCard from '../components/SuggestionCard';
import './sidepanel.css';

export default function App() {
  const [apiKeyConfigured, setApiKeyConfigured] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState('English|en');
  const [contextText, setContextText] = useState('');
  const [sketch, setSketch] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [error, setError] = useState('');
  const [isInspecting, setIsInspecting] = useState(false);
  const [selectedInputLabel, setSelectedInputLabel] = useState('');

  // 1. Kiểm tra trạng thái API Key & Cấu hình ban đầu khi Mount
  useEffect(() => {
    checkApiStatus();
    loadInitialState();

    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
      // Lắng nghe tín hiệu đổi ngôn ngữ bôi đen từ Content Script
      const handleMessage = (message) => {
        if (message.type === 'TARGET_LANGUAGE_CHANGED') {
          const optionVal = `${message.language}|${message.code}`;
          setTargetLanguage(optionVal);
          setContextText(message.contextText);
          setApiKeyConfigured(true); // Nếu có kết quả tức là API Key đang hoạt động
        } else if (message.type === 'ELEMENT_SELECTED') {
          setIsInspecting(false);
          setSelectedInputLabel(message.placeholder);
          if (message.extractedText) {
            setContextText(message.extractedText);
            
            // Gọi phân tích ngôn ngữ từ văn bản trích xuất được
            chrome.runtime.sendMessage({
              type: "ANALYZE_TEXT",
              text: message.extractedText
            }, (response) => {
              if (response && response.success) {
                const { language, code } = response.data;
                const optionVal = `${language}|${code}`;
                setTargetLanguage(optionVal);
                
                // Lưu vào cấu hình lưu trữ
                chrome.storage.local.set({
                  targetLanguage: language,
                  targetLanguageCode: code,
                  lastAnalyzedText: message.extractedText
                });
              }
            });
          }
        } else if (message.type === 'INSPECT_CANCELLED') {
          setIsInspecting(false);
        }
      };

      chrome.runtime.onMessage.addListener(handleMessage);
      return () => chrome.runtime.onMessage.removeListener(handleMessage);
    }
  }, []);

  // 2. Debounce tự động tạo gợi ý khi thay đổi ô nhập, ngôn ngữ hoặc ngữ cảnh
  useEffect(() => {
    if (!sketch.trim()) {
      setSuggestions([]);
      setIsTyping(false);
      setError('');
      return;
    }

    setIsTyping(true);
    const timer = setTimeout(() => {
      fetchSuggestions();
    }, 500);

    return () => clearTimeout(timer);
  }, [sketch, targetLanguage, contextText]);

  const checkApiStatus = async () => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      const config = await chrome.storage.local.get('geminiApiKey');
      setApiKeyConfigured(!!config.geminiApiKey);
    }
  };

  const loadInitialState = async () => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      const storage = await chrome.storage.local.get([
        'targetLanguage', 
        'targetLanguageCode', 
        'lastAnalyzedText'
      ]);

      if (storage.targetLanguage && storage.targetLanguageCode) {
        setTargetLanguage(`${storage.targetLanguage}|${storage.targetLanguageCode}`);
      }
      if (storage.lastAnalyzedText) {
        setContextText(storage.lastAnalyzedText);
      }
    }
  };

  const handleLanguageChange = async (newVal) => {
    setTargetLanguage(newVal);
    const [lang, code] = newVal.split('|');
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      await chrome.storage.local.set({
        targetLanguage: lang,
        targetLanguageCode: code
      });
    }
  };

  const handleClearContext = async () => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      await chrome.storage.local.remove('lastAnalyzedText');
    }
    setContextText('');
    setSelectedInputLabel('');

    // Gửi tin nhắn thông báo xóa overlay đã chọn trên trang web
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { type: "CLEAR_SELECTION" });
      }
    });
  };

  const handleInspect = () => {
    if (typeof chrome === 'undefined' || !chrome.tabs) return;

    const newInspecting = !isInspecting;
    setIsInspecting(newInspecting);

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { 
          type: newInspecting ? 'START_INSPECT_MODE' : 'CANCEL_INSPECT_MODE' 
        }, () => {
          if (chrome.runtime.lastError) {
            console.warn("Lỗi gửi tin nhắn Inspect: ", chrome.runtime.lastError);
            setIsInspecting(false);
          }
        });
      }
    });
  };

  const fetchSuggestions = () => {
    const [lang, code] = targetLanguage.split('|');
    
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({
        type: 'GENERATE_SUGGESTIONS',
        text: sketch.trim(),
        targetLang: lang,
        targetLangCode: code,
        context: contextText
      }, (response) => {
        setIsTyping(false);

        if (chrome.runtime.lastError) {
          setError(chrome.runtime.lastError.message);
          return;
        }

        if (response && response.success) {
          setSuggestions(response.suggestions);
          setError('');
        } else {
          setError(response?.error || 'Không thể tạo câu trả lời.');
        }
      });
    } else {
      // Mock suggestions in web preview environment
      setTimeout(() => {
        setIsTyping(false);
        setSuggestions([
          { tone: 'Lịch sự', reply: `[Mock - ${lang}] Cảm ơn bạn rất nhiều vì phản hồi quý báu!` },
          { tone: 'Thân thiện', reply: `[Mock - ${lang}] Ôi tuyệt quá, cảm ơn nha!` },
          { tone: 'Chuyên nghiệp', reply: `[Mock - ${lang}] Chúng tôi đã nhận được thông tin và sẽ phản hồi sớm.` }
        ]);
      }, 1000);
    }
  };

  const handleFillWebpageInput = (text) => {
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, {
            type: 'FILL_INPUT',
            text: text
          }, (response) => {
            if (chrome.runtime.lastError) {
              console.warn('Lỗi chèn văn bản gốc: ', chrome.runtime.lastError);
            }
          });
        }
      });
    } else {
      alert(`[Mock Fill] Đang điền câu trả lời: ${text}`);
    }
  };

  const [activeLangName] = targetLanguage.split('|');

  return (
    <div className="sidebar-container">
      {/* Header */}
      <header className="sidebar-header">
        <div className="logo-area">
          <Logo size={28} />
          <span className="brand-title">Thoth AI Panel</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button 
            onClick={() => {
              if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.openOptionsPage) {
                chrome.runtime.openOptionsPage();
              } else {
                alert("Mở trang cấu hình (Môi trường giả lập)");
              }
            }}
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
            title="Cài đặt API Key"
          >
            <Settings size={15} />
          </button>
          <ConnectionStatus isConnected={apiKeyConfigured} />
        </div>
      </header>

      {/* Configuration Panel */}
      <section className="config-panel">
        <LanguageSelector 
          value={targetLanguage} 
          onChange={handleLanguageChange} 
        />
        <ContextBox 
          text={contextText} 
          onClear={handleClearContext} 
        />
      </section>

      {/* Input Section */}
      <section className="input-section">
        <div className="input-header-row">
          <label htmlFor="sketchInput">
            Ý tưởng phản hồi (Tiếng Việt/Bất kỳ):
          </label>
          <button 
            className={`inspect-btn ${isInspecting ? 'active' : selectedInputLabel ? 'selected' : ''}`}
            onClick={handleInspect}
            title="Chọn trực tiếp ô nhập trên trang"
          >
            {isInspecting ? 'Đang chọn...' : selectedInputLabel ? `Đã chọn: ${selectedInputLabel}` : 'Chọn ô nhập'}
          </button>
        </div>
        <SketchInput
          value={sketch}
          onChange={setSketch}
          placeholder="Ví dụ: Cảm ơn bạn, ý kiến rất hay! Tôi sẽ xem xét..."
          isTyping={isTyping}
        />
      </section>

      {/* Suggestions Area */}
      <section className="suggestions-section">
        <div className="section-title-row">
          <h3>
            Gợi ý từ Thoth AI
          </h3>
          <span className="lang-badge">{activeLangName}</span>
        </div>

        {/* Trạng thái Lỗi */}
        {error && (
          <div className="warning-text">
            <p>Đã xảy ra lỗi:</p>
            <p style={{ marginTop: '4px', fontWeight: '500' }}>{error}</p>
          </div>
        )}

        {/* Trạng thái Trống (Placeholder) */}
        {!sketch.trim() && !error && (
          <div className="placeholder-area">
            <Sparkles size={24} color="#a8c7fa" style={{ opacity: 0.7, marginBottom: '4px' }} />
            <p>Bắt đầu gõ ý tưởng phản hồi ở trên hoặc bôi đen văn bản để phân tích ngôn ngữ.</p>
          </div>
        )}

        {/* Trạng thái Hiển thị danh sách Gợi ý */}
        {sketch.trim() && !error && (
          <div className="suggestions-list">
            {suggestions.map((item, idx) => (
              <SuggestionCard
                key={idx}
                tone={item.tone}
                reply={item.reply}
                onFill={handleFillWebpageInput}
              />
            ))}
          </div>
        )}
      </section>

      {/* Footer API Warning */}
      <footer className="sidebar-footer">
        {!apiKeyConfigured && (
          <p className="warning-text">
            Vui lòng cấu hình Gemini API Key bằng cách click biểu tượng Thoth trên thanh công cụ.
          </p>
        )}
      </footer>
    </div>
  );
}
