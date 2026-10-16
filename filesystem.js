export const HOME = '/home/fyuc';

const leek = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 260"><rect width="420" height="260" rx="18" fill="#eef5db"/><path d="M183 190 230 40 252 45 209 205Z" fill="#5aae75"/><path d="m199 186 44-149 23 8-43 157Z" fill="#8ac981"/><path d="m188 183 24 9-16 50-30-9Z" fill="#fafaf3"/><path d="m205 190 20 6-13 51-24-7Z" fill="#e4eacb"/><path d="m172 232 25 10m-21-14 25 10" stroke="#c4ccab" stroke-width="2"/><text x="24" y="33" fill="#315555" font-family="monospace" font-size="15">scan_0003.svg</text><text x="238" y="223" fill="#315555" font-family="monospace" font-size="12">important vegetable</text></svg>`;
const seed = {
  '/': { type: 'dir', name: '/' },
  '/home': { type: 'dir', name: 'home' },
  [HOME]: { type: 'dir', name: 'fyuc' },
  [`${HOME}/about`]: { type: 'dir', name: 'about' },
  [`${HOME}/about/readme.txt`]: { type: 'text', name: 'readme.txt', content: 'mikumikudayoo / also fyuc\n\nshe/her preferred.\ni write code. i play piano.\nthese are not mutually exclusive ways to suffer.\n\nfyuc was chosen because i was hunting for a short username on Discord and the best I could do is fyuc.\n\naccidentally came to earth and i cant seem to get out\n\nanyway does anyone know where i put that file' },
  [`${HOME}/about/before-messaging.txt`]: { type: 'text', name: 'before-messaging.txt', content: "chat whenever; i might take a while.\nplease don't joke about leaving, call me a troll, or make fun of my projects.\n\nthank you for visiting my pile of things." },
  [`${HOME}/about/notes.app`]: { type: 'app', name: 'notes.app', app: 'about' },
  [`${HOME}/projects`]: { type: 'dir', name: 'projects' },
  [`${HOME}/projects/github.app`]: { type: 'app', name: 'github.app', app: 'projects' },
  [`${HOME}/projects/package.txt`]: { type: 'text', name: 'package.txt', content: 'js / ts / node / bun\njava / python / bash / bat / lua / c#\n\ncurrently poking c and c++ with a stick.\n\ninstallation instructions:\n1. open the folder\n2. forget why\n3. open another folder' },
  [`${HOME}/projects/build.log`]: { type: 'text', name: 'build.log', content: '[ok] 0 errors\n[??] 1 suspicious silence\n[warning] sandwich dependency unresolved\n\nthis is a fake log. the github link is real.' },
  [`${HOME}/projects/sandwich.make`]: { type: 'weird', name: 'sandwich.make', kind: 'sandwich', content: 'target: lunch\nrequires: bread, something, bread' },
  [`${HOME}/games`]: { type: 'dir', name: 'games' },
  [`${HOME}/games/one-more.app`]: { type: 'app', name: 'one-more.app', app: 'games' },
  [`${HOME}/games/save.txt`]: { type: 'text', name: 'save.txt', content: "project sekai: sanity krush / mas 33\netoh: todc\nlobotomy corporation: mostly tuantu's lobotomization branches\nminecraft: own server, currently dormant\nalso chess.\n\n'one more attempt' has no legal meaning." },
  [`${HOME}/music`]: { type: 'dir', name: 'music' },
  [`${HOME}/music/piano.app`]: { type: 'app', name: 'piano.app', app: 'music' },
  [`${HOME}/music/playlist.txt`]: { type: 'text', name: 'playlist.txt', content: 'the same song again\nthe same song again\nwait what was that chord\nthe same song again' },
  [`${HOME}/accounts`]: { type: 'dir', name: 'accounts' },
  [`${HOME}/accounts/usernames.txt`]: { type: 'text', name: 'usernames.txt', content: 'discord: @fyuc\ngithub: @mikumikudayoo\nminecraft: @mikumikudayoo\nroblox: @mikumikumikuofficial\nchess.com: @mikudayo-1\n\nusername consistency has left the chat.' },
  [`${HOME}/accounts/contacts.app`]: { type: 'app', name: 'contacts.app', app: 'accounts' },
  [`${HOME}/downloads`]: { type: 'dir', name: 'downloads' },
  [`${HOME}/downloads/untitled_final2.txt`]: { type: 'text', name: 'untitled_final2.txt', content: 'i came here to do something.\n\nthis file contains 0 bytes of certainty.' },
  [`${HOME}/downloads/scan_0003.svg`]: { type: 'image', name: 'scan_0003.svg', src: leek, content: 'a very important drawing of a leek' },
  [`${HOME}/downloads/motivation.zip`]: { type: 'weird', name: 'motivation.zip', kind: 'motivation', content: 'archive contains: one (1) excuse' },
  [`${HOME}/downloads/do_not_open.nope`]: { type: 'weird', name: 'do_not_open.nope', kind: 'nope', content: 'the file extension is making a request' },
  [`${HOME}/THE-WALL.app`]: { type: 'app', name: 'THE-WALL.app', app: 'wall' },
  [`${HOME}/settings.app`]: { type: 'app', name: 'settings.app', app: 'settings' },
  [`${HOME}/help.app`]: { type: 'app', name: 'help.app', app: 'help' },
  [`${HOME}/KernelSU.app`]: { type: 'app', name: 'KernelSU.app', app: 'kernelsu' },
  [`${HOME}/.pocket`]: { type: 'dir', name: '.pocket' },
  [`${HOME}/.pocket/crumb.txt`]: { type: 'text', name: 'crumb.txt', content: 'you checked the hidden pocket.\n\nthere is a tiny note:\n\n   this website believes in you\n   but has lost the relevant paperwork\n\n<3' },
  [`${HOME}/.pocket/leek.txt`]: { type: 'text', name: 'leek.txt', content: 'vegetable inventory\n\n  1 leek\n  0 explanations\n\nplease rotate responsibly.' },
  [`${HOME}/.pocket/answer.txt`]: { type: 'text', name: 'answer.txt', content: '42\n\nthat was the answer.\ni have misplaced the question.\n\nclose one tab. as a treat.' },
  '/etc': { type: 'dir', name: 'etc' },
  '/etc/origin': { type: 'text', name: 'origin', content: 'accidentally came to earth and i cant seem to get out\n\nno further documentation available.\nplease return to whatever you were doing.' },
  '/bin': { type: 'dir', name: 'bin' },
  '/bin/old-confidence.txt': { type: 'text', name: 'old-confidence.txt', originalPath: `${HOME}/downloads/old-confidence.txt`, content: 'this probably belongs back on the desktop.\n\ni can make things. sometimes those things even work.' },
  '/bin/new-folder-7.txt': { type: 'text', name: 'new-folder-7.txt', originalPath: `${HOME}/downloads/new-folder-7.txt`, content: 'new folder (7)\n\nthere were six more. nobody knows what happened to them.' },
  '/bin/one-more-attempt.txt': { type: 'text', name: 'one-more-attempt.txt', originalPath: `${HOME}/games/one-more-attempt.txt`, content: 'one more attempt\none more attempt\none more attempt\n\nclose the game. go get water.' },
  '/bin/absolutely-not.tmp': { type: 'weird', name: 'absolutely-not.tmp', kind: 'stubborn', refusesDelete: true, originalPath: `${HOME}/downloads/absolutely-not.tmp`, content: 'no.' },
};

