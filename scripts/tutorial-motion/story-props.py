from pathlib import Path
import json
from PIL import Image
R=Path.cwd();W=R/'.data/video-story';P=W/'public'
def sz(n):return Image.open(P/(n+'.png')).size
def state(n,t=0):
 # Measured browser scrollY, aligned to the unscrolled empty form.
 w,h=sz(n);return dict(t=t,image=n+'.png',width=w,height=h,transition='cut',offsetY={'week-name':3,'week-time':73,'week-linked':73}.get(n,0)*h/1080)
def key(t,r):return dict(t=t,**dict(zip(['x','y','w','h'],r)))
T=json.loads((W/'semestre/timing.json').read_text(encoding='utf-8')); B=T['beats']
# Seconds refer to narration boundaries; precise word anchors are applied below when available.
align=W/'semestre/alignment.json'
words=[w for s in json.loads(align.read_text(encoding='utf-8'))['segments'] for w in s['words']] if align.exists() else []
def at(word,lo,hi,fallback):
 hits=[w['start'] for w in words if lo<=w['start']<=hi and word.lower() in w['word'].lower()];return hits[0] if hits else fallback
approved=at('probaste',B['approved'],B['current'],B['approved']+1);current=at('cursando',B['current'],B['paths'],B['current']+1);name=at('nombre',B['form'],B['home'],B['form']+.6);date=at('fecha',B['form'],B['home'],B['form']+1.6);hour=at('hora',B['form'],B['home'],B['form']+2.2);linked=at('ramo',B['form'],B['home'],B['form']+3.4);save=at('guarda',B['form'],B['home'],B['home']-.6)
for fmt in ['desktop','mobile']:
 scenes=[]
 def add(id,title,chapter,start,end,states,camera,cursor=[]):
  w,h=sz(states[0][1]);scenes.append(dict(id=id,title=title,start=start,end=end,space=dict(width=w,height=h),states=[state(n,t-start) for t,n in states],camera=[key(t-start,r) for t,r in camera],cursor=[dict(t=t-start,x=x,y=y,click=c) for t,x,y,c in cursor],transitionIn=.15))
 m=(685,525,650,260) if fmt=='desktop' else (690,360,475,620)
 add('marcas','Marca tus ramos','aprobados',0,B['paths'],[(0,'malla-before'),(approved,'malla-approved'),(B['current'],'malla-current-mode'),(current,'malla-current')],[(0,(220,0,1660,820)),(1.1,m),(B['paths'],m)])
 path=(450,100,1000,560) if fmt=='desktop' else (455,200,520,630)
 pathcam=[(B['paths'],path)] if fmt=='desktop' else [(B['paths'],path),(B['condition']-.4,path),(B['condition']+.4,(760,280,480,540))]
 add('caminos','Mira qué se abriría','eligible',B['paths'],B['week'],[(B['paths'],'paths')],pathcam)
 form=(1280,330,410,570)
 saved=save+.3
 add('agenda','Agrega tu control','semana',B['week'],B['home'],[(B['week'],'week-empty'),(name,'week-name'),(date,'week-date'),(hour,'week-time'),(linked,'week-linked'),(saved,'week-saved')],[(B['week'],(420,80,1260,690)),(B['form']-1.9,(420,80,1260,690)),(B['form']-1.15,form),(saved-.01,form),(saved,(850,485,455,275))])
 scenes[-1]['camera'][-1]['ease']='cut'
 # Native field focus is part of each real capture; no duplicate focus overlay.
 home=(425,110,1250,470) if fmt=='desktop' else (440,150,610,500)
 homecam=[(B['home'],home)] if fmt=='desktop' else [(B['home'],home),(B['home']+2.06,home),(B['home']+2.66,(1110,170,605,430))]
 add('inicio','Ya está en tu Inicio','inicio',B['home'],B['courses'],[(B['home'],'home')],homecam)
 course=(430,190,900,480) if fmt=='desktop' else (430,210,460,490)
 add('ramos','Todo a mano en Mis ramos','mis-ramos',B['courses'],T['duration'],[(B['courses'],'courses')],[(B['courses'],course)])
 (W/'semestre'/f'{fmt}.json').write_text(json.dumps(dict(format=fmt,scenes=scenes,captions=T['captions']),ensure_ascii=False),encoding='utf-8')

print("Semester props ready",len(words),"alignment words")
