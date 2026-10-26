// A sung take for the TuneStudio demo and what the app does to it: the pitch curve a singer might
// produce for a melody (a scoop into each note, vibrato, a few notes sharp or flat), the notes found
// in it, Auto Tune and hand edits applied on top, and the voice rendered back to audio.

import type { L } from "~/components/demo-text";

export const HOP = 0.01;
export const SAMPLE_RATE = 44100;

export type Recording = { id: string; name: L; format: L; tempo: number; melody: [number, number][]; errors: number[] };

const C4 = 60, D4 = 62, E4 = 64, F4 = 65, G4 = 67, A4 = 69;

export const RECORDINGS: Recording[] = [
    {
        id: "twinkle",
        name: ["Twinkle Twinkle.wav", "小星星.wav", "小星星.wav"],
        format: ["44.1 kHz · Mono", "44.1 kHz · 单声道", "44.1 kHz · 單聲道"],
        tempo: 0.5,
        // [MIDI pitch, beats]
        melody: [[C4, 1], [C4, 1], [G4, 1], [G4, 1], [A4, 1], [A4, 1], [G4, 2], [F4, 1], [F4, 1], [E4, 1], [E4, 1], [D4, 1], [D4, 1], [C4, 2]],
        errors: [0.18, -0.12, -0.42, 0.06, 0.31, -0.08, -0.36, 0.44, 0.1, -0.27, 0.05, 0.38, -0.15, -0.33],
    },
    {
        id: "ode",
        name: ["Ode to Joy.m4a", "欢乐颂.m4a", "歡樂頌.m4a"],
        format: ["48 kHz · Stereo", "48 kHz · 立体声", "48 kHz · 立體聲"],
        tempo: 0.42,
        melody: [[E4, 1], [E4, 1], [F4, 1], [G4, 1], [G4, 1], [F4, 1], [E4, 1], [D4, 1], [C4, 1], [C4, 1], [D4, 1], [E4, 1], [E4, 1.5], [D4, 0.5], [D4, 2]],
        errors: [-0.3, 0.12, 0.4, -0.2, 0.08, -0.38, 0.22, 0.34, -0.1, -0.45, 0.16, 0.05, -0.28, 0.4, -0.18],
    },
];

export type Note = { id: number; start: number; end: number; /** Median sung pitch. */ median: number };
export type Take = { recording: Recording; duration: number; /** Sung pitch per hop, NaN where silent. */ frames: number[]; notes: Note[]; /** The note each frame belongs to, -1 for none. */ owner: number[] };

export function makeTake(recording: Recording): Take {
    const lead = 0.4;
    let beat = 0;
    const spans = recording.melody.map(([midi, beats], i) => {
        const start = lead + beat * recording.tempo;
        beat += beats;
        return { midi, start, end: lead + beat * recording.tempo - 0.07, error: recording.errors[i] };
    });
    const duration = spans[spans.length - 1].end + 0.6;
    const count = Math.ceil(duration / HOP);
    const frames = new Array<number>(count).fill(NaN);
    const owner = new Array<number>(count).fill(-1);
    spans.forEach((s, i) => {
        for (let f = Math.ceil(s.start / HOP); f * HOP < s.end; f++) {
            const t = f * HOP - s.start;
            const scoop = -0.7 * Math.exp(-t / 0.05);
            const vibrato = 0.2 * Math.sin(2 * Math.PI * 5.6 * t) * Math.min(Math.max((t - 0.12) / 0.2, 0), 1);
            const drift = 0.06 * Math.sin(1.7 * t + i);
            frames[f] = s.midi + s.error + scoop + vibrato + drift;
            owner[f] = i;
        }
    });
    const notes = spans.map((s, i) => {
        const pitches = frames.filter((_, f) => owner[f] === i).sort((a, b) => a - b);
        return { id: i, start: s.start, end: s.end, median: pitches[Math.floor(pitches.length / 2)] };
    });
    return { recording, duration, frames, notes, owner };
}

export type Style = "natural" | "balanced" | "robotic";

export const STYLES: { id: Style; title: L; summary: L; amount: number; flattening: number }[] = [
    {
        id: "natural", title: ["Natural", "自然", "自然"], amount: 0.6, flattening: 0,
        summary: ["Gently nudges notes toward pitch. Your voice keeps its character.", "轻轻把音推向准确音高，保留嗓音特点。", "輕輕把音推向準確音高，保留嗓音特色。"],
    },
    {
        id: "balanced", title: ["Balanced", "标准", "標準"], amount: 1, flattening: 0,
        summary: ["Puts every held note on pitch and keeps your vibrato.", "每个长音都修到准确音高，保留颤音。", "每個長音都修到準確音高，保留顫音。"],
    },
    {
        id: "robotic", title: ["Robotic", "电音", "電音"], amount: 1, flattening: 1,
        summary: ["Snaps every note flat onto pitch for the classic electronic effect.", "把音高完全拉直，得到经典的电音效果。", "把音高完全拉直，得到經典的電音效果。"],
    },
];

