import type { CSSProperties } from "react";

// Measurements are taken on the screenshots scaled to 2000px wide. The window is a size container,
// so `u(px)` (px / 20 cqw) keeps every overlay in step with the screenshot at any width.

export const u = (px: number) => `${px / 20}cqw`;

/** Places a box with its top-left corner at (`x`, `y`). */
export const rect = (x: number, y: number, w: number, h: number): CSSProperties => ({
    left: u(x), top: u(y), width: u(w), height: u(h),
});

/** Places a box of `w` by `h` centered on (`x`, `y`). */
export const box = (x: number, y: number, w: number, h: number): CSSProperties => rect(x - w / 2, y - h / 2, w, h);

// Colors picked from the screenshots.
export const SIDEBAR = "bg-[#eceae8] dark:bg-[#2d2b27]";
export const MAIN = "bg-[#f3f3f3] dark:bg-[#2f2d29]";
export const CARD = "bg-[#fffdfc] dark:bg-[#26272e]";
export const BUBBLE = "bg-[#f1e7df] dark:bg-[#382e24]";
export const TEXT = "text-[#1c1c1c] dark:text-[#f2f3f0]";
export const MUTED = "text-[#6d6d6d] dark:text-[#b1afae]";
export const FAINT = "text-[#959392] dark:text-[#767470]";
export const ACCENT = "text-[#a95f2f] dark:text-[#d99462]";
export const ACCENT_BG = "bg-[#a95f2f] text-white dark:bg-[#d99462] dark:text-[#2a1d19]";
export const PILL = "bg-[#faf3ec] dark:bg-[#3a332c]";
export const HOVER = "cursor-pointer rounded-[0.5cqw] transition-[background-color,box-shadow] hover:bg-[#a95f2f]/8 hover:shadow-[0_0_0_0.15cqw_#a95f2f66] dark:hover:bg-[#d99462]/10 dark:hover:shadow-[0_0_0_0.15cqw_#d9946266]";

/** Text sizes, from the screenshots: body 17px, small 16px, title 20px, section header 14px. */
export const BODY = "text-[0.85cqw] leading-[1.45]";
export const SMALL = "text-[0.8cqw] leading-[1.4]";
export const TITLE = "text-[0.98cqw] font-semibold";
export const HEADER = "text-[0.7cqw] font-semibold";
