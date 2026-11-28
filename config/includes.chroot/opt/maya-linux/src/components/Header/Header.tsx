import React, { useRef, useState, useEffect } from 'react';
import {
  Download,
  Sparkles,
  FolderOpen,
  Video,
  Save,
  FileUp,
  Layers,
  Undo2,
  Redo2,
  MousePointer,
  Tv,
  HelpCircle,
  ChevronDown,
  Volume2,
  RotateCw,
  Type,
  Crown,
  Menu,
  X,
  Zap,
  Sun,
  Moon,
  SlidersHorizontal,
  Wand2,
} from 'lucide-react';
import { ProjectState } from '../../types/project';
import { CanvasAspectRatioType } from '../../types/models';
import { generateCapCutDraft } from '../../services/capcutExportService';
import { SYNTH_PRESETS, MotionSynthPreset } from '../../services/proceduralMotionSynth';

interface HeaderProps {
  project: ProjectState;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  onOpenFile: () => void;
  onSaveProject: () => void;
  onLoadProject: (projectData: any) => void;
  onExport: (
    transparent: boolean,
    quality?: '1080p' | '1440p' | '4k',
    fps?: number,
    aspectOverride?: CanvasAspectRatioType
  ) => void;
  onSynthesizeMotion?: (presetId: MotionSynthPreset['id']) => void;
  onRenderNativeMotion?: (presetId: string) => void;
  isSynthesizing?: boolean;
  onOpenTemplates?: () => void;
  onOpenTTS?: () => void;
  onOpenLowerThirds?: () => void;
  onOpenCursor?: () => void;
  onOpenSFX?: () => void;
  onOpenMetaEdits?: () => void;
  onOpenTransitions?: () => void;
  onOpenTypewriter?: () => void;
  onOpenBrandAssets?: () => void;
  onOpenShortcuts?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  project,
  theme,
  onToggleTheme,
  isSidebarOpen,
  onToggleSidebar,
  onOpenFile,
  onSaveProject,
  onLoadProject,
  onExport,
  onSynthesizeMotion,
  onRenderNativeMotion,
  isSynthesizing,
  onOpenTemplates,
  onOpenTTS,
  onOpenLowerThirds,
  onOpenCursor,
  onOpenSFX,
  onOpenMetaEdits,
  onOpenTransitions,
  onOpenTypewriter,
  onOpenBrandAssets,
  onOpenShortcuts,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}) => {
  const projectInputRef = useRef<HTMLInputElement>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [activeMenu, setActiveMenu] = useState<'create' | 'vfx' | 'audio' | 'synth' | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = () => {
      setActiveMenu(null);
      setShowExportMenu(false);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
        setActiveMenu(null);
        setShowExportMenu(false);
      }
    };
    window.addEventListener('click', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('click', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleProjectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        onLoadProject(json);
      } catch (_) {
        alert('Invalid .mayaproj file format');
      }
    };
    reader.readAsText(file);
  };

  const handleExportCapCut = async () => {
    try {
      const draft = generateCapCutDraft(project);
      if ((window as any).electronAPI?.exportCapCutDraft) {
        const res = await (window as any).electronAPI.exportCapCutDraft({
          contentJson: draft.contentJson,
          metaJson: draft.metaJson,
          projectName: draft.projectName,
        });
        if (res.success) {
          alert(`CapCut Draft exported:\n${res.folderPath}`);
        }
      } else {
        const blob = new Blob([draft.contentJson], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'draft_content.json';
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err: any) {
      alert(`CapCut export error: ${err.message}`);
    }
  };

  const runAndClose = (fn?: () => void) => {
    setIsMobileMenuOpen(false);
    if (fn) fn();
  };

  return (
    <>
      <header className="min-h-[56px] border-b border-slate-800/90 bg-dark-950/95 backdrop-blur px-2 sm:px-3.5 flex items-center justify-between gap-2 select-none z-40 relative shrink-0">
        <input
          type="file"
          ref={projectInputRef}
          onChange={handleProjectFile}
          accept=".mayaproj,application/json"
          className="hidden"
        />

        {/* Left: Branding & Project Info */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 min-w-0">
          {/* Mobile / Tablet Navigation Drawer Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMobileMenuOpen(!isMobileMenuOpen);
            }}
            className="xl:hidden min-h-[44px] min-w-[44px] lg:min-h-[34px] lg:min-w-[34px] flex items-center justify-center rounded-lg bg-dark-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition active:scale-95"
            title="Open Studio Menu"
            aria-label="Open Studio Menu"
          >
            <Menu className="w-4 h-4 text-brand-400" />
          </button>

          {/* Mobile / Tablet Collapsible Settings Sidebar Button (< lg) */}
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className={`lg:hidden min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg border transition active:scale-95 ${
                isSidebarOpen
                  ? 'bg-brand-600 text-white border-brand-500 maya-solid-btn'
                  : 'bg-dark-900 hover:bg-slate-800 text-slate-300 border-slate-800'
              }`}
              title="Toggle Device & Frame Settings"
              aria-label="Toggle Device and Frame Settings"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          )}

          <div className="hidden sm:flex w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-500 to-cyan-400 p-[1px] shadow-lg shadow-brand-500/20 shrink-0">
            <div className="w-full h-full rounded-[11px] bg-dark-950 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-brand-400" />
            </div>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="font-bold text-sm tracking-tight text-white leading-none whitespace-nowrap">
                Maya
              </h1>
              <span className="hidden sm:inline-block text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-400 border border-brand-500/20 whitespace-nowrap">
                Pro v2.0
              </span>
            </div>
            <p
              className="hidden sm:block text-[11px] text-slate-400 font-mono truncate max-w-[110px] md:max-w-[140px]"
              title={project.displayName || 'No video selected'}
            >
              {project.displayName || 'No video selected'}
            </p>
          </div>

          {/* Undo / Redo (Desktop & Tablet >= md) */}
          <div className="hidden md:flex items-center gap-1 pl-2 border-l border-slate-800/80">
            <button
              onClick={onUndo}
              disabled={!canUndo}
              title="Undo (Ctrl+Z)"
              aria-label="Undo"
              className="min-h-[44px] min-w-[44px] lg:min-h-[32px] lg:min-w-[32px] flex items-center justify-center rounded-lg text-slate-300 hover:text-white hover:bg-dark-900 disabled:opacity-40 disabled:pointer-events-none transition"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              onClick={onRedo}
              disabled={!canRedo}
              title="Redo (Ctrl+Shift+Z / Ctrl+Y)"
              aria-label="Redo"
              className="min-h-[44px] min-w-[44px] lg:min-h-[32px] lg:min-w-[32px] flex items-center justify-center rounded-lg text-slate-300 hover:text-white hover:bg-dark-900 disabled:opacity-40 disabled:pointer-events-none transition"
            >
              <Redo2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Center: Compact Single-Row Studio Tools (>= xl, zero overflow at 1280px & 1440px) */}
        <div className="hidden xl:flex items-center gap-1.5 shrink-0">
          {/* Templates */}
          <button
            onClick={onOpenTemplates}
            title="Browse 1-Click Pro Studio Templates"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-xs font-semibold text-indigo-300 border border-indigo-500/30 transition shadow-sm active:scale-95 whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>Templates</span>
          </button>

          {/* Create (Typewriter, Zoth Brand, Cursor) */}
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setActiveMenu(activeMenu === 'create' ? null : 'create')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition shadow-sm active:scale-95 whitespace-nowrap ${
                activeMenu === 'create'
                  ? 'bg-cyan-600 text-white border-cyan-400 maya-solid-btn'
                  : 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
              }`}
            >
              <Wand2 className="w-3.5 h-3.5 shrink-0" />
              <span>Create</span>
              <ChevronDown className="w-3 h-3 shrink-0" />
            </button>

            {activeMenu === 'create' && (
              <div className="absolute top-full left-0 mt-1.5 w-60 rounded-xl bg-dark-900 border border-slate-800 shadow-2xl p-1.5 space-y-1 z-50">
                <button
                  onClick={() => { setActiveMenu(null); onOpenTypewriter?.(); }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 text-xs text-slate-200 hover:text-white flex items-center gap-2 transition"
                >
                  <Type className="w-4 h-4 text-cyan-400 shrink-0" />
                  <div>
                    <div className="font-semibold">Typewriter Headings</div>
                    <div className="text-[10px] text-slate-400">Animated stroke-typed captions</div>
                  </div>
                </button>
                <button
                  onClick={() => { setActiveMenu(null); onOpenBrandAssets?.(); }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 text-xs text-slate-200 hover:text-white flex items-center gap-2 transition"
                >
                  <Crown className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <div className="font-semibold">Zoth Brand Assets</div>
                    <div className="text-[10px] text-slate-400">Navbar logos &amp; sovereign seals</div>
                  </div>
                </button>
                <button
                  onClick={() => { setActiveMenu(null); onOpenCursor?.(); }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 text-xs text-slate-200 hover:text-white flex items-center gap-2 transition"
                >
                  <MousePointer className="w-4 h-4 text-brand-400 shrink-0" />
                  <div>
                    <div className="font-semibold">Cursor Studio</div>
                    <div className="text-[10px] text-slate-400">Spline cursor paths &amp; click ripples</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Overlays & VFX Menu */}
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setActiveMenu(activeMenu === 'vfx' ? null : 'vfx')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition shadow-sm active:scale-95 whitespace-nowrap ${
                activeMenu === 'vfx'
                  ? 'bg-purple-600 text-white border-purple-400 maya-solid-btn'
                  : 'bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border-purple-500/30'
              }`}
            >
              <RotateCw className="w-3.5 h-3.5 shrink-0" />
              <span>VFX</span>
              <ChevronDown className="w-3 h-3 shrink-0" />
            </button>

            {activeMenu === 'vfx' && (
              <div className="absolute top-full left-0 mt-1.5 w-56 rounded-xl bg-dark-900 border border-slate-800 shadow-2xl p-1.5 space-y-1 z-50">
                <button
                  onClick={() => { setActiveMenu(null); onOpenLowerThirds?.(); }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 text-xs text-slate-200 hover:text-white flex items-center gap-2 transition"
                >
                  <Tv className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <div className="font-semibold">Lower Thirds</div>
                    <div className="text-[10px] text-slate-400">Broadcast title cards &amp; banners</div>
                  </div>
                </button>
                <button
                  onClick={() => { setActiveMenu(null); onOpenTransitions?.(); }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 text-xs text-slate-200 hover:text-white flex items-center gap-2 transition"
                >
                  <RotateCw className="w-4 h-4 text-purple-400 shrink-0" />
                  <div>
                    <div className="font-semibold">Cinema Transitions</div>
                    <div className="text-[10px] text-slate-400">Whip pan, crash zoom &amp; glitches</div>
                  </div>
                </button>
                <button
                  onClick={() => { setActiveMenu(null); onOpenMetaEdits?.(); }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 text-xs text-slate-200 hover:text-white flex items-center gap-2 transition"
                >
                  <Sparkles className="w-4 h-4 text-rose-400 shrink-0" />
                  <div>
                    <div className="font-semibold">Meta AI Effects</div>
                    <div className="text-[10px] text-slate-400">Scribbles, outlines &amp; glitter</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Audio & Voice Menu */}
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setActiveMenu(activeMenu === 'audio' ? null : 'audio')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition shadow-sm active:scale-95 whitespace-nowrap ${
                activeMenu === 'audio'
                  ? 'bg-pink-600 text-white border-pink-400 maya-solid-btn'
                  : 'bg-pink-500/10 hover:bg-pink-500/20 text-pink-300 border-pink-500/30'
              }`}
            >
              <Volume2 className="w-3.5 h-3.5 shrink-0" />
              <span>Audio</span>
              <ChevronDown className="w-3 h-3 shrink-0" />
            </button>

            {activeMenu === 'audio' && (
              <div className="absolute top-full left-0 mt-1.5 w-56 rounded-xl bg-dark-900 border border-slate-800 shadow-2xl p-1.5 space-y-1 z-50">
                <button
                  onClick={() => { setActiveMenu(null); onOpenTTS?.(); }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 text-xs text-slate-200 hover:text-white flex items-center gap-2 transition"
                >
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <div className="font-semibold">Voice &amp; Captions</div>
                    <div className="text-[10px] text-slate-400">Offline espeak-ng &amp; cloud TTS</div>
                  </div>
                </button>
                <button
                  onClick={() => { setActiveMenu(null); onOpenSFX?.(); }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 text-xs text-slate-200 hover:text-white flex items-center gap-2 transition"
                >
                  <Volume2 className="w-4 h-4 text-pink-400 shrink-0" />
                  <div>
                    <div className="font-semibold">SFX Soundboard</div>
                    <div className="text-[10px] text-slate-400">Whooshes, clicks, bells &amp; risers</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Procedural 60fps Motion Synth Menu */}
          {onSynthesizeMotion && (
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button
                disabled={isSynthesizing || project.isExporting}
                onClick={() => setActiveMenu(activeMenu === 'synth' ? null : 'synth')}
                title="Synthesize 60fps Procedural Motion Video (Zero Still Images)"
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition shadow-sm active:scale-95 disabled:opacity-40 whitespace-nowrap ${
                  activeMenu === 'synth'
                    ? 'bg-amber-600 text-white border-amber-400 maya-solid-btn'
                    : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/40'
                }`}
              >
                <Zap className="w-3.5 h-3.5 shrink-0" />
                <span>Synth</span>
                <ChevronDown className="w-3 h-3 shrink-0" />
              </button>

              {activeMenu === 'synth' && (
                <div className="absolute top-full right-0 mt-1.5 w-72 rounded-xl bg-dark-900 border border-amber-500/30 shadow-2xl p-1.5 space-y-1 z-50">
                  <div className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-amber-400 border-b border-slate-800/80">
                    60 FPS Procedural Synth (Zero Still Images)
                  </div>
                  {SYNTH_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => {
                        setActiveMenu(null);
                        onSynthesizeMotion(preset.id);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 text-xs text-slate-200 hover:text-white flex items-center justify-between transition"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="font-semibold truncate">{preset.title}</div>
                        <div className="text-[10px] text-slate-400 truncate">{preset.subtitle}</div>
                      </div>
                      <span className="shrink-0 text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/20">
                        {preset.badge}
                      </span>
                    </button>
                  ))}
                  {onRenderNativeMotion && (
                    <div className="pt-1 border-t border-slate-800/80">
                      <button
                        onClick={() => {
                          setActiveMenu(null);
                          onRenderNativeMotion('zoth-sovereign-core');
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 text-xs text-amber-300 font-semibold flex items-center justify-between transition"
                      >
                        <span>Render Native Python 60 FPS MP4</span>
                        <span className="text-[9px] font-mono">CLI</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Help Shortcuts */}
          <button
            onClick={onOpenShortcuts}
            title="Keyboard Shortcuts Cheat Sheet (?)"
            aria-label="Keyboard Shortcuts"
            className="p-1.5 rounded-lg bg-dark-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition shrink-0"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Theme Toggle, File Ops & Export */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Persistent Light / Dark Theme Toggle */}
          <button
            onClick={onToggleTheme}
            title={theme === 'dark' ? 'Switch to Editorial Ivory Light Mode' : 'Switch to Obsidian Dark Mode'}
            aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            data-theme-toggle="true"
            className="min-h-[44px] min-w-[44px] lg:min-h-[32px] lg:min-w-[32px] px-2 flex items-center justify-center gap-1 rounded-lg bg-dark-900 hover:bg-slate-800 text-amber-300 border border-slate-800 transition active:scale-95 whitespace-nowrap"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            <span className="hidden 2xl:inline text-xs font-medium text-slate-200">
              {theme === 'dark' ? 'Light' : 'Dark'}
            </span>
          </button>

          <button
            onClick={onOpenFile}
            className="min-h-[44px] lg:min-h-[32px] flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700/90 text-xs font-medium text-slate-200 border border-slate-700/60 transition shadow-sm active:scale-95 whitespace-nowrap"
          >
            <FolderOpen className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="hidden sm:inline">Open</span>
            <span className="sm:hidden">Open</span>
          </button>

          <button
            onClick={onSaveProject}
            title="Save project (.mayaproj)"
            className="hidden md:flex min-h-[44px] lg:min-h-[32px] items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-dark-900 hover:bg-slate-800 text-xs font-medium text-slate-300 border border-slate-800 hover:border-slate-700 transition active:scale-95 whitespace-nowrap"
          >
            <Save className="w-3.5 h-3.5 text-brand-400 shrink-0" />
            <span>Save</span>
          </button>

          <button
            onClick={() => projectInputRef.current?.click()}
            title="Load saved project (.mayaproj)"
            className="hidden md:flex min-h-[44px] lg:min-h-[32px] items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-dark-900 hover:bg-slate-800 text-xs font-medium text-slate-300 border border-slate-800 hover:border-slate-700 transition active:scale-95 whitespace-nowrap"
          >
            <FileUp className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Load</span>
          </button>

          <button
            disabled={!project.videoURL || project.isExporting}
            onClick={handleExportCapCut}
            title="Export as standard CapCut/JianYing draft folder"
            className="hidden lg:flex min-h-[32px] items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-xs font-medium text-rose-300 border border-rose-500/30 transition shadow-sm active:scale-95 disabled:opacity-50 whitespace-nowrap"
          >
            <Layers className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span>CapCut</span>
          </button>

          {/* 4K/1080p Export Hub */}
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center rounded-lg bg-brand-600 shadow-lg shadow-brand-600/30 maya-solid-btn">
              <button
                disabled={!project.videoURL || project.isExporting}
                onClick={() => onExport(false, '1080p', 30)}
                className="min-h-[44px] lg:min-h-[32px] flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-500 rounded-l-lg transition active:scale-95 disabled:opacity-60 whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">Export 1080p</span>
                <span className="sm:hidden">Export</span>
              </button>
              <button
                disabled={!project.videoURL || project.isExporting}
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="min-h-[44px] min-w-[36px] lg:min-h-[32px] lg:min-w-[26px] px-1.5 py-1.5 border-l border-brand-500/50 hover:bg-brand-500 rounded-r-lg text-white transition flex items-center justify-center disabled:opacity-60"
                aria-label="Export Quality Options"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>

            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl bg-dark-900 border border-slate-800 shadow-2xl p-1.5 space-y-1 z-50">
                <button
                  onClick={() => {
                    setShowExportMenu(false);
                    onExport(false, '4k', 60);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 text-xs font-medium text-white flex items-center justify-between transition"
                >
                  <div>
                    <div className="font-semibold">4K Ultra HD Cinema</div>
                    <div className="text-[10px] text-slate-400">3840x2160 @ 60 FPS • Max Bitrate</div>
                  </div>
                  <span className="text-[10px] text-amber-400 font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">4K</span>
                </button>
                <button
                  onClick={() => {
                    setShowExportMenu(false);
                    onExport(false, '1440p', 60);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 text-xs font-medium text-white flex items-center justify-between transition"
                >
                  <div>
                    <div className="font-semibold">2K Quad HD Studio</div>
                    <div className="text-[10px] text-slate-400">2560x1440 @ 60 FPS • YouTube &amp; Web</div>
                  </div>
                  <span className="text-[10px] text-brand-400 font-mono font-bold px-1.5 py-0.5 rounded bg-brand-500/10 border border-brand-500/20">2K</span>
                </button>
                <button
                  onClick={() => {
                    setShowExportMenu(false);
                    onExport(false, '1080p', 60);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 text-xs font-medium text-white flex items-center justify-between transition"
                >
                  <div>
                    <div className="font-semibold">1080p Pro 60 FPS</div>
                    <div className="text-[10px] text-slate-400">1920x1080 @ 60 FPS • Smooth Motion</div>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">60fps</span>
                </button>
                <button
                  onClick={() => {
                    setShowExportMenu(false);
                    onExport(false, '1080p', 30);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 text-xs font-medium text-white flex items-center justify-between transition"
                >
                  <div>
                    <div className="font-semibold">1080p Standard Web</div>
                    <div className="text-[10px] text-slate-400">1920x1080 @ 30 FPS • Compact File</div>
                  </div>
                  <span className="text-[10px] text-cyan-400 font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">30fps</span>
                </button>
                <button
                  onClick={() => {
                    setShowExportMenu(false);
                    onExport(false, '1080p', 60, 'vertical9x16');
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 text-xs font-medium text-white flex items-center justify-between transition"
                >
                  <div>
                    <div className="font-semibold">Reels / Shorts Vertical 9:16</div>
                    <div className="text-[10px] text-slate-400">1080x1920 @ 60 FPS • TikTok &amp; Reels</div>
                  </div>
                  <span className="text-[10px] text-pink-400 font-mono font-bold px-1.5 py-0.5 rounded bg-pink-500/10 border border-pink-500/20">9:16</span>
                </button>
                <div className="h-[1px] bg-slate-800 my-1" />
                <button
                  onClick={() => {
                    setShowExportMenu(false);
                    onExport(true, '1080p', 30);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 text-xs font-medium text-slate-300 flex items-center justify-between transition"
                >
                  <div className="flex items-center gap-2">
                    <Video className="w-4 h-4 text-brand-400 shrink-0" />
                    <div>
                      <div className="font-semibold">Transparent Alpha</div>
                      <div className="text-[10px] text-slate-400">WebM with Alpha Channel</div>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">Alpha</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Responsive Hamburger Slide-out Drawer / Menu for Mobile & Tablet */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 flex"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />

          <div
            className="relative w-80 max-w-[85vw] h-full bg-dark-950 border-r border-slate-800/90 shadow-2xl flex flex-col z-50 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-800/80 flex items-center justify-between bg-dark-900/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-500 to-cyan-400 p-[1px] shadow-lg shadow-brand-500/20">
                  <div className="w-full h-full rounded-[11px] bg-dark-950 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-brand-400" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-white">Maya</span>
                    <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-400 border border-brand-500/20">
                      Studio Pro
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">Studio Navigation</span>
                </div>
              </div>

              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition"
                aria-label="Close Menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body Scroll */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
              {/* Quick Actions */}
              <div className="bg-dark-900/60 rounded-xl p-2.5 border border-slate-800/60 space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">Quick Actions</div>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => runAndClose(onOpenFile)}
                    className="min-h-[44px] flex items-center gap-2 px-2.5 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-white font-medium transition"
                  >
                    <FolderOpen className="w-4 h-4 text-slate-300 shrink-0" />
                    <span>Open Video</span>
                  </button>
                  <button
                    onClick={() => runAndClose(onSaveProject)}
                    className="min-h-[44px] flex items-center gap-2 px-2.5 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-white font-medium transition"
                  >
                    <Save className="w-4 h-4 text-brand-400 shrink-0" />
                    <span>Save Proj</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      projectInputRef.current?.click();
                    }}
                    className="min-h-[44px] flex items-center gap-2 px-2.5 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-white font-medium transition"
                  >
                    <FileUp className="w-4 h-4 text-slate-300 shrink-0" />
                    <span>Load Proj</span>
                  </button>
                  <button
                    disabled={!project.videoURL || project.isExporting}
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleExportCapCut();
                    }}
                    className="min-h-[44px] flex items-center gap-2 px-2.5 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 font-medium transition disabled:opacity-40"
                  >
                    <Layers className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>CapCut Draft</span>
                  </button>
                </div>
              </div>

              {/* Creative Studios */}
              <div className="space-y-1.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">Creative Studios</div>

                <button
                  onClick={() => runAndClose(onOpenTemplates)}
                  className="w-full min-h-[44px] flex items-center gap-3 px-3 py-2.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-300 text-left transition"
                >
                  <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
                  <div>
                    <div className="font-semibold text-white">Templates</div>
                    <div className="text-[10px] text-slate-400">1-Click Pro Studio presets &amp; device mocks</div>
                  </div>
                </button>

                <button
                  onClick={() => runAndClose(onOpenTypewriter)}
                  className="w-full min-h-[44px] flex items-center gap-3 px-3 py-2.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-300 text-left transition"
                >
                  <Type className="w-4 h-4 text-cyan-400 shrink-0" />
                  <div>
                    <div className="font-semibold text-white">Typewriter Text</div>
                    <div className="text-[10px] text-slate-400">Animated explainer text &amp; stroke fonts</div>
                  </div>
                </button>

                <button
                  onClick={() => runAndClose(onOpenBrandAssets)}
                  className="w-full min-h-[44px] flex items-center gap-3 px-3 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-300 text-left transition"
                >
                  <Crown className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <div className="font-semibold text-white">Zoth Brand Assets</div>
                    <div className="text-[10px] text-slate-400">Seals, tokens &amp; brand watermarks</div>
                  </div>
                </button>

                <button
                  onClick={() => runAndClose(onOpenCursor)}
                  className="w-full min-h-[44px] flex items-center gap-3 px-3 py-2.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-300 text-left transition"
                >
                  <MousePointer className="w-4 h-4 text-cyan-400 shrink-0" />
                  <div>
                    <div className="font-semibold text-white">Cursor Studio</div>
                    <div className="text-[10px] text-slate-400">Screen mouse tracking &amp; smooth pathing</div>
                  </div>
                </button>

                {onSynthesizeMotion && (
                  <div className="pt-1 space-y-1.5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400 px-1">
                      Zoth &amp; 1nc0gn30 60fps Motion Synth
                    </div>
                    {SYNTH_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        disabled={isSynthesizing || project.isExporting}
                        onClick={() => runAndClose(() => onSynthesizeMotion(preset.id))}
                        className="w-full min-h-[44px] flex items-center justify-between px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-left transition disabled:opacity-40"
                      >
                        <div className="min-w-0 pr-2">
                          <div className="font-semibold text-amber-200 truncate">{preset.title}</div>
                          <div className="text-[10px] text-slate-400 truncate">{preset.badge}</div>
                        </div>
                        <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Overlays & VFX */}
              <div className="space-y-1.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">Overlays &amp; VFX</div>

                <button
                  onClick={() => runAndClose(onOpenLowerThirds)}
                  className="w-full min-h-[44px] flex items-center gap-3 px-3 py-2 rounded-xl bg-dark-900/80 hover:bg-dark-850 border border-slate-800/80 text-slate-200 text-left transition"
                >
                  <Tv className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <div className="font-semibold text-white">Lower Thirds</div>
                    <div className="text-[10px] text-slate-400">Broadcast title cards &amp; speaker tags</div>
                  </div>
                </button>

                <button
                  onClick={() => runAndClose(onOpenTransitions)}
                  className="w-full min-h-[44px] flex items-center gap-3 px-3 py-2 rounded-xl bg-dark-900/80 hover:bg-dark-850 border border-slate-800/80 text-slate-200 text-left transition"
                >
                  <RotateCw className="w-4 h-4 text-purple-400 shrink-0" />
                  <div>
                    <div className="font-semibold text-white">Cinema Transitions</div>
                    <div className="text-[10px] text-slate-400">Whip pans, crash zooms &amp; glitches</div>
                  </div>
                </button>

                <button
                  onClick={() => runAndClose(onOpenMetaEdits)}
                  className="w-full min-h-[44px] flex items-center gap-3 px-3 py-2 rounded-xl bg-dark-900/80 hover:bg-dark-850 border border-slate-800/80 text-slate-200 text-left transition"
                >
                  <Sparkles className="w-4 h-4 text-rose-400 shrink-0" />
                  <div>
                    <div className="font-semibold text-white">Meta AI Effects</div>
                    <div className="text-[10px] text-slate-400">Scribbles, outlines &amp; glitter effects</div>
                  </div>
                </button>
              </div>

              {/* Audio & Voice */}
              <div className="space-y-1.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">Audio &amp; Voice</div>

                <button
                  onClick={() => runAndClose(onOpenTTS)}
                  className="w-full min-h-[44px] flex items-center gap-3 px-3 py-2 rounded-xl bg-dark-900/80 hover:bg-dark-850 border border-slate-800/80 text-slate-200 text-left transition"
                >
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <div className="font-semibold text-white">Voice &amp; TTS Captions</div>
                    <div className="text-[10px] text-slate-400">Local offline espeak-ng &amp; cloud voices</div>
                  </div>
                </button>

                <button
                  onClick={() => runAndClose(onOpenSFX)}
                  className="w-full min-h-[44px] flex items-center gap-3 px-3 py-2 rounded-xl bg-dark-900/80 hover:bg-dark-850 border border-slate-800/80 text-slate-200 text-left transition"
                >
                  <Volume2 className="w-4 h-4 text-pink-400 shrink-0" />
                  <div>
                    <div className="font-semibold text-white">SFX Soundboard</div>
                    <div className="text-[10px] text-slate-400">Whooshes, clicks, bells &amp; risers</div>
                  </div>
                </button>
              </div>

              {/* Export Direct Presets */}
              <div className="space-y-1.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">Export Presets</div>

                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    disabled={!project.videoURL || project.isExporting}
                    onClick={() => runAndClose(() => onExport(false, '4k', 60))}
                    className="min-h-[44px] p-2 rounded-lg bg-dark-900 hover:bg-dark-850 border border-slate-800 text-left transition disabled:opacity-40"
                  >
                    <div className="font-bold text-amber-400 text-xs">4K Ultra HD</div>
                    <div className="text-[9px] text-slate-400">60 FPS Cinema</div>
                  </button>
                  <button
                    disabled={!project.videoURL || project.isExporting}
                    onClick={() => runAndClose(() => onExport(false, '1440p', 60))}
                    className="min-h-[44px] p-2 rounded-lg bg-dark-900 hover:bg-dark-850 border border-slate-800 text-left transition disabled:opacity-40"
                  >
                    <div className="font-bold text-brand-400 text-xs">2K Quad HD</div>
                    <div className="text-[9px] text-slate-400">60 FPS Studio</div>
                  </button>
                  <button
                    disabled={!project.videoURL || project.isExporting}
                    onClick={() => runAndClose(() => onExport(false, '1080p', 60))}
                    className="min-h-[44px] p-2 rounded-lg bg-dark-900 hover:bg-dark-850 border border-slate-800 text-left transition disabled:opacity-40"
                  >
                    <div className="font-bold text-emerald-400 text-xs">1080p Pro</div>
                    <div className="text-[9px] text-slate-400">60 FPS Smooth</div>
                  </button>
                  <button
                    disabled={!project.videoURL || project.isExporting}
                    onClick={() => runAndClose(() => onExport(false, '1080p', 30))}
                    className="min-h-[44px] p-2 rounded-lg bg-dark-900 hover:bg-dark-850 border border-slate-800 text-left transition disabled:opacity-40"
                  >
                    <div className="font-bold text-cyan-400 text-xs">1080p Web</div>
                    <div className="text-[9px] text-slate-400">30 FPS Standard</div>
                  </button>
                  <button
                    disabled={!project.videoURL || project.isExporting}
                    onClick={() => runAndClose(() => onExport(false, '1080p', 60, 'vertical9x16'))}
                    className="min-h-[44px] p-2 rounded-lg bg-dark-900 hover:bg-dark-850 border border-slate-800 text-left transition disabled:opacity-40"
                  >
                    <div className="font-bold text-pink-400 text-xs">9:16 Shorts</div>
                    <div className="text-[9px] text-slate-400">1080x1920 Vertical</div>
                  </button>
                  <button
                    disabled={!project.videoURL || project.isExporting}
                    onClick={() => runAndClose(() => onExport(true, '1080p', 30))}
                    className="min-h-[44px] p-2 rounded-lg bg-dark-900 hover:bg-dark-850 border border-slate-800 text-left transition disabled:opacity-40"
                  >
                    <div className="font-bold text-slate-300 text-xs">Transparent</div>
                    <div className="text-[9px] text-slate-400">Alpha WebM</div>
                  </button>
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-3 border-t border-slate-800/80 bg-dark-900/60 space-y-2">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => runAndClose(onOpenShortcuts)}
                  className="min-h-[44px] flex items-center gap-2 text-xs text-slate-300 hover:text-white transition"
                >
                  <HelpCircle className="w-4 h-4 text-brand-400" />
                  <span>Keyboard Shortcuts (?)</span>
                </button>
                <span className="text-[10px] text-slate-400 font-mono">v2.0.0</span>
              </div>
              <div className="text-[10px] text-slate-400 flex items-center justify-between">
                <span>Neal Frazier Tech (@1nc0gn30)</span>
                <a
                  href="https://buy.stripe.com/3cIfZg27PdKo2D64Ocfw40X"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-300 font-semibold hover:underline"
                >
                  ☕ Buy Coffee
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
