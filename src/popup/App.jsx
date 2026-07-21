import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Save } from 'lucide-react';
import Logo from '../components/Logo';
import Select from '../components/Select';
import './popup.css';

export default function App() {
  const [apiKey, setApiKey] = useState('');
  const [aiModel, setAiModel] = useState('gemini-1.5-flash');
  const [nativeLanguage, setNativeLanguage] = useState('Vietnamese|vi');
  const [showKey, setShowKey] = useState(false);
  const [status, setStatus] = useState({ message: '', type: '' });

  const nativeLangOptions = [
    { value: 'Vietnamese|vi', label: 'Tiếng Việt (vi)' },
    { value: 'English|en', label: 'English (en)' },
    { value: 'Japanese|ja', label: '日本語 (ja)' },
    { value: 'Korean|ko', label: '한국어 (ko)' },
    { value: 'Chinese|zh', label: '中文 (zh)' },
    { value: 'French|fr', label: 'Français (fr)' },
    { value: 'German|de', label: 'Deutsch (de)' },
    { value: 'Spanish|es', label: 'Español (es)' }
  ];

  const aiModelOptions = [
    { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash (Nhanh & Tiết kiệm)' },
    { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (Thông minh & Cực nhanh)' },
    { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro (Phân tích chuyên sâu)' }
  ];

  // Tải cấu hình từ storage khi mount
  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['geminiApiKey', 'aiModel', 'nativeLanguage', 'nativeLanguageCode'], (config) => {
        if (config.geminiApiKey) setApiKey(config.geminiApiKey);
        if (config.aiModel) setAiModel(config.aiModel);
        if (config.nativeLanguage && config.nativeLanguageCode) {
          setNativeLanguage(`${config.nativeLanguage}|${config.nativeLanguageCode}`);
        }
      });
    }
  }, []);

  const handleSave = () => {
    const trimmedKey = apiKey.trim();
    if (!trimmedKey) {
      showStatus('Vui lòng nhập API Key hợp lệ!', 'error');
      return;
    }

    const [langName, langCode] = nativeLanguage.split('|');

    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({
        geminiApiKey: trimmedKey,
        aiModel: aiModel,
        nativeLanguage: langName,
        nativeLanguageCode: langCode
      }, () => {
        showStatus('Đã lưu cấu hình thành công!', 'success');
      });
    } else {
      showStatus('Đã lưu giả lập thành công! (Môi trường Web)', 'success');
    }
  };

  const showStatus = (message, type) => {
    setStatus({ message, type });
    setTimeout(() => {
      setStatus({ message: '', type: '' });
    }, 3000);
  };

  return (
    <div className="card">
      {/* Header */}
      <div className="header">
        <div className="logo-container">
          <Logo size={32} />
          <h1>Thoth AI</h1>
        </div>
        <p className="tagline">Trợ lý Phân tích & Phản hồi Bình luận</p>
      </div>

      {/* Form Content */}
      <div className="content">
        <div className="form-group">
          <label htmlFor="apiKey">
            Gemini API Key
          </label>
          <div className="input-wrapper">
            <input
              type={showKey ? 'text' : 'password'}
              id="apiKey"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Nhập API Key từ Google AI Studio..."
            />
            <button
              type="button"
              id="toggleKey"
              className="icon-btn"
              onClick={() => setShowKey(!showKey)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <p className="helper">
            Lấy key miễn phí tại{' '}
            <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer">
              Google AI Studio
            </a>
          </p>
        </div>

        <Select
          label="Ngôn ngữ mẹ đẻ (Dịch sang)"
          id="nativeLanguage"
          value={nativeLanguage}
          onChange={setNativeLanguage}
          options={nativeLangOptions}
        />

        <Select
          label="Mô hình AI"
          id="aiModel"
          value={aiModel}
          onChange={setAiModel}
          options={aiModelOptions}
        />

        <button
          id="saveBtn"
          className="primary-btn"
          onClick={handleSave}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
        >
          <Save size={14} /> Lưu cấu hình
        </button>

        {status.message && (
          <div
            id="statusMessage"
            className={`status-msg ${status.type}`}
          >
            {status.message}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="footer">
        <p>Thoth v1.0.0 • Kết nối tâm hồn đa ngôn ngữ</p>
      </div>
    </div>
  );
}
