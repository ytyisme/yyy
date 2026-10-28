import {matchRating} from './sad-match.mjs?v=ratings';
const CLIPS = ['clear', 'good', 'great', 'excellent'];

export class SadMatchAudio {
  constructor({onChange = () => {}, contextFactory, fetchAudio} = {}) {
    this.onChange = onChange;
    this.contextFactory = contextFactory || (() => new (window.AudioContext || window.webkitAudioContext)());
    this.fetchAudio = fetchAudio || (async name => {
      const response = await fetch(new URL(`../assets/sad-match/audio/${name}.mp3`, import.meta.url));
      if (!response.ok) throw new Error('音效加载失败');
      return response.arrayBuffer();
    });
    this.enabled = true;
    try { this.enabled = localStorage.getItem('sad-match-sound') !== 'off'; } catch {}
    this.failed = false;
    this.buffers = new Map();
    this.source = null;
    this.voice = null;
  }

  async unlock() {
    if (!this.enabled) return;
    try {
      this.context ||= this.contextFactory();
      // Resume directly from the user's pointer/keyboard event, before awaiting fetches.
      const resumed = this.context.resume();
      this.loading ||= Promise.all(CLIPS.map(async name => {
        const buffer = await this.context.decodeAudioData(await this.fetchAudio(name));
        this.buffers.set(name, buffer);
      }));
      await Promise.all([resumed, this.loading]);
      this.failed = false;
    } catch {
      this.failed = true;
      this.loading = null;
    }
    this.onChange(this);
  }

  toggle() {
    this.enabled = this.failed || !this.enabled;
    this.failed = false;
    try { localStorage.setItem('sad-match-sound', this.enabled ? 'on' : 'off'); } catch {}
    this.stop();
    this.onChange(this);
    if (this.enabled) void this.unlock();
  }

  play(chain) {
    this.playClip('clear', 'source');
  }

  praise(chain) {
    this.playClip(matchRating(chain).id, 'voice');
  }

  playClip(name, channel) {
    if (!this.enabled || this.failed || this.context?.state !== 'running') return;
    const buffer = this.buffers.get(name);
    if (!buffer) return; // Never play a late sound after its animation has finished.
    // Effects and praise have separate channels: a new move must not cut off a word.
    this.stopChannel(channel);
    const source = this.context.createBufferSource();
    const gain = this.context.createGain();
    source.buffer = buffer;
    gain.gain.value = 0.65;
    source.connect(gain); gain.connect(this.context.destination);
    source.onended = () => {
      source.disconnect(); gain.disconnect();
      if (this[channel] === source) this[channel] = null;
    };
    this[channel] = source;
    source.start();
  }

  stop() {
    this.stopChannel('source');
    this.stopChannel('voice');
  }

  stopChannel(channel) {
    if (this[channel]) { this[channel].stop(); this[channel] = null; }
  }
}
