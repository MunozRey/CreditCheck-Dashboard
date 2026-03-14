import React from 'react';

export const VERTICAL_ICONS = {
  personal_loans: (sz=20) => (
    <svg width={sz} height={Math.round(sz*0.78)} viewBox="0 0 18 14" fill="none">
      <rect x="1" y="1" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="1" y1="5" x2="17" y2="5" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="3" y1="9" x2="7" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  reform: (sz=20) => (
    <svg width={sz} height={sz} viewBox="0 0 18 18" fill="none">
      <path d="M2 8L9 2l7 6v8a1 1 0 01-1 1H3a1 1 0 01-1-1V8z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M6 17V9h6v8" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  ),
  mortgage: (sz=20) => (
    <svg width={Math.round(sz*0.89)} height={sz} viewBox="0 0 16 18" fill="none">
      <rect x="1" y="6" width="14" height="11" rx="1" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M0.5 7L8 2l7.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="5.5" y="11" width="5" height="6" stroke="currentColor" strokeWidth="1.2"/>
    </svg>
  ),
  vehicle_unsecured: (sz=20) => (
    <svg width={sz} height={Math.round(sz*0.7)} viewBox="0 0 20 14" fill="none">
      <path d="M4 7.5l2-5h8l2 5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <rect x="1" y="7.5" width="18" height="4" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="5" cy="11.5" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
      <circle cx="15" cy="11.5" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
    </svg>
  ),
  vehicle_secured: (sz=20) => (
    <svg width={Math.round(sz*0.78)} height={sz} viewBox="0 0 14 18" fill="none">
      <rect x="2" y="8" width="10" height="9" rx="2" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M4 8V5a3 3 0 016 0v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="7" cy="13" r="1.5" fill="currentColor"/>
    </svg>
  ),
};
