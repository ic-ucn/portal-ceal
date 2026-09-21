"""Build the single public tutorial. Legacy staff recordings are not published.
Run --audio, capture-portal-tutorial.mjs, then --compose.
Requires existing edge_tts, imageio_ffmpeg and Pillow packages.
"""
from pathlib import Path
import argparse, asyncio, hashlib, json, math, re, subprocess
import edge_tts, imageio_ffmpeg
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
WORK = ROOT / '.data' / 'portal-guide-v5'
OUT = ROOT / 'assets' / 'tutorial'
FFMPEG = str(next(iter((ROOT/'.data/media-tools/imageio_ffmpeg/binaries').glob('ffmpeg*.exe')), imageio_ffmpeg.get_ffmpeg_exe()))
STORY = ROOT / 'scripts' / 'portal-tutorial-story.json'
VOICE = 'es-CL-CatalinaNeural'
WORK.mkdir(parents=True, exist_ok=True)
OUT.mkdir(parents=True, exist_ok=True)

def run(*args):
    subprocess.run([FFMPEG, '-y', '-hide_banner', '-loglevel', 'error', *map(str,args)], check=True)

def duration(path):
    result = subprocess.run([FFMPEG, '-hide_banner', '-i', str(path)], capture_output=True, text=True, encoding='utf-8', errors='replace')
    match = re.search(r'Duration:\s+(\d+):(\d+):(\d+(?:\.\d+)?)', result.stderr)
    if not match: raise RuntimeError(f'No duration for {path.name}')
    h,m,s = map(float,match.groups())
    return h*3600+m*60+s

def vtt_time(value):
    ms = round(value*1000)
    return f'{ms//3600000:02}:{ms//60000%60:02}:{ms//1000%60:02}.{ms%1000:03}'

async def audio():
    story = json.loads(STORY.read_text(encoding='utf-8'))
    public_text=' '.join(cue['text'] for cue in story).lower()
    assert not re.search(r'tu carrera|espera.*carg|cuando aparezcan|zigzag|dos segundos',public_text), 'Keep production directions out of the public narration'
    cursor = 0
    for cue in story:
        spoken=re.sub(r'\bportal\b','portál',cue['text'],flags=re.IGNORECASE)
        spoken=re.sub(r'\btutorial\b','tutoriál',spoken,flags=re.IGNORECASE)
        key=hashlib.sha256((VOICE+'+0%'+spoken).encode()).hexdigest()[:12]
        file=WORK/f'{cue["id"]}-{key}.mp3'
        if not file.exists(): await edge_tts.Communicate(spoken,VOICE,rate='+0%').save(str(file))
        cue.update(audio=str(file), start=cursor, duration=max(cue['minimum'],math.ceil((duration(file)+.65)*10)/10))
        cursor+=cue['duration']
        cue['end']=cursor
    (WORK/'story.json').write_text(json.dumps(story,ensure_ascii=False,indent=2),encoding='utf-8')
    (OUT/'portal-guia.vtt').write_text('WEBVTT\n\n'+'\n\n'.join(f'{i+1}\n{vtt_time(c["start"])} --> {vtt_time(c["end"])}\n{c["text"]}' for i,c in enumerate(story))+'\n',encoding='utf-8')
    print(json.dumps({'audio':True,'duration':cursor,'cues':len(story)}))

def caption(cue,width,height,file):
    image=Image.new('RGB',(width,height),'#f8f9f7'); draw=ImageDraw.Draw(image)
    mobile=width<600
    font=ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf',20 if mobile else 25)
    small=ImageFont.truetype('C:/Windows/Fonts/seguisb.ttf',13 if mobile else 15)
    x=20 if mobile else 32
    draw.line((0,0,width,0),fill='#bac7c3',width=1)
    label=cue['label']
    if not mobile: draw.text((x,14),label,fill='#23616a',font=small)
    lines=[]; line=''
    for word in cue['text'].split():
        candidate=(line+' '+word).strip()
        if draw.textlength(candidate,font=font)>width-2*x and line: lines.append(line);line=word
        else: line=candidate
    lines.append(line)
    line_height=27 if mobile else 26
    y=(height-len(lines)*line_height)//2 if mobile else 32
    for line in lines: draw.text((x,y),line,fill='#202f35',font=font); y+=line_height
    image.save(file)

