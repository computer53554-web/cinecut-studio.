import { useState, useEffect, useRef, useCallback } from 'react';
import { Clip, FilterPreset, MediaAsset, ProjectSettings, TextAnimation, Track, TransitionType } from './types/editor';
import { createDefaultProject } from './utils/initialProject';
import { DEFAULT_SAMPLE_MEDIA, FILTER_PRESETS, StickerItem } from './utils/assetsData';
import { audioEngine } from './utils/audioEngine';
import { exportEngine } from './utils/exportEngine';
import { canvasRenderer } from './utils/canvasRenderer';
import { TopBar } from './components/TopBar';
import { MediaLibrary } from './components/MediaLibrary';
import { PlayerMonitor } from './components/PlayerMonitor';
import { Inspector } from './components/Inspector';
import { Timeline } from './components/Timeline';
import { ExportModal } from './components/ExportModal';
import { ShortcutsModal } from './components/ShortcutsModal';
import { AutoCaptionsModal } from './components/AutoCaptionsModal';

export default function App() {
  const defaultProj = createDefaultProject();
  const [projectSettings, setProjectSettings] = useState<ProjectSettings>(defaultProj.settings);
  const [tracks, setTracks] = useState<Track[]>(defaultProj.tracks);
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>(DEFAULT_SAMPLE_MEDIA);

  // Playback state
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [selectedClipId, setSelectedClipId] = useState<string | null>('clip-video-1');
  const [selectedClipIds, setSelectedClipIds] = useState<string[]>(['clip-video-1']);

  // Modals
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isAutoCaptionsOpen, setIsAutoCaptionsOpen] = useState(false);

  // Undo / Redo history
  const [history, setHistory] = useState<Track[][]>([defaultProj.tracks]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  // References for playback loop
  const animFrameRef = useRef<number | null>(null);
  const lastPlayTimeRef = useRef<number>(0);

  // Preload initial sample images & synth sound tracks on mount
  useEffect(() => {
    DEFAULT_SAMPLE_MEDIA.forEach((media) => {
      if (media.url) {
        canvasRenderer.preloadImage(media.url).catch(() => {});
      }
    });

    // Pre-synthesize default lofi track buffer
    const buf = audioEngine.createSynthTrack('lofi', 30);
    audioEngine.setBuffer('audio-lofi-beats', buf);
  }, []);

  // Push new state to undo history
  const pushHistory = (newTracks: Track[]) => {
    const updatedHistory = history.slice(0, historyIndex + 1);
    updatedHistory.push(newTracks);
    if (updatedHistory.length > 30) updatedHistory.shift();
    setHistory(updatedHistory);
    setHistoryIndex(updatedHistory.length - 1);
    setTracks(newTracks);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      setHistoryIndex(prevIndex);
      setTracks(history[prevIndex]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      setTracks(history[nextIndex]);
    }
  };

  // Get total effective project duration
  const getMaxProjectTime = useCallback(() => {
    let max = 5;
    tracks.forEach((t) => {
      t.clips.forEach((c) => {
        const end = c.start + c.duration;
        if (end > max) max = end;
      });
    });
    return Math.min(max, projectSettings.duration);
  }, [tracks, projectSettings.duration]);

  // Synchronize audio playback with timeline
  const syncAudioPlayback = useCallback(
    (time: number) => {
      audioEngine.stopAll();
      const audioTracks = tracks.filter((t) => t.type === 'audio' && !t.muted && t.visible);

      for (const track of audioTracks) {
        for (const clip of track.clips) {
          if (!clip.muted && time >= clip.start && time < clip.start + clip.duration) {
            let buffer: AudioBuffer | undefined;
            if (clip.mediaAssetId) {
              buffer = audioEngine.getBuffer(clip.mediaAssetId);
              if (!buffer) {
                // If built-in synth track, generate on the fly
                buffer = audioEngine.createSynthTrack('lofi', 30);
                audioEngine.setBuffer(clip.mediaAssetId, buffer);
              }
            }
            if (buffer) {
              audioEngine.playClip(
                clip.id,
                buffer,
                clip.start,
                clip.duration,
                clip.sourceStart,
                time,
                clip.volume,
                clip.fadeIn,
                clip.fadeOut,
                clip.speed,
                false
              );
            }
          }
        }
      }
    },
    [tracks]
  );

  // Playback animation frame loop
  useEffect(() => {
    if (isPlaying) {
      syncAudioPlayback(currentTime);
      lastPlayTimeRef.current = performance.now();

      const loop = () => {
        const now = performance.now();
        const delta = (now - lastPlayTimeRef.current) / 1000;
        lastPlayTimeRef.current = now;

        setCurrentTime((prev) => {
          const maxTime = getMaxProjectTime();
          const next = prev + delta;
          if (next >= maxTime) {
            // Loop back to start
            syncAudioPlayback(0);
            return 0;
          }
          return next;
        });

        animFrameRef.current = requestAnimationFrame(loop);
      };

      animFrameRef.current = requestAnimationFrame(loop);
    } else {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      audioEngine.stopAll();
    }

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      audioEngine.stopAll();
    };
  }, [isPlaying, getMaxProjectTime, syncAudioPlayback]);

  // Play / Pause toggle
  const handleTogglePlay = () => {
    setIsPlaying((prev) => !prev);
  };

  // Seek handler
  const handleSeek = (time: number) => {
    const clamped = Math.max(0, Math.min(projectSettings.duration, time));
    setCurrentTime(clamped);
    if (isPlaying) {
      syncAudioPlayback(clamped);
    }
  };

  // Step frame (-1 or +1, or multi-frame)
  const handleStepFrame = (direction: number) => {
    const fps = projectSettings.fps || 30;
    const delta = 1 / fps;
    handleSeek(currentTime + direction * delta);
  };

  // Jump to start / end
  const handleJumpStart = () => handleSeek(0);
  const handleJumpEnd = () => handleSeek(getMaxProjectTime());

  // Clip selection (handles single click vs Ctrl/Cmd multi-selection)
  const handleSelectClip = (clipId: string | null, isMultiSelect = false) => {
    if (!clipId) {
      setSelectedClipId(null);
      setSelectedClipIds([]);
      return;
    }

    if (isMultiSelect) {
      setSelectedClipIds((prev) => {
        let next: string[];
        if (prev.includes(clipId)) {
          next = prev.filter((id) => id !== clipId);
        } else {
          next = [...prev, clipId];
        }
        if (next.length > 0) {
          setSelectedClipId(next[next.length - 1]);
        } else {
          setSelectedClipId(null);
        }
        return next;
      });
    } else {
      setSelectedClipId(clipId);
      setSelectedClipIds([clipId]);
    }
  };

  // Update specific clip
  const handleUpdateClip = (clipId: string, updates: Partial<Clip>) => {
    const newTracks = tracks.map((track) => ({
      ...track,
      clips: track.clips.map((clip) => {
        if (clip.id === clipId) {
          return { ...clip, ...updates };
        }
        return clip;
      }),
    }));
    pushHistory(newTracks);
  };

  // Batch update clips (for group dragging without polluting undo history per pixel)
  const handleUpdateClipsBatch = (
    updates: { id: string; start?: number; duration?: number }[],
    commitToHistory = false
  ) => {
    const updateMap = new Map(updates.map((u) => [u.id, u]));
    const newTracks = tracks.map((track) => ({
      ...track,
      clips: track.clips.map((clip) => {
        const u = updateMap.get(clip.id);
        if (!u) return clip;
        return {
          ...clip,
          ...(u.start !== undefined ? { start: u.start } : {}),
          ...(u.duration !== undefined ? { duration: u.duration } : {}),
        };
      }),
    }));

    if (commitToHistory) {
      pushHistory(newTracks);
    } else {
      setTracks(newTracks);
    }
  };

  const handleCommitHistory = () => {
    pushHistory(tracks);
  };

  // Reposition clip from on-canvas drag
  const handleUpdateClipTransform = (clipId: string, transformUpdates: { x: number; y: number }) => {
    setTracks((prev) =>
      prev.map((track) => ({
        ...track,
        clips: track.clips.map((clip) => {
          if (clip.id === clipId) {
            return {
              ...clip,
              transform: {
                ...clip.transform,
                ...transformUpdates,
              },
            };
          }
          return clip;
        }),
      }))
    );
  };

  // Delete clip(s) - operates on all selected clips
  const handleDeleteSelectedClips = () => {
    const idsToDelete =
      selectedClipIds.length > 0 ? selectedClipIds : selectedClipId ? [selectedClipId] : [];
    if (idsToDelete.length === 0) return;
    const deleteSet = new Set(idsToDelete);
    const newTracks = tracks.map((track) => ({
      ...track,
      clips: track.clips.filter((c) => !deleteSet.has(c.id)),
    }));
    setSelectedClipIds([]);
    setSelectedClipId(null);
    pushHistory(newTracks);
  };

  // Delete clip (single ID compatibility)
  const handleDeleteClip = (clipId: string) => {
    const newTracks = tracks.map((track) => ({
      ...track,
      clips: track.clips.filter((c) => c.id !== clipId),
    }));
    if (selectedClipId === clipId) {
      setSelectedClipId(null);
    }
    setSelectedClipIds((prev) => prev.filter((id) => id !== clipId));
    pushHistory(newTracks);
  };

  // Duplicate clip(s) - operates on all selected clips
  const handleDuplicateSelectedClips = () => {
    const idsToDup =
      selectedClipIds.length > 0 ? selectedClipIds : selectedClipId ? [selectedClipId] : [];
    if (idsToDup.length === 0) return;
    const dupSet = new Set(idsToDup);
    const newClipIds: string[] = [];

    const newTracks = tracks.map((track) => {
      const matching = track.clips.filter((c) => dupSet.has(c.id));
      if (matching.length === 0) return track;

      const duplicates: Clip[] = matching.map((clip, idx) => {
        const newId = `clip-${Date.now()}-${Math.random().toString(36).substring(2, 6)}-${idx}`;
        newClipIds.push(newId);
        return {
          ...clip,
          id: newId,
          name: `${clip.name} (Copy)`,
          start: clip.start + clip.duration + 0.3,
        };
      });

      return {
        ...track,
        clips: [...track.clips, ...duplicates],
      };
    });

    setSelectedClipIds(newClipIds);
    setSelectedClipId(newClipIds[newClipIds.length - 1] || null);
    pushHistory(newTracks);
  };

  // Duplicate single clip
  const handleDuplicateClip = (clipId: string) => {
    let duplicated: Clip | null = null;
    let targetTrackId = '';

    for (const track of tracks) {
      const found = track.clips.find((c) => c.id === clipId);
      if (found) {
        duplicated = {
          ...found,
          id: `clip-${Date.now()}`,
          name: `${found.name} (Copy)`,
          start: found.start + found.duration + 0.2,
        };
        targetTrackId = track.id;
        break;
      }
    }

    if (duplicated && targetTrackId) {
      const newTracks = tracks.map((track) => {
        if (track.id === targetTrackId) {
          return { ...track, clips: [...track.clips, duplicated!] };
        }
        return track;
      });
      setSelectedClipId(duplicated.id);
      setSelectedClipIds([duplicated.id]);
      pushHistory(newTracks);
    }
  };

  // Split clip at current playhead position
  const handleSplitClipAtPlayhead = () => {
    let clipToSplit: Clip | null = null;
    let targetTrackId = '';

    // First check selected clip
    if (selectedClipId) {
      for (const track of tracks) {
        const found = track.clips.find((c) => c.id === selectedClipId);
        if (found && currentTime > found.start && currentTime < found.start + found.duration) {
          clipToSplit = found;
          targetTrackId = track.id;
          break;
        }
      }
    }

    // If no valid selected clip, find the top-most clip intersecting playhead
    if (!clipToSplit) {
      for (const track of tracks) {
        const found = track.clips.find(
          (c) => currentTime > c.start && currentTime < c.start + c.duration
        );
        if (found) {
          clipToSplit = found;
          targetTrackId = track.id;
          break;
        }
      }
    }

    if (!clipToSplit) return;

    const splitOffset = currentTime - clipToSplit.start;
    const durationA = Math.round(splitOffset * 100) / 100;
    const durationB = Math.round((clipToSplit.duration - splitOffset) * 100) / 100;

    if (durationA < 0.2 || durationB < 0.2) return;

    const clipA: Clip = {
      ...clipToSplit,
      duration: durationA,
    };

    const clipB: Clip = {
      ...clipToSplit,
      id: `clip-split-${Date.now()}`,
      name: `${clipToSplit.name} (Part 2)`,
      start: currentTime,
      duration: durationB,
      sourceStart: clipToSplit.sourceStart + splitOffset * clipToSplit.speed,
    };

    const newTracks = tracks.map((track) => {
      if (track.id === targetTrackId) {
        return {
          ...track,
          clips: track.clips.map((c) => (c.id === clipToSplit!.id ? clipA : c)).concat([clipB]),
        };
      }
      return track;
    });

    setSelectedClipId(clipB.id);
    pushHistory(newTracks);
  };

  // Add clip to timeline from MediaLibrary
  const handleAddClipToTimeline = (item: {
    type: 'video' | 'image' | 'audio' | 'text' | 'sticker';
    mediaAsset?: MediaAsset;
    textPreset?: { text: string; animation: TextAnimation; color: string; bg?: string; font?: string };
    sticker?: StickerItem;
    filterPreset?: FilterPreset;
    transitionType?: TransitionType;
  }) => {
    let targetTrackType: Track['type'] = 'video';
    if (item.type === 'audio') targetTrackType = 'audio';
    else if (item.type === 'text') targetTrackType = 'text';
    else if (item.type === 'sticker') targetTrackType = 'sticker';

    const targetTrack = tracks.find((t) => t.type === targetTrackType) || tracks[0];

    // Position after playhead or end of track
    let insertStart = currentTime;
    if (targetTrack.clips.length > 0) {
      const lastClip = targetTrack.clips[targetTrack.clips.length - 1];
      if (insertStart < lastClip.start + lastClip.duration) {
        insertStart = lastClip.start + lastClip.duration + 0.2;
      }
    }

    const duration = item.mediaAsset?.duration || (item.type === 'image' ? 5 : item.type === 'audio' ? 20 : 4.5);

    const newClip: Clip = {
      id: `clip-${Date.now()}`,
      trackId: targetTrack.id,
      name: item.mediaAsset?.name || (item.textPreset ? 'Custom Title' : item.sticker?.name || 'New Clip'),
      type: item.type,
      mediaAssetId: item.mediaAsset?.id,
      url: item.mediaAsset?.url,
      start: Math.round(insertStart * 100) / 100,
      duration: Math.round(duration * 100) / 100,
      sourceStart: 0,
      speed: 1.0,
      volume: 1.0,
      fadeIn: 0.3,
      fadeOut: 0.3,
      muted: false,
      transform: {
        x: 0,
        y: item.type === 'text' ? 180 : 0,
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
      textConfig: item.textPreset
        ? {
            text: item.textPreset.text,
            fontFamily: item.textPreset.font || 'Plus Jakarta Sans',
            fontSize: 52,
            fontWeight: '700',
            color: item.textPreset.color,
            strokeColor: '#000000',
            strokeWidth: 3,
            backgroundColor: item.textPreset.bg || 'transparent',
            backgroundPadding: 16,
            borderRadius: 8,
            shadowColor: '#000000',
            shadowBlur: 16,
            letterSpacing: 1.5,
            animation: item.textPreset.animation,
          }
        : undefined,
      stickerConfig: item.sticker
        ? {
            stickerId: item.sticker.id,
            svg: item.sticker.svg,
            category: item.sticker.category,
          }
        : undefined,
    };

    const newTracks = tracks.map((t) => {
      if (t.id === targetTrack.id) {
        return { ...t, clips: [...t.clips, newClip] };
      }
      return t;
    });

    setSelectedClipId(newClip.id);
    pushHistory(newTracks);
  };

  // Apply filter preset to currently selected clip
  const handleApplyFilterToSelected = (presetId: FilterPreset) => {
    if (!selectedClipId) return;
    const found = FILTER_PRESETS.find((p) => p.id === presetId);
    if (!found) return;

    handleUpdateClip(selectedClipId, {
      filters: {
        brightness: found.brightness,
        contrast: found.contrast,
        saturation: found.saturation,
        temperature: found.temperature,
        vignette: found.vignette,
        blur: found.blur,
        sepia: found.sepia,
        preset: presetId,
      },
    });
  };

  // Apply transition to currently selected clip
  const handleApplyTransitionToSelected = (type: TransitionType) => {
    if (!selectedClipId) return;
    handleUpdateClip(selectedClipId, {
      transitionIn: {
        type,
        duration: 0.6,
      },
    });
  };

  // Track toggles
  const handleToggleTrackMute = (trackId: string) => {
    setTracks((prev) =>
      prev.map((t) => (t.id === trackId ? { ...t, muted: !t.muted } : t))
    );
  };

  const handleToggleTrackLock = (trackId: string) => {
    setTracks((prev) =>
      prev.map((t) => (t.id === trackId ? { ...t, locked: !t.locked } : t))
    );
  };

  const handleToggleTrackVisible = (trackId: string) => {
    setTracks((prev) =>
      prev.map((t) => (t.id === trackId ? { ...t, visible: !t.visible } : t))
    );
  };

  // Snapshot frame export
  const handleTakeSnapshot = () => {
    exportEngine.exportSnapshot(
      tracks,
      projectSettings,
      currentTime,
      `${projectSettings.title.toLowerCase().replace(/\s+/g, '_')}_snap.png`
    );
  };

  // Keyboard shortcuts listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing inside an input or textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        handleTogglePlay();
      } else if (e.code === 'KeyB' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleSplitClipAtPlayhead();
      } else if (e.code === 'KeyD' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleDuplicateSelectedClips();
      } else if (e.code === 'Delete' || e.code === 'Backspace') {
        if (selectedClipIds.length > 0 || selectedClipId) {
          e.preventDefault();
          handleDeleteSelectedClips();
        }
      } else if (e.code === 'Escape') {
        setSelectedClipIds([]);
        setSelectedClipId(null);
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handleStepFrame(e.shiftKey ? -10 : -1);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleStepFrame(e.shiftKey ? 10 : 1);
      } else if (e.code === 'Home') {
        e.preventDefault();
        handleJumpStart();
      } else if (e.code === 'End') {
        e.preventDefault();
        handleJumpEnd();
      } else if (e.code === 'KeyZ' && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if (
        (e.code === 'KeyY' && (e.ctrlKey || e.metaKey)) ||
        (e.code === 'KeyZ' && (e.ctrlKey || e.metaKey) && e.shiftKey)
      ) {
        e.preventDefault();
        handleRedo();
      } else if (e.code === 'KeyS' && !e.ctrlKey && !e.metaKey) {
        setProjectSettings((prev) => ({ ...prev, snap: !prev.snap }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // Selected clip object for Inspector
  let selectedClipObj: Clip | null = null;
  if (selectedClipId) {
    for (const t of tracks) {
      const c = t.clips.find((item) => item.id === selectedClipId);
      if (c) {
        selectedClipObj = c;
        break;
      }
    }
  }

  // Add generated captions to text track
  const handleAddGeneratedCaptions = (captionClips: Clip[]) => {
    const textTrack = tracks.find((t) => t.type === 'text') || tracks[0];
    const newTracks = tracks.map((t) => {
      if (t.id === textTrack.id) {
        return {
          ...t,
          clips: [...t.clips, ...captionClips],
        };
      }
      return t;
    });
    if (captionClips.length > 0) {
      setSelectedClipId(captionClips[0].id);
    }
    pushHistory(newTracks);
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#070a0f] text-slate-100 font-sans select-none">
      {/* Top Bar Header */}
      <TopBar
        projectSettings={projectSettings}
        onUpdateSettings={(newSettings) =>
          setProjectSettings((prev) => ({ ...prev, ...newSettings }))
        }
        onOpenExport={() => setIsExportModalOpen(true)}
        onTakeSnapshot={handleTakeSnapshot}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onOpenAutoCaptions={() => setIsAutoCaptionsOpen(true)}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onUndo={handleUndo}
        onRedo={handleRedo}
      />

      {/* Middle Workstation Layout: Media Sidebar + Monitor Viewport + Inspector */}
      <div className="flex-1 flex min-h-0 relative overflow-hidden">
        {/* Media Assets & Presets Sidebar */}
        <MediaLibrary
          mediaAssets={mediaAssets}
          onAddMediaAsset={(asset) => setMediaAssets((prev) => [asset, ...prev])}
          onAddClipToTimeline={handleAddClipToTimeline}
          onApplyFilterToSelected={handleApplyFilterToSelected}
          onApplyTransitionToSelected={handleApplyTransitionToSelected}
          onOpenAutoCaptions={() => setIsAutoCaptionsOpen(true)}
        />

        {/* Real-time Canvas Monitor */}
        <PlayerMonitor
          tracks={tracks}
          projectSettings={projectSettings}
          currentTime={currentTime}
          isPlaying={isPlaying}
          selectedClipId={selectedClipId}
          onSeek={handleSeek}
          onTogglePlay={handleTogglePlay}
          onStepFrame={handleStepFrame}
          onJumpStart={handleJumpStart}
          onJumpEnd={handleJumpEnd}
          onSelectClip={(clipId) => handleSelectClip(clipId, false)}
          onUpdateClipTransform={handleUpdateClipTransform}
        />

        {/* Right Inspector Panel */}
        <Inspector
          selectedClip={selectedClipObj}
          currentTime={currentTime}
          onSeek={handleSeek}
          onUpdateClip={handleUpdateClip}
          onDeleteClip={handleDeleteClip}
          onDuplicateClip={handleDuplicateClip}
          onSplitClipAtPlayhead={handleSplitClipAtPlayhead}
        />
      </div>

      {/* Bottom Multi-Track Timeline */}
      <Timeline
        tracks={tracks}
        projectSettings={projectSettings}
        currentTime={currentTime}
        selectedClipId={selectedClipId}
        selectedClipIds={selectedClipIds}
        onSeek={handleSeek}
        onSelectClip={handleSelectClip}
        onUpdateClip={handleUpdateClip}
        onUpdateClipsBatch={handleUpdateClipsBatch}
        onDeleteClip={handleDeleteClip}
        onDeleteSelectedClips={handleDeleteSelectedClips}
        onDuplicateClip={handleDuplicateClip}
        onDuplicateSelectedClips={handleDuplicateSelectedClips}
        onCommitHistory={handleCommitHistory}
        onSplitClipAtPlayhead={handleSplitClipAtPlayhead}
        onToggleTrackMute={handleToggleTrackMute}
        onToggleTrackLock={handleToggleTrackLock}
        onToggleTrackVisible={handleToggleTrackVisible}
      />

      {/* Export Dialog */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        tracks={tracks}
        projectSettings={projectSettings}
      />

      {/* Shortcuts Cheat Sheet Modal */}
      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      {/* AI Auto-Captions Generator Dialog */}
      <AutoCaptionsModal
        isOpen={isAutoCaptionsOpen}
        onClose={() => setIsAutoCaptionsOpen(false)}
        tracks={tracks}
        onAddGeneratedCaptions={handleAddGeneratedCaptions}
      />
    </div>
  );
}
