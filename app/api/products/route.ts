import { NextRequest, NextResponse } from "next/server";
import { authenticatedFetch, handleApiError } from "../middleware";

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4001';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = searchParams.get("page") || "1";
    const limit = searchParams.get("limit") || "10";
    const onlySelected = searchParams.get("onlySelected") || "false";

    const response = await authenticatedFetch(
      `/api/products?page=${page}&limit=${limit}&onlySelected=${onlySelected}`
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
      console.error("Backend error:", errorData);
      return NextResponse.json(
        { error: errorData.error || "Failed to fetch products" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error, "Error fetching products");
  }
}
