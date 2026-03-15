import { NextRequest, NextResponse } from "next/server";
import { getSegmentConfig } from "@/lib/segment";

export const revalidate = 3600;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = (searchParams.get("type") || "").trim().toLowerCase();

  if (!type) {
    return NextResponse.json(
      { error: "Missing segment type" },
      {
        status: 400,
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=3600",
        },
      },
    );
  }

  const config = await getSegmentConfig(type);

  if (!config) {
    return NextResponse.json(
      { error: "Segment type not found" },
      {
        status: 404,
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=3600",
        },
      },
    );
  }

  return NextResponse.json(config, {
    status: 200,
    headers: {
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=3600",
    },
  });
}
