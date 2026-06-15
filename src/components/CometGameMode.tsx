import React, { useState, useEffect, useRef } from 'react';
import { RetroPalette } from '../types';
import { GAME_POOLS } from '../lessons';
import { synth } from '../audio';

const DOLCH_POOLS = {
  easy: [
    'the', 'and', 'big', 'blue', 'can', 'come', 'down', 'find', 'for', 'go',
    'help', 'here', 'is', 'it', 'jump', 'look', 'make', 'me', 'my', 'not',
    'one', 'play', 'red', 'run', 'see', 'to', 'two', 'up', 'we', 'you',
    'all', 'am', 'are', 'at', 'ate', 'be', 'but', 'did', 'do', 'eat',
    'get', 'good', 'have', 'he', 'into', 'like', 'must', 'new', 'no', 'now',
    'on', 'our', 'out', 'ran', 'saw', 'say', 'she', 'so', 'soon'
  ],
  medium: [
    'funny', 'three', 'where', 'yellow', 'black', 'brown', 'please', 'pretty',
    'there', 'they', 'this', 'under', 'want', 'was', 'well', 'went', 'what',
    'white', 'who', 'will', 'with', 'yes', 'after', 'again', 'could', 'every',
    'fly', 'from', 'give', 'going', 'had', 'has', 'her', 'him', 'his', 'how',
    'just', 'know', 'once', 'open', 'over', 'round', 'some', 'stop', 'take',
    'thank', 'them', 'then', 'think', 'walk', 'were', 'when', 'always', 'around',
    'before', 'best', 'both', 'call', 'cold', 'fast', 'first', 'five', 'found'
  ],
  hard: [
    'because', 'together', 'beautiful', 'children', 'another', 'brother', 'different',
    'sister', 'country', 'morning', 'tomorrow', 'yesterday', 'picture', 'important',
    'themselves', 'sentence', 'remember', 'something', 'sometimes', 'questions',
    'mountains', 'consonants', 'syllables', 'everything', 'understand'
  ]
};

interface CometGameModeProps {
  palette: RetroPalette;
  onSaveScore: (wpm: number, accuracy: number, gameMode: string) => void;
}

interface CometItem {
  id: string;
  word: string;
  charsTyped: number;
  x: number;          // Percent width 5% to 85%
  y: number;          // Percent height 0% to 100%
  speed: number;      // Increment speed
}

interface StarItem {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
}

interface DebrisItem {
  id: string;
  char: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}

interface LaserBeam {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  life: number;
}

