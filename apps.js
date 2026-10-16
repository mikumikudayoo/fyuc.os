import { HOME, entries, resolvePath, listPath, readPath, writeFile, makeDirectory, touchFile, removeFromBin, restoreFromBin, subscribeFiles } from './filesystem.js';

const node = (tag, className = '', text = '') => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== '') element.textContent = text;
  return element;
};
const add = (parent, ...children) => { parent.append(...children); return parent; };
const button = (label, action, className = 'small-button') => {
  const element = node('button', className, label);
  element.type = 'button';
  element.addEventListener('click', action);
  return element;
};
const anchor = (label, url, className = 'button') => {
  const element = node('a', className, label);
  element.href = url;
  element.target = '_blank';
  element.rel = 'noopener noreferrer';
  return element;
};
const fileIcon = file => ({ dir: '▰', text: '▤', image: '▧', app: '✳', weird: '◇' }[file.type] || '◇');

function start(container, heading, eyebrow) {
  container.replaceChildren();
  if (eyebrow) container.append(node('p', 'eyebrow', eyebrow));
  container.append(node('h2', '', heading));
  return container;
}
function scrap(label, color, heading, text) {
  const card = node('article', `scrap ${color}`);
  card.append(node('span', 'file-label', label));
  if (heading) card.append(node('h3', '', heading));
  if (text) card.append(node('p', '', text));
  return card;
}
function fileButton(file, open) {
  const item = button('', () => open(file.path), 'file-item');
  item.dataset.path = file.path;
  item.setAttribute('aria-label', `open ${file.name}${file.type === 'dir' ? ' folder' : ''}`);
  add(item, node('span', 'file-symbol', fileIcon(file)), node('span', 'file-name', file.name), node('small', '', file.type === 'dir' ? 'folder' : file.type === 'app' ? 'little application' : file.type === 'weird' ? 'questionable file' : file.type));
  return item;
}

