import React from 'react';

export const Logo = ({ className = "w-6 h-6" }) => {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2.2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      {/* Graduation Cap Top (Diamond) with semi-transparent fill */}
      <path d="M12 3L2 8l10 5 10-5-10-5z" fill="currentColor" fillOpacity="0.2" />
      {/* Tassel */}
      <path d="M17 10v4.5a1.5 1.5 0 0 0 3 0V11" />
      {/* Cap Bottom Arch */}
      <path d="M6 11.5v3c0 1.5 2.5 2.5 6 2.5s6-1 6-2.5v-3" />
      {/* Connection Node Circle details */}
      <circle cx="12" cy="18" r="1.5" fill="currentColor" />
      <circle cx="6" cy="14" r="1" fill="currentColor" />
      <circle cx="18" cy="14" r="1" fill="currentColor" />
      {/* Interconnecting networking paths */}
      <path d="M12 13v3.5" />
      <path d="M6 14c1.5 0.5 3.5 1 6 1s4.5-0.5 6-1" strokeDasharray="1.5 1.5" />
    </svg>
  );
};
