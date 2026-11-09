import React, { useState, useRef } from 'react';
import {
  FolderPlus,
  Music,
  Type,
  Smile,
  Sparkles,
  GitCommit,
  Upload,
  Play,
  Pause,
  Plus,
  Video,
  Image as ImageIcon,
  Check,
  Disc3,
  Layers,
  Volume2,
  Subtitles,
  Zap,
} from 'lucide-react';
import { FilterPreset, MediaAsset, TextAnimation, TransitionType } from '../types/editor';
import { BUILTIN_SOUNDTRACKS, DEFAULT_SAMPLE_MEDIA, FILTER_PRESETS, STICKER_CATALOG, StickerItem } from '../utils/assetsData';
import { STOCK_MUSIC, STOCK_SFX, STOCK_TEMPLATES, StockTrack, StockSfx, StockTemplate } from '../utils/stockMediaData';
import { audioEngine } from '../utils/audioEngine';
import { MusicLibraryPanel } from './MusicLibraryPanel';

interface MediaLibraryProps {
  mediaAssets: MediaAsset[];
  onAddMediaAsset: (asset: MediaAsset) => void;
  onAddClipToTimeline: (item: {
    type: 'video' | 'image' | 'audio' | 'text' | 'sticker';
    mediaAsset?: MediaAsset;
    textPreset?: { text: string; animation: TextAnimation; color: string; bg?: string; font?: string; strokeColor?: string };
    sticker?: StickerItem;
    filterPreset?: FilterPreset;
    transitionType?: TransitionType;
  }) => void;
  onApplyFilterToSelected?: (preset: FilterPreset) => void;
  onApplyTransitionToSelected?: (type: TransitionType) => void;
  onOpenAutoCaptions?: () => void;
}

type TabKey = 'media' | 'music' | 'stock' | 'text' | 'stickers' | 'filters' | 'transitions';
type StockSubTab = 'music' | 'sfx' | 'templates';

