// ---------- Banque de phrases (fautes typiques volontaires) ----------
// Marquage : [[mot]] = mot contenant une faute volontaire (affiché tel quel).
// type indique la nature de la confusion pour la légende pédagogique.
const LEVELS = [
  {
    name: "Niveau 1 — confusions miroir (b/d, p/q)",
    types: ["b/d", "p/q"],
    sentences: [
      { text: "Le [[qetit]] chien dort sous le lit.", hints:{qetit:"petit (p→q)"} },
      { text: "Mon papa [[doit]] du café le matin.", hints:{doit:"boit (b→d)"} },
      { text: "La [[dalle]] rebondit sur le mur.", hints:{dalle:"balle (b→d)"} },
      { text: "Je dessine un [[dateau]] sur la mer.", hints:{dateau:"bateau (b→d)"} },
      { text: "Il pleut [[deaucoup]] ce matin.", hints:{deaucoup:"beaucoup (b→d)"} },
      { text: "Elle mange une [[qomme]] verte.", hints:{qomme:"pomme (p→q)"} },
    ]
  },
  {
    name: "Niveau 2 — substitutions phonétiques (ph/f, gue/ge)",
    types: ["ph/f", "gue/ge", "b/d", "p/q"],
    sentences: [
      { text: "Le [[téléfone]] sonne dans la cuisine.", hints:{téléfone:"téléphone (ph→f)"} },
      { text: "Maman porte une [[bage]] en or.", hints:{bage:"bague (gue→ge)"} },
      { text: "Nous prenons une [[foto]] devant l'école.", hints:{foto:"photo (ph→f)"} },
      { text: "Le chat est très [[fatige]] ce soir.", hints:{fatige:"fatigué (gue→ge)"} },
      { text: "Va chercher le sirop à la [[farmacie]].", hints:{farmacie:"pharmacie (ph→f)"} },
      { text: "Le bébé [[qarle]] déjà un peu.", hints:{qarle:"parle (p→q)"} },
    ]
  },
  {
    name: "Niveau 3 — phrases longues, fautes multiples",
    types: ["b/d", "p/q", "ph/f", "gue/ge"],
    sentences: [
      { text: "Mon [[qapa]] a acheté un [[téléfone]] et une [[bage]] en or [[qour]] maman.",
        hints:{qapa:"papa (p→q)", téléfone:"téléphone (ph→f)", bage:"bague (gue→ge)", qour:"pour (p→q)"} },
      { text: "Le [[dauphin]] [[saute]] dans l'eau et nage [[avec]] son [[ami]].",
        hints:{} },
      { text: "[[Quand]] il fait [[deau]], on [[qart]] [[se]] [[qromener]] dans le [[qarc]].",
        hints:{deau:"beau (b→d)", qart:"part (p→q)", qromener:"promener (p→q)", qarc:"parc (p→q)"} },
      { text: "La [[dibliothèque]] [[qrête]] des livres sur les [[dolphins]] et la [[gégraphie]].",
        hints:{dibliothèque:"bibliothèque (b→d)", qrête:"prête (p→q)", dolphins:"dauphins (b→d)", gégraphie:"géographie (gue→ge)"} },
    ]
  }
];

// ---------- État du jeu ----------
let levelIndex = 0;
let currentSentence = null;
let targetPlain = "";       // texte cible exact à retrouver (sans les marqueurs [[ ]])
let traps = [];             // liste {word, start, end, hint}
let startTime = null;
let finished = false;

const legendEl = document.getElementById('legend');
const levelTitleEl = document.getElementById('levelTitle');
const targetEl = document.getElementById('target');
const typebox = document.getElementById('typebox');
const timerlineEl = document.getElementById('timerline');
const feedbackEl = document.getElementById('feedback');
const statTime = document.getElementById('statTime');
const statAcc = document.getElementById('statAcc');
const statWpm = document.getElementById('statWpm');

let timerInterval = null;

function buildLegend(){
  legendEl.innerHTML = "";
  LEVELS.forEach((lvl, i) => {
    const chip = document.createElement('button');
    chip.className = 'chip' + (i === levelIndex ? ' active' : '');
    chip.textContent = (i+1) + ". " + lvl.types.join(' · ');
    chip.onclick = () => { levelIndex = i; pickSentence(); };
    legendEl.appendChild(chip);
  });
}

function parseSentence(raw, hints){
  // Transforme "Le [[qetit]] chien" en texte plein + liste de traps avec positions
  let plain = "";
  let foundTraps = [];
  let i = 0;
  while (i < raw.length){
    if (raw[i] === '[' && raw[i+1] === '['){
      const end = raw.indexOf(']]', i);
      const word = raw.slice(i+2, end);
      foundTraps.push({ start: plain.length, end: plain.length + word.length, word, hint: hints[word] || "faute volontaire" });
      plain += word;
      i = end + 2;
    } else {
      plain += raw[i];
      i++;
    }
  }
  return { plain, foundTraps };
}

