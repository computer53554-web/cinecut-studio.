import { FilterPreset, MediaAsset } from '../types/editor';

// Generated image assets from earlier step
export const DEFAULT_SAMPLE_MEDIA: MediaAsset[] = [
  {
    id: 'sample-neon-city',
    name: 'Cyberpunk Neon Rain.mp4',
    type: 'video',
    url: '/src/assets/images/urban_neon_night_1794217355474.jpg',
    thumbnail: '/src/assets/images/urban_neon_night_1794217355474.jpg',
    duration: 12,
    width: 1920,
    height: 1080,
  },
  {
    id: 'sample-alpine-lake',
    name: 'Alpine Lake Drone.mp4',
    type: 'video',
    url: '/src/assets/images/nature_mountain_lake_1794217356296.jpg',
    thumbnail: '/src/assets/images/nature_mountain_lake_1794217356296.jpg',
    duration: 15,
    width: 1920,
    height: 1080,
  },
  {
    id: 'sample-film-portrait',
    name: 'Vintage 35mm Portrait.jpg',
    type: 'image',
    url: '/src/assets/images/retro_film_portrait_1794217356562.jpg',
    thumbnail: '/src/assets/images/retro_film_portrait_1794217356562.jpg',
    duration: 6,
    width: 1920,
    height: 1080,
  },
  {
    id: 'sample-abstract-wave',
    name: 'Kinetic Neon Motion.mp4',
    type: 'video',
    url: '/src/assets/images/abstract_wave_energy_1794217356221.jpg',
    thumbnail: '/src/assets/images/abstract_wave_energy_1794217356221.jpg',
    duration: 10,
    width: 1920,
    height: 1080,
  },
];

export interface BuiltinSoundtrack {
  id: string;
  name: string;
  genre: 'lofi' | 'synthwave' | 'cinematic' | 'vlog';
  duration: number;
  bpm: number;
  description: string;
}

export const BUILTIN_SOUNDTRACKS: BuiltinSoundtrack[] = [
  {
    id: 'audio-lofi-beats',
    name: 'Midnight Lo-Fi Coffee',
    genre: 'lofi',
    duration: 30,
    bpm: 80,
    description: 'Warm Rhodes chords with vinyl crackle and relaxed boom-bap drums',
  },
  {
    id: 'audio-synthwave-pulse',
    name: 'Neon Highway 1984',
    genre: 'synthwave',
    duration: 30,
    bpm: 120,
    description: 'Driving 80s bassline, analog synth arpeggios, and punchy gated snare',
  },
  {
    id: 'audio-cinematic-swell',
    name: 'Horizon Dawn Awakening',
    genre: 'cinematic',
    duration: 30,
    bpm: 70,
    description: 'Epic emotional strings, deep sub drone, and cinematic swell',
  },
  {
    id: 'audio-vlog-groove',
    name: 'Sunlit Boulevard Vlog',
    genre: 'vlog',
    duration: 30,
    bpm: 115,
    description: 'Upbeat acoustic guitar rhythm with snappy claps and cheerful bounce',
  },
];

export interface StickerItem {
  id: string;
  name: string;
  category: 'emojis' | 'badges' | 'arrows' | 'cyber' | 'cinematic';
  svg: string;
}

