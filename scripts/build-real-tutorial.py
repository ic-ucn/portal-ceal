"""Build an annotated audiovisual guide from immutable Computer Use PNGs.

The indicators are editorial emphasis, never recorded clicks. --sample writes
short review media only. No browser automation or UI recreation is involved.
"""
from pathlib import Path
import argparse
import asyncio
import hashlib
import json
import math
import re
import runpy
import subprocess
import wave

import edge_tts
import imageio_ffmpeg
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets/tutorial-real"
WORK = ROOT / ".data/tutorial-real"
FPS = 15
RATE = 48000
VOICE = "es-CL-CatalinaNeural"
VOICE_RATE = "+0%"
CHAPTERS = ("malla", "aprobados", "mis-ramos", "eligible", "material", "calendario")
FFMPEG = str(next(iter((ROOT / ".data/media-tools/imageio_ffmpeg/binaries").glob("ffmpeg*.exe")), Path(imageio_ffmpeg.get_ffmpeg_exe())))


def run(args):
    subprocess.run([FFMPEG, "-y", "-hide_banner", "-loglevel", "error"] + list(map(str, args)), check=True)


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def duration(path):
    probe = subprocess.run([FFMPEG, "-hide_banner", "-i", str(path)], capture_output=True, encoding="utf-8", errors="replace")
    match = re.search(r"Duration:\s+(\d+):(\d+):(\d+(?:\.\d+)?)", probe.stderr)
    if not match:
        raise RuntimeError("Cannot measure media: " + str(path))
    h, m, s = match.groups()
    return int(h) * 3600 + int(m) * 60 + float(s)


def wav_read(path):
    with wave.open(str(path), "rb") as stream:
        if stream.getframerate() != RATE or stream.getsampwidth() != 2:
            raise ValueError("Expected 48kHz PCM16")
        return np.frombuffer(stream.readframes(stream.getnframes()), dtype="<i2").astype(np.float64).reshape(-1, stream.getnchannels()) / 32768


def wav_write(path, samples):
    with wave.open(str(path), "wb") as stream:
        stream.setnchannels(samples.shape[1])
        stream.setsampwidth(2)
        stream.setframerate(RATE)
        stream.writeframes((np.clip(samples, -1, 1) * 32767).astype("<i2").tobytes())


async def narration(items):
    cache = WORK / "narration"
    cache.mkdir(parents=True, exist_ok=True)
    result = []
    for item in items:
        text = item["caption"].replace("Cálculo 1", "Cálculo uno")
        key = hashlib.sha256((VOICE + VOICE_RATE + text).encode("utf-8")).hexdigest()
        mp3, pcm = cache / (key + ".mp3"), cache / (key + ".wav")
        if not pcm.exists():
            if not mp3.exists():
                pending = cache / (key + ".pending.mp3")
                try:
                    await edge_tts.Communicate(text=text, voice=VOICE, rate=VOICE_RATE).save(str(pending))
                    pending.replace(mp3)
                except Exception as error:
                    pending.unlink(missing_ok=True)
                    raise RuntimeError("Catalina narration endpoint failed; voice variant was not produced") from error
            run(["-i", mp3, "-ar", RATE, "-ac", 1, "-c:a", "pcm_s16le", pcm])
        audio = wav_read(pcm)
        seconds = len(audio) / RATE
        words = len(item["caption"].split())
        readable = max(4.5, 1.0 + words / 2.7)
        step_seconds = math.ceil(max(seconds + 0.6, readable) * FPS) / FPS
        result.append((audio, seconds, step_seconds, key))
        print("Narration", item["id"], round(seconds, 3), "step", round(step_seconds, 3), flush=True)
    return result


