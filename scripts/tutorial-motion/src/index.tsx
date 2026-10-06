import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {Tutorial, TutorialProps} from './Tutorial';

const defaults: TutorialProps = {format: 'desktop', scenes: [], captions: []};
const Root: React.FC = () => <Composition
  id="Tutorial" component={Tutorial} durationInFrames={1350} fps={30}
  width={1920} height={1080} defaultProps={defaults}
  calculateMetadata={({props}) => ({
    durationInFrames: Math.round((props.scenes.at(-1)?.end ?? 45)*30),
    width: props.format === 'mobile' ? 1080 : 1920,
    height: props.format === 'mobile' ? 1920 : 1080,
  })}
/>;
registerRoot(Root);
