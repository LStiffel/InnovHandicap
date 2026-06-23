/* ================================================================
   ÉTAT DU JEU
================================================================ */
const etatJeu = {
  scoreN1:  false,
  scoreN1b: false,
  scoreN3:  false,
  quizReussi: false,
  /* Minuteries */
  intervalN1:  null,
  intervalN1b: null,
  intervalN3:  null,
  /* Niveau 1 */
  filsCoupes:   [],
  filsCorrects: ['rouge', 'bleu'],
  tempsN1: 15,
  /* Niveau 1b */
  filsCoupes1b:   [],
  filsCorrects1b: ['vert', 'bleu'],
  tempsN1b: 15,
  /* Niveau 3 */
  filsCoupesN3:   [],
  filsCorrectsN3: ['rouge', 'orange'],
  tempsN3: 10,
};

/* ----------------------------------------------------------------
   Utilitaires
---------------------------------------------------------------- */
function afficherEcran(idEcran) {
  document.querySelectorAll('.ecran').forEach(el => {
    el.classList.toggle('actif', el.id === idEcran);
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function melangerTableau(tableau) {
  for (let i = tableau.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [tableau[i], tableau[j]] = [tableau[j], tableau[i]];
  }
  return tableau;
}

/* ----------------------------------------------------------------
   Démarrage
---------------------------------------------------------------- */
function demarrerJeu() {
  document.body.classList.remove('mode-protanopie', 'mode-combine');
  afficherEcran('ecran-niveau1');
  initialiserNiveau1();
}

/* ================================================================
   NIVEAU 1 — BOMBE DEUTÉRANOPIE
================================================================ */
function initialiserNiveau1() {
  etatJeu.filsCoupes = [];
  etatJeu.tempsN1 = 15;
  clearInterval(etatJeu.intervalN1);

  const couleursFils = melangerTableau(['rouge', 'vert', 'bleu', 'jaune']);
  const zoneF = document.getElementById('zone-fils');
  zoneF.innerHTML = '';

  couleursFils.forEach(couleur => {
    zoneF.appendChild(creerFil(couleur, () => couperFil(couleur)));
  });

  mettreAJourAffichage('affichage-bombe', 15);
  document.getElementById('minuterie-n1').textContent = '15';
  document.getElementById('minuterie-n1').classList.remove('urgent');
  etatJeu.intervalN1 = setInterval(tickN1, 1000);
}

function tickN1() {
  etatJeu.tempsN1--;
  const m = document.getElementById('minuterie-n1');
  m.textContent = String(etatJeu.tempsN1);
  mettreAJourAffichage('affichage-bombe', etatJeu.tempsN1);
  if (etatJeu.tempsN1 <= 5) m.classList.add('urgent');
  if (etatJeu.tempsN1 <= 0) { clearInterval(etatJeu.intervalN1); finNiveau1(false, 'timeout'); }
}

function couperFil(couleur) {
  if (etatJeu.filsCoupes.includes(couleur)) return;
  const cable = document.querySelector(`#zone-fils .fil-cable[data-couleur="${couleur}"]`);
  if (!etatJeu.filsCorrects.includes(couleur)) {
    clearInterval(etatJeu.intervalN1);
    if (cable) cable.classList.add('coupe');
    setTimeout(() => finNiveau1(false, 'mauvais-fil', couleur), 400);
    return;
  }
  etatJeu.filsCoupes.push(couleur);
  if (cable) cable.classList.add('coupe');
  if (etatJeu.filsCoupes.includes('rouge') && etatJeu.filsCoupes.includes('bleu')) {
    clearInterval(etatJeu.intervalN1);
    setTimeout(() => finNiveau1(true), 300);
  }
}

function finNiveau1(victoire, raison = '', filCouleur = '') {
  etatJeu.scoreN1 = victoire;
  const icone     = document.getElementById('icone-resultat-n1');
  const titre     = document.getElementById('titre-resultat-n1');
  const sousTitre = document.getElementById('sous-titre-n1');

  if (victoire) {
    icone.textContent     = '✅';
    titre.textContent     = 'Bombe désamorcée !';
    sousTitre.textContent = 'Vous avez trouvé les bons fils. Mais était-ce si évident ?';
  } else {
    icone.textContent  = '💥';
    titre.textContent  = raison === 'timeout' ? 'Temps écoulé !' : 'Mauvais fil !';
    sousTitre.textContent = raison === 'timeout'
      ? 'La bombe a explosé faute de temps.'
      : `Vous avez coupé le fil « ${filCouleur} » — certaines teintes se ressemblaient beaucoup…`;
  }
  afficherEcran('ecran-fin-n1');
}

/* ================================================================
   NIVEAU 1b — BOMBE PROTANOPIE
================================================================ */
function lancerNiveau1b() {
  document.body.classList.remove('mode-combine');
  document.body.classList.add('mode-protanopie');
  etatJeu.filsCoupes1b = [];
  etatJeu.tempsN1b = 15;
  clearInterval(etatJeu.intervalN1b);

  const couleursFils = melangerTableau(['rouge', 'vert', 'bleu', 'orange']);
  const zoneF = document.getElementById('zone-fils-1b');
  zoneF.innerHTML = '';
  couleursFils.forEach(couleur => {
    zoneF.appendChild(creerFil(couleur, () => couperFil1b(couleur)));
  });

  mettreAJourAffichage('affichage-bombe-1b', 15);
  document.getElementById('minuterie-n1b').textContent = '15';
  document.getElementById('minuterie-n1b').classList.remove('urgent');
  afficherEcran('ecran-niveau1b');
  etatJeu.intervalN1b = setInterval(tickN1b, 1000);
}

function tickN1b() {
  etatJeu.tempsN1b--;
  const m = document.getElementById('minuterie-n1b');
  m.textContent = String(etatJeu.tempsN1b);
  mettreAJourAffichage('affichage-bombe-1b', etatJeu.tempsN1b);
  if (etatJeu.tempsN1b <= 5) m.classList.add('urgent');
  if (etatJeu.tempsN1b <= 0) { clearInterval(etatJeu.intervalN1b); finNiveau1b(false, 'timeout'); }
}

function couperFil1b(couleur) {
  if (etatJeu.filsCoupes1b.includes(couleur)) return;
  const cable = document.querySelector(`#zone-fils-1b .fil-cable[data-couleur="${couleur}"]`);
  if (!etatJeu.filsCorrects1b.includes(couleur)) {
    clearInterval(etatJeu.intervalN1b);
    if (cable) cable.classList.add('coupe');
    setTimeout(() => finNiveau1b(false, 'mauvais-fil', couleur), 400);
    return;
  }
  etatJeu.filsCoupes1b.push(couleur);
  if (cable) cable.classList.add('coupe');
  if (etatJeu.filsCoupes1b.includes('vert') && etatJeu.filsCoupes1b.includes('bleu')) {
    clearInterval(etatJeu.intervalN1b);
    setTimeout(() => finNiveau1b(true), 300);
  }
}

function finNiveau1b(victoire, raison = '', filCouleur = '') {
  document.body.classList.remove('mode-protanopie');
  etatJeu.scoreN1b = victoire;
  const icone     = document.getElementById('icone-resultat-n1b');
  const titre     = document.getElementById('titre-resultat-n1b');
  const sousTitre = document.getElementById('sous-titre-n1b');

  if (victoire) {
    icone.textContent     = '✅';
    titre.textContent     = 'Bombe désamorcée !';
    sousTitre.textContent = 'Vous avez tenu bon — la perception était différente cette fois, non ?';
  } else {
    icone.textContent  = '💥';
    titre.textContent  = raison === 'timeout' ? 'Temps écoulé !' : 'Mauvais fil !';
    sousTitre.textContent = raison === 'timeout'
      ? 'La bombe a explosé faute de temps.'
      : `Vous avez coupé le fil « ${filCouleur} » — la perturbation visuelle était encore plus trompeuse.`;
  }
  afficherEcran('ecran-fin-n1b');
}

/* ================================================================
   NIVEAU 3 — BOMBE COMBINÉE (deutéranopie + protanopie)
================================================================ */
function lancerNiveau3() {
  document.body.classList.remove('mode-protanopie');
  document.body.classList.add('mode-combine');

  etatJeu.filsCoupesN3 = [];
  etatJeu.tempsN3 = 10;
  clearInterval(etatJeu.intervalN3);

  /* 6 fils : rouge + orange (à couper) + vert, jaune, bleu, gris (pièges) */
  const couleursFils = melangerTableau(['rouge', 'orange', 'vert', 'jaune', 'bleu', 'gris']);
  const zoneF = document.getElementById('zone-fils-n3');
  zoneF.innerHTML = '';
  couleursFils.forEach(couleur => {
    zoneF.appendChild(creerFil(couleur, () => couperFilN3(couleur)));
  });

  mettreAJourAffichage('affichage-bombe-n3', 10);
  document.getElementById('minuterie-n3').textContent = '10';
  document.getElementById('minuterie-n3').classList.remove('urgent');
  afficherEcran('ecran-niveau3');
  etatJeu.intervalN3 = setInterval(tickN3, 1000);
}

function tickN3() {
  etatJeu.tempsN3--;
  const m = document.getElementById('minuterie-n3');
  m.textContent = String(etatJeu.tempsN3);
  mettreAJourAffichage('affichage-bombe-n3', etatJeu.tempsN3);
  if (etatJeu.tempsN3 <= 4) m.classList.add('urgent');
  if (etatJeu.tempsN3 <= 0) { clearInterval(etatJeu.intervalN3); finNiveau3(false, 'timeout'); }
}

function couperFilN3(couleur) {
  if (etatJeu.filsCoupesN3.includes(couleur)) return;
  const cable = document.querySelector(`#zone-fils-n3 .fil-cable[data-couleur="${couleur}"]`);
  if (!etatJeu.filsCorrectsN3.includes(couleur)) {
    clearInterval(etatJeu.intervalN3);
    if (cable) cable.classList.add('coupe');
    setTimeout(() => finNiveau3(false, 'mauvais-fil', couleur), 400);
    return;
  }
  etatJeu.filsCoupesN3.push(couleur);
  if (cable) cable.classList.add('coupe');
  if (etatJeu.filsCoupesN3.includes('rouge') && etatJeu.filsCoupesN3.includes('orange')) {
    clearInterval(etatJeu.intervalN3);
    setTimeout(() => finNiveau3(true), 300);
  }
}

function finNiveau3(victoire, raison = '', filCouleur = '') {
  document.body.classList.remove('mode-combine');
  etatJeu.scoreN3 = victoire;
  const icone     = document.getElementById('icone-resultat-n3');
  const titre     = document.getElementById('titre-resultat-n3');
  const sousTitre = document.getElementById('sous-titre-n3');

  if (victoire) {
    icone.textContent     = '🏆';
    titre.textContent     = 'Bombe désamorcée !';
    sousTitre.textContent = 'Incroyable — vous avez trouvé les 2 bons fils parmi 6 en 10 secondes !';
  } else {
    icone.textContent  = '💥';
    titre.textContent  = raison === 'timeout' ? 'Temps écoulé !' : 'Mauvais fil !';
    sousTitre.textContent = raison === 'timeout'
      ? 'La bombe a explosé — 10 secondes, c\'était court.'
      : `Vous avez coupé le fil « ${filCouleur} » — les deux perturbations combinées ont eu raison de vous.`;
  }
  afficherEcran('ecran-fin-n3');
}

/* ================================================================
   QUIZ QCM
================================================================ */
function afficherQuiz() {
  afficherEcran('ecran-quiz');
}

function repondreQuiz(bouton, estCorrect) {
  /* Désactiver tous les boutons */
  document.querySelectorAll('.quiz-option').forEach(btn => {
    btn.disabled = true;
  });

  /* Surligner la réponse choisie */
  bouton.classList.add(estCorrect ? 'bonne-reponse' : 'mauvaise-reponse');

  /* Surligner la bonne réponse si l'utilisateur s'est trompé */
  if (!estCorrect) {
    document.querySelectorAll('.quiz-option').forEach(btn => {
      if (btn.onclick.toString().includes('true')) {
        btn.classList.add('bonne-reponse');
      }
    });
  }

  etatJeu.quizReussi = estCorrect;

  /* Afficher le feedback */
  const feedback = document.getElementById('quiz-feedback');
  feedback.classList.add('visible');
  feedback.innerHTML = estCorrect
    ? `<strong style="color:var(--moss);">✅ Bonne réponse !</strong><br>
       Vous avez simulé le <strong>daltonisme</strong> — une déficience de la perception des couleurs.
       Niveau 1 : <strong>deutéranopie</strong> (rouge ≈ vert). Niveau 2 : <strong>protanopie</strong>
       (rouge quasi invisible, orange ≈ vert). Niveau 3 : les deux en même temps.
       Environ <strong>8% des hommes</strong> vivent cela chaque jour, sans filtre, sans chrono.`
    : `<strong style="color:var(--coral);">❌ Pas tout à fait…</strong><br>
       Ce jeu simule le <strong>daltonisme</strong> — une déficience de la perception des couleurs,
       et non un trouble de l'attention (TDA), de l'écriture (dysgraphie) ou du comportement
       alimentaire (TCA). Les couleurs que vous voyiez étaient filtrées pour reproduire
       ce que perçoivent des millions de personnes chaque jour.`;

  /* Afficher le bouton suivant */
  document.getElementById('btn-quiz-suite').style.display = 'inline-flex';
}

/* ================================================================
   RÉCAPITULATIF FINAL
================================================================ */
function afficherRecapitulatif() {
  const score = (etatJeu.scoreN1 ? 1 : 0) + (etatJeu.scoreN1b ? 1 : 0) + (etatJeu.scoreN3 ? 1 : 0);

  const barreDom = document.getElementById('score-barre');
  barreDom.innerHTML = '';

  const niveaux = [
    { label: 'Niveau 1\nDésamorçage',  victoire: etatJeu.scoreN1 },
    { label: 'Niveau 2\nDésamorçage',  victoire: etatJeu.scoreN1b },
    { label: 'Niveau 3\nFinal',         victoire: etatJeu.scoreN3 },
  ];

  niveaux.forEach(niv => {
    const item = document.createElement('div');
    item.className = 'score-item';
    item.innerHTML = `
      <span class="score-icone">${niv.victoire ? '✅' : '❌'}</span>
      <span style="white-space:pre-line;text-align:center;">${niv.label}</span>
    `;
    barreDom.appendChild(item);
  });

  const messages = {
    0: "C'est très difficile — c'est le quotidien de millions de daltoniens.",
    1: "1 niveau réussi — chaque type crée ses propres pièges.",
    2: "2 niveaux réussis — deux confusions différentes surmontées !",
    3: "Parfait ! Vous avez navigué dans les trois niveaux sans erreur. 🏆",
  };

  document.getElementById('score-message').textContent =
    `${score} / 3 — ${messages[score]}`;

  afficherEcran('ecran-fin');
}

/* ----------------------------------------------------------------
   Rejouer
---------------------------------------------------------------- */
function rejouer() {
  clearInterval(etatJeu.intervalN1);
  clearInterval(etatJeu.intervalN1b);
  clearInterval(etatJeu.intervalN3);
  document.body.classList.remove('mode-protanopie', 'mode-combine');
  etatJeu.scoreN1  = false;
  etatJeu.scoreN1b = false;
  etatJeu.scoreN3  = false;
  etatJeu.quizReussi = false;

  /* Réinitialiser le quiz */
  document.querySelectorAll('.quiz-option').forEach(btn => {
    btn.disabled = false;
    btn.classList.remove('bonne-reponse', 'mauvaise-reponse');
  });
  const feedback = document.getElementById('quiz-feedback');
  if (feedback) { feedback.classList.remove('visible'); feedback.innerHTML = ''; }
  const btnSuite = document.getElementById('btn-quiz-suite');
  if (btnSuite) btnSuite.style.display = 'none';

  afficherEcran('ecran-accueil');
}

/* ----------------------------------------------------------------
   Partager
---------------------------------------------------------------- */
function partager() {
  const score = (etatJeu.scoreN1 ? 1 : 0) + (etatJeu.scoreN1b ? 1 : 0) + (etatJeu.scoreN3 ? 1 : 0);
  const texte = `🎮 J'ai testé "Dans la peau d'un daltonien" et j'ai obtenu ${score}/3 ! `
              + `Deutéranopie, protanopie, combiné… trois niveaux de confusions chromatiques. `
              + `#Accessibilité #Daltonisme #InnnovHandicap`;

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(texte).then(() => {
      document.getElementById('msg-partage').textContent = '✅ Message copié dans le presse-papier !';
      setTimeout(() => { document.getElementById('msg-partage').textContent = ''; }, 3000);
    });
  } else {
    document.getElementById('msg-partage').textContent = '⚠️ Copie non supportée — partagez manuellement.';
  }
}

/* ================================================================
   UTILITAIRE : créer un fil HTML
================================================================ */
function creerFil(couleur, onClick) {
  const conteneur = document.createElement('div');
  conteneur.className = 'fil-conteneur';
  conteneur.dataset.couleur = couleur;
  conteneur.setAttribute('role', 'button');
  conteneur.setAttribute('tabindex', '0');

  const prise = document.createElement('div');
  prise.className = 'fil-prise';

  const cable = document.createElement('div');
  cable.className = 'fil-cable';
  cable.dataset.couleur = couleur;

  conteneur.addEventListener('click', onClick);
  conteneur.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') onClick();
  });

  conteneur.appendChild(prise);
  conteneur.appendChild(cable);
  return conteneur;
}

/* ================================================================
   UTILITAIRE : mettre à jour l'affichage bombe
================================================================ */
function mettreAJourAffichage(idElement, secondes) {
  const el = document.getElementById(idElement);
  if (!el) return;
  const s = String(Math.max(0, secondes)).padStart(2, '0');
  el.textContent = `00:${s}`;
}
