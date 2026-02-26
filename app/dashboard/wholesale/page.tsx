"use client";

import { useAuth } from "@/app/context/AuthContext";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { handleApiResponse } from "@/app/utils/errorHandler";

interface WholesaleProduct {
  id: number;
  productNumber: number;
  imageUrl: string;
  category: string;
  quantity: number;
  quantityType: string;
  rawPrice: string;
  profit: string;
  finalPrice: string;
}

interface WholesaleOrder {
  id: string;
  clientName: string;
  clientNid: string;
  clientPhone: string;
  clientEmail: string | null;
  clientAddress: string;
  totalWeight: string;
  totalProfit: string;
  createdAt: string;
  products: WholesaleProduct[];
}

export default function WholesalePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "owner")) {
      window.location.href = "/";
    }
  }, [user, isLoading]);

  // Fetch orders with TanStack Query
  const { data, isLoading: loading, error } = useQuery({
    queryKey: ["wholesale-orders"],
    queryFn: async () => {
      const response = await fetch("/api/wholesale");
      const { data, error } = await handleApiResponse<{
        data: WholesaleOrder[];
        count: number;
      }>(response, "Failed to fetch wholesale orders");
      
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!user && user.role === "owner",
    retry: 1,
    staleTime: 30000, // 30 seconds
  });

  const orders = data?.data || [];

  const handleOrderClick = (orderId: string) => {
    router.push(`/dashboard/wholesale/${orderId}`);
  };

  if (isLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="relative h-10 w-10">
            <div className="absolute inset-0 animate-ping rounded-full bg-gray-300 opacity-40"></div>
            <div className="relative h-10 w-10 animate-spin rounded-full border-[3px] border-gray-200 border-t-gray-900"></div>
          </div>
          <p className="text-sm font-medium tracking-wide text-gray-500">Loading wholesale orders...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50/50 font-sans text-gray-900 antialiased">
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {/* ── Header ────────────────────────────────── */}
        <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              Wholesale Orders
            </h1>
            <p className="text-sm text-gray-500">
              View and manage all wholesale orders
            </p>
          </div>

          {user.role === "owner" && (
            <button
              onClick={() => router.push("/dashboard/addwholesale")}
              className="inline-flex items-center justify-center rounded-xl bg-black px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 transition-all active:scale-95"
            >
              Create Order
            </button>
          )}
        </div>

        {/* ── Error State ────────────────────────────── */}
        {error && (
          <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 p-6 text-center">
            <h3 className="text-lg font-semibold text-red-900">Failed to load orders</h3>
            <p className="mt-1 text-sm text-red-600">{error.message}</p>
          </div>
        )}

        {/* ── Empty State ────────────────────────────── */}
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-gray-300 bg-white p-12 text-center">
            <div className="mb-4 rounded-full bg-gray-50 p-4">
              <svg
                className="h-8 w-8 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              No wholesale orders
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Get started by creating your first wholesale order
            </p>
            {user.role === "owner" && (
              <button
                onClick={() => router.push("/dashboard/addwholesale")}
                className="mt-6 inline-flex items-center justify-center rounded-xl bg-black px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 transition-all active:scale-95"
              >
                Create Order
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {orders.map((order) => (
              <button
                key={order.id}
                onClick={() => handleOrderClick(order.id)}
                className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-gray-300 text-left"
              >
                {/* Order ID Badge */}
                <div className="mb-3">
                  <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-800">
                    #{order.id}
                  </span>
                </div>

                {/* Client Info */}
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-black transition">
                  {order.clientName}
                </h3>
                <p className="mt-1 text-sm text-gray-600">{order.clientPhone}</p>
                
                {/* Products Count */}
                <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                    />
                  </svg>
                  <span>{order.products.length} Products</span>
                </div>

                {/* Stats */}
                <div className="mt-4 grid grid-cols-2 gap-3 border-t border-gray-100 pt-4">
                  <div>
                    <p className="text-xs font-medium text-gray-500">Total Weight</p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">
                      {parseFloat(order.totalWeight).toFixed(2)} kg
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500">Total Profit</p>
                    <p className="mt-1 text-sm font-semibold text-green-600">
                      ৳{parseFloat(order.totalProfit).toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Date */}
                <p className="mt-4 text-xs text-gray-400">
                  {new Date(order.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>

                {/* View Arrow */}
                <div className="mt-4 flex items-center text-sm font-medium text-gray-700 group-hover:text-gray-900">
                  <span>View Details</span>
                  <svg
                    className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
