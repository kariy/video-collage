import { useRef, useEffect, useState } from "react";
import { Rnd } from "react-rnd";
import { useWindows } from "../context/WindowsContext";

interface CameraWindowProps {
  isActive: boolean;
}

export function CameraWindow({ isActive }: CameraWindowProps) {
  const { cameraWindow, updateCameraWindow, closeCameraWindow, bringCameraToFront } = useWindows();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [snapshotFlash, setSnapshotFlash] = useState(false);

  const isMinimized = cameraWindow?.isMinimized ?? true;

  useEffect(() => {
    if (isMinimized) return;

    let cancelled = false;

    navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 640 }, height: { ideal: 480 } },
      audio: false,
    }).then((stream) => {
      if (cancelled) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsStreaming(true);
      setError(null);
    }).catch(() => {
      if (!cancelled) {
        setError("Could not access camera. Please allow camera permissions.");
      }
    });

    return () => {
      cancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      setIsStreaming(false);
    };
  }, [isMinimized]);

  const retryCamera = () => {
    setError(null);
    setIsStreaming(false);
    navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 640 }, height: { ideal: 480 } },
      audio: false,
    }).then((stream) => {
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsStreaming(true);
    }).catch(() => {
      setError("Could not access camera. Please allow camera permissions.");
    });
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  if (!cameraWindow || cameraWindow.isMinimized) return null;

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setRecordingTime(0);
    } else {
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime((t) => t + 1);
      }, 1000);
    }
  };

  const takeSnapshot = () => {
    if (!videoRef.current || !canvasRef.current || !isStreaming) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.filter = "saturate(0.5) contrast(1.2) brightness(0.95) sepia(0.15)";
      ctx.drawImage(video, 0, 0);
      ctx.filter = "none";
      ctx.setTransform(1, 0, 0, 1, 0, 0);

      // vignette
      const gradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, canvas.width * 0.25,
        canvas.width / 2, canvas.height / 2, canvas.width * 0.7
      );
      gradient.addColorStop(0, "transparent");
      gradient.addColorStop(1, "rgba(0, 0, 0, 0.5)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const link = document.createElement("a");
      link.download = `snapshot_${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    }
    setSnapshotFlash(true);
    setTimeout(() => setSnapshotFlash(false), 150);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <Rnd
      size={{
        width: cameraWindow.size.width,
        height: cameraWindow.size.height,
      }}
      position={cameraWindow.position}
      onDragStart={() => bringCameraToFront()}
      onDragStop={(_e, d) =>
        updateCameraWindow({ position: { x: d.x, y: d.y } })
      }
      onResizeStop={(_e, _dir, ref, _delta, position) => {
        updateCameraWindow({
          size: { width: ref.offsetWidth, height: ref.offsetHeight },
          position,
        });
      }}
      minWidth={340}
      minHeight={340}
      dragHandleClassName="xp-title-bar"
      style={{ zIndex: cameraWindow.zIndex }}
      bounds="parent"
    >
      <div
        className="xp-window"
        onClick={() => bringCameraToFront()}
      >
        {/* Title Bar */}
        <div className={`xp-title-bar ${isActive ? "active" : "inactive"}`}>
          <div className="xp-title-bar-icon">📷</div>
          <div className="xp-title-bar-text">Video Capture - Preview</div>
          <div className="xp-title-bar-buttons">
            <button
              className="xp-btn xp-btn-minimize"
              onClick={(e) => {
                e.stopPropagation();
                updateCameraWindow({ isMinimized: true });
              }}
            >
              _
            </button>
            <button
              className="xp-btn xp-btn-close"
              onClick={(e) => {
                e.stopPropagation();
                if (streamRef.current) {
                  streamRef.current.getTracks().forEach((t) => t.stop());
                  streamRef.current = null;
                }
                if (timerRef.current) clearInterval(timerRef.current);
                closeCameraWindow();
              }}
            >
              ×
            </button>
          </div>
        </div>

        {/* XP Menu Bar */}
        <div className="camera-menubar">
          <span className="camera-menu-item"><u>F</u>ile</span>
          <span className="camera-menu-item"><u>E</u>dit</span>
          <span className="camera-menu-item"><u>V</u>iew</span>
          <span className="camera-menu-item"><u>C</u>apture</span>
          <span className="camera-menu-item"><u>H</u>elp</span>
        </div>

        {/* Main content area with side panel */}
        <div className="camera-body">
          {/* Left side panel - task pane */}
          <div className="camera-task-pane">
            <div className="camera-task-section">
              <div className="camera-task-header">
                <span>Camera Tasks</span>
              </div>
              <div className="camera-task-links">
                <button
                  className="camera-task-link"
                  onClick={takeSnapshot}
                  disabled={!isStreaming}
                >
                  <span className="camera-task-icon">📸</span>
                  Take a new picture
                </button>
                <button
                  className="camera-task-link"
                  onClick={toggleRecording}
                  disabled={!isStreaming}
                >
                  <span className="camera-task-icon">{isRecording ? "⏹" : "🎥"}</span>
                  {isRecording ? "Stop recording" : "Record a video clip"}
                </button>
              </div>
            </div>
            <div className="camera-task-section">
              <div className="camera-task-header">
                <span>Other Places</span>
              </div>
              <div className="camera-task-links">
                <button className="camera-task-link">
                  <span className="camera-task-icon">📁</span>
                  My Pictures
                </button>
                <button className="camera-task-link">
                  <span className="camera-task-icon">📁</span>
                  My Videos
                </button>
              </div>
            </div>
          </div>

          {/* Right side - video preview */}
          <div className="camera-preview-area">
            <div className="camera-viewfinder">
              {error ? (
                <div className="camera-error">
                  <div className="camera-error-icon">⚠️</div>
                  <p>{error}</p>
                  <button className="xp-button" onClick={retryCamera}>
                    Retry
                  </button>
                </div>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="camera-video camera-vintage"
                  />
                  <div className="camera-scanlines" />
                  <div className="camera-vignette" />
                  {snapshotFlash && <div className="camera-flash" />}
                  {isRecording && (
                    <div className="camera-recording-indicator">
                      <span className="camera-rec-dot" />
                      REC {formatTime(recordingTime)}
                    </div>
                  )}
                  {!isStreaming && !error && (
                    <div className="camera-loading">
                      <p>Connecting to camera...</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Status bar */}
        <div className="camera-statusbar">
          <span>{isStreaming ? "Preview" : "No camera"}</span>
          {isRecording && <span className="camera-status-rec">Recording - {formatTime(recordingTime)}</span>}
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </div>
    </Rnd>
  );
}
