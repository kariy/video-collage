import { useRef } from 'react';
import { VideoWindow } from './VideoWindow';
import { Taskbar } from './Taskbar';
import { useWindows } from '../context/WindowsContext';
import blissBackground from '../assets/bliss.jpg';

export function Desktop() {
  const { windows, activeWindowId, addWindow, arrangeVertically } = useWindows();
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

  return (
    <div className="xp-desktop" style={{ backgroundImage: `url(${blissBackground})` }}>
      {/* Desktop Icons Area */}
      <div className="desktop-icons">
        <button
          className="desktop-icon"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="desktop-icon-image">📁</div>
          <span>Add Videos</span>
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
      </div>

      {/* Empty State */}
      {windows.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-content">
            <div className="empty-state-icon">🎬</div>
            <h2>Windows XP Video Collage</h2>
            <p>Click "Add Videos" to get started</p>
            <button
              className="xp-button"
              onClick={() => fileInputRef.current?.click()}
            >
              + Add Video
            </button>
          </div>
        </div>
      )}

      <Taskbar />
    </div>
  );
}
