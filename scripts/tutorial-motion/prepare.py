"""Prepare real screenshot choreography and cached narration; no paid model calls."""
import asyncio, hashlib, json, math, runpy, shutil
from pathlib import Path
import edge_tts
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'assets/tutorial-motion'
WORK = ROOT / '.data/video-motion/render'
PUBLIC = ROOT / '.data/video-motion/public'
OLD = runpy.run_path(str(ROOT / 'scripts/build-real-tutorial.py'))
FPS, SR, VOICE, RATE = 30, 48000, 'es-MX-DaliaNeural', '+0%'
STORY = [
    ('actual', 'aprobados', 'Marca tus actuales', [
        'En la malla, elige Actuales.', 'Toca el ramo que cursas.'], 5.2),
    ('aprobado', 'aprobados', 'Marca tus aprobados', [
        'Cambia a Aprobados', 'y marca los que ya aprobaste.'], 4.3),
    ('ramos', 'mis-ramos', 'Tus ramos, a mano', [
        'En Mis ramos ves lo que cursas.'], 3.0),
    ('caminos', 'eligible', 'Mira qué se abriría', [
        'En Qué se abre, sigue el camino de Cálculo uno.',
        'Cálculo dos se abriría al aprobarlo.',
        'Confirma oferta y requisitos con la universidad.'], 8.2),
    ('agendar', 'semana', 'Agrega tu control', [
        'En Mi semana, agrega tu control.', 'Fecha, hora y ramo.'], 5.4),
    ('semana', 'semana', 'Ya está en tu semana', [
        'Listo: queda en tu semana.'], 2.7),
    ('notas', 'notas', 'Calcula lo que necesitas', [
        'Meta cuatro. Nota cinco, con peso cincuenta por ciento.',
        'Necesitas un tres en el cincuenta por ciento restante.'], 7.7),
    ('inicio', 'inicio', 'Todo en tu Inicio', [
        'Y en Inicio, tu próximo control y tus ramos juntos.'], 4.2),
]

async def prepare_audio():
    cache = WORK / 'speech'
    cache.mkdir(parents=True, exist_ok=True)
    segments, timed, captions, cursor = [], [], [], 0
    for ident, chapter, title, phrases, minimum in STORY:
        pieces, cues, length = [], [], .12
        pieces.append(np.zeros((round(.12 * SR), 1)))
        for phrase in phrases:
            key = hashlib.sha256((VOICE + RATE + phrase).encode()).hexdigest()
            mp3, wav = cache / (key + '.mp3'), cache / (key + '.wav')
            if not mp3.exists():
                await edge_tts.Communicate(phrase, VOICE, rate=RATE).save(str(mp3))
            if not wav.exists():
                OLD['run'](['-i', mp3, '-ar', SR, '-ac', 1, '-c:a', 'pcm_s16le', wav])
            data = OLD['wav_read'](wav)
            active = np.flatnonzero(np.abs(data[:, 0]) > .002)
            assert len(active)
            data = data[max(0, active[0]-round(.06*SR)):min(len(data), active[-1]+round(.12*SR))]
            seconds = len(data) / SR
            cues.append(dict(start=cursor+length, end=cursor+length+seconds, text=phrase))
            pieces.append(data)
            length += seconds
        duration = math.ceil(max(minimum, length+.3)*FPS)/FPS
        joined = np.concatenate(pieces)
        padded = np.pad(joined, ((0, round(duration*SR)-len(joined)), (0, 0)))
        segments.append((padded, length, duration, 'cached'))
        timed.append(dict(id=ident, chapter=chapter, title=title, start=cursor, end=cursor+duration,
                          caption=' '.join(phrases), voiceDuration=length))
        captions.extend(cues)
        cursor += duration
        print(ident, round(duration, 3), flush=True)
    assert cursor <= 50, cursor
    OLD['create_audio'].__globals__.update(WORK=WORK, VOICE=VOICE, VOICE_RATE=RATE)
    report = OLD['create_audio'](segments)
    return timed, captions, report

def source(name):
    path = OUT / 'captures' / (name + '.png')
    if not path.exists():
        path = ROOT / 'assets/tutorial-novedades/captures' / (name + '.png')
    assert path.exists(), path
    target = PUBLIC / 'captures' / path.name
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(path, target)
    w, h = Image.open(path).size
    return dict(image='captures/'+path.name, width=w, height=h), path

def scene(item, states, camera, cursor=None, focus=None):
    duration = item['end'] - item['start']
    base, _ = source(states[0][1])
    result = {k: item[k] for k in ('id', 'title', 'start', 'end')}
    result.update(space=dict(width=base['width'], height=base['height']), transitionIn=.18,
                  states=[], camera=[], cursor=[])
    for t, name in states:
        value, _ = source(name)
        result['states'].append(dict(t=round(t*duration, 3), transition='cut', **value))
    # Coordinates are measured on the original PNGs, never on model thumbnails.
    for t, rect, *ease in camera:
        result['camera'].append(dict(t=round(t*duration, 3), **dict(zip(('x','y','w','h'), rect)),
                                     ease=ease[0] if ease else 'inOut'))
    for t, x, y, click in cursor or []:
        result['cursor'].append(dict(t=round(t*duration,3), x=x, y=y, click=click))
    result['focus'] = focus or []
    return result

