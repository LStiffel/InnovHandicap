// ---------- Mini-jeu TDAH — "L'attention capturée" ----------
// Architecture calquée sur le jeu dyslexie (dyslexie.html) : même cycle de vie
// procédural, mêmes conventions de nommage, mêmes classes CSS réutilisées.

// ---------- Configuration ----------
const GAME_DURATION = 30;            // secondes
const ANIMAL_INTERVAL_MS = 1200;     // apparition d'un animal (ms)
const ANIMAL_MIN_INTERVAL_MS = 600;  // intervalle minimal en fin de partie
const DISTRACTION_START = 2;         // début des zooms (s)
const ZOOM_MIN_SCALE = 1.4;          // facteur de zoom caméra (aléatoire entre min et max)
const ZOOM_MAX_SCALE = 2.3;
const ZOOM_MIN_MS = 900;             // durée d'un zoom (aléatoire entre min et max)
const ZOOM_MAX_MS = 1800;
const COLOR_START = 2;               // début des changements de couleur (s)
const COLOR_MAX_TARGETS = 3;         // nb max d'émojis recolorés en même temps
const WANDER_CHANCE = 0.4;           // proportion d'animaux qui se baladent
const WANDER_MAX_STEP = 110;         // distance max d'un déplacement (px)
const WANDER_MIN_MS = 900;           // durée d'un déplacement (aléatoire entre min et max)
const WANDER_MAX_MS = 1500;

const ANIMALS = [
  { emoji: '🦀', name: 'crabe',     isTarget: true  },
  { emoji: '🐠', name: 'poisson',   isTarget: false },
  { emoji: '🐸', name: 'grenouille',isTarget: false },
  { emoji: '🐙', name: 'pieuvre',   isTarget: false },
];

const DISTRACTORS = [
  { emoji: '🦋', name: 'papillon', label: 'Oh, un papillon !' },
  { emoji: '🌸', name: 'fleur',    label: 'Regarde cette fleur…' },
  { emoji: '☁️', name: 'nuage',    label: 'Un nuage passe…' },
  { emoji: '⭐', name: 'étoile',   label: 'Une étoile brille !' },
  { emoji: '🐝', name: 'abeille',  label: 'Bzzzz… une abeille !' },
];

// ---------- État du jeu ----------
let score = 0;
let goodClicks = 0;
let badClicks = 0;
let missedCrabs = 0;
let totalCrabs = 0;
let gameRunning = false;
let gameTimerInterval = null;
let animalSpawnInterval = null;
let distractionTimeout = null;
let colorTimeout = null;
let remainingTime = GAME_DURATION;
let isZooming = false;
let distractionCount = 0;
let startTimestamp = null;

// ---------- Éléments DOM ----------
const tdahArena    = document.getElementById('tdahArena');
const tdahGrid     = document.getElementById('tdahGrid');
const tdahTimer    = document.getElementById('tdahTimer');
const tdahScore    = document.getElementById('tdahScore');
const tdahStartBtn = document.getElementById('tdahStartBtn');
const tdahStopBtn  = document.getElementById('tdahStopBtn');
const tdahResults  = document.getElementById('tdahResults');
const tdahExplan   = document.getElementById('tdahExplanation');
const tdahZoomLabel= document.getElementById('tdahZoomLabel');
const tdahInstructions = document.getElementById('tdahInstructions');

const statCrabs    = document.getElementById('statCrabs');
const statBad      = document.getElementById('statBad');
const statScore    = document.getElementById('statScore');

// ---------- Fonctions utilitaires ----------
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ---------- Rendu ----------
function updateTimerDisplay() {
  tdahTimer.textContent = '⏱ ' + remainingTime.toFixed(1) + ' s';
}

function updateScoreDisplay() {
  tdahScore.textContent = '🦀 ' + score + ' pts';
}

function createAnimalElement(animal) {
  const el = document.createElement('button');
  el.className = 'tdah-animal';
  el.textContent = animal.emoji;
  el.dataset.target = animal.isTarget ? 'true' : 'false';
  el.dataset.name = animal.name;
  el.setAttribute('aria-label', animal.name);

  el.addEventListener('click', () => {
    if (!gameRunning) return;

    if (animal.isTarget) {
      // Bon clic sur un crabe
      goodClicks++;
      score += 2;
      updateScoreDisplay();
      el.classList.add('tdah-animal--hit');
      el.disabled = true;
      setTimeout(() => {
        if (el.parentNode) el.parentNode.removeChild(el);
      }, 250);
    } else {
      // Mauvais clic (pas un crabe)
      badClicks++;
      score = Math.max(0, score - 1);
      updateScoreDisplay();
      el.classList.add('tdah-animal--malus');
      setTimeout(() => el.classList.remove('tdah-animal--malus'), 300);
    }
  });

  return el;
}

