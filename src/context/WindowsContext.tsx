import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import type { VideoWindow, VideoWindowCreate, CameraWindowState, AppWindowState } from "../types";
import blissBackground from "../assets/bliss.jpg";

interface WindowsContextType {
  windows: VideoWindow[];
  activeWindowId: string | null;
  addWindow: (data: VideoWindowCreate) => string;
  removeWindow: (id: string) => void;
  updateWindow: (id: string, updates: Partial<VideoWindow>) => void;
  bringToFront: (id: string) => void;
  minimizeWindow: (id: string) => void;
  restoreWindow: (id: string) => void;
  arrangeVertically: () => void;
  cameraWindows: CameraWindowState[];
  openCameraWindow: () => void;
  closeCameraWindow: (id: string) => void;
  updateCameraWindow: (id: string, updates: Partial<CameraWindowState>) => void;
  bringCameraToFront: (id: string) => void;
  restoreCameraWindow: (id: string) => void;
  settingsWindow: AppWindowState | null;
  openSettingsWindow: () => void;
  closeSettingsWindow: () => void;
  updateSettingsWindow: (updates: Partial<AppWindowState>) => void;
  bringSettingsToFront: () => void;
  restoreSettingsWindow: () => void;
  desktopBackground: string;
  setDesktopBackground: (bg: string) => void;
  theme: "xp" | "macos";
  setTheme: (theme: "xp" | "macos") => void;
  musicWindow: AppWindowState | null;
  openMusicWindow: () => void;
  closeMusicWindow: () => void;
  updateMusicWindow: (updates: Partial<AppWindowState>) => void;
  bringMusicToFront: () => void;
  restoreMusicWindow: () => void;
}

const WindowsContext = createContext<WindowsContextType | null>(null);

let nextZIndex = 1;

