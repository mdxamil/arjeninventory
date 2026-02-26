"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
} from "react";

interface CopiedProduct {
  id: string;
  category: string;
  code: string;
  timestamp: number;
}

interface CopyContextType {
  copiedProducts: CopiedProduct[];
  addCopiedProduct: (product: { id: string; category: string; code: string }) => void;
  removeCopiedProduct: (id: string) => void;
  clearAllCopied: () => void;
}

const CopyContext = createContext<CopyContextType | undefined>(undefined);

export function CopyProvider({ children }: { children: ReactNode }) {
  const [copiedProducts, setCopiedProducts] = useState<CopiedProduct[]>([]);

  const addCopiedProduct = (product: { id: string; category: string; code: string }) => {
    setCopiedProducts((prev) => {
      // Check if product already exists
      const exists = prev.find((p) => p.id === product.id);
      if (exists) {
        // Update timestamp and move to top
        return [
          { ...product, timestamp: Date.now() },
          ...prev.filter((p) => p.id !== product.id),
        ];
      }
      // Add new product to top
      return [{ ...product, timestamp: Date.now() }, ...prev];
    });
  };

  const removeCopiedProduct = (id: string) => {
    setCopiedProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const clearAllCopied = () => {
    setCopiedProducts([]);
  };

  return (
    <CopyContext.Provider
      value={{
        copiedProducts,
        addCopiedProduct,
        removeCopiedProduct,
        clearAllCopied,
      }}
    >
      {children}
    </CopyContext.Provider>
  );
}

export function useCopy() {
  const context = useContext(CopyContext);
  if (context === undefined) {
    throw new Error("useCopy must be used within a CopyProvider");
  }
  return context;
}
