"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import Toast from "../../components/Toast";
import PackageCard from "./PackageCard";
import ImageModal from "./ImageModal";
import PackageDetailModal from "./PackageDetailModal";
import type { Package } from "./types";
import { handleApiResponse } from "../../utils/errorHandler";

const categories = ["All", "Shoes", "Bags", "Electronics", "Gifts", "Wrapping", "Box"];

export default function PackagesPage() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const queryClient = useQueryClient();

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  
  // Modal states
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isImageFullscreen, setIsImageFullscreen] = useState(false);
  const [fullscreenImageSrc, setFullscreenImageSrc] = useState<string | null>(null);

  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "warning" | "info";
  } | null>(null);

  const showToast = (
    message: string,
    type: "success" | "error" | "warning" | "info"
  ) => setToast({ message, type });

  // --- Data Fetching ---
  const { data, isLoading: loading, error } = useQuery({
    queryKey: ["packages"],
    queryFn: async () => {
      const response = await fetch("/api/packages");
      const { data, error } = await handleApiResponse<Package[]>(response, "Failed to fetch packages");
      if (error) throw new Error(error.message);
      return data;
    },
    retry: 1,
    staleTime: 30000,
  });

  const packages = data || [];

  // --- Delete Mutation ---
  const deleteMutation = useMutation({
    mutationFn: async (packageId: string) => {
      const response = await fetch(`/api/packages/${packageId}`, {
        method: "DELETE",
      });
      const { data, error } = await handleApiResponse(response, "Failed to delete package");
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packages"] });
      showToast("Package deleted successfully", "success");
    },
    onError: (error: Error) => {
      showToast(error.message || "Failed to delete package", "error");
    },
  });

  // --- Handlers ---
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };

  const handleDeletePackage = (pkg: Package) => {
    if (window.confirm(`Are you sure you want to delete package "${pkg.packageCode}"?\n\nThis action cannot be undone.`)) {
      deleteMutation.mutate(pkg.id);
    }
  };

  const handleViewDetails = (pkg: Package) => {
    setSelectedPackage(pkg);
    setIsDetailModalOpen(true);
  };

  const handleCopyImage = async (e: React.MouseEvent, imageUrl: string) => {
    e.stopPropagation();
    try {
      // Fetch the image
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      // Check if clipboard API is available
      if (navigator.clipboard && window.ClipboardItem) {
        // Copy image to clipboard
        await navigator.clipboard.write([
          new ClipboardItem({
            [blob.type]: blob
          })
        ]);
        showToast("Image copied to clipboard!", "success");
      } else {
        showToast("Clipboard not supported on this browser", "warning");
      }
    } catch (error) {
      console.error("Failed to copy image:", error);
      showToast("Failed to copy image", "error");
    }
  };

  // --- Auth Guards ---
  if (isAuthLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-black"></div>
          <p className="animate-pulse text-sm font-medium text-gray-500">Loading your inventory...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  if (user.role !== "owner" && user.role !== "seller" && user.role !== "reseller") {
    router.push("/");
    return null;
  }

  const filteredPackages = selectedCategory === "All"
    ? packages
    : packages.filter(pkg => pkg.category === selectedCategory);

  const getFinalPrice = (pkg: Package) => {
    return pkg.profit !== undefined ? pkg.packageRawCost + pkg.profit : pkg.packageRawCost;
  };

  return (
    <div className="min-h-screen bg-gray-50/50 font-sans text-gray-900">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        
        {/* ── Header & Title ──────────────────────────────── */}
        <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Packages
            </h1>
            <p className="text-sm text-gray-500">
              {user.role === "owner" && "Manage inventory and pricing"}
              {user.role === "seller" && "Browse packages and check commissions"}
              {user.role === "reseller" && "Explore packages available for resale"}
            </p>
          </div>

          {user.role === "owner" && (
            <button
              onClick={() => router.push("/dashboard/addpackage")}
              className="inline-flex items-center justify-center rounded-xl bg-black px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 transition-all active:scale-95"
            >
              Add Package
            </button>
          )}
        </div>

        {/* ── Category Navigation (Scrollable on mobile) ──────────────── */}
        <div className="sticky top-0 z-20 -mx-4 mb-8 overflow-x-auto bg-gray-50/95 px-4 pb-4 pt-2 backdrop-blur sm:static sm:mx-0 sm:overflow-visible sm:bg-transparent sm:p-0">
          <div className="flex gap-2 sm:flex-wrap">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => handleCategoryChange(category)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all ${
                  selectedCategory === category
                    ? "bg-black text-white shadow-md ring-2 ring-black ring-offset-2"
                    : "bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-900 border border-gray-200"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* ── Loading & Error States ──────────────────────── */}
        {loading && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex h-[320px] flex-col overflow-hidden rounded-2xl bg-white shadow-sm">
                <div className="h-48 animate-pulse bg-gray-200" />
                <div className="flex-1 space-y-3 p-4">
                  <div className="h-4 w-2/3 animate-pulse rounded bg-gray-200" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-gray-200" />
                  <div className="mt-4 h-8 w-full animate-pulse rounded bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-8 text-center">
            <h3 className="text-lg font-semibold text-red-900">Failed to load packages</h3>
            <p className="mt-1 text-sm text-red-600">{error instanceof Error ? error.message : "Unknown error"}</p>
          </div>
        )}

        {!loading && !error && filteredPackages.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-gray-300 bg-white p-12 text-center">
            <div className="mb-4 rounded-full bg-gray-50 p-4">
              <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.373-.03.748-.057 1.123-.08M15.75 18H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08M15.75 18.75v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5A3.375 3.375 0 006.375 7.5H5.25m11.9-3.664A2.251 2.251 0 0015 2.25h-1.5a2.251 2.251 0 00-2.15 1.586m5.8 0c.065.21.1.433.1.664v.75h-6V4.5c0-.231.035-.454.1-.664M6.75 7.5H4.875c-.621 0-1.125.504-1.125 1.125v12c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V16.5a9 9 0 00-9-9z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">No packages found</h3>
            <p className="text-gray-500">Try selecting a different category or add a new package.</p>
          </div>
        )}

        {/* ── Packages Grid ──────────────────────────────── */}
        {!loading && !error && filteredPackages.length > 0 && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredPackages.map((pkg) => (
              <PackageCard
                key={pkg.id}
                pkg={pkg}
                userRole={user.role}
                onViewDetails={handleViewDetails}
                onCopyImage={handleCopyImage}
                onDelete={handleDeletePackage}
                getFinalPrice={getFinalPrice}
              />
            ))}
          </div>
        )}
      </main>

      {/* ── Fullscreen Image Modal ──────────────────────── */}
      <ImageModal
        isOpen={isImageFullscreen}
        imageUrl={fullscreenImageSrc}
        onClose={() => setIsImageFullscreen(false)}
      />

      {/* ── Detail Modal ──────────────────────────────── */}
      <PackageDetailModal
        pkg={selectedPackage}
        isOpen={isDetailModalOpen}
        userRole={user.role}
        onClose={() => setIsDetailModalOpen(false)}
        onCopyImage={handleCopyImage}
        onDelete={handleDeletePackage}
        onViewFullImage={(url) => {
          setFullscreenImageSrc(url);
          setIsImageFullscreen(true);
        }}
        getFinalPrice={getFinalPrice}
      />

      {/* ── Toast Notifications ─────────────────────── */}
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