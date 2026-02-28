"use client";

import { useEffect, useRef } from "react";
import type { Package } from "./types";

interface PackageDetailModalProps {
  pkg: Package | null;
  isOpen: boolean;
  userRole: string;
  onClose: () => void;
  onCopyImage: (e: React.MouseEvent, imageUrl: string) => void;
  onViewFullImage: (imageUrl: string) => void;
  onDelete?: (pkg: Package) => void;
  getFinalPrice: (pkg: Package) => number;
}

export default function PackageDetailModal({
  pkg,
  isOpen,
  userRole,
  onClose,
  onCopyImage,
  onViewFullImage,
  onDelete,
  getFinalPrice,
}: PackageDetailModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !pkg) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-gray-900/60 backdrop-blur-sm p-0 sm:p-4 transition-all duration-300"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl animate-in slide-in-from-bottom-10 fade-in sm:zoom-in-95 duration-200 flex flex-col sm:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button (Absolute) */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/10 text-white backdrop-blur-md hover:bg-black/20 sm:bg-gray-100 sm:text-gray-500 sm:hover:bg-gray-200 transition-colors"
          aria-label="Close modal"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Package Image Column */}
        <div className="relative w-full sm:w-1/2 bg-gray-50 flex items-center justify-center p-0 sm:p-8">
          <div className="relative aspect-4/3 w-full overflow-hidden sm:rounded-lg sm:shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={pkg.productimageUrl}
              alt={pkg.description}
              className="h-full w-full object-cover"
            />
          </div>

          <button
            onClick={() => onViewFullImage(pkg.productimageUrl)}
            className="absolute bottom-4 right-4 rounded-lg bg-black/50 px-3 py-1.5 text-xs font-medium text-white backdrop-blur hover:bg-black/60 transition sm:hidden"
          >
            Full View
          </button>
        </div>

        {/* Package Details Column */}
        <div className="flex w-full sm:w-1/2 flex-col overflow-y-auto p-6 sm:p-8">

          {/* Header */}
          <div className="mb-6 border-b border-gray-100 pb-4">
            <div className="flex items-center gap-3 mb-2">
              <span className="inline-flex items-center rounded-md bg-gray-100 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-gray-600">
                {pkg.category}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Package Details</h2>
          </div>

          {/* Body */}
          <div className="space-y-6 flex-1">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Package Code</h3>
              <p className="text-sm font-mono bg-gray-50 px-3 py-2 rounded-lg text-gray-700">
                {pkg.packageCode}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-sm leading-relaxed text-gray-600">
                {pkg.description || "No description provided for this package."}
              </p>
            </div>

            {userRole === "owner" && pkg.productCode && (<div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Package Contents</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Product Code</span>
                  <span className="font-mono font-semibold text-gray-900">{pkg.productCode}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Wrapping Code</span>
                  <span className="font-mono font-semibold text-gray-900">{pkg.wrappingCode}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Box Code</span>
                  <span className="font-mono font-semibold text-gray-900">{pkg.boxCode}</span>
                </div>
                {pkg.giftsCode && pkg.giftsCode.length > 0 && (
                  <div className="flex items-start justify-between text-sm">
                    <span className="text-gray-600">Gift Codes</span>
                    <div className="text-right">
                      {pkg.giftsCode.map((code, idx) => (
                        <div key={idx} className="font-mono font-semibold text-gray-900">{code}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>)}

            <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Pricing Information</h3>
              <div className="space-y-2">
                
                {userRole === "owner" && (
                  <>
                    {pkg.profit !== undefined && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Profit</span>
                        <span className="font-semibold text-green-600">৳{pkg.profit}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Seller Commission</span>
                      <span className="font-semibold text-gray-900">৳{pkg.sellerComission}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Delivery Charge</span>
                      <span className="font-semibold text-gray-900">৳{pkg.deliveryCharge}</span>
                    </div>
                  </>
                )}

                {userRole === "seller" && pkg.commission !== undefined && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Your Commission</span>
                    <span className="font-semibold text-green-600">৳{pkg.commission}</span>
                  </div>
                )}

                <div className="flex items-end justify-between pt-3 border-t border-gray-200">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Final Price</p>
                    <p className="text-3xl font-bold text-gray-900">৳{getFinalPrice(pkg)}</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Created</h3>
              <p className="text-sm text-gray-600">
                {new Date(pkg.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="mt-8 grid grid-cols-2 gap-3 pt-4 border-t border-gray-100">
            <button
              onClick={(e) => onCopyImage(e, pkg.productimageUrl)}
              className="flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 hover:shadow-md transition-all active:scale-[0.98]"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
              Copy Image
            </button>
            <button
              onClick={() => onViewFullImage(pkg.productimageUrl)}
              className="hidden sm:flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-[0.98]"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
              View Fullscreen
            </button>
          </div>

          {/* Delete Button for Owner */}
          {userRole === "owner" && onDelete && (
            <div className="mt-3">
              <button
                onClick={() => {
                  onDelete(pkg);
                  onClose();
                }}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-500 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-red-600 hover:shadow-md transition-all active:scale-[0.98]"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete Package
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
