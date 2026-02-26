'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Toast from '../../components/Toast';
import { handleApiResponse } from '../../utils/errorHandler';

interface CurrencyRate {
    id: string;
    currency: string;
    rate: string | number;
}

const Page = () => {
    const [currency, setCurrency] = useState('DOLLAR');
    const [rate, setRate] = useState('');
    const [rates, setRates] = useState<CurrencyRate[]>([]);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState<{
        message: string;
        type: "success" | "error" | "warning" | "info";
    } | null>(null);

    const showToast = (message: string, type: "success" | "error" | "warning" | "info") => {
        setToast({ message, type });
    };

    const fetchRates = async () => {
        const response = await fetch('/api/currency-rates');
        const result = await handleApiResponse<CurrencyRate[]>(response);

        if (result.data) {
            setRates(result.data);
        } else if (result.error) {
            if (result.error.statusCode === 401) {
                showToast('Please log in to view currency rates', 'error');
            } else if (result.error.statusCode === 403) {
                showToast('You do not have permission to view currency rates', 'error');
            } else {
                showToast(result.error.message, 'error');
            }
        }
    };

    useEffect(() => {
        fetchRates();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            let response = await fetch('/api/currency-rates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    currency,
                    rate: parseFloat(rate),
                }),
            });

            if (response.status === 409) {
                response = await fetch(`/api/currency-rates/${currency}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        currency,
                        rate: parseFloat(rate),
                    }),
                });
            }

            const result = await handleApiResponse<CurrencyRate>(response);

            if (result.data) {
                showToast('Currency rate saved successfully!', 'success');
                setRate('');
                fetchRates();
            } else if (result.error) {
                if (result.error.statusCode === 401) {
                    showToast('Please log in to save currency rates', 'error');
                } else if (result.error.statusCode === 403) {
                    showToast('You do not have permission to save currency rates', 'error');
                } else {
                    showToast(result.error.message, 'error');
                }
            }
        } catch (error) {
            showToast('Failed to connect to server', 'error');
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white pb-10 font-sans">
            
            <main className="mx-auto max-w-5xl px-4">
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-800">
                        Currency Management
                    </h2>
                    <p className="mt-1 text-gray-500">
                        Manage exchange rates for the platform.
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* Form */}
                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <h3 className="mb-5 text-lg font-bold text-gray-800">
                            Update Rates
                        </h3>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Currency */}
                            <div>
                                <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                                    Select Currency
                                </label>

                                <select
                                    value={currency}
                                    onChange={(e) => setCurrency(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-gray-400"
                                >
                                    <option value="DOLLAR">US Dollar (USD)</option>
                                    <option value="RMB">Chinese Yuan (RMB)</option>
                                </select>
                            </div>

                            {/* Rate */}
                            <div>
                                <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                                    Exchange Rate
                                </label>

                                <input
                                    type="number"
                                    step="0.0001"
                                    value={rate}
                                    onChange={(e) => setRate(e.target.value)}
                                    required
                                    placeholder="0.00"
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
                                />
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full rounded-lg bg-gray-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-900 disabled:opacity-50"
                            >
                                {loading ? 'Saving Changes...' : 'Save Rate'}
                            </button>
                        </form>
                    </div>

                    {/* Display */}
                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <h3 className="mb-5 text-lg font-bold text-gray-800">
                            Current Market Rates
                        </h3>

                        {rates.length === 0 ? (
                            <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50">
                                <p className="text-sm text-gray-500">
                                    No rates defined yet.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {rates.map((r) => (
                                    <div
                                        key={r.id}
                                        className="flex items-center justify-between rounded-lg border border-gray-200 p-4 hover:bg-gray-50"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-800 text-white">
                                                {r.currency === 'DOLLAR' ? '$' : '¥'}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-800">
                                                    {r.currency}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    Updated automatically
                                                </p>
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <p className="text-lg font-bold text-gray-800">
                                                {Number(r.rate).toFixed(4)}
                                            </p>
                                            <p className="text-xs font-medium text-green-600">
                                                Active
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
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
};

export default Page;