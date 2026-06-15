export interface Lesson {
  id: string;
  title: string;
  description: string;
  category: 'Home Row' | 'Middle & Top' | 'Numbers & Symbols' | 'Code & Special' | 'Custom Drill';
  text: string;
}

export interface ScoreEntry {
  playerName: string;
  wpm: number;
  accuracy: number;
  mode: string;
  subMode?: string;
  date: string;
}

export type RetroPaletteName = 'classic-blue' | 'green-phosphor' | 'amber-terminal' | 'cyberpunk' | 'monochrome';

export interface RetroPalette {
  name: RetroPaletteName;
  label: string;
  bg: string;          // Main background
  text: string;        // Main text
  textBright: string;  // Bold/Highlighted Text
  textMuted: string;   // Secondary text
  border: string;      // Window borders
  accent: string;      // Special markers (laser, gold, key presses)
  panelBg: string;     // Internal panels (e.g., text box background)
  panelText: string;   // Text inside panels
  errorBg: string;     // Failed characters / health red
  keyboardBg: string;  // Virtual keyboard base
  keyDefaultBg: string;// Default key color
  keyActiveBg: string; // Pressed key
}

export interface TypistStats {
  typedCount: number;
  errorCount: number;
  correctCount: number;
  timeSeconds: number;
  currentWpm: number;
  accuracy: number;
}
