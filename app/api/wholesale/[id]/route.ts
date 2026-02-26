import { NextRequest, NextResponse } from "next/server";
import { getAuthToken } from "../../middleware";

const WHOLESALE_BACKEND_URL = process.env.WHOLESALE_BACKEND_URL || 'https://arjeninventorywholesalesever.vercel.app';

// GET single wholesale order
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getAuthToken();

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    const response = await fetch(`${WHOLESALE_BACKEND_URL}/api/wholesale/${id}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching wholesale order:", error);
    return NextResponse.json(
      { error: "Failed to fetch wholesale order" },
      { status: 500 }
    );
  }
}

// PUT update wholesale order
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getAuthToken();

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();

    const response = await fetch(`${WHOLESALE_BACKEND_URL}/api/wholesale/${id}`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error updating wholesale order:", error);
    return NextResponse.json(
      { error: "Failed to update wholesale order" },
      { status: 500 }
    );
  }
}

// DELETE wholesale order
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getAuthToken();

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    const response = await fetch(`${WHOLESALE_BACKEND_URL}/api/wholesale/${id}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error deleting wholesale order:", error);
    return NextResponse.json(
      { error: "Failed to delete wholesale order" },
      { status: 500 }
    );
  }
}
