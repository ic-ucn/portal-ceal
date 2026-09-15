"""Build the single public tutorial. Legacy staff recordings are not published.
Run --audio, capture-portal-tutorial.mjs, then --compose.
Requires existing edge_tts, imageio_ffmpeg and Pillow packages.
"""
from pathlib import Path
import argparse, asyncio, hashlib, json, math, re, subprocess
import edge_tts, imageio_ffmpeg
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
WORK = ROOT / '.data' / 'portal-guide'
OUT = ROOT / 'assets' / 'tutorial'
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
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
    cursor = 0
    for cue in story:
        key=hashlib.sha256((VOICE+cue['text']).encode()).hexdigest()[:12]
        file=WORK/f'{cue["id"]}-{key}.mp3'
        if not file.exists(): await edge_tts.Communicate(cue['text'],VOICE,rate='+5%').save(str(file))
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
    line_height=27 if mobile else 31
    y=(height-len(lines)*line_height)//2 if mobile else 38
    for line in lines: draw.text((x,y),line,fill='#202f35',font=font); y+=line_height
    image.save(file)

def compose():
    story=json.loads((WORK/'story.json').read_text(encoding='utf-8'))
    outputs=[]
    for format in ['desktop','mobile']:
        capture=json.loads((WORK/f'{format}-capture.json').read_text())
        width,height=capture['width'],capture['height']
        # Keep the complete viewport visible; captions sit below it, not over controls.
        strip=100 if format=='desktop' else 110
        parts=[]
        assert len(story) == len(capture['segments']), 'Incomplete capture'
        for i,(cue,segment) in enumerate(zip(story,capture['segments'])):
            card=WORK/f'{format}-{i}-caption.png'; caption(cue,width,strip,card)
            part=WORK/f'{format}-{i}.mp4'; parts.append(part)
            run('-ss',segment['start'],'-i',capture['raw'],'-loop','1','-i',card,'-i',cue['audio'],
                '-filter_complex',f'[0:v]setpts=PTS-STARTPTS,fps=24,pad=iw:ih+{strip}:0:0:color=white[v];[v][1:v]overlay=0:{height}:shortest=1,format=yuv420p[out];[2:a]apad,alimiter=limit=0.95[a]',
                '-map','[out]','-map','[a]','-t',cue['duration'],'-c:v','libx264','-preset','fast','-crf','22','-c:a','aac','-b:a','96k','-map_metadata','-1',part)
        listing=WORK/f'{format}-concat.txt'
        listing.write_text(''.join(f"file '{p.as_posix()}'\n" for p in parts),encoding='utf-8')
        target=OUT/f'portal-guia-{format}.mp4'
        run('-f','concat','-safe','0','-i',listing,'-c','copy','-movflags','+faststart','-map_metadata','-1',target)
        run('-ss','1.5','-i',target,'-frames:v','1','-q:v','3',OUT/f'portal-guia-{format}.jpg')
        outputs.append({'format':format,'duration':duration(target),'bytes':target.stat().st_size})
    (WORK/'build-report.json').write_text(json.dumps(outputs,indent=2),encoding='utf-8')
    print(json.dumps(outputs))

if __name__=='__main__':
    parser=argparse.ArgumentParser(); parser.add_argument('--audio',action='store_true');parser.add_argument('--compose',action='store_true');args=parser.parse_args()
    if args.audio: asyncio.run(audio())
    if args.compose: compose()
