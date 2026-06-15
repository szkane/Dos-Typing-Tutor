import React from 'react';
import { RetroPalette } from '../types';

interface RetroKeyboardProps {
  palette: RetroPalette;
  nextChar: string | null;  // Next character to type (to highlight what fingers to use)
  pressedKeys: Record<string, boolean>; // Keys currently being held down
}

// Finger zones definition with colors and descriptive labels
// 1 = L Pinky (pink), 2 = L Ring (orange), 3 = L Middle (yellow), 4 = L Index (green)
// 5 = Thumbs (blue/slate), 6 = R Index (teal), 7 = R Middle (indigo), 8 = R Ring (purple), 9 = R Pinky (violet)
const FINGER_ZONES: Record<string, { zone: number; colorClass: string; fingerName: string }> = {
  // Numbers
  '1': { zone: 1, colorClass: 'border-pink-500 text-pink-500 bg-pink-500/10', fingerName: 'Left Pinky' },
  '2': { zone: 2, colorClass: 'border-orange-500 text-orange-500 bg-orange-500/10', fingerName: 'Left Ring' },
  '3': { zone: 3, colorClass: 'border-yellow-500 text-yellow-500 bg-yellow-500/10', fingerName: 'Left Middle' },
  '4': { zone: 4, colorClass: 'border-green-500 text-green-500 bg-green-500/10', fingerName: 'Left Index' },
  '5': { zone: 4, colorClass: 'border-green-500 text-green-500 bg-green-500/10', fingerName: 'Left Index' },
  '6': { zone: 6, colorClass: 'border-teal-500 text-teal-500 bg-teal-500/10', fingerName: 'Right Index' },
  '7': { zone: 6, colorClass: 'border-teal-500 text-teal-500 bg-teal-500/10', fingerName: 'Right Index' },
  '8': { zone: 7, colorClass: 'border-indigo-500 text-indigo-500 bg-indigo-500/10', fingerName: 'Right Middle' },
  '9': { zone: 8, colorClass: 'border-purple-500 text-purple-500 bg-purple-500/10', fingerName: 'Right Ring' },
  '0': { zone: 9, colorClass: 'border-violet-500 text-violet-500 bg-violet-500/10', fingerName: 'Right Pinky' },
  '-': { zone: 9, colorClass: 'border-violet-500 text-violet-500 bg-violet-500/10', fingerName: 'Right Pinky' },
  '=': { zone: 9, colorClass: 'border-violet-500 text-violet-500 bg-violet-500/10', fingerName: 'Right Pinky' },

  // Row 1
  'q': { zone: 1, colorClass: 'border-pink-500 text-pink-500 bg-pink-500/10', fingerName: 'Left Pinky' },
  'w': { zone: 2, colorClass: 'border-orange-500 text-orange-500 bg-orange-500/10', fingerName: 'Left Ring' },
  'e': { zone: 3, colorClass: 'border-yellow-500 text-yellow-500 bg-yellow-500/10', fingerName: 'Left Middle' },
  'r': { zone: 4, colorClass: 'border-green-500 text-green-500 bg-green-500/10', fingerName: 'Left Index' },
  't': { zone: 4, colorClass: 'border-green-500 text-green-500 bg-green-500/10', fingerName: 'Left Index' },
  'y': { zone: 6, colorClass: 'border-teal-500 text-teal-500 bg-teal-500/10', fingerName: 'Right Index' },
  'u': { zone: 6, colorClass: 'border-teal-500 text-teal-500 bg-teal-500/10', fingerName: 'Right Index' },
  'i': { zone: 7, colorClass: 'border-indigo-500 text-indigo-500 bg-indigo-500/10', fingerName: 'Right Middle' },
  'o': { zone: 8, colorClass: 'border-purple-500 text-purple-500 bg-purple-500/10', fingerName: 'Right Ring' },
  'p': { zone: 9, colorClass: 'border-violet-500 text-violet-500 bg-violet-500/10', fingerName: 'Right Pinky' },
  '[': { zone: 9, colorClass: 'border-violet-500 text-violet-500 bg-violet-500/10', fingerName: 'Right Pinky' },
  ']': { zone: 9, colorClass: 'border-violet-500 text-violet-500 bg-violet-500/10', fingerName: 'Right Pinky' },
  '\\': { zone: 9, colorClass: 'border-violet-500 text-violet-500 bg-violet-500/10', fingerName: 'Right Pinky' },

  // Row 2
  'a': { zone: 1, colorClass: 'border-pink-500 text-pink-500 bg-pink-500/10', fingerName: 'Left Pinky' },
  's': { zone: 2, colorClass: 'border-orange-500 text-orange-500 bg-orange-500/10', fingerName: 'Left Ring' },
  'd': { zone: 3, colorClass: 'border-yellow-500 text-yellow-500 bg-yellow-500/10', fingerName: 'Left Middle' },
  'f': { zone: 4, colorClass: 'border-green-500 text-green-500 bg-green-500/10', fingerName: 'Left Index' },
  'g': { zone: 4, colorClass: 'border-green-500 text-green-500 bg-green-500/10', fingerName: 'Left Index' },
  'h': { zone: 6, colorClass: 'border-teal-500 text-teal-500 bg-teal-500/10', fingerName: 'Right Index' },
  'j': { zone: 6, colorClass: 'border-teal-500 text-teal-500 bg-teal-500/10', fingerName: 'Right Index' },
  'k': { zone: 7, colorClass: 'border-indigo-500 text-indigo-500 bg-indigo-500/10', fingerName: 'Right Middle' },
  'l': { zone: 8, colorClass: 'border-purple-500 text-purple-500 bg-purple-500/10', fingerName: 'Right Ring' },
  ';': { zone: 9, colorClass: 'border-violet-500 text-violet-500 bg-violet-500/10', fingerName: 'Right Pinky' },
  "'": { zone: 9, colorClass: 'border-violet-500 text-violet-500 bg-violet-500/10', fingerName: 'Right Pinky' },

  // Row 3
  'z': { zone: 1, colorClass: 'border-pink-500 text-pink-500 bg-pink-500/10', fingerName: 'Left Pinky' },
  'x': { zone: 2, colorClass: 'border-orange-500 text-orange-500 bg-orange-500/10', fingerName: 'Left Ring' },
  'c': { zone: 3, colorClass: 'border-yellow-500 text-yellow-500 bg-yellow-500/10', fingerName: 'Left Middle' },
  'v': { zone: 4, colorClass: 'border-green-500 text-green-500 bg-green-500/10', fingerName: 'Left Index' },
  'b': { zone: 4, colorClass: 'border-green-500 text-green-500 bg-green-500/10', fingerName: 'Left Index' },
  'n': { zone: 6, colorClass: 'border-teal-500 text-teal-500 bg-teal-500/10', fingerName: 'Right Index' },
  'm': { zone: 6, colorClass: 'border-teal-500 text-teal-500 bg-teal-500/10', fingerName: 'Right Index' },
  ',': { zone: 7, colorClass: 'border-indigo-500 text-indigo-500 bg-indigo-500/10', fingerName: 'Right Middle' },
  '.': { zone: 8, colorClass: 'border-purple-500 text-purple-500 bg-purple-500/10', fingerName: 'Right Ring' },
  '/': { zone: 9, colorClass: 'border-violet-500 text-violet-500 bg-violet-500/10', fingerName: 'Right Pinky' },

  // Base spacer
  ' ': { zone: 5, colorClass: 'border-slate-500 text-slate-400 bg-slate-500/10', fingerName: 'Thumbs' }
};

