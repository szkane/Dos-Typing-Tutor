import React, { useState, useEffect, useRef } from 'react';
import { RetroPalette } from '../types';
import { synth } from '../audio';

interface SpeedTestModeProps {
  palette: RetroPalette;
  onSaveScore: (wpm: number, accuracy: number, testMode: string) => void;
}

interface TextSample {
  id: string;
  title: string;
  subtitle: string;
  text: string;
}

const SAMPLES: TextSample[] = [
  {
    id: 'wonderland',
    title: 'Alice in Wonderland',
    subtitle: 'Classic Narrative - Balanced Prose',
    text: 'Alice was beginning to get very tired of sitting by her sister on the bank, and of having nothing to do: once or twice she had peeped into the book her sister was reading, but it had no pictures or conversations in it, "and what is the use of a book," thought Alice "without pictures or conversations?" so she was considering in her own mind whether the pleasure of making a daisy-chain would be worth the trouble.'
  },
  {
    id: 'cyber',
    title: 'The Cybernetic Frontier (1988)',
    subtitle: 'High-Density Sci-Fi Vocabulary',
    text: 'A cybernetic construct drifting inside the matrix represents the terminal interface. Users dial into BBS servers using telephone modems, establishing synchronized handshakes to exchange packets of ASCII information. The cathode ray tubes glow with monochromatic green phosphors, projecting glowing streams of code representing advanced algorithms'
  },
  {
    id: 'poe-raven',
    title: 'The Raven (Edgar Allan Poe)',
    subtitle: 'Poetic Flow with Punctuation Shakes',
    text: 'Once upon a midnight dreary, while I pondered, weak and weary, over many a quaint and curious volume of forgotten lore. While I nodded, nearly napping, suddenly there came a tapping, as of someone gently rapping, rapping at my chamber door. "Tis some visitor," I muttered, "tapping at my chamber door; only this and nothing more."'
  },
  {
    id: 'cli-manual',
    title: 'MS-DOS 5.0 Command Reference',
    subtitle: 'Symbols, Backslashes & File Paths',
    text: 'device=c:\\dos\\himem.sys /verbose; files=40; buffers=40; fastopen=c:=(50,25); autoexec.bat loaded with echo off; prompt $p$g; set temp=c:\\temp; cd c:\\games\\typetutor; type readme.txt | more; format a: /s /q /f:360'
  }
];

