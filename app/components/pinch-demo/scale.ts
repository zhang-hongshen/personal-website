// Pinch's ScaleModel, run on a simulated trackpad: a resting finger that wavers a little, plus
// whatever objects lie on it. The trackpad's pressure isn't quite grams, so readings are a little low
// until the scale is calibrated with an object of known weight.

import type { L } from "~/components/demo-text";

export const CAPACITY_GRAMS = 1000;
export const SAMPLE_PIECES = 10;

const SMOOTHING = 0.08;
const DISPLAY_RESOLUTION = 0.3;
const STABILITY_WINDOW = 0.6;
const STABILITY_TOLERANCE = 0.5;
const MINIMUM_CALIBRATION_DELTA = 0.5;
const MINIMUM_PIECE_GRAMS = 0.5;
/** Raw pressure per gram of this simulated trackpad. */
const SENSITIVITY = 0.88;
const FINGER_GRAMS = 54;

export type Unit = "g" | "oz" | "ct" | "ozt" | "gr";

export const UNITS: { id: Unit; name: L; grams: number; digits: number }[] = [
    { id: "g", name: ["Grams", "克", "公克"], grams: 1, digits: 1 },
    { id: "oz", name: ["Ounces", "盎司", "盎司"], grams: 28.349523125, digits: 2 },
    { id: "ct", name: ["Carats", "克拉", "克拉"], grams: 0.2, digits: 1 },
    { id: "ozt", name: ["Troy Ounces", "金衡盎司", "金衡盎司"], grams: 31.1034768, digits: 3 },
    { id: "gr", name: ["Grains", "格令", "格令"], grams: 0.06479891, digits: 0 },
];

export function unitInfo(unit: Unit) {
    return UNITS.find((u) => u.id === unit)!;
}

/** The readout with no weight to show, for example "--.-". */
export function placeholder(unit: Unit) {
    const { digits } = unitInfo(unit);
    const integer = "-".repeat(Math.max(1, 3 - digits));
    return digits > 0 ? `${integer}.${"-".repeat(digits)}` : integer;
}

export function format(grams: number, unit: Unit) {
    const { grams: per, digits } = unitInfo(unit);
    let value = grams / per;
    // Avoid showing "-0.0" for tiny negative noise.
    if (Math.abs(value) < 0.5 * 10 ** -digits) value = 0;
    return value.toFixed(digits);
}

export class Scale {
    hasContact = false;
    /** Grams resting on the finger. */
    load = 0;

    rawPressure = 0;
    displayedGrams = 0;
    isStable = false;
    tareOffset = 0;
    gramsPerUnit = 1;
    isCalibrated = false;
    mode: "weigh" | "count" = "weigh";
    pieceGrams: number | null = null;
    heldGrams: number | null = null;

    private readings: { time: number; grams: number }[] = [];

    get isTared() { return this.tareOffset !== 0; }
    get netGrams() { return (this.rawPressure - this.tareOffset) * this.gramsPerUnit; }
    get isOverloaded() { return this.hasContact && this.rawPressure * this.gramsPerUnit > CAPACITY_GRAMS; }
    get isHolding() { return this.heldGrams !== null; }
    get needsSample() { return this.mode === "count" && this.pieceGrams === null; }
    get canHold() { return this.hasContact && !this.isOverloaded && !this.needsSample; }
    get shownGrams() { return this.heldGrams ?? this.displayedGrams; }
    /** 0 with no finger; a resting finger starts at 0.25, rising to 1 at full capacity. */
    get press() {
        if (!this.hasContact) return 0;
        return 0.25 + 0.75 * Math.min((this.rawPressure * this.gramsPerUnit) / CAPACITY_GRAMS, 1);
    }

    pieces(grams: number) {
        return this.pieceGrams ? Math.round(grams / this.pieceGrams) : 0;
    }

    /** Zeroes the reading, or in counting mode with the sample on the finger, takes the sample. */
    tare() {
        this.heldGrams = null;
        if (this.needsSample && this.hasContact && !this.isOverloaded && this.displayedGrams >= MINIMUM_PIECE_GRAMS * SAMPLE_PIECES) {
            this.pieceGrams = this.displayedGrams / SAMPLE_PIECES;
            return;
        }
        this.tareOffset = this.hasContact ? this.rawPressure : 0;
        this.displayedGrams = 0;
        this.readings = [];
        this.isStable = false;
    }

    toggleHold() {
        if (this.isHolding) this.heldGrams = null;
        else if (this.canHold) this.heldGrams = this.displayedGrams;
    }

    toggleCounting() {
        this.heldGrams = null;
        this.pieceGrams = null;
        this.mode = this.mode === "count" ? "weigh" : "count";
    }

    calibrate(knownGrams: number, baselineRaw: number) {
        const delta = this.rawPressure - baselineRaw;
        if (!(knownGrams > 0) || delta < MINIMUM_CALIBRATION_DELTA) return false;
        this.setGramsPerUnit(knownGrams / delta, true);
        return true;
    }

    resetCalibration() {
        this.setGramsPerUnit(1, false);
    }

    private setGramsPerUnit(value: number, calibrated: boolean) {
        this.gramsPerUnit = value;
        this.isCalibrated = calibrated;
        this.pieceGrams = null;
        this.heldGrams = null;
        this.readings = [];
        this.isStable = false;
        this.displayedGrams = this.netGrams;
    }

    /** One trackpad frame at `time` seconds. */
    step(time: number) {
        if (!this.hasContact) {
            this.rawPressure = 0;
            this.displayedGrams = 0;
            this.isStable = false;
            this.readings = [];
            return;
        }
        // A finger never rests perfectly still: a slow sway and a little jitter.
        const finger = FINGER_GRAMS + 0.12 * Math.sin(time * 0.9) + 0.06 * Math.sin(time * 2.3 + 1);
        const total = (finger + this.load) * SENSITIVITY + (Math.random() - 0.5) * 0.6;
        this.rawPressure = this.rawPressure === 0 ? total : this.rawPressure + (total - this.rawPressure) * SMOOTHING;
        this.updateStability(time);
        if (Math.abs(this.netGrams - this.displayedGrams) >= DISPLAY_RESOLUTION) this.displayedGrams = this.netGrams;
    }

    private updateStability(now: number) {
        this.readings.push({ time: now, grams: this.netGrams });
        this.readings = this.readings.filter((r) => now - r.time <= STABILITY_WINDOW);
        const values = this.readings.map((r) => r.grams);
        const spread = Math.max(...values) - Math.min(...values);
        const covered = now - this.readings[0].time;
        const tolerance = Math.max(STABILITY_TOLERANCE, Math.abs(this.netGrams) * 0.005);
        const stable = covered >= STABILITY_WINDOW * 0.8 && spread <= tolerance;
        // Settle on the average so the stable value doesn't depend on the last frame.
        if (stable && !this.isStable) this.displayedGrams = values.reduce((a, b) => a + b, 0) / values.length;
        this.isStable = stable;
    }
}
