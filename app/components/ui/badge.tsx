import * as React from "react";
import { Slot } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "~/lib/utils";

const badgeVariants = cva(
    "inline-flex w-fit shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-secondary font-medium text-muted-foreground [&>svg]:pointer-events-none",
    {
        variants: {
            size: {
                default: "px-[11px] py-1 text-[12.5px] leading-normal",
                sm: "px-[9px] py-0.5 text-xs leading-normal",
            },
        },
        defaultVariants: { size: "default" },
    },
);

function Badge({
    className,
    size,
    asChild = false,
    ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
    const Comp = asChild ? Slot.Root : "span";
    return <Comp data-slot="badge" className={cn(badgeVariants({ size }), className)} {...props} />;
}

export { Badge, badgeVariants };
