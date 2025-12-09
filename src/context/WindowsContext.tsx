import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { VideoWindow, VideoWindowCreate } from "../types";

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
}

const WindowsContext = createContext<WindowsContextType | null>(null);

let nextZIndex = 1;

export function WindowsProvider({ children }: { children: ReactNode }) {
  const [windows, setWindows] = useState<VideoWindow[]>([]);
  const [activeWindowId, setActiveWindowId] = useState<string | null>(null);

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