interface KeyItem {
  id: string;             // Identification
  label: string;          // Key label on keyboard
  width: string;          // Tailwind width class
  rowSpan?: boolean;      // For return/other large keys
  code: string;           // code used for mapping physical keyboard event.code
}

export default function RetroKeyboard({ palette, nextChar, pressedKeys }: RetroKeyboardProps) {
  // Map nextChar to standard codes for highlighting
  const currentNextChar = nextChar ? nextChar.toLowerCase() : null;
  const isCapital = nextChar && (nextChar !== currentNextChar || !!nextChar.match(/[~!@#$%^&*()_+{}|:"<>?]/));

  // Shifted symbol mappings to their respective physical base keys
  const symMap: Record<string, string> = {
    '!': '1', '@': '2', '#': '3', '$': '4', '%': '5', '^': '6', '&': '7', '*': '8', '(': '9', ')': '0',
    '_': '-', '+': '=', '{': '[', '}': ']', '|': '\\', ':': ';', '"': '\'', '<': ',', '>': '.', '?': '/'
  };

  const baseNextChar = (currentNextChar && symMap[currentNextChar]) ? symMap[currentNextChar] : currentNextChar;

  // Determine physical keys to highlight
  const activeTargets: string[] = [];
  if (baseNextChar !== null) {
    if (baseNextChar === ' ') {
      activeTargets.push('space');
    } else {
      activeTargets.push(baseNextChar);
    }

    if (isCapital) {
      // Find which shift key to use (opposite hand rule ideally, or default left shift)
      // If key is typed with left hand (zones 1-4), use Right Shift.
      const fingerInfo = FINGER_ZONES[baseNextChar];
      if (fingerInfo && fingerInfo.zone <= 4) {
        activeTargets.push('rshift');
      } else {
        activeTargets.push('lshift');
      }
    }
  }

  // Key Definition Mapping
  const rows: KeyItem[][] = [
    [
      { id: '`', label: '~ `', width: 'w-[6.5%]', code: 'backquote' },
      { id: '1', label: '! 1', width: 'w-[6.5%]', code: 'digit1' },
      { id: '2', label: '@ 2', width: 'w-[6.5%]', code: 'digit2' },
      { id: '3', label: '# 3', width: 'w-[6.5%]', code: 'digit3' },
      { id: '4', label: '$ 4', width: 'w-[6.5%]', code: 'digit4' },
      { id: '5', label: '% 5', width: 'w-[6.5%]', code: 'digit5' },
      { id: '6', label: '^ 6', width: 'w-[6.5%]', code: 'digit6' },
      { id: '7', label: '& 7', width: 'w-[6.5%]', code: 'digit7' },
      { id: '8', label: '* 8', width: 'w-[6.5%]', code: 'digit8' },
      { id: '9', label: '( 9', width: 'w-[6.5%]', code: 'digit9' },
      { id: '0', label: ') 0', width: 'w-[6.5%]', code: 'digit0' },
      { id: '-', label: '_ -', width: 'w-[6.5%]', code: 'minus' },
      { id: '=', label: '+ =', width: 'w-[6.5%]', code: 'equal' },
      { id: 'backspace', label: '← BACK', width: 'w-[14.5%]', code: 'backspace' },
    ],
    [
      { id: 'tab', label: 'TAB', width: 'w-[10%]', code: 'tab' },
      { id: 'q', label: 'Q', width: 'w-[6.5%]', code: 'keyq' },
      { id: 'w', label: 'W', width: 'w-[6.5%]', code: 'keyw' },
      { id: 'e', label: 'E', width: 'w-[6.5%]', code: 'keye' },
      { id: 'r', label: 'R', width: 'w-[6.5%]', code: 'keyr' },
      { id: 't', label: 'T', width: 'w-[6.5%]', code: 'keyt' },
      { id: 'y', label: 'Y', width: 'w-[6.5%]', code: 'keyy' },
      { id: 'u', label: 'U', width: 'w-[6.5%]', code: 'keyu' },
      { id: 'i', label: 'I', width: 'w-[6.5%]', code: 'keyi' },
      { id: 'o', label: 'O', width: 'w-[6.5%]', code: 'keyo' },
      { id: 'p', label: 'P', width: 'w-[6.5%]', code: 'keyp' },
      { id: '[', label: '{ [', width: 'w-[6.5%]', code: 'bracketleft' },
      { id: ']', label: '} ]', width: 'w-[6.5%]', code: 'bracketright' },
      { id: '\\', label: '| \\', width: 'w-[11%]', code: 'backslash' },
    ],
    [
      { id: 'caps', label: 'CAPS', width: 'w-[12%]', code: 'capslock' },
      { id: 'a', label: 'A', width: 'w-[6.5%]', code: 'keya' },
      { id: 's', label: 'S', width: 'w-[6.5%]', code: 'keys' },
      { id: 'd', label: 'D', width: 'w-[6.5%]', code: 'keyd' },
      { id: 'f', label: 'F', width: 'w-[6.5%]', code: 'keyf' },
      { id: 'g', label: 'G', width: 'w-[6.5%]', code: 'keyg' },
      { id: 'h', label: 'H', width: 'w-[6.5%]', code: 'keyh' },
      { id: 'j', label: 'J', width: 'w-[6.5%]', code: 'keyj' },
      { id: 'k', label: 'K', width: 'w-[6.5%]', code: 'keyk' },
      { id: 'l', label: 'L', width: 'w-[6.5%]', code: 'keyl' },
      { id: ';', label: ': ;', width: 'w-[6.5%]', code: 'semicolon' },
      { id: '\'', label: '" \'', width: 'w-[6.5%]', code: 'quote' },
      { id: 'enter', label: 'ENTER ↵', width: 'w-[16.5%]', code: 'enter' },
    ],
    [
      { id: 'lshift', label: 'SHIFT ⇧', width: 'w-[15%]', code: 'shiftleft' },
      { id: 'z', label: 'Z', width: 'w-[6.5%]', code: 'keyz' },
      { id: 'x', label: 'X', width: 'w-[6.5%]', code: 'keyx' },
      { id: 'c', label: 'C', width: 'w-[6.5%]', code: 'keyc' },
      { id: 'v', label: 'V', width: 'w-[6.5%]', code: 'keyv' },
      { id: 'b', label: 'B', width: 'w-[6.5%]', code: 'keyb' },
      { id: 'n', label: 'N', width: 'w-[6.5%]', code: 'keyn' },
      { id: 'm', label: 'M', width: 'w-[6.5%]', code: 'keym' },
      { id: ',', label: '< ,', width: 'w-[6.5%]', code: 'comma' },
      { id: '.', label: '> .', width: 'w-[6.5%]', code: 'period' },
      { id: '/', label: '? /', width: 'w-[6.5%]', code: 'slash' },
      { id: 'rshift', label: 'SHIFT ⇧', width: 'w-[19.5%]', code: 'shiftright' },
    ],
    [
      { id: 'ctrl', label: 'CTRL', width: 'w-[11%]', code: 'controlleft' },
      { id: 'alt', label: 'ALT', width: 'w-[11%]', code: 'altleft' },
      { id: 'space', label: 'SPACEBAR', width: 'w-[56%]', code: 'space' },
      { id: 'alt', label: 'ALT', width: 'w-[11%]', code: 'altright' },
      { id: 'ctrl', label: 'CTRL', width: 'w-[11%]', code: 'controlright' },
    ]
  ];

  // Helper to determine key styling status
  const getKeyStatus = (key: KeyItem) => {
    // 1. Is physically held down by player?
    const isPhysicallyPressed = pressedKeys[key.code];

    // 2. Is targeted/next key to be typed?
    const isTarget = activeTargets.includes(key.id);

    return { isPhysicallyPressed, isTarget };
  };

  // Find next hand guide text
  const nextFingerInfo = baseNextChar ? FINGER_ZONES[baseNextChar] : null;

  return (
    <div 
      className="p-3 rounded-lg border-2" 
      style={{ 
        backgroundColor: palette.keyboardBg, 
        borderColor: palette.border 
      }}
      id="retro-keyboard-container"
    >
      {/* Keyboard Hand Guide Prompt */}
      {nextFingerInfo && (
        <div 
          className="mb-2 text-center text-xs font-mono uppercase tracking-wide py-1 border-b"
          style={{ borderColor: palette.border + '33', color: palette.textMuted }}
        >
          Finger Guide:{' '}
          <span 
            className="font-bold px-2 py-0.5 rounded ml-1 bg-black/30 border" 
            style={{ 
              color: palette.accent,
              borderColor: palette.accent + '55'
            }}
          >
            {nextFingerInfo.fingerName}
          </span>
        </div>
      )}

      {/* Main QWERTY Layout Grid */}
      <div className="flex flex-col gap-1 w-full max-w-4xl mx-autoSelect-none select-none">
        {rows.map((row, rIndex) => (
          <div key={rIndex} className="flex justify-between gap-1 w-full">
            {row.map((key) => {
              const { isPhysicallyPressed, isTarget } = getKeyStatus(key);
              const finger = FINGER_ZONES[key.id];

              // Base Styling configuration
              let keyBg = palette.keyDefaultBg;
              let keyBorderColor = palette.border;
              let keyTextColor = palette.text;
              let keyShadowClass = 'border-b-4 border-r-4';
              let translateClass = '';

              if (isPhysicallyPressed) {
                // Active down press (pushes key down visually)
                keyBg = palette.accent;
                keyTextColor = palette.keyboardBg;
                keyBorderColor = palette.accent;
                keyShadowClass = 'border-b border-r select-none mt-[3px] mr-[3px] mb-[-3px] ml-[-3px]';
              } else if (isTarget) {
                // Flash / Highlight target key
                keyBg = palette.panelBg;
                keyTextColor = palette.accent;
                keyBorderColor = palette.accent;
                keyShadowClass = 'border-b-4 border-r-4 shadow-[0_0_10px_rgba(255,255,255,0.2)] animate-pulse';
              }

              // Apply finger indicator dot for touch zones
              const fingerDotColor = finger ? finger.colorClass.split(' ')[1] : '';

              return (
                <div
                  key={key.code}
                  className={`
                    h-10 text-[10px] md:text-xs font-mono flex flex-col justify-between items-center p-1.5 rounded cursor-default
                    transition-all duration-75 relative select-none
                    ${key.width} ${keyShadowClass} ${translateClass}
                  `}
                  style={{
                    backgroundColor: keyBg,
                    color: keyTextColor,
                    borderColor: keyBorderColor
                  }}
                  id={`key-${key.code}`}
                >
                  {/* Subtle fingerprint circle representing zone colors */}
                  {finger && !isPhysicallyPressed && (
                    <div className="absolute top-1 right-1 flex items-center justify-center">
                      <div className={`w-1.5 h-1.5 rounded-full border border-current opacity-70`} />
                    </div>
                  )}

                  {/* Keyboard key labeling */}
                  <span className="font-semibold select-none leading-none w-full text-left">
                    {key.label}
                  </span>

                  {/* Finger code label footer */}
                  {isTarget && !isPhysicallyPressed && (
                    <span className="text-[7px] leading-none text-right w-full select-none" style={{ color: palette.accent }}>
                      TAP
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Retro bottom spacing legend */}
      <div className="flex justify-around items-center mt-3 text-[10px] font-mono text-center opacity-60">
        <div className="flex gap-2 items-center flex-wrap justify-center">
          <span className="font-bold uppercase text-[9px]">FINGER MAP:</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-pink-500" /> Pinky</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500" /> Ring</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500" /> Middle</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> Index</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-500" /> Thumbs</span>
        </div>
      </div>
    </div>
  );
}
