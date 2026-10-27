"""Compose an original, reproducible instrumental bed; no samples or services.

Run with Python + numpy + imageio_ffmpeg. Writes only the guided music and report.
The score uses warm electric-piano voicings, a restrained bass line and brushed
percussion. Twenty-four bars at 93 BPM fit the 62-second guide with a soft ending.
"""
from pathlib import Path
import hashlib
import json
import math
import subprocess
import tempfile
import wave

import imageio_ffmpeg
import numpy as np

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'assets/tutorial-guided/music/accompaniment.wav'
REPORT = ROOT / 'output/release-20261026/tutorial-guided/music-report.json'
RATE, SECONDS, BPM = 48000, 62.0, 93
BEAT = 60 / BPM
RNG = np.random.default_rng(20261026)
MIX = np.zeros((round(SECONDS * RATE), 2), dtype=np.float64)


def freq(note):
    return 440 * 2 ** ((note - 69) / 12)


def place(signal, second, gain=1, pan=0):
    start = round(second * RATE)
    if start >= len(MIX):
        return
    signal = signal[:len(MIX) - start]
    # Narrow, comfortable stereo image, with centered low instruments.
    MIX[start:start + len(signal), 0] += signal * gain * math.sqrt((1 - pan) / 2)
    MIX[start:start + len(signal), 1] += signal * gain * math.sqrt((1 + pan) / 2)


def key(note, seconds=1.6, soft=False):
    t = np.arange(round(seconds * RATE)) / RATE
    f = freq(note)
    # Decaying harmonics and slow tremolo create a mellow struck-key timbre.
    tone = np.sin(2 * np.pi * f * t) * np.exp(-t / 1.05)
    tone += .24 * np.sin(2 * np.pi * 2.002 * f * t) * np.exp(-t / .46)
    tone += .055 * np.sin(2 * np.pi * 3 * f * t) * np.exp(-t / .20)
    tone *= (1 - np.exp(-t / (.017 if soft else .009)))
    tone *= .97 + .03 * np.sin(2 * np.pi * 4.4 * t)
    tone *= np.minimum(1, (seconds - t) / .18)
    return tone


def bass(note):
    t = np.arange(round(.8 * RATE)) / RATE
    tone = np.sin(2 * np.pi * freq(note) * t)
    tone += .16 * np.sin(2 * np.pi * 2 * freq(note) * t)
    return tone * (1 - np.exp(-t / .013)) * np.exp(-t / .30) * np.minimum(1, (.8 - t) / .12)


def kick():
    t = np.arange(round(.24 * RATE)) / RATE
    phase = 2 * np.pi * (48 * t + 28 * .027 * (1 - np.exp(-t / .027)))
    return np.sin(phase) * np.exp(-t / .065) * (1 - np.exp(-t / .002))


def brush(seconds, decay, width):
    t = np.arange(round(seconds * RATE)) / RATE
    noise = RNG.normal(0, 1, len(t))
    # Band-limited noise avoids sharp cymbal-like transients.
    noise = np.convolve(noise, np.ones(width) / width, mode='same')
    noise -= np.convolve(noise, np.ones(181) / 181, mode='same')
    return noise * np.exp(-t / decay) * (1 - np.exp(-t / .003))


