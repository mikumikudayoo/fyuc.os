import { HOME, entries, resolvePath, listPath, readPath, writeFile, makeDirectory, touchFile, deletePath, subscribeFiles } from './filesystem.js';

const PUBLIC_APPS = ['about', 'projects', 'games', 'music', 'accounts', 'wall'];
const OPEN_APPS = [...PUBLIC_APPS, 'files', 'terminal', 'settings', 'help', 'kernelsu'];
const COMMANDS = ['help', 'tutorial', 'ls', 'cd', 'pwd', 'cat', 'mkdir', 'touch', 'rm', 'echo', 'tree', 'find', 'grep', 'clear', 'history', 'whoami', 'hostname', 'uname', 'date', 'open', 'theme', 'reboot', 'exit', 'su', 'sudo', 'neofetch', 'reset-layout', ...PUBLIC_APPS];
const THEMES = ['mint', 'pink', 'night'];
const STORAGE_KEY = 'fyuc-terminal-state';

function loadState() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch { return {}; }
}

function matchesGlob(value, pattern) {
  let character = 0, token = 0, star = -1, retry = 0;
  while (character < value.length) {
    if (pattern[token] === '?' || pattern[token] === value[character]) { character++; token++; }
    else if (pattern[token] === '*') { star = token++; retry = character; }
    else if (star !== -1) { token = star + 1; character = ++retry; }
    else return false;
  }
  while (pattern[token] === '*') token++;
  return token === pattern.length;
}

function node(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

// A little shell parser: quoted filenames work, including the ones with spaces.
function words(command) {
  const result = [];
  let word = '', quote = '', escaping = false, started = false;
  for (const character of command) {
    if (escaping) { word += character; escaping = false; started = true; continue; }
    if (character === '\\' && quote !== "'") { escaping = true; started = true; continue; }
    if (quote) {
      if (character === quote) quote = '';
      else word += character;
      continue;
    }
    if (character === '"' || character === "'") { quote = character; started = true; continue; }
    if (/\s/.test(character)) {
      if (started) { result.push(word); word = ''; started = false; }
    } else { word += character; started = true; }
  }
  if (quote) throw new Error('a quote escaped. close it and try again.');
  if (escaping) word += '\\';
  if (started) result.push(word);
  return result;
}

function commonPrefix(values) {
  let prefix = values[0] || '';
  for (const value of values.slice(1)) {
    while (prefix && !value.startsWith(prefix)) prefix = prefix.slice(0, -1);
  }
  return prefix;
}

function quoted(value) {
  return /[\s'"\\]/.test(value) ? '"' + value.replace(/["\\]/g, '\\$&') + '"' : value;
}

