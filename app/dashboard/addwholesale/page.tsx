"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Toast from "../../components/Toast";
import WholesaleProductItem from "./WholesaleProductItem";
import { handleApiResponse } from "../../utils/errorHandler";

interface ClientInfo {
  name: string;
  nid: string;
  phone: string;
  email: string;
  address: string;
}

interface WholesaleItem {
  id: string;
  file: File;
  preview: string;
  category: string;
  quantity: string;
  quantityType: string;
  rawPrice: string;
  profit: string;
  uploading: boolean;
  uploadedUrl?: string;
  fileId?: string;
}

interface CreateOrderData {
  clientInfo: {
    name: string;
    nid: string;
    phone: string;
    email: string;
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
  shippmenttype: string;
}

export default function AddWholesalePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  
  const [step, setStep] = useState<"client" | "products">("client");
  const [clientInfo, setClientInfo] = useState<ClientInfo>({
    name: "",
    nid: "",
    phone: "",
    email: "",
    address: "",
  });
  const [items, setItems] = useState<WholesaleItem[]>([]);
  const [totalWeight, setTotalWeight] = useState<string>("");
  const [shippmentType, setShippmentType] = useState<string>("air");
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "warning" | "info";
  } | null>(null);

  const showToast = (
    message: string,
    type: "success" | "error" | "warning" | "info"
  ) => {
    setToast({ message, type });
  };

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async (orderData: CreateOrderData) => {
      const response = await fetch("/api/wholesale", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });
      
      const { data, error } = await handleApiResponse(response, "Failed to create order");
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (data) => {
      // Invalidate wholesale orders cache
      queryClient.invalidateQueries({ queryKey: ["wholesale-orders"] });
      showToast("Wholesale order created successfully!", "success");
      console.log("Order created:", data);
      
      // Navigate to wholesale orders page after 1 second
      setTimeout(() => {
        router.push("/dashboard/wholesale");
      }, 1000);
    },
    onError: (error: Error) => {
      console.error("Error creating order:", error);
      showToast(error.message || "Failed to create order", "error");
    },
  });

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "owner")) {
      window.location.href = "/";
    }
  }, [user, isLoading]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newItems: WholesaleItem[] = Array.from(files).map((file) => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      preview: URL.createObjectURL(file),
      category: "",
      quantity: "",
      quantityType: "piece",
      rawPrice: "",
      profit: "",
      uploading: false,
    }));

    setItems([...items, ...newItems]);
  };

  const handleItemChange = (
    id: string,
    field: "category" | "quantity" | "quantityType" | "rawPrice" | "profit",
    value: string
  ) => {
    setItems(
      items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const handleAddCustomCategory = (category: string) => {
    const formatted = category.trim();
    if (formatted && !customCategories.includes(formatted.toLowerCase())) {
      setCustomCategories([...customCategories, formatted.toLowerCase()]);
    }
  };

  const formatCategory = (category: string): string => {
    const trimmed = category.trim();
    if (!trimmed) return "";
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
  };

  const handleRemoveItem = (id: string) => {
    const item = items.find((i) => i.id === id);
    if (item) {
      URL.revokeObjectURL(item.preview);
    }
    setItems(items.filter((item) => item.id !== id));
  };

  const compressImage = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          // Calculate new dimensions (max 800px width/height for wholesale)
          let width = img.width;
          let height = img.height;
          const maxSize = 800; // Reduced from 1200 for faster uploads

          if (width > height) {
            if (width > maxSize) {
              height = (height * maxSize) / width;
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width = (width * maxSize) / height;
              height = maxSize;
            }
          }

          canvas.width = width;
          canvas.height = height;

          // Draw and compress (0.7 quality for smaller file size)
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7); // Reduced from 0.8
          resolve(compressedBase64.split(',')[1]);
        };

        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const uploadToImageKit = async (item: WholesaleItem): Promise<{ url: string; fileId: string }> => {
    try {
      // Compress image before uploading
      const compressedBase64 = await compressImage(item.file);
      
      // Generate random UID for filename
      const randomFileName = `${crypto.randomUUID()}.jpg`;
      
      // Upload to ImageKit
      const response = await fetch('/api/imagekit-upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file: compressedBase64,
          fileName: randomFileName,
          folder: '/wholesale-products'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to upload to ImageKit');
      }

      const data = await response.json();
      return { url: data.url, fileId: data.fileId };
    } catch (error) {
      throw error;
    }
  };

  const deleteFromImageKit = async (fileId: string) => {
    try {
      const response = await fetch('/api/imagekit-upload', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileId })
      });

      if (!response.ok) {
        throw new Error('Failed to delete from ImageKit');
      }

      return true;
    } catch (error) {
      console.error('Error deleting from ImageKit:', error);
      return false;
    }
  };

  const handleUploadAll = async () => {
    // Validate all items
    for (const item of items) {
      if (!item.category || !item.quantity || !item.rawPrice || !item.profit) {
        showToast("Please fill in all fields for each item", "warning");
        return;
      }
    }

    if (items.length === 0) {
      showToast("Please add at least one item", "warning");
      return;
    }

    if (!totalWeight) {
      showToast("Please enter total weight", "warning");
      return;
    }

    if (!shippmentType) {
      showToast("Please select shipment type", "warning");
      return;
    }

    // Store uploaded items with their data
    const uploadedItems: Array<{
      id: string;
      uploadedUrl: string;
      fileId: string;
      category: string;
      quantity: string;
      quantityType: string;
      rawPrice: string;
      profit: string;
    }> = [];

    // Upload each item
    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      // Mark item as uploading
      setItems((prevItems) =>
        prevItems.map((prevItem) =>
          prevItem.id === item.id ? { ...prevItem, uploading: true } : prevItem
        )
      );

      try {
        // Upload to ImageKit
        const { url: uploadedUrl, fileId } = await uploadToImageKit(item);

        // Store uploaded data
        uploadedItems.push({
          id: item.id,
          uploadedUrl,
          fileId,
          category: item.category,
          quantity: item.quantity,
          quantityType: item.quantityType,
          rawPrice: item.rawPrice,
          profit: item.profit,
        });

        // Update item with uploaded URL and fileId
        setItems((prevItems) =>
          prevItems.map((prevItem) =>
            prevItem.id === item.id
              ? { ...prevItem, uploading: false, uploadedUrl, fileId }
              : prevItem
          )
        );

        showToast(
          `Image ${i + 1} of ${items.length} uploaded successfully`,
          "success"
        );
      } catch (error) {
        console.error(`Error uploading image ${i + 1}:`, error);
        showToast(`Failed to upload image ${i + 1}`, "error");

        // Mark item as not uploading
        setItems((prevItems) =>
          prevItems.map((prevItem) =>
            prevItem.id === item.id ? { ...prevItem, uploading: false } : prevItem
          )
        );
        return;
      }
    }

    // Validate all items were uploaded
    if (uploadedItems.length !== items.length) {
      showToast("Some images failed to upload. Please try again.", "error");
      return;
    }

    // Create the full order object using the uploaded data
    const order = {
      clientInfo: {
        name: clientInfo.name,
        nid: clientInfo.nid,
        phone: clientInfo.phone,
        email: clientInfo.email || "",
        address: clientInfo.address,
      },
      products: uploadedItems.map((item, index) => ({
        productNumber: index + 1,
        imageUrl: item.uploadedUrl,
        fileId: item.fileId,
        category: formatCategory(item.category),
        quantity: parseFloat(item.quantity),
        quantityType: item.quantityType,
        rawPrice: parseFloat(item.rawPrice),
        profit: parseFloat(item.profit),
      })),
      totalWeight: parseFloat(totalWeight),
      shippmenttype: shippmentType,
    };

    // Send order to backend
    showToast("Creating wholesale order...", "info");
    console.log("Sending order to backend:", JSON.stringify(order, null, 2));
    
    createOrderMutation.mutate(order);
  };

  const handleCancel = async () => {
    // Delete all uploaded images from ImageKit
    const uploadedItems = items.filter(item => item.fileId);
    
    if (uploadedItems.length > 0) {
      showToast("Deleting uploaded images...", "info");
      
      for (const item of uploadedItems) {
        if (item.fileId) {
          await deleteFromImageKit(item.fileId);
        }
      }
    }

    // Revoke all preview URLs
    items.forEach((item) => URL.revokeObjectURL(item.preview));
    
    // Refresh the page
    window.location.reload();
  };

  const handleClientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!clientInfo.name || !clientInfo.nid || !clientInfo.phone || !clientInfo.address) {
      showToast("Please fill in all required client fields", "warning");
      return;
    }

    setStep("products");
    showToast("Client info saved! Now add products", "success");
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-6 sm:pb-10 font-sans">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <main className="mx-auto mt-4 sm:mt-6 lg:mt-8 max-w-6xl px-3 sm:px-4">
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 p-4 sm:p-6">
            <h2 className="text-center text-xl sm:text-2xl font-bold text-gray-900">
              {step === "client" ? "Client Information" : "Upload Wholesale Products"}
            </h2>
            <p className="mt-2 text-center text-xs sm:text-sm text-gray-700 px-2">
              {step === "client" 
                ? "Enter client details for this wholesale order" 
                : "Upload multiple products with individual quantity, weight, and price"}
            </p>
          </div>

          <div className="p-4 sm:p-6">
            {/* Step Indicator */}
            <div className="mb-4 sm:mb-6 flex items-center justify-center">
              <div className="flex items-center">
                <div className={`flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full text-sm sm:text-base ${step === "client" ? "bg-blue-600 text-white" : "bg-green-600 text-white"}`}>
                  {step === "client" ? "1" : "✓"}
                </div>
                <span className="ml-1.5 sm:ml-2 text-xs sm:text-sm font-medium text-gray-900">Client Info</span>
              </div>
              <div className="mx-2 sm:mx-4 h-0.5 w-8 sm:w-16 bg-gray-300"></div>
              <div className="flex items-center">
                <div className={`flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full text-sm sm:text-base ${step === "products" ? "bg-blue-600 text-white" : "bg-gray-300 text-gray-700"}`}>
                  2
                </div>
                <span className="ml-1.5 sm:ml-2 text-xs sm:text-sm font-medium text-gray-900">Products</span>
              </div>
            </div>

            {/* Client Info Form */}
            {step === "client" && (
              <form onSubmit={handleClientSubmit} className="mx-auto max-w-2xl space-y-3 sm:space-y-4">
                <div>
                  <label className="mb-1 block text-xs sm:text-sm font-medium text-gray-900">
                    Client Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={clientInfo.name}
                    onChange={(e) => setClientInfo({ ...clientInfo, name: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 sm:px-4 py-2 text-sm sm:text-base text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Enter client name"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs sm:text-sm font-medium text-gray-900">
                    NID Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={clientInfo.nid}
                    onChange={(e) => setClientInfo({ ...clientInfo, nid: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 sm:px-4 py-2 text-sm sm:text-base text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Enter NID number"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs sm:text-sm font-medium text-gray-900">
                    Personal Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={clientInfo.phone}
                    onChange={(e) => setClientInfo({ ...clientInfo, phone: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 sm:px-4 py-2 text-sm sm:text-base text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Enter phone number"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs sm:text-sm font-medium text-gray-900">
                    Personal Email
                  </label>
                  <input
                    type="email"
                    value={clientInfo.email}
                    onChange={(e) => setClientInfo({ ...clientInfo, email: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 sm:px-4 py-2 text-sm sm:text-base text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Enter email (optional)"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs sm:text-sm font-medium text-gray-900">
                    Address <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={clientInfo.address}
                    onChange={(e) => setClientInfo({ ...clientInfo, address: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 sm:px-4 py-2 text-sm sm:text-base text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Enter client address"
                    rows={3}
                    required
                  />
                </div>

                <div className="flex justify-end pt-3 sm:pt-4">
                  <button
                    type="submit"
                    className="w-full sm:w-auto rounded-lg bg-blue-600 px-6 sm:px-8 py-2.5 sm:py-2 text-sm sm:text-base font-medium text-white transition-all hover:bg-blue-700 active:scale-95"
                  >
                    Next: Add Products
                  </button>
                </div>
              </form>
            )}

            {/* Products Section */}
            {step === "products" && (
              <>
                {/* Upload Button */}
                <div className="mb-4 sm:mb-6">
                  <label
                    htmlFor="images"
                    className="flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-10 sm:px-6 sm:py-12 transition-colors hover:border-blue-400 hover:bg-blue-50 active:scale-[0.99]"
                  >
                    <div className="text-center">
                      <svg
                        className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                        aria-hidden="true"
                      >
                        <path
                          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <p className="mt-2 text-sm sm:text-base text-gray-600">
                        <span className="font-semibold text-blue-600">
                          Tap to upload images
                        </span>
                      </p>
                      <p className="mt-1 text-xs sm:text-sm text-gray-500">
                        PNG, JPG, JPEG up to 10MB each
                      </p>
                    </div>
                  </label>
                  <input
                    id="images"
                    name="images"
                    type="file"
                    className="hidden"
                    accept="image/png,image/jpeg,image/jpg"
                    multiple
                    onChange={handleImageChange}
                  />
                </div>

                {/* Total Weight Input */}
                {items.length > 0 && (
                  <div className="mb-4 sm:mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block text-xs sm:text-sm font-medium text-gray-900">
                        Total Weight (kg) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={totalWeight}
                        onChange={(e) => setTotalWeight(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 sm:px-4 py-2 text-sm sm:text-base text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Enter total weight"
                        min="0"
                      />
                    </div>
                    
                    <div>
                      <label className="mb-1 block text-xs sm:text-sm font-medium text-gray-900">
                        Shipment Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={shippmentType}
                        onChange={(e) => setShippmentType(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 sm:px-4 py-2 text-sm sm:text-base text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="air">Air</option>
                        <option value="sea">Sea</option>
                        <option value="luggage">Luggage</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Items List */}
                {items.length > 0 && (
                  <div className="space-y-4 sm:space-y-6">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                      Products to Upload ({items.length})
                    </h3>

                    <div className="space-y-3 sm:space-y-4">
                      {items.map((item, index) => (
                        <WholesaleProductItem
                          key={item.id}
                          item={item}
                          index={index}
                          customCategories={customCategories}
                          onItemChange={handleItemChange}
                          onRemove={handleRemoveItem}
                          onAddCustomCategory={handleAddCustomCategory}
                          formatCategory={formatCategory}
                        />
                      ))}
                    </div>

                    {/* Upload All Button */}
                    <div className="flex flex-col sm:flex-row justify-between gap-2 sm:gap-3 border-t border-gray-200 pt-3 sm:pt-4">
                      <button
                        onClick={() => setStep("client")}
                        className="order-3 sm:order-1 rounded-lg border border-gray-300 px-4 sm:px-6 py-2 text-sm sm:text-base font-medium text-gray-700 transition-all hover:bg-gray-50 active:scale-95"
                        disabled={items.some((item) => item.uploading)}
                      >
                        ← Back to Client Info
                      </button>
                      
                      <div className="order-1 sm:order-2 flex flex-col sm:flex-row gap-2 sm:gap-3">
                        <button
                          onClick={handleCancel}
                          className="rounded-lg border border-red-300 bg-red-50 px-4 sm:px-6 py-2 text-sm sm:text-base font-medium text-red-700 transition-all hover:bg-red-100 active:scale-95"
                          disabled={items.some((item) => item.uploading)}
                        >
                          Cancel Order
                        </button>
                        <button
                          onClick={handleUploadAll}
                          className="rounded-lg bg-blue-600 px-4 sm:px-6 py-2 text-sm sm:text-base font-medium text-white transition-all hover:bg-blue-700 active:scale-95 disabled:cursor-not-allowed disabled:bg-gray-400"
                          disabled={items.some((item) => item.uploading)}
                        >
                          {items.some((item) => item.uploading)
                            ? "Uploading..."
                            : "Complete Order"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {items.length === 0 && (
                  <div className="py-8 sm:py-12 text-center text-sm sm:text-base text-gray-500">
                    No products added yet. Tap above to upload images.
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
