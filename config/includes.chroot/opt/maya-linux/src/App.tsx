import React, { useState, useRef, useEffect } from 'react';
import { ProjectState } from './types/project';
import { Header } from './components/Header/Header';
import { SettingsSidebar } from './components/Sidebar/SettingsSidebar';
import { CanvasPreview } from './components/Canvas/CanvasPreview';
import { Timeline } from './components/Timeline/Timeline';
import { InspectorPanel } from './components/Panels/InspectorPanel';
import { TemplatesModal } from './components/Modals/TemplatesModal';
import { TTSModal } from './components/Modals/TTSModal';
import { StickerPickerModal } from './components/Modals/StickerPickerModal';
import { KeyboardShortcutsModal } from './components/Modals/KeyboardShortcutsModal';
import { CursorModal } from './components/Modals/CursorModal';
import { LowerThirdsModal } from './components/Modals/LowerThirdsModal';
import { SFXLibraryModal } from './components/Modals/SFXLibraryModal';
import { MetaEditsModal } from './components/Modals/MetaEditsModal';
import { TransitionsModal } from './components/Modals/TransitionsModal';
import { TypewriterModal } from './components/Modals/TypewriterModal';
import { BrandAssetsModal } from './components/Modals/BrandAssetsModal';
import { GRADIENT_PRESETS } from './models/devices';
import { SpeedTimeline } from './models/speedTimeline';
import { exportVideo } from './services/exportService';
import { computeAudioDucking, computeAudioFade } from './services/audioService';
import { generateProceduralMotionProject, MotionSynthPreset } from './services/proceduralMotionSynth';
import { AudioTrack, CanvasAspectRatioType, StickerItem, SubtitleItem, TextOverlay, MetaEditsConfig, TransitionItem, TypewriterOverlayItem, ImageOverlayItem } from './types/models';

const initialProject: ProjectState = {
  videoURL: null,
  displayName: null,
  videoNaturalWidth: 0,
  videoNaturalHeight: 0,
  videoDuration: 0,
  currentSeconds: 0,
  isPlaying: false,
  isMuted: true,

  scale: 0.85,
  offset: { width: 0, height: 0 },
  background: { type: 'gradient', gradient: GRADIENT_PRESETS[0] },
  canvasAspect: 'square',
  shadow: {
    enabled: true,
    colorHex: '#000000',
    radius: 28,
    offsetY: 14,
    offsetX: 0,
    opacity: 0.35,
  },
  transform3D: {
    enabled: false,
    rotateX: 0,
    rotateY: 0,
    rotateZ: 0,
    perspective: 1000,
    autoDrift: false,
    depthExtrusion: 14,
    specularGlare: true,
  },
  effects: {
    colorGrade: 'none',
    vignette: 0,
    filmGrain: 0,
    chromaticAberration: 0,
    bloom: 0,
    scanlines: false,
    cameraShake: 0,
    rgbGlitch: 0,
    spotlight: {
      enabled: false,
      x: 0.5,
      y: 0.5,
      radius: 0.35,
      opacity: 0.65,
    },
    deviceGlow: { enabled: false, colorHex: '#6466FA', radius: 24 },
    showSafeZones: false,
    showGrid: false,
  },
  watermark: {
    enabled: false,
    text: 'Made with Maya',
    position: 'bottom-right',
    opacity: 0.75,
    scale: 1,
  },

  deviceModelID: 'iphone-17-pro',
  deviceColorID: 'cosmic-orange',

  bareCornerRadius: 0.06,
  bareBezelWidth: 0.02,
  bareBezelHex: '#000000',

  desktopFrame: {
    title: 'Maya Studio',
    url: 'https://maya.studio/demo',
    theme: 'dark',
    trafficLights: 'macos',
    showUrlBar: true,
  },

  cursor: {
    enabled: true,
    style: 'macos',
    colorHex: '#6466FA',
    size: 28,
    clickRipples: true,
  },

  animations: [],
  tapEvents: [],
  speedSegments: [],
  transitions: [],
  typewriters: [],
  imageOverlays: [],
  overlays: [],
  subtitles: [],
  stickers: [],
  audioTracks: [],
  selectedEvent: null,

  trimStartTime: 0,
  trimEndTime: 0,
  clipTimelineStart: 0,

  isExporting: false,
  exportProgress: 0,
  exportType: null,
};

