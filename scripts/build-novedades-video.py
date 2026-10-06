"""Compose the short study guide from real Computer Use captures.

No paid API calls. Edge speech is cached; source PNGs remain unchanged.
Run --preview for stills, or without flags for the complete H.264 deliverables.
"""
from pathlib import Path
import argparse
import asyncio
import hashlib
import json
import math
import runpy
import subprocess

import edge_tts
import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets/tutorial-novedades'
WORK = ROOT / '.data/video-novedades/render'
FPS = 30
VOICE = 'es-MX-DaliaNeural'
RATE = '-4%'
SR = 48000
OLD = runpy.run_path(str(ROOT / 'scripts/build-real-tutorial.py'))
run, wav_read, wav_write, sha = (OLD[k] for k in ('run', 'wav_read', 'wav_write', 'sha'))
FFMPEG = OLD['FFMPEG']
BG, INK, MUTED, ACCENT = '#f3f1eb', '#183b3d', '#536361', '#b79950'

STORY = [
    dict(id='marcar', chapter='aprobados', title='Marca tus\nramos', label='MALLA', image='02-marked', before='01-before',
         phrases=['Marca tus ramos actuales en amarillo,', 'y los aprobados en verde.'],
         desktop=[238, 83, 803, 550], mobile=[10, 280, 365, 706]),
    dict(id='actuales', chapter='mis-ramos', title='Lo que cursas,\na mano', label='MIS RAMOS', image='03-current',
         phrases=['En Mis ramos tienes lo que cursas, a mano.'],
         desktop=[250, 95, 900, 596], mobile=[10, 230, 365, 650]),
    dict(id='caminos', chapter='eligible', title='¿Qué se\nabriría?', label='PRERREQUISITOS', image='04-path',
         phrases=['Mira qué se abriría al aprobarlos.', 'Es una proyección: confirma oferta', 'y requisitos con la universidad.'],
         desktop=[252, 107, 992, 646], mobile=[10, 280, 365, 752]),
    dict(id='agendar', chapter='semana', title='Agenda tu\npróximo control', label='MI SEMANA', image='05-form',
         phrases=['Agenda tu próximo control en Mi semana.'],
         desktop=[997, 232, 1373, 779], mobile=[15, 0, 354, 503]),
    dict(id='semana', chapter='semana', title='Tu semana,\na la vista', label='MI SEMANA', image='06-week',
         phrases=['Queda junto a tus otras actividades.'],
         desktop=[258, 228, 982, 742], mobile=[10, 63, 365, 543]),
    dict(id='notas', chapter='notas', title='¿Qué nota\nnecesitas?', label='CALCULADORA', image='07-grades',
         phrases=['Ingresa tus notas, sus porcentajes y tu meta.', 'La calculadora te muestra cuánto falta.'],
         desktop=[270, 154, 1138, 610], mobile=[12, 7, 359, 610]),
    dict(id='inicio', chapter='inicio', title='Todo en\ntu Inicio', label='TU PORTAL', image='08-home',
         phrases=['Y en Inicio, tu semana y ramos juntos.', 'Guarda una copia de tu avance desde Mi semana.'],
         desktop=[247, 98, 1380, 522], mobile=[12, 70, 359, 634])
]

def font(size, bold=False):
    return ImageFont.truetype('C:/Windows/Fonts/seguisb.ttf' if bold else 'C:/Windows/Fonts/segoeui.ttf', size)

def wrap(text, face, width, draw):
    lines, line = [], ''
    for word in text.split():
        candidate = (line + ' ' + word).strip()
        if draw.textlength(candidate, font=face) > width and line:
            lines.append(line)
            line = word
        else:
            line = candidate
    return lines + [line]

def source_path(name, item, before=False):
    return OUT / 'captures' / (name + '-' + (item['before'] if before else item['image']) + '.png')

