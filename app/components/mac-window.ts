// Shared look of the macOS app windows in the product demos: the system font and macOS 26 toolbar glass.

export const MAC_FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "PingFang SC", system-ui, sans-serif';

/** Toolbar glass, for a round button or a capsule around a group of items. */
export const GLASS = "bg-white/80 text-[#3a3a3c] shadow-[0_0_0_0.5px_rgb(0_0_0/0.1),0_1px_4px_rgb(0_0_0/0.1)] backdrop-blur-md dark:bg-white/10 dark:text-[#e5e5e7] dark:shadow-[0_0_0_0.5px_rgb(255_255_255/0.1),0_1px_4px_rgb(0_0_0/0.4)]";
/** A toolbar button on its own. */
export const TOOL = `flex size-8 shrink-0 items-center justify-center rounded-full ${GLASS}`;
/** A group of toolbar items sharing one capsule; the items inside are `TOOL_ITEM`. */
export const CAPSULE = `flex h-8 shrink-0 items-center rounded-full ${GLASS}`;
export const TOOL_ITEM = "relative flex size-7 items-center justify-center rounded-full hover:bg-black/6 disabled:opacity-35 disabled:hover:bg-transparent dark:hover:bg-white/10";
