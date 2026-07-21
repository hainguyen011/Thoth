import React, { useState } from 'react';
import { Copy, CornerDownLeft, Sparkles, Smile, Briefcase, Heart } from 'lucide-react';

export default function SuggestionCard({ tone, reply, onCopy, onFill }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(reply);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
    if (onCopy) onCopy(reply);
  };

  const handleFill = (e) => {
    e.stopPropagation();
    if (onFill) onFill(reply);
  };

  const renderToneIcon = () => {
    switch (tone) {
      case 'Chuyên nghiệp':
        return <Briefcase size={11} style={{ marginRight: '4px', verticalAlign: 'middle' }} />;
      case 'Thân thiện':
        return <Smile size={11} style={{ marginRight: '4px', verticalAlign: 'middle' }} />;
      case 'Lịch sự':
        return <Heart size={11} style={{ marginRight: '4px', verticalAlign: 'middle' }} />;
      case 'Hài hước':
        return <Sparkles size={11} style={{ marginRight: '4px', verticalAlign: 'middle' }} />;
      default:
        return null;
    }
  };

  return (
    <div
      className="suggestion-card"
      data-tone={tone}
      onClick={handleFill}
    >
      <div className="suggestion-header">
        <span className="tone-badge" style={{ display: 'flex', alignItems: 'center' }}>
          {renderToneIcon()}
          {tone}
        </span>
        <div className="card-actions">
          <button className="action-btn copy-btn" onClick={handleCopy} style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            <Copy size={9} />
            {copied ? 'Đã chép!' : 'Sao chép'}
          </button>
          <button className="action-btn fill-btn" onClick={handleFill} style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            <CornerDownLeft size={9} />
            Điền ô nhập
          </button>
        </div>
      </div>
      <p className="reply-text">{reply}</p>
    </div>
  );
}