def layout(name, item, caption, progress=0, before=False, zoom=1):
    vertical = name == 'mobile'
    size = (1080, 1920) if vertical else (1920, 1080)
    frame = Image.new('RGB', size, BG)
    d = ImageDraw.Draw(frame)
    margin = 72
    d.text((margin, 62), 'CEIC UCN', font=font(30, True), fill=INK)
    d.text((size[0] - (315 if vertical else 325), 62), 'ceicucn.cl', font=font(30), fill=MUTED)
    if vertical:
        d.text((margin, 146), item['label'], font=font(28, True), fill=MUTED)
        d.multiline_text((margin, 191), item['title'], font=font(72, True), fill=INK, spacing=0)
        box = (72, 400, 936, 975)
    else:
        d.text((margin, 248), item['label'], font=font(26, True), fill=MUTED)
        d.multiline_text((margin, 307), item['title'], font=font(74, True), fill=INK, spacing=7)
        d.rectangle((margin, 541, margin + 58, 545), fill=ACCENT)
        box = (640, 163, 1208, 673)
    src = Image.open(source_path(name, item, before)).convert('RGB').crop(item[name])
    x, y, bw, bh = box
    scale = min(bw / src.width, bh / src.height)
    iw, ih = round(src.width * scale), round(src.height * scale)
    # Quiet two-percent approach; never reconstruct or paint over portal content.
    if zoom > 1:
        cw, ch = src.width / zoom, src.height / zoom
        src = src.crop(((src.width-cw)/2, (src.height-ch)/2, (src.width+cw)/2, (src.height+ch)/2))
    src = src.resize((iw, ih), Image.Resampling.BICUBIC)
    left, top = x + (bw-iw)//2, y + (bh-ih)//2
    d.rectangle((left-2, top-2, left+iw+2, top+ih+2), fill='#d7dbd5')
    frame.paste(src, (left, top))
    # Open captions stay clear of screenshots and mobile platform controls.
    face = font(43 if vertical else 42, True)
    maxwidth = 904 if vertical else 1650
    lines = wrap(caption, face, maxwidth, d)
    assert len(lines) <= 2, (caption, lines)
    cy = 1450 if vertical else 922
    for j, line in enumerate(lines):
        tw = d.textlength(line, font=face)
        d.text(((size[0]-tw)/2, cy+j*58), line, font=face, fill=INK)
    py = 1680 if vertical else 1030
    d.rectangle((margin, py, size[0]-margin, py+4), fill='#d7dbd5')
    d.rectangle((margin, py, margin+max(1, int((size[0]-2*margin)*progress)), py+4), fill=ACCENT)
    return frame

async def speech():
    cache = WORK / 'speech'
    cache.mkdir(parents=True, exist_ok=True)
    segments = []
    for item in STORY:
        audio_parts, cues, cursor = [], [], 0
        for phrase in item['phrases']:
            key = hashlib.sha256((VOICE+RATE+phrase).encode()).hexdigest()
            mp3, pcm = cache/(key+'.mp3'), cache/(key+'.wav')
            if not mp3.exists():
                await edge_tts.Communicate(phrase, VOICE, rate=RATE).save(str(mp3))
            if not pcm.exists():
                run(['-i', mp3, '-ar', SR, '-ac', 1, '-c:a', 'pcm_s16le', pcm])
            data = wav_read(pcm)
            active = np.flatnonzero(np.abs(data[:, 0]) > .002)
            assert len(active), 'Empty narration'
            data = data[max(0, active[0]-int(.07*SR)):min(len(data), active[-1]+int(.14*SR))]
            audio_parts.append(data)
            length = len(data)/SR
            cues.append(dict(start=cursor, end=cursor+length, text=phrase))
            cursor += length
        # Only frame rounding plus a short breathing space at chapter boundaries.
        seconds = math.ceil(max(cursor+.14, 3.1)*FPS)/FPS
        joined = np.concatenate(audio_parts)
        padded = np.pad(joined, ((0,round(seconds*SR)-len(joined)), (0,0)))
        segments.append((padded, cursor, seconds, 'cached'))
        item['cues'], item['seconds'] = cues, seconds
        print(item['id'], round(seconds, 2), flush=True)
    return segments

