export type MediaType = 'video' | 'image' | 'audio';

export type TrackType = 'video' | 'audio' | 'text' | 'sticker';

export interface MediaAsset {
  id: string;
  name: string;
  type: MediaType;
  url: string;
  duration: number; // in seconds
  thumbnail: string;
  width?: number;
  height?: number;
}

export type FilterPreset =
  | 'none'
  | 'cyberpunk'
  | 'vintage'
  | 'noir'
  | 'golden'
  | 'vhs'
  | 'pastel'
  | 'bleach'
  | 'emerald';

export type TransitionType =
  | 'none'
  | 'crossfade'
  | 'wipeLeft'
  | 'wipeRight'
  | 'zoom'
  | 'flash'
  | 'glitch'
  | 'dipToBlack';

export type TextAnimation =
  | 'none'
  | 'fadeIn'
  | 'typewriter'
  | 'slideUp'
  | 'bounce'
  | 'glitch'
  | 'pulse';

export interface ClipTransform {
  x: number; // pixel offset from center
  y: number; // pixel offset from center
  scale: number; // 1.0 = 100%
  rotation: number; // in degrees
  opacity: number; // 0 to 1
  flipH: boolean;
  flipV: boolean;
}

export interface ClipFilters {
  brightness: number; // -100 to 100 (0 is normal)
  contrast: number; // -100 to 100 (0 is normal)
  saturation: number; // -100 to 100 (0 is normal)
  temperature: number; // -100 (cool) to 100 (warm)
  vignette: number; // 0 to 100
  blur: number; // 0 to 20
  sepia: number; // 0 to 100
  preset: FilterPreset;
}

export interface TextConfig {
  text: string;
  fontFamily: string;
  fontSize: number; // in px at 1080p
  fontWeight: '400' | '600' | '700' | '800';
  color: string;
  strokeColor: string;
  strokeWidth: number;
  backgroundColor: string;
  backgroundPadding: number;
  borderRadius: number;
  shadowColor: string;
  shadowBlur: number;
  letterSpacing: number;
  animation: TextAnimation;
}

export interface StickerConfig {
  stickerId: string;
  svg: string;
  category: string;
  tint?: string;
}

export interface Keyframe {
  id: string;
  time: number; // time offset within clip in seconds (0 to clip.duration)
  x: number;
  y: number;
  scale: number;
  rotation?: number;
  opacity?: number;
}

export type SmartCutoutMode = 'ai_subject' | 'chroma' | 'luma';

export interface SmartCutoutConfig {
  enabled: boolean;
  mode: SmartCutoutMode;
  keyColor: string; // e.g. '#00FF00' or '#000000'
  tolerance: number; // 0 to 100
  softness: number; // 0 to 100
  feather: number; // 0 to 20
  strokeOutline: boolean;
  strokeColor: string;
  strokeWidth: number;
}

export interface Clip {
  id: string;
  trackId: string;
  name: string;
  type: 'video' | 'image' | 'audio' | 'text' | 'sticker';
  mediaAssetId?: string;
  url?: string;
  start: number; // timeline start time in seconds
  duration: number; // effective timeline duration in seconds
  sourceStart: number; // start offset in original source media
  speed: number; // playback speed (0.25 to 4.0)
  volume: number; // 0.0 to 2.0 (1.0 = 100%)
  fadeIn: number; // fade-in duration in seconds
  fadeOut: number; // fade-out duration in seconds
  muted: boolean;
  transform: ClipTransform;
  keyframes?: Keyframe[];
  smartCutout?: SmartCutoutConfig;
  filters: ClipFilters;
  transitionIn: {
    type: TransitionType;
    duration: number; // seconds
  };
  textConfig?: TextConfig;
  stickerConfig?: StickerConfig;
}

export interface Track {
  id: string;
  type: TrackType;
  name: string;
  muted: boolean;
  locked: boolean;
  visible: boolean;
  clips: Clip[];
}

export type AspectRatio = '16:9' | '9:16' | '1:1' | '4:5';

export interface ProjectSettings {
  title: string;
  aspectRatio: AspectRatio;
  fps: number;
  duration: number; // overall timeline capacity in seconds (e.g. 60)
  snap: boolean;
  rippleDelete: boolean;
}

export interface ExportSettings {
  resolution: '720p' | '1080p' | '4k';
  fps: 30 | 60;
  quality: 'standard' | 'high' | 'ultra';
  format: 'webm' | 'mp4';
}
