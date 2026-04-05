import { useRef, useState } from "react";
import { Rnd } from "react-rnd";
import { useWindows } from "../context/WindowsContext";
import { playClick, playMinimize, playWindowClose } from "../utils/sounds";
import blissBackground from "../assets/bliss.jpg";

interface SettingsWindowProps {
  isActive: boolean;
}

const PRESET_BACKGROUNDS = [
  { name: "Bliss", value: blissBackground },
  { name: "(None)", value: "color:#008080" },
  { name: "Azul", value: "color:#0055e5" },
  { name: "Autumn", value: "color:#c45911" },
  { name: "Ascend", value: "color:#2e4057" },
  { name: "Lavender", value: "color:#967bb6" },
  { name: "Moonlight", value: "color:#1a1a2e" },
  { name: "Emerald", value: "color:#2d6a4f" },
  { name: "Stonehenge", value: "color:#6b705c" },
  { name: "Tulips", value: "color:#d62828" },
  { name: "Ripple", value: "color:#0077b6" },
  { name: "Vortec", value: "color:#240046" },
];

const TABS = ["Themes", "Desktop", "Screen Saver", "Appearance", "Settings"];

const THEME_OPTIONS: { name: string; value: "xp" | "macos"; description: string }[] = [
  { name: "Windows XP", value: "xp", description: "Classic Windows XP look with blue title bars and green Start button" },
  { name: "macOS Classic", value: "macos", description: "Platinum appearance with traffic light buttons and top menu bar" },
];

