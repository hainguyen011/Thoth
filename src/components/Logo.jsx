import React from 'react';

export default function Logo({ size = 32 }) {
  return (
    <svg
      className="logo"
      viewBox="0 0 128 128"
      width={size}
      height={size}
      style={{ filter: 'drop-shadow(0 0 4px #06b6d4)' }}
    >
      <circle cx={64} cy={64} r={60} fill="#0f172a" stroke="#06b6d4" strokeWidth={4} />
      <path d="M 75 45 C 80 55, 75 70, 70 75 C 65 80, 50 82, 35 78 C 45 74, 55 70, 60 62 C 63 58, 62 50, 55 45 C 48 40, 55 35, 65 38 Z" fill="cyan" />
      <circle cx={66} cy={48} r={3} fill="#ffffff" />
    </svg>
  );
}
