export class SadMatchMusic {
  constructor(media, onChange = () => {}) {
    this.media = media;
    this.onChange = onChange;
    this.enabled = true;
    try { this.enabled = localStorage.getItem('sad-match-music') !== 'off'; } catch {}
    this.started = false;
    this.visible = true;
    this.failed = false;
    this.media.loop = true;
    this.media.volume = 0.3;
    this.media.addEventListener('error', () => {
      this.failed = true;
      this.onChange(this);
    });
  }

  async play() {
    if (!this.enabled || !this.visible || !this.started || !this.media.paused) return;
    try {
      await this.media.play();
      this.failed = false;
    } catch (error) {
      // Switching tabs or muting may cancel a pending play request.
      if (error.name === 'AbortError') return;
      this.failed = true;
    }
    this.onChange(this);
  }

  unlock() {
    this.started = true;
    void this.play();
  }

  toggle() {
    const retry = this.failed;
    this.enabled = retry || !this.enabled;
    this.failed = false;
    try { localStorage.setItem('sad-match-music', this.enabled ? 'on' : 'off'); } catch {}
    if (this.enabled) {
      if (retry) this.media.load();
      this.unlock();
    } else this.media.pause();
    this.onChange(this);
  }

  setVisible(visible) {
    this.visible = visible;
    if (!visible) this.media.pause();
    else void this.play();
  }
}