export const STICKER_CATALOG: StickerItem[] = [
  // Emojis & Reactions
  {
    id: 'stk-fire',
    name: 'Fire Flame',
    category: 'emojis',
    svg: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C12 2 15 5 15 8C15 9.5 14 11 14 11C14 11 16 10 17 8C17 8 19 10 19 13C19 17.5 15.5 21 12 21C8.5 21 5 17.5 5 13C5 9.5 8 5.5 12 2Z" fill="#F97316"/><path d="M12 9C12 9 13.5 11 13.5 13C13.5 14 13 15 13 15C13 15 14 14.5 14.5 13.5C14.5 13.5 16 15 16 16.5C16 19 14.5 20 12 20C9.5 20 8 18.5 8 16.5C8 14 10 11.5 12 9Z" fill="#FDE047"/></svg>`,
  },
  {
    id: 'stk-sparkles',
    name: 'Golden Sparkles',
    category: 'emojis',
    svg: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L14.5 8.5L21 11L14.5 13.5L12 20L9.5 13.5L3 11L9.5 8.5L12 2Z" fill="#FACC15"/><path d="M19 16L20 18.5L22.5 19.5L20 20.5L19 23L18 20.5L15.5 19.5L18 18.5L19 16Z" fill="#FDE047"/></svg>`,
  },
  {
    id: 'stk-heart',
    name: 'Neon Heart',
    category: 'emojis',
    svg: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 21.35L10.55 20.03C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5C22 12.28 18.6 15.36 13.45 20.04L12 21.35Z" fill="#EC4899" stroke="#F472B6" stroke-width="1.5"/></svg>`,
  },
  {
    id: 'stk-100',
    name: '100 Percent',
    category: 'emojis',
    svg: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><text x="2" y="16" font-family="Arial, sans-serif" font-weight="900" font-size="14" fill="#EF4444">100</text><line x1="2" y1="20" x2="22" y2="20" stroke="#EF4444" stroke-width="2.5" stroke-linecap="round"/><line x1="2" y1="23" x2="22" y2="23" stroke="#EF4444" stroke-width="2" stroke-linecap="round"/></svg>`,
  },

  // Badges & Creator UI
  {
    id: 'stk-subscribe',
    name: 'Subscribe Button',
    category: 'badges',
    svg: `<svg viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="120" height="40" rx="8" fill="#DC2626"/><circle cx="24" cy="20" r="10" fill="white"/><polygon points="21,15 29,20 21,25" fill="#DC2626"/><text x="44" y="25" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" font-size="14" fill="white" letter-spacing="1">SUBSCRIBE</text></svg>`,
  },
  {
    id: 'stk-like',
    name: 'Like Thumbs Up',
    category: 'badges',
    svg: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 9V5C14 3.34 12.66 2 11 2C10.5 2 10.1 2.2 9.8 2.5L5.4 7.6C5.1 8 5 8.5 5 9V19C5 20.1 5.9 21 7 21H16.6C17.4 21 18.1 20.5 18.4 19.8L21.3 12.8C21.4 12.5 21.5 12.3 21.5 12V10C21.5 8.9 20.6 8 19.5 8H14.8L15.6 4.3C15.6 4.1 15.6 3.9 15.5 3.7L14 9Z" fill="#3B82F6"/><path d="M2 9H5V21H2V9Z" fill="#1D4ED8"/></svg>`,
  },
  {
    id: 'stk-must-watch',
    name: 'Must Watch Tag',
    category: 'badges',
    svg: `<svg viewBox="0 0 110 32" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="110" height="32" rx="4" fill="#0F172A" stroke="#EAB308" stroke-width="2"/><text x="10" y="21" font-family="'JetBrains Mono', monospace" font-weight="800" font-size="12" fill="#EAB308" letter-spacing="1.5">MUST WATCH</text></svg>`,
  },
  {
    id: 'stk-vlog-badge',
    name: 'Vlog Daily',
    category: 'badges',
    svg: `<svg viewBox="0 0 90 32" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="90" height="32" rx="16" fill="#7C3AED"/><text x="16" y="21" font-family="'Plus Jakarta Sans', sans-serif" font-weight="700" font-size="13" fill="white">DAILY VLOG</text></svg>`,
  },

  // Arrows & Direction
  {
    id: 'stk-neon-arrow',
    name: 'Neon Glow Arrow',
    category: 'arrows',
    svg: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 24H40M40 24L26 10M40 24L26 38" stroke="#38BDF8" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  },
  {
    id: 'stk-curved-arrow',
    name: 'Curved Doodle Arrow',
    category: 'arrows',
    svg: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 38C12 24 22 14 38 16M38 16L30 8M38 16L36 26" stroke="#F59E0B" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  },
  {
    id: 'stk-target-cross',
    name: 'Sniper Focus Crosshair',
    category: 'arrows',
    svg: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="24" cy="24" r="16" stroke="#EF4444" stroke-width="2" stroke-dasharray="6 4"/><line x1="24" y1="4" x2="24" y2="44" stroke="#EF4444" stroke-width="2"/><line x1="4" y1="24" x2="44" y2="24" stroke="#EF4444" stroke-width="2"/><circle cx="24" cy="24" r="3" fill="#EF4444"/></svg>`,
  },

  // Cyber & Effects
  {
    id: 'stk-rec-dot',
    name: 'REC Camera Indicator',
    category: 'cyber',
    svg: `<svg viewBox="0 0 80 28" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="14" cy="14" r="7" fill="#DC2626"/><text x="28" y="20" font-family="'JetBrains Mono', monospace" font-weight="900" font-size="16" fill="#DC2626" letter-spacing="2">REC</text></svg>`,
  },
  {
    id: 'stk-soundwave',
    name: 'Audio Pulse Wave',
    category: 'cyber',
    svg: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><line x1="6" y1="18" x2="6" y2="30" stroke="#06B6D4" stroke-width="4" stroke-linecap="round"/><line x1="15" y1="10" x2="15" y2="38" stroke="#06B6D4" stroke-width="4" stroke-linecap="round"/><line x1="24" y1="4" x2="24" y2="44" stroke="#06B6D4" stroke-width="4" stroke-linecap="round"/><line x1="33" y1="12" x2="33" y2="36" stroke="#06B6D4" stroke-width="4" stroke-linecap="round"/><line x1="42" y1="20" x2="42" y2="28" stroke="#06B6D4" stroke-width="4" stroke-linecap="round"/></svg>`,
  },
  {
    id: 'stk-glitch-badge',
    name: 'Glitch Warning Matrix',
    category: 'cyber',
    svg: `<svg viewBox="0 0 100 32" fill="none" xmlns="http://www.w3.org/2000/svg"><polygon points="0,0 92,0 100,16 92,32 0,32 8,16" fill="#A855F7"/><text x="18" y="21" font-family="'JetBrains Mono', monospace" font-weight="800" font-size="12" fill="#000" letter-spacing="1">SYSTEM // AI</text></svg>`,
  },

  // Cinematic Overlays
  {
    id: 'stk-viewfinder',
    name: 'Cinematic Viewfinder',
    category: 'cinematic',
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 16V4H16M48 4H60V16M60 48V60H48M16 60H4V48" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/><circle cx="32" cy="32" r="8" stroke="#FFFFFF" stroke-width="1.5"/></svg>`,
  },
  {
    id: 'stk-film-stamp',
    name: '35mm Film Gauge',
    category: 'cinematic',
    svg: `<svg viewBox="0 0 80 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="80" height="24" rx="3" fill="#18181B"/><circle cx="8" cy="12" r="3.5" fill="#F43F5E"/><text x="18" y="17" font-family="'JetBrains Mono', monospace" font-weight="700" font-size="11" fill="#F43F5E" letter-spacing="1">KODAK 400</text></svg>`,
  },
];

export interface FilterPresetInfo {
  id: FilterPreset;
  name: string;
  description: string;
  brightness: number;
  contrast: number;
  saturation: number;
  temperature: number;
  vignette: number;
  sepia: number;
  blur: number;
}

export const FILTER_PRESETS: FilterPresetInfo[] = [
  {
    id: 'none',
    name: 'Original',
    description: 'Natural straight-out-of-camera color profile',
    brightness: 0,
    contrast: 0,
    saturation: 0,
    temperature: 0,
    vignette: 0,
    sepia: 0,
    blur: 0,
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Neon',
    description: 'High contrast with cyan shadows and glowing magenta/orange highlights',
    brightness: 8,
    contrast: 35,
    saturation: 45,
    temperature: -20,
    vignette: 40,
    sepia: 0,
    blur: 0,
  },
  {
    id: 'vintage',
    name: 'Vintage 35mm',
    description: 'Warm analog grain feel, lowered contrast, and golden hues',
    brightness: -5,
    contrast: -10,
    saturation: -15,
    temperature: 30,
    vignette: 30,
    sepia: 25,
    blur: 0,
  },
  {
    id: 'noir',
    name: 'Moody Noir B&W',
    description: 'High dynamic black and white with deep crushed blacks',
    brightness: -5,
    contrast: 40,
    saturation: -100,
    temperature: 0,
    vignette: 55,
    sepia: 0,
    blur: 0,
  },
  {
    id: 'golden',
    name: 'Golden Hour Glow',
    description: 'Rich sunset warmth with soft radiant skin tones',
    brightness: 10,
    contrast: 15,
    saturation: 30,
    temperature: 45,
    vignette: 20,
    sepia: 10,
    blur: 0,
  },
  {
    id: 'vhs',
    name: 'VHS Retro Tape',
    description: 'Low saturation tape aesthetic with slight chromatic shift',
    brightness: 5,
    contrast: 20,
    saturation: -20,
    temperature: 15,
    vignette: 45,
    sepia: 15,
    blur: 1,
  },
  {
    id: 'pastel',
    name: 'Pastel Dream',
    description: 'Lifted shadows, gentle softening, and dreamy candy hues',
    brightness: 18,
    contrast: -15,
    saturation: 15,
    temperature: 10,
    vignette: 10,
    sepia: 0,
    blur: 0.5,
  },
  {
    id: 'bleach',
    name: 'Bleach Bypass',
    description: 'Edgy blockbuster war film look with reduced saturation and harsh contrast',
    brightness: -10,
    contrast: 50,
    saturation: -45,
    temperature: -10,
    vignette: 45,
    sepia: 0,
    blur: 0,
  },
  {
    id: 'emerald',
    name: 'Emerald Forest',
    description: 'Deep lush foliage greens with cool cinematic mist',
    brightness: 0,
    contrast: 25,
    saturation: 25,
    temperature: -35,
    vignette: 30,
    sepia: 0,
    blur: 0,
  },
];
