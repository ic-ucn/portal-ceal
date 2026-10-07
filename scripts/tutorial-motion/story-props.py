from pathlib import Path
import json
from PIL import Image
R=Path.cwd();W=R/'.data/video-story';P=W/'public'
def sz(n):return Image.open(P/(n+'.png')).size
def state(n,t=0):
 w,h=sz(n);return dict(t=t,image=n+'.png',width=w,height=h,transition='cut',offsetY={'week-empty':92,'week-name':-88,'week-saved':-42}.get(n,0))
def key(t,r):return dict(t=t,**dict(zip(['x','y','w','h'],r)))
T=json.loads((W/'semestre/timing.json').read_text(encoding='utf-8')); B=T['beats']
# Seconds refer to narration boundaries; precise word anchors are applied below when available.
align=W/'semestre/alignment.json'
words=[w for s in json.loads(align.read_text(encoding='utf-8'))['segments'] for w in s['words']] if align.exists() else []
def at(word,lo,hi,fallback):
 hits=[w['start'] for w in words if lo<=w['start']<=hi and word.lower() in w['word'].lower()];return hits[0] if hits else fallback
approved=at('aprobado',2,6,4.9);current=at('actual',6,8,7.1);name=at('nombre',21,25,22.3);date=at('fecha',22,26,23.3);linked=at('vinculo',24,28,25);save=at('guardo',26,29,27.7)
for fmt in ['desktop','mobile']:
 scenes=[]
 def add(id,title,chapter,start,end,states,camera,cursor=[]):
  w,h=sz(states[0][1]);scenes.append(dict(id=id,title=title,start=start,end=end,space=dict(width=w,height=h),states=[state(n,t-start) for t,n in states],camera=[key(t-start,r) for t,r in camera],cursor=[dict(t=t-start,x=x,y=y,click=c) for t,x,y,c in cursor],transitionIn=.15))
 m=(230,60,700,510) if fmt=='desktop' else (235,70,360,540)
 add('marcas','Marca tus ramos','aprobados',0,B['paths'],[(0,'malla-before'),(approved,'malla-approved'),(B['current'],'malla-current-mode'),(current,'malla-current')],[(0,(220,0,1660,820)),(1.1,m),(B['paths'],m)],[(approved-.7,495,115,False),(approved,318,410,True),(B['current'],385,115,True),(current,473,411,True)])
 path=(435,90,1260,620) if fmt=='desktop' else (435,180,610,660)
 add('caminos','Mira qué se abriría','eligible',B['paths'],B['week'],[(B['paths'],'paths')],[(B['paths'],path),(B['condition'],path)])
 form=(1245,110,440,590)
 add('agenda','Agrega tu control','semana',B['week'],B['home'],[(B['week'],'week-empty'),(name,'week-name'),(date,'week-time'),(linked,'week-linked'),(save,'week-saved')],[(B['week'],(420,80,1260,690)),(B['form']-.3,form),(save-.3,form),(save+.55,(430,180,850,450))],[(name,1470,341,True),(date,1390,255,True),(linked,1460,511,True),(save,1360,627,True)])
 home=(425,110,1250,470) if fmt=='desktop' else (440,150,610,500)
 add('inicio','Ya está en tu Inicio','inicio',B['home'],B['courses'],[(B['home'],'home')],[(B['home'],home)])
 course=(430,190,900,480) if fmt=='desktop' else (430,210,460,490)
 add('ramos','Todo a mano en Mis ramos','mis-ramos',B['courses'],T['duration'],[(B['courses'],'courses')],[(B['courses'],course)])
 (W/'semestre'/f'{fmt}.json').write_text(json.dumps(dict(format=fmt,scenes=scenes,captions=T['captions']),ensure_ascii=False),encoding='utf-8')
T=json.loads((W/'notas/timing.json').read_text(encoding='utf-8'));B=T['beats']
for fmt in ['desktop','mobile']:
 prefix='mobile-' if fmt=='mobile' else ''
 w,h=sz(prefix+'result')
 targets=({'goal':dict(x=39,y=216,w=210,h=47),'grade':dict(x=234,y=388,w=105,h=47),'weight':dict(x=39,y=388,w=185,h=47),'result':dict(x=56,y=390,w=267,h=45)} if fmt=='mobile' else {'goal':dict(x=468,y=339,w=210,h=47),'grade':dict(x=1056,y=428,w=190,h=47),'weight':dict(x=857,y=428,w=190,h=47),'result':dict(x=485,y=643,w=816,h=23)})
 props=dict(format=fmt,duration=T['duration'],source=dict(width=w,height=h),shots=[dict(image=prefix+'empty.png',at=0),dict(image=prefix+'grade.png',at=4.78),dict(image=prefix+'result.png',at=6.74)],cues=T['captions'],targets=targets,beats=dict(goal=1.88,grade=4.78,weight=6.74,result=9.44))
 if fmt=='mobile': props['shots']=[dict(image='mobile-empty.png',at=0),dict(image='mobile-grade.png',at=4.78),dict(image='mobile-weight.png',at=6.74),dict(image='mobile-result.png',at=8.5333)]
 (W/'notas'/f'{fmt}.json').write_text(json.dumps(props,ensure_ascii=False),encoding='utf-8')
print('Story props ready',len(words),'alignment words')

for lesson in ["semestre", "notas"]:
 for fmt in ["desktop", "mobile"]:
  text=(W/lesson/f"{fmt}.json").read_text(encoding="utf-8")
  assert not any(bad in text for bad in ["\u00c3", "\u00c2", "\ufffd"]), "Broken text encoding"