export default function CometGameMode({ palette, onSaveScore }: CometGameModeProps) {
  const [level, setLevel] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover' | 'paused'>('idle');
  const [wordSource, setWordSource] = useState<'retro' | 'dolch'>('retro');
  
  // Game metrics
  const [score, setScore] = useState(0);
  const [cometsDestroyed, setCometsDestroyed] = useState(0);
  const [shieldHealth, setShieldHealth] = useState(100);
  const [wave, setWave] = useState(1);
  const [totalKeystrokes, setTotalKeystrokes] = useState(0);
  const [errorsTriggered, setErrorsTriggered] = useState(0);

  // Core entities
  const [comets, setComets] = useState<CometItem[]>([]);
  const [stars, setStars] = useState<StarItem[]>([]);
  const [debris, setDebris] = useState<DebrisItem[]>([]);
  const [lasers, setLasers] = useState<LaserBeam[]>([]);
  const [lockedCometId, setLockedCometId] = useState<string | null>(null);

  // Gun turret tracker
  const [turretX, setTurretX] = useState<number>(50); // Percent

  // Focus and layout refs
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const keyboardInputRef = useRef<HTMLInputElement>(null);

  // Core simulation refs. They hold the raw simulation state to avoid stale closure / async delays
  const cometsRef = useRef<CometItem[]>([]);
  const lockedCometIdRef = useRef<string | null>(null);
  const waveRef = useRef<number>(1);
  const levelRef = useRef<'easy' | 'medium' | 'hard'>('easy');
  const gameStateRef = useRef<'idle' | 'playing' | 'gameover' | 'paused'>('idle');
  const wordSourceRef = useRef<'retro' | 'dolch'>('retro');

  // Synchronize non-simulation controls to refs so the game loop always has fresh settings
  useEffect(() => { waveRef.current = wave; }, [wave]);
  useEffect(() => { levelRef.current = level; }, [level]);
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
  useEffect(() => { wordSourceRef.current = wordSource; }, [wordSource]);

  // Auto-refocus input when playing to ensure seamless typing
  useEffect(() => {
    if (gameState !== 'playing') return;

    const handleFocusLoss = () => {
      setTimeout(() => {
        if (gameStateRef.current === 'playing' && document.activeElement !== keyboardInputRef.current) {
          keyboardInputRef.current?.focus();
        }
      }, 50);
    };

    const inputEl = keyboardInputRef.current;
    inputEl?.addEventListener('blur', handleFocusLoss);
    return () => {
      inputEl?.removeEventListener('blur', handleFocusLoss);
    };
  }, [gameState]);

  // Track window blur events to automatically pause operation safely
  useEffect(() => {
    const handleWindowBlur = () => {
      if (gameStateRef.current === 'playing') {
        setGameState('paused');
      }
    };
    window.addEventListener('blur', handleWindowBlur);
    return () => {
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, []);

  // Capture keys on the window level if user clicks elsewhere or loses target input focus
  useEffect(() => {
    if (gameState !== 'playing') return;

    const handleWindowKeyDown = (e: KeyboardEvent) => {
      // If the hidden input is focused, let onChange handle it for safe mobile virtual keyboard compositing
      if (document.activeElement === keyboardInputRef.current) {
        return;
      }

      // Ignore if some other input or button is active
      if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA' || document.activeElement.tagName === 'BUTTON')) {
        return;
      }

      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (e.key.length === 1) {
        e.preventDefault();
        processTypedChar(e.key);
      }
    };

    window.addEventListener('keydown', handleWindowKeyDown);
    return () => {
      window.removeEventListener('keydown', handleWindowKeyDown);
    };
  }, [gameState]);

  // Initialize background starfield stars for retro cosmic look
  useEffect(() => {
    const list: StarItem[] = [];
    for (let i = 0; i < 120; i++) {
      list.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() > 0.8 ? 2 : 1,
        opacity: Math.random() * 0.7 + 0.3
      });
    }
    setStars(list);
  }, []);

  // Main game loop logic using single ticker
  useEffect(() => {
    if (gameState !== 'playing') return;

    let cometIdCounter = 0;
    let spawnTimer = 0;
    let lastTime: number | null = null;
    let animationFrameId: number;

    const gameTick = (time: number) => {
      if (lastTime === null) {
        lastTime = time;
        animationFrameId = requestAnimationFrame(gameTick);
        return;
      }
      let delta = (time - lastTime) / 1000;
      lastTime = time;

      // Cap delta to prevent immense frame jumps (such as when tab backgrounding/blurring or returning)
      if (delta > 0.1) {
        delta = 0.1;
      }

      // 1. Move stars slightly upwards for retro flight look
      setStars(prev => prev.map(s => {
        let newY = s.y - delta * 4;
        if (newY < 0) newY = 100;
        return { ...s, y: newY };
      }));

      // 2. Update debris decay
      setDebris(prev => prev.map(d => ({
        ...d,
        x: d.x + d.vx * delta * 50,
        y: d.y + d.vy * delta * 50,
        life: d.life - delta * 3
      })).filter(d => d.life > 0));

      // 3. Update lasers decay
      setLasers(prev => prev.map(l => ({
        ...l,
        life: l.life - delta * 5
      })).filter(l => l.life > 0));

      // 4. Update comets falling downwards using raw synchronized ref list
      let healthDamage = 0;
      const hitBottomIds: string[] = [];

      cometsRef.current = cometsRef.current.map(c => {
        // Accelerate slightly based on wave count
        const actualSpeed = c.speed * (1 + (waveRef.current - 1) * 0.12);
        const newY = c.y + actualSpeed * delta * 15;
        if (newY >= 91) {
          healthDamage += 15;
          hitBottomIds.push(c.id);
        }
        return { ...c, y: newY };
      });

      // Filter and destroy comets that hit the bottom
      if (hitBottomIds.length > 0) {
        cometsRef.current = cometsRef.current.filter(c => !hitBottomIds.includes(c.id));

        // Unlock target if our currently focused locked comet was destroyed by hitting bottom
        if (hitBottomIds.includes(lockedCometIdRef.current || '')) {
          lockedCometIdRef.current = null;
          setLockedCometId(null);
        }

        synth.playError();
        setShieldHealth(prev => {
          const nextHealth = Math.max(0, prev - healthDamage);
          if (nextHealth <= 0) {
            setGameState('gameover');
            synth.playGameOver();
          }
          return nextHealth;
        });
      }

      // 5. Automatic Comet Spawner
      spawnTimer += delta;
      
      const currentLevel = levelRef.current;
      const maxComets = currentLevel === 'easy' ? 3 : currentLevel === 'medium' ? 5 : 7;
      const spawnCooldown = currentLevel === 'easy' ? 4.5 : currentLevel === 'medium' ? 3.0 : 2.0;

      if (spawnTimer >= spawnCooldown && cometsRef.current.length < maxComets) {
        // Find pool words that are NOT already active on screen
        const pool = wordSourceRef.current === 'dolch' ? DOLCH_POOLS[currentLevel] : GAME_POOLS[currentLevel];
        const availableWords = pool.filter(w => !cometsRef.current.some(c => c.word.toLowerCase() === w.toLowerCase()));
        
        if (availableWords.length > 0) {
          const randomWord = availableWords[Math.floor(Math.random() * availableWords.length)];
          cometIdCounter++;
          const newComet: CometItem = {
            id: `comet-${cometIdCounter}-${Date.now()}`,
            word: randomWord,
            charsTyped: 0,
            x: Math.random() * 80 + 10, // 10% to 90%
            y: 0,
            speed: currentLevel === 'easy' ? 0.35 : currentLevel === 'medium' ? 0.6 : 0.9
          };

          cometsRef.current.push(newComet);
          spawnTimer = 0; // Reset timer only upon successful spawn
        } else {
          // If all words are somehow active on screen, retry quickly (0.5s later) rather than wasting the full cooldown
          spawnTimer = spawnCooldown - 0.5;
        }
      }

      // Synchronize synchronized positions directly with visual react state
      setComets([...cometsRef.current]);

      animationFrameId = requestAnimationFrame(gameTick);
    };

    animationFrameId = requestAnimationFrame(gameTick);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [gameState]);

  // Core character parsing engine
  const processTypedChar = (char: string) => {
    setTotalKeystrokes(prev => prev + 1);

    const currentLockedId = lockedCometIdRef.current;
    if (currentLockedId) {
      // 1. Player is currently locked onto a specific comet
      const matchedComet = cometsRef.current.find(c => c.id === currentLockedId);
      
      if (matchedComet) {
        const nextRequiredChar = matchedComet.word[matchedComet.charsTyped].toLowerCase();
        
        if (char === nextRequiredChar) {
          // Typing aligns correctly
          matchedComet.charsTyped += 1;
          
          setTurretX(matchedComet.x);
          synth.playClick(char === ' ');

          if (matchedComet.charsTyped >= matchedComet.word.length) {
            // BLAST COMET OUT OF RETRO SKY!
            triggerExplosion(matchedComet);
          } else {
            // Trigger visual react state repaint
            setComets([...cometsRef.current]);
          }
        } else {
          // Typed wrong key inside locked word
          setErrorsTriggered(prev => prev + 1);
          synth.playError();
        }
      }
    } else {
      // 2. Play is unlocked and looking to make first-letter locking match
      const matchingComets = cometsRef.current.filter(c => c.word[0].toLowerCase() === char);

      if (matchingComets.length > 0) {
        // Match the highest falling comet first (strategic advantage!)
        const sorted = [...matchingComets].sort((a, b) => b.y - a.y);
        const target = sorted[0];

        lockedCometIdRef.current = target.id;
        setLockedCometId(target.id);
        setTurretX(target.x);
        synth.playClick(char === ' ');

        target.charsTyped = 1;

        if (target.word.length === 1) {
          triggerExplosion(target);
        } else {
          setComets([...cometsRef.current]);
        }
      } else {
        // Key typed does not match any current falling comets
        setErrorsTriggered(prev => prev + 1);
        synth.playError();
      }
    }
  };

  // Handle keys from input element (essential for virtual mobile keyboards / layouts)
  const handleGameKeyDown = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (gameState !== 'playing') return;

    const typedValue = e.target.value;
    if (!typedValue) return;

    // Process all typed characters
    for (let i = 0; i < typedValue.length; i++) {
      processTypedChar(typedValue[i]);
    }
    
    // Clear back immediately so they can keep typing
    e.target.value = '';
  };

  // Triggering visual lasers, particle bursts, and scores
  const triggerExplosion = (target: CometItem) => {
    // 1. Sound effects
    synth.playLaser();
    setTimeout(() => synth.playExplosion(), 80);

    // 2. Spawn retro particle fragments debris representing shattering rock elements
    const newFragments: DebrisItem[] = [];
    const debrisChars = ['*', '+', 'o', '.', '#', '@', 'x'];
    for (let i = 0; i < 15; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 2;
      newFragments.push({
        id: `debris-${Date.now()}-${i}-${Math.random()}`,
        char: debrisChars[Math.floor(Math.random() * debrisChars.length)],
        x: target.x,
        y: target.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0
      });
    }
    setDebris(prev => [...prev, ...newFragments]);

    // 3. Draw Laser Turret Beam
    setLasers(prev => [
      ...prev,
      {
        id: `laser-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        startX: target.x,
        startY: 91, // Turret vertical baseline
        endX: target.x,
        endY: target.y,
        life: 0.15
      }
    ]);

    // 4. Award Score (Word length multiplies based on wave level and accuracy)
    const points = target.word.length * waveRef.current * 10;
    setScore(curr => curr + points);
    setCometsDestroyed(curr => {
      const total = curr + 1;
      // Increment wave difficulty and speed every 8 comets shot
      if (total % 8 === 0) {
        setWave(w => {
          const nextWave = w + 1;
          waveRef.current = nextWave;
          return nextWave;
        });
        synth.playVictory();
      }
      return total;
    });

    // Remove target from the core referenced list
    cometsRef.current = cometsRef.current.filter(c => c.id !== target.id);

    // Reset lock index configuration
    lockedCometIdRef.current = null;
    setLockedCometId(null);

    // Sync with React layout states
    setComets([...cometsRef.current]);
  };

  const startGame = () => {
    // Clear and reset synchronous references
    cometsRef.current = [];
    lockedCometIdRef.current = null;
    waveRef.current = 1;

    // Reset layout states
    setComets([]);
    setDebris([]);
    setLasers([]);
    setScore(0);
    setCometsDestroyed(0);
    setShieldHealth(100);
    setWave(1);
    setTotalKeystrokes(0);
    setErrorsTriggered(0);
    setLockedCometId(null);
    setGameState('playing');
    
    // Play warm boot bleep
    synth.playBootJingle();

    setTimeout(() => {
      keyboardInputRef.current?.focus();
    }, 100);
  };

  const stopGameAndSave = () => {
    setGameState('idle');
    const accuracy = totalKeystrokes > 0 
      ? Math.max(0, Math.min(100, Math.round(((totalKeystrokes - errorsTriggered) / totalKeystrokes) * 100)))
      : 100;
    onSaveScore(cometsDestroyed, accuracy, `Comet Shooter (${wordSource === 'dolch' ? 'Dolch' : 'Retro'} - ${level.toUpperCase()})`);
  };

  // Format accuracy percentage helper
  const accuracyPercent = totalKeystrokes > 0 
    ? Math.max(0, Math.min(100, Math.round(((totalKeystrokes - errorsTriggered) / totalKeystrokes) * 100)))
    : 100;

  return (
    <div className="flex flex-col gap-4 font-mono select-none">
      
      {/* Target focus capture layer */}
      <input
        ref={keyboardInputRef}
        type="text"
        onChange={handleGameKeyDown}
        className="absolute top-[-100px] left-[-100px] opacity-0"
        autoComplete="off"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
      />

      <div 
        ref={gameAreaRef}
        onClick={() => {
          if (gameState === 'paused') {
            setGameState('playing');
          }
          keyboardInputRef.current?.focus();
        }}
        onMouseLeave={() => {
          if (gameState === 'playing') {
            setGameState('paused');
          }
        }}
        onMouseEnter={() => {
          if (gameState === 'paused') {
            setGameState('playing');
            setTimeout(() => {
              keyboardInputRef.current?.focus();
            }, 50);
          }
        }}
        className="h-[400px] md:h-[450px] border-2 rounded-lg relative overflow-hidden flex flex-col justify-between cursor-crosshair"
        style={{ borderColor: palette.border, backgroundColor: palette.keyboardBg }}
        id="comet-shield-canvas-container"
      >
        {/* CRT screen distortion mesh */}
        <div className="absolute inset-0 pointer-events-none z-20 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.18)_50%)] bg-[length:100%_4px]" />

        {/* Ambient Twinkling Cosmic Stars background */}
        {stars.map(s => (
          <div
            key={s.id}
            className="absolute rounded-full transition-opacity duration-100 bg-white"
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: `${s.size}px`,
              height: `${s.size}px`,
              opacity: s.opacity * 0.6
            }}
          />
        ))}

        {gameState === 'idle' ? (
          /* Start Screen visual card */
          <div className="absolute inset-0 z-10 flex flex-col justify-center items-center text-center p-4 md:p-6 bg-black/75">
            <h2 className="text-xl md:text-2xl font-bold uppercase tracking-widest mb-1 font-mono" style={{ color: palette.accent }}>
              ☄ COMET SHIELD RETRO OVERDRIVE ☄
            </h2>
            <p className="text-[9px] md:text-xs max-w-lg mb-3" style={{ color: palette.textMuted }}>
              Asteroids are rushing towards earth! Lock onto them by entering their first letter, type their characters to track the vectors, and blast them into cosmic dust!
            </p>

            <div className="flex flex-col items-center gap-1.5 max-w-sm w-full mb-3">
              <span className="text-[9px] uppercase font-bold tracking-widest" style={{ color: palette.textMuted }}>SELECT WORD SOURCE</span>
              <div className="grid grid-cols-2 gap-2 w-full">
                {(['retro', 'dolch'] as const).map(src => (
                  <button
                    key={src}
                    onClick={() => setWordSource(src)}
                    className="px-2 py-1 text-2xs border rounded cursor-pointer uppercase font-bold transition font-mono"
                    style={{
                      backgroundColor: wordSource === src ? palette.accent : 'transparent',
                      color: wordSource === src ? palette.keyboardBg : palette.text,
                      borderColor: palette.border
                    }}
                    id={`word-source-btn-${src}`}
                  >
                    {src === 'retro' ? 'Retro Tech' : 'Dolch Sight Words'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col items-center gap-1.5 max-w-sm w-full mb-4">
              <span className="text-[9px] uppercase font-bold tracking-widest" style={{ color: palette.textMuted }}>SELECT GAME SPEED</span>
              <div className="grid grid-cols-3 gap-2 w-full font-mono">
                {(['easy', 'medium', 'hard'] as const).map(lvl => (
                  <button
                    key={lvl}
                    onClick={() => setLevel(lvl)}
                    className="px-2 py-1 text-2xs border rounded cursor-pointer uppercase font-bold transition"
                    style={{
                      backgroundColor: level === lvl ? palette.accent : 'transparent',
                      color: level === lvl ? palette.keyboardBg : palette.text,
                      borderColor: palette.border
                    }}
                    id={`speed-btn-${lvl}`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={startGame}
              className="px-5 py-1.5 border-2 hover:brightness-110 active:brightness-90 transition uppercase font-bold text-xs md:text-sm cursor-pointer font-mono"
              style={{ backgroundColor: palette.accent, color: palette.keyboardBg, borderColor: palette.accent }}
              id="start-comet-game-btn"
            >
              [ LAUNCH MISSION ]
            </button>
          </div>
        ) : gameState === 'gameover' ? (
          /* GameOver metrics block */
          <div className="absolute inset-0 z-10 flex flex-col justify-center items-center text-center p-6 bg-black/90">
            <h2 className="text-2xl md:text-3xl font-extrabold uppercase tracking-wider mb-2 animate-pulse" style={{ color: palette.errorBg }}>
              ☣ THE SURFACE WAS DESTROYED ☣
            </h2>
            <p className="text-2xs md:text-xs tracking-wider mb-5 uppercase" style={{ color: palette.textMuted }}>
              Our electromagnetic shielding was breached. Mission ended.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-w-md w-full my-3 text-xs uppercase">
              <div className="border p-2 rounded bg-black/40">
                <div style={{ color: palette.textMuted }}>SCORE</div>
                <div className="text-base font-bold" style={{ color: palette.textBright }}>{score}</div>
              </div>
              <div className="border p-2 rounded bg-black/40">
                <div style={{ color: palette.textMuted }}>DESTROYED</div>
                <div className="text-base font-bold" style={{ color: palette.textBright }}>{cometsDestroyed}</div>
              </div>
              <div className="border p-2 rounded bg-black/40">
                <div style={{ color: palette.textMuted }}>ACCURACY</div>
                <div className="text-base font-bold" style={{ color: palette.textBright }}>{accuracyPercent}%</div>
              </div>
              <div className="border p-2 rounded bg-black/40">
                <div style={{ color: palette.textMuted }}>WAVE</div>
                <div className="text-base font-bold" style={{ color: palette.textBright }}>{wave}</div>
              </div>
            </div>

            <div className="flex gap-4 mt-4 flex-wrap justify-center">
              <button
                onClick={startGame}
                className="px-5 py-1.5 border-2 text-xs uppercase font-bold cursor-pointer hover:bg-white/10"
                style={{ backgroundColor: palette.accent, color: palette.keyboardBg, borderColor: palette.accent }}
                id="retry-game-btn"
              >
                [ FLY ANOTHER MISSION ]
              </button>
              <button
                onClick={stopGameAndSave}
                className="px-5 py-1.5 border hover:bg-white/10 text-xs uppercase font-bold cursor-pointer"
                style={{ color: palette.text, borderColor: palette.border }}
                id="quit-game-btn"
              >
                [ EXIT TO BRIEFING ]
              </button>
            </div>
          </div>
        ) : (
          /* Active Playing Starfield Stage */
          <>
            {/* If paused, render overlay on top of the active playing screen but inside the canvas */}
            {gameState === 'paused' && (
              <div className="absolute inset-0 z-30 flex flex-col justify-center items-center text-center p-6 bg-black/80">
                <h2 className="text-xl md:text-2xl font-bold uppercase tracking-widest mb-1 animate-pulse" style={{ color: palette.accent }}>
                  ⏸ RETRO GAME PAUSED ⏸
                </h2>
                <p className="text-[10px] md:text-xs max-w-sm mb-4" style={{ color: palette.textMuted }}>
                  Tactical controls suspended. Hover mouse back into screen or click block to return to active defense grid.
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setGameState('playing');
                      setTimeout(() => keyboardInputRef.current?.focus(), 50);
                    }}
                    className="px-5 py-1.5 border-2 text-xs uppercase font-bold cursor-pointer hover:brightness-110"
                    style={{ backgroundColor: palette.accent, color: palette.keyboardBg, borderColor: palette.accent }}
                    id="resume-btn"
                  >
                    [ RESUME ]
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      stopGameAndSave();
                    }}
                    className="px-5 py-1.5 border hover:bg-white/10 text-xs uppercase font-bold cursor-pointer"
                    style={{ color: palette.text, borderColor: palette.border }}
                    id="abort-btn"
                  >
                    [ ABORT ]
                  </button>
                </div>
              </div>
            )}
            {/* Top Stats HUD bar */}
            <div className="p-2 border-b flex justify-between items-center bg-black/50 backdrop-blur-xs z-10 text-[10px] sm:text-xs">
              <div className="flex gap-4">
                <span>SCORE: <span style={{ color: palette.accent }} className="font-bold">{score}</span></span>
                <span>COMETS SHOT: <span style={{ color: palette.accent }} className="font-bold">{cometsDestroyed}</span></span>
              </div>
              <div className="flex gap-4">
                <span>SECTOR: <span style={{ color: palette.textBright }} className="font-bold">{wave}</span></span>
                <span>ACCURACY: <span style={{ color: palette.textBright }} className="font-bold">{accuracyPercent}%</span></span>
              </div>
            </div>

            {/* Core Sky Arena */}
            <div className="flex-1 relative overflow-hidden" id="starfield-sky-arena">
              
              {/* Draw tactical lasers */}
              {lasers.map(l => (
                <div
                  key={l.id}
                  className="absolute pointer-events-none transition-all duration-75"
                  style={{
                    left: `${l.startX}%`,
                    top: `${l.endY}%`,
                    width: '3px',
                    height: `${l.startY - l.endY}%`,
                    backgroundColor: palette.accent,
                    boxShadow: `0 0 10px ${palette.accent}, 0 0 20px ${palette.accent}`,
                    opacity: l.life / 0.15,
                    transform: 'translateX(-50%)'
                  }}
                />
              ))}

              {/* Draw debris particle fragments */}
              {debris.map(d => (
                <span
                  key={d.id}
                  className="absolute pointer-events-none text-2xs md:text-xs font-black animate-ping"
                  style={{
                    left: `${d.x}%`,
                    top: `${d.y}%`,
                    color: palette.accent,
                    opacity: d.life,
                    transform: 'translate(-50%, -50%) scale(1.5)'
                  }}
                >
                  {d.char}
                </span>
              ))}

              {/* Draw falling Comets */}
              {comets.map(c => {
                const isLocked = lockedCometId === c.id;
                return (
                  <div
                    key={c.id}
                    className={`absolute flex flex-col items-center select-none`}
                    style={{
                      left: `${c.x}%`,
                      top: `${c.y}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
                    {/* Retro Comic Fireball graphic */}
                    <div className="flex flex-col items-center relative">
                      <div 
                        className={`text-2xs animate-bounce`} 
                        style={{ color: isLocked ? palette.accent : palette.textMuted }}
                      >
                        ☄
                      </div>
                      
                      {/* Interactive Locked box bracket wrapper */}
                      <span 
                        className={`px-1.5 py-0.5 rounded text-xs md:text-sm font-bold border flex transition-all duration-75 bg-black/90 tracking-wide`}
                        style={{ 
                          borderColor: isLocked ? palette.accent : palette.border + '33',
                          boxShadow: isLocked ? `0 0 8px ${palette.accent}` : 'none'
                        }}
                      >
                        {/* Word splitting for matched letters typing highlight */}
                        {c.word.split('').map((char, index) => {
                          const isTyped = index < c.charsTyped;
                          return (
                            <span
                              key={index}
                              style={{
                                color: isTyped 
                                  ? palette.accent 
                                  : isLocked 
                                    ? palette.textBright 
                                    : palette.text
                              }}
                              className={isTyped ? 'underline font-extrabold scale-105' : 'opacity-85'}
                            >
                              {char}
                            </span>
                          );
                        })}
                      </span>

                      {/* Small tail trace element */}
                      <span className="text-[8px] tracking-tighter opacity-50 block mt-[-4px]" style={{ color: palette.accent }}>
                        | |
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Click focus request prompt helper */}
              {document.activeElement !== keyboardInputRef.current && (
                <div 
                  className="absolute bottom-6 left-1/2 -translate-x-1/2 text-2xs font-bold border px-3 py-1 rounded bg-black/80 animate-bounce cursor-pointer"
                  style={{ borderColor: palette.accent, color: palette.accent }}
                  onClick={() => keyboardInputRef.current?.focus()}
                >
                  ▲ INTERFACE OFFLINE - CLICK TO RE-ALIGN CONTROLS ▲
                </div>
              )}
            </div>

            {/* Bottom Shield Health & Laser Turret Grid */}
            <div className="mt-auto border-t bg-black/60 relative z-10 pb-1" style={{ borderColor: palette.border + '33' }}>
              
              {/* Digital Laser Turret gun node */}
              <div 
                className="absolute top-[-10px] h-3 w-5 transition-all duration-100 ease-out z-10"
                style={{ 
                  left: `${turretX}%`, 
                  transform: 'translateX(-50%)',
                  backgroundColor: palette.accent,
                  clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' 
                }}
              />

              {/* Shield health grid visual block */}
              <div className="px-3 py-1 mt-1 flex flex-col sm:flex-row justify-between items-center text-[10px] sm:text-xs">
                
                {/* Visual heart symbols / bar indicators */}
                <span className="uppercase font-bold" style={{ color: shieldHealth > 35 ? palette.text : '#ef4444' }}>
                  SHIELDS: {shieldHealth}% [{('█').repeat(Math.round(shieldHealth/10)) + ('░').repeat(10 - Math.round(shieldHealth/10))}]
                </span>

                <div className="flex gap-4 mt-1 sm:mt-0 font-bold">
                  <span className="uppercase" style={{ color: palette.textMuted }}>
                    Target Locked: <span style={{ color: palette.accent }}>{lockedCometId ? 'YES' : 'NONE'}</span>
                  </span>
                  
                  {/* Exit flight simulation */}
                  <button 
                    onClick={stopGameAndSave}
                    className="hover:underline cursor-pointer text-red-500 uppercase font-black"
                  >
                    [ ESCAPE MISSION ]
                  </button>
                </div>

              </div>
            </div>
          </>
        )}
      </div>

      {/* Speed selectors footer alerts */}
      <div className="text-[10px] text-center opacity-60" style={{ color: palette.textMuted }}>
        PC SPEAKER EMULATION: ENABLED • DIFFICULTY SPEEDS DYNAMICALLY INCREASE ACCORDING TO DESTROYED VECTOR SQUADS.
      </div>

    </div>
  );
}
