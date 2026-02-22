import React, { useEffect, useMemo, useState } from 'react';

export default function Mobile3DContainer({
  children,
  minHeight = 220,
  className = '',
  style = {},
}) {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(max-width: 768px)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    const handleChange = (event) => setIsMobile(event.matches);
    handleChange(mediaQuery);

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }

    if (typeof mediaQuery.addListener === 'function') {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }

    return undefined;
  }, []);

  const containerStyle = useMemo(() => ({
    width: '100%',
    maxWidth: '100%',
    minWidth: 0,
    minHeight,
    paddingLeft: isMobile ? 'max(0px, env(safe-area-inset-left))' : 0,
    paddingRight: isMobile ? 'max(0px, env(safe-area-inset-right))' : 0,
    boxSizing: 'border-box',
    ...style,
  }), [isMobile, minHeight, style]);

  return (
    <div className={className} style={containerStyle}>
      {children}
    </div>
  );
}
