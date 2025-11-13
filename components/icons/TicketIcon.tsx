
import React from 'react';

export const TicketIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 002 2h3m10 0h3a2 2 0 002-2v-3a2 2 0 00-2-2h-3m-3.5 6H12m-2.5-4h5" />
  </svg>
);
