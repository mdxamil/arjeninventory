import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || 'https://arjeninventoryproductsever.vercel.app';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ category: string }> }
) {
  try {
    const { searchParams } = new URL(req.url);

    const page = searchParams.get("page") || "1";
    const limit = searchParams.get("limit") || "10";
    const onlySelected = searchParams.get("onlySelected") || "false";
    const { category } = await params;
    const token = (await cookies()).get("token");

    const response = await fetch(
      `${BACKEND_URL}/api/products/category/${encodeURIComponent(category)}?page=${page}&limit=${limit}&onlySelected=${onlySelected}`,
      {
        headers: {
          Authorization: `Bearer ${token?.value}`,
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch products" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching products by category:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
