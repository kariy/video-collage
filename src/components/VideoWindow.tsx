import { useRef, useEffect, useState } from "react";
import { Rnd } from "react-rnd";
import type { VideoWindow as VideoWindowType } from "../types";
import { useWindows } from "../context/WindowsContext";

interface VideoWindowProps {
  window: VideoWindowType;
  isActive: boolean;
}

const isTouchDevice = () =>
  "ontouchstart" in window || navigator.maxTouchPoints > 0;

export function VideoWindow({ window, isActive }: VideoWindowProps) {
  const { updateWindow, bringToFront, removeWindow, minimizeWindow } =
    useWindows();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showControls, setShowControls] = useState(isTouchDevice());

  useEffect(() => {
    if (videoRef.current) {
      if (window.isPlaying) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    }
  }, [window.isPlaying]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = window.isMuted;
    }
  }, [window.isMuted]);

  if (window.isMinimized) return null;

  const handleResize = (
    _e: unknown,
    _direction: unknown,
    ref: HTMLElement,
    _delta: unknown,
    position: { x: number; y: number }
  ) => {
    const newWidth = ref.offsetWidth;
    const newHeight = newWidth / window.originalAspectRatio;
    updateWindow(window.id, {
      size: { width: newWidth, height: newHeight },
      position,
    });
  };

  return (
    <Rnd
      size={{ width: window.size.width - 25, height: window.size.height + 24 }}
      position={window.position}
      onDragStart={() => bringToFront(window.id)}
      onDragStop={(_e, d) =>
        updateWindow(window.id, { position: { x: d.x, y: d.y } })
      }
      onResizeStop={handleResize}
      minWidth={200}
      minHeight={150}
      lockAspectRatio={false}
      dragHandleClassName="xp-title-bar"
      style={{ zIndex: window.zIndex }}
      bounds="parent"
    >
      <div
        className="xp-window"
        onClick={() => bringToFront(window.id)}
        onMouseEnter={() => !isTouchDevice() && setShowControls(true)}
        onMouseLeave={() => !isTouchDevice() && setShowControls(false)}
        onTouchStart={() => setShowControls(true)}
      >
        {/* Title Bar */}
        <div className={`xp-title-bar ${isActive ? "active" : "inactive"}`}>
          <div className="xp-title-bar-icon">🎬</div>
          <div className="xp-title-bar-text">{window.title}</div>
          <div className="xp-title-bar-buttons">
            <button
              className="xp-btn xp-btn-minimize"
              onClick={(e) => {
                e.stopPropagation();
                minimizeWindow(window.id);
              }}
            >
              _
            </button>
            <button
              className="xp-btn xp-btn-close"
              onClick={(e) => {
                e.stopPropagation();
                removeWindow(window.id);
              }}
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="xp-content">
          <video
            ref={videoRef}
            src={window.src}
            loop
            muted={window.isMuted}
            autoPlay
            playsInline
            className="w-full h-full object-contain bg-black"
          />

          {/* Video Controls Overlay */}
          {showControls && (
            <div className="video-controls">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  updateWindow(window.id, { isPlaying: !window.isPlaying });
                }}
              >
                {window.isPlaying ? "⏸" : "▶"}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  updateWindow(window.id, { isMuted: !window.isMuted });
                }}
              >
                {window.isMuted ? "🔇" : "🔊"}
              </button>
            </div>
          )}
        </div>
      </div>
    </Rnd>
  );
}
