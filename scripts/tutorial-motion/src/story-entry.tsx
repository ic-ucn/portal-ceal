import React from 'react';
import {Composition,registerRoot} from 'remotion';
import {Tutorial,TutorialProps} from './Tutorial';
import {CalculatorSample,SampleProps} from './CalculatorSample';
const main:TutorialProps={format:'desktop',scenes:[],captions:[]};
const box={x:0,y:0,w:1,h:1};
const notes:SampleProps & {format:string}={format:'desktop',shots:[],cues:[],duration:16,source:{width:1910,height:901},targets:{goal:box,grade:box,weight:box,result:box},beats:{goal:1,grade:4,weight:6,result:9}};
registerRoot(()=> <><Composition id="Semestre" component={Tutorial} defaultProps={main} fps={30} width={1920} height={1080} durationInFrames={1140} calculateMetadata={({props})=>({durationInFrames:Math.round((props.scenes.at(-1)?.end??38)*30),width:props.format==='mobile'?1080:1920,height:props.format==='mobile'?1920:1080})}/><Composition id="Notas" component={CalculatorSample} defaultProps={notes} fps={30} width={1920} height={1080} durationInFrames={480} calculateMetadata={({props})=>({durationInFrames:Math.round(props.duration*30),width:props.format==='mobile'?1080:1920,height:props.format==='mobile'?1920:1080})}/></>);
