'use client';

import React, { useState, useEffect } from 'react';
import Toast from '../../components/Toast';
import { handleApiResponse } from '../../utils/errorHandler';

interface ShipmentCost {
    id: string;
    shippmentWay: 'air' | 'sea' | 'luggage';
    cost: number;
    updatedAt: string;
}

const Page = () => {
    const [shippmentWay, setShippmentWay] = useState<'air' | 'sea' | 'luggage'>('air');
    const [cost, setCost] = useState('');
    const [costs, setCosts] = useState<ShipmentCost[]>([]);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState<{
        message: string;
        type: "success" | "error" | "warning" | "info";
    } | null>(null);

    const showToast = (message: string, type: "success" | "error" | "warning" | "info") => {
        setToast({ message, type });
    };

    const fetchCosts = async () => {
        const response = await fetch('/api/shipment-costs');
        const result = await handleApiResponse<ShipmentCost[]>(response);

        if (result.data) {
            setCosts(result.data);
        } else if (result.error) {
            if (result.error.statusCode === 401) {
                showToast('Please log in to view shipment costs', 'error');
            } else if (result.error.statusCode === 403) {
                showToast('You do not have permission to view shipment costs', 'error');
            } else {
                showToast(result.error.message, 'error');
            }
        }
    };

    useEffect(() => {
        fetchCosts();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            let response = await fetch('/api/shipment-costs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    shippmentWay,
                    cost: parseInt(cost),
                }),
            });

            if (response.status === 409 || response.status === 200) {
                response = await fetch(`/api/shipment-costs/${shippmentWay}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        cost: parseInt(cost),
                    }),
                });
            }

            const result = await handleApiResponse<ShipmentCost>(response);

            if (result.data) {
                showToast('Shipment cost saved successfully!', 'success');
                setCost('');
                fetchCosts();
            } else if (result.error) {
                if (result.error.statusCode === 401) {
                    showToast('Please log in to save shipment costs', 'error');
                } else if (result.error.statusCode === 403) {
                    showToast('You do not have permission to save shipment costs', 'error');
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

    const getShipmentIcon = (way: string) => {
        switch (way) {
            case 'air':
                return '✈️';
            case 'sea':
                return '🚢';
            case 'luggage':
                return '🧳';
            default:
                return '📦';
        }
    };

    const getShipmentLabel = (way: string) => {
        switch (way) {
            case 'air':
                return 'Air Freight';
            case 'sea':
                return 'Sea Freight';
            case 'luggage':
                return 'Luggage/Hand Carry';
            default:
                return way;
        }
    };

    return (
        <div className="min-h-screen bg-white pb-10 font-sans">
            
            <main className="mx-auto max-w-5xl px-4">
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-800">
                        Shipment Cost Management
                    </h2>
                    <p className="mt-1 text-gray-500">
                        Manage shipping costs per kilogram for different shipment methods.
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* Form */}
                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <h3 className="mb-5 text-lg font-bold text-gray-800">
                            Update Costs
                        </h3>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Shipment Way */}
                            <div>
                                <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                                    Shipment Method
                                </label>

                                <select
                                    value={shippmentWay}
                                    onChange={(e) => setShippmentWay(e.target.value as 'air' | 'sea' | 'luggage')}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-gray-400"
                                >
                                    <option value="air">✈️ Air Freight</option>
                                    <option value="sea">🚢 Sea Freight</option>
                                    <option value="luggage">🧳 Luggage/Hand Carry</option>
                                </select>
                            </div>

                            {/* Cost */}
                            <div>
                                <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                                    Cost per KG (৳)
                                </label>

                                <input
                                    type="number"
                                    step="1"
                                    value={cost}
                                    onChange={(e) => setCost(e.target.value)}
                                    required
                                    placeholder="0"
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
                                />
                                <p className="mt-1 text-xs text-gray-500">
                                    Enter cost in Bangladeshi Taka (Integer value)
                                </p>
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full rounded-lg bg-gray-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-900 disabled:opacity-50"
                            >
                                {loading ? 'Saving Changes...' : 'Save Cost'}
                            </button>
                        </form>
                    </div>

                    {/* Display */}
                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <h3 className="mb-5 text-lg font-bold text-gray-800">
                            Current Shipment Costs
                        </h3>

                        {costs.length === 0 ? (
                            <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50">
                                <p className="text-sm text-gray-500">
                                    No costs defined yet.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {costs.map((c) => (
                                    <div
                                        key={c.id}
                                        className="flex items-center justify-between rounded-lg border border-gray-200 p-4 hover:bg-gray-50"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-800 text-2xl">
                                                {getShipmentIcon(c.shippmentWay)}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-800">
                                                    {getShipmentLabel(c.shippmentWay)}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {c.shippmentWay.charAt(0).toUpperCase() + c.shippmentWay.slice(1)} Method
                                                </p>
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <p className="text-lg font-bold text-gray-800">
                                                ৳{c.cost.toLocaleString()}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                per kg
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
