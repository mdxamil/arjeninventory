"use client";

import Image from "next/image";

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

interface WholesaleProductItemProps {
  item: WholesaleItem;
  index: number;
  customCategories: string[];
  onItemChange: (
    id: string,
    field: "category" | "quantity" | "quantityType" | "rawPrice" | "profit",
    value: string
  ) => void;
  onRemove: (id: string) => void;
  onAddCustomCategory: (category: string) => void;
  formatCategory: (category: string) => string;
}

export default function WholesaleProductItem({
  item,
  index,
  customCategories,
  onItemChange,
  onRemove,
  onAddCustomCategory,
  formatCategory,
}: WholesaleProductItemProps) {
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === "__custom__") {
      const custom = prompt("Enter custom category:");
      if (custom) {
        onAddCustomCategory(custom);
        onItemChange(item.id, "category", custom);
      }
    } else {
      onItemChange(item.id, "category", value);
    }
  };

  const finalPrice =
    item.rawPrice && item.profit
      ? (parseFloat(item.rawPrice) + parseFloat(item.profit)).toFixed(2)
      : "0.00";

  return (
    <div className="relative rounded-lg border border-gray-200 bg-gray-50 p-3 sm:p-4">
      {/* Remove Button */}
      <button
        onClick={() => onRemove(item.id)}
        className="absolute right-2 top-2 z-10 rounded-full bg-red-500 p-1.5 text-white transition-all hover:bg-red-600 active:scale-95 sm:p-1"
        disabled={item.uploading}
        aria-label="Remove product"
      >
        <svg
          className="h-3.5 w-3.5 sm:h-4 sm:w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        {/* Image Preview */}
        <div className="shrink-0 mx-auto sm:mx-0">
          <div className="relative h-28 w-28 sm:h-32 sm:w-32 overflow-hidden rounded-lg border border-gray-300">
            <Image
              src={item.preview}
              alt={`Preview ${index + 1}`}
              className="h-full w-full object-cover"
              width={128}
              height={128}
              unoptimized
            />
            {item.uploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                <div className="h-7 w-7 sm:h-8 sm:w-8 animate-spin rounded-full border-4 border-white border-t-transparent"></div>
              </div>
            )}
            {item.uploadedUrl && (
              <div className="absolute inset-0 flex items-center justify-center bg-green-500 bg-opacity-75">
                <svg
                  className="h-7 w-7 sm:h-8 sm:w-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            )}
          </div>
          <p className="mt-1 text-xs text-gray-500 text-center sm:text-left truncate w-28 sm:w-32">
            {item.file.name}
          </p>
        </div>

        {/* Form Fields */}
        <div className="flex flex-1 flex-col gap-3">
          {/* Category, Quantity, Type - Mobile: Stack, Tablet+: Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
            <div>
              <label className="mb-1 block text-xs sm:text-sm font-medium text-gray-900">
                Category
              </label>
              <select
                value={item.category}
                onChange={handleCategoryChange}
                className="w-full rounded-lg border border-gray-300 px-2 sm:px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                disabled={item.uploading}
              >
                <option value="">Select</option>
                <option value="bags">Bags</option>
                <option value="electrical">Electrical</option>
                <option value="shoes">Shoes</option>
                {customCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {formatCategory(cat)}
                  </option>
                ))}
                <option value="__custom__">+ Custom</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs sm:text-sm font-medium text-gray-900">
                Quantity
              </label>
              <input
                type="number"
                value={item.quantity}
                onChange={(e) => onItemChange(item.id, "quantity", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-2 sm:px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="100"
                min="0.01"
                step="0.01"
                disabled={item.uploading}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs sm:text-sm font-medium text-gray-900">
                Type
              </label>
              <select
                value={item.quantityType}
                onChange={(e) => onItemChange(item.id, "quantityType", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-2 sm:px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                disabled={item.uploading}
              >
                <option value="piece">Piece</option>
                <option value="kg">KG</option>
              </select>
            </div>
          </div>

          {/* Raw Price, Profit, Final Price */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
            <div>
              <label className="mb-1 block text-xs sm:text-sm font-medium text-gray-900">
                Raw Price (৳)
              </label>
              <input
                type="number"
                step="0.01"
                value={item.rawPrice}
                onChange={(e) => onItemChange(item.id, "rawPrice", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-2 sm:px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="1000"
                min="0"
                disabled={item.uploading}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs sm:text-sm font-medium text-gray-900">
                Profit (৳)
              </label>
              <input
                type="number"
                step="0.01"
                value={item.profit}
                onChange={(e) => onItemChange(item.id, "profit", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-2 sm:px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="100"
                min="0"
                disabled={item.uploading}
              />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="mb-1 block text-xs sm:text-sm font-medium text-gray-900">
                Final Price
              </label>
              <div className="rounded-lg border border-gray-300 bg-gray-100 px-2 sm:px-3 py-2 text-sm text-gray-900 font-medium">
                ৳{finalPrice}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
