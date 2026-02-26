"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import CopySidebar from "./CopySodebar";

interface LayoutContentProps {
  children: React.ReactNode;
}

export default function LayoutContent({ children }: LayoutContentProps) {
  const [isCopySidebarOpen, setIsCopySidebarOpen] = useState(false);

  const toggleCopySidebar = () => {
    setIsCopySidebarOpen(!isCopySidebarOpen);
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar - Hidden on mobile, visible on lg+ */}
      <div className="hidden lg:block lg:w-64">
        <Sidebar onCopyToggle={toggleCopySidebar} isCopySidebarOpen={isCopySidebarOpen} />
      </div>
      
      {/* Mobile Sidebar - Overlay, shown via Sidebar component */}
      <div className="lg:hidden">
        <Sidebar onCopyToggle={toggleCopySidebar} isCopySidebarOpen={isCopySidebarOpen} />
      </div>
      
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-4 pb-24 lg:p-6 lg:pb-6">
          {children}
        </div>
      </div>

      {/* Copy Sidebar - Available globally */}
      <CopySidebar isOpen={isCopySidebarOpen} onToggle={toggleCopySidebar} />
    </div>
  );
}
