from pathlib import Path
import json, runpy, shutil
R=Path.cwd(); W=R/'.data/video-story'; O=R/'assets/tutorial-story'
H=runpy.run_path(str(R/'scripts/build-real-tutorial.py'))
if __name__=='__main__':
 (W/'public').mkdir(parents=True,exist_ok=True); folder=W/'semestre';folder.mkdir(parents=True,exist_ok=True)
 for source in (O/'captures').glob('*.png'):shutil.copyfile(source,W/'public'/source.name)
 # One continuous female take; cached timing belongs to this exact WAV.
 timing=json.loads((O/'narration/timing.json').read_text(encoding='utf-8'))
 H['run'](['-i',O/'narration/narration.wav','-ar',48000,'-ac',1,'-af','apad','-t',timing['duration'],folder/'voice.wav'])
 for source,target in [('timing.json','timing.json'),('semestre-alignment.json','alignment.json')]:shutil.copyfile(O/'narration'/source,folder/target)
 print('Single-take narration ready:',timing['duration'],'seconds')
