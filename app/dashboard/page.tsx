"use client";

import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  if (isLoading) {
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

  const navigationCards = [
    {
      title: "Products",
      description: "Manage your product catalog and inventory",
      href: "/dashboard/products",
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      color: "bg-blue-500",
    },
    {
      title: "Packages",
      description: "View and manage your packages",
      href: "/dashboard/packages",
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
        </svg>
      ),
      color: "bg-green-500",
    },
    {
      title: "Wholesale Orders",
      description: "Track and manage wholesale orders",
      href: "/dashboard/wholesale",
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
      color: "bg-purple-500",
    },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 pb-20 font-sans antialiased">
      <main className="px-4 py-6 sm:px-6 sm:py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
            Dashboard
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            Welcome back, {user.email}
          </p>
        </div>

        {/* Navigation Cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {navigationCards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="group relative overflow-hidden rounded-xl border border-neutral-200 bg-white p-6 shadow-sm transition hover:shadow-md hover:border-neutral-300"
            >
              <div className="flex flex-col gap-4">
                <div className={`flex h-14 w-14 items-center justify-center rounded-lg ${card.color} text-white transition group-hover:scale-110`}>
                  {card.icon}
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-neutral-900 group-hover:text-neutral-700 transition">
                    {card.title}
                  </h2>
                  <p className="mt-1 text-sm text-neutral-500">
                    {card.description}
                  </p>
                </div>
                <div className="mt-2 flex items-center text-sm font-medium text-neutral-600 group-hover:text-neutral-900 transition">
                  Go to {card.title.toLowerCase()}
                  <svg className="ml-1 h-4 w-4 transition group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}