def load_story(path):
    story = json.loads(path.read_text(encoding="utf-8-sig"))
    if story.get("captureMethod") != "computer-use":
        raise ValueError("Require Computer Use source images")
    for name, recording in story["formats"].items():
        seen = []
        for item in recording["steps"]:
            image = (ROOT / item["image"]).resolve()
            image.relative_to((OUT / name).resolve())
            with Image.open(image) as capture:
                size = list(capture.size)
                capture.verify()
            if size != [item["target"]["sourceWidth"], item["target"]["sourceHeight"]]:
                raise ValueError("Source coordinate dimensions differ: " + item["id"])
            if sha(image) != item["sha256"]:
                raise ValueError("Original source hash changed: " + str(image))
            if not seen or seen[-1] != item["chapter"]:
                seen.append(item["chapter"])
        if tuple(seen) != CHAPTERS:
            raise ValueError("Require six contiguous chapters")
    desktop = story["formats"]["desktop"]["steps"]
    mobile = story["formats"]["mobile"]["steps"]
    if [(s["id"], s["caption"]) for s in desktop] != [(s["id"], s["caption"]) for s in mobile]:
        raise ValueError("Both formats must share captions and timeline")
    return story


def smooth(value):
    value = min(1.0, max(0.0, value))
    return value * value * (3 - 2 * value)


def fit_source(item, size):
    source = Image.open(ROOT / item["image"]).convert("RGB")
    width, height = size
    scale = min(width / source.width, height / source.height)
    fitted = source.resize((round(source.width * scale), round(source.height * scale)), Image.Resampling.LANCZOS)
    left, top = (width - fitted.width) // 2, (height - fitted.height) // 2
    base = Image.new("RGB", size, "#f8f9f7")
    base.paste(fitted, (left, top))
    target = item["target"]
    return base, (left + target["x"] * scale, top + target["y"] * scale)


def indicator(name):
    # Arrow is 48px tall; mobile is a 44px touch-style ring, never a click ripple.
    canvas = Image.new("RGBA", (80, 80))
    drawing = ImageDraw.Draw(canvas)
    if name == "desktop":
        polygon = [(15, 10), (15, 52), (27, 40), (37, 58), (46, 53), (36, 36), (52, 35)]
        shadow = Image.new("RGBA", canvas.size)
        ImageDraw.Draw(shadow).polygon([(x + 2, y + 3) for x, y in polygon], fill=(0, 0, 0, 155))
        canvas = Image.alpha_composite(canvas, shadow.filter(ImageFilter.GaussianBlur(3)))
        drawing = ImageDraw.Draw(canvas)
        drawing.polygon(polygon, fill="#133f37", outline="#ffffff", width=2)
        anchor = (15, 10)
    else:
        drawing.ellipse((16, 16, 60, 60), fill=(255, 255, 255, 25), outline=(0, 0, 0, 120), width=7)
        drawing.ellipse((16, 16, 60, 60), outline="#ffffff", width=5)
        drawing.ellipse((18, 18, 58, 58), outline="#176b57", width=3)
        anchor = (38, 38)
    return canvas, anchor


def frame_at(base, target, item, name, t, seconds, marker):
    # Brief focal reading zoom, stable hold, return to whole capture before cut.
    width, height = base.size
    zoom = 1 if name == "mobile" else min(1.3, item["target"].get("zoomSuggested", 1))
    strength = smooth((t - 0.3) / 0.4) * smooth((seconds - 0.4 - t) / 0.4)
    z = 1 + (zoom - 1) * strength
    crop_width, crop_height = width / z, height / z
    cx, cy = target
    x0 = min(max(cx - crop_width / 2, 0), width - crop_width)
    y0 = min(max(cy - crop_height / 2, 0), height - crop_height)
    if z > 1.001:
        frame = base.crop((round(x0), round(y0), round(x0 + crop_width), round(y0 + crop_height))).resize(base.size, Image.Resampling.LANCZOS)
    else:
        frame = base.copy()
    # Appear, make one 0.6 second approach, hold, fade out; no idle movement.
    opacity = smooth((t - 0.15) / 0.2) * smooth((min(4.2, seconds - 0.7) - t) / 0.3)
    approach = 1 - smooth((t - 0.25) / 0.6)
    x, y = (cx - x0) * z + 26 * approach, (cy - y0) * z + 18 * approach
    overlay, anchor = marker
    if opacity > 0:
        shown = overlay.copy()
        shown.putalpha(shown.getchannel("A").point(lambda a: round(a * opacity)))
        frame.paste(shown, (round(x - anchor[0]), round(y - anchor[1])), shown)
    return frame


