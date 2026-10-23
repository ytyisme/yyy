"""Calibrate the three existing recordings; requires NumPy for authoring only.

By default macOS afconvert decodes the sources into a temporary directory.
Pass --wav id=/path/recording.wav to use an already decoded recording instead.
The game consumes the generated module and needs no Python audio dependency.
"""
from pathlib import Path
import argparse
import hashlib
import json
import subprocess
import tempfile
import wave
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
TRACKS = [('fireflies', 'song-4.m4a', 101, 106),
          ('rice', 'song-1.m4a', 80, 84), ('level', 'song-9.m4a', 147, 153)]


def calibrate(path, minimum, maximum):
    with wave.open(str(path)) as recording:
        rate = recording.getframerate()
        assert recording.getsampwidth() == 2, 'Use 16-bit PCM WAV'
        samples = np.frombuffer(recording.readframes(recording.getnframes()), dtype='<i2')
        samples = samples.reshape(-1, recording.getnchannels()).mean(axis=1) / 32768
    samples, rate = samples[::2], rate / 2
    size, hop = 1024, round(rate * .01)
    frames = np.lib.stride_tricks.sliding_window_view(samples, size)[::hop]
    spectra = [np.log1p(np.abs(np.fft.rfft(frames[i:i+512] * np.hanning(size), axis=1)) * 10)
               for i in range(0, len(frames), 512)]
    flux = np.maximum(0, np.diff(np.concatenate(spectra), axis=0)).mean(axis=1)
    novelty = np.maximum(0, flux - np.convolve(flux, np.ones(81) / 81, mode='same') * .75)
    novelty[:10] = 0
    envelope = np.convolve(novelty, np.array([1, 2, 3, 2, 1]) / 9, mode='same')
    envelope = np.minimum(envelope, np.quantile(envelope, .95))
    frame_rate, duration = rate / hop, len(samples) / rate
    # diff compares consecutive centred FFT windows; subtract half a hop to
    # timestamp the transient rather than the later frame's centre.
    center = size / (2 * rate) - hop / (2 * rate)
    indices = np.arange(len(envelope))
    best = (-1, 0, 0)
    for bpm in np.arange(minimum, maximum, .01):
        period = 60 / bpm
        phases, grid = np.arange(0, period, .005), np.arange(2, duration-2, period)
        values = np.interp(((grid[None, :] + phases[:, None] - center) * frame_rate).ravel(),
                           indices, envelope).reshape(len(phases), -1)
        scores = values.mean(axis=1)
        phase_index = int(scores.argmax())
        best = max(best, (float(scores[phase_index]), float(phases[phase_index]), float(bpm)))
    _, phase, bpm = best
    period = 60 / bpm
    start = (2 + phase) % period
    beats = []
    for predicted in np.arange(start, duration, period):
        if predicted < .025:
            continue
        low = max(0, round((predicted - .04 - center) * frame_rate))
        high = min(len(envelope), round((predicted + .04 - center) * frame_rate)+1)
        # A bounded adjustment follows recording timing without treating vocals
        # or every volume fluctuation as an extra beat.
        window = envelope[low:high]
        peak = low + int(window.argmax())
        strength = float(envelope[peak])
        at = peak / frame_rate + center if strength > np.quantile(envelope, .55) else predicted
        if 0 < at < duration:
            beats.append(round(float(at), 4))
    return {'bpm': round(bpm, 2), 'duration': round(duration, 6), 'beats': beats}


parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--wav', action='append', default=[])
args = parser.parse_args()
provided = dict(value.split('=', 1) for value in args.wav)
result = {}
with tempfile.TemporaryDirectory(prefix='lava-music-beats-') as temporary:
    for key, filename, minimum, maximum in TRACKS:
        original = ROOT / 'assets/concert' / filename
        path = Path(provided[key]) if key in provided else Path(temporary) / (key + '.wav')
        if key not in provided:
            subprocess.run(['rtk', 'proxy', 'afconvert', '-f', 'WAVE', '-d', 'LEI16', str(original), str(path)], check=True)
        chart = calibrate(path, minimum, maximum)
        chart['file'] = original.relative_to(ROOT).as_posix()
        chart['sha256'] = hashlib.sha256(original.read_bytes()).hexdigest()
        result[key] = chart
        print(json.dumps({'id': key, 'bpm': chart['bpm'], 'beats': len(chart['beats']), 'duration': chart['duration']}))
(ROOT / 'lib/music-maze-beats.mjs').write_text(
    '// Generated from the existing recordings by scripts/prepare-music-beats.py.\n'
    + 'export const MUSIC_BEAT_CHARTS=Object.freeze(' + json.dumps(result, separators=(',', ':')) + ');\n')
