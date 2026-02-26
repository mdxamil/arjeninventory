import { NextRequest, NextResponse } from "next/server";
import { getAuthToken } from "../middleware";

const WHOLESALE_BACKEND_URL = process.env.WHOLESALE_BACKEND_URL || 'http://localhost:4002';

// GET all wholesale orders
export async function GET() {
  const token = await getAuthToken();

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const response = await fetch(`${WHOLESALE_BACKEND_URL}/api/wholesale`, {
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
    console.error("Error fetching wholesale orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch wholesale orders" },
      { status: 500 }
    );
  }
}

// POST create new wholesale order
export async function POST(request: NextRequest) {
  const token = await getAuthToken();

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    const response = await fetch(`${WHOLESALE_BACKEND_URL}/api/wholesale`, {
      method: "POST",
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

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Error creating wholesale order:", error);
    return NextResponse.json(
      { error: "Failed to create wholesale order" },
      { status: 500 }
    );
  }
}
