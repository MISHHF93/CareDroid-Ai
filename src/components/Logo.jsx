import PropTypes from 'prop-types';

/**
 * CareDroid Logo Component
 * Displays the official CareDroid logo with customizable size and animation
 */
export default function Logo({ size = 80, animate = false, className = "" }) {
  return (
    <div 
      className={`inline-block ${animate ? 'animate-logo-fade-in' : ''} ${className}`}
      style={{ width: size, height: size }}
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 1024 1024"
        width={size}
        height={size}
        className="drop-shadow-2xl"
      >
        <defs>
          <linearGradient id="careGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8FD6F4"/>
            <stop offset="100%" stopColor="#A4E3B2"/>
          </linearGradient>
        </defs>
        <rect width="1024" height="1024" rx="240" fill="url(#careGradient)"/>
        <rect x="240" y="380" width="544" height="260" rx="130" fill="#51B988"/>
        <ellipse cx="384" cy="510" rx="74" ry="92" fill="#FFFFFF"/>
        <ellipse cx="640" cy="510" rx="74" ry="92" fill="#FFFFFF"/>
        <path d="M512 160 m-60 40 h40 v-40 a20 20 0 0 1 20-20 h0 a20 20 0 0 1 20 20 v40 h40 a20 20 0 0 1 20 20 v0 a20 20 0 0 1-20 20 h-40 v40 a20 20 0 0 1-20 20 h0 a20 20 0 0 1-20-20 v-40 h-40 a20 20 0 0 1-20-20 v0 a20 20 0 0 1 20-20z" fill="#51B988"/>
        <path d="M410 715 Q512 800 614 715" fill="none" stroke="#51B988" strokeWidth="32" strokeLinecap="round" strokeLinejoin="round"/>
        <text x="512" y="920" fontFamily="Arial, sans-serif" fontSize="110" fontWeight="bold" fill="#2C5F4F" textAnchor="middle">CareDroid</text>
      </svg>

      <style>{`
        @keyframes logo-fade-in {
          from { 
            opacity: 0;
            transform: scale(0.9) translateY(-10px);
          }
          to { 
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        
        .animate-logo-fade-in {
          animation: logo-fade-in 0.6s ease-out;
        }
      `}</style>
    </div>
  );
}

Logo.propTypes = {
  size: PropTypes.number,
  animate: PropTypes.bool,
  className: PropTypes.string,
};
