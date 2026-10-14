import React from 'react';
import {AbsoluteFill, Composition, registerRoot, useCurrentFrame, useVideoConfig} from 'remotion';
import {Tutorial, TutorialProps} from './Tutorial';
const News: React.FC<TutorialProps> = props => {
  const t = useCurrentFrame() / useVideoConfig().fps;
  const scene = props.scenes.find(s => t >= s.start && t < s.end) ?? props.scenes.at(-1);
  const mobile = props.format === 'mobile', closing = scene?.id === 'cierre';
  return <AbsoluteFill style={{background:'#e9ebe6',fontFamily:'system-ui, sans-serif',color:'#173a3d'}}>
    <Tutorial {...props} news />
    <div style={{position:'absolute',top:mobile?55:27,left:mobile?46:64,right:mobile?46:64,display:'flex',alignItems:'baseline',justifyContent:'space-between',gap:24}}>
      <div><div style={{fontSize:mobile?28:21,color:'#5d6f70',fontWeight:550}}>CEIC UCN · Ingeniería Civil</div><div style={{fontSize:mobile?55:38,fontWeight:650,letterSpacing:'-.03em',marginTop:mobile?12:5}}>{scene?.id==='introduccion'?'Novedades del portal':scene?.title}</div></div>
    </div>
    {closing&&<AbsoluteFill style={{background:'#e9ebe6',display:'flex',justifyContent:'center',alignItems:'center',textAlign:'center',padding:64}}><div><div style={{fontSize:mobile?34:26,color:'#5d6f70',marginBottom:26}}>Ingeniería Civil UCN</div><div style={{fontSize:mobile?74:68,lineHeight:1.12,fontWeight:650,letterSpacing:'-.04em',maxWidth:900}}>Tu semestre, a mano.</div><div style={{fontSize:mobile?54:44,color:'#285e68',marginTop:40}}>ceicucn.cl</div><div style={{fontSize:mobile?32:27,color:'#5d6f70',marginTop:28}}>Mis ramos · Mi semana · Material</div></div><div style={{position:'absolute',bottom:mobile?230:140,fontSize:mobile?40:32}}>Entra al portal del CEIC.</div></AbsoluteFill>}
  </AbsoluteFill>;
};
registerRoot(()=> <Composition id="Novedades" component={News} defaultProps={{format:'desktop',scenes:[],captions:[]}} fps={30} width={1920} height={1080} durationInFrames={1350} calculateMetadata={({props})=>({durationInFrames:Math.round((props.scenes.at(-1)?.end??45)*30),width:props.format==='mobile'?1080:1920,height:props.format==='mobile'?1920:1080})}/>);
