import { ImageResponse } from "next/og";
import { PotIcon } from "./icons/potIcon";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(<PotIcon size={32} scale={0.94} />, size);
}
