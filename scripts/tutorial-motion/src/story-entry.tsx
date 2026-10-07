import React from 'react';
import {Composition,registerRoot} from 'remotion';
import {Tutorial,TutorialProps} from './Tutorial';
const main:TutorialProps={format:'desktop',scenes:[],captions:[]};
registerRoot(()=> <Composition id="Semestre" component={Tutorial} defaultProps={main} fps={30} width={1920} height={1080} durationInFrames={1140} calculateMetadata={({props})=>({durationInFrames:Math.round((props.scenes.at(-1)?.end??38)*30),width:props.format==='mobile'?1080:1920,height:props.format==='mobile'?1920:1080})}/>);
