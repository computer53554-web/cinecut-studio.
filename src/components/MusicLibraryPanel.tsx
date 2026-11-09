import React, { useState, useMemo } from 'react';
import {
  Search,
  Play,
  Pause,
  Plus,
  Heart,
  Volume2,
  VolumeX,
  Sparkles,
  Music,
  Check,
  Disc3,
  Upload,
  Radio,
} from 'lucide-react';
import { MediaAsset } from '../types/editor';
import { STOCK_MUSIC, StockTrack } from '../utils/stockMediaData';
import { BUILTIN_SOUNDTRACKS } from '../utils/assetsData';
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

export const MusicLibraryPanel: React.FC<MusicLibraryPanelProps> = ({
  onImportToAudioTrack,
  onUploadCustomTrack,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [selectedMood, setSelectedMood] = useState<string>('all');
  const [favorites, setFavorites] = useState<Set<string>>(new Set(['music-lofi-midnight']));
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const [recentlyAddedId, setRecentlyAddedId] = useState<string | null>(null);
  const [previewVolume, setPreviewVolume] = useState<number>(0.85);

  const genres = [
    { id: 'all', label: 'All Music' },
    { id: 'favorites', label: '★ Favorites' },
    { id: 'lofi', label: 'Lo-Fi' },
    { id: 'synthwave', label: 'Synthwave' },
    { id: 'vlog', label: 'Vlog' },
    { id: 'cinematic', label: 'Cinematic' },
    { id: 'chillhop', label: 'Chillhop' },
    { id: 'electronic', label: 'Electronic' },
    { id: 'ambient', label: 'Ambient' },
  ];

  const moodTags = ['All', 'Relaxing', 'Retro', 'Happy', 'Dramatic', 'Hype', 'Coffee'];

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

  // Preview playback
  const handleTogglePlay = (track: CuratedMusicTrack) => {
    if (playingTrackId === track.id) {
      audioEngine.stopAll();
      setPlayingTrackId(null);
      return;
    }

    audioEngine.stopAll();
    let buffer = audioEngine.getBuffer(track.id);
    if (!buffer) {
      buffer = audioEngine.createSynthTrack(track.genre, track.duration);
      audioEngine.setBuffer(track.id, buffer);
    }

    audioEngine.playClip(
      track.id,
      buffer,
      0,
      track.duration,
      0,
      0,
      previewVolume,
      0.3,
      0.5,
      1.0,
      false
    );
    setPlayingTrackId(track.id);
  };

  // Import to project audio track
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

    // Show temporary feedback
    setRecentlyAddedId(track.id);
    setTimeout(() => {
      setRecentlyAddedId((curr) => (curr === track.id ? null : curr));
    }, 2000);
  };

  // Filter tracks
  const filteredTracks = useMemo(() => {
    return ALL_ROYALTY_FREE_TRACKS.filter((track) => {
      // Favorites filter
      if (selectedGenre === 'favorites') {
        if (!favorites.has(track.id)) return false;
      } else if (selectedGenre !== 'all' && track.genre !== selectedGenre) {
        return false;
      }

      // Mood filter
      if (selectedMood !== 'all' && selectedMood !== 'All') {
        if (!track.moods.some((m) => m.toLowerCase() === selectedMood.toLowerCase())) {
          return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = track.name.toLowerCase().includes(q);
        const matchesTag = track.tag.toLowerCase().includes(q);
        const matchesDesc = track.description.toLowerCase().includes(q);
        const matchesMood = track.moods.some((m) => m.toLowerCase().includes(q));
        if (!matchesName && !matchesTag && !matchesDesc && !matchesMood) {
          return false;
        }
      }

      return true;
    });
  }, [selectedGenre, selectedMood, searchQuery, favorites]);

  return (
    <div className="flex flex-col h-full space-y-3 select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-1 border-b border-[#1b2333]">
        <div className="flex items-center gap-1.5">
          <Music className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold text-white tracking-wide uppercase">
            Music Library
          </span>
        </div>
        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
          Royalty-Free
        </span>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search tracks, moods, styles..."
          className="w-full bg-[#131924] border border-[#20293a] rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-emerald-500/60 transition-colors"
        />
      </div>

      {/* Genre Pills */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs no-scrollbar">
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

      {/* Mood Tags Filter */}
      <div className="flex items-center gap-1 overflow-x-auto pb-0.5 text-[10px]">
        {moodTags.map((mood) => (
          <button
            key={mood}
            onClick={() => setSelectedMood(mood === 'All' ? 'all' : mood)}
            className={`px-2 py-0.5 rounded transition-colors ${
              (mood === 'All' && selectedMood === 'all') || selectedMood === mood
                ? 'bg-slate-700 text-slate-100 font-semibold'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            #{mood}
          </button>
        ))}
      </div>

      {/* Track List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-0.5">
        {filteredTracks.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs">
            <Disc3 className="w-8 h-8 mx-auto mb-2 opacity-40 animate-spin-slow" />
            <p>No tracks found</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedGenre('all');
                setSelectedMood('all');
              }}
              className="mt-2 text-[11px] text-emerald-400 hover:underline"
            >
              Reset filters
            </button>
          </div>
        ) : (
          filteredTracks.map((track) => {
            const isPlaying = playingTrackId === track.id;
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
                {/* Top Row: Play button + Info + Favorite */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Play/Pause Button */}
                    <button
                      onClick={() => handleTogglePlay(track)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-95 ${
                        isPlaying
                          ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                          : 'bg-[#1a2332] text-emerald-400 hover:bg-emerald-500/20'
                      }`}
                      title={isPlaying ? 'Pause Preview' : 'Play Preview'}
                    >
                      {isPlaying ? (
                        <Pause className="w-3.5 h-3.5" />
                      ) : (
                        <Play className="w-3.5 h-3.5 ml-0.5" />
                      )}
                    </button>

                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-100 truncate flex items-center gap-1.5">
                        <span>{track.name}</span>
                        {isPlaying && (
                          <span className="flex items-center gap-0.5 h-3">
                            <span className="w-0.5 h-full bg-emerald-400 animate-pulse" />
                            <span className="w-0.5 h-2/3 bg-emerald-400 animate-pulse delay-75" />
                            <span className="w-0.5 h-4/5 bg-emerald-400 animate-pulse delay-150" />
                          </span>
                        )}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">{track.artist}</p>
                    </div>
                  </div>

                  {/* Favorite Toggle */}
                  <button
                    onClick={(e) => toggleFavorite(track.id, e)}
                    className={`p-1.5 rounded-lg transition-colors shrink-0 ${
                      isFav
                        ? 'text-rose-400 bg-rose-500/10'
                        : 'text-slate-600 hover:text-slate-300'
                    }`}
                    title={isFav ? 'Favorited' : 'Add to Favorites'}
                  >
                    <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
                  </button>
                </div>

                {/* Description & Moods */}
                <p className="text-[10px] text-slate-400 line-clamp-1 leading-relaxed">
                  {track.description}
                </p>

                {/* Bottom Row: Metadata & Import Button */}
                <div className="flex items-center justify-between pt-1 border-t border-[#182130]">
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono">
                    <span className="text-emerald-400 font-semibold">{track.tag}</span>
                    <span>·</span>
                    <span>{track.bpm} BPM</span>
                    <span>·</span>
                    <span>{track.duration}s</span>
                  </div>

                  {/* Add to Timeline Button */}
                  <button
                    onClick={() => handleImportTrack(track)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all active:scale-95 ${
                      isAdded
                        ? 'bg-emerald-500 text-white'
                        : 'bg-emerald-500/15 hover:bg-emerald-500 text-emerald-300 hover:text-white border border-emerald-500/30'
                    }`}
                    title="Import into Audio Track on Timeline"
                  >
                    {isAdded ? (
                      <>
                        <Check className="w-3 h-3" />
                        <span>Added!</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3 h-3" />
                        <span>Import</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Helper */}
      <div className="pt-2 border-t border-[#1a2230] flex items-center justify-between text-[10px] text-slate-500">
        <span className="flex items-center gap-1">
          <Radio className="w-3 h-3 text-emerald-400" />
          <span>{filteredTracks.length} tracks ready to edit</span>
        </span>
        <span className="text-slate-400">100% Commercial-Safe</span>
      </div>
    </div>
  );
};
