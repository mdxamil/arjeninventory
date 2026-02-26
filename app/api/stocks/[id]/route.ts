import { NextRequest, NextResponse } from "next/server";
import { authenticatedFetch, handleApiError } from "../../middleware";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const body = await req.json();
    const { id } = await context.params;

    const response = await authenticatedFetch(
      `/api/stocks/${id}/quantity`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
      return NextResponse.json(
        { error: errorData.error || "Failed to update stock quantity" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error, "Error updating stock quantity");
  }
}
