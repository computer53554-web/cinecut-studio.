import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Search,
  Play,
  Pause,
  Plus,
  Heart,
  Volume2,
  Music,
  Check,
  Disc3,
  Upload,
  Radio,
  Sparkles,
  Zap,
  Activity,
  FileAudio,
} from 'lucide-react';
import { MediaAsset } from '../types/editor';
import { STOCK_MUSIC, STOCK_SFX, StockSfx } from '../utils/stockMediaData';
import { audioEngine } from '../utils/audioEngine';

interface MusicLibraryPanelProps {
  onImportToAudioTrack: (asset: MediaAsset) => void;
  onUploadCustomTrack?: (file: File) => void;
}

export interface CuratedMusicTrack {
  id: string;
  name: string;
  artist: string;
  genre: 'lofi' | 'synthwave' | 'cinematic' | 'vlog' | 'chillhop' | 'electronic' | 'ambient';
  duration: number;
  bpm: number;
  tag: string;
  moods: string[];
  description: string;
}

export const ALL_ROYALTY_FREE_TRACKS: CuratedMusicTrack[] = [
  {
    id: 'music-lofi-midnight',
    name: 'Midnight Study Sessions',
    artist: 'CineLofi Studio',
    genre: 'lofi',
    duration: 30,
    bpm: 80,
    tag: 'Lo-Fi Chill',
    moods: ['Relaxing', 'Study', 'Coffee'],
    description: 'Warm vinyl warmth, lush Rhodes keys, and relaxing boom-bap drums',
  },
  {
    id: 'music-chillhop-horizon',
    name: 'Coffee Shop Horizon',
    artist: 'Acoustic Brew',
    genre: 'chillhop',
    duration: 30,
    bpm: 85,
    tag: 'Chillhop',
    moods: ['Coffee', 'Morning', 'Acoustic'],
    description: 'Breezy acoustic guitars with jazz chords and smooth finger snaps',
  },
  {
    id: 'music-synthwave-highway',
    name: 'Neon Highway 1984',
    artist: 'RetroGrid',
    genre: 'synthwave',
    duration: 30,
    bpm: 120,
    tag: 'Synthwave',
    moods: ['Retro', 'Gaming', 'Action'],
    description: 'Fast retro analog arpeggios, driving synth bass, and punchy gated snare',
  },
  {
    id: 'music-vlog-boulevard',
    name: 'Sunlit Boulevard Vlog',
    artist: 'Sunny Vibes',
    genre: 'vlog',
    duration: 30,
    bpm: 115,
    tag: 'Upbeat Vlog',
    moods: ['Happy', 'Travel', 'Daily Vlog'],
    description: 'Upbeat acoustic guitar rhythm with snappy claps and cheerful bounce',
  },
  {
    id: 'music-cinematic-dawn',
    name: 'Horizon Dawn Awakening',
    artist: 'Atlas Symphony',
    genre: 'cinematic',
    duration: 30,
    bpm: 70,
    tag: 'Cinematic',
    moods: ['Dramatic', 'Inspiring', 'Film'],
    description: 'Deep sub bass drone, sweeping emotional strings, and heroic swell',
  },
  {
    id: 'music-electronic-velocity',
    name: 'Neon Velocity Club',
    artist: 'Pulse FX',
    genre: 'electronic',
    duration: 30,
    bpm: 124,
    tag: 'Electronic',
    moods: ['Hype', 'Dance', 'Workout'],
    description: 'High energy four-on-the-floor kick, synth lead, and punchy breakdown',
  },
  {
    id: 'music-ambient-mist',
    name: 'Ethereal Mist Drift',
    artist: 'Quiet Space',
    genre: 'ambient',
    duration: 30,
    bpm: 65,
    tag: 'Ambient',
    moods: ['Meditation', 'Calm', 'Space'],
    description: 'Gentle atmospheric resonance, floating pads, and peaceful harmony',
  },
  {
    id: 'music-synthwave-drift',
    name: 'Tokyo Cyber Drift',
    artist: 'Shibuya Night',
    genre: 'synthwave',
    duration: 30,
    bpm: 128,
    tag: 'Synthwave',
    moods: ['Fast', 'Gaming', 'Cyberpunk'],
    description: '80s analog bassline with arpeggios and futuristic high-speed energy',
  },
];

