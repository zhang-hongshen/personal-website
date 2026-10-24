// Every product the site shows. Icons come in a light and a dark variant.
import modelcraftIconLight from "~/assets/modelcraft/icon-light.png";
import modelcraftIconDark from "~/assets/modelcraft/icon-dark.png";
import arthubIconLight from "~/assets/arthub/icon-light.svg";
import arthubIconDark from "~/assets/arthub/icon-dark.svg";
import keelIconLight from "~/assets/keel/icon-light.png";
import keelIconDark from "~/assets/keel/icon-dark.png";
import tunestudioIconLight from "~/assets/tunestudio/icon-light.svg";
import tunestudioIconDark from "~/assets/tunestudio/icon-dark.svg";
import containerIconLight from "~/assets/container/icon-light.svg";
import containerIconDark from "~/assets/container/icon-dark.svg";
import cellarIconLight from "~/assets/cellar/icon-light.svg";
import cellarIconDark from "~/assets/cellar/icon-dark.svg";
import quaeroIconLight from "~/assets/quaero/icon-light.svg";
import quaeroIconDark from "~/assets/quaero/icon-dark.svg";
import pinchIconLight from "~/assets/pinch/icon-light.svg";
import pinchIconDark from "~/assets/pinch/icon-dark.svg";

/** Groups on the home page and in the Products menu, in display order. */
export const CATEGORIES = ["ai", "developer", "media", "productivity"] as const;
export type Category = (typeof CATEGORIES)[number];

export type Product = {
    id: string;
    name: string;
    category: Category;
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
        id: "modelcraft", name: "ModelCraft", category: "ai", brand: "#e08a4e",
        icon: { light: modelcraftIconLight, dark: modelcraftIconDark },
        accent: { light: "#b85a24", dark: "#f0a06a" },
    },
    {
        id: "arthub", name: "Arthub", category: "media", brand: "#e5484d",
        icon: { light: arthubIconLight, dark: arthubIconDark },
        accent: { light: "#d93a3a", dark: "#ff5a52" },
    },
    {
        id: "keel", name: "Keel", category: "developer", brand: "#d6293e",
        icon: { light: keelIconLight, dark: keelIconDark },
        accent: { light: "#c8283a", dark: "#f0565f" },
    },
    {
        id: "tunestudio", name: "TuneStudio", category: "media", brand: "#6a5cf0",
        icon: { light: tunestudioIconLight, dark: tunestudioIconDark },
        accent: { light: "#5240e4", dark: "#8f85ff" },
    },
    {
        id: "container", name: "Container", category: "developer", brand: "#1a5cf2", ringTop: true,
        icon: { light: containerIconLight, dark: containerIconDark },
        accent: { light: "#1a5cf2", dark: "#4d9eff" },
    },
    {
        id: "cellar", name: "Cellar", category: "productivity", brand: "#ee9a3a",
        icon: { light: cellarIconLight, dark: cellarIconDark },
        accent: { light: "#b0560f", dark: "#f5ad4c" },
    },
    {
        id: "quaero", name: "Quaero", category: "developer", brand: "#3a3f9e",
        icon: { light: quaeroIconLight, dark: quaeroIconDark },
        accent: { light: "#3a3f9e", dark: "#8f96ff" },
    },
    {
        id: "pinch", name: "Pinch", category: "productivity", brand: "#ff6b4a", ring: false,
        icon: { light: pinchIconLight, dark: pinchIconDark },
        accent: { light: "#d94a2b", dark: "#ff8c6e" },
    },
];

/** Products grouped by category, in category order. */
export const PRODUCT_GROUPS = CATEGORIES.map((category) => ({
    category,
    products: PRODUCTS.filter((p) => p.category === category),
}));

export function getProduct(id: string): Product {
    const product = PRODUCTS.find((p) => p.id === id);
    if (!product) throw new Error(`Unknown product ${id}`);
    return product;
}

/** Route handle that tints the page accent (read by root.tsx). */
export type AccentHandle = { accent?: { light: string; dark: string } };
