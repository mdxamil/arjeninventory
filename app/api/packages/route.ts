import { NextRequest, NextResponse } from "next/server";
import { authenticatedFetch, handleApiError } from "../middleware";

const BACKEND_URL = process.env.BACKEND_URL || 'https://arjeninventoryproductsever.vercel.app';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("Frontend: Sending package data:", body);
    
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const response = await authenticatedFetch('/api/packages', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log("Backend response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        console.error("Backend error response:", errorData);
        return NextResponse.json(
          { error: errorData.error || "Failed to create package", details: errorData.details },
          { status: response.status }
        );
      }

      const data = await response.json();
      console.log("Package created successfully:", data);
      return NextResponse.json(data, { status: 201 });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error("Request timeout - backend took too long to respond");
        return NextResponse.json(
          { error: "Request timeout - please try again or check if product codes exist" },
          { status: 504 }
        );
      }
      throw fetchError;
    }
  } catch (error) {
    console.error("Error creating package (frontend):", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = searchParams.get("page") || "1";
    const limit = searchParams.get("limit") || "10";

    const response = await authenticatedFetch(
      `/api/packages?page=${page}&limit=${limit}`
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
      console.error("Backend error:", errorData);
      return NextResponse.json(
        { error: errorData.error || "Failed to fetch packages" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error, "Error fetching packages");
  }
}
