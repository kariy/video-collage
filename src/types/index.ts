export interface VideoWindow {
  id: string;
  src: string;
  title: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  originalAspectRatio: number;
  zIndex: number;
  isMinimized: boolean;
  isMuted: boolean;
  isPlaying: boolean;
}

export type VideoWindowCreate = Pick<VideoWindow, 'src' | 'title' | 'originalAspectRatio'>;
