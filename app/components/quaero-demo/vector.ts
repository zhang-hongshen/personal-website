import type { Value } from "./data";

// Vectors in the text form pgvector and the app use ("[0.1,-0.25,3]"): parsing, distances, the
// statistics the vector inspector shows, and the colors of the fingerprint strip (VectorColumns.md).

/** The vector in a cell, or null when the cell isn't one. */
export function parseVector(value: Value): number[] | null {
    if (typeof value !== "string" || !value.startsWith("[") || !value.endsWith("]") || !value.includes(",")) return null;
    const parts = value.slice(1, -1).split(",").map(Number);
    return parts.every(Number.isFinite) ? parts : null;
}

export const vectorText = (v: number[]) => `[${v.map((x) => Number(x.toFixed(4))).join(",")}]`;

const dot = (a: number[], b: number[]) => a.reduce((n, x, i) => n + x * b[i], 0);
export const norm = (a: number[]) => Math.sqrt(dot(a, a));

/** pgvector's <=> (cosine distance), <-> (Euclidean) and <#> (negative inner product). */
export function distance(op: "<=>" | "<->" | "<#>", a: number[], b: number[]): number {
    if (a.length !== b.length) throw new Error(`different vector dimensions ${a.length} and ${b.length}`);
    if (op === "<->") return Math.sqrt(a.reduce((n, x, i) => n + (x - b[i]) ** 2, 0));
    if (op === "<#>") return -dot(a, b);
    return 1 - dot(a, b) / (norm(a) * norm(b) || 1);
}

/** Cosine similarity, as Qdrant's score and Milvus's COSINE distance report it (higher is closer). */
export const similarity = (a: number[], b: number[]) => dot(a, b) / (norm(a) * norm(b) || 1);

export function stats(v: number[]) {
    let min = 0, max = 0;
    v.forEach((x, i) => { if (x < v[min]) min = i; if (x > v[max]) max = i; });
    const n = norm(v);
    return {
        norm: n, normalized: Math.abs(n - 1) < 0.001, mean: v.reduce((a, b) => a + b, 0) / v.length,
        min: { at: min + 1, value: v[min] }, max: { at: max + 1, value: v[max] }, zeros: v.filter((x) => x === 0).length,
    };
}

/** A component's color on the diverging scale: blue below zero, red above, fading toward zero. */
export function heat(x: number, scale: number): string {
    const t = Math.min(1, Math.abs(x) / (scale || 1));
    return x < 0 ? `rgb(10 122 255 / ${t})` : `rgb(255 59 48 / ${t})`;
}

/** Deterministic pseudo-random numbers, so the demo's vectors are the same on every visit. */
function random(seed: number) {
    return () => {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        return seed / 2 ** 32;
    };
}

/** A unit vector near its topic's direction, so items about the same thing come out similar. */
export function embedding(topic: number, seed: number, dims: number): string {
    const base = random(topic * 7919 + 17);
    const noise = random(seed * 104729 + topic * 31 + 3);
    const v = Array.from({ length: dims }, () => (base() - 0.5) * 2 * 0.85 + (noise() - 0.5) * 2 * 0.35);
    const n = norm(v);
    return vectorText(v.map((x) => x / n));
}
