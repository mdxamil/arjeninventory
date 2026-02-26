"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import Toast from "../../components/Toast";
import { handleApiResponse } from "../../utils/errorHandler";

const categories = ["Shoes", "Bags", "Electronics", "Gifts", "Wrapping" , "Box" ];

export default function UploadPage() {
  const { user, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    category: "",
    description: "",
    price: "",
    weight: "",
    currency: "RMB",
    shippmentWay: "air",
  });
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
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

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "owner")) {
      window.location.href = "/";
    }
  }, [user, isLoading]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!image) {
      showToast("Please select an image", "warning");
      return;
    }

    if (
      !formData.description ||
      !formData.price ||
      !formData.weight ||
      !formData.currency ||
      !formData.shippmentWay
    ) {
      showToast("Please fill in all fields", "warning");
      return;
    }

    setUploading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("category", formData.category);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("price", formData.price);
      formDataToSend.append("weight", formData.weight);
      formDataToSend.append("currency", formData.currency);
      formDataToSend.append("shippmentWay", formData.shippmentWay);
      formDataToSend.append("image", image);

      const response = await fetch("/api/products/upload", {
        method: "POST",
        body: formDataToSend,
      });

      const { error } = await handleApiResponse(
        response,
        "Failed to upload product"
      );

      if (error) {
        if (error.statusCode === 401) {
          showToast("Please log in to upload products", "error");
        } else if (error.statusCode === 403) {
          showToast("You don't have permission to upload products", "error");
        } else {
          showToast(error.message, error.type);
        }
        return;
      }

      showToast("Product uploaded successfully!", "success");
      setFormData({
        category: "",
        description: "",
        price: "",
        weight: "",
        currency: "DOLLAR",
        shippmentWay: "air",
      });
      setImage(null);
      setImagePreview(null);
      const fileInput = document.getElementById("image") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    } catch (err) {
      console.error("Upload error:", err);
      showToast("An unexpected error occurred during upload", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
    <div className="min-h-screen bg-white pb-10 font-sans">

      <main className="mx-auto mt-8 max-w-2xl px-4">
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 p-5">
            <h2 className="text-center text-xl font-bold text-gray-800">
              Create New Listing
            </h2>
          </div>

          <div className="p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200">
                <span className="font-semibold text-gray-600">
                  {user.fullname.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  {user.fullname}
                </p>
                <p className="text-xs text-gray-500">
                  Listing to Marketplace
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Image */}
              <div className="rounded-lg border border-gray-200 p-2">
                <div className="relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 py-10">
                  {imagePreview ? (
                    <div className="relative w-full overflow-hidden rounded-lg">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="max-h-[300px] w-full object-contain"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImage(null);
                          setImagePreview(null);
                        }}
                        className="absolute right-2 top-2 rounded-full bg-white px-2 py-1 text-gray-600 shadow hover:bg-gray-100"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="text-center text-gray-600">
                      <p className="font-semibold">Add Photo</p>
                      <p className="text-xs">Click to upload</p>
                    </div>
                  )}
                  <input
                    type="file"
                    id="image"
                    accept="image/*"
                    onChange={handleImageChange}
                    required={!image}
                    className="absolute inset-0 cursor-pointer opacity-0"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Category
                </label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setFormData({ ...formData, category: cat })}
                      className={`relative flex items-center justify-center rounded-lg border-2 px-4 py-3 text-sm font-semibold transition-all ${
                        formData.category === cat
                          ? "border-gray-800 bg-gray-800 text-white shadow-md"
                          : "border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50"
                      }`}
                    >
                      {formData.category === cat && (
                        <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-white">
                          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                      {cat}
                    </button>
                  ))}
                </div>
                {!formData.category && (
                  <p className="mt-1.5 text-xs text-gray-400">Please select a category</p>
                )}
              </div>

              {/* Description */}
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Product description"
                required
                rows={4}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-gray-400"
              />

              {/* Price */}
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                placeholder="Price"
                required
                step="0.01"
                min="0"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-gray-400"
              />

              {/* Weight */}
              <input
                type="number"
                name="weight"
                value={formData.weight}
                onChange={handleChange}
                placeholder="Weight (kg)"
                required
                step="0.01"
                min="0"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-gray-400"
              />

              {/* Currency */}
              <select
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-gray-400"
              >
                <option value="DOLLAR">USD ($)</option>
                <option value="RMB">RMB (¥)</option>
              </select>

              {/* Shipment Way */}
              <select
                name="shippmentWay"
                value={formData.shippmentWay}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-gray-400"
              >
                <option value="air">✈️ Air Shipment</option>
                <option value="sea">🚢 Sea Shipment</option>
                <option value="luggage">🧳 Luggage</option>
              </select>

              <button
                type="submit"
                disabled={uploading}
                className="w-full rounded-lg bg-gray-800 px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-900 disabled:opacity-50"
              >
                {uploading ? "Publishing..." : "Publish Listing"}
              </button>
            </form>
          </div>
        </div>
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