export const App: React.FC = () => {
  const [project, setProject] = useState<ProjectState>(initialProject);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof document !== 'undefined' && document.documentElement.classList.contains('light')) {
      return 'light';
    }
    return 'dark';
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [copiedSolana, setCopiedSolana] = useState(false);
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);
  const [isTTSModalOpen, setIsTTSModalOpen] = useState(false);
  const [isStickerModalOpen, setIsStickerModalOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [isCursorModalOpen, setIsCursorModalOpen] = useState(false);
  const [isLowerThirdsModalOpen, setIsLowerThirdsModalOpen] = useState(false);
  const [isSFXModalOpen, setIsSFXModalOpen] = useState(false);
  const [isMetaEditsModalOpen, setIsMetaEditsModalOpen] = useState(false);
  const [isTransitionsModalOpen, setIsTransitionsModalOpen] = useState(false);
  const [isTypewriterModalOpen, setIsTypewriterModalOpen] = useState(false);
  const [isBrandAssetsModalOpen, setIsBrandAssetsModalOpen] = useState(false);

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(next);
      document.documentElement.dataset.theme = next;
      try {
        window.localStorage.setItem('maya-theme', next);
      } catch (_) {}
      return next;
    });
  };

  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: light)');
    if (!mq) return;
    const onChange = (e: MediaQueryListEvent) => {
      const params = new URLSearchParams(window.location.search);
      if (params.get('theme') || window.localStorage.getItem('maya-theme')) return;
      const next = e.matches ? 'light' : 'dark';
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(next);
      document.documentElement.dataset.theme = next;
      setTheme(next);
    };
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);

  const historyRef = useRef<ProjectState[]>([]);
  const futureRef = useRef<ProjectState[]>([]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const pushHistory = (state: ProjectState) => {
    historyRef.current.push(JSON.parse(JSON.stringify(state)));
    if (historyRef.current.length > 50) historyRef.current.shift();
    futureRef.current = [];
  };

  const undo = () => {
    if (historyRef.current.length === 0) return;
    const previous = historyRef.current.pop();
    if (previous) {
      futureRef.current.push(JSON.parse(JSON.stringify(project)));
      setProject(prev => ({
        ...previous,
        videoURL: prev.videoURL,
        isPlaying: false,
        currentSeconds: prev.currentSeconds,
      }));
    }
  };

  const redo = () => {
    if (futureRef.current.length === 0) return;
    const next = futureRef.current.pop();
    if (next) {
      historyRef.current.push(JSON.parse(JSON.stringify(project)));
      setProject(prev => ({
        ...next,
        videoURL: prev.videoURL,
        isPlaying: false,
        currentSeconds: prev.currentSeconds,
      }));
    }
  };

  const updateProject = (updater: Partial<ProjectState>, recordHistory: boolean = false) => {
    if (recordHistory) {
      pushHistory(project);
    }
    setProject(prev => ({ ...prev, ...updater }));
  };

  const handleOpenFile = () => {
    fileInputRef.current?.click();
  };

  const loadVideoFile = (file: File) => {
    const url = URL.createObjectURL(file);
    updateProject({
      videoURL: url,
      displayName: file.name,
      isPlaying: false,
      currentSeconds: 0,
    });
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) loadVideoFile(file);
  };

  const handleSaveProject = () => {
    const dataToSave = {
      ...project,
      videoURL: null,
      isPlaying: false,
      isExporting: false,
    };
    const blob = new Blob([JSON.stringify(dataToSave, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${project.displayName?.replace(/\.[^/.]+$/, "") || "Project"}.mayaproj`;
    a.click();
  };

  const handleLoadProject = (loadedData: any) => {
    setProject(prev => ({
      ...prev,
      ...loadedData,
      videoURL: prev.videoURL,
    }));
  };

  // Video metadata loading
  const onLoadedMetadata = () => {
    const video = videoRef.current;
    if (!video) return;

    updateProject({
      videoNaturalWidth: video.videoWidth,
      videoNaturalHeight: video.videoHeight,
      videoDuration: video.duration,
      trimStartTime: 0,
      trimEndTime: video.duration,
    });
  };

  // Video time update sync
  const onTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || project.isExporting) return;

    const speedTimeline = new SpeedTimeline(
      project.trimStartTime,
      project.trimEndTime,
      project.speedSegments
    );

    const sourceTime = video.currentTime;
    if (sourceTime >= project.trimEndTime) {
      video.currentTime = project.trimStartTime;
      if (audioRef.current) audioRef.current.currentTime = 0;
      updateProject({ currentSeconds: 0 });
    } else {
      const timelineOffset = speedTimeline.outputOffset(sourceTime);
      updateProject({ currentSeconds: timelineOffset });
    }
  };

  // Dynamic Real-time Playback Rate Synchronization for Speed Segments
  useEffect(() => {
    const video = videoRef.current;
    const audio = audioRef.current;
    if (!video || !project.isPlaying) {
      if (video && Math.abs(video.playbackRate - 1.0) > 0.01) {
        video.playbackRate = 1.0;
      }
      return;
    }

    let animId: number;
    const syncPlaybackRate = () => {
      if (video && !video.paused) {
        const speedTimeline = new SpeedTimeline(
          project.trimStartTime,
          project.trimEndTime,
          project.speedSegments
        );
        const currentRate = speedTimeline.rate(video.currentTime);
        if (Math.abs(video.playbackRate - currentRate) > 0.01) {
          video.playbackRate = currentRate;
          if (audio) {
            audio.playbackRate = currentRate;
          }
        }
      }
      animId = requestAnimationFrame(syncPlaybackRate);
    };

    animId = requestAnimationFrame(syncPlaybackRate);
    return () => {
      cancelAnimationFrame(animId);
    };
  }, [project.isPlaying, project.speedSegments, project.trimStartTime, project.trimEndTime]);

  // Dynamic Audio Ducking and Fade Control for Audio Playback
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || project.audioTracks.length === 0 || !project.isPlaying) return;

    const track = project.audioTracks[0];
    let animId: number;

    const syncAudioVolume = () => {
      if (audio && !audio.paused) {
        const duckMult = track.duckingEnabled
          ? computeAudioDucking(project.currentSeconds, project)
          : 1.0;
        const trackRelativeTime = Math.max(0, project.currentSeconds - (track.startTime || 0));
        const fadeMult = computeAudioFade(trackRelativeTime, track.duration || 10, track.fadeIn, track.fadeOut);
        const targetVol = Math.max(0, Math.min(1, (track.volume ?? 0.8) * duckMult * fadeMult));
        audio.volume = targetVol;
      }
      animId = requestAnimationFrame(syncAudioVolume);
    };

    animId = requestAnimationFrame(syncAudioVolume);
    return () => cancelAnimationFrame(animId);
  }, [project.isPlaying, project.currentSeconds, project.audioTracks, project.subtitles]);

  const togglePlay = () => {
    const video = videoRef.current;
    const audio = audioRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
      if (audio && project.audioTracks.length > 0) audio.play();
      updateProject({ isPlaying: true });
    } else {
      video.pause();
      if (audio) audio.pause();
      updateProject({ isPlaying: false });
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    updateProject({ isMuted: video.muted });
  };

  const seekTimeline = (targetTimelineSeconds: number) => {
    const video = videoRef.current;
    const audio = audioRef.current;
    if (!video) return;

    const speedTimeline = new SpeedTimeline(
      project.trimStartTime,
      project.trimEndTime,
      project.speedSegments
    );

    const sourceTime = speedTimeline.sourceTime(targetTimelineSeconds);
    video.currentTime = sourceTime;
    if (audio) audio.currentTime = targetTimelineSeconds;
    updateProject({ currentSeconds: targetTimelineSeconds });
  };

  const [exportedFilePath, setExportedFilePath] = useState<string | null>(null);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [synthProgress, setSynthProgress] = useState(0);

  const handleSynthesizeMotion = async (presetId: MotionSynthPreset['id']) => {
    if (isSynthesizing || project.isExporting) return;
    setIsSynthesizing(true);
    setSynthProgress(0);
    try {
      const synthUpdate = await generateProceduralMotionProject(presetId, (p) => setSynthProgress(p));
      updateProject(synthUpdate, true);
    } catch (err: any) {
      console.error('Procedural motion synth failed:', err);
      alert(`Motion Synth error: ${err.message || err}`);
    } finally {
      setIsSynthesizing(false);
      setSynthProgress(0);
    }
  };

  useEffect(() => {
    const api = (window as any).electronAPI;
    if (!api?.getCliVideoPath) return;
    api.getCliVideoPath().then((cliPath: string | null) => {
      if (cliPath && typeof cliPath === 'string') {
        const fileName = cliPath.split('/').pop() || 'cli-video.mp4';
        const fileUrl = cliPath.startsWith('file://') ? cliPath : `file://${encodeURI(cliPath)}`;
        updateProject({
          videoURL: fileUrl,
          displayName: fileName,
          isPlaying: false,
          currentSeconds: 0,
        });
      }
    }).catch(() => {});
  }, []);

  const handleRenderNativeMotion = async (presetId: string) => {
    const api = (window as any).electronAPI;
    if (!api?.renderMayaMotionPreset) return;
    setIsSynthesizing(true);
    try {
      const res = await api.renderMayaMotionPreset({ preset: presetId });
      if (res?.success && res?.outDir) {
        setExportedFilePath(res.outDir);
      }
    } catch (err: any) {
      console.error('Native motion engine render failed:', err);
      alert(`Native Motion Engine error: ${err.message || err}`);
    } finally {
      setIsSynthesizing(false);
    }
  };

  const handleExport = async (
    transparent: boolean,
    quality: '1080p' | '1440p' | '4k' = '1080p',
    fps: number = 60,
    aspectOverride?: CanvasAspectRatioType
  ) => {
    const video = videoRef.current;
    const audio = audioRef.current;
    if (!video) return;

    video.pause();
    if (audio) audio.pause();

    const effectiveProject: ProjectState = aspectOverride
      ? { ...project, canvasAspect: aspectOverride }
      : project;

    updateProject({
      ...(aspectOverride ? { canvasAspect: aspectOverride } : {}),
      isExporting: true,
      exportProgress: 0,
      exportType: transparent ? 'transparent' : 'background',
      isPlaying: false,
    });

    try {
      const result = await exportVideo(
        effectiveProject,
        {
          transparent,
          quality,
          fps,
          onProgress: (p) => updateProject({ exportProgress: p }),
        },
        video
      );

      if (result.cancelled) {
        // User cancelled the file save dialog
        return;
      }

      if (result.isNative && result.filePath) {
        setExportedFilePath(result.filePath);
      } else if (result.blob) {
        const ext = transparent ? 'webm' : 'mp4';
        const a = document.createElement('a');
        a.href = URL.createObjectURL(result.blob);
        a.download = `Maya-${project.displayName?.replace(/\.[^/.]+$/, "") || "video"}-${quality}.${ext}`;
        a.click();
      }
    } catch (err: any) {
      console.error('Export failed:', err);
      alert(`Export error: ${err.message || err}`);
    } finally {
      updateProject({
        isExporting: false,
        exportProgress: 0,
        exportType: null,
      });
    }
  };

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || e.key === 'Y')) {
        e.preventDefault();
        redo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        handleSaveProject();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'o' || e.key === 'O')) {
        e.preventDefault();
        handleOpenFile();
      } else if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'm' || e.key === 'M') {
        toggleMute();
      } else if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
        e.preventDefault();
        setIsShortcutsModalOpen(prev => !prev);
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (project.selectedEvent) {
          if (project.selectedEvent.type === 'zoom') {
            updateProject({
              animations: project.animations.filter(a => a.id !== project.selectedEvent?.id),
              selectedEvent: null,
            }, true);
          } else if (project.selectedEvent.type === 'tap') {
            updateProject({
              tapEvents: project.tapEvents.filter(t => t.id !== project.selectedEvent?.id),
              selectedEvent: null,
            }, true);
          } else if (project.selectedEvent.type === 'overlay') {
            updateProject({
              overlays: project.overlays.filter(o => o.id !== project.selectedEvent?.id),
              selectedEvent: null,
            }, true);
          } else if (project.selectedEvent.type === 'audio') {
            updateProject({
              audioTracks: project.audioTracks.filter(a => a.id !== project.selectedEvent?.id),
              selectedEvent: null,
            }, true);
          } else if (project.selectedEvent.type === 'speed') {
            updateProject({
              speedSegments: project.speedSegments.filter(s => s.id !== project.selectedEvent?.id),
              selectedEvent: null,
            }, true);
          } else if (project.selectedEvent.type === 'sticker') {
            updateProject({
              stickers: (project.stickers || []).filter(s => s.id !== project.selectedEvent?.id),
              selectedEvent: null,
            }, true);
          } else if (project.selectedEvent.type === 'transition') {
            updateProject({
              transitions: (project.transitions || []).filter(t => t.id !== project.selectedEvent?.id),
              selectedEvent: null,
            }, true);
          } else if (project.selectedEvent.type === 'typewriter') {
            updateProject({
              typewriters: (project.typewriters || []).filter(tw => tw.id !== project.selectedEvent?.id),
              selectedEvent: null,
            }, true);
          } else if (project.selectedEvent.type === 'imageOverlay') {
            updateProject({
              imageOverlays: (project.imageOverlays || []).filter(im => im.id !== project.selectedEvent?.id),
              selectedEvent: null,
            }, true);
          } else if (project.selectedEvent.type === 'subtitle') {
            updateProject({
              subtitles: (project.subtitles || []).filter(sb => sb.id !== project.selectedEvent?.id),
              selectedEvent: null,
            }, true);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [project]);

  // Audio track playback sync
  const activeAudio = project.audioTracks?.[0];

  useEffect(() => {
    if (audioRef.current && activeAudio) {
      audioRef.current.volume = activeAudio.volume;
    }
  }, [activeAudio?.volume, activeAudio?.url]);

  return (
    <div className="w-screen h-screen flex flex-col bg-dark-950 text-slate-100 overflow-hidden font-sans">
      {/* Hidden File Input & Video / Audio Elements */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelected}
        accept="video/mp4,video/quicktime,video/webm"
        className="hidden"
      />
      {project.videoURL && (
        <video
          ref={videoRef}
          src={project.videoURL}
          onLoadedMetadata={onLoadedMetadata}
          onTimeUpdate={onTimeUpdate}
          playsInline
          muted={project.isMuted}
          className="hidden"
        />
      )}
      {activeAudio && (
        <audio
          ref={audioRef}
          src={activeAudio.url}
          className="hidden"
        />
      )}

      {/* Export Progress Modal */}
      {project.isExporting && (
        <div className="absolute inset-0 bg-dark-950/90 backdrop-blur-md z-50 flex items-center justify-center p-6">
          <div className="w-96 p-6 rounded-3xl bg-dark-900 border border-slate-800 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-brand-500/20 text-brand-400 mx-auto flex items-center justify-center animate-pulse">
              <span className="font-bold text-lg">{Math.round(project.exportProgress * 100)}%</span>
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-slate-100">Rendering Video...</h3>
              <p className="text-xs text-slate-400">
                Compositing frames, 3D angles, audio, zooms, and tap animations at full resolution
              </p>
            </div>
            <div className="w-full bg-dark-950 rounded-full h-2 overflow-hidden border border-slate-800">
              <div
                className="bg-brand-500 h-full transition-all duration-100"
                style={{ width: `${project.exportProgress * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Export Success Modal */}
      {exportedFilePath && (
        <div className="absolute inset-0 bg-dark-950/80 backdrop-blur-md z-50 flex items-center justify-center p-6">
          <div className="w-[420px] p-6 rounded-3xl bg-dark-900 border border-emerald-500/40 shadow-2xl space-y-4 text-center animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
              <span className="text-2xl">🎉</span>
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-white text-base">Video Export Complete!</h3>
              <p className="text-xs text-slate-300 font-mono break-all bg-dark-950 p-2.5 rounded-xl border border-slate-800">
                {exportedFilePath}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => {
                  (window as any).electronAPI?.showItemInFolder?.(exportedFilePath);
                }}
                className="py-2.5 px-3 rounded-xl bg-dark-950 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 transition"
              >
                Show in Folder
              </button>
              <button
                onClick={() => setExportedFilePath(null)}
                className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition shadow-lg shadow-emerald-600/30"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <TemplatesModal
        isOpen={isTemplatesModalOpen}
        onClose={() => setIsTemplatesModalOpen(false)}
        project={project}
        onApply={updateProject}
      />

      <TTSModal
        isOpen={isTTSModalOpen}
        onClose={() => setIsTTSModalOpen(false)}
        project={project}
        onAddVoiceAndCaptions={({ audioTrack, subtitles }) => {
          updateProject({
            audioTracks: audioTrack ? [...(project.audioTracks || []), audioTrack] : project.audioTracks,
            subtitles: [...(project.subtitles || []), ...subtitles],
            selectedEvent: audioTrack ? { type: 'audio', id: audioTrack.id } : null,
          }, true);
        }}
      />

      <StickerPickerModal
        isOpen={isStickerModalOpen}
        onClose={() => setIsStickerModalOpen(false)}
        project={project}
        onAddSticker={(sticker: StickerItem) => {
          updateProject({
            stickers: [...(project.stickers || []), sticker],
            selectedEvent: { type: 'sticker', id: sticker.id },
          }, true);
        }}
      />

      <KeyboardShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
      />

      <CursorModal
        isOpen={isCursorModalOpen}
        onClose={() => setIsCursorModalOpen(false)}
        project={project}
        onUpdateCursor={(cursor) => updateProject({ cursor }, true)}
      />

      <LowerThirdsModal
        isOpen={isLowerThirdsModalOpen}
        onClose={() => setIsLowerThirdsModalOpen(false)}
        project={project}
        onAddOverlay={(overlay: TextOverlay) => {
          updateProject({
            overlays: [...(project.overlays || []), overlay],
            selectedEvent: { type: 'overlay', id: overlay.id },
          }, true);
        }}
      />

      <SFXLibraryModal
        isOpen={isSFXModalOpen}
        onClose={() => setIsSFXModalOpen(false)}
        project={project}
        onAddAudioTrack={(track: AudioTrack) => {
          updateProject({
            audioTracks: [...(project.audioTracks || []), track],
            selectedEvent: { type: 'audio', id: track.id },
          }, true);
        }}
      />

      <MetaEditsModal
        isOpen={isMetaEditsModalOpen}
        onClose={() => setIsMetaEditsModalOpen(false)}
        project={project}
        onUpdateMetaEdits={(metaEdits: MetaEditsConfig) => {
          updateProject({ metaEdits }, true);
        }}
      />

      <TransitionsModal
        isOpen={isTransitionsModalOpen}
        onClose={() => setIsTransitionsModalOpen(false)}
        project={project}
        onAddTransition={(transition: TransitionItem) => {
          updateProject({
            transitions: [...(project.transitions || []), transition],
            selectedEvent: { type: 'transition', id: transition.id },
          }, true);
        }}
      />

      <TypewriterModal
        isOpen={isTypewriterModalOpen}
        onClose={() => setIsTypewriterModalOpen(false)}
        currentTime={project.currentSeconds || 0}
        onAddTypewriter={(typewriter: TypewriterOverlayItem) => {
          updateProject({
            typewriters: [...(project.typewriters || []), typewriter],
            selectedEvent: { type: 'typewriter', id: typewriter.id },
          }, true);
        }}
      />

      <BrandAssetsModal
        isOpen={isBrandAssetsModalOpen}
        onClose={() => setIsBrandAssetsModalOpen(false)}
        currentTime={project.currentSeconds || 0}
        onAddImageOverlay={(asset: ImageOverlayItem) => {
          updateProject({
            imageOverlays: [...(project.imageOverlays || []), asset],
            selectedEvent: { type: 'imageOverlay', id: asset.id },
          }, true);
        }}
      />

      {/* Main App Layout */}
      <Header
        project={project}
        theme={theme}
        onToggleTheme={toggleTheme}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        onOpenFile={handleOpenFile}
        onSaveProject={handleSaveProject}
        onLoadProject={handleLoadProject}
        onExport={handleExport}
        onSynthesizeMotion={handleSynthesizeMotion}
        onRenderNativeMotion={
          typeof window !== 'undefined' && (window as any).electronAPI?.renderMayaMotionPreset
            ? handleRenderNativeMotion
            : undefined
        }
        isSynthesizing={isSynthesizing}
        onOpenTemplates={() => setIsTemplatesModalOpen(true)}
        onOpenTTS={() => setIsTTSModalOpen(true)}
        onOpenLowerThirds={() => setIsLowerThirdsModalOpen(true)}
        onOpenCursor={() => setIsCursorModalOpen(true)}
        onOpenSFX={() => setIsSFXModalOpen(true)}
        onOpenMetaEdits={() => setIsMetaEditsModalOpen(true)}
        onOpenTransitions={() => setIsTransitionsModalOpen(true)}
        onOpenTypewriter={() => setIsTypewriterModalOpen(true)}
        onOpenBrandAssets={() => setIsBrandAssetsModalOpen(true)}
        onOpenShortcuts={() => setIsShortcutsModalOpen(true)}
        onUndo={undo}
        onRedo={redo}
        canUndo={historyRef.current.length > 0}
        canRedo={futureRef.current.length > 0}
      />

      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        {/* Desktop Persistent Sidebar (>= lg) */}
        <div className="hidden lg:flex shrink-0 h-full">
          <SettingsSidebar
            project={project}
            onChange={updateProject}
          />
        </div>

        {/* Mobile / Tablet Collapsible Settings Drawer (< lg) */}
        {isSidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 z-50 flex"
            onClick={() => setIsSidebarOpen(false)}
          >
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
            <div
              className="relative w-80 max-w-[88vw] h-full z-50 shadow-2xl flex"
              onClick={(e) => e.stopPropagation()}
            >
              <SettingsSidebar
                project={project}
                onChange={updateProject}
                onClose={() => setIsSidebarOpen(false)}
              />
            </div>
          </div>
        )}

        <CanvasPreview
          project={project}
          videoRef={videoRef}
          onOffsetChange={(offset) => updateProject({ offset })}
          onOpenFile={handleOpenFile}
          onFileSelect={loadVideoFile}
          onChange={updateProject}
          onSynthesizeMotion={handleSynthesizeMotion}
          isSynthesizing={isSynthesizing}
          synthProgress={synthProgress}
        />

        <InspectorPanel
          project={project}
          onChange={updateProject}
        />
      </div>

      <Timeline
        project={project}
        videoRef={videoRef}
        audioRef={audioRef}
        onSeek={seekTimeline}
        onTogglePlay={togglePlay}
        onToggleMute={toggleMute}
        onChange={updateProject}
        onOpenStickerPicker={() => setIsStickerModalOpen(true)}
        onOpenLowerThirds={() => setIsLowerThirdsModalOpen(true)}
        onOpenSFXLibrary={() => setIsSFXModalOpen(true)}
        onOpenTransitions={() => setIsTransitionsModalOpen(true)}
        onOpenTypewriter={() => setIsTypewriterModalOpen(true)}
        onOpenBrandAssets={() => setIsBrandAssetsModalOpen(true)}
      />

      {/* Canonical Attribution & Open-Access Support Bar */}
      <footer className="shrink-0 border-t border-slate-800/80 bg-dark-900/95 px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-300 z-30">
        <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 min-w-0">
          <span className="truncate">
            Engineered by{' '}
            <a
              href="https://github.com/1nc0gn30/maya-linux"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-amber-300 hover:underline"
            >
              Neal Frazier Tech (@1nc0gn30)
            </a>
            {' • '}
            <a
              href="https://nullai.tech"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-brand-300 hover:underline"
            >
              NullAI Platform
            </a>
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <a
            href="https://buy.stripe.com/3cIfZg27PdKo2D64Ocfw40X"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-2.5 py-1 rounded-md bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/35 font-semibold whitespace-nowrap transition"
          >
            ☕ Buy Us a Coffee
          </a>
          <a
            href="solana:GG2eQbVh8ut1BK6j1A2tz7pSySdLpD38BgyEhGcxdXoK"
            onClick={(e) => {
              if (navigator.clipboard) {
                e.preventDefault();
                navigator.clipboard.writeText('GG2eQbVh8ut1BK6j1A2tz7pSySdLpD38BgyEhGcxdXoK').catch(() => {});
                setCopiedSolana(true);
                setTimeout(() => setCopiedSolana(false), 2000);
              }
            }}
            title="Solana Tip Address: GG2eQbVh8ut1BK6j1A2tz7pSySdLpD38BgyEhGcxdXoK"
            className="hidden sm:inline-flex items-center px-2 py-1 rounded-md bg-dark-950 hover:bg-slate-800 text-slate-300 border border-slate-800 font-mono text-[10px] whitespace-nowrap transition"
          >
            {copiedSolana ? 'SOL Copied!' : 'SOL: GG2e…dXoK'}
          </a>
        </div>
      </footer>
    </div>
  );
};
export default App;
