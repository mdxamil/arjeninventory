"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import Toast from "../../components/Toast";
import { handleApiResponse } from "../../utils/errorHandler";
import Image from "next/image";

interface Product {
  id: string;
  category: string;
  imageUrl: string;
  description: string;
  price: string;
  product_code: string;
  isSelected: boolean;
}

interface Stock {
  id: string;
  productId: string;
  quantity: number;
  quantityType: string;
  productCode: string;
  productCategory: string;
  productDescription: string;
}

interface ProductWithStock extends Product {
  stockId?: string;
  quantity: number;
  quantityType: string;
}

export default function StockPage() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const queryClient = useQueryClient();

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [localQuantities, setLocalQuantities] = useState<Record<string, number>>({});
  const [updatingProductId, setUpdatingProductId] = useState<string | null>(null);

  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "warning" | "info";
  } | null>(null);

  const showToast = (
    message: string,
    type: "success" | "error" | "warning" | "info"
  ) => setToast({ message, type });

  const categories = ["All", "Shoes", "Bags", "Electronics", "Gifts", "Wrapping", "Box"];

  // Fetch selected products with TanStack Query
  const { data: productsData, isLoading: productsLoading, error: productsError } = useQuery({
    queryKey: ["selectedProducts"],
    queryFn: async () => {
      const response = await fetch("/api/products?onlySelected=true&limit=1000");
      const { data, error } = await handleApiResponse<{
        products: Product[];
      }>(response, "Failed to fetch products");

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    enabled: !!user && (user.role === "owner" || user.role === "partner"),
    staleTime: 60000, // 1 minute
    retry: 1,
  });

  // Fetch stocks with TanStack Query
  const { data: stocksData, isLoading: stocksLoading, error: stocksError } = useQuery({
    queryKey: ["stocks"],
    queryFn: async () => {
      const response = await fetch("/api/stocks?limit=1000");
      const { data, error } = await handleApiResponse<{
        stocks: Stock[];
      }>(response, "Failed to fetch stocks");

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    enabled: !!user && (user.role === "owner" || user.role === "partner"),
    staleTime: 60000, // 1 minute
    retry: 1,
  });

  // Merge products with stock data
  const productsWithStock = useMemo(() => {
    if (!productsData?.products || !stocksData?.stocks) return [];

    const products = productsData.products;
    const stocks = stocksData.stocks;

    // Create a map of stocks by productId
    const stockMap = new Map<string, Stock>();
    stocks.forEach((stock) => {
      stockMap.set(stock.productId, stock);
    });

    // Merge products with stock data
    const merged: ProductWithStock[] = products.map((product) => {
      const stock = stockMap.get(product.id);
      return {
        ...product,
        stockId: stock?.id,
        quantity: stock?.quantity || 0,
        quantityType: stock?.quantityType || "pcs",
      };
    });

    return merged;
  }, [productsData, stocksData]);

  // Update stock mutation
  const updateStockMutation = useMutation({
    mutationFn: async ({ productId, quantity }: { productId: string; quantity: number }) => {
      const response = await fetch(`/api/stocks/${productId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ quantity }),
      });

      const result = await handleApiResponse(response, "Failed to update stock");

      if (result.error) {
        // If stock doesn't exist, create it
        if (result.error.statusCode === 404) {
          const createResponse = await fetch("/api/stocks", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              productId,
              quantity,
              quantityType: "pcs",
            }),
          });

          const createResult = await handleApiResponse(
            createResponse,
            "Failed to create stock"
          );

          if (createResult.error) {
            throw new Error(createResult.error.message);
          }

          return createResult.data;
        } else {
          throw new Error(result.error.message);
        }
      }

      return result.data;
    },
    onSuccess: () => {
      showToast("Stock updated successfully", "success");
      queryClient.invalidateQueries({ queryKey: ["stocks"] });
      setUpdatingProductId(null);
    },
    onError: (error: Error) => {
      showToast(error.message || "Failed to update stock", "error");
      setUpdatingProductId(null);
    },
  });

  const handleQuantityUpdate = (productId: string, newQuantity: number) => {
    if (newQuantity < 0) return;
    setUpdatingProductId(productId);
    updateStockMutation.mutate({ productId, quantity: newQuantity });
  };

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity < 0) return; // Prevent negative values
    setLocalQuantities((prev) => ({
      ...prev,
      [productId]: newQuantity,
    }));
  };

  const getDisplayQuantity = (product: ProductWithStock) => {
    return localQuantities[product.id] !== undefined
      ? localQuantities[product.id]
      : product.quantity;
  };

  // Handle errors
  const error = productsError || stocksError;
  if (error) {
    showToast(
      error instanceof Error ? error.message : "Failed to load data",
      "error"
    );
  }

  const filteredProducts = useMemo(() => {
    return productsWithStock.filter((product) => {
      const matchesCategory =
        selectedCategory === "All" || product.category === selectedCategory;
      const matchesSearch =
        searchTerm === "" ||
        product.product_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [productsWithStock, selectedCategory, searchTerm]);

  // Auth Guards
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

  if (user.role !== "owner" && user.role !== "partner") {
    router.push("/");
    return null;
  }

  const loading = productsLoading || stocksLoading;

  return (
    <div className="min-h-screen bg-neutral-50 pb-20 font-sans text-neutral-900 antialiased">
      <main className="px-4 py-6 sm:px-6 sm:py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
            Stock Management
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Manage inventory for selected products
          </p>
        </div>

        {/* Category Filter */}
        <div className="mb-6 flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
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

        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search by product code, description, or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="relative h-10 w-10">
              <div className="absolute inset-0 animate-ping rounded-full bg-neutral-300 opacity-40"></div>
              <div className="relative h-10 w-10 animate-spin rounded-full border-[3px] border-neutral-200 border-t-neutral-900"></div>
            </div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-neutral-200 bg-white py-12">
            <p className="text-neutral-500">No selected products found</p>
            <p className="mt-1 text-sm text-neutral-400">
              Mark products as selected to manage their stock
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden overflow-x-auto rounded-lg border border-neutral-200 bg-white shadow-sm md:block">
              <table className="w-full min-w-max">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-600 w-20">
                      Image
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-600 w-32">
                      Product Code
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-600 w-28">
                      Category
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-600">
                      Description
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-600 w-40">
                      Stock Quantity
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-600 w-16">
                      Save
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-neutral-50 transition">
                      <td className="px-4 py-4 w-20">
                        <div className="relative h-16 w-16 overflow-hidden rounded-lg border border-neutral-200">
                          <Image
                            src={product.imageUrl}
                            alt={product.description}
                            fill
                            className="object-cover"
                          />
                        </div>
                      </td>
                      <td className="px-4 py-4 w-32">
                        <span className="font-mono text-sm font-medium text-neutral-900">
                          {product.product_code}
                        </span>
                      </td>
                      <td className="px-4 py-4 w-28">
                        <span className="inline-flex items-center rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-800">
                          {product.category}
                        </span>
                      </td>
                      <td className="px-4 py-4 max-w-xs">
                        <p className="truncate text-sm text-neutral-700">
                          {product.description}
                        </p>
                      </td>
                      <td className="px-4 py-4 w-40">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              const currentQty = getDisplayQuantity(product);
                              if (currentQty > 0) {
                                handleQuantityChange(product.id, currentQty - 1);
                              }
                            }}
                            disabled={updatingProductId === product.id || getDisplayQuantity(product) === 0}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                            </svg>
                          </button>
                          <input
                            type="number"
                            min="0"
                            value={getDisplayQuantity(product)}
                            onChange={(e) => {
                              const newValue = parseInt(e.target.value) || 0;
                              if (newValue >= 0) {
                                handleQuantityChange(product.id, newValue);
                              }
                            }}
                            disabled={updatingProductId === product.id}
                            className="w-16 rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-center text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 disabled:opacity-50"
                          />
                          <button
                            onClick={() => {
                              const currentQty = getDisplayQuantity(product);
                              handleQuantityChange(product.id, currentQty + 1);
                            }}
                            disabled={updatingProductId === product.id}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                            </svg>
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-4 w-16">
                        <button
                          onClick={() =>
                            handleQuantityUpdate(product.id, getDisplayQuantity(product))
                          }
                          disabled={updatingProductId === product.id}
                          className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 disabled:opacity-50 transition"
                          title="Save"
                        >
                          {updatingProductId === product.id ? (
                            <svg
                              className="h-4 w-4 animate-spin"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                                fill="none"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              />
                            </svg>
                          ) : (
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="grid gap-4 md:hidden">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex gap-4">
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-neutral-200">
                      <Image
                        src={product.imageUrl}
                        alt={product.description}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-sm font-medium text-neutral-900">
                        {product.product_code}
                      </p>
                      <span className="mt-1 inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-800">
                        {product.category}
                      </span>
                      <p className="mt-2 text-xs text-neutral-500 line-clamp-2">
                        {product.description}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-3">
                    <label className="text-sm font-medium text-neutral-700">
                      Stock:
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const currentQty = getDisplayQuantity(product);
                          if (currentQty > 0) {
                            handleQuantityChange(product.id, currentQty - 1);
                          }
                        }}
                        disabled={updatingProductId === product.id || getDisplayQuantity(product) === 0}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                        </svg>
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={getDisplayQuantity(product)}
                        onChange={(e) => {
                          const newValue = parseInt(e.target.value) || 0;
                          if (newValue >= 0) {
                            handleQuantityChange(product.id, newValue);
                          }
                        }}
                        disabled={updatingProductId === product.id}
                        className="w-16 rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-center text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 disabled:opacity-50"
                      />
                      <button
                        onClick={() => {
                          const currentQty = getDisplayQuantity(product);
                          handleQuantityChange(product.id, currentQty + 1);
                        }}
                        disabled={updatingProductId === product.id}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>
                    <button
                      onClick={() =>
                        handleQuantityUpdate(product.id, getDisplayQuantity(product))
                      }
                      disabled={updatingProductId === product.id}
                      className="ml-auto flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 disabled:opacity-50 transition"
                      title="Save"
                    >
                      {updatingProductId === product.id ? (
                        <svg
                          className="h-4 w-4 animate-spin"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                      ) : (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>

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
