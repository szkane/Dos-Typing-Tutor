import { RetroPalette } from './types';

export const RETRO_PALETTES: RetroPalette[] = [
  {
    name: 'classic-blue',
    label: 'Norton Blue (Classic)',
    bg: 'bg-[#0000AA]',
    text: '#ffffff',
    textBright: '#ffff55', // Yellow
    textMuted: '#55ffff',  // Cyan
    border: '#ffffff',     // White
    accent: '#55ff55',     // Bright Green
    panelBg: '#0000AA',
    panelText: '#ffffff',
    errorBg: '#aa0000',    // Solid red
    keyboardBg: '#000000', // Black inner stage background
    keyDefaultBg: '#000088',
    keyActiveBg: '#ffff55',
  },
  {
    name: 'green-phosphor',
    label: 'Green Phosphor VT100',
    bg: 'bg-[#051105]',
    text: '#33ff33',       // Retro green
    textBright: '#88ff88', // Glowing bright green
    textMuted: '#116611',  // Dark green
    border: '#33ff33',
    accent: '#aaffaa',     // Intense glowing white-green
    panelBg: '#081708',
    panelText: '#33ff33',
    errorBg: '#440000',
    keyboardBg: '#020702',
    keyDefaultBg: '#061a06',
    keyActiveBg: '#33ff33',
  },
  {
    name: 'amber-terminal',
    label: 'Amber Wyse CRT',
    bg: 'bg-[#140b00]',
    text: '#ff9900',       // Deep amber
    textBright: '#ffcc66', // Bright amber core
    textMuted: '#663b00',  // Dark copper amber
    border: '#ff9900',
    accent: '#ffcc22',     // Intense amber
    panelBg: '#1a0f00',
    panelText: '#ff9900',
    errorBg: '#4a0000',
    keyboardBg: '#0d0700',
    keyDefaultBg: '#1d1100',
    keyActiveBg: '#ff9900',
  },
  {
    name: 'cyberpunk',
    label: 'Cyber Arcade CGA',
    bg: 'bg-[#180024]',
    text: '#00ffff',       // Cyan
    textBright: '#ff00ff', // Magenta
    textMuted: '#880088',  // Purple
    border: '#ff00ff',
    accent: '#ffff00',     // Yellow accent
    panelBg: '#250235',
    panelText: '#00ffff',
    errorBg: '#ff0055',
    keyboardBg: '#100018',
    keyDefaultBg: '#29003c',
    keyActiveBg: '#00ffff',
  },
  {
    name: 'monochrome',
    label: 'Grayscale Mono IBM',
    bg: 'bg-[#121212]',
    text: '#f3f4f6',       // Bright gray
    textBright: '#ffffff', // Full white
    textMuted: '#6b7280',  // Muted gray
    border: '#9ca3af',
    accent: '#ffffff',
    panelBg: '#1f2937',
    panelText: '#f3f4f6',
    errorBg: '#374151',
    keyboardBg: '#030712',
    keyDefaultBg: '#1f2937',
    keyActiveBg: '#f3f4f6',
  }
];