// ---------- Spawning d'animaux ----------
function spawnAnimal() {
  if (!gameRunning) return;

  // Probabilité de crabe : ~30%
  const isCrab = Math.random() < 0.3;
  const pool = isCrab
    ? ANIMALS.filter(a => a.isTarget)
    : ANIMALS.filter(a => !a.isTarget);
  const animal = pool[Math.floor(Math.random() * pool.length)];

  if (animal.isTarget) totalCrabs++;

  const el = createAnimalElement(animal);

  // Position aléatoire dans la grille
  const bounds = arenaBounds();
  el.style.left = randomInt(bounds.minX, bounds.maxX) + 'px';
  el.style.top  = randomInt(bounds.minY, bounds.maxY) + 'px';

  tdahGrid.appendChild(el);

  if (Math.random() < WANDER_CHANCE) wander(el);

  // Disparition automatique après un délai
  const elapsed = startTimestamp ? (Date.now() - startTimestamp) / 1000 : 0;
  const lifetime = Math.max(1500, 3000 - elapsed * 40); // accélère avec le temps
  setTimeout(() => {
    if (el.parentNode) {
      // Si c'était un crabe non cliqué → raté
      if (animal.isTarget && !el.disabled) {
        missedCrabs++;
        el.classList.add('tdah-animal--missed');
        setTimeout(() => {
          if (el.parentNode) el.parentNode.removeChild(el);
        }, 300);
      } else {
        el.parentNode.removeChild(el);
      }
    }
  }, lifetime);
}

