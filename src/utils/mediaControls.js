const fallbackCommand = {
  PLAY: 'play',
  PAUSE: 'pause',
  STOP: 'stop',
  NEXT_TRACK: 'nextTrack',
  PREVIOUS_TRACK: 'previousTrack',
  SEEK: 'seek',
};

const fallbackPlaybackState = {
  NONE: 0,
  STOPPED: 1,
  PLAYING: 2,
  PAUSED: 3,
  BUFFERING: 4,
  ERROR: 5,
};

let nativeMediaControl = null;
let nativeCommand = fallbackCommand;
let nativePlaybackState = fallbackPlaybackState;

try {
  const module = require('expo-media-control');
  nativeMediaControl = module.MediaControl;
  nativeCommand = module.Command || fallbackCommand;
  nativePlaybackState = module.PlaybackState || fallbackPlaybackState;
} catch {
  nativeMediaControl = null;
}

export const Command = nativeCommand;
export const PlaybackState = nativePlaybackState;
export const hasNativeMediaControls = () => !!nativeMediaControl;

export const addMediaControlListener = (listener) => {
  if (!nativeMediaControl?.addListener) return () => {};

  try {
    return nativeMediaControl.addListener(listener) || (() => {});
  } catch {
    return () => {};
  }
};

export const enableMediaControls = async (options) => {
  if (!nativeMediaControl?.enableMediaControls) return false;

  try {
    await nativeMediaControl.enableMediaControls(options);
    return true;
  } catch {
    return false;
  }
};

export const disableMediaControls = async () => {
  if (!nativeMediaControl?.disableMediaControls) return;

  try {
    await nativeMediaControl.disableMediaControls();
  } catch {
    // Native system controls are optional in Expo Go.
  }
};

export const updateMediaMetadata = async (metadata) => {
  if (!nativeMediaControl?.updateMetadata) return;

  try {
    await nativeMediaControl.updateMetadata(metadata);
  } catch {
    // Artwork and native availability can vary, so metadata is best-effort.
  }
};

export const updateMediaPlaybackState = async (state, position, rate) => {
  if (!nativeMediaControl?.updatePlaybackState) return;

  try {
    await nativeMediaControl.updatePlaybackState(state, position, rate);
  } catch {
    // Never let system-control sync interrupt in-app playback.
  }
};
