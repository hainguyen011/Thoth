import React from 'react';
import { Loader2 } from 'lucide-react';

export default function SketchInput({ value, onChange, placeholder, isTyping }) {
  return (
    <div className="textarea-wrapper">
      <textarea
        id="sketchInput"
        placeholder={placeholder}
        rows={4}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {isTyping && (
        <div className="typing-indicator" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Loader2 size={10} className="thoth-spin" style={{ animation: 'thoth-spin-keyframes 1s linear infinite' }} />
          <span>Đang tạo gợi ý...</span>
        </div>
      )}
    </div>
  );
}
