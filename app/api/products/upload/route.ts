import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { v2 as cloudinary } from "cloudinary";
import type { UploadApiErrorResponse, UploadApiResponse } from "cloudinary";

import { Readable } from "stream";

const BACKEND_URL = process.env.BACKEND_URL || 'https://arjeninventoryproductsever.vercel.app';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest) {
  try {
    console.log("=== Upload Request Started ===");

    // Check authentication
    const token = (await cookies()).get("token");
    if (!token) {
      console.log("No token found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Token found, verifying...");

    // Verify token and get user
    const verifyRes = await fetch(`${BACKEND_URL}/api/auth/verify`, {
      headers: { Authorization: `Bearer ${token.value}` },
    });

    if (!verifyRes.ok) {
      console.log("Token verification failed");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { user } = await verifyRes.json();
    console.log("User verified:", user.id);

    // Parse form data
    const formData = await req.formData();
    const category = formData.get("category") as string;
    const description = formData.get("description") as string;
    const price = formData.get("price") as string;
    const currency = formData.get("currency") as string;
    const imageFile = formData.get("image") as File;
    const weight = formData.get("weight") as string;
    const shippmentWay = formData.get("shippmentWay") as string;

    console.log("Form data:", { category, description, price, currency, weight, shippmentWay, hasImage: !!imageFile });

    // Validation
    if (!category || !description || !price || !currency || !weight || !shippmentWay) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    let image_url = null;
    let cloudinary_id = null;

    // Upload image to Cloudinary
    if (imageFile && imageFile.size > 0) {
      console.log("Starting Cloudinary upload...", { size: imageFile.size, type: imageFile.type });

      try {
        const buffer = Buffer.from(await imageFile.arrayBuffer());
        console.log("Buffer created, size:", buffer.length);

        const streamUpload = () =>
          new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              { folder: "products" },
              (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {

                if (error) {
                  console.error("Cloudinary upload error:", error);
                  reject(error);
                } else if (result) {
                  console.log("Cloudinary upload success:", result.public_id);
                  resolve(result);
                } else {
                  reject(new Error("No result from Cloudinary"));
                }
              }
            );

            // Use Readable.from instead of streamifier
            Readable.from(buffer).pipe(stream);
          });

        const uploadResult = await streamUpload();
        image_url = uploadResult.secure_url;
        cloudinary_id = uploadResult.public_id;
        console.log("Image uploaded:", cloudinary_id);
      } catch (uploadError) {
        console.error("Image upload failed:", uploadError);
        return NextResponse.json(
          { error: `Image upload failed: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}` },
          { status: 400 }
        );
      }
    }

    if (!image_url || !cloudinary_id) {
      return NextResponse.json(
        { error: "Image upload failed" },
        { status: 400 }
      );
    }


    const productData = {
      id: crypto.randomUUID(),
      category,
      description,
      price: parseFloat(price),
      currency,
      weight: parseInt(weight),
      imageUrl: image_url,
      imageCloudinaryId: cloudinary_id,
      userId: user.id,
      shippmentWay,
    };


    const saveRes = await fetch(`${BACKEND_URL}/api/products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token.value}`,
      },
      body: JSON.stringify(productData),
    });

    if (!saveRes.ok) {
      const errorText = await saveRes.text();
      console.error("Backend save failed:", saveRes.status, errorText);

      // If save fails, delete the uploaded image from Cloudinary
      await cloudinary.uploader.destroy(cloudinary_id);
      console.log("Cleaned up Cloudinary image");

      return NextResponse.json(
        { error: `Failed to save product: ${errorText}` },
        { status: 500 }
      );
    }

    const savedProduct = await saveRes.json();
    console.log("Product saved successfully:", savedProduct.id);

    return NextResponse.json(
      { success: true, product: savedProduct },
      { status: 201 }
    );
  } catch (error) {
    console.error("=== Upload error ===");
    console.error(error);
    console.error("Error stack:", error instanceof Error ? error.stack : 'No stack trace');

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
