"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import ProductCard from "./ProductCard";
import EditProductModal from "./EditProductModal";
import ProductDetailModal from "./ProductDetailModal";
import ImageModal from "./ImageModal";
import Toast from "../../components/Toast";
import { handleApiResponse } from "../../utils/errorHandler";
import type { Product, PaginationData, EditProductPayload } from "./types";

const categories = ["All", "Shoes", "Bags", "Electronics", "Gifts", "Wrapping", "Box"];

export default function ProductsPage() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  });

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showOnlySelected, setShowOnlySelected] = useState(false);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [updatingProduct, setUpdatingProduct] = useState<string | null>(null);

  const [modalImage, setModalImage] = useState<string | null>(null);
  const [modalProduct, setModalProduct] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "warning" | "info";
  } | null>(null);

  const showToast = (
    message: string,
    type: "success" | "error" | "warning" | "info"
  ) => setToast({ message, type });

  // --- Data Fetching with TanStack Query ---
  const { data, isLoading: loading, error, refetch } = useQuery({
    queryKey: ["products", pagination.page, pagination.limit, selectedCategory, showOnlySelected],
    queryFn: async () => {
      const url =
        selectedCategory === "All"
          ? `/api/products?page=${pagination.page}&limit=${pagination.limit}&onlySelected=${showOnlySelected}`
          : `/api/products/category/${encodeURIComponent(selectedCategory)}?page=${pagination.page}&limit=${pagination.limit}&onlySelected=${showOnlySelected}`;

      const response = await fetch(url);
      const { data, error } = await handleApiResponse<{
        products: Product[];
        pagination: PaginationData;
      }>(response, "Failed to fetch products");

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    retry: 1,
    staleTime: 30000, // 30 seconds
  });

  // Update products and pagination when data changes
  useEffect(() => {
    if (data) {
      setProducts(data.products || []);
      setPagination(data.pagination);
    }
  }, [data]);

  // Show error toast
  useEffect(() => {
    if (error) {
      showToast(error instanceof Error ? error.message : "An unexpected error occurred while fetching products", "error");
      setProducts([]);
    }
  }, [error]);

  



  // --- Handlers ---
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (productId: string) => {
    // Find the product to check if it's selected
    const productToDelete = products.find(p => p.id === productId);
    
    if (productToDelete?.isSelected) {
      showToast("Cannot delete a selected product. Please deselect it first.", "error");
      return;
    }
    
    if (!window.confirm("Are you sure you want to permanently delete this product?")) return;
    setIsDeleting(productId);
    try {
      const response = await fetch(`/api/products/${productId}`, { 
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          imageCloudinaryId: productToDelete?.imageCloudinaryId 
        }),
      });
      const { error } = await handleApiResponse(response, "Failed to delete product");
      if (error) { showToast(error.message, error.type); return; }
      showToast("Product deleted successfully", "success");
      refetch();
    } catch { showToast("An unexpected error occurred", "error"); }
    finally { setIsDeleting(null); }
  };

  const handleToggleSelected = async (productId: string, currentValue: boolean) => {
    // If deselecting (currentValue is true), show warning about stock deletion
    if (currentValue) {
      const confirmed = window.confirm(
        "Warning: Deselecting this product will delete all its stock entries. Are you sure you want to continue?"
      );
      if (!confirmed) return;
    }
    
    setUpdatingProduct(productId);
    try {
      const response = await fetch(`/api/products/${productId}/selected`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isSelected: !currentValue }),
      });
      const { error } = await handleApiResponse(response, "Failed to update selection");
      if (error) { showToast(error.message, error.type); return; }
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, isSelected: !currentValue } : p))
      );
      showToast(
        currentValue 
          ? "Item deselected and stock deleted" 
          : "Item selected and stock initialized", 
        "success"
      );
    } catch { showToast("Update failed", "error"); }
    finally { setUpdatingProduct(null); }
  };

  const handleSaleRateChange = async (
    productId: string,
    saleRate: "good" | "medium" | "bad" | "none"
  ) => {
    setUpdatingProduct(productId);
    try {
      const response = await fetch(`/api/products/${productId}/sale-rate`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ saleRate }),
      });
      const { error } = await handleApiResponse(response, "Failed to update sale rate");
      if (error) { showToast(error.message, error.type); return; }
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, saleRate } : p))
      );
      showToast("Performance rating updated", "success");
    } catch { showToast("Update failed", "error"); }
    finally { setUpdatingProduct(null); }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (productId: string, updatedData: EditProductPayload) => {
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });
      const { error } = await handleApiResponse(response, "Failed to update product");
      if (error) { showToast(error.message, error.type); return; }
      showToast("Product updated successfully", "success");
      refetch();
    } catch { showToast("Update failed", "error"); throw new Error("Update failed"); }
  };

  const copyImageToClipboard = async (imageUrl: string, productId: string) => {
    try {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

      if (isMobile) {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const img = new Image();
        img.crossOrigin = "anonymous";
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = URL.createObjectURL(blob);
        });
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        canvas.getContext("2d")?.drawImage(img, 0, 0);
        const pngBlob = await new Promise<Blob>((resolve) =>
          canvas.toBlob((b) => resolve(b!), "image/png")
        );
        if (navigator.share && navigator.canShare) {
          const file = new File([pngBlob], "product.png", { type: "image/png" });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({ files: [file], title: "Check this product" });
            setCopiedId(productId);
            setTimeout(() => setCopiedId(null), 2000);
            return;
          }
        }
        const url = URL.createObjectURL(pngBlob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `product-${productId}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        const img = new Image();
        img.crossOrigin = "anonymous";
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = imageUrl;
        });
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        canvas.getContext("2d")?.drawImage(img, 0, 0);
        const blob = await new Promise<Blob>((resolve) =>
          canvas.toBlob((b) => resolve(b!), "image/png")
        );
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      }

      setCopiedId(productId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      showToast("Could not copy image automatically", "info");
      window.open(imageUrl, "_blank");
    }
  };

  // --- Auth Guards ---
  if (isAuthLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50">
        <div className="flex flex-col items-center gap-4">
          <div className="relative h-10 w-10">
            <div className="absolute inset-0 animate-ping rounded-full bg-neutral-300 opacity-40"></div>
            <div className="relative h-10 w-10 animate-spin rounded-full border-[3px] border-neutral-200 border-t-neutral-900"></div>
          </div>
          <p className="text-sm font-medium tracking-wide text-neutral-500">Loading…</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  if (user.role !== "owner" && user.role !== "partner" && user.role !== "admin") {
    router.push("/");
    return null;
  }

  const isOwner = user.role === "owner";

  return (
    <div className="min-h-screen font-sans text-neutral-900 antialiased mb-30">
      {/* ── Main Content ────────────────────────────────── */}
      <main className="px-4 py-6 sm:px-6 sm:py-8">

        {/* ── Header with Category Filter ────────────── */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
              Products
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              Manage your product inventory
            </p>
          </div>

          {/* Category Pills */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => handleCategoryChange(category)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  selectedCategory === category
                    ? "bg-neutral-900 text-white"
                    : "bg-white text-neutral-700 hover:bg-neutral-100 border border-neutral-200"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* ── Filter Bar ─────────────────────────────── */}
        {isOwner && (
          <div className="mb-6 flex items-center justify-end">
            <label className="flex w-fit cursor-pointer items-center gap-2.5 rounded-full border border-neutral-200 bg-white px-4 py-2 shadow-sm transition hover:bg-neutral-50">
              <span className="whitespace-nowrap text-sm font-medium text-neutral-700 select-none">
                Selected only
              </span>
              <div className="relative inline-flex shrink-0 items-center">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={showOnlySelected}
                  onChange={() => {
                    setShowOnlySelected(!showOnlySelected);
                    setPagination((prev) => ({ ...prev, page: 1 }));
                  }}
                />
                <div className="h-5 w-9 rounded-full bg-neutral-200 transition-colors peer-checked:bg-neutral-900 after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:shadow after:transition-transform after:content-[''] peer-checked:after:translate-x-4" />
              </div>
            </label>
          </div>
        )}

        {/* ── Product Grid / States ───────────────────── */}
        {loading ? (
          /* Skeleton */
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-3 overflow-hidden rounded-2xl border border-neutral-100 bg-white p-3 shadow-sm">
                <div className="aspect-square w-full animate-pulse rounded-xl bg-neutral-100" />
                <div className="space-y-2">
                  <div className="h-3 w-3/4 animate-pulse rounded-full bg-neutral-100" />
                  <div className="h-3 w-1/2 animate-pulse rounded-full bg-neutral-100" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-white/60 py-24 text-center">
            <div className="mb-4 rounded-2xl bg-neutral-100 p-5">
              <svg className="h-8 w-8 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-neutral-900">No products found</h3>
            <p className="mt-1.5 max-w-xs text-sm text-neutral-500">
              {showOnlySelected
                ? "Try turning off the 'Selected only' filter."
                : "There are no products in this category yet."}
            </p>
            {showOnlySelected && (
              <button
                onClick={() => setShowOnlySelected(false)}
                className="mt-6 rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white transition active:scale-95 hover:bg-neutral-800"
              >
                Clear filter
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Result count header */}
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold tracking-tight text-neutral-900 sm:text-xl">
                {selectedCategory}
              </h2>
              <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-500">
                {pagination.total} items
              </span>
            </div>

            {/* Grid — 1 col on mobile, scaling up */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  isOwner={isOwner}
                  copiedId={copiedId}
                  isDeleting={isDeleting}
                  updatingProduct={updatingProduct}
                  onDelete={handleDelete}
                  onToggleSelected={handleToggleSelected}
                  onSaleRateChange={handleSaleRateChange}
                  onCopyImage={copyImageToClipboard}
                  onCardClick={setModalProduct}
                  onEdit={handleEditProduct}
                />
              ))}
            </div>

            {/* ── Pagination ─────────────────────────── */}
            {pagination.totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-2 border-t border-neutral-200 pt-8">
                {/* Prev */}
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-700 shadow-sm transition active:scale-95 hover:bg-neutral-50 disabled:pointer-events-none disabled:opacity-40 sm:w-auto sm:px-4"
                  aria-label="Previous page"
                >
                  <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                  <span className="ml-1 hidden text-sm font-medium sm:inline">Prev</span>
                </button>

                {/* Page indicator */}
                <span className="flex h-10 min-w-12 items-center justify-center rounded-xl bg-neutral-900 px-4 text-sm font-semibold text-white shadow-sm">
                  {pagination.page} / {pagination.totalPages}
                </span>

                {/* Next */}
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-700 shadow-sm transition active:scale-95 hover:bg-neutral-50 disabled:pointer-events-none disabled:opacity-40 sm:w-auto sm:px-4"
                  aria-label="Next page"
                >
                  <span className="mr-1 hidden text-sm font-medium sm:inline">Next</span>
                  <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* ── Modals ─────────────────────────────────────── */}
      <ImageModal
        imageUrl={modalImage}
        isOpen={!!modalImage}
        onClose={() => setModalImage(null)}
      />
      <ProductDetailModal
        product={modalProduct}
        isOpen={!!modalProduct}
        onClose={() => setModalProduct(null)}
        onCopyImage={copyImageToClipboard}
        onViewFullImage={setModalImage}
      />
      <EditProductModal
        product={editingProduct}
        isOpen={isEditModalOpen}
        onClose={() => { setIsEditModalOpen(false); setEditingProduct(null); }}
        onSave={handleSaveEdit}
      />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}