def compose():
    chords = [(36, [55, 59, 64, 67]), (33, [55, 60, 64, 69]),
              (29, [57, 60, 64, 67]), (31, [55, 60, 62, 67])]
    for bar in range(24):
        root, notes = chords[(bar // 2) % 4]
        if bar == 23:
            root, notes = chords[0]  # Resolve the last phrase before the fade.
        start = bar * 4 * BEAT
        # A two-bar comping pattern, with gently different phrase intensity.
        energy = .88 if bar < 4 or 16 <= bar < 20 else 1.0
        offsets = [0, 1.5, 3] if bar % 2 == 0 else [.5, 2.5]
        if bar >= 22:
            offsets = [0, 2] if bar == 22 else [0]
        for hit, offset in enumerate(offsets):
            for voice, note in enumerate(notes):
                place(key(note, 1.8), start + offset * BEAT + voice * .009,
                      .035 * energy * (1 if hit == 0 else .70), (voice - 1.5) * .12)
        for offset, note in [(0, root + 12), (2.5, root + (19 if bar % 2 else 12))]:
            if bar == 23 and offset:
                continue
            place(bass(note), start + offset * BEAT, .085 * energy)
        # A restrained backbeat and quiet swung shakers keep motion in the guide.
        if bar < 23:
            for offset in [0, 2]:
                place(kick(), start + offset * BEAT, .055 * energy)
            for offset in [1, 3]:
                place(brush(.20, .045, 17), start + offset * BEAT, .075 * energy, -.12)
            if bar >= 2:
                for eighth in range(8):
                    offset = eighth / 2 + (.045 if eighth % 2 else 0)
                    place(brush(.09, .022, 9), start + offset * BEAT,
                          (.020 if eighth % 2 else .013) * energy, .22)
        # Short original answering gestures, separated by several seconds.
        if bar in [5, 9, 13, 21]:
            motif = [(0.5, notes[2]), (1.5, notes[3]), (3, notes[1] + 12)]
            for offset, note in motif:
                place(key(note, 1.25, True), start + offset * BEAT, .026, .14)
    # Small room reflections; direct sound stays clear and centered.
    dry = MIX.copy()
    for delay, gain in [(.047, .11), (.079, .07), (.131, .04)]:
        n = round(delay * RATE)
        MIX[n:] += dry[:-n, ::-1] * gain
    MIX[:RATE] *= np.linspace(0, 1, RATE)[:, None]
    MIX[-2 * RATE:] *= np.linspace(1, 0, 2 * RATE)[:, None] ** 1.3


def write_wav(path, audio):
    with wave.open(str(path), 'wb') as stream:
        stream.setnchannels(2)
        stream.setsampwidth(2)
        stream.setframerate(RATE)
        stream.writeframes(np.round(np.clip(audio, -1, 1) * 32767).astype('<i2').tobytes())


def measure(ffmpeg, path):
    process = subprocess.run([ffmpeg, '-hide_banner', '-i', str(path), '-af',
                              'loudnorm=I=-23:TP=-2:LRA=8:print_format=json',
                              '-f', 'null', '-'], capture_output=True, text=True)
    if process.returncode:
        raise RuntimeError(process.stderr)
    return json.loads(process.stderr[process.stderr.rfind('{'):])


def main():
    compose()
    OUT.parent.mkdir(parents=True, exist_ok=True)
    REPORT.parent.mkdir(parents=True, exist_ok=True)
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    with tempfile.TemporaryDirectory(prefix='guide-music-') as work:
        raw = Path(work) / 'original.wav'
        write_wav(raw, MIX)
        metrics = measure(ffmpeg, raw)
        gain_db = min(-23 - float(metrics['input_i']), -2.1 - float(metrics['input_tp']))
        subprocess.run([ffmpeg, '-y', '-hide_banner', '-loglevel', 'error', '-i', str(raw),
                        '-af', 'volume=%.6fdB' % gain_db, '-ar', str(RATE),
                        '-c:a', 'pcm_s16le', '-map_metadata', '-1', str(OUT)], check=True)
    final = measure(ffmpeg, OUT)
    with wave.open(str(OUT), 'rb') as stream:
        pcm = np.frombuffer(stream.readframes(stream.getnframes()), dtype='<i2') / 32768
        frames = stream.getnframes()
    report = {
        'asset': OUT.relative_to(ROOT).as_posix(),
        'sha256': hashlib.sha256(OUT.read_bytes()).hexdigest(),
        'durationSeconds': frames / RATE, 'channels': 2, 'sampleRate': RATE,
        'bpm': BPM, 'integratedLufs': float(final['input_i']),
        'truePeakDbtp': float(final['input_tp']), 'loudnessRangeLu': float(final['input_lra']),
        'clippedSamples': int(np.sum(np.abs(pcm) >= 1)),
        'provenance': 'Original deterministic score and synthesis in build-guide-music.py; no external audio, samples, voices, APIs or paid services.',
        'seed': 20261026, 'fadeInSeconds': 1, 'fadeOutSeconds': 2,
        'arrangement': '24 bars at 93 BPM; warm electric piano, restrained bass, soft kick, brushed backbeat and low shaker; sparse answering motifs and softer middle passage.',
        'validation': 'Duration, format, loudness and true peak measured using wave/numpy/FFmpeg. No listening evaluation claimed.',
    }
    assert report['durationSeconds'] == SECONDS
    assert report['truePeakDbtp'] <= -2
    assert abs(report['integratedLufs'] + 23) < .2
    REPORT.write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(report, indent=2))


if __name__ == '__main__':
    main()