/** Everything the user changed: Auto Tune's style (or off) and notes moved by hand, by note id. */
export type Edits = { style: Style | null; manual: Record<number, number> };

/** Where each note ends up: its center pitch and how flat its pitch movement is held. */
export function noteTargets(take: Take, edits: Edits) {
    const style = STYLES.find((s) => s.id === edits.style);
    return take.notes.map((n) => {
        const manual = edits.manual[n.id];
        if (manual !== undefined) return { center: manual, target: manual, flattening: style?.flattening ?? 0, edited: true };
        if (!style) return { center: n.median, target: n.median, flattening: 0, edited: false };
        const target = Math.round(n.median);
        return { center: n.median + (target - n.median) * style.amount, target, flattening: style.flattening, edited: false };
    });
}

/** The pitch curve after correction. */
export function correctedFrames(take: Take, targets: ReturnType<typeof noteTargets>) {
    return take.frames.map((p, f) => {
        const i = take.owner[f];
        if (i < 0 || Number.isNaN(p)) return p;
        const { center, target, flattening } = targets[i];
        const shifted = p + (center - take.notes[i].median);
        return shifted + (target - shifted) * flattening;
    });
}

export function hasCorrection(edits: Edits) {
    return edits.style !== null || Object.keys(edits.manual).length > 0;
}

const NAMES = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"];

export function noteName(midi: number) {
    const m = Math.round(midi);
    return `${NAMES[((m % 12) + 12) % 12]}${Math.floor(m / 12) - 1}`;
}

export const isBlackKey = (midi: number) => [1, 3, 6, 8, 10].includes(((midi % 12) + 12) % 12);
export const frequency = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

/** "0:02.3" */
export function clock(seconds: number, digits = 1) {
    const s = Math.max(seconds, 0);
    return `${Math.floor(s / 60)}:${(s % 60).toFixed(digits).padStart(digits ? digits + 3 : 2, "0")}`;
}

/**
 * Sings the curve back: a sawtooth-like voice through "ah" formants, following the pitch sample by
 * sample, with short fades at the start and end of each note.
 */
export function renderVoice(take: Take, frames: number[]): Float32Array {
    const out = new Float32Array(Math.ceil(take.duration * SAMPLE_RATE));
    const perHop = SAMPLE_RATE * HOP;
    const formants = [[750, 90], [1150, 110], [2800, 170]];
    let phase = 0;
    let gains: number[] = [];
    for (let i = 0; i < out.length; i++) {
        const pos = i / perHop;
        const f = Math.floor(pos);
        const a = frames[f] ?? NaN, b = frames[f + 1] ?? NaN;
        if (Number.isNaN(a)) { phase = 0; continue; }
        const midi = Number.isNaN(b) ? a : a + (b - a) * (pos - f);
        const hz = frequency(midi);
        if (i % 256 === 0 || !gains.length) {
            gains = [];
            for (let k = 1; k * hz < 5000; k++) {
                const h = k * hz;
                const shape = formants.reduce((g, [fc, bw], j) => g + Math.exp(-(((h - fc) / bw) ** 2) / 2) / (j + 1), 0.05);
                gains.push(shape / Math.sqrt(k));
            }
        }
        phase += (2 * Math.PI * hz) / SAMPLE_RATE;
        let s = 0;
        for (let k = 0; k < gains.length; k++) s += gains[k] * Math.sin((k + 1) * phase);
        // Fade in and out around each note, found from the neighbouring hops.
        const note = take.notes[take.owner[f]];
        const t = i / SAMPLE_RATE;
        const env = Math.min(1, (t - note.start) / 0.03, (note.end - t) / 0.04);
        out[i] = 0.4 * s * Math.max(env, 0);
    }
    return out;
}

/** A 16-bit mono WAV file of `samples`. */
export function wav(samples: Float32Array) {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const v = new DataView(buffer);
    const text = (at: number, s: string) => [...s].forEach((c, i) => v.setUint8(at + i, c.charCodeAt(0)));
    text(0, "RIFF");
    v.setUint32(4, 36 + samples.length * 2, true);
    text(8, "WAVEfmt ");
    v.setUint32(16, 16, true);
    v.setUint16(20, 1, true);
    v.setUint16(22, 1, true);
    v.setUint32(24, SAMPLE_RATE, true);
    v.setUint32(28, SAMPLE_RATE * 2, true);
    v.setUint16(32, 2, true);
    v.setUint16(34, 16, true);
    text(36, "data");
    v.setUint32(40, samples.length * 2, true);
    samples.forEach((s, i) => v.setInt16(44 + i * 2, Math.max(-1, Math.min(1, s)) * 0x7fff, true));
    return new Blob([buffer], { type: "audio/wav" });
}