export function SettingsWindow({ isActive }: SettingsWindowProps) {
  const {
    settingsWindow,
    updateSettingsWindow,
    closeSettingsWindow,
    bringSettingsToFront,
    desktopBackground,
    setDesktopBackground,
    theme,
    setTheme,
  } = useWindows();

  const [activeTab, setActiveTab] = useState("Themes");
  const [selectedBg, setSelectedBg] = useState(desktopBackground || blissBackground);
  const [selectedTheme, setSelectedTheme] = useState(theme);
  const [customImages, setCustomImages] = useState<{ name: string; value: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!settingsWindow || settingsWindow.isMinimized) return null;

  const allBackgrounds = [...PRESET_BACKGROUNDS, ...customImages];
  const currentSelection = allBackgrounds.find((bg) => bg.value === selectedBg);

  const getPreviewStyle = (): React.CSSProperties => {
    if (selectedBg.startsWith("color:")) {
      return { backgroundColor: selectedBg.slice(6) };
    }
    return { backgroundImage: `url(${selectedBg})`, backgroundSize: "cover", backgroundPosition: "center" };
  };

  const handleApply = () => {
    if (activeTab === "Themes") {
      setTheme(selectedTheme);
    } else {
      setDesktopBackground(selectedBg);
    }
  };

  const handleOk = () => {
    if (activeTab === "Themes") {
      setTheme(selectedTheme);
    } else {
      setDesktopBackground(selectedBg);
    }
    closeSettingsWindow();
  };

  const handleBrowse = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const newImg = { name: file.name, value: url };
    setCustomImages((prev) => [...prev, newImg]);
    setSelectedBg(url);
    e.target.value = "";
  };

  return (
    <Rnd
      size={settingsWindow.size}
      position={settingsWindow.position}
      onDragStart={() => bringSettingsToFront()}
      onDragStop={(_e, d) => updateSettingsWindow({ position: { x: d.x, y: d.y } })}
      onResizeStop={(_e, _dir, ref, _delta, position) => {
        updateSettingsWindow({
          size: { width: ref.offsetWidth, height: ref.offsetHeight },
          position,
        });
      }}
      minWidth={360}
      minHeight={380}
      dragHandleClassName="xp-title-bar"
      style={{ zIndex: settingsWindow.zIndex }}
      bounds="parent"
    >
      <div className="xp-window" onClick={() => bringSettingsToFront()}>
        {/* Title Bar */}
        <div className={`xp-title-bar ${isActive ? "active" : "inactive"}`}>
          <div className="xp-title-bar-icon">🖥️</div>
          <div className="xp-title-bar-text">Display Properties</div>
          <div className="xp-title-bar-buttons">
            <button
              className="xp-btn xp-btn-minimize"
              onClick={(e) => {
                e.stopPropagation();
                playMinimize();
                updateSettingsWindow({ isMinimized: true });
              }}
            >
              _
            </button>
            <button
              className="xp-btn xp-btn-close"
              onClick={(e) => {
                e.stopPropagation();
                playWindowClose();
                closeSettingsWindow();
              }}
            >
              ×
            </button>
          </div>
        </div>

        {/* Tab bar */}
        <div className="settings-content">
          <div className="settings-tabs">
            {TABS.map((tab) => (
              <div
                key={tab}
                className={`settings-tab ${activeTab === tab ? "active" : ""}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </div>
            ))}
          </div>

          {/* Tab content */}
          <div className="settings-tab-content">
            {activeTab === "Themes" && (
              <>
                <label className="settings-label">Select a theme:</label>
                <div className="settings-theme-list">
                  {THEME_OPTIONS.map((opt) => (
                    <div
                      key={opt.value}
                      className={`settings-theme-item ${selectedTheme === opt.value ? "selected" : ""}`}
                      onClick={() => setSelectedTheme(opt.value)}
                    >
                      <div className="settings-theme-preview" data-theme={opt.value}>
                        <div className="settings-theme-preview-titlebar">
                          <span className="settings-theme-preview-dot close" />
                          <span className="settings-theme-preview-dot minimize" />
                          <span className="settings-theme-preview-title">Window</span>
                        </div>
                        <div className="settings-theme-preview-body" />
                      </div>
                      <div className="settings-theme-info">
                        <span className="settings-theme-name">{opt.name}</span>
                        <span className="settings-theme-desc">{opt.description}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {activeTab === "Desktop" && (
              <>
                {/* Monitor preview */}
                <div className="settings-monitor">
                  <div className="settings-monitor-frame">
                    <div className="settings-monitor-screen" style={getPreviewStyle()} />
                  </div>
                  <div className="settings-monitor-stand" />
                  <div className="settings-monitor-base" />
                </div>

                {/* Background list */}
                <div className="settings-section">
                  <label className="settings-label">Background:</label>
                  <div className="settings-bg-list">
                    {allBackgrounds.map((bg, i) => (
                      <div
                        key={i}
                        className={`settings-bg-item ${selectedBg === bg.value ? "selected" : ""}`}
                        onClick={() => setSelectedBg(bg.value)}
                      >
                        {bg.value.startsWith("color:") ? (
                          <span className="settings-bg-swatch" style={{ backgroundColor: bg.value.slice(6) }} />
                        ) : (
                          <span className="settings-bg-swatch" style={{ backgroundImage: `url(${bg.value})`, backgroundSize: "cover" }} />
                        )}
                        {bg.name}
                      </div>
                    ))}
                  </div>
                  <div className="settings-browse-row">
                    <button className="xp-button" onClick={() => fileInputRef.current?.click()}>
                      Browse...
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleBrowse}
                      className="hidden"
                    />
                    {currentSelection && (
                      <span className="settings-current-name">{currentSelection.name}</span>
                    )}
                  </div>
                </div>
              </>
            )}

            {activeTab !== "Themes" && activeTab !== "Desktop" && (
              <div className="settings-placeholder">
                <p>No settings available for this tab.</p>
              </div>
            )}
          </div>

          {/* Bottom buttons */}
          <div className="settings-buttons">
            <button className="xp-button" onClick={() => { playClick(); handleOk(); }}>OK</button>
            <button className="xp-button" onClick={() => { playClick(); closeSettingsWindow(); }}>Cancel</button>
            <button className="xp-button" onClick={() => { playClick(); handleApply(); }}>Apply</button>
          </div>
        </div>
      </div>
    </Rnd>
  );
}
