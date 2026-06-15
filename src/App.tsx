import React, { useState, useEffect } from 'react';
import { ScoreEntry, RetroPalette } from './types';
import { RETRO_PALETTES } from './palettes';
import { synth } from './audio';
import BootSequence from './components/BootSequence';
import LessonsMode from './components/LessonsMode';
import CometGameMode from './components/CometGameMode';
import SpeedTestMode from './components/SpeedTestMode';

// Icon Imports (Using lucide-react)
import { 
  Keyboard, 
  Flame, 
  Timer, 
  Trophy, 
  HelpCircle, 
  Volume2, 
  VolumeX, 
  Monitor, 
  Settings, 
  Terminal,
  Activity,
  Trash2
} from 'lucide-react';

export default function App() {
  const [booted, setBooted] = useState<boolean>(false);
  const [selectedTab, setSelectedTab] = useState<'lessons' | 'comet' | 'speedrun' | 'halloffame' | 'manual'>('lessons');
  const [palette, setPalette] = useState<RetroPalette>(RETRO_PALETTES[0]); // Default Classic Blue
  const [isMuted, setIsMuted] = useState<boolean>(false);
  
  // CRT scanlines effects toggle
  const [crtEffects, setCrtEffects] = useState<boolean>(true);

  // Statistics & Storage states
  const [allTimeKeys, setAllTimeKeys] = useState<number>(0);
  const [highestWpm, setHighestWpm] = useState<number>(0);
  const [averageAcc, setAverageAcc] = useState<number>(0);
  const [attemptsCount, setAttemptsCount] = useState<number>(0);
  const [highScores, setHighScores] = useState<ScoreEntry[]>([]);

  // Name prompt modal for high score entry
  const [scorePendingSave, setScorePendingSave] = useState<{ wpm: number; accuracy: number; mode: string } | null>(null);
  const [playerName, setPlayerName] = useState<string>('USER_1');

  // Load persistence files from localStorage on startups
  useEffect(() => {
    try {
      const savedKeys = localStorage.getItem('retro_tutor_all_keys');
      if (savedKeys) setAllTimeKeys(parseInt(savedKeys));

      const savedMaxWpm = localStorage.getItem('retro_tutor_max_wpm');
      if (savedMaxWpm) setHighestWpm(parseInt(savedMaxWpm));

      const savedAcc = localStorage.getItem('retro_tutor_avg_acc');
      if (savedAcc) setAverageAcc(parseInt(savedAcc));

      const savedAttempts = localStorage.getItem('retro_tutor_attempts');
      if (savedAttempts) setAttemptsCount(parseInt(savedAttempts));

      const savedMute = localStorage.getItem('retro_audio_muted');
      setIsMuted(savedMute === 'true');

      // Load scores
      const savedScores = localStorage.getItem('retro_tutor_scores');
      if (savedScores) {
        setHighScores(JSON.parse(savedScores));
      } else {
        // Seed default high scores for retro authenticity
        const defaultScores: ScoreEntry[] = [
          { playerName: 'IBM_XT_8086', wpm: 85, accuracy: 98, mode: 'Chrono Speedrun', date: '1981-08-12' },
          { playerName: 'BYTE_MAGAZINE', wpm: 72, accuracy: 95, mode: 'Academy Lesson', date: '1983-04-05' },
          { playerName: 'COMMANDER_KEEN', wpm: 60, accuracy: 91, mode: 'Comet Shield', date: '1990-12-14' },
          { playerName: 'GUYBRUSH_T', wpm: 45, accuracy: 88, mode: 'Comet Shield', date: '1991-10-30' },
        ];
        localStorage.setItem('retro_tutor_scores', JSON.stringify(defaultScores));
        setHighScores(defaultScores);
      }
    } catch (e) {
      console.warn('LocalStorage retrieval failed', e);
    }
  }, []);

  // Sync mute state changes onto physical toggle buttons
  const handleToggleSound = () => {
    const isNowMuted = synth.toggleMute();
    setIsMuted(isNowMuted);
    synth.playClick(true);
  };

  // Score save handler backend
  const handleScoreResult = (wpm: number, accuracy: number, gameMode: string) => {
    // Stage score pending register flow
    setScorePendingSave({ wpm, accuracy, mode: gameMode });
    
    // Update active cumulative statistics
    setAttemptsCount(curr => {
      const next = curr + 1;
      localStorage.setItem('retro_tutor_attempts', next.toString());
      return next;
    });

    setHighestWpm(curr => {
      const max = Math.max(curr, wpm);
      localStorage.setItem('retro_tutor_max_wpm', max.toString());
      return max;
    });

    setAllTimeKeys(curr => {
      const next = curr + (wpm * 5); // Approximate standard keys
      localStorage.setItem('retro_tutor_all_keys', next.toString());
      return next;
    });

    setAverageAcc(curr => {
      let nextAcc = accuracy;
      if (curr > 0) {
        nextAcc = Math.round((curr + accuracy) / 2);
      }
      localStorage.setItem('retro_tutor_avg_acc', nextAcc.toString());
      return nextAcc;
    });
  };

  const executeScoreRegistration = () => {
    if (!scorePendingSave) return;

    const newEntry: ScoreEntry = {
      playerName: playerName.trim() || 'ANONYMOUS',
      wpm: scorePendingSave.wpm,
      accuracy: scorePendingSave.accuracy,
      mode: scorePendingSave.mode as any,
      date: new Date().toISOString().split('T')[0]
    };

    const updatedScores = [...highScores, newEntry]
      .sort((a, b) => b.wpm - a.a?.wpm || b.wpm - a.wpm) // Sort WPM descending
      .slice(0, 50); // Cap list at 50

    setHighScores(updatedScores);
    localStorage.setItem('retro_tutor_scores', JSON.stringify(updatedScores));
    
    // Clear lock
    setScorePendingSave(null);
    synth.playVictory();
    
    // Auto shift view directly to Hall of Fame to see their name on board!
    setSelectedTab('halloffame');
  };

  const clearHighScoresLog = () => {
    if (confirm('Are you secure you want to initialize and PURGE all high score charts?')) {
      localStorage.removeItem('retro_tutor_scores');
      setHighScores([]);
      synth.playError();
    }
  };

  if (!booted) {
    return <BootSequence onComplete={() => {
      setBooted(true);
    }} />;
  }

  return (
    <div 
      className={`min-h-screen ${palette.bg} transition-all duration-300 flex flex-col justify-between relative select-none font-mono p-4 md:p-6`}
      style={{ color: palette.text }}
      id="retro-app-root"
    >
      {/* CRT Grid visual filter layered on top */}
      {crtEffects && <div className="pointer-events-none absolute inset-0 z-50 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.15)_50%)] bg-[length:100%_4px] opacity-70" />}

      {/* Main geometric-balanced CRT box */}
      <div 
        className="w-full max-w-7xl mx-auto flex-1 flex flex-col overflow-hidden border-[8px] border-double shadow-[0_0_0_4px_rgba(0,0,0,1)] relative select-none"
        style={{ 
          borderColor: palette.border,
          backgroundColor: palette.panelBg,
          boxShadow: `0 0 0 4px #000000, 0 12px 32px rgba(0,0,0,0.6)`
        }}
        id="geometric-balance-container"
      >
        {/* --- UPPER RETRO BIOS TOP NAVIGATION BAR --- */}
        <header 
          className="px-4 py-3 border-b-4 flex flex-col md:flex-row justify-between items-center gap-3 z-10 bg-black/40 backdrop-blur-xs select-none"
          style={{ borderColor: palette.border }}
          id="retro-bios-header"
        >
          <div className="flex items-center gap-3">
            {/* Blinking active system icon */}
            <Terminal className="w-5 h-5 animate-pulse" style={{ color: palette.accent }} />
            <div 
              className="bg-white text-[#0000AA] px-4 py-1 font-black text-xs md:text-sm tracking-widest border-2 select-none uppercase shadow-[2px_2px_0_0_rgba(0,0,0,1)]"
              style={{ 
                color: palette.name === 'classic-blue' ? '#0000AA' : '#111111', 
                borderColor: palette.border 
              }}
            >
              TYPE_MASTER_PRO v1.2
            </div>
          </div>

        {/* Global Toolbar Quick Actions controllers */}
        <div className="flex gap-2 items-center flex-wrap justify-center text-xs">
          {/* Palette select dropdown */}
          <div className="flex items-center gap-1 border px-2 py-0.5 rounded" style={{ borderColor: palette.border + '55' }}>
            <span className="text-[10px] uppercase opacity-75 mr-1" style={{ color: palette.textMuted }}>PALETTE:</span>
            <select
              onChange={(e) => {
                const selected = RETRO_PALETTES.find(p => p.name === e.target.value);
                if (selected) {
                  setPalette(selected);
                  synth.playClick(true);
                }
              }}
              value={palette.name}
              className="bg-black/90 p-0.5 border outline-hidden uppercase cursor-pointer rounded text-[10px]"
              style={{ color: palette.accent, borderColor: palette.border + '55' }}
              id="global-palette-select"
            >
              {RETRO_PALETTES.map((p) => (
                <option key={p.name} value={p.name}>{p.label}</option>
              ))}
            </select>
          </div>

          {/* CRT Screen Toggle button */}
          <button
            onClick={() => {
              setCrtEffects(!crtEffects);
              synth.playClick(true);
            }}
            className="px-2.5 py-1 border hover:bg-white/10 transition uppercase rounded text-[10px] flex items-center gap-1 cursor-pointer"
            style={{ borderColor: palette.border + '55', color: crtEffects ? palette.accent : palette.textMuted }}
            id="crt-toggle-button"
            title="Toggle CRT Monitor Curving Filter Overlay"
          >
            <Monitor className="w-3.5 h-3.5" />
            CRT: {crtEffects ? '[ON]' : '[OFF]'}
          </button>

          {/* Audio Speaker Mute trigger */}
          <button
            onClick={handleToggleSound}
            className="px-2.5 py-1 border hover:bg-white/10 transition rounded text-[10px] flex items-center gap-1 cursor-pointer"
            style={{ 
              borderColor: palette.border + '55', 
              color: isMuted ? palette.errorBg : palette.accent 
            }}
            id="mute-toggle-button"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 animate-bounce" />}
            SPEAKER: {isMuted ? '[MUTED]' : '[SPKR ON]'}
          </button>
        </div>
      </header>

      {/* --- MIDDLE RETRO COMPONENT GRID FRAME --- */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 flex flex-col gap-6" id="main-dos-content-frame">
        
        {/* Norton Commander Menubar Tabs */}
        <div 
          className="grid grid-cols-2 md:grid-cols-5 gap-2 p-1.5 border-2 rounded-lg"
          style={{ borderColor: palette.border, backgroundColor: palette.panelBg }}
          id="retro-norton-tabs-container"
        >
          {/* Academy lessons Selection Tab */}
          <button
            onClick={() => {
              setSelectedTab('lessons');
              synth.playClick(true);
            }}
            className={`
              flex items-center justify-center gap-2 py-1.5 text-xs font-bold uppercase border-2 rounded-md transition cursor-pointer
              ${selectedTab === 'lessons' 
                ? 'shadow-[0_0_8px_rgba(255,255,255,0.15)] scale-105' 
                : 'hover:bg-white/5 opacity-80'
              }
            `}
            style={{
              backgroundColor: selectedTab === 'lessons' ? palette.accent : 'transparent',
              color: selectedTab === 'lessons' ? palette.keyboardBg : palette.text,
              borderColor: selectedTab === 'lessons' ? palette.accent : 'transparent'
            }}
            id="tab-btn-lessons"
          >
            <Keyboard className="w-4 h-4" />
            [A] ACADEMY LESSONS
          </button>

          {/* Space Comet game selection tab */}
          <button
            onClick={() => {
              setSelectedTab('comet');
              synth.playClick(true);
            }}
            className={`
              flex items-center justify-center gap-2 py-1.5 text-xs font-bold uppercase border-2 rounded-md transition cursor-pointer
              ${selectedTab === 'comet' 
                ? 'shadow-[0_0_8px_rgba(255,255,255,0.15)] scale-105' 
                : 'hover:bg-white/5 opacity-80'
              }
            `}
            style={{
              backgroundColor: selectedTab === 'comet' ? palette.accent : 'transparent',
              color: selectedTab === 'comet' ? palette.keyboardBg : palette.text,
              borderColor: selectedTab === 'comet' ? palette.accent : 'transparent'
            }}
            id="tab-btn-comet"
          >
            <Flame className="w-4 h-4" />
            [B] COMET ATTACK
          </button>

          {/* Speed limit chronometer selection tab */}
          <button
            onClick={() => {
              setSelectedTab('speedrun');
              synth.playClick(true);
            }}
            className={`
              flex items-center justify-center gap-2 py-1.5 text-xs font-bold uppercase border-2 rounded-md transition cursor-pointer
              ${selectedTab === 'speedrun' 
                ? 'shadow-[0_0_8px_rgba(255,255,255,0.15)] scale-105' 
                : 'hover:bg-white/5 opacity-80'
              }
            `}
            style={{
              backgroundColor: selectedTab === 'speedrun' ? palette.accent : 'transparent',
              color: selectedTab === 'speedrun' ? palette.keyboardBg : palette.text,
              borderColor: selectedTab === 'speedrun' ? palette.accent : 'transparent'
            }}
            id="tab-btn-speedrun"
          >
            <Timer className="w-4 h-4" />
            [C] CHRONO TEST
          </button>

          {/* High Score board tab */}
          <button
            onClick={() => {
              setSelectedTab('halloffame');
              synth.playClick(true);
            }}
            className={`
              flex items-center justify-center gap-2 py-1.5 text-xs font-bold uppercase border-2 rounded-md transition cursor-pointer
              ${selectedTab === 'halloffame' 
                ? 'shadow-[0_0_8px_rgba(255,255,255,0.15)] scale-105' 
                : 'hover:bg-white/5 opacity-80'
              }
            `}
            style={{
              backgroundColor: selectedTab === 'halloffame' ? palette.accent : 'transparent',
              color: selectedTab === 'halloffame' ? palette.keyboardBg : palette.text,
              borderColor: selectedTab === 'halloffame' ? palette.accent : 'transparent'
            }}
            id="tab-btn-halloffame"
          >
            <Trophy className="w-4 h-4" />
            [D] HALL OF FAME
          </button>

          {/* Reference Manual user manual help guides */}
          <button
            onClick={() => {
              setSelectedTab('manual');
              synth.playClick(true);
            }}
            className={`
              col-span-2 md:col-span-1 flex items-center justify-center gap-2 py-1.5 text-xs font-bold uppercase border-2 rounded-md transition cursor-pointer
              ${selectedTab === 'manual' 
                ? 'shadow-[0_0_8px_rgba(255,255,255,0.15)] scale-105' 
                : 'hover:bg-white/5 opacity-80'
              }
            `}
            style={{
              backgroundColor: selectedTab === 'manual' ? palette.accent : 'transparent',
              color: selectedTab === 'manual' ? palette.keyboardBg : palette.text,
              borderColor: selectedTab === 'manual' ? palette.accent : 'transparent'
            }}
            id="tab-btn-manual"
          >
            <HelpCircle className="w-4 h-4" />
            [E] HELP INDEX
          </button>
        </div>

        {/* Dynamic score save feedback modal overlay when drills complete */}
        {scorePendingSave && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in font-mono select-none">
            <div 
              className="max-w-md w-full p-6 border-4 relative text-center rounded-lg"
              style={{ backgroundColor: palette.panelBg, borderColor: palette.accent }}
              id="high-score-save-prompt-modal"
            >
              {/* ASCII Header border */}
              <div className="text-xs uppercase mb-2" style={{ color: palette.accent }}>
                ╔════════ NEW HIGH RECORD ACQUIRED! ════════╗
              </div>
              
              <h2 className="text-xl font-bold uppercase tracking-widest my-2" style={{ color: palette.textBright }}>
                REGISTER ON LEADERBOARD
              </h2>
              
              <p className="text-2xs uppercase mb-4" style={{ color: palette.textMuted }}>
                Mode: {scorePendingSave.mode} • Performance: <span className="font-bold underline text-white">{scorePendingSave.wpm} WPM</span>
              </p>

              {/* Input for name block */}
              <div className="flex flex-col gap-2 max-w-xs mx-auto mb-5 text-left">
                <label className="text-2xs uppercase font-bold tracking-wider" style={{ color: palette.text }}>
                  ENTER OPERATOR SIGN-OFF CODE (MAX 14 CHARS):
                </label>
                <div className="relative">
                  <input
                    type="text"
                    maxLength={14}
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value.toUpperCase().replace(/\s/g, '_'))}
                    className="w-full bg-black border-2 px-3 py-1.5 text-sm rounded font-bold uppercase tracking-widest focus:outline-hidden"
                    style={{ borderColor: palette.border, color: palette.accent }}
                    id="high-score-name-input"
                  />
                  {/* Heartbeat underline cursor effect */}
                  <span className="absolute right-3 top-2.5 w-1.5 h-3 bg-white heartbeat-cursor" style={{ backgroundColor: palette.accent }} />
                </div>
              </div>

              <div className="flex justify-center gap-3">
                <button
                  onClick={executeScoreRegistration}
                  className="px-6 py-2 border-2 text-xs uppercase font-bold cursor-pointer hover:brightness-115"
                  style={{ backgroundColor: palette.accent, color: palette.keyboardBg, borderColor: palette.accent }}
                  id="confirm-score-save-btn"
                >
                  [ TRANSMIT SCORES ]
                </button>
                <button
                  onClick={() => setScorePendingSave(null)}
                  className="px-6 py-2 border hover:bg-white/10 text-xs uppercase cursor-pointer"
                  style={{ borderColor: palette.border, color: palette.text }}
                  id="cancel-score-save-btn"
                >
                  [ DISMISS ]
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- DYNAMIC VIEWPORT INJECTION --- */}
        <section className="flex-1 select-none" id="viewport-workspace-grid">
          {selectedTab === 'lessons' && (
            <LessonsMode palette={palette} onSaveScore={handleScoreResult} />
          )}

          {selectedTab === 'comet' && (
            <CometGameMode palette={palette} onSaveScore={handleScoreResult} />
          )}

          {selectedTab === 'speedrun' && (
            <SpeedTestMode palette={palette} onSaveScore={handleScoreResult} />
          )}

          {selectedTab === 'halloffame' && (
            <div 
              className="p-6 border-2 rounded-lg flex flex-col justify-between min-h-[350px]"
              style={{ borderColor: palette.border, backgroundColor: palette.panelBg }}
              id="retro-halloffame-section"
            >
              <div>
                {/* Score panel header banner */}
                <div className="flex justify-between items-center border-b pb-3 mb-4" style={{ borderColor: palette.border + '33' }}>
                  <div>
                    <h2 className="text-base md:text-lg font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: palette.textBright }}>
                      🏆 CYBERNETIC HALL OF FAME 🏆
                    </h2>
                    <p className="text-2xs uppercase mt-0.5" style={{ color: palette.textMuted }}>
                      Historical archives recording elite biological typing accomplishments.
                    </p>
                  </div>

                  {/* Leaderboard clean action */}
                  <button
                    onClick={clearHighScoresLog}
                    disabled={highScores.length === 0}
                    className="px-3 py-1.5 text-2xs border uppercase font-bold hover:bg-red-950/40 hover:text-red-400 transition cursor-pointer flex items-center gap-1.5 disabled:opacity-40"
                    style={{ borderColor: palette.border + '33', color: palette.text }}
                    id="purge-leaderboard-btn"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    [ PURGE LEADERBOARD ]
                  </button>
                </div>

                {/* Score details matrices */}
                {highScores.length === 0 ? (
                  <div className="text-center py-12 text-xs uppercase opacity-60" style={{ color: palette.textMuted }}>
                    No current active mainframe scores logged. Complete academy lessons or game missions to submit records!
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs font-mono text-left" id="retro-scores-table">
                      <thead>
                        <tr className="border-b" style={{ borderColor: palette.border + '55', color: palette.textMuted }}>
                          <th className="pb-2 font-bold uppercase text-[10px] w-12">RANK</th>
                          <th className="pb-2 font-bold uppercase text-[10px]">OPERATOR</th>
                          <th className="pb-2 font-bold uppercase text-[10px] text-center">SPEED</th>
                          <th className="pb-2 font-bold uppercase text-[10px] text-center">ACCURACY</th>
                          <th className="pb-2 font-bold uppercase text-[10px]">MISSION TYPE</th>
                          <th className="pb-2 font-bold uppercase text-[10px] text-right">DATE LOGIC</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800">
                        {highScores.map((sc, index) => (
                          <tr 
                            key={index} 
                            className="hover:bg-white/5 transition-colors"
                          >
                            <td className="py-2.5 font-bold" style={{ color: index === 0 ? palette.accent : palette.textMuted }}>
                              #{index + 1}
                            </td>
                            <td className="py-2.5 font-extrabold uppercase tracking-widest text-[#ffffff]">
                              {sc.playerName}
                            </td>
                            <td className="py-2.5 font-bold text-center" style={{ color: palette.textBright }}>
                              {sc.wpm} WPM
                            </td>
                            <td className="py-2.5 font-bold text-center" style={{ color: palette.textBright }}>
                              {sc.accuracy}%
                            </td>
                            <td className="py-2.5 opacity-85 text-xs truncate max-w-[140px]">
                              {sc.mode}
                            </td>
                            <td className="py-2.5 text-right font-light text-2xs" style={{ color: palette.textMuted }}>
                              {sc.date}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Summary achievements panel footer */}
              <div className="mt-8 pt-4 border-t" style={{ borderColor: palette.border + '33' }}>
                <h4 className="text-xs font-bold uppercase mb-2" style={{ color: palette.textMuted }}>
                  SYSTEM HARDWARE DIAGNOSTICS:
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-2xs uppercase">
                  <div>
                    <span className="block opacity-60">AGGREGATE SESSIONS:</span>
                    <span className="text-sm font-bold block" style={{ color: palette.accent }}>{attemptsCount} ACTIVE</span>
                  </div>
                  <div>
                    <span className="block opacity-60">MAIN SYSTEM HIGHEST SPEED:</span>
                    <span className="text-sm font-bold block" style={{ color: palette.accent }}>{highestWpm} WPM</span>
                  </div>
                  <div>
                    <span className="block opacity-60">AVERAGE ACCURACY RATING:</span>
                    <span className="text-sm font-bold block" style={{ color: palette.accent }}>{averageAcc}% ACC</span>
                  </div>
                  <div>
                    <span className="block opacity-60">ESTIMATED KEYSTROKES RECORDED:</span>
                    <span className="text-sm font-bold block" style={{ color: palette.accent }}>{allTimeKeys} KEYS</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedTab === 'manual' && (
            <div 
              className="p-6 border-2 rounded-lg"
              style={{ borderColor: palette.border, backgroundColor: palette.panelBg }}
              id="retro-help-manual"
            >
              <h2 className="text-base md:text-lg font-bold uppercase tracking-wider mb-2 border-b pb-2 flex items-center gap-2" style={{ color: palette.textBright }}>
                📙 RETRO OPERATORS INSTRUCTION MANUAL 📙
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs md:text-sm mt-4 leading-relaxed">
                <div>
                  <h3 className="font-bold uppercase text-xs mb-1.5 underline" style={{ color: palette.accent }}>
                    1. Ergonomic Finger Rest Layout (Home Row)
                  </h3>
                  <p className="mb-3 opacity-90">
                    Settle your wrists neatly and steady. Place your left fingers on the keys <strong className="text-white">A, S, D, F</strong> and your right fingers on the keys <strong className="text-white">J, K, L, ;</strong>. Your thumbs should rest lightly over the Spacebar.
                  </p>

                  <h3 className="font-bold uppercase text-xs mb-1.5 underline" style={{ color: palette.accent }}>
                    2. Finger Assignments Map
                  </h3>
                  <ul className="list-disc pl-4 space-y-1 opacity-90">
                    <li><strong>Pinkys (1 &amp; 9):</strong> Type Q, A, Z (Left) &amp; P, Semicolon, Slash (Right)</li>
                    <li><strong>Rings (2 &amp; 8):</strong> Type W, S, X (Left) &amp; O, L, Period (Right)</li>
                    <li><strong>Middles (3 &amp; 7):</strong> Type E, D, C (Left) &amp; I, K, Comma (Right)</li>
                    <li><strong>Index (4 &amp; 6):</strong> Type R, T, F, G, V, B (Left) &amp; Y, U, H, J, N, M (Right)</li>
                    <li><strong>Thumbs (5):</strong> Exclusively reserves Spacebar action for perfect stride spacing.</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-bold uppercase text-xs mb-1.5 underline" style={{ color: palette.accent }}>
                    3. Key Game Rules (Comet Shield)
                  </h3>
                  <p className="mb-3 opacity-90">
                    Asteroids drop from the upper perimeter. Match the first character of any word to target the laser cannon, then type the rest of the word to blast it! If an asteroid hits the baseline, planetary shields drop by 15%. Survive as long as you can to command high leaderboards!
                  </p>

                  <h3 className="font-bold uppercase text-xs mb-1.5 underline" style={{ color: palette.accent }}>
                    4. Chronometer Evaluation
                  </h3>
                  <p className="mb-3 opacity-90">
                    Test your throughput on historic passages and classic typewriter paragraphs. Unlike single lessons, Backspace is unlocked during tests so you can fix mistakes. Maintain accuracy above 90% for professional office qualification ratings!
                  </p>

                  <div className="p-3 border rounded text-xs leading-normal bg-black/40" style={{ borderColor: palette.border + '33' }}>
                    <strong style={{ color: palette.textBright }} className="block uppercase mb-1">PC Hardware requirements (1981):</strong>
                    IBM Personal Computer 5150, Intel 8088 CPU, 64KB RAM (Upgrade to 256KB for color game mode), 83-key mechanical keyboard, CGA or Hercules monochrome terminal adapters.
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

      </main>

      {/* --- LOWER RETRO DOS BIOS FOOTER LINE --- */}
      <footer 
        className="px-4 py-1.5 border-t-2 text-[10px] md:text-xs flex flex-col md:flex-row justify-between items-center bg-black/50 backdrop-blur-xs select-none"
        style={{ borderColor: palette.border, color: palette.textMuted }}
        id="retro-bios-footer"
      >
        <span>[F1/A] Academy   [F2/B] Comet Battle   [F3/C] Speedrun   [F4/D] Highscores   [F5/E] Help</span>
        
        <span className="font-bold uppercase flex items-center gap-1 mt-1 md:mt-0" style={{ color: palette.accent }}>
          <span>C:\GAMES\TYPETUTOR&gt;</span>
          <span className="w-1.5 h-3.5 bg-white heartbeat-cursor inline-block" style={{ backgroundColor: palette.accent }} />
        </span>
      </footer>

      </div>

    </div>
  );
}
