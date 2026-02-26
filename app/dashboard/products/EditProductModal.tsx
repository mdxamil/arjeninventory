"use client";

import { useState, useEffect, useRef } from "react";
import type { Product, EditProductPayload } from "./types";

interface EditProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (productId: string, updatedData: EditProductPayload) => Promise<void>;
}

const CURRENCIES = ["USD", "EUR", "GBP", "CNY", "RMB", "JPY", "INR", "AED", "SAR", "TRY", "THB", "KRW", "SGD", "MYR"];

export default function EditProductModal({
  product,
  isOpen,
  onClose,
  onSave,
}: EditProductModalProps) {
  const [form, setForm] = useState<EditProductPayload>({
    description: "",
    weight: "",
    price: "",
    currency: "USD",
    currencyRate: "1",
    shippmentWay: "air",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<EditProductPayload>>({});
  const firstInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (product && isOpen) {
      setForm({
        description: product.description || "",
        weight: product.weight ? product.weight.toString() : "",
        price: product.originalPrice || "",
        currency: product.currency || "USD",
        currencyRate: product.currencyRate || "1",
        shippmentWay: product.shippmentWay || "air",
      });
      setErrors({});
      setTimeout(() => firstInputRef.current?.focus(), 100);
    }
  }, [product, isOpen]);

  // Trap focus and handle ESC key
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  const validate = (): boolean => {
    const newErrors: Partial<EditProductPayload> = {};
    if (!form.description.trim()) newErrors.description = "Description is required";
    if (!form.price.trim() || isNaN(Number(form.price))) newErrors.price = "Valid price required";
    if (!form.currencyRate.trim() || isNaN(Number(form.currencyRate))) newErrors.currencyRate = "Valid rate required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!product || !validate()) return;
    setIsSaving(true);
    try {
      await onSave(product.id, form);
      onClose();
    } catch (err) {
      console.error("Failed to update product:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (field: keyof EditProductPayload, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  if (!isOpen || !product) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl ring-1 ring-black/5 overflow-hidden animate-modal-in">
        
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            {/* Product thumbnail */}
            <div className="h-12 w-12 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 ring-1 ring-gray-200">
              {/* eslint-disable-next-line */}
              <img
                src={product.imageUrl}
                alt={product.category}
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <h2 id="edit-modal-title" className="text-base font-semibold text-gray-900 leading-tight">
                Edit Product
              </h2>
              <p className="text-xs text-gray-400 mt-0.5 uppercase tracking-wide font-medium">
                {product.category}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form Body */}
        <div className="px-6 py-5 space-y-5 max-h-[60vh] overflow-y-auto">

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Description
            </label>
            <textarea
              ref={firstInputRef}
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              rows={3}
              placeholder="Product description..."
              className={`w-full resize-none rounded-xl border px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-300 outline-none transition-all
                focus:ring-2 focus:ring-offset-0
                ${errors.description
                  ? "border-red-300 bg-red-50 focus:ring-red-200"
                  : "border-gray-200 bg-gray-50 focus:border-blue-300 focus:ring-blue-100 focus:bg-white"
                }`}
            />
            {errors.description && (
              <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
                {errors.description}
              </p>
            )}
          </div>

          {/* Weight */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Weight <span className="text-gray-300 font-normal normal-case">(optional)</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={form.weight}
                onChange={(e) => handleChange("weight", e.target.value)}
                placeholder="e.g. 1.5"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 pr-12 text-sm text-gray-900 placeholder-gray-300 outline-none transition-all focus:border-blue-300 focus:ring-2 focus:ring-blue-100 focus:bg-white"
              />
              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-xs font-medium text-gray-400">
                kg
              </span>
            </div>
          </div>

          {/* Price & Currency row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Original Price
              </label>
              <input
                type="text"
                value={form.price}
                onChange={(e) => handleChange("price", e.target.value)}
                placeholder="0.00"
                className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-300 outline-none transition-all
                  focus:ring-2 focus:ring-offset-0
                  ${errors.price
                    ? "border-red-300 bg-red-50 focus:ring-red-200"
                    : "border-gray-200 bg-gray-50 focus:border-blue-300 focus:ring-blue-100 focus:bg-white"
                  }`}
              />
              {errors.price && (
                <p className="mt-1 text-xs text-red-500">{errors.price}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Currency
              </label>
              <div className="relative">
                <select
                  value={form.currency}
                  onChange={(e) => handleChange("currency", e.target.value)}
                  className="w-full appearance-none rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 pr-8 text-sm text-gray-900 outline-none transition-all focus:border-blue-300 focus:ring-2 focus:ring-blue-100 focus:bg-white cursor-pointer"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  <svg className="h-3.5 w-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Currency Rate */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Exchange Rate <span className="text-gray-300 font-normal normal-case">(to ৳ BDT)</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={form.currencyRate}
                onChange={(e) => handleChange("currencyRate", e.target.value)}
                placeholder="e.g. 110.50"
                className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-300 outline-none transition-all
                  focus:ring-2 focus:ring-offset-0
                  ${errors.currencyRate
                    ? "border-red-300 bg-red-50 focus:ring-red-200"
                    : "border-gray-200 bg-gray-50 focus:border-blue-300 focus:ring-blue-100 focus:bg-white"
                  }`}
              />
              {form.price && form.currencyRate && !isNaN(Number(form.price)) && !isNaN(Number(form.currencyRate)) && (
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5">
                  <span className="text-[11px] font-mono text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded">
                    ৳{(Number(form.price) * Number(form.currencyRate)).toFixed(2)}
                  </span>
                </div>
              )}
            </div>
            {errors.currencyRate && (
              <p className="mt-1 text-xs text-red-500">{errors.currencyRate}</p>
            )}
            <p className="mt-1.5 text-[11px] text-gray-400">
              Converted price = original price × exchange rate
            </p>
          </div>

          {/* Shipment Way */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Shipment Method
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleChange("shippmentWay", "air")}
                className={`relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 px-3 py-3 transition-all ${
                  form.shippmentWay === "air"
                    ? "border-sky-500 bg-sky-50 text-sky-700 shadow-sm"
                    : "border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                {form.shippmentWay === "air" && (
                  <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-sky-600 text-white">
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
                <span className="text-2xl">✈️</span>
                <span className="text-[10px] font-semibold uppercase tracking-wide">Air</span>
              </button>

              <button
                type="button"
                onClick={() => handleChange("shippmentWay", "sea")}
                className={`relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 px-3 py-3 transition-all ${
                  form.shippmentWay === "sea"
                    ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
                    : "border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                {form.shippmentWay === "sea" && (
                  <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white">
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
                <span className="text-2xl">🚢</span>
                <span className="text-[10px] font-semibold uppercase tracking-wide">Sea</span>
              </button>

              <button
                type="button"
                onClick={() => handleChange("shippmentWay", "luggage")}
                className={`relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 px-3 py-3 transition-all ${
                  form.shippmentWay === "luggage"
                    ? "border-purple-500 bg-purple-50 text-purple-700 shadow-sm"
                    : "border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                {form.shippmentWay === "luggage" && (
                  <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-purple-600 text-white">
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
                <span className="text-2xl">🧳</span>
                <span className="text-[10px] font-semibold uppercase tracking-wide">Luggage</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-4 bg-gray-50/80 border-t border-gray-100">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="rounded-xl px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Saving…
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes modal-in {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-modal-in {
          animation: modal-in 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
}
