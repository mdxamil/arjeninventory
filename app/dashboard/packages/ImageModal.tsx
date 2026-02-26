"use client";

interface ImageModalProps {
  imageUrl: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ImageModal({ imageUrl, isOpen, onClose }: ImageModalProps) {
  if (!isOpen || !imageUrl) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 flex items-center justify-center w-10 h-10 bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-full text-white transition-all"
        aria-label="Close modal"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Image */}
      <div className="relative max-w-full max-h-full" onClick={(e) => e.stopPropagation()}>
        {/* eslint-disable-next-line */}
        <img
          src={imageUrl}
          alt="Package preview"
          className="max-w-full max-h-[90vh] w-auto h-auto object-contain rounded-lg shadow-2xl"
        />
      </div>
    </div>
  );
}
