import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Subtitles,
  Loader2,
  CheckCircle2,
  Flame,
  Volume2,
} from 'lucide-react';
import { Clip, TextAnimation, Track } from '../types/editor';

interface AutoCaptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tracks: Track[];
  onAddGeneratedCaptions: (clips: Clip[]) => void;
}

export type CaptionPresetStyle = 'tiktok' | 'karaoke' | 'cyberpunk' | 'minimal' | 'cinema';

export const AutoCaptionsModal: React.FC<AutoCaptionsModalProps> = ({
  isOpen,
  onClose,
  tracks,
  onAddGeneratedCaptions,
}) => {
  const [selectedTrackId, setSelectedTrackId] = useState<string>(
    tracks.find((t) => t.type === 'audio')?.id || tracks[0]?.id || ''
  );
  const [style, setStyle] = useState<CaptionPresetStyle>('tiktok');
  const [wordsPerSegment, setWordsPerSegment] = useState<number>(3);
  const [topic, setTopic] = useState<string>('Viral travel and tech vlog');
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('');

  if (!isOpen) return null;

  const handleGenerateCaptions = async () => {
    setIsGenerating(true);
    setStatusMessage('Analyzing audio waveform and transcribing speech...');

    // Calculate duration from target track clips
    const targetTrack = tracks.find((t) => t.id === selectedTrackId);
    let trackDuration = 14;
    if (targetTrack && targetTrack.clips.length > 0) {
      const lastClip = targetTrack.clips[targetTrack.clips.length - 1];
      trackDuration = Math.max(5, lastClip.start + lastClip.duration);
    }

    try {
      const response = await fetch('/api/captions/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          style,
          wordsPerSegment,
          topic,
          duration: trackDuration,
        }),
      });

      const data = await response.json();
      const rawCaptions: { text: string; start: number; duration: number; highlightWord?: string }[] =
        data.captions || [];

      // Determine text styling based on chosen style
      let color = '#FDE047';
      let strokeColor = '#000000';
      let strokeWidth = 4;
      let backgroundColor = 'rgba(0,0,0,0.7)';
      let shadowColor = '#000000';
      let shadowBlur = 12;
      let animation: TextAnimation = 'bounce';
      let fontFamily = 'Plus Jakarta Sans';
      let fontSize = 54;

      if (style === 'karaoke') {
        color = '#38BDF8';
        strokeColor = '#0369A1';
        strokeWidth = 3;
        backgroundColor = 'transparent';
        shadowColor = '#0284C7';
        shadowBlur = 24;
        animation = 'pulse';
        fontSize = 52;
      } else if (style === 'cyberpunk') {
        color = '#F43F5E';
        strokeColor = '#4C0519';
        strokeWidth = 3;
        backgroundColor = '#0F172A';
        shadowColor = '#BE123C';
        shadowBlur = 18;
        animation = 'glitch';
        fontFamily = 'JetBrains Mono';
        fontSize = 48;
      } else if (style === 'minimal') {
        color = '#FFFFFF';
        strokeColor = 'transparent';
        strokeWidth = 0;
        backgroundColor = 'rgba(15, 23, 42, 0.85)';
        shadowColor = 'transparent';
        shadowBlur = 0;
        animation = 'slideUp';
        fontSize = 46;
      } else if (style === 'cinema') {
        color = '#FEF08A';
        strokeColor = '#78350F';
        strokeWidth = 2;
        backgroundColor = 'rgba(0, 0, 0, 0.6)';
        shadowColor = '#D97706';
        shadowBlur = 14;
        animation = 'typewriter';
        fontSize = 50;
      }

      // Find or create Text track
      const textTrack = tracks.find((t) => t.type === 'text') || tracks[0];

      const newClips: Clip[] = rawCaptions.map((cap, idx) => ({
        id: `caption-${Date.now()}-${idx}`,
        trackId: textTrack.id,
        name: `Cap: ${cap.text.slice(0, 16)}...`,
        type: 'text',
        start: cap.start,
        duration: Math.max(0.8, cap.duration),
        sourceStart: 0,
        speed: 1.0,
        volume: 1.0,
        fadeIn: 0.1,
        fadeOut: 0.1,
        muted: false,
        transform: {
          x: 0,
          y: 200,
          scale: 1.0,
          rotation: 0,
          opacity: 1.0,
          flipH: false,
          flipV: false,
        },
        filters: {
          brightness: 0,
          contrast: 0,
          saturation: 0,
          temperature: 0,
          vignette: 0,
          blur: 0,
          sepia: 0,
          preset: 'none',
        },
        transitionIn: {
          type: 'none',
          duration: 0,
        },
        textConfig: {
          text: cap.text,
          fontFamily,
          fontSize,
          fontWeight: '800',
          color,
          strokeColor,
          strokeWidth,
          backgroundColor,
          backgroundPadding: 16,
          borderRadius: 10,
          shadowColor,
          shadowBlur,
          letterSpacing: 1.5,
          animation,
        },
      }));

      onAddGeneratedCaptions(newClips);
      setIsGenerating(false);
      onClose();
    } catch (err) {
      console.error(err);
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="bg-[#0f141f] border border-[#232d40] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#1f283a] flex items-center justify-between bg-[#0b0e16]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <Subtitles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                AI Auto-Captions <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-400 font-mono">GEMINI</span>
              </h3>
              <p className="text-[11px] text-slate-400">Generate punchy, colorful animated subtitles</p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isGenerating}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-[#1a2232] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* Audio Source Track */}
          <div>
            <label className="text-slate-300 font-semibold mb-1.5 block">Source Audio/Video Track</label>
            <div className="grid grid-cols-2 gap-2">
              {tracks.filter((t) => t.type === 'audio' || t.type === 'video').map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTrackId(t.id)}
                  className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all ${
                    selectedTrackId === t.id
                      ? 'bg-amber-500/15 border-amber-500 text-amber-300'
                      : 'bg-[#141b27] border-[#222c3e] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Volume2 className="w-4 h-4 shrink-0 text-amber-400" />
                  <div className="min-w-0">
                    <p className="font-semibold text-xs truncate">{t.name}</p>
                    <p className="text-[10px] text-slate-500">{t.clips.length} clips</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Subtitle Style Presets */}
          <div>
            <label className="text-slate-300 font-semibold mb-2 block">Caption Aesthetic Style</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'tiktok' as CaptionPresetStyle, name: 'TikTok Viral', desc: 'Yellow + black outline pop', color: '#FDE047' },
                { id: 'karaoke' as CaptionPresetStyle, name: 'Neon Karaoke', desc: 'Vibrant cyan pulse glow', color: '#38BDF8' },
                { id: 'cyberpunk' as CaptionPresetStyle, name: 'Cyber Glitch', desc: 'Pink HUD glitch text', color: '#F43F5E' },
                { id: 'minimal' as CaptionPresetStyle, name: 'Modern Vlog', desc: 'Clean dark pill slide up', color: '#FFFFFF' },
                { id: 'cinema' as CaptionPresetStyle, name: 'Golden Film', desc: 'Warm cinematic typewriter', color: '#FEF08A' },
              ].map((pst) => (
                <button
                  key={pst.id}
                  onClick={() => setStyle(pst.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    style === pst.id
                      ? 'bg-sky-500/15 border-sky-500 text-sky-300 shadow-sm'
                      : 'bg-[#141b27] border-[#222c3e] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pst.color }} />
                    <span className="font-bold text-xs">{pst.name}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-tight">{pst.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Words per segment */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex justify-between text-slate-300 font-semibold mb-1.5">
                <span>Pacing</span>
                <span className="font-mono text-sky-400">{wordsPerSegment} words / card</span>
              </div>
              <input
                type="range"
                min="1"
                max="6"
                value={wordsPerSegment}
                onChange={(e) => setWordsPerSegment(Number(e.target.value))}
                className="w-full accent-amber-400"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>Punchy (1-2)</span>
                <span>Phrases (5-6)</span>
              </div>
            </div>

            <div>
              <label className="text-slate-300 font-semibold mb-1.5 block">Content Topic</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Neon city travel vlog"
                className="w-full bg-[#141b27] border border-[#222c3e] rounded-lg p-2 text-xs text-slate-200 outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Generating Loading State */}
          {isGenerating && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center space-y-2">
              <Loader2 className="w-6 h-6 animate-spin text-amber-400 mx-auto" />
              <p className="text-xs font-bold text-amber-300">{statusMessage}</p>
              <p className="text-[11px] text-slate-400">Synthesizing word timestamps and key animations...</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-[#1f283a] bg-[#0b0e16] flex items-center justify-between">
          <button
            onClick={onClose}
            disabled={isGenerating}
            className="px-4 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-[#161c27] text-xs font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerateCaptions}
            disabled={isGenerating}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold text-xs shadow-md shadow-amber-500/20 transition-all active:scale-95 disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate Captions</span>
          </button>
        </div>
      </div>
    </div>
  );
};
