"use client";

import { useRouter, usePathname } from "next/navigation";
import { useCopy } from "../context/CopyContext";

interface BottomNavProps {
  isMobileMenuOpen: boolean;
  isCopySidebarOpen: boolean;
  onMenuToggle: () => void;
  onCopyToggle: () => void;
}

export default function BottomNav({ isMobileMenuOpen, isCopySidebarOpen, onMenuToggle, onCopyToggle }: BottomNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { copiedProducts } = useCopy();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white/95 backdrop-blur-lg lg:hidden">
      <div className="flex items-center justify-around px-4 py-2 pb-safe">
        {/* Menu Button */}
        <button
          onClick={onMenuToggle}
          className="flex flex-col items-center justify-center gap-1 px-4 py-2 transition-colors active:scale-95"
          aria-label="Toggle menu"
        >
          <div className={`flex h-11 w-11 items-center justify-center rounded-xl transition-colors ${
            isMobileMenuOpen ? 'bg-neutral-900 text-white' : 'bg-gray-100 text-gray-600'
          }`}>
            {isMobileMenuOpen ? (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </div>
          <span className="text-[10px] font-medium text-gray-600">Menu</span>
        </button>

        {/* Home Button */}
        <button
          onClick={() => router.push('/dashboard')}
          className="flex flex-col items-center justify-center gap-1 px-4 py-2 transition-colors active:scale-95"
          aria-label="Go to dashboard"
        >
          <div className={`flex h-11 w-11 items-center justify-center rounded-xl transition-colors ${
            pathname === '/dashboard' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
          }`}>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <span className="text-[10px] font-medium text-gray-600">Home</span>
        </button>

        {/* Copied Button */}
        <button
          onClick={onCopyToggle}
          className="flex flex-col items-center justify-center gap-1 px-4 py-2 transition-colors active:scale-95"
          aria-label="Toggle copied products"
        >
          <div className={`relative flex h-11 w-11 items-center justify-center rounded-xl transition-colors ${
            isCopySidebarOpen ? 'bg-neutral-900 text-white' : 'bg-gray-100 text-gray-600'
          }`}>
            {isCopySidebarOpen ? (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <>
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                {copiedProducts.length > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white ring-2 ring-white">
                    {copiedProducts.length > 9 ? "9+" : copiedProducts.length}
                  </span>
                )}
              </>
            )}
          </div>
          <span className="text-[10px] font-medium text-gray-600">Copied</span>
        </button>
      </div>
    </div>
  );
}
