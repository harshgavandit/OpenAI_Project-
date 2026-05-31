/**
 * Keyboard Shortcuts Hook
 * Complete keyboard shortcut system for maximum judge wow factor
 */

import { useEffect, useRef } from "react";

interface KeyboardShortcuts {
  showDemo: () => void;
  showSearch: () => void;
  showGraph: () => void;
  showTimeMachine: () => void;
  focusSearch: () => void;
  toggleDarkMode: () => void;
  showHelp: () => void;
  downloadData: () => void;
  createShare: () => void;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcuts) {
  const shortcutsRef = useRef(shortcuts);

  useEffect(() => {
    shortcutsRef.current = shortcuts;
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const handlers = shortcutsRef.current;
      // Cmd/Ctrl based shortcuts
      if (e.metaKey || e.ctrlKey) {
        switch (e.key.toLowerCase()) {
          case "k":
            e.preventDefault();
            handlers.showDemo();
            break;
          case "j":
            e.preventDefault();
            handlers.showGraph();
            break;
          case "s":
            e.preventDefault();
            handlers.showSearch();
            break;
          case "t":
            e.preventDefault();
            handlers.showTimeMachine();
            break;
          case "/":
            e.preventDefault();
            handlers.focusSearch();
            break;
          case "?":
            e.preventDefault();
            handlers.showHelp();
            break;
          case "e":
            e.preventDefault();
            handlers.downloadData();
            break;
          case "l":
            e.preventDefault();
            handlers.createShare();
            break;
          default:
            break;
        }
      }

      // Option/Alt based shortcuts
      if (e.altKey) {
        switch (e.key.toLowerCase()) {
          case "d":
            e.preventDefault();
            handlers.toggleDarkMode();
            break;
          default:
            break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
}

export const KEYBOARD_SHORTCUTS = [
  { keys: "Cmd/Ctrl+K", action: "Load Demo Mode", icon: "🎯" },
  { keys: "Cmd/Ctrl+J", action: "Show Graph", icon: "🔗" },
  { keys: "Cmd/Ctrl+S", action: "Show Search", icon: "🔍" },
  { keys: "Cmd/Ctrl+T", action: "Time Machine", icon: "⏰" },
  { keys: "Cmd/Ctrl+/", action: "Focus Search", icon: "🎯" },
  { keys: "Cmd/Ctrl+?", action: "Show Help", icon: "❓" },
  { keys: "Cmd/Ctrl+E", action: "Export Data", icon: "📥" },
  { keys: "Cmd/Ctrl+L", action: "Create Share", icon: "🔗" },
  { keys: "Alt+D", action: "Toggle Dark Mode", icon: "🌙" },
];

interface KeyboardHelpProps {
  onClose: () => void;
}

export function KeyboardHelp({ onClose }: KeyboardHelpProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-2xl bg-white dark:bg-[#1e1f24] rounded-2xl shadow-2xl p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-[#1e1f24] dark:text-white">
            ⌨️ Keyboard Shortcuts
          </h2>
          <button
            onClick={onClose}
            className="text-[#9b9b9b] hover:text-[#1e1f24] dark:hover:text-white text-2xl"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {KEYBOARD_SHORTCUTS.map((shortcut, i) => (
            <div
              key={i}
              className="p-4 bg-[#fbfcff] dark:bg-[#2d2e35] border border-[#d7dde8] dark:border-[#3f4148] rounded-lg flex items-center gap-3"
            >
              <span className="text-2xl">{shortcut.icon}</span>
              <div>
                <p className="font-mono text-sm font-bold text-[#3b82f6]">
                  {shortcut.keys}
                </p>
                <p className="text-sm text-[#686a71] dark:text-[#b9c3d4]">
                  {shortcut.action}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-900 rounded-lg text-sm text-amber-900 dark:text-amber-100">
          💡 Pro Tip: Use these shortcuts during the demo to show judges your mastery of the app!
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 px-4 py-2 bg-[#3b82f6] text-white font-semibold rounded-lg hover:bg-[#2563eb] transition"
        >
          Close
        </button>
      </div>
    </div>
  );
}