// Zone où un animal reste entièrement visible dans l'arène
function arenaBounds() {
  return {
    minX: 10,
    minY: 10,
    maxX: Math.max(10, tdahGrid.clientWidth - 60),
    maxY: Math.max(10, tdahGrid.clientHeight - 60),
  };
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

// Déplacement lent et aléatoire, en restant dans l'arène, jusqu'à disparition
function wander(el) {
  if (!gameRunning || !el.isConnected || el.disabled) return;

  const bounds = arenaBounds();
  const x = clamp(parseFloat(el.style.left) + randomInt(-WANDER_MAX_STEP, WANDER_MAX_STEP), bounds.minX, bounds.maxX);
  const y = clamp(parseFloat(el.style.top)  + randomInt(-WANDER_MAX_STEP, WANDER_MAX_STEP), bounds.minY, bounds.maxY);
  const duration = randomInt(WANDER_MIN_MS, WANDER_MAX_MS);

  el.style.transition = 'transform .12s ease, opacity .25s ease, filter .15s ease, '
    + 'left ' + duration + 'ms ease-in-out, top ' + duration + 'ms ease-in-out';
  el.style.left = x + 'px';
  el.style.top  = y + 'px';

  setTimeout(() => wander(el), duration);
}

function startAnimalSpawner() {
  spawnAnimal();
  const elapsed = startTimestamp ? (Date.now() - startTimestamp) / 1000 : 0;
  const progress = Math.min(elapsed / GAME_DURATION, 1);
  const interval = ANIMAL_INTERVAL_MS - progress * (ANIMAL_INTERVAL_MS - ANIMAL_MIN_INTERVAL_MS);

  animalSpawnInterval = setTimeout(() => {
    if (gameRunning) startAnimalSpawner();
  }, interval);
}

// ---------- Système de distractions ----------
// Rien n'est bloqué : le joueur peut toujours cliquer. Ce sont des stimuli
// anodins (un zoom, une couleur qui change) qui captent le regard malgré lui.

// Progression 0 → 1 sur la durée de la partie
function gameProgress() {
  const elapsed = startTimestamp ? (Date.now() - startTimestamp) / 1000 : 0;
  return Math.min(elapsed / GAME_DURATION, 1);
}

function randomFloat(min, max) {
  return Math.random() * (max - min) + min;
}

// Zoom caméra sur un point aléatoire de l'arène
function triggerDistraction() {
  if (!gameRunning) return;

  isZooming = true;
  distractionCount++;

  const distractor = DISTRACTORS[randomInt(0, DISTRACTORS.length - 1)];
  tdahZoomLabel.textContent = distractor.emoji + ' ' + distractor.label;
  tdahZoomLabel.classList.add('visible');

  const scale = randomFloat(ZOOM_MIN_SCALE, ZOOM_MAX_SCALE);
  const duration = randomInt(ZOOM_MIN_MS, ZOOM_MAX_MS);

  tdahGrid.style.transformOrigin = randomInt(10, 90) + '% ' + randomInt(10, 90) + '%';
  tdahGrid.style.transition = 'transform ' + randomInt(150, 400) + 'ms ease-in-out';
  tdahGrid.style.transform = 'scale(' + scale.toFixed(2) + ')';

  setTimeout(() => {
    if (!gameRunning) return;
    tdahGrid.style.transition = 'transform 350ms ease-out';
    tdahGrid.style.transform = 'scale(1)';
    tdahZoomLabel.classList.remove('visible');
    isZooming = false;
  }, duration);

  scheduleNextDistraction(duration);
}

function scheduleNextDistraction(lastDuration) {
  if (!gameRunning) return;
  // Intervalle décroissant : ~2 s → ~0,5 s entre deux zooms
  const pause = 2000 - gameProgress() * 1500 + randomInt(-300, 300);

  distractionTimeout = setTimeout(() => {
    if (gameRunning) triggerDistraction();
  }, lastDuration + Math.max(300, pause));
}

// Changement de couleur aléatoire de quelques émojis
function triggerColorFlicker() {
  if (!gameRunning) return;

  const animals = Array.from(tdahGrid.querySelectorAll('.tdah-animal:not(:disabled)'));
  const count = Math.min(animals.length, randomInt(1, 1 + Math.round(gameProgress() * (COLOR_MAX_TARGETS - 1))));

  shuffleArray(animals).slice(0, count).forEach(el => {
    el.style.filter = 'hue-rotate(' + randomInt(60, 300) + 'deg) saturate(' + randomFloat(1.5, 3).toFixed(1) + ')';
    el.classList.add('tdah-animal--flicker');
    setTimeout(() => {
      el.style.filter = '';
      el.classList.remove('tdah-animal--flicker');
    }, randomInt(400, 1200));
  });

  scheduleNextColorFlicker();
}

function scheduleNextColorFlicker() {
  if (!gameRunning) return;
  // Intervalle décroissant : ~1,8 s → ~0,6 s
  const interval = 1800 - gameProgress() * 1200 + randomInt(-300, 300);

  colorTimeout = setTimeout(() => {
    if (gameRunning) triggerColorFlicker();
  }, Math.max(300, interval));
}

// ---------- Cycle de vie du jeu ----------
function initGame() {
  score = 0;
  goodClicks = 0;
  badClicks = 0;
  missedCrabs = 0;
  totalCrabs = 0;
  remainingTime = GAME_DURATION;
  isZooming = false;
  distractionCount = 0;
  startTimestamp = null;

  tdahGrid.innerHTML = '';
  tdahGrid.style.transform = 'scale(1)';
  tdahZoomLabel.classList.remove('visible');

  updateTimerDisplay();
  updateScoreDisplay();

  // Cacher résultats et explication
  tdahResults.style.display = 'none';
  tdahExplan.style.display = 'none';
  tdahArena.style.display = 'block';
  tdahInstructions.style.display = 'block';

  tdahStartBtn.style.display = 'inline-block';
  tdahStopBtn.style.display = 'none';
}

function startGame() {
  gameRunning = true;
  startTimestamp = Date.now();
  tdahInstructions.style.display = 'none';
  tdahStartBtn.style.display = 'none';
  tdahStopBtn.style.display = 'inline-block';

  updateScoreDisplay();
  updateTimerDisplay();

  // Timer principal (mise à jour chaque 100ms)
  gameTimerInterval = setInterval(() => {
    remainingTime = Math.max(0, GAME_DURATION - (Date.now() - startTimestamp) / 1000);
    updateTimerDisplay();
    if (remainingTime <= 0) {
      endGame();
    }
  }, 100);

  // Spawning d'animaux
  startAnimalSpawner();

  // Distractions après les délais initiaux
  distractionTimeout = setTimeout(() => {
    if (gameRunning) triggerDistraction();
  }, DISTRACTION_START * 1000);
  colorTimeout = setTimeout(() => {
    if (gameRunning) triggerColorFlicker();
  }, COLOR_START * 1000);
}

function endGame() {
  gameRunning = false;
  clearInterval(gameTimerInterval);
  clearTimeout(animalSpawnInterval);
  clearTimeout(distractionTimeout);
  clearTimeout(colorTimeout);

  isZooming = false;
  tdahGrid.style.transition = 'transform 350ms ease-out';
  tdahGrid.style.transform = 'scale(1)';
  tdahZoomLabel.classList.remove('visible');

  // Afficher résultats
  tdahStopBtn.style.display = 'none';
  showResults();
}

function showResults() {
  tdahArena.style.display = 'none';
  tdahResults.style.display = 'block';

  statCrabs.textContent = goodClicks + '/' + totalCrabs;
  statBad.textContent = badClicks;
  statScore.textContent = score;

  if (goodClicks < totalCrabs * 0.5) {
    statCrabs.classList.add('bad');
  } else {
    statCrabs.classList.remove('bad');
  }
  if (badClicks > 3) {
    statBad.classList.add('bad');
  } else {
    statBad.classList.remove('bad');
  }
}

function showExplanation() {
  tdahResults.style.display = 'none';
  tdahExplan.style.display = 'block';
}

// ---------- Événements ----------
tdahStartBtn.addEventListener('click', startGame);
tdahStopBtn.addEventListener('click', endGame);

document.getElementById('tdahShowExplBtn').addEventListener('click', showExplanation);
document.getElementById('tdahReplayBtn').addEventListener('click', () => {
  initGame();
});
document.getElementById('tdahReplayBtn2').addEventListener('click', () => {
  initGame();
});

// Bouton Échap clavier
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && gameRunning) {
    endGame();
  }
});

// ---------- Initialisation ----------
initGame();
