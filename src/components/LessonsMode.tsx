import React, { useState, useEffect, useRef } from 'react';
import { Lesson, RetroPalette, TypistStats } from '../types';
import { LESSONS } from '../lessons';
import { synth } from '../audio';
import RetroKeyboard from './RetroKeyboard';

interface LessonsModeProps {
  palette: RetroPalette;
  onSaveScore: (wpm: number, accuracy: number, category: string) => void;
}

export default function LessonsMode({ palette, onSaveScore }: LessonsModeProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('Home Row');
  const [activeLesson, setActiveLesson] = useState<Lesson>(LESSONS[0]);
  const [charIndex, setCharIndex] = useState<number>(0);
  const [errorCount, setErrorCount] = useState<number>(0);
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  
  // Keep track of pressed keys for the keyboard visualizer
  const [pressedKeys, setPressedKeys] = useState<Record<string, boolean>>({});

  // Help guides
  const [showKeyboard, setShowKeyboard] = useState<boolean>(true);
  const [showHandGuide, setShowHandGuide] = useState<boolean>(true);

  // Focus reference
  const inputRef = useRef<HTMLInputElement>(null);

  // Extract unique categories
  const categories = Array.from(new Set(LESSONS.map(l => l.category)));

  // Load selected lesson
  const startLesson = (lesson: Lesson) => {
    setActiveLesson(lesson);
    setCharIndex(0);
    setErrorCount(0);
    setCorrectCount(0);
    setStartTime(null);
    setElapsedTime(0);
    setIsCompleted(false);
    setPressedKeys({});
    setTimeout(() => {
      focusInput();
    }, 50);
  };

  const focusInput = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Timer run loop
  useEffect(() => {
    if (startTime === null || isCompleted) return;

    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setElapsedTime(elapsed || 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [startTime, isCompleted]);

  // Handle keys physically pressed down (for mapping and audio triggering)
  useEffect(() => {
    const handlePhysicalKeyDown = (e: KeyboardEvent) => {
      const code = e.code.toLowerCase();
      setPressedKeys(prev => ({ ...prev, [code]: true }));
      
      // Auto focus the input if typing on page
      if (document.activeElement !== inputRef.current && !e.ctrlKey && !e.metaKey && e.key.length === 1) {
        focusInput();
      }
    };

    const handlePhysicalKeyUp = (e: KeyboardEvent) => {
      const code = e.code.toLowerCase();
      setPressedKeys(prev => ({ ...prev, [code]: false }));
    };

    window.addEventListener('keydown', handlePhysicalKeyDown);
    window.addEventListener('keyup', handlePhysicalKeyUp);

    return () => {
      window.removeEventListener('keydown', handlePhysicalKeyDown);
      window.removeEventListener('keyup', handlePhysicalKeyUp);
    };
  }, []);

  // Handle typing input matching
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isCompleted) return;

    const typedVal = e.target.value;
    if (!typedVal) return;

    // We only process the last character entered
    const charTyped = typedVal[typedVal.length - 1];
    
    // Clear the input so it ready for the next keypress
    e.target.value = '';

    // Initialize timer on first keypress
    let currentStartTime = startTime;
    if (startTime === null) {
      currentStartTime = Date.now();
      setStartTime(currentStartTime);
    }

    const expectedChar = activeLesson.text[charIndex];

    if (charTyped === expectedChar) {
      // Correct!
      const nextIndex = charIndex + 1;
      setCharIndex(nextIndex);
      setCorrectCount(prev => prev + 1);
      
      // Keystroke clack Sound
      synth.playClick(charTyped === ' ');

      // Check if finished
      if (nextIndex >= activeLesson.text.length) {
        setIsCompleted(true);
        synth.playVictory();
        
        // Save the results
        const seconds = Math.max(1, Math.floor((Date.now() - (currentStartTime || Date.now())) / 1000));
        const finalWpm = Math.round(((nextIndex) / 5) / (seconds / 60));
        const finalAcc = Math.max(0, Math.min(100, Math.round(((nextIndex - errorCount) / nextIndex) * 100)));
        onSaveScore(finalWpm, finalAcc, `${activeLesson.title}`);
      }
    } else {
      // Mistake!
      setErrorCount(prev => prev + 1);
      synth.playError();
    }
  };

  // Real-time calculation functions
  const totalTyped = correctCount + errorCount;
  const currentAccuracy = totalTyped > 0 
    ? Math.max(0, Math.min(100, Math.round(((totalTyped - errorCount) / totalTyped) * 100))) 
    : 100;

  // WPM calculated standard: (all typed correct keys / 5) / minutes elapsed
  const activeWpm = elapsedTime > 0
    ? Math.round((correctCount / 5) / (elapsedTime / 60))
    : 0;

  // Progress Bar drawing helper
  const drawProgressBar = () => {
    const total = activeLesson.text.length;
    const progressPercent = Math.round((charIndex / total) * 100);
    const bars = Math.round(progressPercent / 5); // 20 character length bars
    const space = 20 - bars;
    const filled = '█'.repeat(bars);
    const hollow = '░'.repeat(space);
    return `[${filled}${hollow}] ${progressPercent}%`;
  };

  return (
    <div className="flex flex-col gap-4 select-none">
      
      {/* Invisible Input for typing capture */}
      <input
        ref={inputRef}
        type="text"
        className="absolute top-[-100px] left-[-100px] opacity-0"
        onChange={handleInputChange}
        onBlur={() => {
          // Keep focus if game is active or user clicks panel
        }}
        autoComplete="off"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
      />

      {/* Main lesson pane split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left Side: Lessons List / Categorized Selector */}
        <div 
          className="lg:col-span-4 p-4 border-2 rounded-lg flex flex-col justify-between"
          style={{ borderColor: palette.border, backgroundColor: palette.panelBg }}
        >
          <div>
            <div className="text-center font-black text-xs uppercase mb-4 py-1 select-none border border-black shadow-[2px_2px_0_0_rgba(0,0,0,0.5)]" style={{ backgroundColor: palette.textMuted, color: '#000000' }}>
              LESSON_DIRECTORY
            </div>
            
            {/* Category tabs */}
            <div className="flex flex-wrap gap-1 mb-3">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setSelectedCategory(cat);
                    const list = LESSONS.filter(l => l.category === cat);
                    if (list.length > 0) startLesson(list[0]);
                  }}
                  className="px-2 py-1 text-2xs md:text-xs font-mono border rounded uppercase cursor-pointer"
                  style={{
                    backgroundColor: selectedCategory === cat ? palette.accent : 'transparent',
                    color: selectedCategory === cat ? palette.keyboardBg : palette.text,
                    borderColor: palette.border
                  }}
                  id={`cat-btn-${cat.toLowerCase().replace(/\s/g, '-')}`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Lessons matching current category */}
            <div className="space-y-1.5 max-h-[280px] overflow-y-auto scrollbar-thin">
              {LESSONS.filter(l => l.category === selectedCategory).map((les) => {
                const isActive = activeLesson.id === les.id;
                return (
                  <button
                    key={les.id}
                    onClick={() => startLesson(les)}
                    className="w-full text-left font-mono p-2 border rounded transition-all duration-100 flex flex-col cursor-pointer"
                    style={{
                      borderColor: isActive ? palette.accent : palette.border + '33',
                      backgroundColor: isActive ? palette.keyboardBg : 'transparent'
                    }}
                    id={`lesson-item-${les.id}`}
                  >
                    <span 
                      className="text-xs font-bold uppercase truncate" 
                      style={{ color: isActive ? palette.accent : palette.text }}
                    >
                      {isActive ? '► ' : ''}{les.title}
                    </span>
                    <span className="text-[10px] line-clamp-2" style={{ color: palette.textMuted }}>
                      {les.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick instructions block */}
          <div className="mt-4 pt-3 border-t text-[10px] md:text-xs font-mono text-center md:text-left" style={{ borderColor: palette.border + '22', color: palette.textMuted }}>
            <p>⌨ Type normally to match characters.</p>
            <p className="mt-1">💡 Keep eyes on screen, resting hands on <span className="underline font-bold">ASDF</span> and <span className="underline font-bold">JKL;</span></p>
          </div>
        </div>

        {/* Right Side: Active Terminal Panel */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          
          <div 
            className="p-4 border-2 rounded-lg flex-1 flex flex-col justify-between"
            style={{ borderColor: palette.border, backgroundColor: palette.panelBg }}
            onClick={focusInput}
          >
            <div className="text-center font-black text-xs uppercase mb-4 py-1 select-none border border-black shadow-[2px_2px_0_0_rgba(0,0,0,0.5)]" style={{ backgroundColor: palette.accent, color: '#000000' }}>
              ACTIVE_TYPING_CHAMBER
            </div>
            {/* Active Header Prompt */}
            <div className="flex justify-between items-center border-b pb-2 mb-3" style={{ borderColor: palette.border + '33' }}>
              <div>
                <span className="text-xs font-mono uppercase tracking-wider font-bold" style={{ color: palette.textBright }}>
                  TUTOR MODULE: &quot;{activeLesson.title}&quot;
                </span>
                <p className="text-[10px] font-mono mt-0.5" style={{ color: palette.textMuted }}>
                  {activeLesson.description}
                </p>
              </div>

              {/* Focus warning blinking indicator */}
              <div 
                className="text-[10px] md:text-xs font-mono px-2 py-0.5 uppercase border rounded animate-pulse cursor-pointer select-none"
                style={{ borderColor: palette.accent, color: palette.accent }}
                onClick={focusInput}
              >
                ● CAPTURING FOCUS
              </div>
            </div>

            {/* Core Typing Window Frame */}
            <div 
              className="p-4 rounded border-2 font-mono text-sm md:text-base leading-relaxed tracking-wide min-h-[140px] flex items-center relative overflow-hidden"
              style={{ backgroundColor: palette.keyboardBg, borderColor: palette.border + '55' }}
            >
              {isCompleted ? (
                /* Victory Stats Pane inside screen */
                <div className="w-full text-center py-4">
                  <h3 className="text-lg md:text-xl font-bold uppercase mb-2 animate-bounce" style={{ color: palette.accent }}>
                    ╔════════ LESSON COMPLETED! ════════╗
                  </h3>
                  <div className="grid grid-cols-3 gap-2 max-w-sm mx-auto my-3 text-xs md:text-sm">
                    <div className="p-2 border rounded">
                      <div style={{ color: palette.textMuted }}>SPEED</div>
                      <div className="text-lg font-bold" style={{ color: palette.textBright }}>{activeWpm} WPM</div>
                    </div>
                    <div className="p-2 border rounded">
                      <div style={{ color: palette.textMuted }}>ACCURACY</div>
                      <div className="text-lg font-bold" style={{ color: palette.textBright }}>{currentAccuracy}%</div>
                    </div>
                    <div className="p-2 border rounded">
                      <div style={{ color: palette.textMuted }}>ERRORS</div>
                      <div className="text-lg font-bold" style={{ color: palette.textBright }}>{errorCount}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => startLesson(activeLesson)}
                    className="mt-2 px-4 py-1 border-2 font-mono uppercase font-bold text-xs hover:opacity-80 transition cursor-pointer"
                    style={{ backgroundColor: palette.accent, color: palette.keyboardBg, borderColor: palette.accent }}
                  >
                    [ PRACTICE AGAIN ]
                  </button>
                </div>
              ) : (
                /* Character Matrix displayer */
                <div className="w-full flex flex-wrap break-all items-center">
                  {activeLesson.text.split('').map((char, index) => {
                    let charStyle = {};
                    let charClass = '';

                    if (index < charIndex) {
                      // Correctly typed keys
                      charClass = 'opacity-50 font-medium';
                      charStyle = { color: palette.textBright };
                    } else if (index === charIndex) {
                      // Cursor target character
                      charClass = 'font-bold bg-white/10 border-b-2 select-none animate-[pulse_1.5s_infinite]';
                      charStyle = { 
                        backgroundColor: palette.accent + '33', 
                        color: palette.accent,
                        borderBottomColor: palette.accent
                      };
                    } else {
                      // Unreached pending letters
                      charClass = 'opacity-80';
                      charStyle = { color: palette.text };
                    }

                    // Render space with a light underline dot marker so they know to hit space!
                    return (
                      <span 
                        key={index} 
                        className={`transition-colors duration-75 inline font-mono ${charClass}`}
                        style={charStyle}
                      >
                        {char === ' ' ? (index === charIndex ? '⎵' : '\u00A0') : char}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Progress and Live statistics Panel */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center border-t pt-3" style={{ borderColor: palette.border + '22' }}>
              
              {/* Progress Text render */}
              <div className="sm:col-span-6 font-mono text-[11px] md:text-xs text-center sm:text-left" style={{ color: palette.textMuted }}>
                <div className="mb-0.5 uppercase">LESSON PROGRESS</div>
                <div className="font-bold tracking-tight">{drawProgressBar()}</div>
              </div>

              {/* Dynamic live metrics readouts */}
              <div className="sm:col-span-6 grid grid-cols-3 gap-2 font-mono text-center text-[10px] md:text-xs">
                <div>
                  <div style={{ color: palette.textMuted }}>SPEED</div>
                  <div className="font-bold" style={{ color: palette.textBright }}>{activeWpm} WPM</div>
                </div>
                <div>
                  <div style={{ color: palette.textMuted }}>ACCURACY</div>
                  <div className="font-bold" style={{ color: palette.textBright }}>{currentAccuracy}%</div>
                </div>
                <div>
                  <div style={{ color: palette.textMuted }}>TIME</div>
                  <div className="font-bold" style={{ color: palette.textBright }}>{elapsedTime}s</div>
                </div>
              </div>

            </div>

          </div>
          
        </div>

      </div>

      {/* Retro keyboard layout toggle guides */}
      <div className="flex flex-col gap-2 mt-2">
        <div className="flex justify-between items-center px-1">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-mono" style={{ color: palette.textMuted }}>
            <input 
              type="checkbox" 
              checked={showKeyboard} 
              onChange={(e) => setShowKeyboard(e.target.checked)} 
              className="rounded dark:bg-zinc-800"
            />
            SHOW VISUAL KEYBOARD ASSISTANCE
          </label>
        </div>

        {showKeyboard && (
          <RetroKeyboard 
            palette={palette} 
            nextChar={isCompleted ? null : activeLesson.text[charIndex]}
            pressedKeys={pressedKeys}
          />
        )}
      </div>

    </div>
  );
}
