import { useWindows } from '../context/WindowsContext';
import { playClick, playStartMenu } from '../utils/sounds';

interface TaskbarProps {
  startMenuOpen: boolean;
  onToggleStartMenu: () => void;
}

export function Taskbar({ startMenuOpen, onToggleStartMenu }: TaskbarProps) {
  const { windows, activeWindowId, bringToFront, restoreWindow, cameraWindow, bringCameraToFront, restoreCameraWindow, settingsWindow, bringSettingsToFront, restoreSettingsWindow, musicWindow, bringMusicToFront, restoreMusicWindow } = useWindows();

  const visibleWindows = windows.filter(w => !w.isMinimized);
  const minimizedWindows = windows.filter(w => w.isMinimized);

  return (
    <div className="xp-taskbar">
      <button className={`start-button ${startMenuOpen ? 'pressed' : ''}`} onClick={() => { startMenuOpen ? playClick() : playStartMenu(); onToggleStartMenu(); }}>
        <span className="start-logo">🪟</span>
        <span>Start</span>
      </button>

      <div className="taskbar-items">
        {cameraWindow && !cameraWindow.isMinimized && (
          <button
            className={`taskbar-item ${activeWindowId === 'camera' ? 'active' : ''}`}
            onClick={() => { playClick(); bringCameraToFront(); }}
          >
            📷 Video Capture
          </button>
        )}
        {cameraWindow && cameraWindow.isMinimized && (
          <button
            className="taskbar-item minimized"
            onClick={() => { playClick(); restoreCameraWindow(); }}
          >
            📷 Video Capture
          </button>
        )}
        {settingsWindow && !settingsWindow.isMinimized && (
          <button
            className={`taskbar-item ${activeWindowId === 'settings' ? 'active' : ''}`}
            onClick={() => { playClick(); bringSettingsToFront(); }}
          >
            🖥️ Display Properties
          </button>
        )}
        {settingsWindow && settingsWindow.isMinimized && (
          <button
            className="taskbar-item minimized"
            onClick={() => { playClick(); restoreSettingsWindow(); }}
          >
            🖥️ Display Properties
          </button>
        )}
        {musicWindow && !musicWindow.isMinimized && (
          <button
            className={`taskbar-item ${activeWindowId === 'music' ? 'active' : ''}`}
            onClick={() => { playClick(); bringMusicToFront(); }}
          >
            🎵 Media Player
          </button>
        )}
        {musicWindow && musicWindow.isMinimized && (
          <button
            className="taskbar-item minimized"
            onClick={() => { playClick(); restoreMusicWindow(); }}
          >
            🎵 Media Player
          </button>
        )}
        {visibleWindows.map((window) => (
          <button
            key={window.id}
            className={`taskbar-item ${window.id === activeWindowId ? 'active' : ''}`}
            onClick={() => { playClick(); bringToFront(window.id); }}
          >
            🎬 {window.title.slice(0, 20)}
          </button>
        ))}
        {minimizedWindows.map((window) => (
          <button
            key={window.id}
            className="taskbar-item minimized"
            onClick={() => { playClick(); restoreWindow(window.id); }}
          >
            🎬 {window.title.slice(0, 20)}
          </button>
        ))}
      </div>

      <div className="taskbar-tray">
        <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
    </div>
  );
}
