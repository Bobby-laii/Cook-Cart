import { ImageResponse } from "next/og";
import { PotIcon } from "./icons/potIcon";

// iOS rounds the corners itself, so the white background runs to the edge.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(<PotIcon size={180} scale={0.66} />, size);
}
