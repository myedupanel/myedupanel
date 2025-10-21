import React from 'react';

function Logo() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="logo-svg-icon"
    >
      <path
        d="M4 24V8C4 6.89543 4.89543 6 6 6H26C27.1046 6 28 6.89543 28 8V24C28 25.1046 27.1046 26 26 26H6C4.89543 26 4 25.1046 4 24Z"
        fill="#F0F9FF"
        stroke="#0EA5E9"
        strokeWidth="2"
      />
      <path
        d="M16 11L22 15L16 19L10 15L16 11Z"
        stroke="#0EA5E9"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 21V15"
        stroke="#0EA5E9"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default Logo;