"use client";

import { useState, useEffect } from "react";
import { useCopy } from "../context/CopyContext";

interface CopySidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function CopySidebar({ isOpen, onToggle }: CopySidebarProps) {
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  const [justCopiedId, setJustCopiedId] = useState<string | null>(null);
  const { copiedProducts, removeCopiedProduct, clearAllCopied } = useCopy();

  // Update current time every minute for accurate timestamps
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const handleCopyToClipboard = (code: string, productId: string) => {
    navigator.clipboard.writeText(code);
    setJustCopiedId(productId);
    setTimeout(() => setJustCopiedId(null), 1500);
  };

  const formatTimestamp = (timestamp: number) => {
    const diff = currentTime - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <>
      {/* Desktop Button - Fixed Position (top-right) */}
      <button
        onClick={onToggle}
        className="fixed right-6 top-6 z-50 hidden h-12 w-12 items-center justify-center rounded-full bg-gray-900 text-white shadow-lg transition-all hover:bg-gray-800 hover:scale-110 active:scale-95 lg:flex"
        aria-label="Toggle copied products sidebar"
      >
        <div className="relative">
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          {copiedProducts.length > 0 && (
            <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white ring-2 ring-white">
              {copiedProducts.length > 9 ? "9+" : copiedProducts.length}
            </span>
          )}
        </div>
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 backdrop-blur-sm transition-opacity lg:z-40"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed right-0 top-0 z-40 h-full w-full bg-white shadow-2xl transition-transform duration-300 ease-in-out sm:w-96 lg:z-50 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 p-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Copied Products
              </h2>
              <p className="text-xs text-gray-500">
                {copiedProducts.length} {copiedProducts.length === 1 ? "item" : "items"}
              </p>
            </div>
            <button
              onClick={onToggle}
              className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-900"
              aria-label="Close sidebar"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {copiedProducts.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="mb-4 rounded-full bg-gray-100 p-6">
                  <svg
                    className="h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-900">
                  No copied products yet
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Copy product codes to track them here
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {copiedProducts.map((product) => (
                  <div
                    key={product.id}
                    className="group relative rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition-all hover:border-gray-300 hover:shadow-md"
                  >
                    {/* Category Badge */}
                    <div className="mb-2 flex items-center justify-between">
                      <span className="inline-block rounded-full bg-gray-100 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gray-600">
                        {product.category}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {formatTimestamp(product.timestamp)}
                      </span>
                    </div>

                    {/* Product Code */}
                    <div className="mb-3 flex items-center gap-2">
                      <span className="flex-1 font-mono text-sm font-bold text-gray-900">
                        {product.code}
                      </span>
                      <button
                        onClick={() => handleCopyToClipboard(product.code, product.id)}
                        className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
                          justCopiedId === product.id
                            ? "bg-green-100 text-green-600"
                            : "text-gray-400 hover:bg-gray-100 hover:text-blue-600"
                        }`}
                        title={justCopiedId === product.id ? "Copied!" : "Copy code"}
                      >
                        {justCopiedId === product.id ? (
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        ) : (
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                            />
                          </svg>
                        )}
                      </button>
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => removeCopiedProduct(product.id)}
                      className="w-full rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-red-50 hover:border-red-200 hover:text-red-600"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer - Clear All Button */}
          {copiedProducts.length > 0 && (
            <div className="border-t border-gray-200 p-4">
              <button
                onClick={() => {
                  if (
                    window.confirm(
                      "Are you sure you want to clear all copied products?"
                    )
                  ) {
                    clearAllCopied();
                  }
                }}
                className="w-full rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100"
              >
                Clear All
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}