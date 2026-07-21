import React from 'react';
import Select from './Select';

export default function LanguageSelector({ value, onChange }) {
  const options = [
    { value: "English|en", label: "English (en)" },
    { value: "Japanese|ja", label: "日本語 (ja)" },
    { value: "Vietnamese|vi", label: "Tiếng Việt (vi)" },
    { value: "Korean|ko", label: "한국어 (ko)" },
    { value: "Chinese|zh", label: "中文 (zh)" },
    { value: "French|fr", label: "Français (fr)" },
    { value: "German|de", label: "Deutsch (de)" },
    { value: "Spanish|es", label: "Español (es)" }
  ];

  // Nếu giá trị hiện tại không nằm trong danh sách mặc định (do quét được ngôn ngữ khác), tự động thêm vào
  const exists = options.some(opt => opt.value === value);
  if (value && !exists) {
    const [lang, code] = value.split('|');
    options.push({ value, label: `${lang} (${code})` });
  }

  return (
    <div className="selector-row">
      <Select
        label="Ngôn ngữ đích:"
        id="targetLangSelect"
        value={value}
        onChange={onChange}
        options={options}
        className=""
      />
    </div>
  );
}
