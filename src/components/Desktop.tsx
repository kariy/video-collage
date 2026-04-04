import { useRef, useState, useEffect, useCallback } from 'react';
import { VideoWindow } from './VideoWindow';
import { CameraWindow } from './CameraWindow';
import { SettingsWindow } from './SettingsWindow';
import { MusicPlayer } from './MusicPlayer';
import { StartMenu } from './StartMenu';
import { Taskbar } from './Taskbar';
import { useWindows } from '../context/WindowsContext';
import { playWindowOpen, playShutdown, playClick } from '../utils/sounds';

type ShutdownPhase = null | 'fadeOut' | 'savingScreen' | 'blank';

export function Desktop() {
  const { windows, activeWindowId, addWindow, arrangeVertically, cameraWindow, openCameraWindow, settingsWindow, openSettingsWindow, musicWindow, openMusicWindow, desktopBackground } = useWindows();
  const [startMenuOpen, setStartMenuOpen] = useState(false);
  const [shutdownPhase, setShutdownPhase] = useState<ShutdownPhase>(null);

  const openWithLoading = useCallback((openFn: () => void) => {
    playClick();
    document.documentElement.classList.add('xp-loading');
    setTimeout(() => {
      openFn();
      playWindowOpen();
      document.documentElement.classList.remove('xp-loading');
    }, 800);
  }, []);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      const url = URL.createObjectURL(file);
      const aspectRatio = await getVideoAspectRatio(url);
      addWindow({
        src: url,
        title: file.name,
        originalAspectRatio: aspectRatio,
      });
    }

    e.target.value = '';
  };

  const getVideoAspectRatio = (url: string): Promise<number> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.src = url;
      video.onloadedmetadata = () => {
        resolve(video.videoWidth / video.videoHeight || 16 / 9);
      };
      video.onerror = () => resolve(16 / 9);
    });
  };

  const handleShutdown = useCallback(() => {
    setStartMenuOpen(false);
    playShutdown();
    setShutdownPhase('fadeOut');
    setTimeout(() => setShutdownPhase('savingScreen'), 800);
    setTimeout(() => setShutdownPhase('blank'), 3500);
  }, []);

  const handleWake = useCallback(() => {
    if (shutdownPhase === 'blank') {
      setShutdownPhase(null);
    }
  }, [shutdownPhase]);

  useEffect(() => {
    if (shutdownPhase !== 'blank') return;
    const handler = (e: KeyboardEvent | MouseEvent) => {
      e.preventDefault();
      handleWake();
    };
    window.addEventListener('keydown', handler);
    window.addEventListener('mousedown', handler);
    return () => {
      window.removeEventListener('keydown', handler);
      window.removeEventListener('mousedown', handler);
    };
  }, [shutdownPhase, handleWake]);

  if (shutdownPhase === 'blank') {
    return <div className="shutdown-blank" />;
  }

  return (
    <div className="xp-desktop" style={
      desktopBackground.startsWith("color:")
        ? { backgroundImage: "none", backgroundColor: desktopBackground.slice(6) }
        : { backgroundImage: `url(${desktopBackground})` }
    }>
      {/* Desktop Icons Area */}
      <div className="desktop-icons">
        <button
          className="desktop-icon"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="desktop-icon-image">📁</div>
          <span>Add Videos</span>
        </button>
        <button
          className="desktop-icon"
          onClick={() => openWithLoading(openCameraWindow)}
        >
          <div className="desktop-icon-image">📷</div>
          <span>Camera</span>
        </button>
        <button
          className="desktop-icon"
          onClick={() => openWithLoading(openMusicWindow)}
        >
          <div className="desktop-icon-image">🎵</div>
          <span>Media Player</span>
        </button>
        <button
          className="desktop-icon"
          onClick={() => openWithLoading(openSettingsWindow)}
        >
          <div className="desktop-icon-image">🖥️</div>
          <span>Settings</span>
        </button>
        {windows.length > 0 && (
          <button className="desktop-icon" onClick={arrangeVertically}>
            <div className="desktop-icon-image">📐</div>
            <span>Arrange</span>
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Windows Container */}
      <div className="windows-container">
        {windows.map((window) => (
          <VideoWindow
            key={window.id}
            window={window}
            isActive={window.id === activeWindowId}
          />
        ))}
        {cameraWindow && (
          <CameraWindow isActive={activeWindowId === "camera"} />
        )}
        {settingsWindow && (
          <SettingsWindow isActive={activeWindowId === "settings"} />
        )}
        {musicWindow && (
          <MusicPlayer isActive={activeWindowId === "music"} />
        )}
      </div>


      {startMenuOpen && (
        <StartMenu
          onClose={() => setStartMenuOpen(false)}
          onShutdown={handleShutdown}
          onOpenApp={openWithLoading}
        />
      )}

      {/* Shutdown overlay */}
      {shutdownPhase === 'fadeOut' && <div className="shutdown-fade" />}
      {shutdownPhase === 'savingScreen' && (
        <div className="shutdown-saving">
          <div className="shutdown-saving-text">Windows is shutting down...</div>
        </div>
      )}

      <Taskbar
        startMenuOpen={startMenuOpen}
        onToggleStartMenu={() => setStartMenuOpen((prev) => !prev)}
      />
    </div>
  );
}
