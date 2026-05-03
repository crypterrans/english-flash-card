import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import dictionary from './flashcardDictionary.json';

// ── helpers ──────────────────────────────────────────────────────────────────
const PosBadge = ({ pos }) => {
  const colors = {
    noun: 'bg-indigo-600', verb: 'bg-rose-600', adjective: 'bg-amber-600',
    idiom: 'bg-purple-600', 'phrasal verb': 'bg-pink-600', default: 'bg-slate-600',
  };
  const bg = colors[pos] ?? colors.default;
  return <span className={`${bg} text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest`}>{pos}</span>;
};

const QUIZ_SECS = 10;

// ── main component ────────────────────────────────────────────────────────────
export default function App() {
  const [level, setLevel] = useState('Elementary');
  const [theme, setTheme] = useState('Food');
  const [cardIndex, setCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [direction, setDirection] = useState(1);
  const [mode, setMode] = useState('browse'); // browse | quiz | spotlight | history
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem('flashHistory') || '[]'); } catch { return []; }
  });

  // quiz state
  const [quizTimer, setQuizTimer] = useState(QUIZ_SECS);
  const [quizRevealed, setQuizRevealed] = useState(false);

  // spotlight state
  const [spotCard, setSpotCard] = useState(null);
  const [spotKey, setSpotKey] = useState(0);
  const [spotRevealed, setSpotRevealed] = useState(false);

  // Compute themes and cards safely — always fall back so nothing crashes
  const themes = Object.keys(dictionary[level]);
  const safeTheme = themes.includes(theme) ? theme : themes[0];
  const cards = dictionary[level][safeTheme] ?? [];
  const card = cards[Math.min(cardIndex, cards.length - 1)] ?? {};

  // Synchronous handlers — update all related state in one batch (no race condition)
  const handleLevelChange = (newLevel) => {
    const firstTheme = Object.keys(dictionary[newLevel])[0];
    setLevel(newLevel);
    setTheme(firstTheme);
    setCardIndex(0);
    setIsFlipped(false);
    setQuizTimer(QUIZ_SECS);
    setQuizRevealed(false);
  };

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    setCardIndex(0);
    setIsFlipped(false);
    setQuizTimer(QUIZ_SECS);
    setQuizRevealed(false);
  };

  // save history
  useEffect(() => {
    localStorage.setItem('flashHistory', JSON.stringify(history));
  }, [history]);

  // track viewed card
  useEffect(() => {
    if (mode !== 'browse') return;
    setHistory(prev => {
      const key = `${level}::${theme}::${card.word}`;
      if (prev.find(h => h.key === key)) return prev;
      return [...prev, { key, level, theme, ...card, viewedAt: new Date().toLocaleTimeString() }];
    });
  }, [cardIndex, theme, level, mode]);

  // quiz countdown
  useEffect(() => {
    if (mode !== 'quiz' || quizRevealed) return;
    if (quizTimer <= 0) { setQuizRevealed(true); return; }
    const t = setTimeout(() => setQuizTimer(p => p - 1), 1000);
    return () => clearTimeout(t);
  }, [mode, quizTimer, quizRevealed]);

  const navigate = (dir) => {
    setDirection(dir);
    setIsFlipped(false);
    setCardIndex(p => (p + dir + cards.length) % cards.length);
  };

  const enterQuiz = () => {
    setMode('quiz');
    setQuizTimer(QUIZ_SECS);
    setQuizRevealed(false);
    setIsFlipped(false);
  };

  const fireSpotlight = useCallback(() => {
    const allLevels = Object.keys(dictionary);
    const randLevel = allLevels[Math.floor(Math.random() * allLevels.length)];
    const randThemes = Object.keys(dictionary[randLevel]);
    const randTheme = randThemes[Math.floor(Math.random() * randThemes.length)];
    const randCards = dictionary[randLevel][randTheme];
    const randCard = randCards[Math.floor(Math.random() * randCards.length)];
    setSpotCard({ ...randCard, level: randLevel, theme: randTheme });
    setSpotKey(k => k + 1);
    setSpotRevealed(false);
    setMode('spotlight');
  }, []);

  const exportHistory = () => {
    const text = history.map((h, i) =>
      `${i + 1}. ${h.emoji}  ${h.word}  (${h.partOfSpeech})\n   → ${h.exampleSentence}\n   ✦ ${h.hint}`
    ).join('\n\n');
    const blob = new Blob([`TODAY'S SESSION VOCABULARY\n${'─'.repeat(40)}\n\n${text}`], { type: 'text/plain' });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'session-vocabulary.txt' });
    a.click();
  };

  const slideVariants = {
    enter: d => ({ x: d > 0 ? 300 : -300, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: d => ({ x: d > 0 ? -300 : 300, opacity: 0 }),
  };

  const modeBtn = (m, label) => (
    <button
      onClick={() => setMode(m)}
      className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${mode === m
        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40'
        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
    >{label}</button>
  );

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center p-4 md:p-8 select-none">

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <header className="w-full max-w-4xl mb-8">
        <div className="flex flex-col md:flex-row justify-between items-center bg-slate-800 border border-slate-700 rounded-3xl p-6 shadow-2xl gap-6">
          <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 tracking-tight">
            Flash Card
          </h1>

          <div className="flex flex-wrap gap-3 items-center justify-center">
            {modeBtn('browse', '📖 Browse')}
            {modeBtn('quiz', '🎯 Quiz')}
            <button
              onClick={fireSpotlight}
              className="px-4 py-2 rounded-xl text-sm font-bold bg-slate-700 text-slate-300 hover:bg-amber-600 hover:text-white transition-all"
            >🔀 Surprise!</button>
            {modeBtn('history', `📋 History (${history.length})`)}
          </div>
        </div>
      </header>

      {/* ── CONTROLS (browse + quiz only) ──────────────────────────────────── */}
      {(mode === 'browse' || mode === 'quiz') && (
        <div className="w-full max-w-4xl flex flex-wrap gap-3 mb-6 justify-center">
          <select value={level} onChange={e => handleLevelChange(e.target.value)}
            className="bg-slate-700 text-white font-semibold px-4 py-2 rounded-xl border border-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer">
            {Object.keys(dictionary).map(l => <option key={l}>{l}</option>)}
          </select>
          <select value={safeTheme} onChange={e => handleThemeChange(e.target.value)}
            className="bg-slate-700 text-white font-semibold px-4 py-2 rounded-xl border border-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer">
            {themes.map(t => <option key={t}>{t}</option>)}
          </select>
          <span className="bg-slate-700 border border-slate-600 text-slate-300 font-bold px-4 py-2 rounded-xl text-sm">
            {cardIndex + 1} / {cards.length}
          </span>
        </div>
      )}

      {/* ── BROWSE MODE ────────────────────────────────────────────────────── */}
      {mode === 'browse' && (
        <div className="w-full max-w-4xl flex flex-col items-center gap-6">
          <div className="w-full relative flex items-center justify-center gap-4">
            <button onClick={() => navigate(-1)}
              className="z-10 w-14 h-14 rounded-full bg-slate-700 hover:bg-indigo-600 text-2xl font-black flex items-center justify-center transition-all shadow-lg flex-shrink-0">
              ‹
            </button>

            {/* Progress bar */}
            <div className="flex-grow flex flex-col gap-3">
              <div className="w-full bg-slate-700 rounded-full h-1.5">
                <div className="bg-rose-500 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${((cardIndex + 1) / cards.length) * 100}%` }} />
              </div>

              {/* Card with slide animation */}
              <div className="w-full overflow-hidden">
                <AnimatePresence mode="wait" custom={direction}>
                  <motion.div key={`${level}-${theme}-${cardIndex}`} custom={direction}
                    variants={slideVariants} initial="enter" animate="center" exit="exit"
                    transition={{ duration: 0.3, ease: 'easeInOut' }}>

                    {/* Card flip container */}
                    <div className="card-container w-full cursor-pointer" onClick={() => setIsFlipped(f => !f)}>
                      <div className={`card-inner rounded-3xl ${isFlipped ? 'flipped' : ''}`} style={{ minHeight: '340px' }}>

                        {/* FRONT */}
                        <div className="card-face w-full min-h-80 bg-gradient-to-br from-slate-800 to-indigo-950 border-2 border-indigo-700 rounded-3xl flex flex-col items-center justify-center gap-5 p-8 shadow-2xl">
                          <div className="text-8xl md:text-9xl leading-none">{card.emoji}</div>
                          <div className="text-4xl md:text-5xl font-black text-white text-center">{card.word}</div>
                          <PosBadge pos={card.partOfSpeech} />
                          <p className="text-slate-500 text-sm mt-2">Tap to reveal</p>
                        </div>

                        {/* BACK */}
                        <div className="card-face card-back w-full min-h-80 bg-gradient-to-br from-indigo-950 to-slate-900 border-2 border-rose-600/50 rounded-3xl flex flex-col items-center justify-center gap-5 p-10 shadow-2xl">
                          <p className="text-2xl md:text-3xl text-slate-100 font-medium text-center leading-relaxed italic">
                            "{card.exampleSentence}"
                          </p>
                          <div className="w-full bg-slate-800/60 rounded-2xl p-4 border border-slate-700">
                            <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-1">Hint</p>
                            <p className="text-slate-200 text-lg text-center">{card.hint}</p>
                          </div>
                          <p className="text-slate-600 text-sm">Tap to flip back</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            <button onClick={() => navigate(1)}
              className="z-10 w-14 h-14 rounded-full bg-slate-700 hover:bg-indigo-600 text-2xl font-black flex items-center justify-center transition-all shadow-lg flex-shrink-0">
              ›
            </button>
          </div>
        </div>
      )}

      {/* ── QUIZ MODE ──────────────────────────────────────────────────────── */}
      {mode === 'quiz' && (
        <div className="w-full max-w-4xl flex flex-col items-center gap-6">
          <div className="w-full bg-gradient-to-br from-slate-800 to-indigo-950 border-2 border-indigo-700 rounded-3xl p-10 flex flex-col items-center gap-6 shadow-2xl min-h-80">
            {!quizRevealed ? (
              <>
                <div className="text-9xl leading-none animate-bounce">{card.emoji}</div>
                <p className="text-slate-400 font-bold text-lg tracking-widest uppercase">What word is this?</p>
                {/* Timer ring */}
                <div className="relative w-24 h-24">
                  <svg className="absolute inset-0 -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#334155" strokeWidth="3"/>
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke={quizTimer <= 3 ? '#f43f5e' : '#6366f1'} strokeWidth="3"
                      strokeDasharray="100" strokeDashoffset={100 - (quizTimer / QUIZ_SECS) * 100}
                      strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.5s' }}/>
                  </svg>
                  <div className={`absolute inset-0 flex items-center justify-center text-3xl font-black ${quizTimer <= 3 ? 'text-rose-400' : 'text-white'}`}>
                    {quizTimer}
                  </div>
                </div>
                <button onClick={() => setQuizRevealed(true)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-8 py-3 rounded-full shadow-lg transition-all">
                  Reveal Answer
                </button>
              </>
            ) : (
              <motion.div className="flex flex-col items-center gap-5 w-full" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="text-7xl">{card.emoji}</div>
                <div className="text-5xl font-black text-white">{card.word}</div>
                <PosBadge pos={card.partOfSpeech} />
                <p className="text-2xl text-slate-200 italic text-center">"{card.exampleSentence}"</p>
                <p className="text-slate-400 text-center">{card.hint}</p>
                <div className="flex gap-3 mt-4">
                  <button onClick={() => { navigate(1); setQuizTimer(QUIZ_SECS); setQuizRevealed(false); }}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-8 py-3 rounded-full transition-all">
                    Next Card →
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      )}

      {/* ── SPOTLIGHT MODE ─────────────────────────────────────────────────── */}
      {mode === 'spotlight' && spotCard && (
        <div className="w-full max-w-4xl flex flex-col items-center gap-6">
          <AnimatePresence mode="wait">
            <motion.div key={spotKey} initial={{ scale: 0.5, rotateY: 180, opacity: 0 }}
              animate={{ scale: 1, rotateY: 0, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 18 }}
              className="w-full bg-gradient-to-br from-amber-950 to-slate-900 border-2 border-amber-500/50 rounded-3xl p-10 flex flex-col items-center gap-5 shadow-2xl min-h-80">
              <div className="flex gap-2 text-xs font-bold text-amber-400 uppercase tracking-widest">
                <span>{spotCard.level}</span><span>•</span><span>{spotCard.theme}</span>
              </div>
              <div className="text-9xl leading-none">{spotCard.emoji}</div>
              {!spotRevealed ? (
                <>
                  <p className="text-slate-400 text-lg font-bold">What word is this?</p>
                  <button onClick={() => setSpotRevealed(true)}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-black px-10 py-3 rounded-full text-lg shadow-lg transition-all">
                    Reveal!
                  </button>
                </>
              ) : (
                <motion.div className="flex flex-col items-center gap-4" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="text-5xl font-black text-white">{spotCard.word}</div>
                  <PosBadge pos={spotCard.partOfSpeech} />
                  <p className="text-2xl text-slate-200 italic text-center">"{spotCard.exampleSentence}"</p>
                  <p className="text-slate-400 text-center">{spotCard.hint}</p>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
          <button onClick={fireSpotlight}
            className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-black text-xl px-12 py-4 rounded-full shadow-2xl shadow-amber-900/40 transition-all hover:scale-105 active:scale-95">
            🔀 Another Surprise!
          </button>
        </div>
      )}

      {/* ── HISTORY MODE ───────────────────────────────────────────────────── */}
      {mode === 'history' && (
        <div className="w-full max-w-4xl flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-black text-slate-200">Today's Session ({history.length} cards)</h2>
            <div className="flex gap-3">
              {history.length > 0 && (
                <button onClick={exportHistory}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-2 rounded-xl transition-all text-sm">
                  ⬇ Export Word List
                </button>
              )}
              <button onClick={() => { setHistory([]); localStorage.removeItem('flashHistory'); }}
                className="bg-rose-700 hover:bg-rose-600 text-white font-bold px-5 py-2 rounded-xl transition-all text-sm">
                🗑 Clear
              </button>
            </div>
          </div>

          {history.length === 0 ? (
            <div className="text-center text-slate-500 py-20 text-xl italic">No cards viewed yet. Start browsing!</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {history.map((h, i) => (
                <motion.div key={h.key} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  className="bg-slate-800 border border-slate-700 rounded-2xl p-5 flex gap-4 items-start">
                  <span className="text-4xl flex-shrink-0">{h.emoji}</span>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg font-black text-white">{h.word}</span>
                      <PosBadge pos={h.partOfSpeech} />
                    </div>
                    <p className="text-slate-400 text-sm italic">"{h.exampleSentence}"</p>
                    <p className="text-xs text-slate-600 mt-1">{h.level} • {h.theme} • {h.viewedAt}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
