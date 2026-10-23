// Every product the site shows. Icons come in a light and a dark variant.
export type Product = {
    id: string;
    name: string;
    icon: { light: string; dark: string };
    /** Card glow on the home page. */
    brand: string;
    /** Page accent in light and dark mode. */
    accent: { light: string; dark: string };
    /** Sits at the top of the product ring; otherwise two products sit left and right. */
    ringTop?: boolean;
    /** false: doesn't work with the hub yet, so it stays off the ring. */
    ring?: boolean;
};

export const PRODUCTS: Product[] = [
    {
        id: "modelcraft", name: "ModelCraft", brand: "#e08a4e",
        icon: { light: "/assets/modelcraft/icon-light.png", dark: "/assets/modelcraft/icon-dark.png" },
        accent: { light: "#b85a24", dark: "#f0a06a" },
    },
    {
        id: "arthub", name: "Arthub", brand: "#e5484d",
        icon: { light: "/assets/arthub/icon-light.svg", dark: "/assets/arthub/icon-dark.svg" },
        accent: { light: "#d93a3a", dark: "#ff5a52" },
    },
    {
        id: "keel", name: "Keel", brand: "#d6293e",
        icon: { light: "/assets/keel/icon-light.png", dark: "/assets/keel/icon-dark.png" },
        accent: { light: "#c8283a", dark: "#f0565f" },
    },
    {
        id: "tunestudio", name: "TuneStudio", brand: "#6a5cf0",
        icon: { light: "/assets/tunestudio/icon-light.svg", dark: "/assets/tunestudio/icon-dark.svg" },
        accent: { light: "#5240e4", dark: "#8f85ff" },
    },
    {
        id: "container", name: "Container", brand: "#1a5cf2", ringTop: true,
        icon: { light: "/assets/container/icon-light.svg", dark: "/assets/container/icon-dark.svg" },
        accent: { light: "#1a5cf2", dark: "#4d9eff" },
    },
    {
        id: "cellar", name: "Cellar", brand: "#ee9a3a",
        icon: { light: "/assets/cellar/icon-light.svg", dark: "/assets/cellar/icon-dark.svg" },
        accent: { light: "#b0560f", dark: "#f5ad4c" },
    },
    {
        id: "quaero", name: "Quaero", brand: "#3a3f9e",
        icon: { light: "/assets/quaero/icon-light.svg", dark: "/assets/quaero/icon-dark.svg" },
        accent: { light: "#3a3f9e", dark: "#8f96ff" },
    },
];

export function getProduct(id: string): Product {
    const product = PRODUCTS.find((p) => p.id === id);
    if (!product) throw new Error(`Unknown product ${id}`);
    return product;
}

/** Route handle that tints the page accent (read by root.tsx). */
export type AccentHandle = { accent?: { light: string; dark: string } };
