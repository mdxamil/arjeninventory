"use client";

import { useEffect, useRef } from "react";
import type { Product } from "./types";

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onCopyImage: (imageUrl: string, productId: string) => void;
  onViewFullImage: (imageUrl: string) => void;
}

export default function ProductDetailModal({
  product,
  isOpen,
  onClose,
  onCopyImage,
  onViewFullImage,
}: ProductDetailModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !product) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-3 sm:p-4 transition-all duration-300 overflow-y-auto"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-4xl my-auto overflow-hidden rounded-2xl bg-white shadow-2xl animate-in slide-in-from-bottom-6 fade-in sm:zoom-in-95 duration-200 flex flex-col max-h-[calc(100vh-24px)] sm:max-h-[90vh] sm:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button (Absolute) */}
        <button
          onClick={onClose}
          className="absolute right-3 top-3 sm:right-4 sm:top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-lg backdrop-blur-md hover:bg-white transition-all active:scale-95"
          aria-label="Close modal"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Product Image Column */}
        <div className="relative w-full sm:w-1/2 bg-gray-50 flex items-center justify-center p-0 sm:p-8 shrink-0">
          <div className="relative aspect-4/3 sm:aspect-auto w-full h-full sm:rounded-lg sm:shadow-sm overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.imageUrl}
              alt={product.category}
              className="h-full w-full object-cover"
            />
          </div>
          
          <button
            onClick={() => onViewFullImage(product.imageUrl)}
            className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 rounded-lg bg-black/50 px-3 py-1.5 text-xs font-medium text-white backdrop-blur hover:bg-black/60 transition sm:hidden"
          >
            Full View
          </button>
        </div>

        {/* Product Details Column */}
        <div className="flex w-full sm:w-1/2 flex-col overflow-y-auto p-5 sm:p-8 max-h-[50vh] sm:max-h-full">
          
          {/* Header */}
          <div className="mb-4 sm:mb-6 border-b border-gray-100 pb-3 sm:pb-4">
            <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
              <span className="inline-flex items-center rounded-md bg-gray-100 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-gray-600">
                {product.category}
              </span>
              {product.saleRate && product.saleRate !== "none" && (
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  product.saleRate === "good" ? "bg-emerald-50 text-emerald-700" :
                  product.saleRate === "medium" ? "bg-amber-50 text-amber-700" :
                  "bg-rose-50 text-rose-700"
                }`}>
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {product.saleRate === "good" ? "High Performance" : 
                   product.saleRate === "medium" ? "Average Performance" : "Low Performance"}
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Product Details</h2>
          </div>

          {/* Body */}
          <div className="space-y-4 sm:space-y-6 flex-1">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-sm leading-relaxed text-gray-600">
                {product.description || "No description provided for this item."}
              </p>
            </div>

            <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-3 sm:p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Pricing Information</h3>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Final Price</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">৳{product.price}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Original Cost</p>
                  <p className="text-sm font-medium text-gray-600">
                    {product.originalPrice} <span className="text-xs text-gray-500">{product.currency}</span>
                  </p>
                  {product.currencyRate && parseFloat(product.currencyRate) !== 1 && (
                     <p className="text-xs text-gray-400 mt-1">Rate: {product.currencyRate}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="mt-6 sm:mt-8 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 pt-4 border-t border-gray-100">
            <button
              onClick={() => onCopyImage(product.imageUrl, product.id)}
              className="flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 sm:py-3 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 hover:shadow-md transition-all active:scale-[0.98]"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
              Copy Image
            </button>
            <button
              onClick={() => onViewFullImage(product.imageUrl)}
              className="hidden sm:flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 sm:py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-[0.98]"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
              View Fullscreen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}