export default function SpeedTestMode({ palette, onSaveScore }: SpeedTestModeProps) {
  const [samples, setSamples] = useState<TextSample[]>(SAMPLES);
  const [selectedSampleId, setSelectedSampleId] = useState<string>('wonderland');
  const [duration, setDuration] = useState<number>(60); // Default 60s
  
  // Custom user upload prompt text
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);
  const [customText, setCustomText] = useState<string>('');

  // Active Typist state variables (Backspacing allowed!)
  const [gameState, setGameState] = useState<'idle' | 'running' | 'finished'>('idle');
  const [typedText, setTypedText] = useState<string>('');
  const [timeRemaining, setTimeRemaining] = useState<number>(60);
  const [wpmHistory, setWpmHistory] = useState<number[]>([]);
  const [errorLetters, setErrorLetters] = useState<Record<number, boolean>>({});

  const hiddenInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Load the active test paragraph text
  const getActiveText = (): string => {
    if (isCustomMode) {
      return customText.trim() || 'Type some text to generate your custom typing test drill...';
    }
    const sample = samples.find(s => s.id === selectedSampleId);
    return sample ? sample.text : SAMPLES[0].text;
  };

  const activeText = getActiveText();

  // Reset Speed Test configuration
  const setupTest = () => {
    setGameState('idle');
    setTypedText('');
    setTimeRemaining(duration);
    setWpmHistory([]);
    setErrorLetters({});
    setTimeout(() => {
      focusHiddenInput();
    }, 50);
  };

  const focusHiddenInput = () => {
    hiddenInputRef.current?.focus();
  };

  // Keyboard layout hooks representing backspace triggers
  const handleTypedInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const textVal = e.target.value;
    
    // Bounds limit matching source text length
    if (textVal.length > activeText.length) return;

    if (gameState === 'idle' && textVal.length === 1) {
      // Start test run
      setGameState('running');
      synth.playBootJingle();
    }

    // Intercept character and audit correctness
    const latestIndex = textVal.length - 1;
    if (latestIndex >= 0) {
      const isBackspace = textVal.length < typedText.length;
      
      if (isBackspace) {
        // Backspacing
        synth.playClick(true);
      } else {
        // Typing forward
        const typedChar = textVal[latestIndex];
        const correctChar = activeText[latestIndex];
        const ok = typedChar === correctChar;
        
        synth.playClick(typedChar === ' ');
        if (!ok) {
          synth.playError();
          setErrorLetters(prev => ({ ...prev, [latestIndex]: true }));
        }
      }
    }

    setTypedText(textVal);

    // Dynamic scroll cursor locator
    if (scrollContainerRef.current) {
      const activeCharNode = document.getElementById(`test-char-${textVal.length}`);
      if (activeCharNode) {
        activeCharNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  // Countdown timer loop
  useEffect(() => {
    if (gameState !== 'running') return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        const nextTime = prev - 1;
        
        // Save current WPM to timeline every 5 seconds for visual retro graph!
        const elapsed = duration - nextTime;
        if (elapsed % 5 === 0 && elapsed > 0) {
          const words = typedText.split(' ').length;
          const currentWpm = Math.round((words) / (elapsed / 60)) || 0;
          setWpmHistory(hist => [...hist, currentWpm]);
        }

        if (nextTime <= 0) {
          clearInterval(timer);
          finishTest();
          return 0;
        }
        return nextTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState, typedText, duration]);

  const finishTest = () => {
    setGameState('finished');
    synth.playVictory();

    // Final calculations
    const elapsedMinutes = duration / 60;
    const finalWords = typedText.trim().split(/\s+/).filter(w => w.length > 0).length;
    const finalWpm = Math.round(finalWords / elapsedMinutes) || 0;

    // Accuracy audit including error log
    const mistakeCount = Object.keys(errorLetters).length;
    const totalTypedCount = typedText.length;
    const finalAccuracy = totalTypedCount > 0 
      ? Math.max(0, Math.min(100, Math.round(((totalTypedCount - mistakeCount) / totalTypedCount) * 100)))
      : 100;

    // Save Score
    const textTitle = isCustomMode ? 'Custom Text Speedrun' : samples.find(s => s.id === selectedSampleId)?.title || 'Speed Test';
    onSaveScore(finalWpm, finalAccuracy, `Timed Test (${duration}s: ${textTitle})`);
  };

  // Live Stats calculations
  const wordsTypedSoFar = typedText.trim().split(/\s+/).filter(w => w.length > 0).length || 0;
  const elapsedSeconds = duration - timeRemaining;
  const liveWpm = elapsedSeconds > 0
    ? Math.round(wordsTypedSoFar / (elapsedSeconds / 60))
    : 0;

  const mistakesTotal = Object.keys(errorLetters).length;
  const liveAccuracy = typedText.length > 0
    ? Math.max(0, Math.min(100, Math.round(((typedText.length - mistakesTotal) / typedText.length) * 100)))
    : 100;

  // Custom text save handler
  const handleSaveCustomText = (text: string) => {
    if (text.trim().length < 20) {
      alert('Custom text must be at least 20 characters.');
      return;
    }
    setIsCustomMode(true);
    setGameState('idle');
    setTypedText('');
    setTimeRemaining(duration);
    setWpmHistory([]);
    setErrorLetters({});
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 font-mono select-none">
      
      {/* Hidden input for robust keyboard scanning */}
      <input
        ref={hiddenInputRef}
        type="text"
        value={typedText}
        onChange={handleTypedInputChange}
        disabled={gameState === 'finished'}
        className="absolute top-[-100px] left-[-100px] opacity-0"
        autoComplete="off"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
      />

      {/* Left side: Selection list or Custom Paste boxes */}
      <div 
        className="lg:col-span-4 p-4 border-2 rounded-lg flex flex-col justify-between"
        style={{ borderColor: palette.border, backgroundColor: palette.panelBg }}
      >
        <div>
          <div className="text-center font-black text-xs uppercase mb-4 py-1 select-none border border-black shadow-[2px_2px_0_0_rgba(0,0,0,0.5)]" style={{ backgroundColor: palette.textMuted, color: '#000000' }}>
            TIMER_&_TOPIC_SELECT
          </div>

          {/* Timers triggers */}
          <div className="grid grid-cols-3 gap-1 mb-4">
            {([30, 60, 120] as const).map(sec => (
              <button
                key={sec}
                disabled={gameState === 'running'}
                onClick={() => {
                  setDuration(sec);
                  setTimeRemaining(sec);
                }}
                className="px-2 py-1 text-2xs md:text-xs border rounded cursor-pointer uppercase font-semibold transition"
                style={{
                  backgroundColor: duration === sec ? palette.accent : 'transparent',
                  color: duration === sec ? palette.keyboardBg : palette.text,
                  borderColor: palette.border,
                  opacity: gameState === 'running' ? 0.5 : 1
                }}
                id={`duration-btn-${sec}`}
              >
                {sec === 60 ? '1 MIN' : sec === 120 ? '2 MIN' : `${sec} SEC`}
              </button>
            ))}
          </div>

          {/* Select Sample List */}
          <div className="text-2xs uppercase tracking-wide mb-1 opacity-70" style={{ color: palette.textMuted }}>
            SELECT PARAGRAPH
          </div>
          
          <div className="space-y-1 max-h-[160px] overflow-y-auto scrollbar-thin mb-4">
            {samples.map((samp) => {
              const isActive = !isCustomMode && selectedSampleId === samp.id;
              return (
                <button
                  key={samp.id}
                  disabled={gameState === 'running'}
                  onClick={() => {
                    setIsCustomMode(false);
                    setSelectedSampleId(samp.id);
                  }}
                  className="w-full text-left p-1.5 border rounded uppercase text-2xs transition cursor-pointer"
                  style={{
                    borderColor: isActive ? palette.accent : palette.border + '33',
                    backgroundColor: isActive ? palette.keyboardBg : 'transparent',
                    opacity: gameState === 'running' ? 0.5 : 1
                  }}
                  id={`sample-item-${samp.id}`}
                >
                  <div className="font-bold truncate" style={{ color: isActive ? palette.accent : palette.text }}>
                    {isActive ? '► ' : ''}{samp.title}
                  </div>
                  <div className="text-[9px]" style={{ color: palette.textMuted }}>{samp.subtitle}</div>
                </button>
              );
            })}
          </div>

          {/* Custom Paste Text Area Expandable */}
          <div className="border-t pt-3" style={{ borderColor: palette.border + '33' }}>
            <div className="text-2xs uppercase tracking-wide mb-1 opacity-70" style={{ color: palette.textMuted }}>
              ⌨ LOAD CUSTOM TEXT DRILL
            </div>
            
            <textarea
              placeholder="Paste your own literature, paragraph, or coding block here..."
              disabled={gameState === 'running'}
              className="w-full h-16 p-1.5 text-[10px] rounded border uppercase font-mono outline-hidden bg-black/30 placeholder-zinc-700"
              style={{ borderColor: palette.border + '33', color: palette.text }}
              onChange={(e) => setCustomText(e.target.value)}
              value={customText}
              id="custom-sample-textarea"
            />
            
            <button
              disabled={gameState === 'running' || !customText.trim()}
              onClick={() => handleSaveCustomText(customText)}
              className="mt-1 w-full py-1 border text-2xs uppercase font-bold text-center cursor-pointer hover:bg-white/5"
              style={{
                borderColor: isCustomMode ? palette.accent : palette.border,
                color: isCustomMode ? palette.accent : palette.text,
                opacity: (gameState === 'running' || !customText.trim()) ? 0.4 : 1
              }}
              id="apply-custom-sample-btn"
            >
              🛠 {isCustomMode ? 'CUSTOM DRILL LOADED! ►' : 'LOAD DETECTED EXCERPT'}
            </button>
          </div>

        </div>

        {/* Action controllers buttons */}
        <button
          onClick={setupTest}
          disabled={gameState === 'running'}
          className="mt-4 w-full py-1.5 border-2 text-xs uppercase font-extrabold text-center hover:brightness-110 cursor-pointer"
          style={{ backgroundColor: palette.accent, color: palette.keyboardBg, borderColor: palette.accent }}
          id="reset-speed-test-btn"
        >
          [ RE-START DRILL ]
        </button>

      </div>

      {/* Right side: Active test run core terminal pane */}
      <div className="lg:col-span-8 flex flex-col gap-4">
        
        <div 
          className="p-4 border-2 rounded-lg flex-1 flex flex-col justify-between"
          style={{ borderColor: palette.border, backgroundColor: palette.panelBg }}
          onClick={focusHiddenInput}
        >
          {/* Header instructions prompt */}
          <div className="flex justify-between items-center border-b pb-2 mb-3" style={{ borderColor: palette.border + '33' }}>
            <div>
              <span className="text-xs uppercase tracking-wider font-bold" style={{ color: palette.textBright }}>
                SPEED TEST PROTOCOL
              </span>
              <p className="text-[10px] mt-0.5" style={{ color: palette.textMuted }}>
                {isCustomMode ? 'Custom User Uploaded Draft' : samples.find(s => s.id === selectedSampleId)?.subtitle}
              </p>
            </div>

            {/* Timers pulse ticker */}
            <div 
              className="text-xs font-mono px-3 py-0.5 uppercase border-2 rounded-md font-extrabold select-none cursor-pointer"
              style={{ borderColor: palette.accent, color: palette.accent }}
              onClick={focusHiddenInput}
            >
              ⏳ {timeRemaining} SECONDS REMAINING
            </div>
          </div>

          {/* Test Stage text displays */}
          {gameState === 'finished' ? (
            /* Results Screen Card */
            <div className="p-4 bg-black/40 border-2 rounded-md font-mono text-center my-auto min-h-[160px] flex flex-col justify-center items-center">
              <h3 className="text-lg font-bold uppercase mb-2 animate-bounce" style={{ color: palette.accent }}>
                ╔══════ EVALUATION COMPLETE ══════╗
              </h3>
              
              <div className="grid grid-cols-4 gap-2 w-full max-w-md my-4">
                <div className="border p-2 rounded">
                  <div className="text-[9px]" style={{ color: palette.textMuted }}>SPEED</div>
                  <div className="text-base font-extrabold" style={{ color: palette.textBright }}>
                    {Math.round(typedText.split(' ').length / (duration/60))} WPM
                  </div>
                </div>
                <div className="border p-2 rounded">
                  <div className="text-[9px]" style={{ color: palette.textMuted }}>ACCURACY</div>
                  <div className="text-base font-extrabold" style={{ color: palette.textBright }}>
                    {liveAccuracy}%
                  </div>
                </div>
                <div className="border p-2 rounded">
                  <div className="text-[9px]" style={{ color: palette.textMuted }}>CHAR COUNT</div>
                  <div className="text-base font-extrabold" style={{ color: palette.textBright }}>
                    {typedText.length}
                  </div>
                </div>
                <div className="border p-2 rounded">
                  <div className="text-[9px]" style={{ color: palette.textMuted }}>MISTAKES</div>
                  <div className="text-base font-extrabold" style={{ color: palette.textBright }}>
                    {mistakesTotal}
                  </div>
                </div>
              </div>

              {/* Draw retro timeline progression graph */}
              {wpmHistory.length > 0 && (
                <div className="w-full text-left max-w-sm mb-4">
                  <div className="text-[10px] uppercase font-bold mb-1" style={{ color: palette.textMuted }}>
                    WPM timeline progression:
                  </div>
                  <div className="flex items-end gap-1.5 h-12 border-b border-l px-2" style={{ borderColor: palette.border }}>
                    {wpmHistory.map((wpm, i) => (
                      <div
                        key={i}
                        className="flex-1 max-w-[20px] transition-all duration-300"
                        style={{
                          height: `${Math.min(100, (wpm / 110) * 100)}%`,
                          backgroundColor: palette.accent
                        }}
                        title={`${wpm} WPM`}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between text-[8px] mt-0.5" style={{ color: palette.textMuted }}>
                    <span>START</span>
                    <span>MID</span>
                    <span>END</span>
                  </div>
                </div>
              )}

              <button
                onClick={setupTest}
                className="px-5 py-1 bg-white hover:opacity-85 text-black border font-extrabold text-xs transition cursor-pointer uppercase"
                style={{ backgroundColor: palette.accent, color: palette.keyboardBg, borderColor: palette.accent }}
              >
                [ RUN STAGE AGAIN ]
              </button>
            </div>
          ) : (
            /* Active interactive reader scrollbox */
            <div 
              ref={scrollContainerRef}
              className="p-4 rounded border-2 font-mono text-sm leading-relaxed tracking-wide min-h-[160px] max-h-[220px] overflow-y-auto scrollbar-thin text-justify relative"
              style={{ backgroundColor: palette.keyboardBg, borderColor: palette.border + '55' }}
            >
              {gameState === 'idle' && (
                <div 
                  className="absolute inset-0 bg-black/60 flex items-center justify-center text-center font-bold text-xs uppercase z-10"
                  style={{ color: palette.accent }}
                >
                  [ DEPRESS ANY ALPHANUMERIC KEY TO INITIATE CHRONOMETER ]
                </div>
              )}

              {/* Characters splits with correctness checks */}
              <div className="relative">
                {activeText.split('').map((char, index) => {
                  let charClass = '';
                  let charStyle = {};

                  const isCurrent = index === typedText.length;
                  const hasBeenTyped = index < typedText.length;
                  const wasError = errorLetters[index];

                  if (isCurrent) {
                    charClass = 'font-bold bg-white/10 border-b-2 select-none animate-[pulse_1.5s_infinite]';
                    charStyle = { 
                      backgroundColor: palette.accent + '33', 
                      color: palette.accent,
                      borderBottomColor: palette.accent
                    };
                  } else if (hasBeenTyped) {
                    if (wasError) {
                      charClass = 'bg-red-900/40 text-red-500 font-bold border-b border-red-600 line-through';
                    } else {
                      charClass = 'opacity-50';
                      charStyle = { color: palette.textBright };
                    }
                  } else {
                    charStyle = { color: palette.text };
                  }

                  return (
                    <span
                      key={index}
                      id={`test-char-${index}`}
                      className={`inline transition-colors duration-75 select-none ${charClass}`}
                      style={charStyle}
                    >
                      {char === ' ' ? (isCurrent ? '⎵' : '\u00A0') : char}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick instructions alerts */}
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2 border-t pt-3 font-mono text-center" style={{ borderColor: palette.border + '22' }}>
            <div className="text-left text-[10px] md:text-xs">
              <span className="block" style={{ color: palette.textMuted }}>LIVE WPM</span>
              <span className="text-base font-bold" style={{ color: palette.textBright }}>{liveWpm}</span>
            </div>
            <div className="text-[10px] md:text-xs">
              <span className="block" style={{ color: palette.textMuted }}>ACCURACY</span>
              <span className="text-base font-bold" style={{ color: palette.textBright }}>{liveAccuracy}%</span>
            </div>
            <div className="text-right text-[10px] md:text-xs hidden sm:block">
              <span className="block" style={{ color: palette.textMuted }}>BACKSPACE CAP</span>
              <span className="text-xs font-bold uppercase" style={{ color: palette.accent }}>🔓 UNLOCKED</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
