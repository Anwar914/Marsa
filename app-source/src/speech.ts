let voices: SpeechSynthesisVoice[] = [];
const hasTTS = typeof window !== 'undefined' && 'speechSynthesis' in window;
if (hasTTS) {
  const load = () => { voices = window.speechSynthesis.getVoices(); };
  load();
  window.speechSynthesis.onvoiceschanged = load;
}
export const ttsSupported = hasTTS;

function pickVoice(lang: 'en' | 'de') {
  const pref = lang === 'en' ? ['en-GB', 'en-US', 'en'] : ['de-DE', 'de'];
  for (const p of pref) {
    const v = voices.find((v) => v.lang.replace('_', '-').startsWith(p));
    if (v) return v;
  }
  return undefined;
}

export function speak(text: string, lang: 'en' | 'de' = 'en', rate = 0.9) {
  if (!hasTTS) return false;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang === 'en' ? 'en-GB' : 'de-DE';
  const v = pickVoice(lang);
  if (v) u.voice = v;
  u.rate = rate;
  window.speechSynthesis.speak(u);
  return true;
}

type SR = any;
const SRClass: SR = typeof window !== 'undefined' ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition : undefined;
export const recognitionSupported = !!SRClass;

/** Speech-to-text only. Returns the browser's transcript alternatives; it does NOT analyse phonemes. */
export function listen(lang = 'en-GB'): Promise<{ transcripts: string[]; confidence: number }> {
  return new Promise((resolve, reject) => {
    if (!SRClass) return reject(new Error('Speech recognition not supported in this browser'));
    const r = new SRClass();
    r.lang = lang; r.interimResults = false; r.maxAlternatives = 5;
    let done = false;
    r.onresult = (e: any) => {
      done = true;
      const res = e.results[0];
      const transcripts: string[] = [];
      for (let i = 0; i < res.length; i++) transcripts.push(res[i].transcript);
      resolve({ transcripts, confidence: res[0]?.confidence ?? 0 });
    };
    r.onerror = (e: any) => { done = true; reject(new Error(e.error || 'recognition error')); };
    r.onend = () => { if (!done) reject(new Error('No speech detected')); };
    r.start();
  });
}

export const normalize = (s: string) => s.toLowerCase().replace(/\(.*?\)/g, '').replace(/[^a-zäöüß0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();

export function levenshtein(a: string, b: string) {
  const m = a.length, n = b.length;
  const d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 1; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++)
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[m][n];
}
export function similarity(a: string, b: string) {
  const x = normalize(a), y = normalize(b);
  if (!x && !y) return 1;
  return 1 - levenshtein(x, y) / Math.max(x.length, y.length);
}
