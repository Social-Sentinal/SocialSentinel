import React, { useState } from 'react';

// Generates an inline SVG gradient data URL so images never appear broken on any offline/hosted machine
export function generateGradientSvg(text = 'Cosmos', isAvatar = false) {
  const seed = (text || 'C').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const hues = [
    ['#6366f1', '#a855f7'],
    ['#3b82f6', '#06b6d4'],
    ['#ec4899', '#8b5cf6'],
    ['#f59e0b', '#ef4444'],
    ['#10b981', '#3b82f6'],
    ['#8b5cf6', '#d946ef']
  ];
  const [c1, c2] = hues[seed % hues.length];
  const initial = (text || 'C').trim().charAt(0).toUpperCase();

  const svg = isAvatar
    ? `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
        <defs>
          <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${c1}"/>
            <stop offset="100%" stop-color="${c2}"/>
          </linearGradient>
        </defs>
        <rect width="160" height="160" rx="80" fill="url(#g)"/>
        <text x="80" y="98" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="64" font-weight="bold" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">${initial}</text>
      </svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
        <defs>
          <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${c1}"/>
            <stop offset="100%" stop-color="${c2}"/>
          </linearGradient>
        </defs>
        <rect width="800" height="450" fill="url(#g)"/>
        <circle cx="400" cy="225" r="120" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="2"/>
        <circle cx="400" cy="225" r="60" fill="rgba(255,255,255,0.08)"/>
        <text x="400" y="235" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="28" font-weight="600" fill="#ffffff" text-anchor="middle" opacity="0.9">✨ COSMOS</text>
      </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export default function MediaImage({
  src,
  alt = 'Media',
  style,
  className = '',
  isAvatar = false,
  fallbackText = '',
  onClick,
  title,
  loading = 'lazy'
}) {
  const [error, setError] = useState(false);
  const fallbackUrl = generateGradientSvg(fallbackText || alt, isAvatar);
  const displaySrc = (!src || error) ? fallbackUrl : src;

  return (
    <img
      src={displaySrc}
      alt={alt}
      style={style}
      className={className}
      onError={() => setError(true)}
      onClick={onClick}
      title={title}
      loading={loading}
    />
  );
}