def build(preview=False):
    WORK.mkdir(parents=True, exist_ok=True)
    segments = asyncio.run(speech())
    total = sum(s[2] for s in segments)
    assert total <= 46, f'Guide too long: {total}'
    # Reuse original, repository-owned composition; all variants share one timeline.
    OLD['create_audio'].__globals__.update(WORK=WORK, VOICE=VOICE, VOICE_RATE=RATE)
    audio_report = OLD['create_audio'](segments)
    manifest = dict(version=3, captureMethod='computer-use', capturedAt='2026-10-05',
                    fps=FPS, openCaptions=True, audio=audio_report, formats={})
    for name in ('desktop', 'mobile'):
        folder = OUT/name
        folder.mkdir(exist_ok=True)
        size = (1920,1080) if name == 'desktop' else (1080,1920)
        steps, captions, cursor = [], [], 0
        for item in STORY:
            poster = folder/(item['id']+'.jpg')
            layout(name, item, item['phrases'][0], cursor/total).save(poster, quality=94)
            steps.append(dict(id=item['id'], chapter=item['chapter'], image=poster.relative_to(ROOT).as_posix(),
                              sha256=sha(poster), sourceImage=source_path(name,item).relative_to(ROOT).as_posix(),
                              sourceSha256=sha(source_path(name,item)), caption=' '.join(item['phrases']),
                              start=round(cursor,3), end=round(cursor+item['seconds'],3)))
            for cue in item['cues']:
                captions.append(dict(start=cursor+cue['start'], end=cursor+cue['end'], text=cue['text']))
            cursor += item['seconds']
        if preview:
            continue
        silent = folder/'recorrido.mp4'
        process = subprocess.Popen([FFMPEG,'-y','-hide_banner','-loglevel','error','-f','rawvideo','-pixel_format','rgb24',
                '-video_size',f'{size[0]}x{size[1]}','-framerate',str(FPS),'-i','pipe:0','-an','-c:v','libx264',
                '-preset','fast','-crf','21','-pix_fmt','yuv420p','-g','30','-movflags','+faststart','-map_metadata','-1',str(silent)], stdin=subprocess.PIPE)
        cursor = 0
        try:
            for item in STORY:
                for n in range(round(item['seconds']*FPS)):
                    t = n/FPS
                    cue = next((c for c in item['cues'] if c['start'] <= t < c['end']), item['cues'][-1])
                    before = bool(item.get('before') and t < .85)
                    frame = layout(name,item,cue['text'],(cursor+t)/total,before,1+.012*min(t/3,1))
                    process.stdin.write(frame.tobytes())
                cursor += item['seconds']
                print('Rendered',name,item['id'],flush=True)
        finally:
            process.stdin.close()
        assert process.wait() == 0, 'Encoder failed'
        variants = {'silent': silent.relative_to(ROOT).as_posix()}
        for kind in ('voice','music','voiceMusic'):
            target = folder/('recorrido-'+kind+'.mp4')
            run(['-i',silent,'-i',WORK/(kind+'.wav'),'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','128k',
                 '-t',total,'-movflags','+faststart','-map_metadata','-1',target])
            variants[kind] = target.relative_to(ROOT).as_posix()
        track = folder/'recorrido.vtt'
        vt = OLD['vtt_time']
        track.write_text('WEBVTT\n\n'+'\n\n'.join(f"{i+1}\n{vt(c['start'])} --> {vt(c['end'])}\n{c['text']}" for i,c in enumerate(captions))+'\n',encoding='utf-8')
        # Always decode the actual outputs, not only encoder exit status.
        for kind,path in variants.items():
            run(['-i',ROOT/path,'-f','null','NUL'])
            assert abs(OLD['duration'](ROOT/path)-total) < .1
        variants = {k:p+'?v='+sha(ROOT/p)[:12] for k,p in variants.items()}
        manifest['formats'][name] = dict(width=size[0],height=size[1],duration=round(total,3),steps=steps,
                  variants=variants,video=variants['silent'],track=track.relative_to(ROOT).as_posix()+'?v='+sha(track)[:12])
    (WORK/'story-timed.json').write_text(json.dumps(STORY,ensure_ascii=False,indent=2),encoding='utf-8')
    if not preview:
        (OUT/'manifest.js').write_text('window.PortalTutorialCapture = Object.freeze('+json.dumps(manifest,ensure_ascii=False,indent=2)+');\n',encoding='utf-8')
    print('Duration:',round(total,3),flush=True)

if __name__ == '__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--preview',action='store_true')
    build(parser.parse_args().preview)
