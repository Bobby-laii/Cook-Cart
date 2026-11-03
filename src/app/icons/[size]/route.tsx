import { ImageResponse } from "next/og";
import { PotIcon } from "../potIcon";

// /icons/192, /icons/512 and /icons/maskable (512, mark inside the maskable safe zone).
const ICONS: Record<string, { size: number; scale: number }> = {
  "192": { size: 192, scale: 0.72 },
  "512": { size: 512, scale: 0.72 },
  maskable: { size: 512, scale: 0.56 },
};

export function generateStaticParams() {
  return Object.keys(ICONS).map((size) => ({ size }));
}

export const dynamicParams = false;

export function GET(_req: Request, { params }: { params: { size: string } }) {
  const icon = ICONS[params.size];
  if (!icon) return new Response("Not found", { status: 404 });
  return new ImageResponse(<PotIcon size={icon.size} scale={icon.scale} />, {
    width: icon.size,
    height: icon.size,
    headers: { "Cache-Control": "public, max-age=86400" },
  });
}
