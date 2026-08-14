import { NextResponse } from "next/server";

const CLOUDINARY_VIDEO_URL = "https://res.cloudinary.com/dlmjlxygz/video/upload/v1786734486/legacy/videos/packaging_unboxing_video.mp4";

export async function GET() {
  return NextResponse.redirect(CLOUDINARY_VIDEO_URL, {
    status: 308,
    headers: {
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
