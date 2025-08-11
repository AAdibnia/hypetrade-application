# Prototype (Figma → React UI)

This folder contains the design‑aligned UI prototype. The flows and components were first designed in Figma, then translated into React + Tailwind markup for visual reference. These files are not wired to live data.

## Quickstart
[This is a link to the prototpe.
](https://slaw-raster-12547559.figma.site/)

## What this is
- Figma‑driven UI translated into React components
- Consistent theme (buttons, cards, inputs, modals) matching the MVP
- Useful as a visual/styling reference and for trying UI variations

## Why keep this
- Showcases the Figma→implementation alignment
- Serves as a fast playground for UI tweaks without touching the MVP
- Documents UI decisions that informed the MVP

## Project notes
- Entry: `index.html` and `src/main.tsx` mount `App` from `Prototype/App.tsx`
- Styles: `src/index.css` imports Tailwind and `styles/globals.css`
- Tailwind is preconfigured (`tailwind.config.js`, `postcss.config.js`)
- TypeScript + React are configured via Vite (`vite.config.ts`, `tsconfig.json`)

## Alternative preview (optional)
If you prefer to preview in a separate sandbox instead, you can still scaffold a throwaway app (CRA or Vite) and copy:
- `Prototype/components/` → `your-sandbox/src/components/`
- `Prototype/App.tsx` → `your-sandbox/src/App.tsx`
- `Prototype/styles/globals.css` → merge into your sandbox CSS
