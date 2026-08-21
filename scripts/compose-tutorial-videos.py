from __future__ import annotations

import math
import json
import os
import re
import asyncio
import shutil
import subprocess
import wave
from pathlib import Path

import imageio_ffmpeg
import edge_tts
import numpy as np
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
WORK = ROOT / ".data" / "tutorial-production"
RAW = WORK / "raw"
PUBLIC = ROOT / "tutoriales" / "media"
PRIVATE = ROOT / "output" / "tutoriales-privados"
JEFATURA_WEB = ROOT / "tutorial-jc" / "media"
CEAL_WEB = ROOT / "tutorial-ceal" / "media"
PORTAL_WEB = ROOT / "tutorial-portal" / "media"
FFMPEG = Path(imageio_ffmpeg.get_ffmpeg_exe())


def run(*args: str) -> None:
    subprocess.run([str(FFMPEG), "-y", "-hide_banner", *map(str, args)], check=True)


def duration(path: Path) -> float:
    process = subprocess.run(
        [str(FFMPEG), "-hide_banner", "-i", str(path), "-f", "null", "NUL"],
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    match = re.search(r"Duration:\s+(\d+):(\d+):(\d+(?:\.\d+)?)", process.stderr)
    if not match:
        raise RuntimeError(f"Could not read duration for {path}")
    hours, minutes, seconds = match.groups()
    return int(hours) * 3600 + int(minutes) * 60 + float(seconds)


def midi(note: float) -> float:
    return 440.0 * (2.0 ** ((note - 69.0) / 12.0))


def envelope(length: int, attack: float, release: float, sample_rate: int) -> np.ndarray:
    result = np.ones(length, dtype=np.float64)
    attack_samples = min(length, max(1, int(attack * sample_rate)))
    release_samples = min(length, max(1, int(release * sample_rate)))
    result[:attack_samples] = np.linspace(0.0, 1.0, attack_samples)
    result[-release_samples:] *= np.linspace(1.0, 0.0, release_samples)
    return result


def make_music(target: Path, seconds: float, variation: int) -> None:
    sample_rate = 48_000
    total = int((seconds + 0.8) * sample_rate)
    left = np.zeros(total, dtype=np.float64)
    right = np.zeros(total, dtype=np.float64)
    beat = 60.0 / 92.0
    progression = [
        (48, [60, 64, 67, 71]),
        (45, [57, 60, 64, 67]),
        (41, [53, 57, 60, 64]),
        (43, [55, 60, 62, 67]),
    ]
    chord_length = beat * 4
    chord_count = math.ceil((seconds + 1) / chord_length)

    for chord_index in range(chord_count):
        root, notes = progression[(chord_index + variation) % len(progression)]
        start_seconds = chord_index * chord_length
        start = int(start_seconds * sample_rate)
        length = min(total - start, int(chord_length * sample_rate))
        if length <= 0:
            break
        t = np.arange(length, dtype=np.float64) / sample_rate
        pad = np.zeros(length, dtype=np.float64)
        for note in notes:
            frequency = midi(note)
            pad += np.sin(2 * np.pi * frequency * t)
            pad += 0.18 * np.sin(2 * np.pi * frequency * 2 * t)
        pad *= envelope(length, 0.65, 0.85, sample_rate) * 0.014
        left[start:start + length] += pad * 0.94
        right[start:start + length] += pad * 1.02

        bass = np.sin(2 * np.pi * midi(root) * t) * envelope(length, 0.35, 0.7, sample_rate) * 0.022
        left[start:start + length] += bass
        right[start:start + length] += bass

        pattern = [0, 2, 1, 3, 2, 1, 0, 2]
        for pulse, note_index in enumerate(pattern):
            note_start_seconds = start_seconds + pulse * beat / 2
            note_start = int(note_start_seconds * sample_rate)
            note_length = min(total - note_start, int(beat * 0.72 * sample_rate))
            if note_length <= 0:
                continue
            nt = np.arange(note_length, dtype=np.float64) / sample_rate
            freq = midi(notes[(note_index + variation) % len(notes)] + 12)
            decay = np.exp(-4.8 * nt / max(beat, 0.01))
            pluck = (np.sin(2 * np.pi * freq * nt) + 0.25 * np.sin(2 * np.pi * freq * 2 * nt)) * decay * 0.034
            pan = 0.38 if pulse % 2 == 0 else 0.62
            left[note_start:note_start + note_length] += pluck * (1.0 - pan * 0.45)
            right[note_start:note_start + note_length] += pluck * (0.55 + pan * 0.45)

    fade = min(int(1.6 * sample_rate), total // 3)
    fade_curve = np.linspace(0.0, 1.0, fade)
    left[:fade] *= fade_curve
    right[:fade] *= fade_curve
    left[-fade:] *= fade_curve[::-1]
    right[-fade:] *= fade_curve[::-1]
    stereo = np.column_stack([left, right])
    peak = max(0.001, float(np.max(np.abs(stereo))))
    stereo = np.clip(stereo / peak * 0.48, -1.0, 1.0)
    pcm = (stereo * 32767).astype("<i2")

    target.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(target), "wb") as wav:
        wav.setnchannels(2)
        wav.setsampwidth(2)
        wav.setframerate(sample_rate)
        wav.writeframes(pcm.tobytes())


def capture_trim(raw: Path) -> float:
    manifest = raw.with_suffix('.capture.json')
    if not manifest.exists():
        return 0.0
    return max(0.0, float(json.loads(manifest.read_text(encoding='utf-8')).get('trimStartSeconds', 0.0)))


def encode_video_args(raw: Path, trim: float = 0.0) -> list[str]:
    return [
        "-loglevel", "error", "-ss", f"{trim:.3f}", "-i", str(raw), "-map_metadata", "-1",
        "-vf", "scale=1920:1080:flags=lanczos,format=yuv420p", "-r", "30",
        "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-profile:v", "main",
        "-level", "4.0", "-g", "30", "-keyint_min", "30", "-sc_threshold", "0", "-bf", "0",
        "-movflags", "+faststart",
    ]


def encode_visual(raw: Path, output: Path) -> Path:
    output.parent.mkdir(parents=True, exist_ok=True)
    run(*encode_video_args(raw, capture_trim(raw)), "-an", output)
    return output


def compose_music(raw: Path, output: Path, music: Path, variation: int, volume: float = 0.42) -> float:
    trim = capture_trim(raw)
    seconds = max(0.1, duration(raw) - trim)
    output.parent.mkdir(parents=True, exist_ok=True)
    make_music(music, seconds, variation)
    args = encode_video_args(raw, trim)
    args[6:6] = ["-i", str(music)]
    run(*args, "-map", "0:v:0", "-map", "1:a:0", "-c:a", "aac", "-b:a", "160k", "-af", f"volume={volume:.2f}", "-shortest", output)
    return seconds


def vtt_seconds(value: str) -> float:
    hours, minutes, seconds = value.split(":")
    return int(hours) * 3600 + int(minutes) * 60 + float(seconds)


def read_vtt_cues(path: Path) -> list[dict[str, float | str]]:
    blocks = re.split(r"\r?\n\s*\r?\n", path.read_text(encoding="utf-8").strip())
    cues: list[dict[str, float | str]] = []
    for block in blocks:
        lines = [line.strip() for line in block.splitlines() if line.strip()]
        timing_index = next((index for index, line in enumerate(lines) if " --> " in line), None)
        if timing_index is None:
            continue
        start, end = lines[timing_index].split(" --> ", 1)
        text = " ".join(lines[timing_index + 1:]).strip()
        if text:
            cues.append({"start": vtt_seconds(start), "end": vtt_seconds(end), "text": text})
    return cues


async def synthesize_voice(text: str, output: Path, voice: str, rate: str) -> None:
    spoken_text = re.sub(r"\bportal\b", "portál", text, flags=re.IGNORECASE)
    communicate = edge_tts.Communicate(text=spoken_text, voice=voice, rate=rate, volume="+0%")
    await communicate.save(str(output))


def make_narration_segments(vtt: Path, target_dir: Path, voice: str, rate: str) -> list[tuple[dict[str, float | str], Path]]:
    target_dir.mkdir(parents=True, exist_ok=True)
    cues = read_vtt_cues(vtt)

    async def build() -> None:
        for index, cue in enumerate(cues):
            output = target_dir / f"{index:02d}.mp3"
            await synthesize_voice(str(cue["text"]), output, voice, rate)

    asyncio.run(build())
    result: list[tuple[dict[str, float | str], Path]] = []
    for index, cue in enumerate(cues):
        source = target_dir / f"{index:02d}.mp3"
        available = max(1.0, float(cue["end"]) - float(cue["start"]) - 0.35)
        spoken = duration(source)
        if spoken > available:
            fitted = target_dir / f"{index:02d}-fit.mp3"
            speed = min(1.65, spoken / available)
            run("-loglevel", "error", "-i", source, "-filter:a", f"atempo={speed:.4f}", "-c:a", "libmp3lame", "-q:a", "2", fitted)
            source = fitted
        result.append((cue, source))
    return result


def compose_narrated(visual: Path, output: Path, vtt: Path, music: Path, variation: int, voice: str, rate: str) -> float:
    seconds = duration(visual)
    output.parent.mkdir(parents=True, exist_ok=True)
    make_music(music, seconds, variation)
    segments = make_narration_segments(vtt, WORK / "narration" / output.stem, voice, rate)
    inputs: list[str] = ["-loglevel", "error", "-i", str(visual), "-i", str(music)]
    for _, segment in segments:
        inputs.extend(["-i", str(segment)])
    filters = ["[1:a]volume=0.12[music]"]
    labels = ["[music]"]
    for index, (cue, _) in enumerate(segments):
        delay = max(0, int(float(cue["start"]) * 1000))
        input_index = index + 2
        label = f"voice{index}"
        filters.append(f"[{input_index}:a]adelay={delay}|{delay},apad,atrim=duration={seconds:.3f},aformat=sample_rates=48000:channel_layouts=stereo,volume=1.00[{label}]")
        labels.append(f"[{label}]")
    filters.append(f"{''.join(labels)}amix=inputs={len(labels)}:duration=first:dropout_transition=0,volume={len(labels)},alimiter=limit=0.94[outa]")
    run(
        *inputs,
        "-map_metadata", "-1",
        "-filter_complex", ";".join(filters),
        "-map", "0:v:0", "-map", "[outa]",
        "-c:v", "copy",
        "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", "-shortest", output
    )
    return seconds


def poster(video: Path, output: Path) -> None:
    png = output.with_suffix(".source.png")
    run("-loglevel", "error", "-ss", "2.2", "-i", video, "-frames:v", "1", png)
    with Image.open(png) as image:
        image.save(output, "WEBP", quality=90, method=6)
    png.unlink(missing_ok=True)


def main() -> None:
    PUBLIC.mkdir(parents=True, exist_ok=True)
    PRIVATE.mkdir(parents=True, exist_ok=True)
    JEFATURA_WEB.mkdir(parents=True, exist_ok=True)
    CEAL_WEB.mkdir(parents=True, exist_ok=True)
    PORTAL_WEB.mkdir(parents=True, exist_ok=True)
    target = os.environ.get("TUTORIAL_TARGET", "all").lower()
    compose_student = target in {"all", "student"}
    compose_jefatura = target in {"all", "jefatura"}
    compose_ceal = target in {"all", "ceal"}
    compose_portal = target in {"all", "portal"}
    student_narrated = PUBLIC / "solicitar-hora-narrado.mp4"
    student_male = PUBLIC / "solicitar-hora-hombre.mp4"
    jefatura_narrated = JEFATURA_WEB / "gestionar-atencion-jefatura-narrado.mp4"
    jefatura_male = JEFATURA_WEB / "gestionar-atencion-jefatura-hombre.mp4"
    ceal_narrated = CEAL_WEB / "gestionar-portal-ceal-narrado.mp4"
    portal_narrated = PORTAL_WEB / "recorrido-portal-narrado.mp4"
    portal_male = PORTAL_WEB / "recorrido-portal-hombre.mp4"
    student_seconds = None
    jefatura_seconds = None
    ceal_seconds = None
    portal_seconds = None
    if compose_portal:
        portal_visual = encode_visual(RAW / "recorrido-portal.webm", WORK / "visual" / "recorrido-portal.mp4")
        portal_seconds = compose_narrated(portal_visual, portal_narrated, PORTAL_WEB / "recorrido-portal.vtt", WORK / "portal-narrated-music.wav", 3, "es-CL-CatalinaNeural", "+1%")
        compose_narrated(portal_visual, portal_male, PORTAL_WEB / "recorrido-portal.vtt", WORK / "portal-narrated-music.wav", 3, "es-CL-LorenzoNeural", "+1%")
        poster(portal_narrated, PORTAL_WEB / "recorrido-portal-poster.webp")
        (PORTAL_WEB / "recorrido-portal-poster.png").unlink(missing_ok=True)
    if compose_student:
        student_visual = encode_visual(RAW / "solicitar-hora.webm", WORK / "visual" / "solicitar-hora.mp4")
        student_seconds = compose_narrated(student_visual, student_narrated, PUBLIC / "solicitar-hora.vtt", WORK / "student-narrated-music.wav", 0, "es-CL-CatalinaNeural", "+1%")
        compose_narrated(student_visual, student_male, PUBLIC / "solicitar-hora.vtt", WORK / "student-narrated-music.wav", 0, "es-CL-LorenzoNeural", "+1%")
        poster(student_narrated, PUBLIC / "solicitar-hora-poster.webp")
        (PUBLIC / "solicitar-hora.mp4").unlink(missing_ok=True)
        (PUBLIC / "solicitar-hora-poster.png").unlink(missing_ok=True)
    if compose_jefatura:
        jefatura_visual = encode_visual(RAW / "gestionar-atencion-jefatura.webm", WORK / "visual" / "gestionar-atencion-jefatura.mp4")
        jefatura_seconds = compose_narrated(jefatura_visual, jefatura_narrated, JEFATURA_WEB / "gestionar-atencion-jefatura.vtt", WORK / "jefatura-narrated-music.wav", 1, "es-CL-CatalinaNeural", "+1%")
        compose_narrated(jefatura_visual, jefatura_male, JEFATURA_WEB / "gestionar-atencion-jefatura.vtt", WORK / "jefatura-narrated-music.wav", 1, "es-CL-LorenzoNeural", "+1%")
        poster(jefatura_narrated, JEFATURA_WEB / "gestionar-atencion-jefatura-poster.webp")
        shutil.copy2(jefatura_narrated, PRIVATE / "gestionar-atencion-jefatura.mp4")
        shutil.copy2(jefatura_male, PRIVATE / "gestionar-atencion-jefatura-hombre.mp4")
        shutil.copy2(JEFATURA_WEB / "gestionar-atencion-jefatura.vtt", PRIVATE / "gestionar-atencion-jefatura.vtt")
        shutil.copy2(JEFATURA_WEB / "gestionar-atencion-jefatura-poster.webp", PRIVATE / "gestionar-atencion-jefatura-poster.webp")
        (JEFATURA_WEB / "gestionar-atencion-jefatura-musica.mp4").unlink(missing_ok=True)
        (PRIVATE / "gestionar-atencion-jefatura-musica.mp4").unlink(missing_ok=True)
        (JEFATURA_WEB / "gestionar-atencion-jefatura-poster.png").unlink(missing_ok=True)
    if compose_ceal:
        ceal_visual = encode_visual(RAW / "gestionar-portal-ceal.webm", WORK / "visual" / "gestionar-portal-ceal.mp4")
        ceal_seconds = compose_narrated(ceal_visual, ceal_narrated, CEAL_WEB / "gestionar-portal-ceal.vtt", WORK / "ceal-narrated-music.wav", 2, "es-CL-CatalinaNeural", "+1%")
        poster(ceal_narrated, CEAL_WEB / "gestionar-portal-ceal-poster.webp")
        (CEAL_WEB / "gestionar-portal-ceal-poster.png").unlink(missing_ok=True)
    print({
        "ok": True,
        "student_seconds": student_seconds,
        "jefatura_seconds": jefatura_seconds,
        "ceal_seconds": ceal_seconds,
        "portal_seconds": portal_seconds,
        "student_narrated_output": str(student_narrated),
        "student_male_output": str(student_male),
        "jefatura_narrated_output": str(jefatura_narrated),
        "jefatura_male_output": str(jefatura_male),
        "ceal_narrated_output": str(ceal_narrated),
        "portal_narrated_output": str(portal_narrated),
        "portal_male_output": str(portal_male),
    })


if __name__ == "__main__":
    main()