export const MediaLibrary: React.FC<MediaLibraryProps> = ({
  mediaAssets,
  onAddMediaAsset,
  onAddClipToTimeline,
  onApplyFilterToSelected,
  onApplyTransitionToSelected,
  onOpenAutoCaptions,
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>('media');
  const [stockSubTab, setStockSubTab] = useState<StockSubTab>('music');
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [stickerFilter, setStickerFilter] = useState<string>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Audio preview playback handler
  const handleToggleAudioPreview = (
    id: string,
    genreOrType: string,
    isSfx = false,
    duration = 30
  ) => {
    if (playingAudioId === id) {
      audioEngine.stopAll();
      setPlayingAudioId(null);
      return;
    }

    audioEngine.stopAll();
    let buffer = audioEngine.getBuffer(id);
    if (!buffer) {
      if (isSfx) {
        buffer = audioEngine.createSoundEffect(genreOrType as 'whoosh' | 'boom' | 'click' | 'pop' | 'glitch' | 'laser', duration);
      } else {
        buffer = audioEngine.createSynthTrack(genreOrType as 'lofi' | 'synthwave' | 'cinematic' | 'vlog', duration);
      }
      audioEngine.setBuffer(id, buffer);
    }

    audioEngine.playClip(id, buffer, 0, duration, 0, 0, 0.9, 0.2, 0.3, 1.0, false);
    setPlayingAudioId(id);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const url = URL.createObjectURL(file);
      const isVideo = file.type.startsWith('video');
      const isAudio = file.type.startsWith('audio');
      const isImage = file.type.startsWith('image');

      const assetType = isVideo ? 'video' : isAudio ? 'audio' : 'image';

      const newAsset: MediaAsset = {
        id: `upload-${Date.now()}-${i}`,
        name: file.name,
        type: assetType,
        url,
        thumbnail: isImage || isVideo ? url : '',
        duration: isAudio ? 20 : isVideo ? 15 : 5,
      };

      if (isAudio) {
        audioEngine.loadAudio(url, newAsset.id).catch((err) => {
          console.warn('Audio decode fallback:', err);
          const buf = audioEngine.createSynthTrack('lofi', 20);
          audioEngine.setBuffer(newAsset.id, buf);
        });
      }

      onAddMediaAsset(newAsset);
    }
  };

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'media', label: 'Media', icon: <FolderPlus className="w-3.5 h-3.5" /> },
    { key: 'music', label: 'Music', icon: <Music className="w-3.5 h-3.5" /> },
    { key: 'stock', label: 'Stock', icon: <Disc3 className="w-3.5 h-3.5" /> },
    { key: 'text', label: 'Text', icon: <Type className="w-3.5 h-3.5" /> },
    { key: 'stickers', label: 'Stickers', icon: <Smile className="w-3.5 h-3.5" /> },
    { key: 'filters', label: 'Filters', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { key: 'transitions', label: 'Transitions', icon: <GitCommit className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="w-72 bg-[#0d1118] border-r border-[#1a2230] flex flex-col h-full shrink-0 select-none">
      {/* Top Tab Bar */}
      <div className="grid grid-cols-7 border-b border-[#1a2230] bg-[#090d13]">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            title={tab.label}
            className={`py-2.5 flex flex-col items-center justify-center gap-1 transition-colors relative ${
              activeTab === tab.key
                ? 'text-sky-400 bg-[#0e141f]'
                : 'text-slate-500 hover:text-slate-300 hover:bg-[#0c1017]'
            }`}
          >
            {tab.icon}
            <span className="text-[9px] font-medium leading-none">{tab.label}</span>
            {activeTab === tab.key && (
              <div className="absolute bottom-0 left-1 right-1 h-0.5 bg-sky-400 rounded-t" />
            )}
          </button>
        ))}
      </div>

      {/* AI Auto-Captions Quick Banner */}
      {onOpenAutoCaptions && (
        <div className="p-2 border-b border-[#1b2333] bg-gradient-to-r from-amber-950/40 via-orange-950/20 to-transparent">
          <button
            onClick={onOpenAutoCaptions}
            className="w-full flex items-center justify-between p-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 transition-colors group"
          >
            <div className="flex items-center gap-2">
              <Subtitles className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
              <div className="text-left">
                <p className="text-[11px] font-bold">AI Auto-Captions</p>
                <p className="text-[9px] text-amber-400/80">Transcribe to TikTok subtitles</p>
              </div>
            </div>
            <Zap className="w-3.5 h-3.5 text-amber-400" />
          </button>
        </div>
      )}

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* ================= STOCK MEDIA LIBRARY TAB ================= */}
        {activeTab === 'stock' && (
          <div className="space-y-3">
            {/* Sub-tabs: Music / SFX / Templates */}
            <div className="flex items-center gap-1 bg-[#131924] p-1 rounded-lg border border-[#1f283a]">
              {(['music', 'sfx', 'templates'] as StockSubTab[]).map((st) => (
                <button
                  key={st}
                  onClick={() => setStockSubTab(st)}
                  className={`flex-1 py-1 text-center rounded text-xs font-semibold capitalize transition-all ${
                    stockSubTab === st
                      ? 'bg-sky-500 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {st === 'sfx' ? 'Sound FX' : st}
                </button>
              ))}
            </div>

            {/* Stock Music */}
            {stockSubTab === 'music' && (
              <div className="space-y-2">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                  Royalty-Free Tracks ({STOCK_MUSIC.length})
                </div>
                {STOCK_MUSIC.map((track) => {
                  const isPlaying = playingAudioId === track.id;
                  return (
                    <div
                      key={track.id}
                      className="p-2.5 rounded-lg bg-[#121824] border border-[#1f283a] hover:border-sky-500/40 transition-all flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <button
                          onClick={() => handleToggleAudioPreview(track.id, track.genre, false, track.duration)}
                          className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                            isPlaying
                              ? 'bg-sky-500 text-white'
                              : 'bg-[#1b2333] text-sky-400 hover:bg-sky-500/20'
                          }`}
                        >
                          {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 ml-0.5" />}
                        </button>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-200 truncate">{track.name}</p>
                          <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-mono mt-0.5">
                            <span className="text-sky-400 font-semibold">{track.tag}</span>
                            <span>·</span>
                            <span>{track.bpm} BPM</span>
                            <span>·</span>
                            <span>{track.duration}s</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          let buffer = audioEngine.getBuffer(track.id);
                          if (!buffer) {
                            buffer = audioEngine.createSynthTrack(track.genre, track.duration);
                            audioEngine.setBuffer(track.id, buffer);
                          }
                          onAddClipToTimeline({
                            type: 'audio',
                            mediaAsset: {
                              id: track.id,
                              name: `${track.name}.wav`,
                              type: 'audio',
                              url: '',
                              duration: track.duration,
                              thumbnail: '',
                            },
                          });
                        }}
                        className="p-1.5 rounded-md bg-[#1b2333] hover:bg-sky-500 hover:text-white text-slate-300 transition-colors shrink-0"
                        title="Add to Timeline"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Stock SFX */}
            {stockSubTab === 'sfx' && (
              <div className="space-y-2">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                  Cinematic Sound Effects ({STOCK_SFX.length})
                </div>
                {STOCK_SFX.map((sfx) => {
                  const isPlaying = playingAudioId === sfx.id;
                  return (
                    <div
                      key={sfx.id}
                      className="p-2.5 rounded-lg bg-[#121824] border border-[#1f283a] hover:border-emerald-500/40 transition-all flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <button
                          onClick={() => handleToggleAudioPreview(sfx.id, sfx.type, true, sfx.duration)}
                          className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                            isPlaying
                              ? 'bg-emerald-500 text-white'
                              : 'bg-[#1b2333] text-emerald-400 hover:bg-emerald-500/20'
                          }`}
                        >
                          {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 ml-0.5" />}
                        </button>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-200 truncate">{sfx.name}</p>
                          <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-mono mt-0.5">
                            <span className="text-emerald-400">{sfx.category}</span>
                            <span>·</span>
                            <span>{sfx.duration}s</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          let buffer = audioEngine.getBuffer(sfx.id);
                          if (!buffer) {
                            buffer = audioEngine.createSoundEffect(sfx.type, sfx.duration);
                            audioEngine.setBuffer(sfx.id, buffer);
                          }
                          onAddClipToTimeline({
                            type: 'audio',
                            mediaAsset: {
                              id: sfx.id,
                              name: `${sfx.name}.wav`,
                              type: 'audio',
                              url: '',
                              duration: sfx.duration,
                              thumbnail: '',
                            },
                          });
                        }}
                        className="p-1.5 rounded-md bg-[#1b2333] hover:bg-emerald-500 hover:text-white text-slate-300 transition-colors shrink-0"
                        title="Add to Timeline"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Stock Templates */}
            {stockSubTab === 'templates' && (
              <div className="space-y-2">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                  Motion & Sticker Templates
                </div>
                {STOCK_TEMPLATES.map((tpl) => (
                  <div
                    key={tpl.id}
                    onClick={() =>
                      onAddClipToTimeline({
                        type: 'text',
                        textPreset: {
                          text: tpl.previewText,
                          animation: tpl.animation,
                          color: tpl.color,
                          bg: tpl.bg,
                          font: tpl.fontFamily,
                          strokeColor: tpl.strokeColor,
                        },
                      })
                    }
                    className="p-2.5 rounded-lg bg-[#121824] border border-[#1f283a] hover:border-amber-500/50 cursor-pointer group transition-all"
                  >
                    <div
                      className="h-9 rounded bg-[#090d13] flex items-center justify-center px-2 mb-1.5 border border-[#1b2333]"
                      style={{ backgroundColor: tpl.bg !== 'transparent' ? tpl.bg : '#090d13' }}
                    >
                      <span
                        style={{ color: tpl.color }}
                        className="font-bold text-xs tracking-wider truncate drop-shadow"
                      >
                        {tpl.previewText}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-200 truncate">{tpl.name}</p>
                        <p className="text-[9px] text-slate-400 truncate">{tpl.description}</p>
                      </div>
                      <Plus className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-400 shrink-0 ml-1" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= MEDIA TAB ================= */}
        {activeTab === 'media' && (
          <div className="space-y-3">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border border-dashed border-[#28354b] hover:border-sky-500/60 bg-[#121722]/50 hover:bg-[#121722] rounded-xl p-4 text-center cursor-pointer transition-all group"
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="video/*,image/*,audio/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="w-9 h-9 rounded-full bg-sky-500/10 text-sky-400 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                <Upload className="w-4 h-4" />
              </div>
              <p className="text-xs font-semibold text-slate-200">Import Media</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Drag & drop MP4, JPG, PNG or MP3</p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-400 tracking-wide uppercase">
                  Project Assets ({mediaAssets.length})
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {mediaAssets.map((asset) => (
                  <div
                    key={asset.id}
                    className="group relative bg-[#131924] rounded-lg overflow-hidden border border-[#1f293b] hover:border-sky-500/50 transition-all flex flex-col"
                  >
                    <div className="aspect-video relative bg-[#090d13] overflow-hidden">
                      {asset.type === 'video' || asset.type === 'image' ? (
                        <img
                          src={asset.thumbnail || asset.url}
                          alt={asset.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-indigo-950/40 text-indigo-400">
                          <Music className="w-6 h-6" />
                        </div>
                      )}

                      <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/75 text-[10px] font-mono tabular-nums text-slate-200">
                        {Math.round(asset.duration)}s
                      </span>

                      <span className="absolute top-1 left-1 p-1 rounded bg-black/60 text-slate-300">
                        {asset.type === 'video' ? (
                          <Video className="w-2.5 h-2.5 text-sky-400" />
                        ) : asset.type === 'image' ? (
                          <ImageIcon className="w-2.5 h-2.5 text-amber-400" />
                        ) : (
                          <Music className="w-2.5 h-2.5 text-emerald-400" />
                        )}
                      </span>

                      <button
                        onClick={() => onAddClipToTimeline({ type: asset.type, mediaAsset: asset })}
                        className="absolute inset-0 bg-sky-950/70 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white"
                        title="Add to Timeline"
                      >
                        <Plus className="w-6 h-6 bg-sky-500 rounded-full p-1 shadow-lg" />
                      </button>
                    </div>

                    <div className="p-1.5">
                      <p className="text-[11px] font-medium text-slate-300 truncate" title={asset.name}>
                        {asset.name}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================= MUSIC LIBRARY PANEL ================= */}
        {activeTab === 'music' && (
          <MusicLibraryPanel
            onImportToAudioTrack={(asset) => onAddClipToTimeline({ type: 'audio', mediaAsset: asset })}
          />
        )}

        {/* ================= TEXT TAB ================= */}
        {activeTab === 'text' && (
          <div className="space-y-3">
            <div className="text-xs font-semibold text-slate-400 tracking-wide uppercase">
              Text & Title Presets
            </div>

            <div className="grid grid-cols-1 gap-2">
              {[
                {
                  title: 'Cyberpunk Bold Title',
                  preview: 'CYBER CITY 2026',
                  color: '#FFFFFF',
                  bg: 'rgba(15, 23, 42, 0.8)',
                  animation: 'typewriter' as TextAnimation,
                  font: 'Plus Jakarta Sans',
                  desc: 'Typewriter animation with dark box and neon glow',
                },
                {
                  title: 'Cinematic Minimalist',
                  preview: 'CHAPTER ONE',
                  color: '#FEF08A',
                  bg: 'rgba(0, 0, 0, 0.6)',
                  animation: 'slideUp' as TextAnimation,
                  font: 'Plus Jakarta Sans',
                  desc: 'Smooth vertical slide-in with subtle warm backlight',
                },
                {
                  title: 'Neon Glow Pulse',
                  preview: 'EPIC DROP',
                  color: '#38BDF8',
                  bg: 'transparent',
                  animation: 'pulse' as TextAnimation,
                  font: 'Plus Jakarta Sans',
                  desc: 'Electric pulse scale with vibrant drop shadow',
                },
                {
                  title: 'Glitch Hacker Text',
                  preview: 'SYSTEM // OVERRIDE',
                  color: '#F43F5E',
                  bg: '#0F172A',
                  animation: 'glitch' as TextAnimation,
                  font: 'JetBrains Mono',
                  desc: 'Random jitter flicker with monospace font',
                },
                {
                  title: 'Playful Bounce Tag',
                  preview: 'DON’T MISS THIS!',
                  color: '#FACC15',
                  bg: 'rgba(239, 68, 68, 0.85)',
                  animation: 'bounce' as TextAnimation,
                  font: 'Plus Jakarta Sans',
                  desc: 'High energy spring pop-in with red banner',
                },
              ].map((preset, idx) => (
                <div
                  key={idx}
                  onClick={() =>
                    onAddClipToTimeline({
                      type: 'text',
                      textPreset: {
                        text: preset.preview,
                        animation: preset.animation,
                        color: preset.color,
                        bg: preset.bg,
                        font: preset.font,
                      },
                    })
                  }
                  className="p-3 rounded-lg bg-[#121824] border border-[#1f283a] hover:border-sky-500/50 cursor-pointer group transition-all"
                >
                  <div className="h-10 rounded bg-[#090d13] flex items-center justify-center px-2 mb-2 border border-[#1b2333]">
                    <span
                      style={{ color: preset.color }}
                      className="font-bold text-xs tracking-wider truncate"
                    >
                      {preset.preview}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-slate-200">{preset.title}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{preset.desc}</p>
                    </div>
                    <Plus className="w-4 h-4 text-slate-400 group-hover:text-sky-400 shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= STICKERS TAB ================= */}
        {activeTab === 'stickers' && (
          <div className="space-y-3">
            <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
              {['all', 'emojis', 'badges', 'arrows', 'cyber', 'cinematic'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setStickerFilter(cat)}
                  className={`px-2.5 py-1 rounded capitalize font-medium text-xs whitespace-nowrap transition-colors ${
                    stickerFilter === cat
                      ? 'bg-sky-500 text-white'
                      : 'bg-[#141923] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-2">
              {STICKER_CATALOG.filter(
                (stk) => stickerFilter === 'all' || stk.category === stickerFilter
              ).map((stk) => (
                <button
                  key={stk.id}
                  onClick={() => onAddClipToTimeline({ type: 'sticker', sticker: stk })}
                  className="aspect-square rounded-lg bg-[#121824] border border-[#1f283a] hover:border-amber-500/50 p-2 flex flex-col items-center justify-center gap-1 group transition-all"
                  title={`Add ${stk.name}`}
                >
                  <div
                    className="w-10 h-10 flex items-center justify-center group-hover:scale-110 transition-transform"
                    dangerouslySetInnerHTML={{ __html: stk.svg }}
                  />
                  <span className="text-[9px] text-slate-400 truncate w-full text-center">
                    {stk.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ================= FILTERS TAB ================= */}
        {activeTab === 'filters' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 tracking-wide uppercase">
                Color Grading Presets
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {FILTER_PRESETS.map((filter) => (
                <div
                  key={filter.id}
                  onClick={() => onApplyFilterToSelected && onApplyFilterToSelected(filter.id)}
                  className="group relative rounded-lg bg-[#121824] border border-[#1f283a] hover:border-sky-500/50 overflow-hidden cursor-pointer transition-all"
                >
                  <div className="aspect-video relative overflow-hidden bg-slate-900">
                    <img
                      src={DEFAULT_SAMPLE_MEDIA[0].thumbnail}
                      alt={filter.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      style={{
                        filter: `brightness(${100 + filter.brightness}%) contrast(${
                          100 + filter.contrast
                        }%) saturate(${100 + filter.saturation}%) sepia(${filter.sepia}%) blur(${
                          filter.blur
                        }px)`,
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-1.5">
                      <span className="text-[11px] font-semibold text-white leading-tight">
                        {filter.name}
                      </span>
                    </div>
                  </div>
                  <div className="p-1.5 text-[10px] text-slate-400 line-clamp-1">
                    {filter.description}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TRANSITIONS TAB ================= */}
        {activeTab === 'transitions' && (
          <div className="space-y-3">
            <div className="text-xs font-semibold text-slate-400 tracking-wide uppercase">
              Clip Transitions
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                { type: 'crossfade' as TransitionType, name: 'Crossfade', desc: 'Smooth dissolve blend' },
                { type: 'wipeLeft' as TransitionType, name: 'Wipe Left', desc: 'Horizontal slide wipe' },
                { type: 'wipeRight' as TransitionType, name: 'Wipe Right', desc: 'Reverse horizontal wipe' },
                { type: 'zoom' as TransitionType, name: 'Zoom In', desc: 'Dynamic scale in transition' },
                { type: 'flash' as TransitionType, name: 'Flash White', desc: 'High key cinema flash' },
                { type: 'glitch' as TransitionType, name: 'Glitch Shake', desc: 'Chromatic slice jitter' },
                { type: 'dipToBlack' as TransitionType, name: 'Dip to Black', desc: 'Fade through darkness' },
              ].map((item) => (
                <button
                  key={item.type}
                  onClick={() => onApplyTransitionToSelected && onApplyTransitionToSelected(item.type)}
                  className="p-3 rounded-lg bg-[#121824] border border-[#1f283a] hover:border-sky-500/50 text-left transition-all group flex flex-col justify-between h-20"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-semibold text-slate-200 group-hover:text-sky-400">
                      {item.name}
                    </span>
                    <Check className="w-3.5 h-3.5 text-slate-600 group-hover:text-sky-400" />
                  </div>
                  <p className="text-[10px] text-slate-400">{item.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
