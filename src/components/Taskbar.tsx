import { useWindows } from '../context/WindowsContext';

export function Taskbar() {
  const { windows, activeWindowId, bringToFront, restoreWindow } = useWindows();

  const visibleWindows = windows.filter(w => !w.isMinimized);
  const minimizedWindows = windows.filter(w => w.isMinimized);

  return (
    <div className="xp-taskbar">
      <button className="start-button">
        <span className="start-logo">🪟</span>
        <span>Start</span>
      </button>

      <div className="taskbar-items">
        {visibleWindows.map((window) => (
          <button
            key={window.id}
            className={`taskbar-item ${window.id === activeWindowId ? 'active' : ''}`}
            onClick={() => bringToFront(window.id)}
          >
            🎬 {window.title.slice(0, 20)}
          </button>
        ))}
        {minimizedWindows.map((window) => (
          <button
            key={window.id}
            className="taskbar-item minimized"
            onClick={() => restoreWindow(window.id)}
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