// One browser-local filesystem, shared by both shells. No real files are touched.
export const entries = {};
const listeners = new Set();
const STORAGE_KEY = 'fyuc-fake-files-v1';
const MAX_CUSTOM = 128;
const MAX_TEXT = 16384;
const MAX_STORAGE = 500000;

function persistentFiles() {
  return Object.fromEntries(Object.entries(entries).filter(([path]) => path !== '/bin' && !path.startsWith('/bin/')));
}
function persist() {
  try { globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify({ version: 1, files: persistentFiles() })); } catch { /* Storage may be unavailable; the same-tab system still works. */ }
}
function loadSavedFiles() {
  let files;
  try {
    const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
    if (!raw || raw.length > MAX_STORAGE) return;
    const saved = JSON.parse(raw);
    if (saved.version !== 1 || !saved.files || typeof saved.files !== 'object') return;
    files = Object.entries(saved.files).slice(0, Object.keys(seed).length + MAX_CUSTOM).sort(([a], [b]) => a.split('/').length - b.split('/').length);
  } catch { return; }
  for (const [path, file] of files) {
    if (!file || typeof file !== 'object' || path === '/bin' || path.startsWith('/bin/')) continue;
    try {
      validatePath(path);
      if (seed[path]) {
        if (seed[path].type === 'text' && typeof file.content === 'string' && file.content.length <= MAX_TEXT) entries[path].content = file.content;
        continue;
      }
      const parent = resolvePath('..', path);
      if (entries[parent]?.type !== 'dir') continue;
      const name = path.split('/').at(-1);
      if (file.type === 'dir') entries[path] = { type: 'dir', name };
      else if (file.type === 'text' && typeof file.content === 'string' && file.content.length <= MAX_TEXT) entries[path] = { type: 'text', name, content: file.content };
      else {
        // Restored toy files keep their own curated behavior, never stored markup.
        const original = seed[file.restoredFrom] || seed[`/bin/${name}`];
        if (original?.type === 'weird' && file.type === 'weird') {
          entries[path] = { ...original, name, restoredFrom: file.restoredFrom || `/bin/${name}` };
          delete entries[path].originalPath;
        }
      }
    } catch { /* Ignore malformed saved entries. */ }
  }
}
export function subscribeFiles(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
export function notifyFiles() {
  persist();
  for (const listener of listeners) listener();
}
export function resetFiles() {
  for (const path of Object.keys(entries)) delete entries[path];
  for (const [path, file] of Object.entries(seed)) entries[path] = { ...file };
  loadSavedFiles();
  notifyFiles();
}
resetFiles();

export function resolvePath(input = '.', cwd = HOME) {
  const value = String(input).trim().replace(/^~(?=\/|$)/, HOME);
  const parts = (value.startsWith('/') ? value : `${cwd}/${value}`).split('/');
  const result = [];
  for (const part of parts) {
    if (!part || part === '.') continue;
    if (part === '..') result.pop();
    else result.push(part);
  }
  return `/${result.join('/')}`;
}

export function listPath(path = HOME, { hidden = false } = {}) {
  const absolute = resolvePath(path);
  if (!entries[absolute]) throw new Error(`${absolute}: no such file or folder`);
  if (entries[absolute].type !== 'dir') throw new Error(`${absolute}: not a folder`);
  const prefix = absolute === '/' ? '/' : `${absolute}/`;
  return Object.entries(entries)
    .filter(([key, file]) => key.startsWith(prefix) && key !== absolute && !key.slice(prefix.length).includes('/') && (hidden || !file.name.startsWith('.')))
    .map(([key, file]) => ({ ...file, path: key }));
}

export function readPath(path) {
  const absolute = resolvePath(path);
  const file = entries[absolute];
  if (!file) throw new Error(`${absolute}: no such file or folder`);
  if (file.type === 'dir') throw new Error(`${absolute}: is a folder; try ls or open`);
  if (file.type === 'app') return `application: ${file.app}\ntry open ${absolute}`;
  return file.content ?? `${file.name}: no text preview; try open`;
}

function validatePath(input) {
  const path = resolvePath(input);
  if (path.length > 240 || /[\u0000-\u001f\u007f]/.test(path)) throw new Error('filename is too long or contains invisible control characters');
  if (!String(input).startsWith('/') || path !== input) throw new Error('use a normalized absolute path');
  return path;
}
function validateParent(path) {
  if (path === '/' || path === '/home' || path === HOME || path === '/etc' || path === '/bin') throw new Error('that is a system folder, not a new file');
  const parent = resolvePath('..', path);
  if (!entries[parent]) throw new Error(`parent folder does not exist: ${parent}`);
  if (entries[parent].type !== 'dir') throw new Error(`parent is not a folder: ${parent}`);
}
function validateSize(path, file) {
  if (!entries[path] && Object.keys(entries).filter(key => !seed[key]).length >= MAX_CUSTOM) throw new Error('the tiny filesystem is full (128 custom entries). remove a few practice files.');
  const prospective = { ...persistentFiles(), [path]: file };
  if (JSON.stringify(prospective).length > MAX_STORAGE) throw new Error('the tiny filesystem is full. keep the novels under 500kb.');
}
export function writeFile(input, content) {
  const path = validatePath(resolvePath(input));
  validateParent(path);
  const value = String(content);
  if (value.length > MAX_TEXT) throw new Error('text files can hold up to 16,384 characters. this drawer is small.');
  if (entries[path] && entries[path].type !== 'text') throw new Error(`${path}: not a text file`);
  const file = { ...(entries[path] || {}), type: 'text', name: path.split('/').at(-1), content: value };
  validateSize(path, file);
  entries[path] = file;
  notifyFiles();
  return path;
}
export function makeDirectory(input) {
  const path = validatePath(resolvePath(input));
  validateParent(path);
  if (entries[path]) throw new Error(`${path}: already exists`);
  const file = { type: 'dir', name: path.split('/').at(-1) };
  validateSize(path, file);
  entries[path] = file;
  notifyFiles();
  return path;
}
export function touchFile(input) {
  const path = validatePath(resolvePath(input));
  if (entries[path]) {
    if (entries[path].type === 'dir') throw new Error(`${path}: is a folder`);
    return path;
  }
  return writeFile(path, '');
}
export function deletePath(input, { recursive = false } = {}) {
  const path = validatePath(resolvePath(input));
  if (!entries[path]) throw new Error(`${path}: no such file or folder`);
  if (path.startsWith('/bin/')) {
    if (!removeFromBin(path)) throw new Error('this file refuses. try negotiating in the recycle bin.');
    return 1;
  }
  const children = Object.keys(entries).filter(key => key.startsWith(`${path}/`));
  if (seed[path] || children.some(key => seed[key])) throw new Error('built-in files keep the little system working. create a practice file instead.');
  if (children.length && !recursive) throw new Error(`${path}: folder is not empty; use rm -r deliberately`);
  for (const target of [path, ...children]) delete entries[target];
  notifyFiles();
  return children.length + 1;
}

export function removeFromBin(path) {
  const absolute = resolvePath(path);
  const file = entries[absolute];
  if (!absolute.startsWith('/bin/') || !file) throw new Error('that file is not in the recycle bin');
  if (file.refusesDelete) return false;
  delete entries[absolute];
  notifyFiles();
  return true;
}

export function restoreFromBin(path) {
  const absolute = resolvePath(path);
  const file = entries[absolute];
  if (!absolute.startsWith('/bin/') || !file) throw new Error('that file is not in the recycle bin');
  let target = file.originalPath || `${HOME}/downloads/${file.name}`;
  if (entries[target]) {
    const folder = resolvePath('..', target);
    const name = target.split('/').at(-1);
    const dot = name.lastIndexOf('.');
    const stem = dot > 0 ? name.slice(0, dot) : name;
    const extension = dot > 0 ? name.slice(dot) : '';
    let copy = 2;
    do { target = `${folder}/${stem}_restored_${copy++}${extension}`; } while (entries[target]);
  }
  const restored = { ...file, name: target.split('/').at(-1), restoredFrom: absolute };
  validateSize(target, restored);
  entries[target] = restored;
  delete entries[target].originalPath;
  delete entries[absolute];
  notifyFiles();
  return target;
}