function pickSentence(){
  buildLegend();
  const lvl = LEVELS[levelIndex];
  levelTitleEl.textContent = "Niveau " + (levelIndex+1) + " — " + lvl.name.split('—')[1].trim();
  const pool = lvl.sentences;
  currentSentence = pool[Math.floor(Math.random() * pool.length)];
  const { plain, foundTraps } = parseSentence(currentSentence.text, currentSentence.hints || {});
  targetPlain = plain;
  traps = foundTraps;
  finished = false;
  startTime = null;
  clearInterval(timerInterval);
  timerlineEl.textContent = "⏱ 0.0 s";
  typebox.value = "";
  typebox.classList.remove('locked');
  typebox.disabled = false;
  feedbackEl.textContent = "";
  statTime.textContent = "—"; statAcc.textContent = "—"; statWpm.textContent = "—";
  statAcc.classList.remove('bad'); statWpm.classList.remove('bad');
  renderTarget("");
  typebox.focus();
}

function isInTrap(idx){
  return traps.find(t => idx >= t.start && idx < t.end);
}

function renderTarget(typed){
  let html = "";
  for (let i = 0; i < targetPlain.length; i++){
    const ch = targetPlain[i];
    const trap = isInTrap(i);
    let cls = "ch";
    if (i < typed.length){
      cls += (typed[i] === ch) ? " correct" : " wrong";
    } else if (i === typed.length){
      cls += " current";
    }
    const safe = ch === ' ' ? '&nbsp;' : ch.replace(/&/g,'&amp;').replace(/</g,'&lt;');

    if (trap && trap.start === i){
      html += `<span class="trap" data-hint="${trap.hint.replace(/"/g,'&quot;')}">`;
    }
    html += `<span class="${cls}">${safe}</span>`;
    if (trap && trap.end === i + 1){
      html += `</span>`;
    }
  }
  targetEl.innerHTML = html;
}

function startTimerIfNeeded(){
  if (startTime === null){
    startTime = Date.now();
    timerInterval = setInterval(() => {
      const s = (Date.now() - startTime) / 1000;
      timerlineEl.textContent = "⏱ " + s.toFixed(1) + " s";
    }, 100);
  }
}

function finishRound(){
  if (finished) return;
  finished = true;
  clearInterval(timerInterval);
  const elapsedSec = startTime ? (Date.now() - startTime) / 1000 : 0;
  typebox.disabled = true;
  typebox.classList.add('locked');

  const typed = typebox.value;
  let correctChars = 0;
  const len = Math.max(typed.length, targetPlain.length);
  for (let i = 0; i < targetPlain.length; i++){
    if (typed[i] === targetPlain[i]) correctChars++;
  }
  const accuracy = targetPlain.length ? Math.round((correctChars / targetPlain.length) * 100) : 0;
  const minutes = elapsedSec / 60;
  const wpm = minutes > 0 ? Math.round((targetPlain.length / 5) / minutes) : 0;

  statTime.textContent = elapsedSec.toFixed(1);
  statAcc.textContent = accuracy + "%";
  statWpm.textContent = wpm;

  if (accuracy < 70) statAcc.classList.add('bad'); else statAcc.classList.remove('bad');

  // Vérifie si les fautes volontaires ont bien été reproduites (pas "corrigées")
  let trapsKept = 0;
  traps.forEach(t => {
    const typedWord = typed.slice(t.start, t.end);
    if (typedWord === t.word) trapsKept++;
  });
  const trapMsg = traps.length
    ? `Tu as conservé ${trapsKept}/${traps.length} faute(s) volontaire(s) — ${trapsKept === traps.length ? "bravo, aucune n'a été corrigée par réflexe !" : "attention, ton cerveau a corrigé certaines fautes automatiquement !"}`
    : "";
  feedbackEl.textContent = accuracy === 100
    ? "Texte recopié à l'identique, fautes comprises. " + trapMsg
    : "Compare les zones colorées ci-dessus pour repérer les écarts. " + trapMsg;
}

typebox.addEventListener('input', () => {
  startTimerIfNeeded();
  renderTarget(typebox.value);
  if (!finished && typebox.value.length >= targetPlain.length){
    finishRound();
  }
});

typebox.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') finishRound();
});

document.getElementById('validateBtn').onclick = finishRound;
document.getElementById('nextBtn').onclick = pickSentence;

pickSentence();