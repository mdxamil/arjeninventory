"use client";

import { useState } from "react";
import type { Package } from "./types";

interface PackageCardProps {
    pkg: Package;
    userRole: string;
    onViewDetails: (pkg: Package) => void;
    onCopyImage: (e: React.MouseEvent, imageUrl: string) => void;
    onDelete: (pkg: Package) => void;
    getFinalPrice: (pkg: Package) => number;
}

export default function PackageCard({
    pkg,
    userRole,
    onViewDetails,
    onCopyImage,
    onDelete,
    getFinalPrice,
}: PackageCardProps) {
    const [codeCopied, setCodeCopied] = useState(false);

    const handleCopyCode = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(pkg.packageCode);
        setCodeCopied(true);
        setTimeout(() => setCodeCopied(false), 2000);
    };

    return (
        <div className="group relative flex flex-col rounded-xl border border-gray-200 bg-white transition-all duration-300 hover:border-gray-300 hover:shadow-lg hover:z-20">

            {/* Image Section */}
            <div
                className="relative aspect-[4/3] w-full cursor-pointer overflow-hidden rounded-t-xl bg-gray-100"
                onClick={() => onViewDetails(pkg)}
            >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={pkg.productimageUrl}
                    alt={pkg.description}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                />

                {/* Category Badge */}
                <div className="absolute left-3 top-3 rounded-lg bg-white/90 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-gray-900 backdrop-blur-sm">
                    {pkg.category}
                </div>

                {/* Delete Button (Owner Only) */}
                {userRole === "owner" && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(pkg);
                        }}
                        className="absolute right-3 top-3 rounded-lg bg-red-500/90 p-2 text-white backdrop-blur-sm transition-all hover:bg-red-600 active:scale-95 opacity-0 group-hover:opacity-100"
                        title="Delete package"
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Content Section */}
            <div className="flex flex-1 flex-col p-4">
                {/* Code Section */}
                <div className="mb-3 flex items-center gap-2">
                    <button
                        onClick={handleCopyCode}
                        className="group/code flex items-center gap-1.5 rounded bg-gray-50 px-2 py-1 font-mono text-xs text-gray-600 hover:bg-gray-100 hover:text-blue-600 active:scale-95 transition-all"
                        title="Click to copy code"
                    >
                        <span className="font-semibold text-gray-400 group-hover/code:text-blue-500">#</span>
                        <span className={codeCopied ? "text-green-600 font-bold" : ""}>
                            {codeCopied ? "Copied!" : pkg.packageCode}
                        </span>
                        {!codeCopied && (
                            <svg className="h-3 w-3 opacity-0 transition-opacity group-hover/code:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                            </svg>
                        )}
                    </button>
                </div>

                {/* Description */}
                <p className="mb-4 text-sm leading-relaxed text-gray-600 line-clamp-2 min-h-[2.5rem]">
                    {pkg.description}
                </p>

                {/* Pricing Section */}
                <div className="mt-auto">
                    <div className="mb-3 rounded-lg bg-gray-50 p-3">
                        <div className="flex items-baseline justify-between mb-2">
                            <span className="text-xs font-medium text-gray-500">Raw Cost</span>
                            <span className="text-sm font-bold text-gray-900">৳{pkg.packageRawCost}</span>
                        </div>

                        {userRole === "seller" && pkg.commission !== undefined && (
                            <div className="flex items-baseline justify-between mb-2">
                                <span className="text-xs font-medium text-gray-500">Your Commission</span>
                                <span className="text-sm font-semibold text-green-600">৳{pkg.commission}</span>
                            </div>
                        )}

                        {userRole === "owner" && pkg.profit !== undefined && (
                            <div className="flex items-baseline justify-between mb-2">
                                <span className="text-xs font-medium text-gray-500">Profit</span>
                                <span className="text-sm font-semibold text-green-600">৳{pkg.profit}</span>
                            </div>
                        )}

                        <div className="flex items-baseline justify-between pt-2 border-t border-gray-200">
                            <span className="text-xs font-semibold text-gray-700">Final Price</span>
                            <span className="text-xl font-bold text-gray-900">৳{getFinalPrice(pkg)}</span>
                        </div>
                    </div>

                    {/* Copy Image Button */}
                    <button
                        onClick={(e) => onCopyImage(e, pkg.productimageUrl)}
                        className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-all duration-200 hover:border-gray-300 hover:bg-gray-50 active:bg-gray-100 focus:ring-2 focus:ring-offset-2"
                    >
                        <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                        </svg>
                        Copy Image
                    </button>
                </div>
            </div>
        </div>
    );
}
