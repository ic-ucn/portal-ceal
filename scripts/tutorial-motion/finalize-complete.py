from pathlib import Path
import json,hashlib,subprocess,shutil
import imageio_ffmpeg
R=Path.cwd();W=R/'output/release-20261026/tutorial-complete/work';O=R/'assets/tutorial-complete';S=R/'assets/tutorial-news/captures';FF=imageio_ffmpeg.get_ffmpeg_exe()
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def stamp(t):
 ms=round(t*1000);return f'{ms//3600000:02}:{ms//60000%60:02}:{ms//1000%60:02}.{ms%1000:03}'
M=dict(version=11,captureMethod='browser-capture',capturedAt='2026-10-26',composedAt='2026-10-26',exampleDate='2026-10-13',fps=30,openCaptions=True,audio=True,voice=False,music=True,formats={});reports=[]
origins={item['image']:item for item in json.loads((W.parent/'source-integrity.json').read_text(encoding='utf-8'))['sources']}
for fmt,size in [('desktop',(1920,1080)),('mobile',(1080,1920))]:
 folder=O/fmt;folder.mkdir(parents=True,exist_ok=True);out=folder/'guia-con-musica.mp4';props=json.loads((W/(fmt+'.json')).read_text(encoding='utf-8'))
 inputs=['-i',str(W/fmt/'silent.mp4'),'-i',str(R/'assets/tutorial-guided/music/accompaniment.wav')]
 subprocess.run([FF,'-y','-hide_banner','-loglevel','error',*inputs,'-map','0:v:0','-map','1:a:0','-c:a','aac','-b:a','160k','-ar','48000','-ac','2','-t','62','-c:v','libx264','-preset','fast','-crf','19','-pix_fmt','yuv420p','-g','30','-bf','0','-movflags','+faststart','-map_metadata','-1',str(out)],check=True)
 result=subprocess.run([FF,'-hide_banner','-i',str(out),'-f','null','-'],capture_output=True,text=True);assert result.returncode==0,result.stderr;assert 'Audio:' in result.stderr
 probe=json.loads(subprocess.run([str(R/'scripts/tutorial-motion/node_modules/@remotion/compositor-win32-x64-msvc/ffprobe.exe'),'-v','error','-show_streams','-show_format','-of','json',str(out)],capture_output=True,text=True,check=True).stdout)
 assert len(probe['streams'])==2 and probe['streams'][0]['codec_type']=='video' and probe['streams'][1]['codec_type']=='audio'
 v,a=probe['streams'];assert v['codec_name']=='h264' and v['pix_fmt']=='yuv420p' and v['avg_frame_rate']=='30/1' and v['has_b_frames']==0 and int(v['nb_frames'])==1860
 assert a['codec_name']=='aac' and a['sample_rate']=='48000' and a['channels']==2
 assert abs(float(probe['format']['duration'])-62)<.1
 (W.parent/(fmt+'-ffprobe.json')).write_text(json.dumps(probe,indent=2),encoding='utf-8')
 steps=[]
 for s in props['scenes']:
  frame=W/fmt/f"frame-{round((s['end']-1)*30)}.jpg";target=folder/(s['id']+'-'+sha(frame)[:12]+'.jpg');shutil.copyfile(frame,target);selected=max([st for st in s['states'] if st['t']<=s['end']-s['start']-1],key=lambda st:st['t']);source=(O/'sources'/selected['image']) if (O/'sources'/selected['image']).exists() else S/selected['image']
  origin=origins[selected['image']];assert origin['sha256']==sha(source)==sha(R/origin['originalSource'])
  steps.append(dict(id=s['id'],chapter=s['id'],image=target.relative_to(R).as_posix(),sha256=sha(target),sourceImage=source.relative_to(R).as_posix(),sourceSha256=sha(source),sourceOriginalImage=origin['originalSource'],sourceCaptureMethod=origin['captureMethod'],sourceCapturedAt=origin['capturedAt'],start=s['start'],end=s['end'],caption=s['title']))
 poster=folder/('portada-'+sha(W/fmt/'frame-45.jpg')[:12]+'.jpg');shutil.copyfile(W/fmt/'frame-45.jpg',poster)
 vtt=folder/'guia.vtt';vtt.write_text('WEBVTT\n\n'+'\n\n'.join(f"{i+1}\n{stamp(c['start'])} --> {stamp(c['end'])}\n{c['text']}" for i,c in enumerate(props['captions']))+'\n',encoding='utf-8')
 video=out.relative_to(R).as_posix()+'?v='+sha(out)[:12]
 M['formats'][fmt]=dict(indicators='touch' if fmt=='mobile' else 'cursor',width=size[0],height=size[1],duration=62,audio=True,voice=False,music=True,steps=steps,variants={'music':video},video=video,poster=poster.relative_to(R).as_posix(),track=vtt.relative_to(R).as_posix()+'?v='+sha(vtt)[:12])
 reports.append(dict(format=fmt,fullDecode=True,noVoice=True,musicOnly=True,ffprobeStreams=len(probe['streams']),bytes=out.stat().st_size,sha256=sha(out),media=[l.strip() for l in result.stderr.splitlines() if 'Duration:' in l or 'Stream #0:0(und): Video: h264' in l]))
manifest=R/'assets/tutorial-story/manifest.js';temporary=manifest.with_suffix('.js.tmp')
temporary.write_text('window.PortalTutorialCapture = Object.freeze('+json.dumps(M,ensure_ascii=False,indent=2)+');\n',encoding='utf-8');temporary.replace(manifest)
(W.parent/'media-integrity.json').write_text(json.dumps(dict(date='2026-10-26',ok=True,formats=reports),indent=2),encoding='utf-8');print(json.dumps(reports,indent=2))
