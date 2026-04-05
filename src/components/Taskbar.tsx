import { useWindows } from '../context/WindowsContext';
import { playClick, playStartMenu } from '../utils/sounds';

interface TaskbarProps {
  startMenuOpen: boolean;
  onToggleStartMenu: () => void;
}

export function Taskbar({ startMenuOpen, onToggleStartMenu }: TaskbarProps) {
  const { windows, activeWindowId, bringToFront, restoreWindow, cameraWindows, bringCameraToFront, restoreCameraWindow, settingsWindow, bringSettingsToFront, restoreSettingsWindow, musicWindow, bringMusicToFront, restoreMusicWindow, theme } = useWindows();

  const visibleWindows = windows.filter(w => !w.isMinimized);
  const minimizedWindows = windows.filter(w => w.isMinimized);

  return (
    <div className="xp-taskbar">
      <button className={`start-button ${startMenuOpen ? 'pressed' : ''}`} onClick={() => { if (startMenuOpen) { playClick(); } else { playStartMenu(); } onToggleStartMenu(); }}>
        <span className="start-logo">{theme === "macos" ? "🍎" : "🪟"}</span>
        <span>{theme === "macos" ? "" : "Start"}</span>
      </button>

      <div className="taskbar-items">
        {cameraWindows.map((cam) => (
          <button
            key={cam.id}
            className={`taskbar-item ${cam.isMinimized ? 'minimized' : ''} ${activeWindowId === cam.id ? 'active' : ''}`}
            onClick={() => { playClick(); if (cam.isMinimized) { restoreCameraWindow(cam.id); } else { bringCameraToFront(cam.id); } }}
          >
            📷 Video Capture
          </button>
        ))}
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
