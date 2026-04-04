import { useRef, useEffect, useState } from "react";
import { Rnd } from "react-rnd";
import { useWindows } from "../context/WindowsContext";
import { playMinimize, playWindowClose } from "../utils/sounds";
import type { CameraWindowState } from "../types";

interface CameraWindowProps {
  cam: CameraWindowState;
  isActive: boolean;
}

type CameraMode = "photo" | "video";

export function CameraWindow({ cam, isActive }: CameraWindowProps) {
  const { updateCameraWindow, closeCameraWindow, bringCameraToFront } = useWindows();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [snapshotFlash, setSnapshotFlash] = useState(false);
  const [aspectRatio, setAspectRatio] = useState(4 / 3);
  const [isMirrored, setIsMirrored] = useState(true);
  const [mode, setMode] = useState<CameraMode>("photo");

  const isMinimized = cam.isMinimized;

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
      setIsStreaming(true);
      setError(null);
    }).catch((err) => {
      console.error("Camera error:", err);
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

  useEffect(() => {
    if (videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.onloadedmetadata = () => {
        if (videoRef.current && videoRef.current.videoWidth) {
          setAspectRatio(videoRef.current.videoWidth / videoRef.current.videoHeight);
        }
      };
    }
  }, [isStreaming, isMinimized]);

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

  if (cam.isMinimized) return null;

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
      if (isMirrored) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.filter = "saturate(0.5) contrast(1.2) brightness(0.95) sepia(0.15)";
      ctx.drawImage(video, 0, 0);
      ctx.filter = "none";
      ctx.setTransform(1, 0, 0, 1, 0, 0);

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

  const handleCapture = () => {
    if (mode === "photo") {
      takeSnapshot();
    } else {
      toggleRecording();
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <Rnd
      size={{ width: cam.size.width, height: cam.size.height }}
      position={cam.position}
      onDragStart={() => bringCameraToFront(cam.id)}
      onDragStop={(_e, d) =>
        updateCameraWindow(cam.id, { position: { x: d.x, y: d.y } })
      }
      onResizeStop={(_e, _dir, ref, _delta, position) => {
        const newWidth = ref.offsetWidth;
        // chrome: title bar (30) + toolbar (64) = 94
        const chromeHeight = 94;
        const videoHeight = newWidth / aspectRatio;
        updateCameraWindow(cam.id, {
          size: { width: newWidth, height: videoHeight + chromeHeight },
          position,
        });
      }}
      minWidth={300}
      minHeight={280}
      dragHandleClassName="xp-title-bar"
      style={{ zIndex: cam.zIndex }}
      bounds="parent"
    >
      <div className="cam-window" onClick={() => bringCameraToFront(cam.id)}>
        {/* Title Bar */}
        <div className={`xp-title-bar ${isActive ? "active" : "inactive"}`}>
          <div className="xp-title-bar-icon">📷</div>
          <div className="xp-title-bar-text">Camera</div>
          <div className="xp-title-bar-buttons">
            <button
              className="xp-btn xp-btn-minimize"
              onClick={(e) => {
                e.stopPropagation();
                playMinimize();
                updateCameraWindow(cam.id, { isMinimized: true });
              }}
            >
              _
            </button>
            <button
              className="xp-btn xp-btn-close"
              onClick={(e) => {
                e.stopPropagation();
                playWindowClose();
                if (streamRef.current) {
                  streamRef.current.getTracks().forEach((t) => t.stop());
                  streamRef.current = null;
                }
                if (timerRef.current) clearInterval(timerRef.current);
                closeCameraWindow(cam.id);
              }}
            >
              ×
            </button>
          </div>
        </div>

        {/* Video area */}
        <div className="cam-video-area">
          {error ? (
            <div className="camera-error">
              <div className="camera-error-icon">⚠️</div>
              <p>{error}</p>
              <button className="xp-button" onClick={retryCamera}>Retry</button>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="cam-video camera-vintage"
                style={{ transform: isMirrored ? "scaleX(-1)" : "none" }}
              />
              <div className="camera-scanlines" />
              <div className="camera-vignette" />

              {/* Mirror button - top right */}
              <button
                className="cam-overlay-btn cam-mirror-btn"
                onClick={() => setIsMirrored((m) => !m)}
                title={isMirrored ? "Unmirror" : "Mirror"}
              >
                {isMirrored ? "🪞" : "↔️"}
              </button>

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

        {/* Bottom toolbar */}
        <div className="cam-toolbar">
          {/* Mode switcher */}
          <div className="cam-mode-switch">
            <button
              className={`cam-mode-btn ${mode === "photo" ? "active" : ""}`}
              onClick={() => setMode("photo")}
            >
              Photo
            </button>
            <button
              className={`cam-mode-btn ${mode === "video" ? "active" : ""}`}
              onClick={() => setMode("video")}
            >
              Video
            </button>
          </div>

          {/* Capture button */}
          <button
            className={`cam-capture-btn ${mode === "video" && isRecording ? "recording" : ""} ${mode === "video" ? "video-mode" : ""}`}
            onClick={handleCapture}
            disabled={!isStreaming}
          >
            <span className="cam-capture-inner" />
          </button>

          {/* Spacer for centering */}
          <div className="cam-toolbar-spacer" />
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </div>
    </Rnd>
  );
}
