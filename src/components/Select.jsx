import React from 'react';

export default function Select({ label, id, value, onChange, options, className = 'form-group' }) {
  const content = (
    <>
      {label && <label htmlFor={id}>{label}</label>}
      <select 
        id={id} 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </>
  );

  if (className) {
    return <div className={className}>{content}</div>;
  }
  return content;
}
