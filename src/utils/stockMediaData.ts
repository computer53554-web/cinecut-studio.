export interface StockTrack {
  id: string;
  name: string;
  genre: 'lofi' | 'synthwave' | 'cinematic' | 'vlog' | 'chillhop' | 'electronic' | 'ambient';
  duration: number;
  bpm: number;
  tag: string;
  description: string;
}

export interface StockSfx {
  id: string;
  name: string;
  type: 'whoosh' | 'boom' | 'click' | 'pop' | 'glitch' | 'laser';
  duration: number;
  category: 'Transitions' | 'Cinematic' | 'Foley' | 'Interface' | 'Sci-Fi';
  description: string;
}

export interface StockTemplate {
  id: string;
  name: string;
  category: 'Hooks' | 'Social' | 'LowerThirds' | 'Overlays';
  previewText: string;
  color: string;
  bg: string;
  strokeColor?: string;
  animation: 'bounce' | 'slideUp' | 'typewriter' | 'pulse' | 'glitch';
  fontFamily: string;
  description: string;
}

export const STOCK_MUSIC: StockTrack[] = [
  {
    id: 'stock-lofi-night',
    name: 'Midnight Study Sessions',
    genre: 'lofi',
    duration: 30,
    bpm: 80,
    tag: 'Chill & Study',
    description: 'Warm vinyl warmth, lush Rhodes keys, and relaxing boom bap drums',
  },
  {
    id: 'stock-chillhop-cafe',
    name: 'Coffee Shop Horizon',
    genre: 'chillhop',
    duration: 30,
    bpm: 85,
    tag: 'Relax & Cafe',
    description: 'Breezy acoustic guitars with jazz chords and smooth finger snaps',
  },
  {
    id: 'stock-synthwave-arcade',
    name: 'Cyberpunk Drive 1989',
    genre: 'synthwave',
    duration: 30,
    bpm: 120,
    tag: 'Action & Gaming',
    description: 'Fast retro analog arpeggios, driving synth bass, and gated reverbs',
  },
  {
    id: 'stock-electronic-drop',
    name: 'Neon Velocity Club',
    genre: 'electronic',
    duration: 30,
    bpm: 124,
    tag: 'Hype & Workout',
    description: 'High energy four-on-the-floor kick, synth lead, and punchy breakdown',
  },
  {
    id: 'stock-cinematic-epic',
    name: 'Celestial Dawn Awakening',
    genre: 'cinematic',
    duration: 30,
    bpm: 70,
    tag: 'Travel & Film',
    description: 'Deep sub bass swells, sweeping ambient strings, and heroic chord rises',
  },
  {
    id: 'stock-ambient-clouds',
    name: 'Ethereal Mist Drift',
    genre: 'ambient',
    duration: 30,
    bpm: 65,
    tag: 'Meditation & Calm',
    description: 'Gentle atmospheric resonance, floating pads, and peaceful harmony',
  },
  {
    id: 'stock-vlog-sunshine',
    name: 'Golden Hour Story',
    genre: 'vlog',
    duration: 30,
    bpm: 115,
    tag: 'Daily Vlog',
    description: 'Upbeat acoustic strums, clap rhythms, and cheerful bright mood',
  },
];

export const STOCK_SFX: StockSfx[] = [
  {
    id: 'sfx-whoosh-fast',
    name: 'Fast Cinema Whoosh',
    type: 'whoosh',
    duration: 0.8,
    category: 'Transitions',
    description: 'Dynamic air sweep perfect for fast zooms and wipe transitions',
  },
  {
    id: 'sfx-sub-boom',
    name: 'Cinematic Sub Impact',
    type: 'boom',
    duration: 1.5,
    category: 'Cinematic',
    description: 'Deep heavy sub-bass drop for dramatic moments and title cards',
  },
  {
    id: 'sfx-camera-shutter',
    name: 'DSLR Camera Click',
    type: 'click',
    duration: 0.6,
    category: 'Foley',
    description: 'Mechanical shutter snap for photo freeze frames and b-roll cuts',
  },
  {
    id: 'sfx-pop-bubble',
    name: 'Juicy Bubble Pop',
    type: 'pop',
    duration: 0.5,
    category: 'Interface',
    description: 'Cheerful bright pop for sticker arrivals and like buttons',
  },
  {
    id: 'sfx-glitch-burst',
    name: 'Digital Matrix Glitch',
    type: 'glitch',
    duration: 0.7,
    category: 'Sci-Fi',
    description: 'High frequency data distortion for glitch cuts and cyber edits',
  },
  {
    id: 'sfx-laser-zap',
    name: 'Laser Beam Zap',
    type: 'laser',
    duration: 0.8,
    category: 'Sci-Fi',
    description: 'Futuristic energy beam sound for dynamic motion graphics',
  },
];

export const STOCK_TEMPLATES: StockTemplate[] = [
  {
    id: 'tpl-pov-viral',
    name: 'POV Hook Overlay',
    category: 'Hooks',
    previewText: 'POV: YOU JUST FOUND THE BEST EDITOR',
    color: '#FEF08A',
    bg: 'rgba(0, 0, 0, 0.8)',
    strokeColor: '#78350F',
    animation: 'bounce',
    fontFamily: 'Plus Jakarta Sans',
    description: 'High CTR TikTok & Reels viral hook with punchy yellow text',
  },
  {
    id: 'tpl-wait-for-it',
    name: 'Wait For It Hook',
    category: 'Hooks',
    previewText: 'WAIT UNTIL THE END... 😱',
    color: '#FFFFFF',
    bg: '#DC2626',
    strokeColor: '#000000',
    animation: 'pulse',
    fontFamily: 'Plus Jakarta Sans',
    description: 'Red banner attention-grabber with pulsing urgency',
  },
  {
    id: 'tpl-follow-more',
    name: 'Follow For More',
    category: 'Social',
    previewText: 'FOLLOW FOR PART 2 🔔',
    color: '#38BDF8',
    bg: 'rgba(15, 23, 42, 0.9)',
    strokeColor: '#0369A1',
    animation: 'slideUp',
    fontFamily: 'Plus Jakarta Sans',
    description: 'Sleek social CTA badge with blue accent glow',
  },
  {
    id: 'tpl-cyber-tag',
    name: 'Cyberpunk Data Stamp',
    category: 'Overlays',
    previewText: 'RECORDING // SEC. 04',
    color: '#F43F5E',
    bg: '#0F172A',
    animation: 'glitch',
    fontFamily: 'JetBrains Mono',
    description: 'Futuristic HUD telemetry stamp with monospace styling',
  },
  {
    id: 'tpl-lower-third',
    name: 'Minimal Lower Third',
    category: 'LowerThirds',
    previewText: 'ALEX RIVERA  ·  CREATIVE DIRECTOR',
    color: '#FFFFFF',
    bg: 'rgba(30, 41, 59, 0.85)',
    animation: 'slideUp',
    fontFamily: 'Plus Jakarta Sans',
    description: 'Professional speaker introduction lower third card',
  },
  {
    id: 'tpl-before-after',
    name: 'Before vs After Tag',
    category: 'Hooks',
    previewText: 'BEFORE  ⇄  AFTER',
    color: '#FACC15',
    bg: 'rgba(0, 0, 0, 0.75)',
    animation: 'typewriter',
    fontFamily: 'Plus Jakarta Sans',
    description: 'Comparison subtitle for color grading and editing reveals',
  },
];
