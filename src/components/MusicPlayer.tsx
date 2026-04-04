import { useRef, useState, useEffect, useCallback } from "react";
import { Rnd } from "react-rnd";
import { useWindows } from "../context/WindowsContext";
import allNewEdition from "../assets/All New Edition.mp3";

interface Track {
  name: string;
  src: string;
  duration: number;
}

export function MusicPlayer({ isActive }: { isActive: boolean }) {
  const {
    musicWindow,
    updateMusicWindow,
    closeMusicWindow,
    bringMusicToFront,
  } = useWindows();

  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [playlist, setPlaylist] = useState<Track[]>([
    { name: "All New Edition", src: allNewEdition, duration: 0 },
  ]);
  const [defaultLoaded, setDefaultLoaded] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isSeeking, setIsSeeking] = useState(false);

  const currentTrack = currentIndex >= 0 ? playlist[currentIndex] : null;

  // Load duration for default track
  useEffect(() => {
    if (defaultLoaded) return;
    const audio = new Audio();
    audio.src = allNewEdition;
    audio.addEventListener("loadedmetadata", () => {
      setPlaylist((prev) =>
        prev.map((t) =>
          t.src === allNewEdition ? { ...t, duration: audio.duration } : t
        )
      );
      setDefaultLoaded(true);
    });
  }, [defaultLoaded]);

  const setupAnalyser = useCallback(() => {
    if (!audioRef.current || analyserRef.current) return;
    const ctx = new AudioContext();
    const source = ctx.createMediaElementSource(audioRef.current);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 128;
    source.connect(analyser);
    analyser.connect(ctx.destination);
    audioCtxRef.current = ctx;
    sourceRef.current = source;
    analyserRef.current = analyser;
  }, []);

  // Visualization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      animFrameRef.current = requestAnimationFrame(draw);
      const w = canvas.width;
      const h = canvas.height;

      // Dark background
      ctx.fillStyle = "#0a0e2a";
      ctx.fillRect(0, 0, w, h);

      if (analyserRef.current && isPlaying) {
        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserRef.current.getByteFrequencyData(dataArray);

        const barWidth = (w / bufferLength) * 1.5;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArray[i] / 255) * h * 0.9;

          // WMP-style green-to-yellow gradient
          const gradient = ctx.createLinearGradient(0, h, 0, h - barHeight);
          gradient.addColorStop(0, "#00cc00");
          gradient.addColorStop(0.6, "#44dd44");
          gradient.addColorStop(1, "#ccff00");

          ctx.fillStyle = gradient;
          ctx.fillRect(x, h - barHeight, barWidth - 1, barHeight);
          x += barWidth;
        }
      } else {
        // Idle state - flat line
        ctx.strokeStyle = "#1a3a1a";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, h / 2);
        ctx.lineTo(w, h / 2);
        ctx.stroke();
      }
    };

    draw();
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [isPlaying, musicWindow?.isMinimized]);

  const handleAddFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      const url = URL.createObjectURL(file);
      const audio = new Audio();
      audio.src = url;
      audio.addEventListener("loadedmetadata", () => {
        setPlaylist((prev) => [
          ...prev,
          { name: file.name, src: url, duration: audio.duration },
        ]);
      });
    }
    e.target.value = "";
  };

  const playTrack = useCallback(
    (index: number) => {
      if (index < 0 || index >= playlist.length) return;
      setCurrentIndex(index);
      if (audioRef.current) {
        audioRef.current.src = playlist[index].src;
        audioRef.current.play().then(() => {
          setupAnalyser();
          if (audioCtxRef.current?.state === "suspended") {
            audioCtxRef.current.resume();
          }
          setIsPlaying(true);
        }).catch(() => {});
      }
    },
    [playlist, setupAnalyser]
  );

  const togglePlay = () => {
    if (!audioRef.current || !currentTrack) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setupAnalyser();
        if (audioCtxRef.current?.state === "suspended") {
          audioCtxRef.current.resume();
        }
        setIsPlaying(true);
      }).catch(() => {});
    }
  };

  const stop = () => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const prevTrack = () => {
    if (playlist.length === 0) return;
    const idx = currentIndex <= 0 ? playlist.length - 1 : currentIndex - 1;
    playTrack(idx);
  };

  const nextTrack = useCallback(() => {
    if (playlist.length === 0) return;
    const idx = currentIndex >= playlist.length - 1 ? 0 : currentIndex + 1;
    playTrack(idx);
  }, [currentIndex, playlist.length, playTrack]);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
    }
  };

  const removeTrack = (index: number) => {
    if (index === currentIndex) {
      stop();
      setCurrentIndex(-1);
    } else if (index < currentIndex) {
      setCurrentIndex((prev) => prev - 1);
    }
    setPlaylist((prev) => prev.filter((_, i) => i !== index));
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  if (!musicWindow) return null;

  return (
    <>
    <audio
      ref={audioRef}
      onTimeUpdate={() => {
        if (!isSeeking && audioRef.current) {
          setCurrentTime(audioRef.current.currentTime);
        }
      }}
      onLoadedMetadata={() => {
        if (audioRef.current) setDuration(audioRef.current.duration);
      }}
      onEnded={nextTrack}
    />
    {!musicWindow.isMinimized && (
    <Rnd
      size={musicWindow.size}
      position={musicWindow.position}
      onDragStart={() => bringMusicToFront()}
      onDragStop={(_e, d) => updateMusicWindow({ position: { x: d.x, y: d.y } })}
      onResizeStop={(_e, _dir, ref, _delta, position) => {
        updateMusicWindow({
          size: { width: ref.offsetWidth, height: ref.offsetHeight },
          position,
        });
      }}
      minWidth={320}
      minHeight={360}
      dragHandleClassName="wmp-title-bar"
      style={{ zIndex: musicWindow.zIndex }}
      bounds="parent"
    >
      <div className="wmp-window" onClick={() => bringMusicToFront()}>
        {/* Title bar */}
        <div className={`wmp-title-bar ${isActive ? "active" : "inactive"}`}>
          <div className="wmp-title-icon">🎵</div>
          <div className="wmp-title-text">
            {currentTrack
              ? `Windows Media Player - ${currentTrack.name}`
              : "Windows Media Player"}
          </div>
          <div className="xp-title-bar-buttons">
            <button
              className="xp-btn xp-btn-minimize"
              onClick={(e) => {
                e.stopPropagation();
                updateMusicWindow({ isMinimized: true });
              }}
            >
              _
            </button>
            <button
              className="xp-btn xp-btn-close"
              onClick={(e) => {
                e.stopPropagation();
                stop();
                closeMusicWindow();
              }}
            >
              ×
            </button>
          </div>
        </div>

        {/* Menu bar */}
        <div className="wmp-menubar">
          <span className="wmp-menu-item">Now Playing</span>
          <span className="wmp-menu-item">Library</span>
          <span className="wmp-menu-item">Rip</span>
          <span className="wmp-menu-item">Burn</span>
          <span className="wmp-menu-item">Sync</span>
        </div>

        {/* Visualization */}
        <div className="wmp-viz-area">
          <canvas
            ref={canvasRef}
            className="wmp-viz-canvas"
            width={400}
            height={140}
          />
          {!currentTrack && (
            <div className="wmp-viz-empty">
              <p>Windows Media Player</p>
            </div>
          )}
          {currentTrack && (
            <div className="wmp-now-playing-label">
              {currentTrack.name}
            </div>
          )}
        </div>

        {/* Seek bar */}
        <div className="wmp-seek-area">
          <span className="wmp-time">{formatTime(currentTime)}</span>
          <input
            type="range"
            className="wmp-seek-bar"
            min={0}
            max={duration || 0}
            step={0.1}
            value={isSeeking ? currentTime : currentTime}
            onMouseDown={() => setIsSeeking(true)}
            onMouseUp={() => setIsSeeking(false)}
            onChange={handleSeek}
          />
          <span className="wmp-time">{formatTime(duration)}</span>
        </div>

        {/* Transport controls */}
        <div className="wmp-controls">
          <div className="wmp-transport">
            <button className="wmp-ctrl-btn" onClick={prevTrack} title="Previous">⏮</button>
            <button className="wmp-ctrl-btn wmp-ctrl-play" onClick={togglePlay} title={isPlaying ? "Pause" : "Play"}>
              {isPlaying ? "⏸" : "▶"}
            </button>
            <button className="wmp-ctrl-btn" onClick={stop} title="Stop">⏹</button>
            <button className="wmp-ctrl-btn" onClick={nextTrack} title="Next">⏭</button>
          </div>
          <div className="wmp-volume">
            <span className="wmp-vol-icon">{volume === 0 ? "🔇" : "🔊"}</span>
            <input
              type="range"
              className="wmp-vol-slider"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={handleVolumeChange}
            />
          </div>
        </div>

        {/* Playlist */}
        <div className="wmp-playlist">
          <div className="wmp-playlist-header">
            <span>Playlist</span>
            <button
              className="wmp-add-btn"
              onClick={() => fileInputRef.current?.click()}
            >
              + Add
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              multiple
              onChange={handleAddFiles}
              className="hidden"
            />
          </div>
          <div className="wmp-playlist-list">
            {playlist.length === 0 && (
              <div className="wmp-playlist-empty">
                No music. Click "+ Add" to add tracks.
              </div>
            )}
            {playlist.map((track, i) => (
              <div
                key={i}
                className={`wmp-playlist-item ${i === currentIndex ? "active" : ""}`}
                onDoubleClick={() => playTrack(i)}
              >
                <span className="wmp-track-num">{i + 1}.</span>
                <span className="wmp-track-name">{track.name}</span>
                <span className="wmp-track-dur">{formatTime(track.duration)}</span>
                <button
                  className="wmp-track-remove"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeTrack(i);
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </Rnd>
    )}
    </>
  );
}