type AudioPanelTab = 'music' | 'sfx' | 'custom';

export const MusicLibraryPanel: React.FC<MusicLibraryPanelProps> = ({
  onImportToAudioTrack,
  onUploadCustomTrack,
}) => {
  const [panelTab, setPanelTab] = useState<AudioPanelTab>('music');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [selectedMood, setSelectedMood] = useState<string>('all');
  const [sfxCategory, setSfxCategory] = useState<string>('all');
  const [favorites, setFavorites] = useState<Set<string>>(new Set(['music-lofi-midnight']));
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [recentlyAddedId, setRecentlyAddedId] = useState<string | null>(null);

  // Custom audio upload & waveform state
  const customFileInputRef = useRef<HTMLInputElement>(null);
  const [customAudioFile, setCustomAudioFile] = useState<{
    file: File;
    name: string;
    url: string;
    duration: number;
    peaks: number[];
    buffer: AudioBuffer | null;
  } | null>(null);
  const [customPlaybackPos, setCustomPlaybackPos] = useState<number>(0);
  const waveformCanvasRef = useRef<HTMLCanvasElement>(null);

  const genres = [
    { id: 'all', label: 'All' },
    { id: 'favorites', label: '★ Favorites' },
    { id: 'lofi', label: 'Lo-Fi' },
    { id: 'synthwave', label: 'Synthwave' },
    { id: 'vlog', label: 'Vlog' },
    { id: 'cinematic', label: 'Cinematic' },
    { id: 'chillhop', label: 'Chillhop' },
    { id: 'electronic', label: 'Electronic' },
    { id: 'ambient', label: 'Ambient' },
  ];

  const sfxCategories = ['all', 'Transitions', 'Cinematic', 'Interface', 'Sci-Fi', 'Foley'];

  // Toggle favorite
  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Music preview playback
  const handleTogglePlayMusic = (track: CuratedMusicTrack) => {
    if (playingAudioId === track.id) {
      audioEngine.stopAll();
      setPlayingAudioId(null);
      return;
    }

    audioEngine.stopAll();
    let buffer = audioEngine.getBuffer(track.id);
    if (!buffer) {
      buffer = audioEngine.createSynthTrack(track.genre, track.duration);
      audioEngine.setBuffer(track.id, buffer);
    }

    audioEngine.playClip(track.id, buffer, 0, track.duration, 0, 0, 0.85, 0.3, 0.5, 1.0, false);
    setPlayingAudioId(track.id);
  };

  // SFX preview playback
  const handleTogglePlaySfx = (sfx: StockSfx) => {
    if (playingAudioId === sfx.id) {
      audioEngine.stopAll();
      setPlayingAudioId(null);
      return;
    }

    audioEngine.stopAll();
    let buffer = audioEngine.getBuffer(sfx.id);
    if (!buffer) {
      buffer = audioEngine.createSoundEffect(sfx.type, sfx.duration);
      audioEngine.setBuffer(sfx.id, buffer);
    }

    audioEngine.playClip(sfx.id, buffer, 0, sfx.duration, 0, 0, 0.9, 0.05, 0.1, 1.0, false);
    setPlayingAudioId(sfx.id);
  };

  // Import track to project audio track
  const handleImportTrack = (track: CuratedMusicTrack) => {
    let buffer = audioEngine.getBuffer(track.id);
    if (!buffer) {
      buffer = audioEngine.createSynthTrack(track.genre, track.duration);
      audioEngine.setBuffer(track.id, buffer);
    }

    const asset: MediaAsset = {
      id: track.id,
      name: `${track.name}.wav`,
      type: 'audio',
      url: '',
      duration: track.duration,
      thumbnail: '',
    };

    onImportToAudioTrack(asset);
    setRecentlyAddedId(track.id);
    setTimeout(() => {
      setRecentlyAddedId((curr) => (curr === track.id ? null : curr));
    }, 2000);
  };

  // Import SFX to project audio track
  const handleImportSfx = (sfx: StockSfx) => {
    let buffer = audioEngine.getBuffer(sfx.id);
    if (!buffer) {
      buffer = audioEngine.createSoundEffect(sfx.type, sfx.duration);
      audioEngine.setBuffer(sfx.id, buffer);
    }

    const asset: MediaAsset = {
      id: sfx.id,
      name: `${sfx.name}.wav`,
      type: 'audio',
      url: '',
      duration: sfx.duration,
      thumbnail: '',
    };

    onImportToAudioTrack(asset);
    setRecentlyAddedId(sfx.id);
    setTimeout(() => {
      setRecentlyAddedId((curr) => (curr === sfx.id ? null : curr));
    }, 2000);
  };

  // Custom audio file upload & waveform extraction
  const handleCustomFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const url = URL.createObjectURL(file);

    try {
      const audioCtx = audioEngine.getContext();
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      const peaks = audioEngine.extractWaveformPeaks(audioBuffer, 120);

      const customId = `custom-audio-${Date.now()}`;
      audioEngine.setBuffer(customId, audioBuffer);

      setCustomAudioFile({
        file,
        name: file.name.replace(/\.[^/.]+$/, ''),
        url,
        duration: Math.round(audioBuffer.duration * 10) / 10,
        peaks,
        buffer: audioBuffer,
      });

      if (onUploadCustomTrack) {
        onUploadCustomTrack(file);
      }
    } catch {
      // Fallback synthetic buffer if decoding fails
      const fallbackBuffer = audioEngine.createSynthTrack('lofi', 30);
      const peaks = audioEngine.extractWaveformPeaks(fallbackBuffer, 120);
      setCustomAudioFile({
        file,
        name: file.name.replace(/\.[^/.]+$/, ''),
        url,
        duration: 30,
        peaks,
        buffer: fallbackBuffer,
      });
    }
  };

  // Draw custom waveform
  useEffect(() => {
    const canvas = waveformCanvasRef.current;
    if (!canvas || !customAudioFile) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const peaks = customAudioFile.peaks;
    const barWidth = width / peaks.length;

    peaks.forEach((peak, i) => {
      const barHeight = Math.max(4, peak * (height - 8));
      const x = i * barWidth;
      const y = (height - barHeight) / 2;

      const progressRatio = customAudioFile.duration > 0 ? customPlaybackPos / customAudioFile.duration : 0;
      const isPlayed = i / peaks.length <= progressRatio;

      ctx.fillStyle = isPlayed ? '#10b981' : '#334155';
      ctx.fillRect(x, y, Math.max(1, barWidth - 1), barHeight);
    });
  }, [customAudioFile, customPlaybackPos]);

  // Import uploaded custom song to timeline
  const handleImportCustomSong = () => {
    if (!customAudioFile) return;

    const customId = `audio-${Date.now()}`;
    if (customAudioFile.buffer) {
      audioEngine.setBuffer(customId, customAudioFile.buffer);
    }

    const asset: MediaAsset = {
      id: customId,
      name: `${customAudioFile.name}.wav`,
      type: 'audio',
      url: customAudioFile.url,
      duration: customAudioFile.duration,
      thumbnail: '',
    };

    onImportToAudioTrack(asset);
    setRecentlyAddedId(customId);
  };

  // Filter music tracks
  const filteredTracks = useMemo(() => {
    return ALL_ROYALTY_FREE_TRACKS.filter((track) => {
      if (selectedGenre === 'favorites') {
        if (!favorites.has(track.id)) return false;
      } else if (selectedGenre !== 'all' && track.genre !== selectedGenre) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = track.name.toLowerCase().includes(q);
        const matchesTag = track.tag.toLowerCase().includes(q);
        const matchesDesc = track.description.toLowerCase().includes(q);
        if (!matchesName && !matchesTag && !matchesDesc) return false;
      }

      return true;
    });
  }, [selectedGenre, searchQuery, favorites]);

  // Filter SFX tracks
  const filteredSfx = useMemo(() => {
    return STOCK_SFX.filter((sfx) => {
      if (sfxCategory !== 'all' && sfx.category !== sfxCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return sfx.name.toLowerCase().includes(q) || sfx.description.toLowerCase().includes(q);
      }
      return true;
    });
  }, [sfxCategory, searchQuery]);

  return (
    <div className="flex flex-col h-full space-y-3 select-none">
      {/* 1. Header with 3 Sub-tabs */}
      <div className="flex flex-col gap-2 pb-2 border-b border-[#1b2333]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Music className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-white tracking-wide uppercase">
              Audio & Music
            </span>
          </div>
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            CapCut Sound Engine
          </span>
        </div>

        {/* 3 Main Categories: Music, SFX, Custom Import */}
        <div className="grid grid-cols-3 gap-1 bg-[#101622] p-1 rounded-xl border border-[#1e2638]">
          <button
            onClick={() => setPanelTab('music')}
            className={`py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              panelTab === 'music'
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            <span>Music</span>
          </button>

          <button
            onClick={() => setPanelTab('sfx')}
            className={`py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              panelTab === 'sfx'
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Sound FX</span>
          </button>

          <button
            onClick={() => setPanelTab('custom')}
            className={`py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              panelTab === 'custom'
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import</span>
          </button>
        </div>
      </div>

      {/* 2. TAB: Music Library */}
      {panelTab === 'music' && (
        <div className="flex-1 flex flex-col space-y-2.5 overflow-hidden">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search royalty-free music..."
              className="w-full bg-[#131924] border border-[#20293a] rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-emerald-500/60 transition-colors"
            />
          </div>

          {/* Genre Chips */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs no-scrollbar shrink-0">
            {genres.map((g) => (
              <button
                key={g.id}
                onClick={() => setSelectedGenre(g.id)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedGenre === g.id
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'bg-[#141923] text-slate-400 hover:text-slate-200 hover:bg-[#1a2130]'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>

          {/* Track List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-0.5">
            {filteredTracks.map((track) => {
              const isPlaying = playingAudioId === track.id;
              const isFav = favorites.has(track.id);
              const isAdded = recentlyAddedId === track.id;

              return (
                <div
                  key={track.id}
                  className={`p-2.5 rounded-xl border transition-all flex flex-col gap-2 ${
                    isPlaying
                      ? 'bg-[#121c24] border-emerald-500/50 shadow-md shadow-emerald-500/10'
                      : 'bg-[#111722] border-[#1f283a] hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <button
                        onClick={() => handleTogglePlayMusic(track)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-95 ${
                          isPlaying
                            ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                            : 'bg-[#192231] text-emerald-400 hover:bg-emerald-500 hover:text-white'
                        }`}
                      >
                        {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5 fill-current" />}
                      </button>

                      <div className="min-w-0">
                        <span className="text-xs font-bold text-white truncate block">
                          {track.name}
                        </span>
                        <span className="text-[10px] text-slate-400 truncate block">
                          {track.artist} · {track.bpm} BPM · {track.duration}s
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={(e) => toggleFavorite(track.id, e)}
                        className={`p-1.5 rounded-lg text-xs ${
                          isFav ? 'text-amber-400' : 'text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-amber-400' : ''}`} />
                      </button>

                      <button
                        onClick={() => handleImportTrack(track)}
                        disabled={isAdded}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                          isAdded
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-sm'
                        }`}
                      >
                        {isAdded ? (
                          <>
                            <Check className="w-3 h-3" />
                            <span>Added</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3 h-3" />
                            <span>Use</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Waveform graphic visualization when active */}
                  {isPlaying && (
                    <div className="h-4 flex items-center gap-0.5 opacity-80 animate-in fade-in">
                      {Array.from({ length: 32 }).map((_, i) => (
                        <div
                          key={i}
                          style={{
                            height: `${Math.max(20, Math.sin(i * 0.4 + Date.now() * 0.002) * 50 + 50)}%`,
                          }}
                          className="w-1 bg-emerald-400 rounded-full transition-all duration-75"
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. TAB: Sound Effects (SFX) */}
      {panelTab === 'sfx' && (
        <div className="flex-1 flex flex-col space-y-2.5 overflow-hidden">
          {/* SFX Categories */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs no-scrollbar shrink-0">
            {sfxCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSfxCategory(cat)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap capitalize transition-colors ${
                  sfxCategory === cat
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'bg-[#141923] text-slate-400 hover:text-slate-200 hover:bg-[#1a2130]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* SFX List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-0.5">
            {filteredSfx.map((sfx) => {
              const isPlaying = playingAudioId === sfx.id;
              const isAdded = recentlyAddedId === sfx.id;

              return (
                <div
                  key={sfx.id}
                  className="p-2.5 rounded-xl border border-[#1f283a] bg-[#111722] hover:border-slate-700 transition-all flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <button
                      onClick={() => handleTogglePlaySfx(sfx)}
                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-95 ${
                        isPlaying
                          ? 'bg-emerald-500 text-white shadow-md'
                          : 'bg-[#192231] text-emerald-400 hover:bg-emerald-500 hover:text-white'
                      }`}
                    >
                      {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 ml-0.5 fill-current" />}
                    </button>

                    <div className="min-w-0">
                      <span className="text-xs font-bold text-white truncate block">
                        {sfx.name}
                      </span>
                      <span className="text-[10px] text-slate-400 truncate block">
                        {sfx.category} · {sfx.duration}s
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleImportSfx(sfx)}
                    disabled={isAdded}
                    className={`px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                      isAdded
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-[#18212e] hover:bg-emerald-500 text-slate-300 hover:text-white'
                    }`}
                  >
                    {isAdded ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                    <span>{isAdded ? 'Added' : 'Add'}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. TAB: Custom Audio Import with Waveform Preview */}
      {panelTab === 'custom' && (
        <div className="flex-1 flex flex-col space-y-3 overflow-y-auto">
          <input
            ref={customFileInputRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={handleCustomFileUpload}
          />

          {/* Upload Button Box */}
          <div
            onClick={() => customFileInputRef.current?.click()}
            className="p-6 rounded-2xl border-2 border-dashed border-[#232d40] hover:border-emerald-400/80 bg-[#101622] hover:bg-emerald-950/20 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all group"
          >
            <div className="w-12 h-12 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
              <Upload className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-white">Import Custom Audio Track</span>
            <span className="text-[10px] text-slate-400">MP3, WAV, AAC, M4A with Waveform Analysis</span>
          </div>

          {/* Custom Track Loaded Card */}
          {customAudioFile && (
            <div className="p-3.5 rounded-2xl bg-[#111722] border border-emerald-500/40 shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <FileAudio className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-xs font-bold text-white truncate">{customAudioFile.name}</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 shrink-0">
                  {customAudioFile.duration}s
                </span>
              </div>

              {/* Waveform Canvas */}
              <div className="bg-[#0b0e15] rounded-xl p-2 border border-[#1b2333] relative">
                <canvas ref={waveformCanvasRef} width={280} height={48} className="w-full h-12" />
              </div>

              {/* Action Buttons */}
              <button
                onClick={handleImportCustomSong}
                className="w-full py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5 transition-transform active:scale-98"
              >
                <Plus className="w-4 h-4" />
                <span>Add to Timeline Audio Track</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
