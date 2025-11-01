import React from 'react';

type Props = {
  className?: string;
  title?: string;
};

/**
 * StudySync AI brand mark
 * A simple, scalable SVG that adapts to light/dark themes using CSS variables.
 * - Bot head sitting above an open book
 * - Gradient teal → purple fill that works on light and dark
 */
const StudySyncLogo: React.FC<Props> = ({ className, title = 'StudySync AI' }) => {
  const id = React.useId();
  const gradId = `brand-grad-${id}`;
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={title}
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--brand-grad-start, #35d0c3)" />
          <stop offset="100%" stopColor="var(--brand-grad-end, #8b93d4)" />
        </linearGradient>
        <style>
          {`
            :root {
              --brand-stroke: rgba(0,0,0,0.08);
            }
            html.dark {
              --brand-stroke: rgba(255,255,255,0.12);
            }
          `}
        </style>
      </defs>

      {/* Open book base */}
      <path
        d="M8 24c0-3.314 2.686-6 6-6h12c3.314 0 6 2.686 6 6v24c-5.5-3-12-3-18 0V24z"
        fill="url(#${gradId})"
        opacity="0.85"
      />
      <path
        d="M58 24c0-3.314-2.686-6-6-6H40c-3.314 0-6 2.686-6 6v24c5.5-3 12-3 18 0V24z"
        fill="url(#${gradId})"
        opacity="0.75"
      />

      {/* Center fold */}
      <path d="M32 22v27" stroke="var(--brand-stroke)" strokeWidth="2" />

      {/* Bot head */}
      <g>
        <circle cx="32" cy="16" r="9" fill="url(#${gradId})" />
        <rect x="26" y="13" width="12" height="8" rx="4" fill="#fff" opacity="0.95" />
        <circle cx="30" cy="17" r="1.5" fill="var(--color-text-primary, #2C3E50)" opacity="0.9" />
        <circle cx="34" cy="17" r="1.5" fill="var(--color-text-primary, #2C3E50)" opacity="0.9" />
        <circle cx="32" cy="6" r="2" fill="url(#${gradId})" />
        <line x1="32" y1="8" x2="32" y2="10.5" stroke="url(#${gradId})" strokeWidth="2" />
      </g>

      {/* Subtle outline */}
      <path
        d="M26 18c-3.5-2-7.5-2-12 0v31c4-2 8-2 12 0V18zM38 18c3.5-2 7.5-2 12 0v31c-4-2-8-2-12 0V18z"
        fill="none"
        stroke="var(--brand-stroke)"
        strokeWidth="1.25"
      />
    </svg>
  );
};

export default StudySyncLogo;
