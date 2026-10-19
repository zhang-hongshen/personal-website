import { getProduct } from "~/lib/products";
import { ThemedImage } from "./themed-image";

type Props = Omit<React.ComponentProps<typeof ThemedImage>, "light" | "dark"> & { id: string };

export function ProductIcon({ id, ...props }: Props) {
    const { icon } = getProduct(id);
    return <ThemedImage light={icon.light} dark={icon.dark} {...props} />;
}
