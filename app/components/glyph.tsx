import type { ReactNode } from "react";

import { cn } from "~/lib/utils";

/** A 24×24 stroke icon drawn from the given SVG shapes. */
export function Glyph({ children, strokeWidth = 1.75, className }: { children: ReactNode; strokeWidth?: number; className?: string }) {
    return (
        <svg
            className={cn("size-7", className)}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            {children}
        </svg>
    );
}
