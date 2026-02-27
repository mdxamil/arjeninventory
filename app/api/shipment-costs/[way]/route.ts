import { NextRequest, NextResponse } from 'next/server';
import { cookies } from "next/headers";

const BACKEND_URL = process.env.BACKEND_URL || 'https://arjeninventoryproductsever.vercel.app';

// GET shipment cost by way
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ way: string }> }
) {
  try {
    const { way } = await params;

    const response = await fetch(`${BACKEND_URL}/api/shipment-costs/${way}`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Shipment cost not found' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching shipment cost:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT update shipment cost
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ way: string }> }
) {
  try {
    const body = await request.json();
    const { way } = await params;
    const token = (await cookies()).get("token");
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const response = await fetch(`${BACKEND_URL}/api/shipment-costs/${way}`, {
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
    console.error('Error updating shipment cost:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
