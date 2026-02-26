import { cookies } from "next/headers";
import { validateToken } from "../middleware";
import { NextResponse } from "next/server";

export async function GET() {
  // Use middleware to validate token
  const { error, user } = await validateToken();
  
  if (error) return error;
  
  // Check user role
  const allowedRoles = ["owner", "partner", "reseller", "seller"];
  if (!allowedRoles.includes(user!.role)) {
    // Clear cookies token
    (await cookies()).delete("token");
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  
  return NextResponse.json(user);
}

export const token = async () => {
  const token = (await cookies()).get("token");
  return token?.value || null;
}