def render_video(recording, name, durations, output, samples=False):
    size = (recording["width"], recording["height"])
    marker = indicator(name)
    process = subprocess.Popen([FFMPEG, "-y", "-hide_banner", "-loglevel", "error", "-f", "rawvideo", "-pixel_format", "rgb24", "-video_size", "%sx%s" % size, "-framerate", str(FPS), "-i", "pipe:0", "-an", "-c:v", "libx264", "-preset", "fast", "-crf", "20", "-pix_fmt", "yuv420p", "-g", str(FPS), "-movflags", "+faststart", "-map_metadata", "-1", str(output)], stdin=subprocess.PIPE)
    try:
        for index, (item, seconds) in enumerate(zip(recording["steps"], durations)):
            if samples and index != 2:
                continue
            if samples:
                seconds = 3
            base, target = fit_source(item, size)
            for number in range(round(seconds * FPS)):
                frame = frame_at(base, target, item, name, number / FPS, seconds, marker)
                if samples and number in (0, 15, 35):
                    frame.save(WORK / ("sample-%s-%s.png" % (name, number)))
                process.stdin.write(frame.tobytes())
            print("Rendered", name, item["id"], flush=True)
    finally:
        process.stdin.close()
    if process.wait() != 0:
        raise RuntimeError("Video encoder failed")