def compose():
    import importlib.util, numpy as np, wave
    story=json.loads((WORK/'story.json').read_text(encoding='utf-8'))
    music_spec=importlib.util.spec_from_file_location('legacy_music',ROOT/'scripts/compose-tutorial-videos.py')
    legacy=importlib.util.module_from_spec(music_spec);music_spec.loader.exec_module(legacy)
    outputs=[]; sr=48000
    for format in ['desktop','mobile']:
        capture=json.loads((WORK/f'{format}-capture.json').read_text())
        assert capture['continuous'], 'Require a continuous user journey'
        width,height=capture['width'],capture['height']; strip=90 if format=='desktop' else 0
        seconds=capture['end']-capture['start']; count=int((seconds+.1)*sr)
        narration=np.zeros(count,dtype=np.float32); segments=capture['segments']
        assert [c['id'] for c in story] == [s['id'] for s in segments], 'Capture must follow the narration order'
        for cue,segment in zip(story,segments):
            pcm=subprocess.run([FFMPEG,'-loglevel','error','-i',cue['audio'],'-f','f32le','-ac','1','-ar',str(sr),'-'],capture_output=True,check=True).stdout
            voice=np.frombuffer(pcm,dtype='<f4');start=round((segment['start']-capture['start']+.12)*sr)
            length=min(len(voice),count-start); narration[start:start+length]+=voice[:length]
        voice_path=WORK/f'{format}-voice.wav'
        with wave.open(str(voice_path),'wb') as file:
            file.setnchannels(1);file.setsampwidth(2);file.setframerate(sr);file.writeframes((np.clip(narration,-1,1)*32767).astype('<i2').tobytes())
        # Reuse the exact score/variation from the old portal tutorial. Extend its
        # phrases to the new running time instead of looping across a fade-out.
        music=WORK/f'{format}-original-music.wav';legacy.make_music(music,seconds,3)
        audio_path=WORK/f'{format}-mix.m4a'
        run('-i',voice_path,'-i',music,'-filter_complex',
            f'[0:a]loudnorm=I=-18:TP=-2:LRA=9,aresample={sr},aformat=sample_fmts=dbl:channel_layouts=stereo,asplit=2[voice][key];[1:a]aformat=sample_fmts=dbl:channel_layouts=stereo,volume=0.28[music];[music][key]sidechaincompress=threshold=0.018:ratio=4:attack=80:release=600[bed];[voice]aresample=osf=flt[vf];[bed]aresample=osf=flt[bf];[vf][bf]amix=inputs=2:duration=first,volume=2,alimiter=limit=0.9,afade=t=out:st={seconds-.35}:d=0.35[a]',
            '-map','[a]','-t',seconds,'-c:a','aac','-b:a','160k',audio_path)
        args=['-ss',capture['start'],'-i',capture['raw'],'-i',audio_path]
        filters=[f'[0:v]setpts=PTS-STARTPTS,fps=30,pad=iw:ih+{strip}:0:0:color=0xf8f9f7[v0]']
        captions=[]
        for i,(cue,segment) in enumerate(zip(story,segments)):
            begin=segment['start']-capture['start'];end=(segments[i+1]['start']-capture['start']) if i+1<len(segments) else seconds
            if strip:
                card=WORK/f'{format}-{i}-caption.png';caption(cue,width,strip,card)
                args+=['-loop','1','-i',card]
                filters.append(f"[v{i}][{i+2}:v]overlay=0:{height}:enable='between(t,{begin:.3f},{end:.3f})':eof_action=repeat[v{i+1}]")
            captions.append(f'{i+1}\n{vtt_time(begin)} --> {vtt_time(end)}\n{cue["text"]}')
        filters.append(f'[v{len(story) if strip else 0}]format=yuv420p,fade=t=in:d=0.25,fade=t=out:st={seconds-.4}:d=0.4[out]')
        target=OUT/f'portal-guia-{format}.mp4'
        run(*args,'-filter_complex',';'.join(filters),'-map','[out]','-map','1:a','-t',seconds,'-c:v','libx264','-preset','fast','-crf','20','-c:a','copy','-movflags','+faststart','-map_metadata','-1',target)
        # Preview a real course, not a recursive image of the receiving page.
        poster_time=segments[0]['start']-capture['start']+3
        run('-ss',poster_time,'-i',target,'-frames:v','1','-q:v','3',OUT/f'portal-guia-{format}.jpg')
        (OUT/f'portal-guia-{format}.vtt').write_text('WEBVTT\n\n'+'\n\n'.join(captions)+'\n',encoding='utf-8')
        outputs.append({'format':format,'duration':duration(target),'bytes':target.stat().st_size,'continuous':True,'music':'original portal score, variation 3','voice':'es-CL-CatalinaNeural','captureStart':capture['start'],'captureEnd':capture['end']})
    (OUT/'portal-guia.vtt').write_text((OUT/'portal-guia-desktop.vtt').read_text(encoding='utf-8'),encoding='utf-8')
    (WORK/'build-report.json').write_text(json.dumps(outputs,indent=2),encoding='utf-8');print(json.dumps(outputs))

if __name__=='__main__':
    parser=argparse.ArgumentParser(); parser.add_argument('--audio',action='store_true');parser.add_argument('--compose',action='store_true');args=parser.parse_args()
    if args.audio: asyncio.run(audio())
    if args.compose: compose()
