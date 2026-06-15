import { Lesson } from './types';

export const LESSONS: Lesson[] = [
  // --- HOME ROW ---
  {
    id: 'home-1',
    title: 'Home Row Foundation',
    description: 'Master the initial finger positions on the Home Row (asdf jkl;). Keep your wrists raised.',
    category: 'Home Row',
    text: 'asdf jkl; asdf jkl; a; s; d; f; j; k; l; fdsa lkjs asdf jkl; a s d f j k l ; ff jj dd kk ss ll aa ;; asdf jkl; fdsa lkjs;'
  },
  {
    id: 'home-2',
    title: 'Adding G and H Keys',
    description: 'Stretch your index fingers to reach the G and H keys on the home row.',
    category: 'Home Row',
    text: 'asdfg hjkl; gaaa h;;; ag ah jg kf ld s; ghhh fggg dsfg hjkl gfg hjh fgh gfd hjk asdfg hjkl; gh gh fg hj gf hj asdfg hjkl;'
  },
  {
    id: 'home-3',
    title: 'Home Row Words',
    description: 'Practice real full words composed entirely of home row keys.',
    category: 'Home Row',
    text: 'ask dad a glad lad; a glass flask; half gall; slag fall flask; dad salad glass ask; alfalfa slag falls fads; ash gas lash;'
  },

  // --- MIDDLE & TOP ROW ---
  {
    id: 'top-1',
    title: 'Introducing Top Row (E, R, U, I)',
    description: 'Reach upward with your middle and index fingers to type E, R, U, and I.',
    category: 'Middle & Top',
    text: 'fr4f ju7j de3d ki8k re un ire ruff deer duke jurist kid; ride ruder fire free true user rule seek; deki reju fruk ire'
  },
  {
    id: 'top-2',
    title: 'Full Top Row Mastery',
    description: 'Integrate Q, W, T, Y, O, P into your top row repertoire.',
    category: 'Middle & Top',
    text: 'qwer tyuiop power write quiet outer people retry reply tow route wire; equip priority proper type yellow your write power;'
  },
  {
    id: 'top-3',
    title: 'Mixed Row Words',
    description: 'Combine Top Row and Home Row buttons for natural English text structures.',
    category: 'Middle & Top',
    text: 'the quick brown fox jumps over the lazy dog; write a report about our retro computers; keep your fingers resting on the home keys;'
  },

  // --- BOTTOM ROW ---
  {
    id: 'bottom-1',
    title: 'Introducing Bottom Row',
    description: 'Reach downwards with your fingers to master Z, X, C, V, B, N, M, and punctuation marks.',
    category: 'Bottom Row & Shifts',
    text: 'fvf jmj cdc k,k sx s.s l/l bnb nvn zone extra civic zebra dynamic camera vibrant micro member never; back next classic code;'
  } as any, // category: 'Numbers & Symbols' or adjusted below
  {
    id: 'bottom-2',
    title: 'Capitalization & Shift Keys',
    description: 'Practice using left and right Shift keys. Keep your caps look off!',
    category: 'Numbers & Symbols',
    text: 'The Quick Brown Fox Jumps Over The Lazy Dog. DOS Typing Tutor Game. IBM PC Model M Keyboard. Commodore Sixty Four.'
  },

  // --- NUMBERS & SYMBOLS ---
  {
    id: 'num-1',
    title: 'The Numeric Row',
    description: 'Reach up beyond the top alphabetical row to type numbers 0 to 9 accurately.',
    category: 'Numbers & Symbols',
    text: '123 456 789 000 10 20 30 1981 1995 2026 8086 486dx2 586 pentium; screen resolution 640x480 pixels 16 primary colors;'
  },
  {
    id: 'num-2',
    title: 'Brackets & Arithmetic Symbols',
    description: 'Essential layout practice with symbols used in command-line scripting and programming: [] {} () += -_ * &.',
    category: 'Code & Special',
    text: 'a[i] = b[x] + (c * d); function(arg) { return arg_index; }; (x === y) && (z != w); Math.sqrt(pow * 3); [x, y, ...z];'
  },

  // --- Programmer Retro Code ---
  {
    id: 'code-html',
    title: 'Retro HTML Block Layout',
    description: 'Practice double quotes, brackets, angle markers, and HTML-specific tag characters.',
    category: 'Code & Special',
    text: '<div id="main" class="container"><h1 class="logo">C:\\> RETRO</h1><p>Typing Tutor 1.0</p><button onClick={handleRun}>RUN</button></div>'
  },
  {
    id: 'code-js',
    title: 'JavaScript Loop Logic',
    description: 'Type high-density structures representing JavaScript classes, loops, and objects.',
    category: 'Code & Special',
    text: 'const calculateWpm = (chars, time) => { return Math.round((chars / 5) / (time / 60)); }; for (let i = 0; i < len; i++) { items[i].update(); }'
  },
  {
    id: 'code-sql',
    title: 'Classic SQL Relational Query',
    description: 'Practice SQL uppercase keywords, quotes, brackets, and semicolon terminations.',
    category: 'Code & Special',
    text: 'SELECT p.name, s.score, s.date FROM players p INNER JOIN scores s ON p.id = s.player_id WHERE s.wpm > 60 ORDER BY s.accuracy DESC;'
  },

  // --- HISTORICAL & RETRO MANUALS ---
  {
    id: 'retro-ibm',
    title: 'IBM PC User Manual (1981)',
    description: 'Excerpts from original manuals describing system configuration, booting DOS, and diagnostic routines.',
    category: 'Custom Drill',
    text: 'Welcome to Personal Computing on the IBM Personal Computer. Insert the DOS system diskette in drive A. Close the drive door latches. Secure power switch. Look for the system to execute Power-On Self-Test (POST).'
  },
  {
    id: 'retro-bbs',
    title: 'BBS Modem Connection Log',
    description: 'Nostalgic trace log of telephone dial-up handshake terminal connections.',
    category: 'Custom Drill',
    text: 'ATDT 1-800-RETRO-BBS ... DIALING ... RING ... CONNECT 2400 / ARQ / V.22BIS / MNPA5 ... welcome to the Galactic-Link Bulletin Board System! Please enter your user handle.'
  }
];

