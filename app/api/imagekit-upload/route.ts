import { NextRequest, NextResponse } from "next/server";
import ImageKit, { toFile } from "@imagekit/nodejs";

// Initialize ImageKit with server-side credentials
const imagekit = new ImageKit({
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY || "private_j1Fezu1Ir8ibIXAemKYFkOFhK0g=",
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { file, fileName, folder } = body;

    if (!file || !fileName) {
      return NextResponse.json(
        { error: "File and fileName are required" },
        { status: 400 }
      );
    }

    // Convert base64 string to Buffer
    const buffer = Buffer.from(file, 'base64');

    // Upload file to ImageKit
    const uploadResponse = await imagekit.files.upload({
      file: await toFile(buffer, fileName),
      fileName: fileName,
      folder: folder || "/wholesale-products",
      useUniqueFileName: true,
      tags: ["wholesale", "product"],
    });

    return NextResponse.json({
      success: true,
      url: uploadResponse.url,
      fileId: uploadResponse.fileId,
      name: uploadResponse.name,
      thumbnailUrl: uploadResponse.thumbnailUrl,
    });
  } catch (error) {
    console.error("ImageKit upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload image to ImageKit", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// Delete file from ImageKit
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { fileId } = body;

    if (!fileId) {
      return NextResponse.json(
        { error: "fileId is required" },
        { status: 400 }
      );
    }

    await imagekit.files.delete(fileId);

    return NextResponse.json({
      success: true,
      message: "File deleted successfully",
    });
  } catch (error) {
    console.error("ImageKit delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete image from ImageKit", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// Optional: Endpoint to get ImageKit authentication parameters for client-side uploads
export async function GET() {
  try {
    const authenticationParameters = imagekit.helper.getAuthenticationParameters();
    return NextResponse.json(authenticationParameters);
  } catch (error) {
    console.error("ImageKit auth error:", error);
    return NextResponse.json(
      { error: "Failed to get authentication parameters" },
      { status: 500 }
    );
  }
}
