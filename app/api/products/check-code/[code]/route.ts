import { NextRequest, NextResponse } from "next/server";
import { authenticatedFetch, handleApiError } from "../../../middleware";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    const response = await authenticatedFetch(`/api/products/check-code/${code}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
      console.error("Backend error:", errorData);
      return NextResponse.json(
        { error: errorData.error || "Failed to check product code" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error, "Error checking product code");
  }
}
