import { cookies } from "next/headers";

export async function GET() {
  // Clear the JWT token cookie
  (await cookies()).delete("token");

  // Redirect to home page
  return Response.redirect(new URL("/", process.env.NEXTAUTH_URL || "http://localhost:3000"));
}

export async function POST() {
  // Clear the JWT token cookie
  (await cookies()).delete("token");

  return Response.json({ success: true });
}
