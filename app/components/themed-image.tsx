import { cn } from "~/lib/utils";

type Props = Omit<React.ComponentProps<"img">, "src"> & { light: string; dark: string };

/** An image with a light and a dark variant; CSS shows the one matching the theme. */
export function ThemedImage({ light, dark, className, alt = "", ...props }: Props) {
    return (
        <>
            <img className={cn("only-light", className)} src={light} alt={alt} {...props} />
            <img className={cn("only-dark", className)} src={dark} alt={alt} loading="lazy" {...props} />
        </>
    );
}