def vtt_time(seconds):
    ms = round(seconds * 1000)
    return "%02d:%02d:%02d.%03d" % (ms // 3600000, ms // 60000 % 60, ms // 1000 % 60, ms % 1000)


def create_audio(segments):
    total = sum(segment[2] for segment in segments)
    count = round(total * RATE)
    voice = np.zeros((count, 2), dtype=np.float64)
    cursor, active_ranges = 0, []
    for audio, seconds, step_seconds, key in segments:
        first = round(cursor * RATE)
        voice[first:first + len(audio)] = np.repeat(audio, 2, axis=1)
        active_ranges.append((first, first + len(audio)))
        cursor += step_seconds
    # Only import the existing deterministic original music function, never its pipeline.
    make_music = runpy.run_path(str(ROOT / "scripts/compose-tutorial-videos.py"))["make_music"]
    raw_music = WORK / "music-original.wav"
    make_music(raw_music, total, 3)
    low_music = WORK / "music-soft.wav"
    run(["-i", raw_music, "-af", "lowpass=f=1600,highpass=f=80", "-t", total, "-c:a", "pcm_s16le", low_music])
    music = wav_read(low_music)[:count]
    # Balance is measured in 0.4s windows where voice has useful energy.
    # Applying a global gain from the weakest measured window keeps every such
    # window >=20dB under voice, rather than claiming integrated loudness proves it.
    windows = []
    for first, last in active_ranges:
        for a in range(first, last, int(0.4 * RATE)):
            b = min(last, a + int(0.4 * RATE))
            vr = float(np.sqrt(np.mean(voice[a:b] ** 2)))
            mr = float(np.sqrt(np.mean(music[a:b] ** 2)))
            if vr > 10 ** (-40 / 20) and mr > 0:
                windows.append((vr, mr))
    if not windows:
        raise ValueError("Narration contains no measurable speech")
    gain = min(0.08, min(v / m for v, m in windows) * 10 ** (-22 / 20))
    music *= gain
    fades = min(count // 3, RATE)
    music[:fades] *= np.linspace(0, 1, fades)[:, None]
    music[-fades:] *= np.linspace(1, 0, fades)[:, None]
    mixed = voice + music
    if np.max(np.abs(mixed)) >= 0.99:
        raise ValueError("Audio mixing would clip")
    for kind, signal in (("voice", voice), ("music", music), ("voiceMusic", mixed)):
        wav_write(WORK / (kind + ".wav"), signal)
    return {"voice": VOICE, "rate": VOICE_RATE, "sampleRate": RATE, "musicSource": "original repository composition; lowpass 1600Hz", "musicGain": gain, "balanceWindowSeconds": 0.4, "speechEnergyThresholdDbFS": -40, "minimumMusicBelowVoiceDb": round(min(20 * math.log10(v / (m * gain)) for v, m in windows), 3), "measuredSpeechWindows": len(windows), "mixedPeakDbFS": round(20 * math.log10(float(np.max(np.abs(mixed)))), 3), "accessibilityNote": "Measured narration/music balance only; no global AAA compliance claim."}


def verify_media(result):
    report = {"formats": {}, "sourceImagesUntouched": True}
    for name, recording in result["formats"].items():
        hashes, streams = [], {}
        for kind, relative in recording["variants"].items():
            path = ROOT / relative
            info = subprocess.run([FFMPEG, "-hide_banner", "-i", str(path)], capture_output=True, encoding="utf-8", errors="replace").stderr
            video_lines = [line for line in info.splitlines() if "Stream #" in line and "Video:" in line]
            audio_lines = [line for line in info.splitlines() if "Stream #" in line and "Audio:" in line]
            if len(video_lines) != 1 or len(audio_lines) != (0 if kind == "silent" else 1):
                raise ValueError("Wrong stream counts: " + relative)
            expected_size = "%sx%s" % (recording["width"], recording["height"])
            if expected_size not in video_lines[0] or abs(duration(path) - recording["duration"]) > 0.08:
                raise ValueError("Media dimension/timeline mismatch: " + relative)
            hashed = subprocess.run([FFMPEG, "-hide_banner", "-loglevel", "error", "-i", str(path), "-map", "0:v:0", "-c", "copy", "-f", "hash", "-hash", "sha256", "pipe:1"], check=True, capture_output=True, encoding="utf-8").stdout.strip()
            hashes.append(hashed)
            streams[kind] = {"videoStreams": len(video_lines), "audioStreams": len(audio_lines), "compressedVideoStreamHash": hashed}
        if len(set(hashes)) != 1:
            raise ValueError("Variant video streams differ")
        for item in recording["steps"]:
            if sha(ROOT / item["image"]) != item["sha256"]:
                raise ValueError("Source image changed")
        report["formats"][name] = {"sameCompressedVideoStream": True, "streams": streams}
        for kind in ("silent", "voiceMusic"):
            run(["-i", ROOT / recording["variants"][kind], "-f", "null", "NUL"])
    # Measure the separately muxed AAC tracks after actual decode as a second
    # check on encoder quantization; this does not claim full accessibility.
    recording = result["formats"]["desktop"]
    decoded = {}
    for kind in ("voice", "music"):
        samples = subprocess.run([FFMPEG, "-hide_banner", "-loglevel", "error", "-i", str(ROOT / recording["variants"][kind]), "-map", "0:a:0", "-f", "f32le", "-ac", "2", "-ar", str(RATE), "pipe:1"], check=True, capture_output=True).stdout
        decoded[kind] = np.frombuffer(samples, dtype="<f4").reshape(-1, 2)
    balances = []
    for item in recording["steps"]:
        first, last = round(item["start"] * RATE), round((item["start"] + item["voiceDuration"]) * RATE)
        for a in range(first, last, int(0.4 * RATE)):
            b = min(last, a + int(0.4 * RATE))
            vr = float(np.sqrt(np.mean(decoded["voice"][a:b] ** 2)))
            mr = float(np.sqrt(np.mean(decoded["music"][a:b] ** 2)))
            if vr > 10 ** (-40 / 20) and mr > 0:
                balances.append(20 * math.log10(vr / mr))
    if not balances or min(balances) < 20:
        raise ValueError("AAC music balance below 20dB objective")
    report["aacDecodedMinimumMusicBelowVoiceDb"] = round(min(balances), 3)
    report["aacDecodedMeasuredSpeechWindows"] = len(balances)
    mixed_bytes = subprocess.run([FFMPEG, "-hide_banner", "-loglevel", "error", "-i", str(ROOT / recording["variants"]["voiceMusic"]), "-map", "0:a:0", "-f", "f32le", "pipe:1"], check=True, capture_output=True).stdout
    mixed_peak = float(np.max(np.abs(np.frombuffer(mixed_bytes, dtype="<f4"))))
    if mixed_peak >= 0.99:
        raise ValueError("AAC mixed track would clip")
    report["mixedAacPeakDbFS"] = round(20 * math.log10(mixed_peak), 3)
    report["fullDecodeWithoutErrors"] = True
    return report


def compose(source, sample=False):
    OUT.mkdir(parents=True, exist_ok=True)
    WORK.mkdir(parents=True, exist_ok=True)
    story = load_story(source)
    if sample:
        for name, recording in story["formats"].items():
            render_video(recording, name, [6] * len(recording["steps"]), WORK / ("sample-" + name + ".mp4"), samples=True)
        return
    segments = asyncio.run(narration(story["formats"]["desktop"]["steps"]))
    durations = [part[2] for part in segments]
    total = sum(durations)
    audio_report = create_audio(segments)
    result = {"version": 2, "captureMethod": "computer-use", "capturedAt": story.get("capturedAt"), "annotation": "Capturas reales con indicaciones animadas", "fps": FPS, "audio": audio_report, "formats": {}}
    for name, recording in story["formats"].items():
        silent = OUT / ("portal-" + name + "-animated.mp4")
        render_video(recording, name, durations, silent)
        variants = {"silent": silent.relative_to(ROOT).as_posix()}
        details = {"silent": {"sha256": sha(silent), "bytes": silent.stat().st_size, "duration": duration(silent), "hasAudio": False}}
        for kind in ("music", "voice", "voiceMusic"):
            target = OUT / ("portal-%s-animated-%s.mp4" % (name, kind))
            run(["-i", silent, "-i", WORK / (kind + ".wav"), "-map", "0:v:0", "-map", "1:a:0", "-c:v", "copy", "-c:a", "aac", "-b:a", "160k", "-t", total, "-movflags", "+faststart", "-map_metadata", "-1", target])
            variants[kind] = target.relative_to(ROOT).as_posix()
            details[kind] = {"sha256": sha(target), "bytes": target.stat().st_size, "duration": duration(target), "hasAudio": True}
        steps, cues, cursor = [], [], 0.0
        for item, (audio, voice_seconds, seconds, key) in zip(recording["steps"], segments):
            end = cursor + seconds
            steps.append({"id": item["id"], "chapter": item["chapter"], "image": item["image"], "caption": item["caption"], "start": round(cursor, 3), "end": round(end, 3), "sha256": item["sha256"], "capturedSize": [item["target"]["sourceWidth"], item["target"]["sourceHeight"]], "target": item["target"], "voiceDuration": round(voice_seconds, 3), "narrationCacheKey": key})
            cues.append("%s\n%s --> %s\n%s" % (len(steps), vtt_time(cursor), vtt_time(end), item["caption"]))
            cursor = end
        track = OUT / ("portal-" + name + "-animated.vtt")
        track.write_text("WEBVTT\n\n" + "\n\n".join(cues) + "\n", encoding="utf-8")
        result["formats"][name] = {"width": recording["width"], "height": recording["height"], "duration": round(total, 3), "video": variants["silent"], "track": track.relative_to(ROOT).as_posix(), "steps": steps, "variants": variants, "variantDetails": details, "videoBytes": silent.stat().st_size}
    # Recheck immutable sources after rendering and write manifest only at success.
    load_story(source)
    result["verification"] = verify_media(result)
    (OUT / "manifest.js").write_text("window.PortalTutorialCapture = Object.freeze(" + json.dumps(result, ensure_ascii=False, indent=2) + ");\n", encoding="utf-8")
    (WORK / "build-report.json").write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"duration": total, "audio": audio_report, "formats": {k: v["variantDetails"] for k, v in result["formats"].items()}}, indent=2), flush=True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--manifest", type=Path, default=ROOT / "scripts/portal-tutorial-real.json")
    parser.add_argument("--sample", action="store_true")
    args = parser.parse_args()
    compose(args.manifest, args.sample)
