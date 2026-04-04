# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Windows XP-themed video collage app. Users add local video files that appear as draggable/resizable XP-style windows on a desktop with the classic Bliss wallpaper. Includes a taskbar, minimize/restore, play/pause, mute/unmute, and a vertical arrange feature.

## Commands

- `npm run dev` — start Vite dev server with HMR
- `npm run build` — typecheck with `tsc -b` then build with Vite
- `npm run lint` — ESLint
- `npm run preview` — preview production build

## Deployment

Deployed to Cloudflare Pages via Wrangler. `wrangler.jsonc` serves the `./dist` directory as static assets.

## Architecture

React 19 + TypeScript + Vite + Tailwind CSS v4 (via `@tailwindcss/vite` plugin).

**State management:** All window state lives in `WindowsContext` (`src/context/WindowsContext.tsx`), exposed via the `useWindows()` hook. No external state library. The context manages a flat array of `VideoWindow` objects and provides actions (add, remove, update, minimize, restore, arrange, bring-to-front).

**Key types:** `VideoWindow` and `VideoWindowCreate` in `src/types/index.ts`.

**Components:** `Desktop` is the root layout (wallpaper, file input, empty state). `VideoWindow` wraps each video in a draggable/resizable XP window using `react-rnd`. `Taskbar` renders the bottom bar with window buttons.

**Styling:** Mix of Tailwind utility classes and custom CSS in `src/App.css` for XP-themed chrome (title bars, buttons, taskbar). The XP Bliss background is a static asset in `src/assets/`.

**Mobile support:** Responsive breakpoint at 768px — window sizing, positioning, and arrangement logic adapts for smaller screens.
