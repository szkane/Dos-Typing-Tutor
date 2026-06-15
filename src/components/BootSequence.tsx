import React, { useState, useEffect } from 'react';
import { synth } from '../audio';

interface BootSequenceProps {
  onComplete: () => void;
}

export default function BootSequence({ onComplete }: BootSequenceProps) {
  const [lines, setLines] = useState<string[]>([]);
  const [phase, setPhase] = useState<'posting' | 'prompting' | 'completed'>('posting');
  const [promptText, setPromptText] = useState('');
  const [skipHovered, setSkipHovered] = useState(false);

  // POST (Power-On Self-Test) routine logs
  const postLogs = [
    'AST retro-BIOS v1.02a (C) 1981-1985 IBM Corp.',
    'CPU: Intel 8086 @ 4.77 MHz',
    'RAM: Checking ...',
    'RAM: 640KB BASE OK',
    'RAM: 384KB EXTENDED OK',
    'ROM BASICA: 32KB OK',
    'KEYBOARD: DETECTED (83-KEY STANDARD AT)',
    'DISPLAY: HERCULES GRAPHICS ADAPTER DETECTED',
    'STORAGE: Floppy Drive A: (5.25" 360KB) ... READY',
    'STORAGE: Hard Drive C: (10MB MFM) ... SECURE',
    ' ',
    'Running system setup diagnostics OK.',
    'Starting MS-DOS v3.30 ...',
    ' ',
    'Loading HIMEM.SYS module...',
    'Loading ANSI.SYS graphics terminal driver v3.31...',
    'AUTOEXEC.BAT executed successfully.',
    ' '
  ];

  useEffect(() => {
    let playSoundTimeout: NodeJS.Timeout;
    let timerId: NodeJS.Timeout;
    let currentLineIndex = 0;

    // Fast sequential line appender
    const showNextLine = () => {
      if (currentLineIndex < postLogs.length) {
        let text = postLogs[currentLineIndex];

        // Custom delay countdown for RAM check to make it look realistic
        if (text === 'RAM: Checking ...') {
          setLines(prev => [...prev, 'RAM: Checking (Memory Test: 128KB... 256KB... 512KB... 640KB)...']);
          setTimeout(() => {
            setLines(prev => [
              ...prev.slice(0, -1),
              'RAM: 640KB SYSTEM BASE MEMORY OK'
            ]);
            currentLineIndex++;
            timerId = setTimeout(showNextLine, 100);
          }, 400);
          return;
        }

        setLines(prev => [...prev, text]);
        currentLineIndex++;
        
        // Varying speeds
        const delay = text.trim() === '' ? 250 : Math.random() * 80 + 30;
        timerId = setTimeout(showNextLine, delay);
      } else {
        // Transition to typing prompt prompt state
        setPhase('prompting');
      }
    };

    // Play initial BIOS test click immediately
    playSoundTimeout = setTimeout(() => {
      synth.playClick(true);
      setTimeout(() => synth.playClick(false), 80);
    }, 150);

    // Initial start
    timerId = setTimeout(showNextLine, 100);

    return () => {
      clearTimeout(timerId);
      clearTimeout(playSoundTimeout);
    };
  }, []);

  // CLI typed text simulation
  useEffect(() => {
    if (phase !== 'prompting') return;

    const fullCommand = 'TYPETUTOR.EXE';
    let index = 0;
    let timerId: NodeJS.Timeout;

    // Play a dual boot beep to welcome user
    synth.playBootJingle();

    const typeCommand = () => {
      if (index < fullCommand.length) {
        const char = fullCommand[index];
        setPromptText(prev => prev + char);
        synth.playClick(false);
        index++;
        timerId = setTimeout(typeCommand, Math.random() * 100 + 80);
      } else {
        // Execute command line
        timerId = setTimeout(() => {
          setLines(prev => [
            ...prev,
            `C:\\> ${fullCommand}`,
            '  ',
            'INITIALIZING RETRO KEYBOARD MODULE...',
            'LOADING LESSON FILE DATABASE...',
            'BOOTING GAME ENVIRONMENT...',
            'SUCCESS. LOADING GRAPHICS INTERFACE INTERFACE (CGA/EGA Color)...'
          ]);

          // End sequence
          setTimeout(() => {
            onComplete();
          }, 900);
        }, 400);
      }
    };

    timerId = setTimeout(typeCommand, 600);

    return () => clearTimeout(timerId);
  }, [phase]);

  return (
    <div 
      className="absolute inset-0 bg-black text-green-500 font-mono text-xs md:text-sm p-4 md:p-8 flex flex-col justify-between select-none overflow-hidden"
      id="retro-bios-boot-screen"
    >
      {/* CRT Scanline Shader Overlay */}
      <div className="pointer-events-none absolute inset-0 z-30 bg-radial-gradient opacity-15 pointer-events-none" />
      <div className="pointer-events-none absolute inset-0 z-30 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,6px_100%]" />

      <div className="flex-1 overflow-y-auto max-w-3xl border border-green-900 bg-black/80 rounded p-4 h-[90%] font-mono leading-relaxed relative border-b-4 scrollbar-thin">
        {/* Memory status box corner */}
        <div className="absolute top-4 right-4 border border-green-800 px-3 py-1.5 bg-black text-[10px] uppercase text-green-600 rounded">
          SYSTEM: MS-DOS 3.3
        </div>

        {lines.map((line, idx) => (
          <div key={idx} className="whitespace-pre-wrap">
            {line}
          </div>
        ))}

        {phase === 'prompting' && (
          <div className="flex items-center text-green-400 mt-2 font-mono">
            <span>C:\&gt;&nbsp;</span>
            <span className="font-bold underline tracking-wider">{promptText}</span>
            <span className="w-2 h-4 bg-green-500 ml-1 heartbeat-cursor animate-[pulse_0.8s_infinite]" />
          </div>
        )}
      </div>

      {/* Retro Bottom Navigation & Command Skip */}
      <div className="mt-4 flex flex-col sm:flex-row items-center justify-between border-t border-green-950 pt-3 text-[10px] md:text-xs">
        <div className="text-green-700 font-bold uppercase select-none">
          ESC: Skip Diagnostic Loader
        </div>
        
        <button
          onClick={onComplete}
          className={`
            px-4 py-1 border transition-all duration-150 uppercase font-mono tracking-widest rounded
            ${skipHovered 
              ? 'bg-green-500 text-black border-green-400 shadow-[0_0_8px_#22c55e]' 
              : 'bg-black text-green-500 border-green-800'
            }
          `}
          onMouseEnter={() => setSkipHovered(true)}
          onMouseLeave={() => setSkipHovered(false)}
          id="skip-bios-button"
        >
          [ SKIP BOOT TO MAIN MENU ]
        </button>
      </div>
    </div>
  );
}
