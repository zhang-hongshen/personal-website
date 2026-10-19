import * as React from "react";
import { Slot } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "~/lib/utils";

const buttonVariants = cva(
    "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full border border-transparent font-semibold transition-[transform,box-shadow,background-color,border-color,color] duration-150 cursor-pointer hover:no-underline disabled:pointer-events-none disabled:opacity-60 aria-disabled:cursor-default aria-disabled:opacity-60 aria-disabled:shadow-none [&_svg]:pointer-events-none [&_svg]:shrink-0",
    {
        variants: {
            variant: {
                default:
                    "bg-primary text-primary-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_8px_24px_-8px_color-mix(in_srgb,var(--accent)_70%,transparent)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_12px_28px_-8px_color-mix(in_srgb,var(--accent)_80%,transparent)]",
                outline: "bg-card text-foreground border-border-strong hover:bg-accent",
                ghost: "text-muted-foreground hover:bg-accent hover:text-foreground",
            },
            size: {
                default: "h-11 px-[22px] text-[15px] [&_svg]:size-[18px]",
                sm: "h-9 px-3.5 text-sm font-medium [&_svg]:size-4",
                icon: "size-9 text-[13px] font-medium [&_svg]:size-4",
            },
            lift: {
                true: "hover:-translate-y-px active:translate-y-0 aria-disabled:transform-none",
                false: "",
            },
        },
        defaultVariants: { variant: "default", size: "default", lift: true },
    },
);

function Button({
    className,
    variant,
    size,
    lift,
    asChild = false,
    ...props
}: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
    const Comp = asChild ? Slot.Root : "button";
    return <Comp data-slot="button" className={cn(buttonVariants({ variant, size, lift, className }))} {...props} />;
}

export { Button, buttonVariants };
