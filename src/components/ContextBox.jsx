import React from 'react';
import { Trash2, FileText } from 'lucide-react';

export default function ContextBox({ text, onClear }) {
  if (!text) return null;

  return (
    <div className="context-box">
      <div className="context-header">
        <span>
          Ngữ cảnh đang bôi đen
        </span>
        <button className="text-btn" onClick={onClear} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Trash2 size={10} /> Xóa
        </button>
      </div>
      <p id="contextText">{text}</p>
    </div>
  );
}
