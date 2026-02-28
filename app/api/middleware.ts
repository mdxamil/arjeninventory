import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4001';

export async function getAuthToken(): Promise<string | null> {
  const token = (await cookies()).get("token");
  return token?.value || null;
}


export async function validateToken() {
  const token = await getAuthToken();

  if (!token) {
    return { 
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      user: null 
    };
  }

  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/verify`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return { 
        error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
        user: null 
      };
    }

    const data = await response.json();
    
    if (!data.user) {
      return { 
        error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
        user: null 
      };
    }

    return { error: null, user: data.user };
  } catch (error) {
    console.error("Token validation error:", error);
    return { 
      error: NextResponse.json({ error: "Authentication failed" }, { status: 401 }),
      user: null 
    };
  }
}


export async function authenticatedFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getAuthToken();
  
  const headers = {
    ...options.headers,
    Authorization: `Bearer ${token}`,
  };

  return fetch(`${BACKEND_URL}${endpoint}`, {
    ...options,
    headers,
  });
}

/**
 * Handle API errors consistently
 */
export function handleApiError(error: unknown, defaultMessage: string = "Internal server error") {
  console.error("API Error:", error);
  
  return NextResponse.json(
    { error: error instanceof Error ? error.message : defaultMessage },
    { status: 500 }
  );
}
