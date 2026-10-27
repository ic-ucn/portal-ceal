import React from 'react';
import {Composition,registerRoot} from 'remotion';
import {Tutorial,TutorialProps} from './Tutorial';
registerRoot(()=> <Composition id="GuiaSilenciosa" component={Tutorial} defaultProps={{format:'desktop',scenes:[],captions:[],news:true,silent:true}} fps={30} width={1920} height={1080} durationInFrames={1860} calculateMetadata={({props})=>({durationInFrames:Math.round((props.scenes.at(-1)?.end??62)*30),width:props.format==='mobile'?1080:1920,height:props.format==='mobile'?1920:1080})}/>);
