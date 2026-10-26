from pathlib import Path
import json,hashlib,subprocess,shutil,sys
import imageio_ffmpeg
R=Path.cwd();W=R/'output/release-20261026/tutorial-silent/work';O=R/'assets/tutorial-silent';S=R/'assets/tutorial-news/captures';FF=imageio_ffmpeg.get_ffmpeg_exe()
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def stamp(t):
 ms=round(t*1000);return f'{ms//3600000:02}:{ms//60000%60:02}:{ms//1000%60:02}.{ms%1000:03}'
M=dict(version=9,captureMethod='browser-capture',capturedAt='2026-10-26',composedAt='2026-10-26',fps=30,openCaptions=True,audio=False,formats={});reports=[]
for fmt,size in [('desktop',(1920,1080)),('mobile',(1080,1920))]:
 folder=O/fmt;folder.mkdir(parents=True,exist_ok=True);out=folder/'guia-sin-audio.mp4';props=json.loads((W/(fmt+'.json')).read_text(encoding='utf-8'))
 inputs=['-i',str(W/fmt/'silent.mp4')]
 if '--prefix' in sys.argv:inputs=['-i',str(W/fmt/'prefix.mp4'),'-ss','21','-i',str(W/fmt/'silent.mp4'),'-filter_complex','[0:v]setpts=PTS-STARTPTS[a];[1:v]setpts=PTS-STARTPTS[b];[a][b]concat=n=2:v=1:a=0[v]']
 subprocess.run([FF,'-y','-hide_banner','-loglevel','error',*inputs,'-map','[v]' if '--prefix' in sys.argv else '0:v:0','-an','-c:v','libx264','-preset','fast','-crf','19','-pix_fmt','yuv420p','-g','30','-bf','0','-movflags','+faststart','-map_metadata','-1',str(out)],check=True)
 result=subprocess.run([FF,'-hide_banner','-i',str(out),'-f','null','-'],capture_output=True,text=True);assert result.returncode==0,result.stderr;assert 'Audio:' not in result.stderr
 probe=json.loads(subprocess.run([str(R/'scripts/tutorial-motion/node_modules/@remotion/compositor-win32-x64-msvc/ffprobe.exe'),'-v','error','-show_streams','-show_format','-of','json',str(out)],capture_output=True,text=True,check=True).stdout)
 assert len(probe['streams'])==1 and probe['streams'][0]['codec_type']=='video'
 assert abs(float(probe['format']['duration'])-62)<.1
 (W.parent/(fmt+'-ffprobe.json')).write_text(json.dumps(probe,indent=2),encoding='utf-8')
 steps=[]
 for s in props['scenes']:
  frame=W/fmt/f"frame-{round((s['end']-1)*30)}.jpg";target=folder/(s['id']+'-'+sha(frame)[:12]+'.jpg');shutil.copyfile(frame,target);source=(O/'sources'/s['states'][-1]['image']) if (O/'sources'/s['states'][-1]['image']).exists() else S/s['states'][-1]['image']
  steps.append(dict(id=s['id'],chapter=s['id'],image=target.relative_to(R).as_posix(),sha256=sha(target),sourceImage=source.relative_to(R).as_posix(),sourceSha256=sha(source),sourceCaptureMethod='playwright' if source.parent.name=='sources' else 'computer-use',sourceCapturedAt='2026-10-26' if source.parent.name=='sources' else '2026-10-13',start=s['start'],end=s['end'],caption=s['title']))
 poster=folder/('portada-'+sha(W/fmt/'frame-45.jpg')[:12]+'.jpg');shutil.copyfile(W/fmt/'frame-45.jpg',poster)
 vtt=folder/'guia.vtt';vtt.write_text('WEBVTT\n\n'+'\n\n'.join(f"{i+1}\n{stamp(c['start'])} --> {stamp(c['end'])}\n{c['text']}" for i,c in enumerate(props['captions']))+'\n',encoding='utf-8')
 video=out.relative_to(R).as_posix()+'?v='+sha(out)[:12]
 M['formats'][fmt]=dict(width=size[0],height=size[1],duration=62,audio=False,steps=steps,variants={'silent':video},video=video,poster=poster.relative_to(R).as_posix(),track=vtt.relative_to(R).as_posix()+'?v='+sha(vtt)[:12])
 reports.append(dict(format=fmt,fullDecode=True,noAudioStream=True,ffprobeStreams=len(probe['streams']),bytes=out.stat().st_size,sha256=sha(out),media=[l.strip() for l in result.stderr.splitlines() if 'Duration:' in l or 'Stream #0:0(und): Video: h264' in l]))
(R/'assets/tutorial-story/manifest.js').write_text('window.PortalTutorialCapture = Object.freeze('+json.dumps(M,ensure_ascii=False,indent=2)+');\n',encoding='utf-8')
(W.parent/'media-integrity.json').write_text(json.dumps(dict(date='2026-10-26',ok=True,formats=reports),indent=2),encoding='utf-8');print(json.dumps(reports,indent=2))
