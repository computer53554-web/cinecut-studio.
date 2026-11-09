import { ExportSettings, ProjectSettings, Track } from '../types/editor';
import { audioEngine } from './audioEngine';
import { canvasRenderer } from './canvasRenderer';

export interface ExportProgress {
  renderedSeconds: number;
  totalSeconds: number;
  progressPercent: number;
  currentFrame: number;
  totalFrames: number;
  estimatedRemainingSec: number;
}

export class ExportEngine {
  private isCancelled = false;

  public cancel() {
    this.isCancelled = true;
  }

  /**
   * Export a single high-resolution snapshot frame of the canvas
   */
  public exportSnapshot(
    tracks: Track[],
    projectSettings: ProjectSettings,
    currentTime: number,
    filename = 'cinecut_snapshot.png'
  ) {
    const { width, height } = canvasRenderer.getResolution(projectSettings.aspectRatio, '1080p');
    const offscreen = document.createElement('canvas');
    offscreen.width = width;
    offscreen.height = height;
    const ctx = offscreen.getContext('2d');
    if (!ctx) return;

    canvasRenderer.render(ctx, {
      currentTime,
      tracks,
      aspectRatio: projectSettings.aspectRatio,
      width,
      height,
    });

    const dataUrl = offscreen.toDataURL('image/png', 1.0);
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    link.click();
  }

  /**
   * Render and export video file using MediaRecorder and synchronized audio mixing
   */
  public async exportVideo(
    tracks: Track[],
    projectSettings: ProjectSettings,
    exportSettings: ExportSettings,
    onProgress: (progress: ExportProgress) => void
  ): Promise<Blob> {
    this.isCancelled = false;

    // 1. Calculate project effective duration (time of last clip)
    let maxTime = 5;
    tracks.forEach((track) => {
      track.clips.forEach((clip) => {
        const end = clip.start + clip.duration;
        if (end > maxTime) maxTime = end;
      });
    });
    const totalDuration = Math.min(maxTime, projectSettings.duration);

    // 2. Setup resolution canvas
    const { width, height } = canvasRenderer.getResolution(projectSettings.aspectRatio, exportSettings.resolution);
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = width;
    exportCanvas.height = height;
    const ctx = exportCanvas.getContext('2d')!;

    // 3. Setup canvas stream and audio destination
    const fps = exportSettings.fps || 30;
    const canvasStream = exportCanvas.captureStream(fps);

    // Setup audio destination
    const audioDest = audioEngine.getStreamDestination();
    const combinedStream = new MediaStream();

    // Add video track
    canvasStream.getVideoTracks().forEach((track) => combinedStream.addTrack(track));

    // Add audio track
    audioDest.stream.getAudioTracks().forEach((track) => combinedStream.addTrack(track));

    // 4. Select supported mimeType
    let mimeType = 'video/webm;codecs=vp9,opus';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm;codecs=vp8,opus';
    }
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm';
    }

    const recordedChunks: Blob[] = [];
    const bitrate =
      exportSettings.quality === 'ultra' ? 12000000 : exportSettings.quality === 'high' ? 8000000 : 4000000;

    const recorder = new MediaRecorder(combinedStream, {
      mimeType,
      videoBitsPerSecond: bitrate,
    });

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        recordedChunks.push(e.data);
      }
    };

    recorder.start(100);

    // 5. Pre-trigger audio clips for the export destination
    audioEngine.stopAll();
    const audioTracks = tracks.filter((t) => t.type === 'audio' && !t.muted && t.visible);
    for (const track of audioTracks) {
      for (const clip of track.clips) {
        const buffer = clip.mediaAssetId ? audioEngine.getBuffer(clip.mediaAssetId) : undefined;
        if (buffer) {
          audioEngine.playClip(
            clip.id,
            buffer,
            clip.start,
            clip.duration,
            clip.sourceStart,
            0,
            clip.volume,
            clip.fadeIn,
            clip.fadeOut,
            clip.speed,
            true // isExporting
          );
        }
      }
    }

    // 6. Frame-by-frame rendering loop with timing alignment
    const frameInterval = 1 / fps;
    const totalFrames = Math.ceil(totalDuration * fps);
    let currentFrame = 0;
    const startTimeStamp = performance.now();

    return new Promise((resolve, reject) => {
      const renderNextFrame = () => {
        if (this.isCancelled) {
          recorder.stop();
          audioEngine.stopAll();
          reject(new Error('Export was cancelled by user'));
          return;
        }

        const currentTime = currentFrame * frameInterval;

        // Render visual frame
        canvasRenderer.render(ctx, {
          currentTime,
          tracks,
          aspectRatio: projectSettings.aspectRatio,
          width,
          height,
        });

        currentFrame++;

        // Calculate progress
        const percent = Math.min(100, Math.round((currentFrame / totalFrames) * 100));
        const elapsed = (performance.now() - startTimeStamp) / 1000;
        const framesPerSec = currentFrame / (elapsed || 0.001);
        const remainingFrames = totalFrames - currentFrame;
        const estimatedRemainingSec = Math.max(0, Math.round(remainingFrames / framesPerSec));

        onProgress({
          renderedSeconds: currentTime,
          totalSeconds: totalDuration,
          progressPercent: percent,
          currentFrame,
          totalFrames,
          estimatedRemainingSec,
        });

        if (currentFrame < totalFrames) {
          // Keep steady frame pacing matching fps
          const targetTime = startTimeStamp + currentFrame * (1000 / fps);
          const delay = Math.max(0, targetTime - performance.now());
          setTimeout(renderNextFrame, delay);
        } else {
          // Finished rendering all frames
          setTimeout(() => {
            recorder.onstop = () => {
              audioEngine.stopAll();
              const finalBlob = new Blob(recordedChunks, { type: mimeType });
              resolve(finalBlob);
            };
            recorder.stop();
          }, 300);
        }
      };

      renderNextFrame();
    });
  }
}

export const exportEngine = new ExportEngine();