export function createApps(api) {
  return {
    settings: {
      title: 'settings / the control drawer',
      render(container) {
        start(container, 'make yourself comfortable', 'a few switches that actually switch things');
        const themes = node('fieldset', 'settings-group');
        themes.append(node('legend', '', 'accent'));
        const themeButtons = ['mint', 'pink', 'night'].map(name => {
          const choice = button(name, () => { api.setTheme(name); paint(); }, 'theme-choice small-button');
          choice.dataset.theme = name;
          themes.append(choice);
          return choice;
        });
        const wallpaper = node('fieldset', 'settings-group');
        wallpaper.append(node('legend', '', 'emu.mp4 / ambient wallpaper'));
        const wallpaperButtons = [['auto', 'automatic'], ['on', 'video on'], ['off', 'still image']].map(([mode, label]) => {
          const choice = button(label, () => { api.setWallpaperMode?.(mode); paint(); }, 'wallpaper-choice small-button');
          choice.dataset.wallpaper = mode;
          wallpaper.append(choice);
          return choice;
        });
        wallpaper.append(node('p', 'small muted', 'automatic keeps things quiet on small screens and when reduced motion is enabled.'));
        const system = node('p', 'system-info small');
        const tools = node('div', 'toolbar');
        add(tools, button('reset icon & window layout', () => api.resetLayout()), button('terminal lesson', () => api.open('terminal', { tutorial: true })), button('KernelSU', () => api.open('kernelsu')));
        const paint = () => {
          for (const choice of themeButtons) choice.setAttribute('aria-pressed', String(choice.dataset.theme === api.getTheme()));
          for (const choice of wallpaperButtons) choice.setAttribute('aria-pressed', String(choice.dataset.wallpaper === (api.getWallpaperMode?.() || 'auto')));
          system.textContent = `${api.getShell?.() === 'android' ? 'android-style shell / rooted little phone' : 'linux-style shell / i use arch btw'} · same files, different furniture`;
        };
        add(container, themes, wallpaper, tools, system, node('p', 'small muted', 'saved notes and practice files stay on this browser. reboot puts the temporary mess back, but keeps your saved files.'));
        paint();
        document.addEventListener('fyuc-system-change', paint);
        return () => document.removeEventListener('fyuc-system-change', paint);
      }
    },
    help: {
      title: 'help / what does this button do',
      render(container) {
        start(container, 'a tiny place you can poke', 'the terminal accidentally became educational');
        const tutorial = scrap('how-to-terminal.txt', 'mint', 'start with the little blinking cursor', 'learn to find your folder, read a file, make one, and remove your practice file. the lesson reacts to the commands you type.');
        const launch = button('start terminal lesson →', () => api.open('terminal', { tutorial: true }));
        launch.dataset.action = 'start-tutorial';
        tutorial.append(launch);
        const files = scrap('same drawer, different furniture', 'lavender', 'your files live here', 'desktop and phone-sized layouts share the same browser storage. create a note in Files or the terminal; open it from either shell.');
        files.append(button('open Files', () => api.open('files', { path: HOME })));
        const controls = scrap('controls.txt', '', 'how to move around', 'desktop: double click icons, drag title bars, use the panel to restore windows. keyboard: Enter opens a focused icon. phone: tap an app; use Home and Recents.');
        const safety = node('p', 'small muted', 'this is a simulated system. terminal commands change these browser-local toy files, never your actual computer or phone.');
        const cards = node('div', 'scraps');
        add(cards, tutorial, files, controls);
        add(container, cards, safety, button('open the wall instead', () => api.open('wall'), 'text-button'));
      }
    },
    kernelsu: {
      title: 'KernelSU / pretend superuser manager',
      render(container) {
        start(container, 'KernelSU', 'a simulated root manager for this little front-end system');
        let grants = { terminal: true, files: true, music: false };
        try {
          const stored = JSON.parse(localStorage.getItem('fyuc-app-grants'));
          for (const key of Object.keys(grants)) if (typeof stored?.[key] === 'boolean') grants[key] = stored[key];
        } catch { /* The manager still works without storage. */ }
        const status = node('div', 'root-status');
        const badge = node('span', 'root-badge');
        const label = node('h3', 'root-state');
        const description = node('p', 'small');
        const statusCopy = node('div', 'root-status-copy');
        statusCopy.style.minWidth = '0';
        add(statusCopy, label, description);
        add(status, badge, statusCopy);
        const toggle = button('', () => { api.setRootStatus?.(!api.getRootStatus?.()); paint(); });
        toggle.dataset.action = 'toggle-root';
        const permissions = node('fieldset', 'settings-group root-grants');
        permissions.append(node('legend', '', 'pretend superuser access'));
        const controls = [];
        for (const [app, name] of [['terminal', 'terminal / termux-ish'], ['files', 'file drawer'], ['music', 'the piano, for some reason']]) {
          const row = node('label', 'permission-row');
          const checkbox = node('input');
          checkbox.type = 'checkbox';
          checkbox.checked = grants[app];
          checkbox.dataset.grant = app;
          const result = node('span', 'permission-state');
          checkbox.addEventListener('change', () => {
            grants[app] = checkbox.checked;
            try { localStorage.setItem('fyuc-app-grants', JSON.stringify(grants)); } catch { /* Same-tab operation remains available. */ }
            paint();
          });
          add(row, checkbox, node('span', '', name), result);
          permissions.append(row);
          controls.push({ app, checkbox, result });
        }
        const paint = () => {
          const enabled = Boolean(api.getRootStatus?.());
          status.dataset.root = String(enabled);
          badge.textContent = enabled ? '#' : '$';
          label.textContent = enabled ? 'simulated root: active' : 'simulated root: asleep';
          description.textContent = enabled ? 'the tiny paper crown is on.' : 'normal browser-user energy.';
          toggle.textContent = enabled ? 'disable simulated root' : 'enable simulated root';
          toggle.setAttribute('aria-pressed', String(enabled));
          for (const { app, checkbox, result } of controls) {
            checkbox.disabled = !enabled;
            result.textContent = !enabled ? 'root asleep' : grants[app] ? 'allowed in the pretend manager' : 'ordinary app energy';
          }
        };
        add(container, status, toggle, permissions, node('p', 'small muted', 'these switches only change this website’s simulation. they grant no real device permissions.'), button('open terminal', () => api.open('terminal'), 'text-button'));
        paint();
        document.addEventListener('fyuc-system-change', paint);
        return () => document.removeEventListener('fyuc-system-change', paint);
      }
    },
    about: {
      title: 'notes / what was i doing',
      render(container) {
        start(container, 'i had a reason for opening this', 'readme, a receipt, and several thoughts');
        const cards = node('div', 'scraps');
        const bio = scrap('readme.txt', 'mint', 'mikumikudayoo / also fyuc', 'i write code. i play piano. these are not mutually exclusive ways to suffer.');
        bio.append(node('p', 'small', 'she/her preferred'));
        const username = scrap('username archaeology', 'lavender', 'four letters. somehow.', 'fyuc was chosen because i was hunting for a short username on Discord and the best I could do is fyuc.');
        bio.append(button('open the actual note', () => api.openPath(`${HOME}/about/readme.txt`), 'text-button'));
        const rhythm = scrap('receipt, probably', 'pink', 'sanity krush / mas 33 ✓', 'yes this goes next to the bio');
        rhythm.append(button('inspect this completely unrelated thing', () => api.open('games'), 'text-button'));
        const todo = scrap('todo_final_FINAL.txt', '', 'to do', '');
        const list = node('ul', 'todo');
        for (const [label, checked] of [['make a website', true], ['learn c / c++', false], ['stop opening tabs', false]]) {
          const item = node('li');
          const field = node('label');
          const checkbox = node('input');
          checkbox.type = 'checkbox';
          checkbox.checked = checked;
          checkbox.addEventListener('change', () => field.classList.toggle('done', checkbox.checked));
          if (checked) field.classList.add('done');
          add(field, checkbox, document.createTextNode(` ${label}`));
          item.append(field);
          list.append(item);
        }
        const extra = button('do the thing', () => {
          const blank = node('input', 'todo-input');
          blank.type = 'text';
          blank.placeholder = 'what thing';
          blank.setAttribute('aria-label', 'the thing you were going to do');
          extra.replaceWith(blank);
          blank.focus();
        }, 'text-button');
        add(todo, list, extra);
        const piano = scrap('meanwhile', 'lavender', 'there is a piano in another tab', 'vocaloid is also here. it has admin privileges.');
        piano.append(button('open the loud folder', () => api.open('music'), 'text-button'));
        const reminder = scrap('loose note', 'pink', '', 'i came here to do something.');
        const sentence = reminder.querySelector('p');
        let remembers = 0;
        const recall = button('remember what', () => {
          remembers += 1;
          sentence.textContent = ['it was extremely important.', 'wait. no. that was yesterday.', 'i wanted to move this note.', 'oh! water. probably.'][Math.min(remembers - 1, 3)];
          reminder.style.transform = `rotate(${[4, -3, 7, 0][(remembers - 1) % 4]}deg)`;
          if (remembers === 4) {
            recall.textContent = 'okay, put it somewhere else';
            recall.onclick = () => cards.prepend(reminder);
          }
        }, 'text-button');
        reminder.append(recall);
        add(cards, bio, rhythm, todo, piano, reminder, username);
        const toolbar = node('div', 'toolbar');
        const shuffle = button('rearrange thoughts', () => {
          const items = [...cards.children];
          cards.prepend(items[items.length - 1]);
          items.forEach((item, i) => { item.style.transform = `rotate(${[-2, 2, -1, 3, 0][(i + remembers) % 5]}deg)`; });
        });
        add(toolbar, shuffle, button('put them in a folder', () => api.open('files', { path: `${HOME}/about` })));
        const details = node('details');
        add(details, node('summary', '', 'before messaging me'), node('p', '', "chat whenever; i might take a while. please don't joke about leaving, call me a troll, or make fun of my projects."));
        add(container, cards, toolbar, details);
      }
    },
    projects: {
      title: 'projects / crumbs included',
      render(container) {
        start(container, 'it worked a second ago', 'the github link is real. the sandwich compiler is not.');
        const cards = node('div', 'scraps');
        const github = scrap('src/actually-real', 'mint', 'the github pile ↗', 'actual repositories. potentially several unfinished thoughts.');
        github.append(anchor('open github ↗', 'https://github.com/mikumikudayoo'));
        const languages = scrap('package.txt', '', 'js / ts / node / bun', 'also java, python, bash, bat, lua, c#. currently poking c and c++ with a stick.');
        languages.append(button('open package.txt', () => api.openPath(`${HOME}/projects/package.txt`), 'text-button'));
        const tower = scrap('unrelated benchmark', 'pink', 'todc cleared', 'etoh. the floor and i are on speaking terms again.');
        tower.append(button('why is this here', () => api.open('games'), 'text-button'));
        const compiler = scrap('sandwich.make', 'lavender', 'build target: lunch', '');
        const stage = node('div', 'sandwich-stack');
        stage.setAttribute('aria-live', 'polite');
        stage.append(node('span', 'sandwich-placeholder', '□'));
        let layers = 0;
        const compile = button('compile a sandwich', () => {
          if (layers === 0) stage.replaceChildren();
          const texts = ['bread', '???', 'lettuce', 'bread'];
          if (layers < 4) {
            stage.append(node('div', `sandwich-layer layer-${layers}`, texts[layers]));
            layers += 1;
            compile.textContent = layers === 4 ? 'clean build' : 'add next dependency';
          } else {
            stage.replaceChildren(node('span', 'sandwich-placeholder', '□'));
            layers = 0;
            compile.textContent = 'compile a sandwich';
          }
        });
        add(compiler, stage, compile);
        add(cards, github, languages, tower, compiler);
        const files = node('div', 'file-grid compact-files');
        for (const file of listPath(`${HOME}/projects`).filter(f => f.type !== 'app')) files.append(fileButton(file, api.openPath));
        add(container, cards, node('h3', '', 'loose files'), files, button('open the whole folder', () => api.open('files', { path: `${HOME}/projects` })));
      }
    },
    games: {
      title: 'one more attempt*',
      render(container) {
        start(container, 'one more attempt*', '*a legally meaningless phrase');
        const cards = node('div', 'scraps');
        const sekai = scrap('project sekai', 'pink', 'sanity krush / mas 33', 'hardest clear. the title is a warning.');
        const tapBoard = node('div', 'rhythm-widget');
        const progress = node('progress', 'progress');
        progress.max = 8;
        progress.value = 0;
        progress.setAttribute('aria-label', 'unrelated button practice, eight taps');
        const hits = node('span', 'small', '0 / 8 entirely unserious taps');
        let taps = 0;
        const tap = button('♪', () => {
          taps = (taps + 1) % 9;
          progress.value = taps;
          hits.textContent = taps === 8 ? 'combo! the button has learned nothing.' : `${taps} / 8 entirely unserious taps`;
          tap.style.transform = `rotate(${taps % 2 ? -8 : 8}deg)`;
          tap.textContent = taps === 8 ? '✧' : '♪';
        }, 'rhythm-pad');
        tap.setAttribute('aria-label', 'tap the rhythm practice button');
        add(tapBoard, tap, progress, hits);
        sekai.append(tapBoard);
        const etoh = scrap('etoh', 'mint', 'todc', 'hardest tower. gravity continues to be rude.');
        const shaft = node('div', 'gravity-stage');
        const floor = node('div', 'gravity-floor', 'the floor');
        const climber = node('span', 'gravity-piece', '▣');
        add(shaft, floor, climber);
        let height = 0;
        const climb = button('one step up', () => {
          height += 1;
          if (height > 4) height = 0;
          climber.style.bottom = `${16 + height * 22}px`;
          climb.textContent = height === 4 ? 'surely this one is safe' : height === 0 ? 'okay. one step up.' : 'one step up';
          floor.textContent = height === 0 ? 'welcome back' : 'the floor';
        });
        add(etoh, shaft, climb);
        const facility = scrap('lobotomy corporation', '', 'this seems manageable', "mostly tuantu's lobotomization branches.");
        const staff = node('div', 'staff-list');
        staff.hidden = true;
        const states = ['taking a very small break', 'standing near a suspicious door', 'has misplaced the clipboard'];
        states.forEach((state, i) => {
          const row = node('div', 'employee');
          const name = node('span', '', `employee ${i + 1}: ${state}`);
          const action = button('send home', () => {
            name.textContent = `employee ${i + 1}: gone home ✓`;
            action.remove();
            row.classList.add('employee-safe');
          }, 'text-button');
          add(row, name, action);
          staff.append(row);
        });
        const inspect = button('check on the employees', () => {
          staff.hidden = !staff.hidden;
          inspect.textContent = staff.hidden ? 'check on the employees' : 'close the clipboard';
          inspect.setAttribute('aria-expanded', String(!staff.hidden));
        });
        inspect.setAttribute('aria-expanded', 'false');
        add(facility, inspect, staff);
        const minecraft = scrap('minecraft', 'lavender', 'server status: zzz', 'my server is currently dormant. let it nap.');
        const blanket = button('tuck it in', () => {
          minecraft.classList.toggle('tucked-in');
          blanket.textContent = minecraft.classList.contains('tucked-in') ? 'remove blanket' : 'tuck it in';
          minecraft.querySelector('h3').textContent = minecraft.classList.contains('tucked-in') ? 'server status: zzz ▱' : 'server status: zzz';
        });
        minecraft.append(blanket);
        add(cards, sekai, etoh, facility, minecraft);
        add(container, cards, node('p', 'margin-note', 'also chess. a completely different way to hang a piece.'), button('open save.txt', () => api.openPath(`${HOME}/games/save.txt`), 'text-button'));
      }
    },
    music: {
      title: 'audio / please knock',
      render(container) {
        start(container, "there's a piano in here", 'volume: your decision');
        container.append(node('p', '', 'and vocaloid. and probably a song stuck on the same eight seconds.'));
        let audio = null;
        let timer = null;
        let playing = false;
        let step = 0;
        let disposed = false;
        let audioLevel = 0.18;
        const sound = frequency => {
          if (disposed || audioLevel <= 0) return;
          try {
            const Context = window.AudioContext || window.webkitAudioContext;
            if (!Context) { soundStatus.textContent = 'this browser has misplaced the audio. the keys still light up.'; return; }
            audio ||= new Context();
            if (audio.state === 'suspended') audio.resume().catch(() => {});
            const oscillator = audio.createOscillator();
            const gain = audio.createGain();
            oscillator.type = 'triangle';
            oscillator.frequency.value = frequency;
            gain.gain.setValueAtTime(audioLevel, audio.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.35);
            oscillator.connect(gain);
            gain.connect(audio.destination);
            oscillator.start();
            oscillator.stop(audio.currentTime + 0.36);
            oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
          } catch { soundStatus.textContent = 'audio is unavailable here. your imaginary performance was excellent.'; }
        };
        const keys = node('div', 'keyboard');
        keys.setAttribute('role', 'group');
        keys.setAttribute('aria-label', 'play piano notes');
        const frequencies = [261.63, 293.66, 329.63, 349.23, 392, 440, 493.88, 523.25];
        const names = ['c', 'd', 'e', 'f', 'g', 'a', 'b', 'high c'];
        const keyButtons = [];
        const soundStatus = node('p', 'small muted', 'click a key. tiny synthesized notes. no autoplay.');
        const played = node('div', 'note-strip');
        played.setAttribute('aria-label', 'last played notes');
        frequencies.forEach((frequency, i) => {
          const key = button(i === 7 ? 'c' : names[i], () => {
            sound(frequency);
            played.append(node('span', 'played-note', names[i]));
            if (played.children.length > 12) played.firstElementChild.remove();
            keyButtons.forEach(item => item.classList.remove('active-note'));
            key.classList.add('active-note');
          }, 'piano-key');
          key.dataset.note = String(frequency);
          key.setAttribute('aria-label', `play ${names[i]}`);
          keyButtons.push(key);
          keys.append(key);
        });
        const player = node('section', 'player');
        const label = node('h3', '', 'three_notes_again.wav');
        const timeline = node('progress', 'progress');
        timeline.max = 8;
        timeline.value = 0;
        timeline.setAttribute('aria-label', 'tiny loop playback position');
        const counter = node('span', 'small', '0:00 / 0:08');
        const controls = node('div', 'toolbar');
        const pattern = [0, 2, 4, 2, 0, 2, 4, 2];
        const update = () => {
          timeline.value = step;
          counter.textContent = `0:0${step} / 0:08`;
        };
        const pause = () => {
          playing = false;
          clearInterval(timer);
          timer = null;
          play.textContent = '▶ play tiny loop';
          play.setAttribute('aria-pressed', 'false');
          keyButtons.forEach(key => key.classList.remove('active-note'));
        };
        const tick = () => {
          if (document.hidden) { pause(); return; }
          const note = pattern[step % pattern.length];
          sound(frequencies[note]);
          keyButtons.forEach((key, i) => key.classList.toggle('active-note', i === note));
          step = (step + 1) % 8;
          update();
        };
        const play = button('▶ play tiny loop', () => {
          if (playing) { pause(); return; }
          playing = true;
          play.textContent = 'Ⅱ pause tiny loop';
          play.setAttribute('aria-pressed', 'true');
          tick();
          timer = setInterval(tick, 1000);
        });
        play.setAttribute('aria-pressed', 'false');
        add(controls, button('↶ rewind', () => { step = 0; update(); }), play, button('↷ skip', () => {
          step = (step + 3) % 9;
          label.textContent = ['three_notes_again.wav', 'three_notes_again_final.wav', 'wait_what_was_that_chord.wav'][Math.floor(step / 3)];
          update();
        }));
        const volumeLabel = node('label', 'volume-control', 'actual piano volume ');
        const volume = node('input');
        volume.type = 'range';
        volume.min = '0';
        volume.max = '100';
        volume.value = '60';
        volume.setAttribute('aria-label', 'piano volume');
        volume.addEventListener('input', () => { audioLevel = Number(volume.value) / 100 * 0.3; });
        volumeLabel.append(volume);
        add(player, label, timeline, counter, controls, volumeLabel, node('p', 'small muted', 'a tiny synthesized loop. this is not a streaming service.'));
        add(container, keys, soundStatus, played, player, button('open playlist.txt', () => api.openPath(`${HOME}/music/playlist.txt`), 'text-button'));
        return () => { disposed = true; clearInterval(timer); if (audio) audio.close().catch(() => {}); };
      }
    },
    accounts: {
      title: 'same person / several usernames',
      render(container) {
        start(container, 'oh yeah you can find me', 'username consistency has left the chat');
        const rows = [
          ['discord', '@fyuc'],
          ['github ↗', '@mikumikudayoo', 'https://github.com/mikumikudayoo'],
          ['minecraft', '@mikumikudayoo'],
          ['roblox', '@mikumikumikuofficial'],
          ['chess.com ↗', '@mikudayo-1', 'https://www.chess.com/member/mikudayo-1'],
        ];
        for (const [service, name, url] of rows) {
          const row = url ? anchor('', url, 'account') : node('div', 'account');
          add(row, node('span', '', service), node('strong', '', name));
          container.append(row);
        }
        add(container, node('p', 'margin-note', 'replies may arrive after an unspecified number of side quests.'), button('open the username file', () => api.openPath(`${HOME}/accounts/usernames.txt`), 'text-button'));
      }
    },
    files: {
      title: 'file drawer / please do not sort',
      render(container, options = {}) {
        start(container, 'the drawer', 'folders within folders. very normal.');
        const toolbar = node('div', 'toolbar');
        const history = [];
        let current = resolvePath(options.path || HOME);
        if (!entries[current] || entries[current].type !== 'dir') current = HOME;
        let hidden = false;
        const breadcrumbs = node('nav', 'breadcrumbs');
        breadcrumbs.setAttribute('aria-label', 'folder breadcrumbs');
        const grid = node('div', 'file-grid');
        const foot = node('p', 'small muted');
        const navigate = (path, record = true) => {
          if (!entries[path] || entries[path].type !== 'dir') return;
          if (record && path !== current) history.push(current);
          current = path;
          paint();
        };
        const back = button('← back', () => { if (history.length) navigate(history.pop(), false); });
        back.dataset.action = 'folder-back';
        const up = button('↑ up', () => navigate(resolvePath('..', current)));
        const showHidden = button('show hidden files', () => {
          hidden = !hidden;
          showHidden.textContent = hidden ? 'hide hidden files' : 'show hidden files';
          showHidden.setAttribute('aria-pressed', String(hidden));
          paint();
        });
        showHidden.setAttribute('aria-pressed', 'false');
        add(toolbar, back, up, showHidden);
        const paint = () => {
          while (!entries[current] || entries[current].type !== 'dir') current = resolvePath('..', current);
          grid.replaceChildren();
          breadcrumbs.replaceChildren();
          back.disabled = !history.length;
          up.disabled = current === '/';
          const root = button('/', () => navigate('/'), 'text-button');
          breadcrumbs.append(root);
          let path = '';
          for (const part of current.split('/').filter(Boolean)) {
            path += `/${part}`;
            const target = path;
            breadcrumbs.append(node('span', '', '/'));
            const crumb = button(part, () => navigate(target), 'text-button');
            crumb.dataset.path = target;
            if (target === current) crumb.setAttribute('aria-current', 'location');
            breadcrumbs.append(crumb);
          }
          const contents = listPath(current, { hidden });
          for (const file of contents) grid.append(fileButton(file, pathToOpen => {
            if (entries[pathToOpen]?.type === 'dir') navigate(pathToOpen);
            else api.openPath(pathToOpen);
          }));
          if (!contents.length) grid.append(node('p', 'empty-folder', 'nothing here. suspiciously spacious.'));
          foot.textContent = `${contents.length} item${contents.length === 1 ? '' : 's'} / ${current}`;
          container.dataset.cwd = current;
        };
        const create = node('form', 'file-create toolbar');
        const filename = node('input', 'filename-input');
        filename.type = 'text';
        filename.placeholder = 'new-note.txt';
        filename.maxLength = 120;
        filename.setAttribute('aria-label', 'new file or folder name');
        const kind = node('select', 'file-kind');
        kind.setAttribute('aria-label', 'create a file or a folder');
        for (const [value, label] of [['file', 'text file'], ['dir', 'folder']]) {
          const option = node('option', '', label);
          option.value = value;
          kind.append(option);
        }
        const submit = node('button', 'small-button', 'create');
        submit.type = 'submit';
        submit.dataset.action = 'create-file';
        const result = node('p', 'small muted');
        result.setAttribute('role', 'status');
        create.addEventListener('submit', event => {
          event.preventDefault();
          const name = filename.value.trim();
          if (!name || name === '.' || name === '..' || name.includes('/')) { result.textContent = 'give it one filename, without slashes.'; return; }
          try {
            const target = resolvePath(name, current);
            if (entries[target]) throw new Error('a file with that name is already here.');
            if (kind.value === 'dir') makeDirectory(target);
            else touchFile(target);
            filename.value = '';
            result.textContent = '';
            const created = [...grid.querySelectorAll('[data-path]')].find(item => item.dataset.path === target);
            created?.focus();
            if (kind.value !== 'dir') api.openPath(target);
          } catch (error) { result.textContent = error.message; }
        });
        add(create, filename, kind, submit);
        add(container, toolbar, breadcrumbs, grid, foot, create, result, node('p', 'small muted', 'your files stay in this browser when local storage is available. both shells use the same drawer.'));
        paint();
        return subscribeFiles(paint);
      }
    },
    bin: {
      title: 'recycle bin / mostly confidence',
      render(container) {
        start(container, 'things i definitely did not need', 'restoring a file puts it back on the desktop.');
        const list = node('div', 'recycle-list');
        const count = node('p', 'small muted');
        const paint = () => {
          list.replaceChildren();
          const contents = listPath('/bin', { hidden: true });
          count.textContent = `${contents.length} item${contents.length === 1 ? '' : 's'} / restored on reload`;
          if (!contents.length) list.append(node('div', 'empty-folder', 'empty. this feels temporary.'));
          for (const file of contents) {
            const row = node('article', 'recycle-row');
            row.dataset.path = file.path;
            const name = button(`${fileIcon(file)} ${file.name}`, () => api.openPath(file.path), 'text-button recycle-name');
            const controls = node('div', 'toolbar');
            const restore = button('restore', () => {
              try {
                const target = restoreFromBin(file.path);
                api.restoreFile(target);
                paint();
              } catch (error) {
                const note = row.querySelector('.restore-error') || node('p', 'restore-error small');
                note.textContent = error.message;
                row.append(note);
              }
            });
            restore.dataset.action = 'restore';
            let refusals = 0;
            const remove = button('delete forever-ish', () => {
              if (removeFromBin(file.path)) {
                api.removeDesktopFile(file.path);
                paint();
              } else {
                refusals += 1;
                row.classList.add('file-refusing');
                row.style.setProperty('--refusal-tilt', `${refusals % 2 ? -3 : 3}deg`);
                remove.textContent = ['no.', 'still no.', 'give it a tiny chair'][Math.min(refusals - 1, 2)];
                name.textContent = `${refusals >= 3 ? '♧' : '◇'} absolutely-not.tmp`;
                if (refusals >= 3) {
                  const chair = node('span', 'file-chair', '└─┘');
                  chair.setAttribute('aria-label', 'the file is sitting on a tiny chair');
                  if (!row.querySelector('.file-chair')) row.append(chair);
                  remove.textContent = 'the file lives here now';
                  remove.disabled = true;
                }
              }
            });
            remove.dataset.action = 'delete';
            add(controls, restore, remove);
            add(row, name, controls);
            list.append(row);
          }
        };
        add(container, list, count, button('browse the bin as a folder', () => api.open('files', { path: '/bin' }), 'text-button'));
        paint();
        return subscribeFiles(paint);
      }
    },
    wall: {
      title: 'THE WALL / an open door',
      render(container) {
        start(container, 'THE WALL', 'infinite space. questionable idea.');
        const portal = node('div', 'portal');
        const inner = node('div', 'portal-inner');
        inner.hidden = true;
        const entry = anchor('step through →', 'https://www.yourworldoftext.com/~fyuc/', 'button portal-enter');
        add(inner, node('p', '', 'an effectively infinite shared text canvas. write whatever you want.'), node('p', 'small', 'public wall. i do not control what the creatures write. opens in a new tab.'), entry);
        const door = button('', () => {
          const opened = portal.classList.toggle('portal-open');
          inner.hidden = !opened;
          door.textContent = opened ? 'close door' : 'open door';
          door.setAttribute('aria-expanded', String(opened));
          if (opened) entry.focus();
        }, 'portal-door');
        door.textContent = 'open door';
        door.setAttribute('aria-expanded', 'false');
        add(portal, node('span', 'portal-star', '✳'), door, inner);
        add(container, portal);
      }
    },
    viewer: {
      title: 'file / unsaved changes',
      render(container, options = {}) {
        const path = resolvePath(options.path || `${HOME}/downloads/untitled_final2.txt`);
        const file = entries[path];
        if (!file) { start(container, 'file has wandered off', path); container.append(button('open the drawer', () => api.open('files'))); return; }
        start(container, file.name, path);
        container.dataset.path = path;
        if (file.type === 'text') {
          const textarea = node('textarea', 'viewer-editor');
          textarea.value = readPath(path);
          textarea.maxLength = 16384;
          textarea.spellcheck = false;
          textarea.setAttribute('aria-label', `edit ${file.name}`);
          const status = node('p', 'small muted', path.startsWith('/bin/') ? 'editable. bin scribbles reset on reboot/reload.' : 'editable. saved in this browser, shared by both shells.');
          let dirty = false;
          const save = button('save file', () => {
            if (!entries[path]) { status.textContent = 'this file is no longer here. save the text before closing.'; return; }
            try {
              writeFile(path, textarea.value);
              dirty = false;
              save.disabled = true;
              status.textContent = path.startsWith('/bin/') ? 'saved until the bin resets ✓' : 'saved in this browser ✓';
            } catch (error) { status.textContent = error.message; }
          });
          save.dataset.action = 'save-file';
          save.disabled = true;
          textarea.addEventListener('input', () => { dirty = true; save.disabled = !entries[path]; status.textContent = entries[path] ? 'unsaved scribbles' : 'file moved or deleted. your scribbles are still here.'; });
          const reset = button('undo unsaved scribbles', () => {
            if (entries[path]) textarea.value = entries[path].content || '';
            dirty = false;
            save.disabled = true;
            status.textContent = 'back to the last saved version';
          });
          const toolbar = node('div', 'toolbar');
          add(toolbar, save, reset);
          add(container, textarea, toolbar, status);
          container.append(button('show in folder', () => api.open('files', { path: resolvePath('..', path) }), 'text-button'));
          return subscribeFiles(() => {
            if (!entries[path]) {
              save.disabled = true;
              status.textContent = 'file moved or deleted. the open text is kept here so you can copy it.';
            } else if (!dirty) {
              textarea.value = entries[path].content ?? '';
            }
          });
        } else if (file.type === 'image') {
          const stage = node('div', 'image-stage');
          const image = node('img', 'file-image');
          image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(file.src)}`;
          image.alt = file.content || file.name;
          image.draggable = false;
          let turns = 0;
          let scale = 1;
          const refresh = () => { image.style.transform = `rotate(${turns * 90}deg) scale(${scale})`; };
          stage.append(image);
          const toolbar = node('div', 'toolbar');
          add(toolbar, button('↻ rotate vegetable', () => { turns += 1; refresh(); }), button('magnify importance', () => { scale = scale === 1 ? 1.2 : 1; refresh(); }), button('put it back', () => { turns = 0; scale = 1; refresh(); }));
          add(container, stage, toolbar);
        } else if (file.type === 'weird') {
          const stage = node('div', 'weird-stage');
          const object = node('div', 'weird-object', file.kind === 'sandwich' ? '▱' : file.kind === 'stubborn' ? '◇' : '□');
          const caption = node('p', 'small', file.kind === 'motivation' ? 'archive size: emotionally compressed' : file.kind === 'sandwich' ? 'a file you can eat. theoretically.' : file.kind === 'stubborn' ? 'no.' : 'this is clearly a normal file');
          let count = 0;
          const poke = button(file.kind === 'motivation' ? 'extract' : file.kind === 'sandwich' ? 'assemble' : file.kind === 'stubborn' ? 'negotiate' : 'open anyway', () => {
            count += 1;
            if (file.kind === 'motivation') {
              object.textContent = count % 2 ? '·' : '□';
              object.style.transform = count % 2 ? 'scale(.35)' : 'scale(1)';
              caption.textContent = count % 2 ? 'one tiny excuse extracted. behold.' : 'packed the excuse away again.';
              poke.textContent = count % 2 ? 'compress again' : 'extract';
            } else if (file.kind === 'sandwich') {
              object.textContent = ['▱', '▱\n▰', '▱\n▰\n▱', '✧'][count % 4];
              caption.textContent = count % 4 === 3 ? 'compiled. no nutritional guarantees.' : 'assembling lunch…';
              poke.textContent = count % 4 === 3 ? 'start again' : 'add another layer';
            } else if (file.kind === 'stubborn') {
              object.style.transform = `rotate(${count % 2 ? -15 : 15}deg)`;
              object.textContent = count >= 3 ? '◇\n└─┘' : '◇';
              caption.textContent = ['no.', 'please stop holding the delete key.', 'it has brought its own chair.'][Math.min(count - 1, 2)];
              poke.textContent = count >= 3 ? 'turn the chair' : 'negotiate';
            } else {
              object.textContent = ['←', '→', '↓', '✳', '🥬'][Math.min(count - 1, 4)];
              object.style.transform = `rotate(${count * 17}deg)`;
              caption.textContent = count >= 5 ? 'you have been assigned one vegetable.' : ['the file is now pointing at something', 'wrong direction', 'still not helpful', 'oh'][Math.min(count - 1, 3)];
              poke.textContent = count >= 5 ? 'inspect the vegetable' : 'try again';
              if (count > 5) api.openPath(`${HOME}/downloads/scan_0003.svg`);
            }
          });
          add(stage, object, caption, poke);
          container.append(stage);
        } else if (file.type === 'app') {
          container.append(button(`launch ${file.name}`, () => api.open(file.app)));
        } else {
          container.append(button('open folder', () => api.open('files', { path })));
        }
        container.append(button('show in folder', () => api.open('files', { path: resolvePath('..', path) }), 'text-button'));
      }
    },
    processes: {
      title: 'task manager / please be kind',
      render(container) {
        start(container, 'several thoughts still running', 'cpu: yes / memory: questionable');
        const list = node('div', 'process-list');
        const paint = () => {
          list.replaceChildren();
          for (const win of api.getWindows().filter(win => win.id !== 'processes')) {
            const row = node('div', 'process-row');
            const name = node('span', '', `${win.title}${win.minimized ? ' (taking a nap)' : ''}`);
            add(row, name, button('bring back', () => { api.open(win.id); paint(); }, 'text-button'), button('end task', () => { api.close(win.id); paint(); }, 'text-button'));
            list.append(row);
          }
          const daydream = node('div', 'process-row');
          const label = node('span', '', 'thinking_about_nothing.exe');
          const end = button('end task', () => { label.textContent = 'thinking_about_thinking_about_nothing.exe'; end.textContent = 'leave it alone'; end.disabled = true; }, 'text-button');
          add(daydream, label, end);
          list.append(daydream);
        };
        add(container, list, button('refresh list', paint));
        paint();
      }
    }
  };
}
