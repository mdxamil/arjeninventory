import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4001';

export async function DELETE(
  req: Request,
  // In Next.js 15+, params is a Promise
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. You MUST await params in Next.js 15
    const { id } = await params;

    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const backendUrl = `${BACKEND_URL}/api/products/${id}`;
    
    const response = await fetch(backendUrl, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      return NextResponse.json(
        { success: true, message: "Product deleted successfully" },
        { status: 200 }
      );
    } else {
      // Safely handle cases where the backend error isn't JSON
      let errorMessage = "Failed to delete product";
      try {
        const data = await response.json();
        if (data.error) errorMessage = data.error;
      } catch (e) {
        console.warn("Backend returned non-JSON error", e);
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      );
    }
  } catch (error) {
    console.error("Delete proxy error:", error);
    return NextResponse.json(
      { error: "An error occurred while deleting the product" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const backendUrl = `${BACKEND_URL}/api/products/${id}`;
    const body = await req.json();
    const response = await fetch(backendUrl, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (response.ok) {
      const updatedProduct = await response.json();
      return NextResponse.json(
        { success: true, product: updatedProduct },
        { status: 200 }
      );
    } else {
      let errorMessage = "Failed to update product";
      try {
        const data = await response.json();
        if (data.error) errorMessage = data.error;
      } 
      catch (e) {
        console.warn("Backend returned non-JSON error", e);
      }
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      );
    }
  } catch (error) {
    console.error("Update proxy error:", error);
    return NextResponse.json(
      { error: "An error occurred while updating the product" },
      { status: 500 }
    );
  } 
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const backendUrl = `${BACKEND_URL}/api/products/${id}`;
    const body = await req.json();
    const response = await fetch(backendUrl, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (response.ok) {
      const updatedProduct = await response.json();
      return NextResponse.json(
        { success: true, product: updatedProduct },
        { status: 200 }
      );
    } else {
      let errorMessage = "Failed to update product";
      try {
        const data = await response.json();
        if (data.error) errorMessage = data.error;
      } 
      catch (e) {
        console.warn("Backend returned non-JSON error", e);
      }
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      );
    }
  } catch (error) {
    console.error("Update proxy error:", error);
    return NextResponse.json(
      { error: "An error occurred while updating the product" },
      { status: 500 }
    );
  } 
}
