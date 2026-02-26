"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import Toast from "../../components/Toast";
import { handleApiResponse } from "../../utils/errorHandler";

const categories = ["Shoes", "Bags", "Electronics", "Gifts", "Wrapping", "Box"];

export default function AddPackagePage() {
  const { user, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    productCode: "",
    category: "",
    description: "",
    wrappingCode: "",
    boxCode: "",
    profit: "",
    sellerComission: "",
    deliveryCharge: "",
  });
  const [giftCodes, setGiftCodes] = useState<string[]>([""]);
  const [uploading, setUploading] = useState(false);
  
  // Validation states
  const [validationStatus, setValidationStatus] = useState<{
    productCode: "idle" | "checking" | "valid" | "invalid";
    wrappingCode: "idle" | "checking" | "valid" | "invalid";
    boxCode: "idle" | "checking" | "valid" | "invalid";
    giftCodes: ("idle" | "checking" | "valid" | "invalid")[];
  }>({
    productCode: "idle",
    wrappingCode: "idle",
    boxCode: "idle",
    giftCodes: ["idle"],
  });
  
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

  // Debounced validation function
  const validateProductCode = useCallback(async (code: string, field: "productCode" | "wrappingCode" | "boxCode", index?: number) => {
    if (!code || code.trim() === "") {
      // Check index first for gift codes
      if (index !== undefined) {
        setValidationStatus(prev => {
          const newGiftCodes = [...prev.giftCodes];
          newGiftCodes[index] = "idle";
          return { ...prev, giftCodes: newGiftCodes };
        });
      } else {
        setValidationStatus(prev => ({ ...prev, [field]: "idle" }));
      }
      return;
    }

    // Set checking status - check index first for gift codes
    if (index !== undefined) {
      setValidationStatus(prev => {
        const newGiftCodes = [...prev.giftCodes];
        newGiftCodes[index] = "checking";
        return { ...prev, giftCodes: newGiftCodes };
      });
    } else {
      setValidationStatus(prev => ({ ...prev, [field]: "checking" }));
    }

    try {
      const response = await fetch(`/api/products/check-code/${encodeURIComponent(code)}`);
      const data = await response.json();
      
      const status = data.exists ? "valid" : "invalid";
      
      // Check index first for gift codes
      if (index !== undefined) {
        setValidationStatus(prev => {
          const newGiftCodes = [...prev.giftCodes];
          newGiftCodes[index] = status;
          return { ...prev, giftCodes: newGiftCodes };
        });
      } else {
        setValidationStatus(prev => ({ ...prev, [field]: status }));
      }
    } catch (error) {
      console.error("Error validating product code:", error);
    }
  }, []);

  // Debounce timer refs
  const debounceTimers = useRef<{ [key: string]: NodeJS.Timeout }>({});

  const debouncedValidate = useCallback((code: string, field: "productCode" | "wrappingCode" | "boxCode", index?: number) => {
    const key = index !== undefined ? `giftCode-${index}` : field;
    
    if (debounceTimers.current[key]) {
      clearTimeout(debounceTimers.current[key]);
    }

    debounceTimers.current[key] = setTimeout(() => {
      validateProductCode(code, field, index);
    }, 500);
  }, [validateProductCode]);

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "owner")) {
      window.location.href = "/";
    }
  }, [user, isLoading]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Trigger validation for product code fields
    if (name === "productCode") {
      debouncedValidate(value, "productCode");
    } else if (name === "wrappingCode") {
      debouncedValidate(value, "wrappingCode");
    } else if (name === "boxCode") {
      debouncedValidate(value, "boxCode");
    }
  };

  const handleGiftCodeChange = (index: number, value: string) => {
    const newGiftCodes = [...giftCodes];
    newGiftCodes[index] = value;
    setGiftCodes(newGiftCodes);
    
    // Trigger validation for this gift code
    debouncedValidate(value, "productCode", index);
  };

  const addGiftCode = () => {
    setGiftCodes([...giftCodes, ""]);
    setValidationStatus(prev => ({
      ...prev,
      giftCodes: [...prev.giftCodes, "idle"]
    }));
  };

  const removeGiftCode = (index: number) => {
    if (giftCodes.length > 1) {
      const newGiftCodes = giftCodes.filter((_, i) => i !== index);
      setGiftCodes(newGiftCodes);
      setValidationStatus(prev => ({
        ...prev,
        giftCodes: prev.giftCodes.filter((_, i) => i !== index)
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.productCode ||
      !formData.category ||
      !formData.description ||
      !formData.wrappingCode ||
      !formData.boxCode ||
      !formData.profit ||
      !formData.sellerComission ||
      !formData.deliveryCharge
    ) {
      showToast("Please fill in all required fields", "warning");
      return;
    }

    // Check validation status
    if (
      validationStatus.productCode !== "valid" ||
      validationStatus.wrappingCode !== "valid" ||
      validationStatus.boxCode !== "valid"
    ) {
      showToast("Please ensure all product codes are valid before submitting", "error");
      return;
    }

    // Check gift codes validation
    const nonEmptyGiftCodes = giftCodes.filter((code) => code.trim() !== "");
    for (let i = 0; i < nonEmptyGiftCodes.length; i++) {
      const originalIndex = giftCodes.indexOf(nonEmptyGiftCodes[i]);
      if (validationStatus.giftCodes[originalIndex] !== "valid") {
        showToast("Please ensure all gift codes are valid before submitting", "error");
        return;
      }
    }

    setUploading(true);

    try {
      const packageData = {
        productCode: formData.productCode,
        category: formData.category,
        description: formData.description,
        giftsCode: giftCodes.filter((code) => code.trim() !== ""),
        wrappingCode: formData.wrappingCode,
        boxCode: formData.boxCode,
        profit: parseInt(formData.profit),
        sellerComission: parseInt(formData.sellerComission),
        deliveryCharge: parseInt(formData.deliveryCharge),
        userId: user?.id,
      };

      const response = await fetch("/api/packages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(packageData),
      });

      const { error } = await handleApiResponse(
        response,
        "Failed to create package"
      );

      if (error) {
        if (error.statusCode === 401) {
          showToast("Please log in to create packages", "error");
        } else if (error.statusCode === 403) {
          showToast("You don't have permission to create packages", "error");
        } else {
          showToast(error.message, error.type);
        }
        return;
      }

      showToast("Package created successfully!", "success");
      setFormData({
        productCode: "",
        category: "",
        description: "",
        wrappingCode: "",
        boxCode: "",
        profit: "",
        sellerComission: "",
        deliveryCharge: "",
      });
      setGiftCodes([""]);
      setValidationStatus({
        productCode: "idle",
        wrappingCode: "idle",
        boxCode: "idle",
        giftCodes: ["idle"],
      });
    } catch (err) {
      console.error("Package creation error:", err);
      showToast("An unexpected error occurred", "error");
    } finally {
      setUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  // Check if form is ready to submit
  const isFormValid = () => {
    // Check required fields
    if (
      !formData.productCode ||
      !formData.category ||
      !formData.description ||
      !formData.wrappingCode ||
      !formData.boxCode ||
      !formData.profit ||
      !formData.sellerComission ||
      !formData.deliveryCharge
    ) {
      return false;
    }

    // Check validation statuses
    if (
      validationStatus.productCode === "checking" ||
      validationStatus.productCode === "invalid" ||
      validationStatus.productCode === "idle" ||
      validationStatus.wrappingCode === "checking" ||
      validationStatus.wrappingCode === "invalid" ||
      validationStatus.wrappingCode === "idle" ||
      validationStatus.boxCode === "checking" ||
      validationStatus.boxCode === "invalid" ||
      validationStatus.boxCode === "idle"
    ) {
      return false;
    }

    // Check gift codes (only non-empty ones)
    for (let i = 0; i < giftCodes.length; i++) {
      if (giftCodes[i].trim() !== "") {
        if (
          validationStatus.giftCodes[i] === "checking" ||
          validationStatus.giftCodes[i] === "invalid" ||
          validationStatus.giftCodes[i] === "idle"
        ) {
          return false;
        }
      }
    }

    return true;
  };

  // Helper to render validation icon
  const renderValidationIcon = (status: "idle" | "checking" | "valid" | "invalid") => {
    if (status === "checking") {
      return (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
        </div>
      );
    }
    if (status === "valid") {
      return (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500">
            <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
      );
    }
    if (status === "invalid") {
      return (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500">
            <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-white pb-10 font-sans">
      <main className="mx-auto mt-8 max-w-2xl px-4">
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 p-5">
            <h2 className="text-center text-xl font-bold text-gray-800">
              Create New Package
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
                <p className="text-xs text-gray-500">Creating Package</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Category */}
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Category *
                </label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, category: cat })
                      }
                      className={`relative flex items-center justify-center rounded-lg border-2 px-4 py-3 text-sm font-semibold transition-all ${
                        formData.category === cat
                          ? "border-gray-800 bg-gray-800 text-white shadow-md"
                          : "border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50"
                      }`}
                    >
                      {formData.category === cat && (
                        <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-white">
                          <svg
                            className="h-3 w-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="3"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                      )}
                      {cat}
                    </button>
                  ))}
                </div>
                {!formData.category && (
                  <p className="mt-1.5 text-xs text-gray-400">
                    Please select a category
                  </p>
                )}
              </div>

              {/* Product Code */}
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Product Code *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="productCode"
                    value={formData.productCode}
                    onChange={handleChange}
                    placeholder="Enter product code"
                    required
                    className={`w-full rounded-lg border px-3 py-3 pr-10 text-sm text-gray-800 focus:outline-none focus:ring-1 ${
                      validationStatus.productCode === "invalid"
                        ? "border-red-300 bg-red-50 focus:ring-red-400"
                        : validationStatus.productCode === "valid"
                        ? "border-green-300 bg-green-50 focus:ring-green-400"
                        : "border-gray-300 bg-white focus:ring-gray-400"
                    }`}
                  />
                  {renderValidationIcon(validationStatus.productCode)}
                </div>
                {validationStatus.productCode === "invalid" && (
                  <p className="mt-1.5 text-xs text-red-600">
                    Product code does not exist
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Package description (min 10 characters)"
                  required
                  rows={4}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-gray-400"
                />
              </div>

              {/* Gift Codes */}
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Gift Codes (Optional)
                </label>
                {giftCodes.map((code, index) => (
                  <div key={index} className="mb-2">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={code}
                          onChange={(e) =>
                            handleGiftCodeChange(index, e.target.value)
                          }
                          placeholder={`Gift code ${index + 1}`}
                          className={`w-full rounded-lg border px-3 py-3 pr-10 text-sm text-gray-800 focus:outline-none focus:ring-1 ${
                            code.trim() !== "" && validationStatus.giftCodes[index] === "invalid"
                              ? "border-red-300 bg-red-50 focus:ring-red-400"
                              : code.trim() !== "" && validationStatus.giftCodes[index] === "valid"
                              ? "border-green-300 bg-green-50 focus:ring-green-400"
                              : "border-gray-300 bg-white focus:ring-gray-400"
                          }`}
                        />
                        {code.trim() !== "" && renderValidationIcon(validationStatus.giftCodes[index])}
                      </div>
                      {giftCodes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeGiftCode(index)}
                          className="rounded-lg border border-red-300 bg-red-50 px-4 text-sm font-semibold text-red-600 hover:bg-red-100"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    {code.trim() !== "" && validationStatus.giftCodes[index] === "invalid" && (
                      <p className="mt-1.5 text-xs text-red-600">
                        Gift code does not exist
                      </p>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addGiftCode}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  + Add Gift Code
                </button>
              </div>

              {/* Wrapping Code */}
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Wrapping Code *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="wrappingCode"
                    value={formData.wrappingCode}
                    onChange={handleChange}
                    placeholder="Enter wrapping code"
                    required
                    className={`w-full rounded-lg border px-3 py-3 pr-10 text-sm text-gray-800 focus:outline-none focus:ring-1 ${
                      validationStatus.wrappingCode === "invalid"
                        ? "border-red-300 bg-red-50 focus:ring-red-400"
                        : validationStatus.wrappingCode === "valid"
                        ? "border-green-300 bg-green-50 focus:ring-green-400"
                        : "border-gray-300 bg-white focus:ring-gray-400"
                    }`}
                  />
                  {renderValidationIcon(validationStatus.wrappingCode)}
                </div>
                {validationStatus.wrappingCode === "invalid" && (
                  <p className="mt-1.5 text-xs text-red-600">
                    Wrapping code does not exist
                  </p>
                )}
              </div>

              {/* Box Code */}
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Box Code *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="boxCode"
                    value={formData.boxCode}
                    onChange={handleChange}
                    placeholder="Enter box code"
                    required
                    className={`w-full rounded-lg border px-3 py-3 pr-10 text-sm text-gray-800 focus:outline-none focus:ring-1 ${
                      validationStatus.boxCode === "invalid"
                        ? "border-red-300 bg-red-50 focus:ring-red-400"
                        : validationStatus.boxCode === "valid"
                        ? "border-green-300 bg-green-50 focus:ring-green-400"
                        : "border-gray-300 bg-white focus:ring-gray-400"
                    }`}
                  />
                  {renderValidationIcon(validationStatus.boxCode)}
                </div>
                {validationStatus.boxCode === "invalid" && (
                  <p className="mt-1.5 text-xs text-red-600">
                    Box code does not exist
                  </p>
                )}
              </div>

              {/* Financial Fields Grid */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {/* Profit */}
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Profit *
                  </label>
                  <input
                    type="number"
                    name="profit"
                    value={formData.profit}
                    onChange={handleChange}
                    placeholder="0"
                    required
                    min="0"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-gray-400"
                  />
                </div>

                {/* Seller Commission */}
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Commission *
                  </label>
                  <input
                    type="number"
                    name="sellerComission"
                    value={formData.sellerComission}
                    onChange={handleChange}
                    placeholder="0"
                    required
                    min="0"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-gray-400"
                  />
                </div>

                {/* Delivery Charge */}
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Delivery *
                  </label>
                  <input
                    type="number"
                    name="deliveryCharge"
                    value={formData.deliveryCharge}
                    onChange={handleChange}
                    placeholder="0"
                    required
                    min="0"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-gray-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={uploading || !isFormValid()}
                className="w-full rounded-lg bg-gray-800 px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {uploading ? "Creating Package..." : "Create Package"}
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