def choreography(fmt, timed):
    scenes = []
    if fmt == 'desktop':
        configs = [
            ([(0,'desktop-malla-0'),(.55,'desktop-malla-1')],
             [(0,[228,75,860,440]),(.15,[238,90,450,390]),(.32,[238,90,450,390]),(.50,[238,295,530,266]),(1,[238,295,530,266])],
             [(.05,500,150,False),(.18,384,116,True),(.50,435,410,False),(.55,435,410,True)]),
            ([(0,'desktop-malla-1'),(.22,'desktop-approved-mode'),(.57,'desktop-malla-2')],
             [(0,[238,80,520,390]),(.27,[238,80,520,390]),(.51,[238,295,530,266]),(1,[238,295,530,266])],
             [(.02,436,160,False),(.22,498,115,True),(.51,300,409,False),(.57,300,409,True)]),
            ([(0,'desktop-current')],
             [(0,[230,80,1070,550]),(.25,[245,115,650,327]),(1,[245,115,650,327])], []),
            ([(0,'desktop-path-0'),(.25,'desktop-path-1')],
             [(0,[242,105,1030,518]),(.2,[250,220,1020,513]),(.43,[255,325,665,334]),(.83,[255,325,665,334]),(1,[255,325,665,334])],
             [(.08,443,326,False),(.25,389,442,True)]),
            ([(0,'desktop-agenda-1')],
             [(0,[820,180,458,380]),(.2,[873,230,380,220]),(.48,[873,230,380,220]),(.73,[867,440,380,270]),(1,[867,440,380,270])],
             [(.80,1040,565,False),(.96,932,670,True)]),
            ([(0,'desktop-agenda-2')],
             [(0,[245,168,610,470]),(.28,[542,288,300,202]),(1,[542,288,300,202])], []),
            ([(0,'desktop-notes-1')],
             [(0,[274,312,860,400]),(.2,[278,313,805,226]),(.46,[278,313,805,226]),(.65,[278,490,860,208]),(1,[278,490,860,208])], []),
            ([(0,'desktop-home')],
             [(0,[236,90,1030,530]),(.33,[245,185,1010,285]),(1,[245,185,1010,285])], []),
        ]
    else:
        configs = [
            ([(0,'mobile-01-before'),(.55,'mobile-02-marked')],
             [(0,[0,145,390,620]),(.2,[12,282,358,485]),(.50,[12,360,358,407]),(1,[12,360,358,407])],
             [(.05,205,338,False),(.18,160,310,True),(.50,105,588,False),(.55,105,588,True)]),
            ([(0,'mobile-approved-before'),(.57,'mobile-approved-after')],
             [(0,[6,278,329,407]),(.4,[6,278,329,407]),(.55,[10,420,325,260]),(1,[10,420,325,260])],
             [(.03,154,387,False),(.22,83,362,True),(.51,142,580,False),(.57,142,580,True)]),
            ([(0,'mobile-current')],
             [(0,[4,98,340,578]),(.25,[9,155,328,472]),(1,[9,155,328,472])], []),
            ([(0,'mobile-path-0'),(.25,'mobile-path-1'),(.43,'mobile-path-detail')],
             [(0,[8,158,330,501]),(.25,[8,225,330,501]),(.429,[8,225,330,501]),(.43,[8,140,330,501],'cut'),(1,[8,140,330,501])],
             [(.08,141,385,False),(.25,254,412,True)]),
            ([(0,'mobile-agenda-1'),(.73,'mobile-form-action')],
             [(0,[15,76,302,568]),(.15,[22,148,291,444]),(.65,[22,215,291,444]),(.729,[22,215,291,444]),(.73,[16,0,302,430],'cut'),(1,[16,0,302,430])],
             [(.80,244,295,False),(.96,166,375,True)]),
            ([(0,'mobile-week-top')],
             [(0,[3,65,334,610]),(.28,[16,115,309,410]),(1,[16,115,309,410])], []),
            ([(0,'mobile-notes-1'),(.61,'mobile-notes-result')],
             [(0,[8,0,345,620]),(.2,[15,160,335,475]),(.59,[15,160,335,475]),(.61,[15,70,335,486],'cut'),(1,[15,70,335,486])], []),
            ([(0,'mobile-home')],
             [(0,[3,65,334,610]),(.3,[17,175,307,466]),(1,[17,175,307,466])], []),
        ]
    for item, config in zip(timed, configs):
        scenes.append(scene(item, *config))
    return scenes

def main():
    WORK.mkdir(parents=True, exist_ok=True)
    PUBLIC.mkdir(parents=True, exist_ok=True)
    timed, captions, report = asyncio.run(prepare_audio())
    for fmt in ('desktop','mobile'):
        props = dict(format=fmt, scenes=choreography(fmt, timed), captions=captions)
        (WORK/(fmt+'.json')).write_text(json.dumps(props, ensure_ascii=False, indent=2), encoding='utf-8')
    (WORK/'timing.json').write_text(json.dumps(dict(steps=timed,captions=captions,audio=report),ensure_ascii=False,indent=2),encoding='utf-8')
    print('TOTAL', timed[-1]['end'], flush=True)

if __name__ == '__main__':
    main()
