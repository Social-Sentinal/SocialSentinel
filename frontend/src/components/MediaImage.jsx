import React, { useState } from 'react';

const DEFAULT_IMAGE_FALLBACK = "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&auto=format&fit=crop&q=80";
const DEFAULT_AVATAR_FALLBACK = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80";

export default function MediaImage({ src, alt, style, className, isAvatar = false, onClick, title, loading = "lazy" }) {
  const fallback = isAvatar ? DEFAULT_AVATAR_FALLBACK : DEFAULT_IMAGE_FALLBACK;
  const [imgSrc, setImgSrc] = useState(src || fallback);
  const [hasFailed, setHasFailed] = useState(false);

  const handleError = () => {
    if (!hasFailed) {
      setHasFailed(true);
      setImgSrc(fallback);
    }
  };

  return (
    <img
      src={imgSrc || fallback}
      alt={alt || "Media"}
      style={style}
      className={className}
      onError={handleError}
      onClick={onClick}
      title={title}
      loading={loading}
    />
  );
}