export function initTerminal(container, api, options = {}) {
  const stored = loadState();
  let cwd = entries[stored.cwd]?.type === 'dir' ? stored.cwd : HOME;
  let history = Array.isArray(stored.history) ? stored.history.filter(item => typeof item === 'string').map(item => item.slice(0, 512)).slice(-100) : [];
  let historyIndex = history.length;
  let draft = '';
  let completionShownFor = '';
  let disposed = false;
  let elevated = false;
  let lesson = stored.lesson && /^\/home\/fyuc\/terminal-practice(?:-\d+)?$/.test(stored.lesson.workspace) && entries[stored.lesson.workspace]?.type === 'dir' && Number.isInteger(stored.lesson.step) && stored.lesson.step >= 0 && stored.lesson.step <= 7 ? stored.lesson : null;
  const listeners = [];

  const shell = node('div', 'terminal-shell');
  const toolbar = node('div', 'terminal-toolbar');
  const label = node('span', 'terminal-label');
  const helpButton = node('button', 'terminal-tool', 'help');
  const learnButton = node('button', 'terminal-tool', 'learn');
  const clearButton = node('button', 'terminal-tool', 'clear');
  helpButton.type = learnButton.type = clearButton.type = 'button';
  learnButton.setAttribute('aria-label', 'Start terminal tutorial');
  clearButton.id = 'clear';
  clearButton.setAttribute('aria-label', 'Clear terminal output');
  toolbar.append(label, helpButton, learnButton, clearButton);

  const tutorialPanel = node('section', 'terminal-tutorial');
  tutorialPanel.setAttribute('aria-label', 'Terminal tutorial');
  tutorialPanel.hidden = true;
  const tutorialHeader = node('div', 'terminal-tutorial-heading');
  const tutorialProgress = node('span', 'terminal-tutorial-progress');
  const tutorialStop = node('button', 'terminal-tool', 'leave lesson');
  tutorialStop.type = 'button';
  tutorialHeader.append(tutorialProgress, tutorialStop);
  const tutorialText = node('p', 'terminal-tutorial-text');
  const tutorialCommand = node('button', 'terminal-tutorial-command');
  tutorialCommand.type = 'button';
  tutorialCommand.id = 'tutorial-command';
  tutorialPanel.append(tutorialHeader, tutorialText, tutorialCommand);

  const output = node('div', 'terminal-output');
  output.id = 'terminal-output';
  output.setAttribute('role', 'log');
  output.setAttribute('aria-live', 'polite');
  output.setAttribute('aria-relevant', 'additions');
  output.setAttribute('aria-label', 'Terminal output');
  output.tabIndex = 0;

  const form = node('form', 'terminal-form');
  form.id = 'terminal-form';
  const prompt = node('span', 'terminal-prompt');
  prompt.setAttribute('aria-hidden', 'true');
  const inputLabel = node('label', 'sr-only', 'Terminal command');
  inputLabel.htmlFor = 'command';
  const input = node('input', 'terminal-input');
  input.id = 'command';
  input.type = 'text';
  input.autocomplete = 'off';
  input.maxLength = 512;
  input.spellcheck = false;
  input.setAttribute('autocapitalize', 'off');
  input.setAttribute('autocorrect', 'off');
  input.setAttribute('enterkeyhint', 'send');
  input.setAttribute('aria-describedby', 'terminal-keyboard-help');
  const submit = node('button', 'terminal-run', '↵');
  submit.type = 'submit';
  submit.setAttribute('aria-label', 'Run command');
  form.append(prompt, inputLabel, input, submit);

  const keyboardHelp = node('p', 'terminal-keyboard-help', '↑↓ history · tab completes · tab again moves focus');
  keyboardHelp.id = 'terminal-keyboard-help';
  shell.append(toolbar, tutorialPanel, output, form, keyboardHelp);
  container.replaceChildren(shell);

  function on(target, event, callback) {
    target.addEventListener(event, callback);
    listeners.push(() => target.removeEventListener(event, callback));
  }

  function displayCwd() {
    return cwd === HOME ? '~' : cwd.startsWith(HOME + '/') ? '~' + cwd.slice(HOME.length) : cwd;
  }

  function shellName() { return api.getShell?.() === 'android' ? 'termux' : 'linux'; }

  function isRoot() { return elevated || Boolean(api.getRootStatus?.()); }

  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ cwd, history, lesson })); } catch {}
  }

  function updatePrompt() {
    label.textContent = (shellName() === 'termux' ? 'termux' : 'bash') + ' / simulated shell';
    prompt.textContent = (isRoot() ? 'root' : 'fyuc') + '@' + (shellName() === 'termux' ? 'phone' : 'unsaved') + ':' + displayCwd() + (isRoot() ? ' #' : ' $');
  }

  function print(text, className = '') {
    if (disposed || text === undefined || text === null || text === '') return;
    const line = node('pre', 'terminal-line' + (className ? ' ' + className : ''), String(text));
    output.append(line);
    while (output.children.length > 100) output.firstElementChild.remove();
    output.scrollTop = output.scrollHeight;
  }

  function clear() { output.replaceChildren(); }

  function path(inputPath = '.') { return resolvePath(inputPath, cwd); }

  function exists(target) { return Boolean(entries[target]); }

  function openTarget(target) {
    if (!target) {
      api.openPath(cwd);
      return;
    }
    const app = target.toLowerCase();
    if (OPEN_APPS.includes(app)) { api.open(app); return; }
    if (app === 'bin' || app === 'recycle-bin' || app === 'trash') { api.openPath('/bin'); return; }
    const targetPath = path(target);
    if (!exists(targetPath)) throw new Error('open: no such file: ' + target);
    api.openPath(targetPath);
  }

  function lessonSteps() {
    if (!lesson) return [];
    const folder = lesson.workspace.split('/').at(-1);
    return [
      { command: 'pwd', text: 'pwd prints the folder you are in. try it below.' },
      { command: 'ls', text: 'ls lists the files and folders here. your practice folder is in this list.' },
      { command: 'cd ' + folder, text: 'cd changes folders. move into your practice folder; relative paths start where you are now.' },
      { command: 'cat welcome.txt', text: 'cat reads a text file. filenames are case-sensitive.' },
      { command: 'mkdir pocket', text: 'mkdir creates a folder. make one named pocket; it also appears in Files.' },
      { command: 'touch pocket/hello.txt', text: 'touch creates an empty file. the slash means hello.txt goes inside pocket.' },
      { command: 'rm pocket/hello.txt', text: 'rm removes a file. remove the empty practice file you just made.' },
    ];
  }

  function renderLesson() {
    tutorialPanel.hidden = !lesson;
    if (!lesson) return;
    tutorialPanel.dataset.step = String(lesson.step);
    const complete = lesson.step === 7;
    tutorialProgress.textContent = complete ? '7 / 7 · lesson complete' : 'step ' + (lesson.step + 1) + ' of 7';
    tutorialText.textContent = complete ? 'you can navigate, read, create, and remove files. try cd ~ to go home, or replay whenever you like.' : lessonSteps()[lesson.step].text;
    tutorialCommand.textContent = complete ? 'tutorial restart' : lessonSteps()[lesson.step].command;
    tutorialCommand.setAttribute('aria-label', 'Put ' + tutorialCommand.textContent + ' in the command input');
  }

  function startLesson(restart = false) {
    if (lesson && lesson.step < 7 && !restart) { renderLesson(); return; }
    let workspace = HOME + '/terminal-practice', suffix = 2;
    while (entries[workspace]) workspace = HOME + '/terminal-practice-' + suffix++;
    makeDirectory(workspace);
    writeFile(workspace + '/welcome.txt', 'hello from a text file.\n\nyou can read me here or open me in Files.\nthe same little filesystem is behind both shells.\n');
    cwd = HOME;
    lesson = { workspace, step: 0 };
    updatePrompt();
    renderLesson();
    saveState();
  }

  function advanceLesson(command) {
    if (!lesson || lesson.step >= 7) return;
    const [rawName, ...args] = words(command), name = rawName.toLowerCase();
    const target = lesson.workspace + '/pocket/hello.txt';
    const argumentsAt = expected => args.some(argument => !argument.startsWith('-') && path(argument) === expected);
    const correct = [
      () => name === 'pwd',
      () => name === 'ls' && path(args.find(argument => !argument.startsWith('-')) || '.') === HOME,
      () => name === 'cd' && cwd === lesson.workspace,
      () => name === 'cat' && argumentsAt(lesson.workspace + '/welcome.txt'),
      () => name === 'mkdir' && argumentsAt(lesson.workspace + '/pocket') && entries[lesson.workspace + '/pocket']?.type === 'dir',
      () => name === 'touch' && argumentsAt(target) && entries[target]?.type === 'text',
      () => name === 'rm' && argumentsAt(target) && !entries[target],
    ][lesson.step]();
    if (correct) { lesson.step++; renderLesson(); }
  }

  function tree(target, hidden) {
    const root = path(target || '.');
    if (!exists(root)) throw new Error('tree: no such folder: ' + (target || '.'));
    if (entries[root].type !== 'dir') throw new Error('tree: not a folder: ' + target);
    const lines = [root];
    function visit(directory, prefix, depth) {
      if (depth > 12 || lines.length >= 180) return;
      const children = listPath(directory, { hidden }).sort((a, b) => a.name.localeCompare(b.name));
      children.forEach((file, index) => {
        if (lines.length >= 180) return;
        const last = index === children.length - 1;
        lines.push(prefix + (last ? '└── ' : '├── ') + file.name + (file.type === 'dir' ? '/' : ''));
        if (file.type === 'dir') visit(file.path, prefix + (last ? '    ' : '│   '), depth + 1);
      });
    }
    visit(root, '', 0);
    print(lines.join('\n'));
  }

  function find(args) {
    const root = path(args[0] && !args[0].startsWith('-') ? args.shift() : '.');
    if (!exists(root)) throw new Error('find: no such file or folder: ' + root);
    let pattern = '*', type = '';
    while (args.length) {
      const option = args.shift(), value = args.shift();
      if (option === '-name' && value !== undefined) pattern = value;
      else if (option === '-type' && ['f', 'd'].includes(value)) type = value;
      else throw new Error('find: try find [folder] [-name "*.txt"] [-type f|d]');
    }
    const matches = Object.keys(entries).filter(target => (target === root || target.startsWith(root === '/' ? '/' : root + '/')) && matchesGlob(entries[target].name, pattern) && (!type || (type === 'd' ? entries[target].type === 'dir' : entries[target].type !== 'dir'))).sort();
    print(matches.join('\n') || '(no matching files)');
  }

  function grep(args) {
    let insensitive = false, numbered = false;
    while (args[0]?.startsWith('-')) {
      const option = args.shift();
      if (!/^-[in]+$/.test(option)) throw new Error('grep: try grep [-i] [-n] "text" file.txt');
      insensitive ||= option.includes('i');
      numbered ||= option.includes('n');
    }
    const needle = args.shift();
    if (needle === undefined || !args.length) throw new Error('grep: try grep [-i] [-n] "text" file.txt');
    const results = [];
    for (const target of args) {
      const file = path(target);
      const lines = readPath(file).split('\n');
      lines.forEach((line, index) => {
        if ((insensitive ? line.toLowerCase() : line).includes(insensitive ? needle.toLowerCase() : needle)) results.push((args.length > 1 ? target + ':' : '') + (numbered ? (index + 1) + ':' : '') + line);
      });
    }
    print(results.join('\n') || '(no matching lines)');
  }

  function help() {
    print('tutorial                     a small, guided practice lesson\n' +
      'help · open help             command list / help app\n' +
      'ls [-a] [folder]             look inside a folder\n' +
      'cd <folder> · pwd            change folders / current location\n' +
      'cat <file>                   read a text file\n' +
      'mkdir [-p] <folder>          create a folder\n' +
      'touch <file>                 create an empty file\n' +
      'rm [-r] <file>               remove your practice files\n' +
      'echo "hello" > file.txt      save text to a file\n' +
      'tree [-a] [folder]           folder tree\n' +
      'find . -name "*.txt"         find files by name\n' +
      'grep [-i] [-n] "text" <file>  search literal text\n' +
      'open <file, folder or app>   open its actual window\n' +
      'about · projects · games\n' +
      'music · accounts · wall      open a little place\n' +
      'theme [mint|pink|night]      change the entire desktop\n' +
      'reset-layout                put the furniture back\n' +
      'whoami · hostname · uname\n' +
      'date · history · clear\n' +
      'reboot · exit               these do things\n' +
      'su [root|fyuc] · sudo <cmd>   simulated superuser mode\n\n' +
      'changes are saved in this browser. tutorial files also appear in Files.');
  }

  function run(command) {
    const [name, ...args] = words(command);
    if (!name) return;
    switch (name.toLowerCase()) {
      case 'help':
        if (args[0] === 'tutorial') startLesson();
        else help();
        break;
      case 'tutorial':
        if (['off', 'stop', 'leave'].includes(args[0])) { lesson = null; renderLesson(); }
        else startLesson(args[0] === 'restart');
        break;
      case 'clear': clear(); break;
      case 'pwd': print(cwd); break;
      case 'cd': {
        const destination = path(args[0] || HOME);
        if (!exists(destination) || entries[destination].type !== 'dir') throw new Error('cd: not a folder: ' + (args[0] || HOME));
        cwd = destination;
        updatePrompt();
        break;
      }
      case 'ls': {
        const options = args.filter(argument => argument.startsWith('-'));
        if (options.some(option => !/^-[al]+$/.test(option))) throw new Error('ls: try -a to include hidden files, or -l for details');
        const hidden = options.some(option => option.includes('a'));
        const detailed = options.some(option => option.includes('l'));
        const targets = args.filter(argument => !argument.startsWith('-'));
        for (const target of targets.length ? targets : ['.']) {
          const destination = path(target);
          if (!exists(destination)) throw new Error('ls: no such file or folder: ' + target);
          if (entries[destination].type !== 'dir') { print(entries[destination].name); continue; }
          const files = listPath(destination, { hidden });
          if (targets.length > 1) print(target + ':');
          print(files.length ? files.map(file => (detailed ? file.type.padEnd(6) + ' ' : '') + file.name + (file.type === 'dir' ? '/' : '')).join(detailed ? '\n' : '   ') : '(empty. suspiciously tidy.)');
        }
        break;
      }
      case 'cat': {
        if (!args.length) throw new Error('cat: give me a filename. i cannot read your mind yet.');
        for (const target of args) print(readPath(path(target)));
        break;
      }
      case 'mkdir': {
        const parents = args.includes('-p');
        if (args.some(argument => argument.startsWith('-') && argument !== '-p')) throw new Error('mkdir: try mkdir [-p] folder');
        const targets = args.filter(argument => !argument.startsWith('-'));
        if (!targets.length) throw new Error('mkdir: give the new folder a name');
        for (const target of targets) {
          const destination = path(target);
          if (!parents) { makeDirectory(destination); continue; }
          let prefix = '';
          for (const part of destination.split('/').filter(Boolean)) {
            prefix += '/' + part;
            if (!entries[prefix]) makeDirectory(prefix);
            else if (entries[prefix].type !== 'dir') throw new Error('mkdir: not a folder: ' + prefix);
          }
        }
        break;
      }
      case 'touch':
        if (!args.length) throw new Error('touch: give the new file a name');
        for (const target of args) touchFile(path(target));
        break;
      case 'rm': {
        let recursive = false, force = false, optionsEnded = false;
        const targets = [];
        for (const argument of args) {
          if (argument === '--' && !optionsEnded) { optionsEnded = true; continue; }
          if (argument.startsWith('-') && !optionsEnded) {
            if (!/^-[rRf]+$/.test(argument)) throw new Error('rm: try rm [-r] [-f] file');
            recursive ||= /[rR]/.test(argument);
            force ||= argument.includes('f');
          } else targets.push(argument);
        }
        if (!targets.length) throw new Error('rm: give me the file you want to remove');
        for (const target of targets) {
          const destination = path(target);
          if (force && !exists(destination)) continue;
          if (entries[destination]?.type === 'dir' && !recursive) throw new Error('rm: ' + target + ' is a folder; use -r for a folder');
          deletePath(destination, { recursive });
        }
        if (!exists(cwd)) { cwd = HOME; updatePrompt(); }
        break;
      }
      case 'tree': {
        if (args.some(argument => argument.startsWith('-') && argument !== '-a')) throw new Error('tree: try tree [-a] [folder]');
        tree(args.find(argument => !argument.startsWith('-')), args.includes('-a'));
        break;
      }
      case 'find': find(args); break;
      case 'grep': grep(args); break;
      case 'whoami':
        print((isRoot() ? 'root (simulated)\n' : '') + 'mikumikudayoo / fyuc\nshe/her preferred\ncode, piano, and the thing i opened this tab for');
        break;
      case 'hostname': print('fyuc'); break;
      case 'uname': {
        const machine = shellName() === 'termux' ? 'aarch64' : 'x86_64';
        if (!args.length || args[0] === '-s') print('Linux');
        else if (args[0] === '-r') print('0.39-browser');
        else if (args[0] === '-m') print(machine + ' (simulated)');
        else if (args[0] === '-a') print('Linux fyuc 0.39-browser #1 simulated ' + machine + (shellName() === 'termux' ? ' Android' : ' GNU/Linux'));
        else throw new Error('uname: try -a, -s, -r, or -m');
        break;
      }
      case 'date':
        print(new Date().toLocaleString(undefined, { dateStyle: 'full', timeStyle: 'short' }) + '\nthere goes another minute');
        break;
      case 'open': openTarget(args.join(' ')); return true;
      case 'about': case 'projects': case 'games': case 'music': case 'accounts': case 'wall':
        api.open(name.toLowerCase());
        return true;
      case 'theme': {
        const current = api.getTheme();
        const next = args[0] ? args[0].toLowerCase() : THEMES[(Math.max(0, THEMES.indexOf(current)) + 1) % THEMES.length];
        if (!THEMES.includes(next)) throw new Error('theme: mint, pink, or night');
        api.setTheme(next);
        break;
      }
      case 'reset-layout': api.resetLayout(); break;
      case 'reboot': api.reboot(); return true;
      case 'exit':
        api.close('terminal');
        if (shellName() === 'termux') api.goHome?.();
        return true;
      case 'su': {
        if (args[0] && !['-', 'root', 'fyuc'].includes(args[0])) throw new Error('su: use root or fyuc');
        api.setRootStatus?.(args[0] !== 'fyuc');
        updatePrompt();
        print(args[0] === 'fyuc' ? 'back to fyuc.' : 'root shell (simulated). use su fyuc to return.');
        break;
      }
      case 'sudo': {
        const request = args.join(' ');
        if (request === 'return-to-home-planet') print('permission denied.\nanyway, the piano is still here.');
        else if (request === 'make me a sandwich') print('   __________\n  / lettuce /\n /_________/\n \u2591 cheese \u2591\n /_________/\n\ncompiled with one warning: no plate');
        else if (['-s', '-i', 'su', 'su root'].includes(request)) {
          api.setRootStatus?.(true); updatePrompt(); print('root shell (simulated). use su fyuc to return.');
        } else if (!args.length) print('sudo <command> runs one command as simulated root.');
        else if (args[0] === 'sudo') throw new Error('sudo: one paper crown at a time');
        else {
          elevated = true;
          try { return run(args.map(quoted).join(' ')); } finally { elevated = false; updatePrompt(); }
        }
        break;
      }
      case 'echo': {
        const redirect = args.findIndex(argument => argument === '>' || argument === '>>');
        if (redirect < 0) { print(args.join(' ')); break; }
        if (redirect !== args.length - 2) throw new Error('echo: use echo "text" > file.txt');
        const destination = path(args[redirect + 1]);
        const previous = args[redirect] === '>>' && exists(destination) ? readPath(destination) : '';
        writeFile(destination, previous + args.slice(0, redirect).join(' ') + '\n');
        break;
      }
      case 'history': print(history.map((item, index) => String(index + 1).padStart(3) + '  ' + item).join('\n')); break;
      case 'neofetch':
        print('  | |     fyuc / ' + (shellName() === 'termux' ? 'Android-ish' : 'Arch-ish') + '\n  | |     shell: ' + (shellName() === 'termux' ? 'Termux' : 'bash') + ' (simulated)\n /   \\    theme: ' + api.getTheme() + '\n \\___/    windows: ' + api.getWindows().length + '\n\n' + (shellName() === 'termux' ? 'root status: ' + (isRoot() ? 'enabled' : 'off') + ' (simulated)' : 'i use arch btw') + '\nthis diagram is probably a leek');
        break;
      default:
        throw new Error(name + ': command not found.\ntype help. or open a different tab, apparently.');
    }
  }

  function execute(command) {
    const trimmed = command.slice(0, 512).trim();
    if (!trimmed) return;
    print(displayCwd() + ' $ ' + trimmed, 'terminal-echo');
    if (history.at(-1) !== trimmed) history.push(trimmed);
    if (history.length > 100) history.shift();
    historyIndex = history.length;
    draft = '';
    completionShownFor = '';
    try {
      const result = run(trimmed);
      advanceLesson(trimmed);
      return result;
    } catch (error) { print(error.message || 'this command went sideways.', 'terminal-error'); }
    finally { saveState(); }
  }

  function completions(value) {
    let parsed;
    try { parsed = words(value); } catch { return []; }
    const trailingSpace = /\s$/.test(value);
    if (parsed.length < 2 && !trailingSpace) return COMMANDS.filter(command => command.startsWith(parsed[0] || ''));
    const command = (parsed[0] || '').toLowerCase();
    const current = trailingSpace ? '' : parsed.at(-1);
    const previous = trailingSpace ? parsed : parsed.slice(0, -1);
    const prefix = previous.map(quoted).join(' ') + ' ';
    if (command === 'theme') return THEMES.filter(theme => theme.startsWith(current)).map(theme => prefix + theme);
    if (command === 'su') return ['root', 'fyuc'].filter(user => user.startsWith(current)).map(user => prefix + user);
    if (!['ls', 'cd', 'cat', 'open', 'rm', 'touch', 'mkdir', 'tree', 'find', 'grep'].includes(command) || current.startsWith('-')) return [];
    const matches = [];
    if (command === 'open' && !current.includes('/')) {
      for (const app of [...OPEN_APPS, 'bin']) if (app.startsWith(current)) matches.push(prefix + app);
    }
    const slash = current.lastIndexOf('/');
    const base = slash >= 0 ? current.slice(0, slash + 1) : '';
    const fragment = slash >= 0 ? current.slice(slash + 1) : current;
    const directory = path(base || '.');
    if (exists(directory) && entries[directory].type === 'dir') {
      for (const file of listPath(directory, { hidden: fragment.startsWith('.') })) {
        if (!file.name.startsWith(fragment)) continue;
        if (command === 'cd' && file.type !== 'dir') continue;
        if (command === 'cat' && file.type === 'dir') continue;
        const target = base + file.name + (file.type === 'dir' ? '/' : '');
        matches.push(prefix + quoted(target));
      }
    }
    return [...new Set(matches)].sort();
  }

  on(form, 'submit', event => {
    event.preventDefault();
    const command = input.value;
    input.value = '';
    const handedOffFocus = execute(command);
    if (!handedOffFocus && !disposed && container.isConnected) input.focus({ preventScroll: true });
  });
  on(clearButton, 'click', () => { clear(); input.focus({ preventScroll: true }); });
  on(helpButton, 'click', () => { execute('help'); input.focus({ preventScroll: true }); });
  on(learnButton, 'click', () => { execute('tutorial restart'); input.focus({ preventScroll: true }); });
  on(tutorialStop, 'click', () => { execute('tutorial off'); input.focus({ preventScroll: true }); });
  on(tutorialCommand, 'click', () => {
    input.value = tutorialCommand.textContent;
    completionShownFor = '';
    input.focus({ preventScroll: true });
    input.setSelectionRange(input.value.length, input.value.length);
  });
  on(input, 'focus', updatePrompt);
  on(input, 'input', () => { completionShownFor = ''; });
  on(input, 'keydown', event => {
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      if (!history.length) return;
      event.preventDefault();
      if (historyIndex === history.length) draft = input.value;
      historyIndex = Math.max(0, Math.min(history.length, historyIndex + (event.key === 'ArrowUp' ? -1 : 1)));
      input.value = historyIndex === history.length ? draft : history[historyIndex];
      input.setSelectionRange(input.value.length, input.value.length);
      completionShownFor = '';
    } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'l') {
      event.preventDefault(); clear();
    } else if (event.key === 'Tab' && !event.shiftKey && input.value && input.selectionStart === input.value.length && input.selectionEnd === input.value.length) {
      // A repeated Tab always leaves the input, even with ambiguous matches.
      if (completionShownFor === input.value) { completionShownFor = ''; return; }
      const candidates = completions(input.value);
      if (!candidates.length) return;
      const completed = candidates.length === 1 ? candidates[0] : commonPrefix(candidates);
      if (completed && completed !== input.value) {
        event.preventDefault();
        input.value = completed;
        input.setSelectionRange(completed.length, completed.length);
        completionShownFor = completed;
      } else if (candidates.length > 1) {
        event.preventDefault();
        print(candidates.join('   '), 'terminal-completions');
        completionShownFor = input.value;
      }
    }
  });

  on(window, 'resize', updatePrompt);
  listeners.push(subscribeFiles(() => {
    if (!exists(cwd)) cwd = HOME;
    if (lesson && !exists(lesson.workspace)) { lesson = null; renderLesson(); }
    updatePrompt();
    saveState();
  }));
  updatePrompt();
  renderLesson();
  print('same files. different wallpaper.\ntype help for commands, or tutorial to learn by doing.');
  if (options.tutorial) execute('tutorial restart');
  return () => {
    saveState();
    disposed = true;
    listeners.forEach(remove => remove());
    history = [];
  };
}
