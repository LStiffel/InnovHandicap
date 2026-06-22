// ---------- Mini-jeu TDAH — "L'attention capturée" ----------
// Architecture calquée sur dyslexie.js : même cycle de vie procédural,
// mêmes conventions de nommage, mêmes classes CSS réutilisées.

// ---------- Configuration ----------
const GAME_DURATION = 30;            // secondes
const ANIMAL_INTERVAL_MS = 1200;     // apparition d'un animal (ms)
const ANIMAL_MIN_INTERVAL_MS = 600;  // intervalle minimal en fin de partie
const DISTRACTION_START = 5;         // début des distractions (s)
const ZOOM_DURATION_MS = 1800;       // durée d'un zoom de distraction
const ZOOM_SCALE = 2.8;             // facteur de zoom caméra

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
let   tdahOverlay  = document.getElementById('tdahOverlay');
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
    if (!gameRunning || isZooming) {
      // Clic pendant le zoom = malus
      if (isZooming && gameRunning) {
        badClicks++;
        score = Math.max(0, score - 1);
        updateScoreDisplay();
        el.classList.add('tdah-animal--malus');
        setTimeout(() => el.classList.remove('tdah-animal--malus'), 300);
      }
      return;
    }

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
  const arenaRect = tdahGrid.getBoundingClientRect();
  const maxX = tdahGrid.clientWidth - 60;
  const maxY = tdahGrid.clientHeight - 60;
  el.style.left = randomInt(10, Math.max(10, maxX)) + 'px';
  el.style.top  = randomInt(10, Math.max(10, maxY)) + 'px';

  tdahGrid.appendChild(el);

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

function startAnimalSpawner() {
  spawnAnimal();
  const elapsed = startTimestamp ? (Date.now() - startTimestamp) / 1000 : 0;
  const progress = Math.min(elapsed / GAME_DURATION, 1);
  const interval = ANIMAL_INTERVAL_MS - progress * (ANIMAL_INTERVAL_MS - ANIMAL_MIN_INTERVAL_MS);

  animalSpawnInterval = setTimeout(() => {
    if (gameRunning) startAnimalSpawner();
  }, interval);
}

// ---------- Système de distractions (zoom caméra) ----------
function triggerDistraction() {
  if (!gameRunning) return;

  isZooming = true;
  distractionCount++;

  const distractor = DISTRACTORS[distractionCount % DISTRACTORS.length];

  // Affiche le label de distraction
  tdahZoomLabel.textContent = distractor.emoji + ' ' + distractor.label;
  tdahZoomLabel.classList.add('visible');

  // Calcul du point de zoom (aléatoire dans l'arène)
  const offsetX = randomInt(-20, 20);
  const offsetY = randomInt(-20, 20);

  // Applique le zoom brutal
  tdahGrid.style.transition = 'transform 200ms ease-in';
  tdahGrid.style.transform = `scale(${ZOOM_SCALE}) translate(${offsetX}px, ${offsetY}px)`;
  tdahGrid.classList.add('tdah-grid--zoomed');

  // Overlay semi-opaque pendant le zoom
  tdahOverlay.classList.add('visible');

  // Dézoom après la durée
  setTimeout(() => {
    if (!gameRunning) return;
    tdahGrid.style.transition = 'transform 350ms ease-out';
    tdahGrid.style.transform = 'scale(1) translate(0,0)';
    tdahGrid.classList.remove('tdah-grid--zoomed');
    tdahOverlay.classList.remove('visible');
    tdahZoomLabel.classList.remove('visible');

    setTimeout(() => {
      isZooming = false;
    }, 350);
  }, ZOOM_DURATION_MS);

  // Prochaine distraction (de plus en plus fréquent)
  scheduleNextDistraction();
}

function scheduleNextDistraction() {
  if (!gameRunning) return;
  const elapsed = startTimestamp ? (Date.now() - startTimestamp) / 1000 : 0;
  // Intervalle décroissant : 5s → 2s
  const baseInterval = Math.max(2000, 5000 - distractionCount * 600);
  const jitter = randomInt(-500, 500);

  distractionTimeout = setTimeout(() => {
    if (gameRunning) triggerDistraction();
  }, baseInterval + jitter);
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

  tdahGrid.innerHTML = '<div class="tdah-overlay" id="tdahOverlay"></div>';
  tdahOverlay = document.getElementById('tdahOverlay');
  tdahGrid.style.transform = 'scale(1) translate(0,0)';
  tdahGrid.classList.remove('tdah-grid--zoomed');
  tdahOverlay.classList.remove('visible');
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

  // Distractions après le délai initial
  distractionTimeout = setTimeout(() => {
    if (gameRunning) triggerDistraction();
  }, DISTRACTION_START * 1000);
}

function endGame() {
  gameRunning = false;
  clearInterval(gameTimerInterval);
  clearTimeout(animalSpawnInterval);
  clearTimeout(distractionTimeout);

  isZooming = false;
  tdahGrid.style.transition = 'transform 350ms ease-out';
  tdahGrid.style.transform = 'scale(1) translate(0,0)';
  tdahGrid.classList.remove('tdah-grid--zoomed');
  tdahOverlay.classList.remove('visible');
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
