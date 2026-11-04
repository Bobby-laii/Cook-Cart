import { describe, it, expect } from "vitest";
import { button, chip, cx, field, iconButton } from "@/components/ui/styles";

describe("shared control styles", () => {
  it("gives every primary button the brand fill and a full tap target", () => {
    const md = button("primary");
    expect(md).toContain("bg-brand-500");
    expect(md).toContain("text-white");
    expect(md).toContain("h-[52px]");
    expect(button("secondary", "sm")).toContain("h-12");
    expect(iconButton()).toContain("w-12");
  });

  it("lets a caller override a class without duplicates", () => {
    expect(button("primary", "md", "w-full px-4")).toContain("px-4");
    expect(button("primary", "md", "px-4")).not.toContain("px-6");
  });

  it("keeps a colour and a custom font size together", () => {
    const c = cx("text-small", "text-stone-500");
    expect(c).toContain("text-small");
    expect(c).toContain("text-stone-500");
  });

  it("marks a selected chip with the primary fill and keeps chips 48px tall", () => {
    expect(chip(true)).toContain("bg-brand-500");
    expect(chip(false)).toContain("bg-stone-100");
    expect(chip(false)).toContain("min-h-12");
  });

  it("gives fields one height and leaves keyboard focus to the global ring", () => {
    expect(field()).toContain("h-[52px]");
    expect(field()).toContain("focus:outline-none");
  });
});
