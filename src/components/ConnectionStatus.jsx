import React from 'react';

export default function ConnectionStatus({ isConnected }) {
  return (
    <div
      className={`status-dot ${isConnected ? 'connected' : ''}`}
      title={isConnected ? 'Gemini API Key: Sẵn sàng' : 'Gemini API Key: Chưa có'}
      style={{
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        backgroundColor: isConnected ? '#10b981' : '#ef4444',
        boxShadow: isConnected ? '0 0 8px #10b981' : '0 0 8px #ef4444',
        transition: 'all 0.3s ease'
      }}
    />
  );
}