export const RETRO_WORDS = [
  'dos', 'ibm', 'bios', 'cpu', 'ram', 'rom', 'disk', 'diskette', 'floppy', 'micro', 'chip', 'modem', 'terminal', 'pixel',
  'cyber', 'basic', 'pascal', 'cobol', 'prompt', 'manual', 'laser', 'comet', 'shield', 'retro', 'arcade', 'cursor', 'mouse',
  'system', 'power', 'matrix', 'pixels', 'screen', 'raster', 'vector', 'vintage', 'classic', 'keyboard', 'clack', 'click',
  'monitor', 'cathode', 'phosphor', 'amber', 'matrix', 'printer', 'joystick', 'hardware', 'assembly', 'subroutine'
];

export const GAME_POOLS = {
  easy: [
    'dos', 'ibm', 'run', 'dir', 'ram', 'rom', 'cpu', 'sys', 'cmd', 'log', 'cls', 'key', 'bat', 'com', 'exe', 'app', 'bin', 'txt', 'cfg'
  ],
  medium: [
    'floppy', 'matrix', 'vector', 'pixels', 'prompt', 'manual', 'basic', 'pascal', 'cursor', 'modem', 'shield', 'screen', 'system', 'binary',
    'driver', 'kernel', 'loader', 'memory', 'screen', 'buffer', 'copper', 'raster', 'serial', 'device'
  ],
  hard: [
    'motherboard', 'microprocessor', 'floppy-disk', 'command-line', 'command.com', 'config.sys', 'autoexec.bat', 'retro-computing', 'mechanical',
    'sound-blaster', 'resolutions', 'cybernetics', 'clock-speeds', 'multiplexing', 'interupt', 'synthesizer'
  ]
};
