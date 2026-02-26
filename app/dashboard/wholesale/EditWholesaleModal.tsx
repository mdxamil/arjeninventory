"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface WholesaleProduct {
  id: number;
  productNumber: number;
  imageUrl: string;
  fileId: string;
  category: string;
  quantity: number | string;
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

interface EditWholesaleModalProps {
  order: WholesaleOrder;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedOrder: UpdateOrderData) => Promise<void>;
}

interface ProductUpdate {
  productNumber: number;
  imageUrl: string;
  fileId: string;
  category: string;
  quantity: number;
  quantityType: string;
  rawPrice: number;
  profit: number;
  newImage?: File;
  originalFileId?: string;
}

export default function EditWholesaleModal({
  order,
  isOpen,
  onClose,
  onSave,
}: EditWholesaleModalProps) {
  const [clientName, setClientName] = useState(order.clientName);
  const [clientNid, setClientNid] = useState(order.clientNid);
  const [clientPhone, setClientPhone] = useState(order.clientPhone);
  const [clientEmail, setClientEmail] = useState(order.clientEmail || "");
  const [clientAddress, setClientAddress] = useState(order.clientAddress);
  const [products, setProducts] = useState<ProductUpdate[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedProducts, setExpandedProducts] = useState<Set<number>>(new Set([0]));
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  useEffect(() => {
    if (order) {
      setClientName(order.clientName);
      setClientNid(order.clientNid);
      setClientPhone(order.clientPhone);
      setClientEmail(order.clientEmail || "");
      setClientAddress(order.clientAddress);
      setProducts(
        order.products.map((p) => ({
          productNumber: p.productNumber,
          imageUrl: p.imageUrl,
          fileId: p.fileId,
          category: p.category,
          quantity: typeof p.quantity === 'number' ? p.quantity : parseFloat(String(p.quantity)),
          quantityType: p.quantityType,
          rawPrice: parseFloat(p.rawPrice),
          profit: parseFloat(p.profit),
          originalFileId: p.fileId,
        }))
      );
    }
  }, [order]);

  const handleImageChange = async (index: number, file: File) => {
    const updatedProducts = [...products];
    updatedProducts[index].newImage = file;
    setProducts(updatedProducts);
  };

  const toggleProduct = (index: number) => {
    const newExpanded = new Set(expandedProducts);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedProducts(newExpanded);
  };

  const compressImage = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = document.createElement('img');
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          // More aggressive compression for faster uploads
          const maxWidth = 600;
          const maxHeight = 600;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const reader = new FileReader();
                reader.onloadend = () => {
                  const base64 = (reader.result as string).split(',')[1];
                  resolve(base64);
                };
                reader.readAsDataURL(blob);
              } else {
                reject(new Error('Failed to compress image'));
              }
            },
            'image/jpeg',
            0.6 // More compression for faster upload
          );
        };
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const uploadToImageKit = async (file: File): Promise<{ url: string; fileId: string }> => {
    const compressed = await compressImage(file);
    const response = await fetch('/api/imagekit-upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        file: compressed,
        fileName: `wholesale-${Date.now()}-${file.name}`,
        folder: '/wholesale-products',
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to upload image');
    }

    const data = await response.json();
    return { url: data.url, fileId: data.fileId };
  };

  const deleteFromImageKit = async (fileId: string) => {
    try {
      await fetch('/api/imagekit-upload', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId }),
      });
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // Process products - upload new images and delete old ones if needed
      const updatedProducts = await Promise.all(
        products.map(async (product, index) => {
          if (product.newImage && product.originalFileId) {
            // Show upload progress
            setUploadingIndex(index);
            
            // Delete old image and upload new one in parallel
            const [uploadResult] = await Promise.all([
              uploadToImageKit(product.newImage),
              deleteFromImageKit(product.originalFileId)
            ]);
            
            setUploadingIndex(null);
            
            return {
              productNumber: product.productNumber,
              imageUrl: uploadResult.url,
              fileId: uploadResult.fileId,
              category: product.category,
              quantity: product.quantity,
              quantityType: product.quantityType,
              rawPrice: product.rawPrice,
              profit: product.profit,
            };
          }
          // No image change
          return {
            productNumber: product.productNumber,
            imageUrl: product.imageUrl,
            fileId: product.fileId,
            category: product.category,
            quantity: product.quantity,
            quantityType: product.quantityType,
            rawPrice: product.rawPrice,
            profit: product.profit,
          };
        })
      );

      const totalWeight = updatedProducts.reduce(
        (sum, p) => sum + p.quantity,
        0
      );

      const updateData = {
        clientInfo: {
          name: clientName,
          nid: clientNid,
          phone: clientPhone,
          email: clientEmail || undefined,
          address: clientAddress,
        },
        products: updatedProducts,
        totalWeight,
      };

      await onSave(updateData);
      onClose();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to update order");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black bg-opacity-60 p-0 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-none sm:rounded-xl shadow-2xl w-full sm:max-w-4xl sm:w-full min-h-screen sm:min-h-0 sm:max-h-[95vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-3 sm:px-6 py-2.5 sm:py-4 flex items-center justify-between shadow-sm z-10">
          <h2 className="text-lg sm:text-2xl font-bold text-gray-900">Edit Order</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 transition-colors p-1"
            disabled={isSaving}
            type="button"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-3 sm:p-6 space-y-3 sm:space-y-5">
          {/* Client Information */}
          <div className="border border-gray-200 rounded-lg p-3 sm:p-5 bg-gray-50">
            <h3 className="text-sm sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-4">Client Info</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  required
                  disabled={isSaving}
                  className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:opacity-50"
                  placeholder="Client name"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">NID *</label>
                <input
                  type="text"
                  value={clientNid}
                  onChange={(e) => setClientNid(e.target.value)}
                  required
                  disabled={isSaving}
                  className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:opacity-50"
                  placeholder="NID number"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Phone *</label>
                <input
                  type="tel"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  required
                  disabled={isSaving}
                  className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:opacity-50"
                  placeholder="Phone number"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  disabled={isSaving}
                  className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:opacity-50"
                  placeholder="Email (optional)"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Address *</label>
                <textarea
                  value={clientAddress}
                  onChange={(e) => setClientAddress(e.target.value)}
                  required
                  disabled={isSaving}
                  rows={2}
                  className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none disabled:opacity-50"
                  placeholder="Complete address"
                />
              </div>
            </div>
          </div>

          {/* Products */}
          <div className="border border-gray-200 rounded-lg p-3 sm:p-5 bg-gray-50">
            <h3 className="text-sm sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-4">Products ({products.length})</h3>
            <div className="space-y-2.5 sm:space-y-4">
              {products.map((product, index) => {
                const isExpanded = expandedProducts.has(index);
                const isUploading = uploadingIndex === index;
                
                return (
                  <div key={index} className="border border-gray-300 rounded-lg bg-white shadow-sm overflow-hidden">
                    {/* Product Header - Always Visible */}
                    <div 
                      className="flex items-center justify-between p-2.5 sm:p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => toggleProduct(index)}
                    >
                      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                        <div className="relative shrink-0">
                          <div className="w-12 h-12 sm:w-14 sm:h-14 border-2 border-gray-300 rounded-lg overflow-hidden bg-gray-100">
                            <Image
                              src={product.newImage ? URL.createObjectURL(product.newImage) : product.imageUrl}
                              alt={`Product ${product.productNumber}`}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                          {isUploading && (
                            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                            <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800">
                              #{product.productNumber}
                            </span>
                            <span className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                              {product.category || 'No category'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-600">
                            <span>{product.quantity} {product.quantityType}</span>
                            <span>•</span>
                            <span>৳{(product.rawPrice + product.profit).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {product.newImage && !isUploading && (
                          <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                        <svg 
                          className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>

                    {/* Product Details - Collapsible */}
                    {isExpanded && (
                      <div className="border-t border-gray-200 p-2.5 sm:p-3 space-y-2.5 sm:space-y-3">
                        {/* Image Upload */}
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Product Image</label>
                          <label className="block cursor-pointer">
                            <span className="sr-only">Choose image</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                if (e.target.files?.[0]) {
                                  handleImageChange(index, e.target.files[0]);
                                }
                              }}
                              disabled={isSaving}
                              className="block w-full text-xs text-gray-700 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 file:cursor-pointer cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                          </label>
                          {product.newImage && (
                            <p className="text-xs text-green-600 font-medium mt-1 flex items-center gap-1">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              Will replace on save
                            </p>
                          )}
                        </div>

                        {/* Product Details Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                          <div className="sm:col-span-2">
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Category *</label>
                            <input
                              type="text"
                              value={product.category}
                              onChange={(e) => {
                                const updated = [...products];
                                updated[index].category = e.target.value;
                                setProducts(updated);
                              }}
                              required
                              disabled={isSaving}
                              className="w-full px-2.5 py-1.5 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:opacity-50"
                              placeholder="e.g., Gold Jewelry"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Quantity *</label>
                            <div className="flex gap-1.5">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={product.quantity}
                                onChange={(e) => {
                                  const updated = [...products];
                                  updated[index].quantity = parseFloat(e.target.value) || 0;
                                  setProducts(updated);
                                }}
                                required
                                disabled={isSaving}
                                className="flex-1 px-2.5 py-1.5 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:opacity-50"
                                placeholder="0.00"
                              />
                              <select
                                value={product.quantityType}
                                onChange={(e) => {
                                  const updated = [...products];
                                  updated[index].quantityType = e.target.value;
                                  setProducts(updated);
                                }}
                                disabled={isSaving}
                                className="px-2 py-1.5 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:opacity-50"
                              >
                                <option value="kg">kg</option>
                                <option value="pcs">pcs</option>
                              </select>
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Raw Price (৳) *</label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={product.rawPrice}
                              onChange={(e) => {
                                const updated = [...products];
                                updated[index].rawPrice = parseFloat(e.target.value) || 0;
                                setProducts(updated);
                              }}
                              required
                              disabled={isSaving}
                              className="w-full px-2.5 py-1.5 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:opacity-50"
                              placeholder="0.00"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Profit (৳) *</label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={product.profit}
                              onChange={(e) => {
                                const updated = [...products];
                                updated[index].profit = parseFloat(e.target.value) || 0;
                                setProducts(updated);
                              }}
                              required
                              disabled={isSaving}
                              className="w-full px-2.5 py-1.5 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:opacity-50"
                              placeholder="0.00"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Final Price (৳)</label>
                            <div className="px-2.5 py-1.5 text-sm font-semibold text-gray-900 bg-gray-100 border border-gray-300 rounded-lg">
                              {(product.rawPrice + product.profit).toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-gray-200 sticky bottom-0 bg-white pb-1 sm:pb-2 -mx-3 sm:-mx-6 px-3 sm:px-6 shadow-[0_-2px_8px_rgba(0,0,0,0.05)]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="w-full sm:w-auto px-4 sm:px-5 py-2 sm:py-2.5 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="w-full sm:w-auto px-5 sm:px-6 py-2 sm:py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-md hover:shadow-lg flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="hidden sm:inline">Saving Changes...</span>
                  <span className="sm:hidden">Saving...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
