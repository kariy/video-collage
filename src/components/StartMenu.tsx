import { useWindows } from "../context/WindowsContext";

interface StartMenuProps {
  onClose: () => void;
  onShutdown: () => void;
  onOpenApp: (openFn: () => void) => void;
}

export function StartMenu({ onClose, onShutdown, onOpenApp }: StartMenuProps) {
  const { openCameraWindow, openSettingsWindow, openMusicWindow } = useWindows();

  const handleItem = (action: () => void) => {
    onClose();
    onOpenApp(action);
  };

  return (
    <div className="start-menu-backdrop" onClick={onClose}>
      <div className="start-menu" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="start-menu-header">
          <div className="start-menu-avatar">👤</div>
          <span className="start-menu-username">User</span>
        </div>

        {/* Body */}
        <div className="start-menu-body">
          {/* Left column - pinned / frequent */}
          <div className="start-menu-left">
            <div className="start-menu-section">
              <button className="start-menu-item" onClick={() => handleItem(openMusicWindow)}>
                <span className="start-menu-item-icon">🎵</span>
                <span>Windows Media Player</span>
              </button>
              <button className="start-menu-item" onClick={() => handleItem(openCameraWindow)}>
                <span className="start-menu-item-icon">📷</span>
                <span>Video Capture</span>
              </button>
            </div>
            <div className="start-menu-divider" />
            <div className="start-menu-section">
              <button className="start-menu-item" onClick={() => handleItem(openSettingsWindow)}>
                <span className="start-menu-item-icon">🖥️</span>
                <span>Display Properties</span>
              </button>
            </div>
          </div>

          {/* Right column - places */}
          <div className="start-menu-right">
            <button className="start-menu-place">
              <span className="start-menu-item-icon">📄</span>
              <span>My Documents</span>
            </button>
            <button className="start-menu-place">
              <span className="start-menu-item-icon">🖼️</span>
              <span>My Pictures</span>
            </button>
            <button className="start-menu-place">
              <span className="start-menu-item-icon">🎵</span>
              <span>My Music</span>
            </button>
            <button className="start-menu-place">
              <span className="start-menu-item-icon">💻</span>
              <span>My Computer</span>
            </button>
            <div className="start-menu-divider" />
            <button className="start-menu-place">
              <span className="start-menu-item-icon">⚙️</span>
              <span>Control Panel</span>
            </button>
            <button className="start-menu-place">
              <span className="start-menu-item-icon">❓</span>
              <span>Help and Support</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="start-menu-footer">
          <button className="start-menu-footer-btn" onClick={onClose}>
            <span>🔒</span> Log Off
          </button>
          <button className="start-menu-footer-btn start-menu-shutdown" onClick={onShutdown}>
            <span>🔴</span> Shut Down
          </button>
        </div>
      </div>
    </div>
  );
}
