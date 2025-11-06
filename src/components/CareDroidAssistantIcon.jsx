import React from 'react';
import PropTypes from 'prop-types';

// tone: 'provided' | 'gradient' | 'mint'
// - 'provided' matches the supplied SVG: gradient background, #51B988 details
// background: whether to render the rounded background panel
const CareDroidAssistantIcon = ({ className = "w-7 h-7", tone = 'provided', background = true, ...props }) => {
  const bgGradient = 'url(#assistantGradient)';
  let fillMain = '#51B988';
  let strokeMain = '#51B988';
  if (tone === 'gradient') {
    fillMain = bgGradient;
    strokeMain = bgGradient;
  } else if (tone === 'mint') {
    fillMain = '#63B99A';
    strokeMain = '#63B99A';
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1024 1024"
      className={className}
      {...props}
    >
      <defs>
        {/* CareDroid gradient */}
        <linearGradient id="assistantGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8FD6F4"/>
          <stop offset="100%" stopColor="#A4E3B2"/>
        </linearGradient>
      </defs>

      {/* Optional rounded background (gradient) */}
      {background && (
        <rect width="1024" height="1024" rx="240" fill={bgGradient} />
      )}

      {/* Visor */}
      <rect x="240" y="380" width="544" height="260" rx="130" fill={fillMain} />

      {/* Eyes */}
      <ellipse cx="384" cy="510" rx="74" ry="92" fill="#FFFFFF"/>
      <ellipse cx="640" cy="510" rx="74" ry="92" fill="#FFFFFF"/>

      {/* Chat-bubble icon (AI assistant mark) */}
      <g fill={fillMain}>
        {/* Bubble body */}
        <rect x="420" y="160" width="184" height="104" rx="32"/>

        {/* Bubble tail */}
        <path d="M512 264 L548 304 L476 304 Z"/>

        {/* Typing dots */}
        <circle cx="468" cy="212" r="10" fill="#FFFFFF"/>
        <circle cx="512" cy="212" r="10" fill="#FFFFFF"/>
        <circle cx="556" cy="212" r="10" fill="#FFFFFF"/>
      </g>

      {/* Friendly smile */}
      <path
        d="M410 715 Q512 800 614 715"
        fill="none"
        stroke={strokeMain}
        strokeWidth="32"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

CareDroidAssistantIcon.propTypes = {
  className: PropTypes.string,
  tone: PropTypes.oneOf(['provided', 'gradient', 'mint']),
  background: PropTypes.bool,
};

export default CareDroidAssistantIcon;