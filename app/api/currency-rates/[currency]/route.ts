import { NextRequest, NextResponse } from 'next/server';
import { cookies } from "next/headers";

const BACKEND_URL = process.env.BACKEND_URL || 'https://arjeninventoryproductsever.vercel.app';

// GET currency rate by currency code
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ currency: string }> }
) {
  try {
    const { currency } = await params;

    const response = await fetch(`${BACKEND_URL}/api/currency-rates/${currency}`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Currency rate not found' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching currency rate:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT update currency rate
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ currency: string }> }
) {
  try {
    const body = await request.json();
    const { currency } = await params;
    const token = (await cookies()).get("token");
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const response = await fetch(`${BACKEND_URL}/api/currency-rates/${currency}`, {
      method: 'PUT',
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

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating currency rate:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}