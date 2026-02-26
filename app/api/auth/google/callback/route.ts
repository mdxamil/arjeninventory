import { cookies } from "next/headers";

const BACKEND_URL = process.env.BACKEND_URL || 'https://arjeninventoryproductsever.vercel.app';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");

  if (!code) return new Response("No code", { status: 400 });

  // 1️⃣ exchange code for token
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
      grant_type: "authorization_code",
    }),
  });

  const tokenData = await tokenRes.json();

  // 2️⃣ get user profile
  const userRes = await fetch(
    "https://www.googleapis.com/oauth2/v2/userinfo",
    {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    }
  );

  const googleUser = await userRes.json();

  /*
    googleUser = {
      id,
      email,
      name,
      picture
    }
  */

  // 3️⃣ Get JWT token from backend
  const backendRes = await fetch(`${BACKEND_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fullname: googleUser.name,
      email: googleUser.email,
      googleId: googleUser.id,
    }),
  });

  if (!backendRes.ok) {
    const errorText = await backendRes.text();
    console.error("Backend login failed:", backendRes.status, errorText);
    return new Response("Authentication failed", { status: 500 });
  }

  const { token } = await backendRes.json();

  // 4️⃣ Store JWT in httpOnly cookie
  (await cookies()).set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });

  // 5️⃣ redirect inside app
  return Response.redirect(new URL("/dashboard", req.url));
}
