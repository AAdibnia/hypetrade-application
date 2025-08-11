# Prototype (Figma → React UI)

This folder contains the design‑aligned UI prototype. The flows and components were first designed in Figma, then translated into React + Tailwind markup for visual reference. These files are not wired to live data and do not include a build configuration.

## What this is
- Figma‑driven UI translated into React components
- Consistent theme (buttons, cards, inputs, modals) matching the MVP
- Useful as a visual/styling reference and for trying UI variations

## How to preview quickly (Create React App)
> This folder does not include its own package.json. The fastest way to preview is to scaffold a throwaway CRA and copy the files.

1. Create a new React app (TypeScript):
```bash
npx create-react-app prototype-preview --template typescript
cd prototype-preview
```
2. Install Tailwind CSS:
```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```
3. Configure Tailwind (tailwind.config.js):
```js
/** @type {import(tailwindcss).Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: { extend: {} },
  plugins: [],
}
```
4. Add Tailwind directives to `src/index.css` (replace file contents):
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```
5. Copy prototype files into your sandbox app:
- From this repo:
  - `Prototype/components/` → `prototype-preview/src/components/`
  - `Prototype/App.tsx` → `prototype-preview/src/App.tsx`
  - `Prototype/styles/globals.css` → append relevant rules into `prototype-preview/src/index.css` if needed

6. Start the preview:
```bash
npm start
```

Notes:
- The prototype uses Tailwind utility classes and simple headless UI patterns; no external UI library is required to view basic styling.
- Some components reference shadcn‑style class patterns; they are implemented as local components under `Prototype/components/ui/`.

## Why keep this
- Showcases the Figma→implementation alignment
- Serves as a fast playground for UI tweaks without touching the MVP
- Documents UI decisions that informed the MVP