export function WindowsProvider({ children }: { children: ReactNode }) {
  const [windows, setWindows] = useState<VideoWindow[]>([]);
  const [activeWindowId, setActiveWindowId] = useState<string | null>(null);
  const [cameraWindows, setCameraWindows] = useState<CameraWindowState[]>([]);
  const [settingsWindow, setSettingsWindow] = useState<AppWindowState | null>(null);
  const [desktopBackground, setDesktopBackground] = useState<string>(blissBackground);
  const [theme, setTheme] = useState<"xp" | "macos">(() => {
    const saved = localStorage.getItem("theme");
    return saved === "macos" ? "macos" : "xp";
  });

  useEffect(() => {
    localStorage.setItem("theme", theme);
  }, [theme]);
  const [musicWindow, setMusicWindow] = useState<AppWindowState | null>(null);

  const addWindow = useCallback(
    (data: VideoWindowCreate) => {
      const id = crypto.randomUUID();
      const existingCount = windows.length;
      
      const isMobile = window.innerWidth <= 768;
      const screenWidth = window.innerWidth;
      const defaultWidth = isMobile ? Math.min(screenWidth - 40, 320) : 400;
      const defaultHeight = defaultWidth / data.originalAspectRatio;

      const newWindow: VideoWindow = {
        id,
        src: data.src,
        title: data.title,
        position: {
          x: isMobile ? 20 : 50 + (existingCount % 5) * 30,
          y: isMobile ? 80 + existingCount * 20 : 50 + existingCount * 40,
        },
        size: { width: defaultWidth, height: defaultHeight },
        originalAspectRatio: data.originalAspectRatio,
        zIndex: nextZIndex++,
        isMinimized: false,
        isMuted: true,
        isPlaying: true,
      };

      setWindows((prev) => [...prev, newWindow]);
      setActiveWindowId(id);
      return id;
    },
    [windows.length]
  );

  const removeWindow = useCallback((id: string) => {
    setWindows((prev) => prev.filter((w) => w.id !== id));
    setActiveWindowId((prev) => (prev === id ? null : prev));
  }, []);

  const updateWindow = useCallback(
    (id: string, updates: Partial<VideoWindow>) => {
      setWindows((prev) =>
        prev.map((w) => (w.id === id ? { ...w, ...updates } : w))
      );
    },
    []
  );

  const bringToFront = useCallback((id: string) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, zIndex: nextZIndex++ } : w))
    );
    setActiveWindowId(id);
  }, []);

  const minimizeWindow = useCallback(
    (id: string) => {
      updateWindow(id, { isMinimized: true });
    },
    [updateWindow]
  );

  const restoreWindow = useCallback(
    (id: string) => {
      updateWindow(id, { isMinimized: false });
      bringToFront(id);
    },
    [updateWindow, bringToFront]
  );

  const openCameraWindow = useCallback(() => {
    const id = `camera-${crypto.randomUUID()}`;
    const isMobile = window.innerWidth <= 768;
    const count = cameraWindows.length;
    setCameraWindows((prev) => [...prev, {
      id,
      position: { x: isMobile ? 20 : 100 + count * 30, y: isMobile ? 70 : 60 + count * 30 },
      size: { width: isMobile ? Math.min(window.innerWidth - 40, 360) : 500, height: isMobile ? 360 : 440 },
      zIndex: nextZIndex++,
      isMinimized: false,
    }]);
    setActiveWindowId(id);
  }, [cameraWindows.length]);

  const closeCameraWindow = useCallback((id: string) => {
    setCameraWindows((prev) => prev.filter((w) => w.id !== id));
    setActiveWindowId((prev) => (prev === id ? null : prev));
  }, []);

  const updateCameraWindow = useCallback((id: string, updates: Partial<CameraWindowState>) => {
    setCameraWindows((prev) => prev.map((w) => w.id === id ? { ...w, ...updates } : w));
  }, []);

  const bringCameraToFront = useCallback((id: string) => {
    setCameraWindows((prev) => prev.map((w) => w.id === id ? { ...w, zIndex: nextZIndex++ } : w));
    setActiveWindowId(id);
  }, []);

  const restoreCameraWindow = useCallback((id: string) => {
    setCameraWindows((prev) => prev.map((w) => w.id === id ? { ...w, isMinimized: false, zIndex: nextZIndex++ } : w));
    setActiveWindowId(id);
  }, []);

  const openSettingsWindow = useCallback(() => {
    if (settingsWindow) {
      setSettingsWindow((prev) => prev ? { ...prev, isMinimized: false, zIndex: nextZIndex++ } : prev);
      setActiveWindowId("settings");
      return;
    }
    const isMobile = window.innerWidth <= 768;
    setSettingsWindow({
      position: { x: isMobile ? 10 : 150, y: isMobile ? 60 : 80 },
      size: { width: isMobile ? Math.min(window.innerWidth - 20, 380) : 420, height: isMobile ? 420 : 480 },
      zIndex: nextZIndex++,
      isMinimized: false,
    });
    setActiveWindowId("settings");
  }, [settingsWindow]);

  const closeSettingsWindow = useCallback(() => {
    setSettingsWindow(null);
    setActiveWindowId(null);
  }, []);

  const updateSettingsWindow = useCallback((updates: Partial<AppWindowState>) => {
    setSettingsWindow((prev) => prev ? { ...prev, ...updates } : prev);
  }, []);

  const bringSettingsToFront = useCallback(() => {
    setSettingsWindow((prev) => prev ? { ...prev, zIndex: nextZIndex++ } : prev);
    setActiveWindowId("settings");
  }, []);

  const restoreSettingsWindow = useCallback(() => {
    setSettingsWindow((prev) => prev ? { ...prev, isMinimized: false, zIndex: nextZIndex++ } : prev);
    setActiveWindowId("settings");
  }, []);

  const openMusicWindow = useCallback(() => {
    if (musicWindow) {
      setMusicWindow((prev) => prev ? { ...prev, isMinimized: false, zIndex: nextZIndex++ } : prev);
      setActiveWindowId("music");
      return;
    }
    const isMobile = window.innerWidth <= 768;
    setMusicWindow({
      position: { x: isMobile ? 10 : 180, y: isMobile ? 60 : 50 },
      size: { width: isMobile ? Math.min(window.innerWidth - 20, 360) : 420, height: isMobile ? 460 : 500 },
      zIndex: nextZIndex++,
      isMinimized: false,
    });
    setActiveWindowId("music");
  }, [musicWindow]);

  const closeMusicWindow = useCallback(() => {
    setMusicWindow(null);
    setActiveWindowId(null);
  }, []);

  const updateMusicWindow = useCallback((updates: Partial<AppWindowState>) => {
    setMusicWindow((prev) => prev ? { ...prev, ...updates } : prev);
  }, []);

  const bringMusicToFront = useCallback(() => {
    setMusicWindow((prev) => prev ? { ...prev, zIndex: nextZIndex++ } : prev);
    setActiveWindowId("music");
  }, []);

  const restoreMusicWindow = useCallback(() => {
    setMusicWindow((prev) => prev ? { ...prev, isMinimized: false, zIndex: nextZIndex++ } : prev);
    setActiveWindowId("music");
  }, []);

  const arrangeVertically = useCallback(() => {
    const isMobile = window.innerWidth <= 768;
    const gap = isMobile ? 10 : 20;
    const startX = isMobile ? 10 : 50;
    let currentY = isMobile ? 70 : 50;

    setWindows((prev) => {
      const visible = prev.filter((w) => !w.isMinimized);
      const minimized = prev.filter((w) => w.isMinimized);

      const arranged = visible.map((w, index) => {
        const newWindow = {
          ...w,
          position: { x: startX, y: currentY },
          zIndex: index + 1,
        };
        currentY += w.size.height + gap + 36;
        return newWindow;
      });

      nextZIndex = visible.length + 1;
      return [...arranged, ...minimized];
    });
  }, []);

  return (
    <WindowsContext.Provider
      value={{
        windows,
        activeWindowId,
        addWindow,
        removeWindow,
        updateWindow,
        bringToFront,
        minimizeWindow,
        restoreWindow,
        arrangeVertically,
        cameraWindows,
        openCameraWindow,
        closeCameraWindow,
        updateCameraWindow,
        bringCameraToFront,
        restoreCameraWindow,
        settingsWindow,
        openSettingsWindow,
        closeSettingsWindow,
        updateSettingsWindow,
        bringSettingsToFront,
        restoreSettingsWindow,
        desktopBackground,
        setDesktopBackground,
        theme,
        setTheme,
        musicWindow,
        openMusicWindow,
        closeMusicWindow,
        updateMusicWindow,
        bringMusicToFront,
        restoreMusicWindow,
      }}
    >
      {children}
    </WindowsContext.Provider>
  );
}

export function useWindows() {
  const context = useContext(WindowsContext);
  if (!context) {
    throw new Error("useWindows must be used within a WindowsProvider");
  }
  return context;
}
