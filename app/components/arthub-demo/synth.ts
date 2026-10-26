import type { Track } from "./library";

// Plays the demo's songs: a small band synthesized with Web Audio from each song's tempo and chords
// (pad, bass, arpeggio and a soft beat), scheduled a little ahead of the clock.

const LOOKAHEAD = 0.15;
// Chord qualities by semitones above the root: the major key's ii, iii and vi are minor.
const MINOR = new Set([2, 4, 9]);
const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

export class SongPlayer {
    private ctx: AudioContext | null = null;
    private master: GainNode | null = null;
    private noise: AudioBuffer | null = null;
    private timer: ReturnType<typeof setInterval> | null = null;
    private track: Track | null = null;
    /** Context time at which the song's position was 0. */
    private origin = 0;
    private nextBeat = 0;
    private pausedAt = 0;
    playing = false;
    volume = 0.7;
    onEnded: () => void = () => {};

    get position() {
        if (!this.playing || !this.ctx) return this.pausedAt;
        return Math.max(this.ctx.currentTime - this.origin, 0);
    }

    setVolume(v: number) {
        this.volume = v;
        if (this.master && this.ctx) this.master.gain.setTargetAtTime(v * 0.5, this.ctx.currentTime, 0.02);
    }

    play(track: Track, from = 0) {
        if (!this.ctx) {
            this.ctx = new AudioContext();
            this.master = this.ctx.createGain();
            this.master.gain.value = this.volume * 0.5;
            this.master.connect(this.ctx.destination);
            this.noise = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.2, this.ctx.sampleRate);
            const data = this.noise.getChannelData(0);
            for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        }
        void this.ctx.resume();
        this.stopVoices();
        this.track = track;
        this.origin = this.ctx.currentTime - from;
        this.nextBeat = Math.ceil((from * track.bpm) / 60);
        this.playing = true;
        this.timer = setInterval(() => this.schedule(), 25);
        this.schedule();
    }

    pause() {
        this.pausedAt = this.position;
        this.playing = false;
        this.stopVoices();
    }

    /** Stops and forgets the song. */
    stop() {
        this.pause();
        this.pausedAt = 0;
        this.track = null;
    }

    close() {
        this.stop();
        void this.ctx?.close();
        this.ctx = null;
    }

    private stopVoices() {
        if (this.timer) clearInterval(this.timer);
        this.timer = null;
        // Fade out what is already scheduled by swapping in a new output.
        if (this.ctx && this.master) {
            const old = this.master;
            old.gain.setTargetAtTime(0, this.ctx.currentTime, 0.03);
            setTimeout(() => old.disconnect(), 300);
            this.master = this.ctx.createGain();
            this.master.gain.value = this.volume * 0.5;
            this.master.connect(this.ctx.destination);
        }
    }

    private schedule() {
        const { ctx, track } = this;
        if (!ctx || !track || !this.playing) return;
        if (this.position >= track.seconds) {
            this.pause();
            this.pausedAt = 0;
            this.onEnded();
            return;
        }
        const beat = 60 / track.bpm;
        while (this.origin + this.nextBeat * beat < ctx.currentTime + LOOKAHEAD) {
            this.playBeat(this.nextBeat, this.origin + this.nextBeat * beat, beat, track);
            this.nextBeat++;
        }
    }

    private playBeat(n: number, at: number, beat: number, track: Track) {
        const bar = Math.floor(n / 4);
        const inBar = n % 4;
        const degree = track.chords[bar % track.chords.length];
        const root = track.album.root + degree;
        const triad = [0, MINOR.has(degree % 12) ? 3 : 4, 7];
        // The first bars are an intro: pad only, then the band comes in.
        const full = bar >= 2;

        if (inBar === 0) for (const t of triad) this.tone(hz(root + t), at, beat * 4, "triangle", 0.05, 0.4, 0.8, 900);
        if (full && inBar % 2 === 0) this.tone(hz(root - 12), at, beat * 1.6, "sine", 0.22, 0.01, 0.3);
        if (full) {
            for (let half = 0; half < 2; half++) {
                const step = (n * 2 + half) % 6;
                const note = root + 12 + [0, triad[1], 7, 12, 7, triad[1]][step];
                this.tone(hz(note), at + (half * beat) / 2, beat * 0.45, "square", 0.025, 0.005, 0.15, 2400);
            }
        }
        if (full && inBar % 2 === 0) this.kick(at);
        if (full) this.hat(at + beat / 2);
    }

    private tone(freq: number, at: number, length: number, type: OscillatorType, level: number, attack: number, release: number, cutoff?: number) {
        const ctx = this.ctx!;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, at);
        gain.gain.linearRampToValueAtTime(level, at + attack);
        gain.gain.setTargetAtTime(0, at + length, release / 3);
        let out: AudioNode = osc;
        if (cutoff) {
            const filter = ctx.createBiquadFilter();
            filter.frequency.value = cutoff;
            osc.connect(filter);
            out = filter;
        }
        out.connect(gain).connect(this.master!);
        osc.start(at);
        osc.stop(at + length + release + 0.1);
    }

    private kick(at: number) {
        const ctx = this.ctx!;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(120, at);
        osc.frequency.exponentialRampToValueAtTime(45, at + 0.15);
        gain.gain.setValueAtTime(0.35, at);
        gain.gain.exponentialRampToValueAtTime(0.001, at + 0.25);
        osc.connect(gain).connect(this.master!);
        osc.start(at);
        osc.stop(at + 0.3);
    }

    private hat(at: number) {
        const ctx = this.ctx!;
        const src = ctx.createBufferSource();
        src.buffer = this.noise;
        const filter = ctx.createBiquadFilter();
        filter.type = "highpass";
        filter.frequency.value = 7000;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.06, at);
        gain.gain.exponentialRampToValueAtTime(0.001, at + 0.05);
        src.connect(filter).connect(gain).connect(this.master!);
        src.start(at);
        src.stop(at + 0.06);
    }
}
