import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'https://arjeninventoryproductsever.vercel.app';

// GET all currency rates
export async function GET() {
    try {
        const response = await fetch(`${BACKEND_URL}/api/currency-rates`, {
            cache: 'no-store',
        });

        if (!response.ok) {
            return NextResponse.json(
                { error: 'Failed to fetch currency rates' },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching currency rates:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST create new currency rate
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const token = (await cookies()).get("token");

        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const response = await fetch(`${BACKEND_URL}/api/currency-rates`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token.value}`,
            },
            body: JSON.stringify(body),
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(data, { status: response.status });
        }

        return NextResponse.json(data, { status: 201 });
    } catch (error) {
        console.error('Error creating currency rate:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}