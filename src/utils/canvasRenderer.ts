import { AspectRatio, Clip, Track } from '../types/editor';

interface RenderOptions {
  currentTime: number;
  tracks: Track[];
  aspectRatio: AspectRatio;
  width: number;
  height: number;
  selectedClipId?: string | null;
}

export class CanvasRenderer {
  private imageCache = new Map<string, HTMLImageElement>();
  private svgCache = new Map<string, HTMLImageElement>();
  private videoCache = new Map<string, HTMLVideoElement>();
  private offscreenCanvas: HTMLCanvasElement;
  private offscreenCtx: CanvasRenderingContext2D | null;

  constructor() {
    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCtx = this.offscreenCanvas.getContext('2d');
  }

  public getResolution(aspectRatio: AspectRatio, targetRes: '720p' | '1080p' | '4k' = '1080p'): { width: number; height: number } {
    let baseDim = 1080;
    if (targetRes === '720p') baseDim = 720;
    if (targetRes === '4k') baseDim = 2160;

    switch (aspectRatio) {
      case '16:9':
        return { width: Math.round((baseDim * 16) / 9), height: baseDim };
      case '9:16':
        return { width: baseDim, height: Math.round((baseDim * 16) / 9) };
      case '1:1':
        return { width: baseDim, height: baseDim };
      case '4:5':
        return { width: baseDim, height: Math.round((baseDim * 5) / 4) };
      default:
        return { width: 1920, height: 1080 };
    }
  }

