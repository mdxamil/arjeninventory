"use client";

import { useState, useEffect, useRef } from "react";
import type { Product } from "./types";
import { useCopy } from "../../context/CopyContext";

interface ProductCardProps {
  product: Product;
  isOwner: boolean;
  copiedId: string | null;
  isDeleting: string | null;
  updatingProduct: string | null;
  onDelete: (productId: string) => void;
  onToggleSelected: (productId: string, currentValue: boolean) => void;
  onSaleRateChange: (productId: string, saleRate: "good" | "medium" | "bad" | "none") => void;
  onCopyImage: (imageUrl: string, productId: string) => void;
  onCardClick: (product: Product) => void;
  onEdit: (product: Product) => void;
}

export default function ProductCard({
  product,
  isOwner,
  copiedId,
  isDeleting,
  updatingProduct,
  onDelete,
  onToggleSelected,
  onSaleRateChange,
  onCopyImage,
  onCardClick,
  onEdit,
}: ProductCardProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { addCopiedProduct } = useCopy();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        !buttonRef.current?.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDropdown]);

  const handleCopyCode = (e: React.MouseEvent, code: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCodeCopied(true);
    
    // Add to copied products sidebar
    addCopiedProduct({
      id: product.id,
      category: product.category,
      code: code,
    });
    
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const getSaleRateBadge = () => {
    if (!product.saleRate || product.saleRate === "none") return null;

    const badges = {
      good: { text: "High Performance", bg: "bg-emerald-50", text_color: "text-emerald-700", border: "border-emerald-200" },
      medium: { text: "Average", bg: "bg-amber-50", text_color: "text-amber-700", border: "border-amber-200" },
      bad: { text: "Low Performance", bg: "bg-rose-50", text_color: "text-rose-700", border: "border-rose-200" },
    };

    const badge = badges[product.saleRate as keyof typeof badges];
    if (!badge) return null;

    return (
      <span className={`inline-flex items-center rounded-md border ${badge.border} ${badge.bg} px-2 py-0.5 text-xs font-medium ${badge.text_color}`}>
        {badge.text}
      </span>
    );
  };

  return (
    <div className={`group relative flex flex-col rounded-lg sm:rounded-xl border border-gray-200 bg-white transition-all duration-300 hover:border-gray-300 hover:shadow-lg ${showDropdown ? 'z-30' : 'z-0 hover:z-20'}`}>
      
      {/* Selection Indicator */}
      {product.isSelected && (
        <div className="absolute inset-0 z-10 rounded-lg sm:rounded-xl border-2 border-blue-600 pointer-events-none" />
      )}

      {/* Image Section */}
      <div 
        className="relative aspect-square sm:aspect-4/3 w-full cursor-pointer overflow-hidden rounded-t-lg sm:rounded-t-xl bg-gray-100"
        onClick={() => onCardClick(product)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.imageUrl}
          alt={product.category}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        
        {/* Floating Selected Checkmark */}
        {product.isSelected && (
          <div className="absolute right-2 top-2 sm:right-3 sm:top-3 z-20 flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm">
            <svg className="h-3 w-3 sm:h-3.5 sm:w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        {/* Top Row: Category & Badges */}
        <div className="mb-2 flex items-start justify-between gap-2">
          <div className="space-y-1 flex-1">
            <span className="inline-block text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-gray-500">
              {product.category}
            </span>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
               {getSaleRateBadge()}
            </div>
          </div>

          {/* Context Menu */}
          {isOwner && (
            <div className="relative">
              <button
                ref={buttonRef}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDropdown(!showDropdown);
                }}
                disabled={updatingProduct === product.id || isDeleting === product.id}
                className={`flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full transition-colors ${
                  showDropdown ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <span className="sr-only">Open options</span>
                <svg className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
                </svg>
              </button>

              {showDropdown && (
                <div 
                  ref={dropdownRef}
                  className="absolute right-0 top-full z-50 mt-1 w-52 sm:w-56 origin-top-right rounded-lg border border-gray-200 bg-white shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none animate-in fade-in zoom-in-95 duration-100"
                  style={{ minWidth: "200px" }}
                >
                  <div className="max-h-[50vh] sm:max-h-75 overflow-y-auto py-1">
                    <button
                      onClick={() => {
                        onEdit(product);
                        setShowDropdown(false);
                      }}
                      className="flex w-full items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 active:bg-gray-100"
                    >
                      <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit Details
                    </button>
                    <button
                      onClick={() => {
                        onToggleSelected(product.id, product.isSelected);
                        setShowDropdown(false);
                      }}
                      className="flex w-full items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 active:bg-gray-100"
                    >
                      <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        {product.isSelected ? (
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        )}
                      </svg>
                      {product.isSelected ? "Deselect Item" : "Select Item"}
                    </button>
                  
                    <div className="my-1 border-t border-gray-100">
                      <div className="px-3 sm:px-4 py-2 text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">Set Performance</div>
                      {(["good", "medium", "bad", "none"] as const).map((rate) => (
                        <button
                          key={rate}
                          onClick={() => {
                            onSaleRateChange(product.id, rate);
                            setShowDropdown(false);
                          }}
                          className={`flex w-full items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 text-xs sm:text-sm transition-colors hover:bg-gray-50 active:bg-gray-100 ${
                            product.saleRate === rate ? "bg-blue-50/50 text-blue-700" : "text-gray-600"
                          }`}
                        >
                          <span className={`flex h-2.5 w-2.5 shrink-0 rounded-full ${
                            rate === "good" ? "bg-emerald-500 shadow-sm shadow-emerald-200" : 
                            rate === "medium" ? "bg-amber-500 shadow-sm shadow-amber-200" : 
                            rate === "bad" ? "bg-rose-500 shadow-sm shadow-rose-200" : "bg-gray-300"
                          }`} />
                          <span className={product.saleRate === rate ? "font-semibold" : "font-medium"}>
                            {rate === "good" && "High Sales"}
                            {rate === "medium" && "Average"}
                            {rate === "bad" && "Low Sales"}
                            {rate === "none" && "No Rating"}
                          </span>
                          {product.saleRate === rate && (
                            <svg className="ml-auto h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>

                    <div className="my-1 border-t border-gray-100">
                      <button
                        onClick={() => {
                          onDelete(product.id);
                          setShowDropdown(false);
                        }}
                        disabled={product.isSelected}
                        title={product.isSelected ? "Cannot delete selected products. Deselect first." : "Delete product"}
                        className={`flex w-full items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium transition-colors ${
                          product.isSelected
                            ? "text-gray-400 cursor-not-allowed opacity-50"
                            : "text-rose-600 hover:bg-rose-50 active:bg-rose-100"
                        }`}
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        {product.isSelected ? "Cannot Delete (Selected)" : "Delete Product"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Info Row: Code & Weight */}
        <div className="mb-2 sm:mb-3 flex items-center gap-1.5 sm:gap-2 text-xs flex-wrap">
          {product.product_code && (
            <button
              onClick={(e) => handleCopyCode(e, product.product_code!)}
              className="group/code flex items-center gap-1 sm:gap-1.5 rounded bg-gray-50 px-1.5 sm:px-2 py-0.5 sm:py-1 font-mono text-[10px] sm:text-xs text-gray-600 hover:bg-gray-100 hover:text-blue-600 active:scale-95 transition-all"
              title="Click to copy code"
            >
              <span className="font-semibold text-gray-400 group-hover/code:text-blue-500">#</span>
              <span className={codeCopied ? "text-green-600 font-bold" : ""}>
                {codeCopied ? "Copied!" : product.product_code}
              </span>
              {!codeCopied && (
                <svg className="h-3 w-3 opacity-0 transition-opacity group-hover/code:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
              )}
            </button>
          )}
          
          {product.weight && (
             <div className="flex items-center gap-1 text-gray-500">
               <svg className="h-3 w-3 sm:h-3.5 sm:w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
               </svg>
               <span className="text-[10px] sm:text-xs">{product.weight}</span>
             </div>
          )}

          {/* Shipment Way Badge */}
          {product.shippmentWay && (
            <div className={`flex items-center gap-1 sm:gap-1.5 rounded-full px-1.5 sm:px-2.5 py-0.5 font-medium text-[10px] sm:text-xs ${
              product.shippmentWay === 'air' 
                ? 'bg-sky-50 text-sky-700 ring-1 ring-sky-200' 
                : product.shippmentWay === 'sea'
                ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200'
                : 'bg-purple-50 text-purple-700 ring-1 ring-purple-200'
            }`}>
              <span className="text-xs sm:text-sm">
                {product.shippmentWay === 'air' && '✈️'}
                {product.shippmentWay === 'sea' && '🚢'}
                {product.shippmentWay === 'luggage' && '🧳'}
              </span>
              <span className="text-[9px] sm:text-[10px] uppercase tracking-wide">
                {product.shippmentWay}
              </span>
            </div>
          )}
        </div>

        <p className="mb-3 sm:mb-4 text-xs sm:text-sm leading-relaxed text-gray-600 line-clamp-2 min-h-8 sm:min-h-10">
          {product.description}
        </p>

        <div className="mt-auto">
          <div className="mb-3 sm:mb-4 flex items-baseline gap-1.5 sm:gap-2">
            <span className="text-lg sm:text-xl font-bold text-gray-900">৳{product.price}</span>
            <span className="text-[10px] sm:text-xs font-medium text-gray-500">
              ({product.originalPrice} {product.currency})
            </span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onCopyImage(product.imageUrl, product.id);
            }}
            disabled={copiedId === product.id}
            className={`flex w-full items-center justify-center gap-1.5 sm:gap-2 rounded-lg border px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold transition-all duration-200 focus:ring-2 focus:ring-offset-2 active:scale-[0.98] ${
              copiedId === product.id
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50 active:bg-gray-100"
            }`}
          >
            {copiedId === product.id ? (
              <>
                <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                Copied
              </>
            ) : (
              <>
                <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
                Copy Link
              </>
            )}
          </button>
        </div>
      </div>

      {/* Loading Overlays */}
      {(isDeleting === product.id || updatingProduct === product.id) && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl">
          <div className="flex flex-col items-center gap-2">
            <svg className="h-5 w-5 sm:h-6 sm:w-6 animate-spin text-gray-900" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            <span className="text-[10px] sm:text-xs font-medium text-gray-600">
              {isDeleting === product.id ? "Removing..." : "Updating..."}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}