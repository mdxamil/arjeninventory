"use client";

import { useAuth } from "@/app/context/AuthContext";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { handleApiResponse } from "@/app/utils/errorHandler";
import EditWholesaleModal from "../EditWholesaleModal";

interface WholesaleProduct {
  id: number;
  productNumber: number;
  imageUrl: string;
  fileId: string;
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
  updatedAt: string;
  products: WholesaleProduct[];
}

interface UpdateOrderData {
  clientInfo: {
    name: string;
    nid: string;
    phone: string;
    email?: string;
    address: string;
  };
  products: Array<{
    productNumber: number;
    imageUrl: string;
    fileId: string;
    category: string;
    quantity: number;
    quantityType: string;
    rawPrice: number;
    profit: number;
  }>;
  totalWeight: number;
}

export default function WholesaleDetailPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;
  const queryClient = useQueryClient();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showClientInfo, setShowClientInfo] = useState(true);
  const [showProducts, setShowProducts] = useState(true);

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "owner")) {
      window.location.href = "/";
    }
  }, [user, isLoading]);

  // Fetch order with TanStack Query
  const { data: order, isLoading: loading, error } = useQuery({
    queryKey: ["wholesale-order", orderId],
    queryFn: async () => {
      const response = await fetch(`/api/wholesale/${orderId}`);
      const { data, error } = await handleApiResponse<{
        data: WholesaleOrder;
      }>(response, "Failed to fetch order");
      
      if (error || !data) throw new Error(error?.message || "Failed to fetch order");
      return data.data;
    },
    enabled: !!user && user.role === "owner" && !!orderId,
    retry: 1,
    staleTime: 30000, // 30 seconds
  });

  // Delete images from ImageKit
  const deleteImagesFromImageKit = async (products: WholesaleProduct[]) => {
    const deletePromises = products.map(async (product) => {
      try {
        const response = await fetch('/api/imagekit-upload', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileId: product.fileId }),
        });
        if (!response.ok) {
          console.error(`Failed to delete image ${product.fileId}`);
        }
      } catch (error) {
        console.error(`Error deleting image ${product.fileId}:`, error);
      }
    });
    await Promise.all(deletePromises);
  };

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      // First, delete all images from ImageKit
      if (order && order.products.length > 0) {
        await deleteImagesFromImageKit(order.products);
      }

      // Then delete the order from database
      const response = await fetch(`/api/wholesale/${orderId}`, {
        method: "DELETE",
      });
      const { data, error } = await handleApiResponse(response, "Failed to delete order");
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      // Invalidate orders list
      queryClient.invalidateQueries({ queryKey: ["wholesale-orders"] });
      router.push("/dashboard/wholesale");
    },
  });

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this wholesale order? This will also delete all product images. This action cannot be undone.")) {
      return;
    }

    try {
      await deleteMutation.mutateAsync();
      alert("Order and images deleted successfully");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete order");
    }
  };

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (updateData: UpdateOrderData) => {
      const response = await fetch(`/api/wholesale/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });
      const { data, error } = await handleApiResponse(response, "Failed to update order");
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      // Invalidate both the single order and orders list
      queryClient.invalidateQueries({ queryKey: ["wholesale-order", orderId] });
      queryClient.invalidateQueries({ queryKey: ["wholesale-orders"] });
      alert("Order updated successfully");
    },
  });

  const handleUpdate = async (updateData: UpdateOrderData) => {
    await updateMutation.mutateAsync(updateData);
  };

  if (isLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-lg bg-red-50 border border-red-200 p-4">
            <p className="text-sm text-red-800">{error?.message || "Order not found"}</p>
          </div>
          <button
            onClick={() => router.push("/dashboard/wholesale")}
            className="mt-4 text-blue-600 hover:text-blue-700"
          >
            ← Back to Orders
          </button>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const totalRawPrice = order.products.reduce(
    (sum, product) => sum + parseFloat(product.rawPrice),
    0
  );
  const totalFinalPrice = order.products.reduce(
    (sum, product) => sum + parseFloat(product.finalPrice),
    0
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-4 sm:pb-10 font-sans">
      <main className="mx-auto mt-2 sm:mt-6 lg:mt-8 max-w-7xl px-2 sm:px-4">
        {/* Header */}
        <div className="mb-3 sm:mb-6">
          <button
            onClick={() => router.push("/dashboard/wholesale")}
            className="mb-2 sm:mb-4 inline-flex items-center text-xs sm:text-sm text-gray-600 hover:text-gray-900 font-medium"
          >
            <svg
              className="mr-1 h-3.5 w-3.5 sm:h-4 sm:w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <span className="hidden sm:inline">Back to Orders</span>
            <span className="sm:hidden">Back</span>
          </button>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-3xl font-bold text-gray-900 truncate">
                Order Details
              </h1>
              <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-gray-600 truncate">{order.id}</p>
            </div>
            
            <div className="flex gap-2 sm:gap-3 shrink-0">
              <button
                onClick={() => setIsEditModalOpen(true)}
                disabled={updateMutation.isPending}
                className="flex-1 sm:flex-none inline-flex items-center justify-center rounded-lg bg-blue-600 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-white hover:bg-blue-700 active:bg-blue-800 transition disabled:opacity-50 shadow-sm"
              >
                <svg
                  className="mr-1 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                <span className="hidden sm:inline">Edit Order</span>
                <span className="sm:hidden">Edit</span>
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="flex-1 sm:flex-none inline-flex items-center justify-center rounded-lg bg-red-600 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-white hover:bg-red-700 active:bg-red-800 transition disabled:opacity-50 shadow-sm"
              >
                <svg
                  className="mr-1 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                <span className="hidden sm:inline">{deleteMutation.isPending ? "Deleting..." : "Delete"}</span>
                <span className="sm:hidden">
                  {deleteMutation.isPending ? (
                    <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  )}
                </span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-6">
          {/* Client Information */}
          <div className="lg:col-span-1">
            <div className="rounded-lg sm:rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <button
                onClick={() => setShowClientInfo(!showClientInfo)}
                className="w-full flex items-center justify-between p-3 sm:p-5 hover:bg-gray-50 transition-colors lg:cursor-default"
              >
                <h2 className="text-sm sm:text-lg font-semibold text-gray-900">
                  Client Information
                </h2>
                <svg
                  className={`h-5 w-5 text-gray-500 transition-transform lg:hidden ${
                    showClientInfo ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              
              <div className={`px-3 pb-3 sm:px-5 sm:pb-5 space-y-2.5 sm:space-y-3 border-t border-gray-100 pt-3 sm:pt-0 sm:border-0 ${showClientInfo ? 'block' : 'hidden'} lg:block`}>
                  <div>
                    <label className="text-xs font-medium text-gray-500">Name</label>
                    <p className="text-sm font-semibold text-gray-900 mt-0.5">{order.clientName}</p>
                  </div>
                  
                  <div>
                    <label className="text-xs font-medium text-gray-500">NID</label>
                    <p className="text-sm font-semibold text-gray-900 mt-0.5">{order.clientNid}</p>
                  </div>
                  
                  <div>
                    <label className="text-xs font-medium text-gray-500">Phone</label>
                    <p className="text-sm font-semibold text-gray-900 mt-0.5">{order.clientPhone}</p>
                  </div>
                  
                  {order.clientEmail && (
                    <div>
                      <label className="text-xs font-medium text-gray-500">Email</label>
                      <p className="text-sm font-semibold text-gray-900 mt-0.5">{order.clientEmail}</p>
                    </div>
                  )}
                  
                  <div>
                    <label className="text-xs font-medium text-gray-500">Address</label>
                    <p className="text-sm font-semibold text-gray-900 mt-0.5">{order.clientAddress}</p>
                  </div>

                  {/* Summary */}
                  <div className="mt-3 sm:mt-6 border-t border-gray-200 pt-3 sm:pt-4 space-y-2">
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-gray-600 font-medium">Total Weight</span>
                      <span className="font-bold text-gray-900">
                        {parseFloat(order.totalWeight).toFixed(2)} kg
                      </span>
                    </div>
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-gray-600 font-medium">Total Raw Price</span>
                      <span className="font-bold text-gray-900">
                        ৳{totalRawPrice.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-gray-600 font-medium">Final Price</span>
                      <span className="font-bold text-gray-900">
                        ৳{totalFinalPrice.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm sm:text-base border-t-2 border-gray-200 pt-2">
                      <span className="font-bold text-gray-900">Total Profit</span>
                      <span className="font-bold text-green-600">
                        ৳{parseFloat(order.totalProfit).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="mt-3 sm:mt-4 border-t border-gray-200 pt-3 sm:pt-4 space-y-1.5 sm:space-y-2">
                    <div>
                      <label className="text-xs font-medium text-gray-500">Created</label>
                      <p className="text-xs text-gray-900 mt-0.5">
                        {new Date(order.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500">Last Updated</label>
                      <p className="text-xs text-gray-900 mt-0.5">
                        {new Date(order.updatedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
            </div>
          </div>

          {/* Products */}
          <div className="lg:col-span-2">
            <div className="rounded-lg sm:rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <button
                onClick={() => setShowProducts(!showProducts)}
                className="w-full flex items-center justify-between p-3 sm:p-5 hover:bg-gray-50 transition-colors lg:cursor-default"
              >
                <h2 className="text-sm sm:text-lg font-semibold text-gray-900">
                  Products ({order.products.length})
                </h2>
                <svg
                  className={`h-5 w-5 text-gray-500 transition-transform lg:hidden ${
                    showProducts ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              
              <div className={`px-3 pb-3 sm:px-5 sm:pb-5 space-y-2.5 sm:space-y-4 border-t border-gray-100 pt-3 sm:pt-0 sm:border-0 ${showProducts ? 'block' : 'hidden'} lg:block`}>
                  {order.products.map((product) => (
                    <div
                      key={product.id}
                      className="flex gap-2.5 sm:gap-4 rounded-lg border border-gray-200 bg-gray-50 p-2.5 sm:p-4"
                    >
                      {/* Image */}
                      <div className="shrink-0">
                        <div className="relative h-16 w-16 sm:h-24 sm:w-24 overflow-hidden rounded-lg border-2 border-gray-300">
                          <Image
                            src={product.imageUrl}
                            alt={`Product ${product.productNumber}`}
                            className="object-cover"
                            fill
                            unoptimized
                          />
                        </div>
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0 space-y-1.5 sm:space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800">
                              #{product.productNumber}
                            </span>
                            <h3 className="mt-1 text-sm sm:text-base font-bold text-gray-900 truncate">
                              {product.category}
                            </h3>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
                          <div>
                            <label className="text-xs font-medium text-gray-500">Quantity</label>
                            <p className="font-bold text-gray-900 mt-0.5">
                              {product.quantity} {product.quantityType}
                            </p>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-500">Raw Price</label>
                            <p className="font-bold text-gray-900 mt-0.5">
                              ৳{parseFloat(product.rawPrice).toFixed(2)}
                            </p>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-500">Profit</label>
                            <p className="font-bold text-green-600 mt-0.5">
                              ৳{parseFloat(product.profit).toFixed(2)}
                            </p>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-500">Final Price</label>
                            <p className="font-bold text-gray-900 mt-0.5">
                              ৳{parseFloat(product.finalPrice).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
            </div>
          </div>
        </div>
      </main>

      {/* Edit Modal */}
      <EditWholesaleModal
        order={order}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleUpdate}
      />
    </div>
  );
}