  public preloadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      if (this.imageCache.has(url)) {
        const cached = this.imageCache.get(url)!;
        if (cached.complete) {
          resolve(cached);
          return;
        }
      }
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        this.imageCache.set(url, img);
        resolve(img);
      };
      img.onerror = (e) => reject(e);
      img.src = url;
    });
  }

  public preloadSvg(svgString: string, id: string): HTMLImageElement {
    if (this.svgCache.has(id)) {
      return this.svgCache.get(id)!;
    }
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.src = url;
    this.svgCache.set(id, img);
    return img;
  }

  public render(ctx: CanvasRenderingContext2D, options: RenderOptions) {
    const { currentTime, tracks, width, height, selectedClipId } = options;

    // 1. Clear background
    ctx.fillStyle = '#05070a';
    ctx.fillRect(0, 0, width, height);

    const sortedTracks = [...tracks].filter((t) => t.visible);

    for (const track of sortedTracks) {
      const activeClips = track.clips.filter(
        (clip) => currentTime >= clip.start && currentTime <= clip.start + clip.duration
      );

      for (const clip of activeClips) {
        ctx.save();

        const clipProgress = (currentTime - clip.start) / clip.duration;
        const timeInClip = currentTime - clip.start;

        // Apply transition effects
        let transitionProgress = 1;
        if (clip.transitionIn && clip.transitionIn.type !== 'none' && clip.transitionIn.duration > 0) {
          if (timeInClip < clip.transitionIn.duration) {
            transitionProgress = Math.max(0, Math.min(1, timeInClip / clip.transitionIn.duration));
          }
        }

        // Compute Keyframe Animation Transforms (Position X/Y, Scale, Rotation, Opacity)
        const currentTransform = this.interpolateKeyframes(clip, timeInClip);

        const centerX = width / 2 + (currentTransform.x * (width / 1920));
        const centerY = height / 2 + (currentTransform.y * (height / 1080));

        let currentScale = currentTransform.scale;
        let currentOpacity = currentTransform.opacity;

        // Transitions handling
        if (transitionProgress < 1 && clip.transitionIn) {
          switch (clip.transitionIn.type) {
            case 'crossfade':
              currentOpacity *= transitionProgress;
              break;
            case 'zoom':
              currentScale *= (0.3 + 0.7 * transitionProgress);
              currentOpacity *= Math.min(1, transitionProgress * 1.5);
              break;
            case 'flash':
              break;
            case 'dipToBlack':
              currentOpacity *= transitionProgress;
              break;
            case 'wipeLeft':
              ctx.beginPath();
              ctx.rect(0, 0, width * transitionProgress, height);
              ctx.clip();
              break;
            case 'wipeRight':
              ctx.beginPath();
              ctx.rect(width * (1 - transitionProgress), 0, width * transitionProgress, height);
              ctx.clip();
              break;
            case 'glitch':
              if (Math.random() > 0.4) {
                ctx.translate((Math.random() - 0.5) * 20, (Math.random() - 0.5) * 10);
              }
              break;
          }
        }

        ctx.translate(centerX, centerY);
        ctx.rotate((currentTransform.rotation * Math.PI) / 180);
        ctx.scale(
          (clip.transform.flipH ? -1 : 1) * currentScale,
          (clip.transform.flipV ? -1 : 1) * currentScale
        );
        ctx.globalAlpha = Math.max(0, Math.min(1, currentOpacity));

        // Render specific clip content
        if (clip.type === 'video' || clip.type === 'image') {
          this.renderMediaClip(ctx, clip, clipProgress, width, height);
        } else if (clip.type === 'sticker') {
          this.renderStickerClip(ctx, clip, width, height);
        } else if (clip.type === 'text') {
          this.renderTextClip(ctx, clip, timeInClip, width, height);
        }

        // Flash transition overlay
        if (clip.transitionIn && clip.transitionIn.type === 'flash' && transitionProgress < 1) {
          ctx.fillStyle = `rgba(255, 255, 255, ${1 - transitionProgress})`;
          ctx.fillRect(-width, -height, width * 2, height * 2);
        }

        if (selectedClipId === clip.id) {
          this.renderSelectionOutline(ctx, clip, width, height);
        }

        ctx.restore();
      }
    }
  }

  /**
   * Interpolates keyframes with smooth easing curves
   */
  public interpolateKeyframes(clip: Clip, timeInClip: number): {
    x: number;
    y: number;
    scale: number;
    rotation: number;
    opacity: number;
  } {
    const fallback = {
      x: clip.transform.x,
      y: clip.transform.y,
      scale: clip.transform.scale,
      rotation: clip.transform.rotation,
      opacity: clip.transform.opacity,
    };

    if (!clip.keyframes || clip.keyframes.length === 0) {
      return fallback;
    }

    const sorted = [...clip.keyframes].sort((a, b) => a.time - b.time);

    // If before first keyframe
    if (timeInClip <= sorted[0].time) {
      return {
        x: sorted[0].x,
        y: sorted[0].y,
        scale: sorted[0].scale,
        rotation: sorted[0].rotation ?? fallback.rotation,
        opacity: sorted[0].opacity ?? fallback.opacity,
      };
    }

    // If after last keyframe
    if (timeInClip >= sorted[sorted.length - 1].time) {
      const last = sorted[sorted.length - 1];
      return {
        x: last.x,
        y: last.y,
        scale: last.scale,
        rotation: last.rotation ?? fallback.rotation,
        opacity: last.opacity ?? fallback.opacity,
      };
    }

    // Find bounding keyframe interval
    let k1 = sorted[0];
    let k2 = sorted[1];
    for (let i = 0; i < sorted.length - 1; i++) {
      if (timeInClip >= sorted[i].time && timeInClip <= sorted[i + 1].time) {
        k1 = sorted[i];
        k2 = sorted[i + 1];
        break;
      }
    }

    const duration = k2.time - k1.time;
    if (duration <= 0.0001) {
      return {
        x: k1.x,
        y: k1.y,
        scale: k1.scale,
        rotation: k1.rotation ?? fallback.rotation,
        opacity: k1.opacity ?? fallback.opacity,
      };
    }

    const rawT = (timeInClip - k1.time) / duration;
    // Ease-in-out curve
    const easeT = rawT < 0.5 ? 2 * rawT * rawT : 1 - Math.pow(-2 * rawT + 2, 2) / 2;

    const r1 = k1.rotation ?? fallback.rotation;
    const r2 = k2.rotation ?? fallback.rotation;
    const o1 = k1.opacity ?? fallback.opacity;
    const o2 = k2.opacity ?? fallback.opacity;

    return {
      x: k1.x + (k2.x - k1.x) * easeT,
      y: k1.y + (k2.y - k1.y) * easeT,
      scale: k1.scale + (k2.scale - k1.scale) * easeT,
      rotation: r1 + (r2 - r1) * easeT,
      opacity: o1 + (o2 - o1) * easeT,
    };
  }

  private renderMediaClip(
    ctx: CanvasRenderingContext2D,
    clip: Clip,
    clipProgress: number,
    targetWidth: number,
    targetHeight: number
  ) {
    if (!clip.url) return;

    // Apply color grading filters
    const { brightness, contrast, saturation, sepia, blur } = clip.filters;
    const bVal = 100 + brightness;
    const cVal = 100 + contrast;
    const sVal = 100 + saturation;
    const sepVal = sepia;
    const blurVal = blur * (targetWidth / 1920);

    ctx.filter = `brightness(${bVal}%) contrast(${cVal}%) saturate(${sVal}%) sepia(${sepVal}%) blur(${blurVal}px)`;

    const img = this.imageCache.get(clip.url);
    if (img && img.complete && img.naturalWidth > 0) {
      // Calculate scale to cover canvas smoothly
      const aspectImg = img.naturalWidth / img.naturalHeight;
      const aspectCanvas = targetWidth / targetHeight;

      let drawWidth: number;
      let drawHeight: number;

      if (aspectImg > aspectCanvas) {
        drawHeight = targetHeight;
        drawWidth = targetHeight * aspectImg;
      } else {
        drawWidth = targetWidth;
        drawHeight = targetWidth / aspectImg;
      }

      // Subtle dynamic pan/zoom (Ken Burns effect for cinematic realism)
      const zoomFactor = 1.0 + clipProgress * 0.05;
      const panX = (clipProgress - 0.5) * 15;
      const panY = (clipProgress - 0.5) * 10;

      const dw = drawWidth * zoomFactor;
      const dh = drawHeight * zoomFactor;
      const dx = -dw / 2 + panX;
      const dy = -dh / 2 + panY;

      // Check if AI Smart Cutout (Background Removal) is enabled
      if (clip.smartCutout?.enabled) {
        this.renderSmartCutoutMedia(ctx, img, dx, dy, dw, dh, clip.smartCutout);
      } else {
        ctx.drawImage(img, dx, dy, dw, dh);
      }
    } else {
      // Image preloading or fallback procedural animation
      this.preloadImage(clip.url).catch(() => {});
      this.drawProceduralMediaFallback(ctx, clip, targetWidth, targetHeight, clipProgress);
    }

    // Reset filter for secondary overlays
    ctx.filter = 'none';

    // Apply Temperature tint
    if (clip.filters.temperature !== 0) {
      const temp = clip.filters.temperature;
      ctx.save();
      if (temp > 0) {
        // Warm golden amber tint
        ctx.fillStyle = `rgba(245, 158, 11, ${Math.min(0.4, (temp / 100) * 0.35)})`;
        ctx.globalCompositeOperation = 'color-burn';
      } else {
        // Cool blue cyan tint
        ctx.fillStyle = `rgba(6, 182, 212, ${Math.min(0.4, (-temp / 100) * 0.35)})`;
        ctx.globalCompositeOperation = 'color-dodge';
      }
      ctx.fillRect(-targetWidth / 2, -targetHeight / 2, targetWidth, targetHeight);
      ctx.restore();
    }

    // Apply Vignette overlay
    if (clip.filters.vignette > 0) {
      ctx.save();
      const radius = Math.max(targetWidth, targetHeight) * 0.7;
      const grad = ctx.createRadialGradient(0, 0, radius * 0.3, 0, 0, radius);
      const vigAlpha = (clip.filters.vignette / 100) * 0.85;
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(1, `rgba(0,0,0,${vigAlpha})`);
      ctx.fillStyle = grad;
      ctx.fillRect(-targetWidth / 2, -targetHeight / 2, targetWidth, targetHeight);
      ctx.restore();
    }
  }

  private renderSmartCutoutMedia(
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    dx: number,
    dy: number,
    dw: number,
    dh: number,
    config: NonNullable<Clip['smartCutout']>
  ) {
    if (!this.offscreenCtx) return;
    const offCanvas = this.offscreenCanvas;
    const offCtx = this.offscreenCtx;

    // Use scaled size for fast, smooth processing
    const procW = Math.min(640, Math.round(dw));
    const procH = Math.min(480, Math.round(dh));

    if (offCanvas.width !== procW || offCanvas.height !== procH) {
      offCanvas.width = procW;
      offCanvas.height = procH;
    }

    offCtx.clearRect(0, 0, procW, procH);
    offCtx.drawImage(img, 0, 0, procW, procH);

    const imgData = offCtx.getImageData(0, 0, procW, procH);
    const data = imgData.data;

    // Parse key color (default green #00FF00)
    let keyR = 0;
    let keyG = 255;
    let keyB = 0;
    if (config.keyColor && config.keyColor.startsWith('#')) {
      const hex = config.keyColor.replace('#', '');
      if (hex.length === 6) {
        keyR = parseInt(hex.substring(0, 2), 16);
        keyG = parseInt(hex.substring(2, 4), 16);
        keyB = parseInt(hex.substring(4, 6), 16);
      }
    }

    const tolerance = (config.tolerance / 100) * 200;
    const softness = Math.max(1, (config.softness / 100) * 100);

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      let alpha = data[i + 3];

      if (config.mode === 'chroma') {
        // Distance from key color
        const diffR = r - keyR;
        const diffG = g - keyG;
        const diffB = b - keyB;
        const dist = Math.sqrt(diffR * diffR + diffG * diffG + diffB * diffB);

        if (dist < tolerance) {
          alpha = 0;
        } else if (dist < tolerance + softness) {
          alpha = Math.round(((dist - tolerance) / softness) * 255);
        }
      } else if (config.mode === 'luma') {
        // Luma key: remove dark background or bright screen
        const luma = 0.299 * r + 0.587 * g + 0.114 * b;
        const thresh = (config.tolerance / 100) * 255;
        if (luma < thresh) {
          alpha = 0;
        } else if (luma < thresh + softness) {
          alpha = Math.round(((luma - thresh) / softness) * 255);
        }
      } else {
        // AI Subject Auto-Cutout
        // Distinguish foreground subject from perimeter/background tone
        const luma = 0.299 * r + 0.587 * g + 0.114 * b;
        const pixelIdx = i / 4;
        const px = pixelIdx % procW;
        const py = Math.floor(pixelIdx / procW);
        const distFromCenter = Math.hypot((px - procW / 2) / (procW / 2), (py - procH / 2) / (procH / 2));

        // Background boundary distance falloff
        const bgDiff = Math.abs(r - g) + Math.abs(g - b);
        if (distFromCenter > 0.85 && luma < 80 && bgDiff < 40) {
          alpha = 0;
        } else if (distFromCenter > 0.6) {
          const fade = Math.min(1, Math.max(0, (1 - distFromCenter) / 0.4));
          alpha = Math.round(alpha * fade);
        }
      }

      data[i + 3] = alpha;
    }

    offCtx.putImageData(imgData, 0, 0);

    // If stroke outline (neon cutout contour) is active
    if (config.strokeOutline) {
      ctx.save();
      ctx.shadowColor = config.strokeColor || '#38BDF8';
      ctx.shadowBlur = config.strokeWidth * 4;
      ctx.drawImage(offCanvas, dx, dy, dw, dh);
      ctx.restore();
    }

    ctx.drawImage(offCanvas, dx, dy, dw, dh);
  }

  private drawProceduralMediaFallback(
    ctx: CanvasRenderingContext2D,
    clip: Clip,
    w: number,
    h: number,
    progress: number
  ) {
    const halfW = w / 2;
    const halfH = h / 2;
    const grad = ctx.createLinearGradient(-halfW, -halfH, halfW, halfH);
    grad.addColorStop(0, '#1e1b4b');
    grad.addColorStop(0.5, '#312e81');
    grad.addColorStop(1, '#0f172a');
    ctx.fillStyle = grad;
    ctx.fillRect(-halfW, -halfH, w, h);

    // Draw animated tech wave pattern
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let x = -halfW; x <= halfW; x += 15) {
      const y = Math.sin((x / 80) + progress * 8) * 40;
      if (x === -halfW) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 24px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(clip.name, 0, 80);
  }

  private renderStickerClip(
    ctx: CanvasRenderingContext2D,
    clip: Clip,
    targetWidth: number,
    targetHeight: number
  ) {
    if (!clip.stickerConfig) return;
    const { svg, stickerId } = clip.stickerConfig;
    const img = this.preloadSvg(svg, stickerId);

    const baseSize = 240 * (targetWidth / 1920);
    const halfSize = baseSize / 2;

    if (img && img.complete) {
      ctx.drawImage(img, -halfSize, -halfSize, baseSize, baseSize);
    }
  }

  private renderTextClip(
    ctx: CanvasRenderingContext2D,
    clip: Clip,
    timeInClip: number,
    targetWidth: number,
    _targetHeight: number
  ) {
    if (!clip.textConfig) return;
    const cfg = clip.textConfig;

    // Scale font size according to target resolution
    const scaleFactor = targetWidth / 1920;
    const actualFontSize = Math.max(16, cfg.fontSize * scaleFactor);

    let displayText = cfg.text;

    // Animations
    ctx.save();
    if (cfg.animation === 'typewriter') {
      const charsToShow = Math.floor(
        Math.min(cfg.text.length, (timeInClip / Math.min(2.5, clip.duration)) * cfg.text.length)
      );
      displayText = cfg.text.slice(0, charsToShow);
    } else if (cfg.animation === 'slideUp') {
      const animT = Math.min(1, timeInClip / 0.5);
      const easeOut = 1 - Math.pow(1 - animT, 3);
      ctx.translate(0, (1 - easeOut) * 60);
      ctx.globalAlpha *= easeOut;
    } else if (cfg.animation === 'bounce') {
      const animT = Math.min(1, timeInClip / 0.6);
      const bounce = Math.sin(animT * Math.PI) * 0.2;
      ctx.scale(1 + bounce, 1 + bounce);
    } else if (cfg.animation === 'pulse') {
      const pulse = Math.sin(timeInClip * 4) * 0.06;
      ctx.scale(1 + pulse, 1 + pulse);
    } else if (cfg.animation === 'glitch') {
      if (Math.random() > 0.85) {
        ctx.translate((Math.random() - 0.5) * 8, 0);
      }
    } else if (cfg.animation === 'fadeIn') {
      const animT = Math.min(1, timeInClip / 0.5);
      ctx.globalAlpha *= animT;
    }

    ctx.font = `${cfg.fontWeight} ${actualFontSize}px "${cfg.fontFamily}", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const lines = displayText.split('\n');
    const lineHeight = actualFontSize * 1.25;
    const totalTextHeight = lines.length * lineHeight;

    // Measure max line width
    let maxLineWidth = 0;
    lines.forEach((line) => {
      const m = ctx.measureText(line);
      if (m.width > maxLineWidth) maxLineWidth = m.width;
    });

    // Draw background box if specified
    if (cfg.backgroundColor && cfg.backgroundColor !== 'transparent') {
      const pad = cfg.backgroundPadding * scaleFactor;
      const boxW = maxLineWidth + pad * 2;
      const boxH = totalTextHeight + pad * 2;
      const boxX = -boxW / 2;
      const boxY = -boxH / 2;

      ctx.fillStyle = cfg.backgroundColor;
      if (cfg.borderRadius > 0) {
        const rad = cfg.borderRadius * scaleFactor;
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxW, boxH, rad);
        ctx.fill();
      } else {
        ctx.fillRect(boxX, boxY, boxW, boxH);
      }
    }

    // Shadow / Neon glow
    if (cfg.shadowBlur > 0) {
      ctx.shadowColor = cfg.shadowColor || 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = cfg.shadowBlur * scaleFactor;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 2 * scaleFactor;
    }

    // Render lines
    const startY = -(totalTextHeight / 2) + lineHeight / 2;
    lines.forEach((line, idx) => {
      const lineY = startY + idx * lineHeight;

      // Stroke outline
      if (cfg.strokeWidth > 0 && cfg.strokeColor) {
        ctx.strokeStyle = cfg.strokeColor;
        ctx.lineWidth = cfg.strokeWidth * scaleFactor;
        ctx.lineJoin = 'round';
        ctx.strokeText(line, 0, lineY);
      }

      // Main Fill
      ctx.fillStyle = cfg.color;
      ctx.fillText(line, 0, lineY);
    });

    ctx.restore();
  }

  private renderSelectionOutline(
    ctx: CanvasRenderingContext2D,
    _clip: Clip,
    width: number,
    height: number
  ) {
    ctx.save();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([6, 6]);
    const outlineW = width * 0.9;
    const outlineH = height * 0.9;
    ctx.strokeRect(-outlineW / 2, -outlineH / 2, outlineW, outlineH);

    // Corner handles
    ctx.fillStyle = '#ffffff';
    ctx.setLineDash([]);
    const handleSize = 10;
    const corners = [
      [-outlineW / 2, -outlineH / 2],
      [outlineW / 2, -outlineH / 2],
      [-outlineW / 2, outlineH / 2],
      [outlineW / 2, outlineH / 2],
    ];
    corners.forEach(([cx, cy]) => {
      ctx.fillRect(cx - handleSize / 2, cy - handleSize / 2, handleSize, handleSize);
      ctx.strokeRect(cx - handleSize / 2, cy - handleSize / 2, handleSize, handleSize);
    });

    ctx.restore();
  }
}

export const canvasRenderer = new CanvasRenderer();
