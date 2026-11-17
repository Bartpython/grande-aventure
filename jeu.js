// =====================================================
// 1. Les éléments de la page
// =====================================================
const canvas = document.getElementById("jeu");
const ctx = canvas.getContext("2d");
const ecranAccueil = document.getElementById("accueil");
const champPrenom = document.getElementById("champ-prenom");
const zoneAnimaux = document.getElementById("animaux");
const boutonsAnimaux = document.querySelectorAll(".animal");
const boutonPartir = document.getElementById("bouton-partir");
const bulle = document.getElementById("bulle");
const texteBulle = document.getElementById("texte-bulle");
const boutonRepeter = document.getElementById("bouton-repeter");
const boutonSon = document.getElementById("bouton-son");
const ecranFin = document.getElementById("fin");
const texteFin = document.getElementById("texte-fin");
const boutonRejouer = document.getElementById("bouton-rejouer");
const boutonChanger = document.getElementById("bouton-changer");

// =====================================================
// 2. La taille de la toile
// =====================================================
let largeur = 0;
let hauteur = 0;

function redimensionner() {
  const ratio = window.devicePixelRatio || 1;
  largeur = window.innerWidth;
  hauteur = window.innerHeight;
  canvas.width = largeur * ratio;
  canvas.height = hauteur * ratio;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}
redimensionner();
window.addEventListener("resize", redimensionner);

// Le sol commence aux 70 % de la hauteur de l'écran
function niveauSol() {
  return hauteur * 0.7;
}

function hasard(min, max) {
  return min + Math.random() * (max - min);
}

// =====================================================
// 3. Les animaux qu'on peut choisir
// =====================================================
const ANIMAUX = {
  ours:      { emoji: "🐻", un: "un ours",      le: "L'ours",       regardeAGauche: false },
  lion:      { emoji: "🦁", un: "un lion",      le: "Le lion",      regardeAGauche: false },
  dinosaure: { emoji: "🦖", un: "un dinosaure", le: "Le dinosaure", regardeAGauche: true },
  dragon:    { emoji: "🐉", un: "un dragon",    le: "Le dragon",    regardeAGauche: true }
};

// =====================================================
// 4. Les étapes de l'aventure, dans l'ordre
//    {prenom}, {un animal} et {Le animal} seront remplacés automatiquement
// =====================================================
const ETAPES = [
  {
    type: "traverser", decor: "prairie", geste: "glisser", nombre: 6,
    texte: "En avant, {prenom} ! Voici une prairie aux herbes plus grandes que toi. Glisse ton doigt pour les écarter."
  },
  {
    type: "traverser", decor: "riviere", geste: "glisser", nombre: 6,
    texte: "Devant toi, une rivière bien fraîche ! Glisse ton doigt pour nager jusqu'à l'autre bord."
  },
  {
    type: "traverser", decor: "boue", geste: "taper", nombre: 8,
    texte: "Attention, de la boue toute collante ! Tape sur l'écran pour faire de grands pas."
  },
  {
    type: "attraper", decor: "foret", nombre: 6,
    texte: "Te voilà dans une grande forêt. Attrape six feuilles qui tombent pour trouver le chemin !"
  },
  {
    type: "traverser", decor: "neige", geste: "glisser", nombre: 6,
    texte: "Brrr, une tempête de neige ! Glisse ton doigt pour avancer contre le vent."
  },
  {
    type: "grotte", decor: "grotte",
    texte: "Une grotte toute noire... Promène ton doigt pour éclairer avec ta lampe. Qui dort ici ?"
  },
  {
    type: "rencontre", decor: "grotte-eclairee", nombre: 5,
    texte: "Tu as trouvé {un animal} ! Il est très gentil. Touche-le pour lui faire cinq câlins."
  },
  {
    type: "retour", decors: ["neige", "foret", "boue", "riviere", "prairie"],
    texte: "{Le animal} veut jouer à chat avec toi ! Vite, rentre à la maison ! Tape très vite sur l'écran !"
  },
  {
    type: "maison", decor: "maison",
    texte: "Ouf ! Te voilà à la maison, {prenom} ! {Le animal} te fait un gros câlin. Quelle aventure !"
  }
];

// =====================================================
// 5. L'état du jeu (tout ce qui change pendant la partie)
// =====================================================
let prenom = "";
let choixAnimal = null;     // "ours", "lion", "dinosaure" ou "dragon"
let indexEtape = -1;        // numéro de l'étape en cours dans ETAPES
let etape = null;           // l'étape en cours (null = on est sur l'accueil)
let progression = 0;        // combien de gestes réussis dans cette étape
let etapeTerminee = false;
let texteActuel = "";

const heros = { x: 0, xCible: 0 };   // xCible = là où le héros doit aller
const compagnon = { x: 0 };          // l'animal qui suit le héros au retour
let decorRetour = 0;                 // pendant le retour : numéro du décor traversé

let feuilles = [];                   // les feuilles qui tombent dans la forêt
let minuteurFeuille = 0;
let particules = [];                 // éclaboussures, cœurs, confettis...
let mots = [];                       // les bruitages écrits ("Plouf !")
let agitation = 0;                   // fait bouger les herbes et la neige plus fort
let fondu = 0;                       // écran noir entre deux décors (1 = noir, 0 = rien)
let lumiere = { x: 0, y: 0 };        // la lampe dans la grotte
let rayonLumiere = 120;
let cachette = { x: 0, y: 0 };       // où dort l'animal dans la grotte
let sonActif = true;

// Les éléments de décor, créés une seule fois au hasard
// (positions en "pourcentage" : 0 = gauche/haut, 1 = droite/bas)
const herbesFond = [];
for (let i = 0; i < 60; i++) {
  herbesFond.push({ x: Math.random(), y: hasard(0, 25), h: hasard(40, 80), d: Math.random() * 10 });
}
const herbesDevant = [];
for (let i = 0; i < 28; i++) {
  herbesDevant.push({ x: Math.random(), y: hasard(78, 95), h: hasard(30, 55), d: Math.random() * 10 });
}
const arbres = [];
for (let i = 0; i < 6; i++) {
  arbres.push({ x: (i + 0.5) / 6 + hasard(-0.04, 0.04), h: hasard(0.3, 0.45), r: hasard(45, 65) });
}
const flocons = [];
for (let i = 0; i < 90; i++) {
  flocons.push({ x: Math.random(), y: Math.random(), v: hasard(0.6, 1.6), r: hasard(1.5, 4) });
}
const rochers = [];
const COULEURS_ROCHERS = ["#292524", "#44403c", "#57534e"];
for (let i = 0; i < 14; i++) {
  rochers.push({ x: Math.random(), y: Math.random() * 0.7, r: hasard(30, 90), c: COULEURS_ROCHERS[i % 3] });
}

// =====================================================
// 6. Les sons (fabriqués par le navigateur, pas besoin de fichiers audio)
// =====================================================
let audio = null;

// Le son ne peut démarrer qu'après un premier toucher : on l'allume à ce moment-là
function initAudio() {
  if (!audio) {
    const ContexteAudio = window.AudioContext || window.webkitAudioContext;
    if (ContexteAudio) {
      audio = new ContexteAudio();
    }
  }
  if (audio && audio.state === "suspended") {
    audio.resume();
  }
}

// Un "chhh" (bruit blanc filtré) : herbe, eau, boue, vent...
function jouerBruit(duree, frequence, volume) {
  if (!audio || !sonActif) return;
  const taille = Math.floor(audio.sampleRate * duree);
  const tampon = audio.createBuffer(1, taille, audio.sampleRate);
  const donnees = tampon.getChannelData(0);
  for (let i = 0; i < taille; i++) {
    donnees[i] = Math.random() * 2 - 1;
  }
  const source = audio.createBufferSource();
  source.buffer = tampon;
  const filtre = audio.createBiquadFilter();
  filtre.type = "bandpass";
  filtre.frequency.value = frequence; // grave = boue, aigu = herbe
  const gain = audio.createGain();
  gain.gain.setValueAtTime(volume, audio.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + duree);
  source.connect(filtre);
  filtre.connect(gain);
  gain.connect(audio.destination);
  source.start();
}

// Une note de musique
function jouerNote(frequence, duree, volume, retard) {
  if (!audio || !sonActif) return;
  const debut = audio.currentTime + retard;
  const oscillateur = audio.createOscillator();
  oscillateur.type = "triangle";
  oscillateur.frequency.value = frequence;
  const gain = audio.createGain();
  gain.gain.setValueAtTime(volume, debut);
  gain.gain.exponentialRampToValueAtTime(0.001, debut + duree);
  oscillateur.connect(gain);
  gain.connect(audio.destination);
  oscillateur.start(debut);
  oscillateur.stop(debut + duree);
}

function jouerSon(nom) {
  if (nom === "herbe") {
    jouerBruit(0.3, 3000, 0.4);
  } else if (nom === "eau") {
    jouerBruit(0.4, 700, 0.6);
    jouerNote(500, 0.15, 0.15, 0);
  } else if (nom === "boue") {
    jouerBruit(0.25, 250, 0.9);
    jouerNote(110, 0.2, 0.3, 0);
  } else if (nom === "feuille") {
    jouerNote(784, 0.12, 0.2, 0);
    jouerNote(1046, 0.15, 0.2, 0.08);
  } else if (nom === "neige") {
    jouerBruit(0.5, 5000, 0.25);
  } else if (nom === "trouve") {
    [523, 659, 784, 1046].forEach(function (frequence, i) {
      jouerNote(frequence, 0.3, 0.2, i * 0.12);
    });
  } else if (nom === "calin") {
    jouerNote(660, 0.2, 0.2, 0);
    jouerNote(880, 0.3, 0.2, 0.1);
  } else if (nom === "victoire") {
    [523, 523, 784, 784, 880, 880, 784].forEach(function (frequence, i) {
      jouerNote(frequence, 0.25, 0.2, i * 0.2);
    });
  }
}

// Le téléphone lit le texte à voix haute (pratique si l'enfant lit encore peu)
function parler(texte) {
  if (!sonActif || !("speechSynthesis" in window)) return;
  speechSynthesis.cancel();
  const phrase = new SpeechSynthesisUtterance(texte);
  phrase.lang = "fr-FR";
  phrase.rate = 0.95;
  phrase.pitch = 1.1;
  speechSynthesis.speak(phrase);
}

// =====================================================
// 7. L'écran d'accueil
// =====================================================
function choisirAnimal(nom) {
  choixAnimal = nom;
  boutonsAnimaux.forEach(function (bouton) {
    bouton.classList.toggle("choisi", bouton.dataset.animal === nom);
  });
}

boutonsAnimaux.forEach(function (bouton) {
  bouton.addEventListener("click", function () {
    initAudio();
    choisirAnimal(bouton.dataset.animal);
    jouerSon("calin");
  });
});

// On pré-remplit avec le dernier prénom et le dernier animal choisis
if (localStorage.getItem("prenom")) {
  champPrenom.value = localStorage.getItem("prenom");
}
const animalEnregistre = localStorage.getItem("animal");
if (animalEnregistre && ANIMAUX[animalEnregistre]) {
  choisirAnimal(animalEnregistre);
}

// Fait trembler un élément pour montrer qu'il manque quelque chose
function secouer(element) {
  element.classList.add("secoue");
  setTimeout(function () {
    element.classList.remove("secoue");
  }, 400);
}

boutonPartir.addEventListener("click", function () {
  const saisie = champPrenom.value.trim(); // trim() enlève les espaces au début et à la fin
  if (saisie === "") {
    secouer(champPrenom);
    champPrenom.focus();
    return;
  }
  if (!choixAnimal) {
    secouer(zoneAnimaux);
    return;
  }
  // Première lettre en majuscule : "léo" -> "Léo"
  prenom = saisie.charAt(0).toUpperCase() + saisie.slice(1);
  localStorage.setItem("prenom", prenom);
  localStorage.setItem("animal", choixAnimal);

  champPrenom.blur(); // ferme le clavier du téléphone
  initAudio();
  ecranAccueil.classList.add("cache");
  demarrerAventure();
});

// =====================================================
// 8. Le déroulement de l'aventure
// =====================================================

// Remplace {prenom}, {un animal}, {Le animal} par les bons mots
function remplir(texte) {
  const animal = ANIMAUX[choixAnimal];
  return texte
    .replaceAll("{prenom}", prenom)
    .replaceAll("{un animal}", animal.un)
    .replaceAll("{Le animal}", animal.le);
}

function afficherTexte(texte) {
  texteActuel = texte;
  texteBulle.textContent = texte;
  bulle.classList.remove("cache");
  parler(texte);
}

function demarrerAventure() {
  indexEtape = -1;
  etapeSuivante();
}

function etapeSuivante() {
  indexEtape++;
  etape = ETAPES[indexEtape];

  // On remet tout à zéro pour la nouvelle étape
  progression = 0;
  etapeTerminee = false;
  feuilles = [];
  particules = [];
  mots = [];
  fondu = 1;
  heros.x = largeur * 0.12;
  heros.xCible = heros.x;

  // Préparatifs particuliers à certaines étapes
  if (etape.type === "grotte") {
    cachette.x = hasard(largeur * 0.45, largeur * 0.85);
    cachette.y = hasard(hauteur * 0.35, niveauSol());
    lumiere.x = largeur * 0.2;
    lumiere.y = hauteur * 0.5;
    rayonLumiere = 120;
  }
  if (etape.type === "rencontre") {
    heros.x = largeur * 0.22;
    heros.xCible = heros.x;
  }
  if (etape.type === "retour") {
    decorRetour = 0;
    heros.x = largeur * 0.32;     // le héros part un peu plus loin...
    heros.xCible = heros.x;
    compagnon.x = largeur * 0.08; // ... pour qu'on voie l'animal derrière lui
  }
  if (etape.type === "maison") {
    heros.x = largeur * 0.36;
    heros.xCible = heros.x;
    compagnon.x = largeur * 0.64;
    jouerSon("victoire");
    for (let i = 0; i < 50; i++) {
      ajouterParticule(largeur / 2, hauteur * 0.4, {
        vx: hasard(-6, 6), vy: hasard(-10, -3), vie: 90,
        couleur: ["#f472b6", "#facc15", "#60a5fa", "#34d399"][i % 4], gravite: true
      });
    }
    setTimeout(afficherFin, 4500);
  }

  afficherTexte(remplir(etape.texte));
}

// Fin d'une étape : le héros sort de l'écran, puis on passe à la suivante
function terminerEtape(delai) {
  etapeTerminee = true;
  feuilles = [];
  heros.xCible = largeur * 1.15;
  setTimeout(etapeSuivante, delai);
}

function afficherFin() {
  bulle.classList.add("cache");
  texteFin.textContent = "Bravo " + prenom + " ! 🎉 Quelle belle aventure avec " + ANIMAUX[choixAnimal].un + " !";
  ecranFin.classList.remove("cache");
  parler("Bravo " + prenom + " !");
}

boutonRejouer.addEventListener("click", function () {
  ecranFin.classList.add("cache");
  demarrerAventure();
});

boutonChanger.addEventListener("click", function () {
  ecranFin.classList.add("cache");
  bulle.classList.add("cache");
  etape = null;
  ecranAccueil.classList.remove("cache");
});

boutonRepeter.addEventListener("click", function () {
  parler(texteActuel);
});

boutonSon.addEventListener("click", function () {
  sonActif = !sonActif; // ! = l'inverse : vrai devient faux, faux devient vrai
  boutonSon.textContent = sonActif ? "🔊" : "🔇";
  if (!sonActif && "speechSynthesis" in window) {
    speechSynthesis.cancel();
  }
});

// =====================================================
// 9. Les gestes du doigt
// =====================================================
let doigt = null;          // position du doigt quand il est posé (null = levé)
let dernierGlisser = 0;

canvas.addEventListener("pointerdown", function (e) {
  initAudio();
  doigt = { x: e.clientX, y: e.clientY };
  lumiere.x = e.clientX;
  lumiere.y = e.clientY;
  quandAction("taper", e.clientX, e.clientY);
});

canvas.addEventListener("pointermove", function (e) {
  lumiere.x = e.clientX;
  lumiere.y = e.clientY;
  if (doigt) {
    // Le doigt a glissé de plus de 70 pixels ? C'est un "glisser" !
    const distance = Math.hypot(e.clientX - doigt.x, e.clientY - doigt.y);
    const maintenant = performance.now();
    if (distance > 70 && maintenant - dernierGlisser > 180) {
      dernierGlisser = maintenant;
      doigt.x = e.clientX;
      doigt.y = e.clientY;
      quandAction("glisser", e.clientX, e.clientY);
    }
  }
});

function leverDoigt() {
  doigt = null;
}
canvas.addEventListener("pointerup", leverDoigt);
canvas.addEventListener("pointercancel", leverDoigt);

// Appelée à chaque geste : on regarde ce que ça fait selon l'étape
function quandAction(geste, x, y) {
  if (!etape || etapeTerminee) return;

  // --- Traverser un décor (prairie, rivière, boue, neige) ---
  if (etape.type === "traverser" && geste === etape.geste) {
    progression++;
    heros.xCible = largeur * (0.12 + 0.76 * progression / etape.nombre);
    effetDecor(etape.decor, heros.x, yHeros());
    if (progression >= etape.nombre) {
      terminerEtape(1300);
    }
  }

  // --- Attraper les feuilles dans la forêt ---
  else if (etape.type === "attraper" && geste === "taper") {
    for (const feuille of feuilles) {
      if (Math.hypot(feuille.x - x, feuille.y - y) < 55) {
        feuilles.splice(feuilles.indexOf(feuille), 1);
        progression++;
        heros.xCible = largeur * (0.12 + 0.76 * progression / etape.nombre);
        effetDecor("foret", x, y);
        if (progression >= etape.nombre) {
          terminerEtape(1300);
        }
        break; // une seule feuille par toucher
      }
    }
  }

  // --- Faire des câlins à l'animal ---
  else if (etape.type === "rencontre" && geste === "taper") {
    const position = positionAnimalRencontre();
    if (Math.hypot(x - position.x, y - position.y) < 130) {
      progression++;
      jouerSon("calin");
      ajouterMot("Câlin !", position.x, position.y - 100);
      for (let i = 0; i < 6; i++) {
        ajouterParticule(position.x, position.y, { texte: "❤️", vx: hasard(-3, 3), vy: hasard(-4, -1.5), vie: 70 });
      }
      if (navigator.vibrate) navigator.vibrate(30);
      if (progression >= etape.nombre) {
        etapeTerminee = true;
        setTimeout(etapeSuivante, 1500);
      }
    }
  }

  // --- Courir jusqu'à la maison ---
  else if (etape.type === "retour" && geste === "taper") {
    progression++;
    effetDecor(etape.decors[decorRetour], heros.x, yHeros());
    heros.xCible = Math.min(heros.xCible + largeur * 0.2, largeur * 0.9);
    // Dernier décor et arrivé au bout ? On est rentré !
    if (decorRetour === etape.decors.length - 1 && heros.xCible >= largeur * 0.9) {
      terminerEtape(1000);
    }
  }
}

// Bruitage + mot + éclaboussures, selon le décor
const EFFETS = {
  prairie: { mot: "Frouch !",   son: "herbe",   couleur: "#84cc16" },
  riviere: { mot: "Plouf !",    son: "eau",     couleur: "#e0f2fe" },
  boue:    { mot: "Sploutch !", son: "boue",    couleur: "#78350f" },
  foret:   { mot: "Hop !",      son: "feuille", couleur: "#f97316" },
  neige:   { mot: "Brrr !",     son: "neige",   couleur: "#ffffff" }
};

function effetDecor(nomDecor, x, y) {
  const effet = EFFETS[nomDecor];
  ajouterMot(effet.mot, x, y - 70);
  jouerSon(effet.son);
  for (let i = 0; i < 12; i++) {
    ajouterParticule(x, y, {
      vx: hasard(-3, 3), vy: hasard(-6, -2), vie: 40,
      couleur: effet.couleur, gravite: true
    });
  }
  agitation = 1;
  if (navigator.vibrate) navigator.vibrate(20);
}

function ajouterMot(texte, x, y) {
  mots.push({ texte: texte, x: x, y: y, vie: 50 });
}

function ajouterParticule(x, y, options) {
  particules.push({
    x: x, y: y,
    vx: options.vx, vy: options.vy,
    vie: options.vie, vieMax: options.vie,
    couleur: options.couleur || "white",
    texte: options.texte || null,
    gravite: options.gravite || false,
    taille: hasard(3, 7)
  });
}

// =====================================================
// 10. Mettre à jour (avant chaque dessin)
// =====================================================

// Quel décor afficher en ce moment ?
function decorActuel() {
  if (!etape) return "prairie";
  if (etape.type === "retour") return etape.decors[decorRetour];
  return etape.decor;
}

// La hauteur du héros (plus bas dans la rivière : il nage !)
function yHeros() {
  return decorActuel() === "riviere" ? niveauSol() + 55 : niveauSol() + 30;
}

function positionAnimalRencontre() {
  return { x: largeur * 0.62, y: niveauSol() - 20 };
}

function mettreAJour(temps, dt) {
  // Le héros avance en douceur vers sa cible
  heros.x += (heros.xCible - heros.x) * 0.06 * dt;

  // L'agitation retombe petit à petit
  agitation = Math.max(0, agitation - 0.02 * dt);

  // Particules : elles bougent, tombent (gravité) et s'éteignent
  for (const p of particules) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.gravite) p.vy += 0.25 * dt;
    p.vie -= dt;
  }
  particules = particules.filter(function (p) { return p.vie > 0; });

  // Les mots montent et disparaissent
  for (const mot of mots) {
    mot.y -= 0.8 * dt;
    mot.vie -= dt;
  }
  mots = mots.filter(function (mot) { return mot.vie > 0; });

  // Les flocons volent avec le vent
  for (const f of flocons) {
    f.x -= (0.0015 + agitation * 0.006) * f.v * dt;
    f.y += 0.003 * f.v * dt;
    if (f.x < 0) f.x = 1;
    if (f.y > 1) f.y = 0;
  }

  if (!etape) return;

  // Forêt : des feuilles tombent régulièrement
  if (etape.type === "attraper" && !etapeTerminee) {
    minuteurFeuille -= dt;
    if (minuteurFeuille <= 0 && feuilles.length < 5) {
      feuilles.push({ x: hasard(40, largeur - 40), y: -30, vitesse: hasard(1.2, 2), d: Math.random() * 10 });
      minuteurFeuille = 45;
    }
    for (const feuille of feuilles) {
      feuille.y += feuille.vitesse * dt;
      feuille.x += Math.sin(temps / 400 + feuille.d) * 1.2 * dt;
    }
    feuilles = feuilles.filter(function (feuille) { return feuille.y < niveauSol() + 60; });
  }

  // Grotte : la lumière passe sur l'animal ? Trouvé !
  if (etape.type === "grotte") {
    if (!etapeTerminee && Math.hypot(lumiere.x - cachette.x, lumiere.y - cachette.y) < 60) {
      etapeTerminee = true;
      jouerSon("trouve");
      ajouterMot("Trouvé !", cachette.x, cachette.y - 70);
      setTimeout(etapeSuivante, 2200);
    }
    // une fois trouvé, la lumière grandit pour tout éclairer
    const rayonVoulu = etapeTerminee ? Math.max(largeur, hauteur) * 1.5 : 120;
    rayonLumiere += (rayonVoulu - rayonLumiere) * 0.04 * dt;
  }

  // Retour : l'animal suit le héros, et on change de décor au bord de l'écran
  if (etape.type === "retour") {
    compagnon.x += (heros.x - 100 - compagnon.x) * 0.04 * dt;
    if (!etapeTerminee && heros.x > largeur * 0.86 && decorRetour < etape.decors.length - 1) {
      decorRetour++;
      heros.x = largeur * 0.32;
      heros.xCible = heros.x;
      compagnon.x = largeur * 0.08;
      fondu = 0.6;
    }
  }

  // Maison : des petits cœurs s'envolent
  if (etape.type === "maison" && Math.random() < 0.05 * dt) {
    ajouterParticule(largeur * 0.5 + hasard(-70, 70), yHeros() - 40, { texte: "❤️", vx: hasard(-0.5, 0.5), vy: -1.5, vie: 90 });
  }

  // Le fondu au noir s'efface
  fondu = Math.max(0, fondu - 0.035 * dt);
}

// =====================================================
// 11. Outils de dessin
// =====================================================
function dessinerEmoji(emoji, x, y, taille, miroir) {
  ctx.save();
  ctx.translate(x, y);
  if (miroir) ctx.scale(-1, 1);
  ctx.font = taille + "px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "black";
  ctx.fillText(emoji, 0, 0);
  ctx.restore();
}

// Texte blanc avec un contour foncé (lisible sur tous les décors)
function dessinerTexteContour(texte, x, y, taille) {
  ctx.font = "bold " + taille + "px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineWidth = taille / 6;
  ctx.strokeStyle = "rgba(0, 0, 0, 0.6)";
  ctx.strokeText(texte, x, y);
  ctx.fillStyle = "white";
  ctx.fillText(texte, x, y);
}

function cercle(x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function dessinerCiel(couleurHaut, couleurBas) {
  const degrade = ctx.createLinearGradient(0, 0, 0, niveauSol());
  degrade.addColorStop(0, couleurHaut);
  degrade.addColorStop(1, couleurBas);
  ctx.fillStyle = degrade;
  ctx.fillRect(0, 0, largeur, hauteur);
}

function dessinerSol(couleur) {
  ctx.fillStyle = couleur;
  ctx.fillRect(0, niveauSol(), largeur, hauteur - niveauSol());
}

function dessinerSoleil(x, y, r) {
  ctx.fillStyle = "#fde047";
  cercle(x, y, r);
}

function dessinerNuage(x, y) {
  ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
  cercle(x, y, 22);
  cercle(x + 25, y - 10, 28);
  cercle(x + 52, y, 22);
}

// =====================================================
// 12. Les décors
//     fond   = dessiné AVANT les personnages (derrière)
//     devant = dessiné APRÈS les personnages (devant eux)
// =====================================================

// --- Prairie ---
function dessinerHerbes(liste, couleur, temps) {
  ctx.strokeStyle = couleur;
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  for (const herbe of liste) {
    const x = herbe.x * largeur;
    const y = niveauSol() + herbe.y;
    // balancement doux + gros mouvement quand on "agite"
    const angle = Math.sin(temps / 700 + herbe.d) * 0.1 + agitation * Math.sin(temps / 80 + herbe.d) * 0.4;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x, y - herbe.h * 0.6, x + Math.sin(angle) * herbe.h, y - Math.cos(angle) * herbe.h);
    ctx.stroke();
  }
}

function fondPrairie(temps) {
  dessinerCiel("#7dd3fc", "#e0f2fe");
  dessinerSoleil(largeur * 0.82, hauteur * 0.22, 40);
  dessinerNuage((temps / 60) % (largeur + 200) - 100, hauteur * 0.3);
  dessinerSol("#65a30d");
  dessinerHerbes(herbesFond, "#4d7c0f", temps);
}

function devantPrairie(temps) {
  dessinerHerbes(herbesDevant, "#3f6212", temps);
}

// --- Rivière ---
function dessinerVagues(haut, bas, temps) {
  ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
  ctx.lineWidth = 3;
  for (let y = haut + 15; y < bas; y += 25) {
    const decalage = (temps / 25 + y) % 60;
    for (let x = -60 + decalage; x < largeur + 60; x += 60) {
      ctx.beginPath();
      ctx.arc(x, y, 12, Math.PI * 1.1, Math.PI * 1.9);
      ctx.stroke();
    }
  }
}

function fondRiviere(temps) {
  dessinerCiel("#7dd3fc", "#e0f2fe");
  dessinerSoleil(largeur * 0.82, hauteur * 0.22, 40);
  dessinerSol("#84cc16");
  const haut = niveauSol() + 25;
  const bas = hauteur - 45;
  ctx.fillStyle = "#38bdf8";
  ctx.fillRect(0, haut, largeur, bas - haut);
  dessinerVagues(haut, bas, temps);
}

function devantRiviere(temps) {
  // de l'eau par-dessus le bas du héros : on dirait qu'il nage
  const haut = yHeros() + 8;
  const bas = hauteur - 45;
  ctx.fillStyle = "rgba(56, 189, 248, 0.8)";
  ctx.fillRect(0, haut, largeur, bas - haut);
  dessinerVagues(haut, bas, temps);
}

// --- Boue ---
const FLAQUES = [[0.2, 0.25, 70], [0.55, 0.6, 90], [0.85, 0.3, 60]];

function fondBoue(temps) {
  dessinerCiel("#94a3b8", "#e2e8f0");
  dessinerNuage((temps / 80) % (largeur + 200) - 100, hauteur * 0.25);
  dessinerSol("#92400e");
  const hauteurSol = hauteur - niveauSol();
  for (const flaque of FLAQUES) {
    const x = flaque[0] * largeur;
    const y = niveauSol() + 20 + flaque[1] * (hauteurSol - 40);
    ctx.fillStyle = "#78350f";
    ctx.beginPath();
    ctx.ellipse(x, y, flaque[2], flaque[2] * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
    // une petite bulle qui gonfle et dégonfle
    ctx.fillStyle = "#a16207";
    cercle(x + 15, y - 3, 3 + Math.sin(temps / 300 + x) * 2);
  }
}

function devantBoue() {
  // de la boue autour des pieds
  ctx.fillStyle = "#78350f";
  ctx.beginPath();
  ctx.ellipse(heros.x, yHeros() + 30, 34, 10, 0, 0, Math.PI * 2);
  ctx.fill();
}

// --- Forêt ---
function fondForet() {
  dessinerCiel("#86efac", "#dcfce7");
  dessinerSol("#3f6212");
  for (const arbre of arbres) {
    const x = arbre.x * largeur;
    const haut = niveauSol() - arbre.h * hauteur;
    ctx.fillStyle = "#713f12";
    ctx.fillRect(x - 14, haut, 28, niveauSol() - haut + 15);
    ctx.fillStyle = "#15803d";
    cercle(x, haut, arbre.r);
    ctx.fillStyle = "#166534";
    cercle(x - arbre.r * 0.6, haut + arbre.r * 0.4, arbre.r * 0.7);
    cercle(x + arbre.r * 0.6, haut + arbre.r * 0.4, arbre.r * 0.7);
  }
}

// --- Neige ---
function fondNeige() {
  dessinerCiel("#94a3b8", "#e2e8f0");
  dessinerSol("#f8fafc");
  ctx.fillStyle = "#ffffff";
  for (let x = 0; x < largeur + 60; x += 60) {
    cercle(x, niveauSol(), 35); // des bosses de neige
  }
}

function devantNeige() {
  ctx.fillStyle = "white";
  for (const f of flocons) {
    cercle(f.x * largeur, f.y * hauteur, f.r);
  }
}

// --- Grotte ---
function fondGrotte(temps) {
  ctx.fillStyle = "#1c1917";
  ctx.fillRect(0, 0, largeur, hauteur);
  for (const rocher of rochers) {
    ctx.fillStyle = rocher.c;
    ctx.beginPath();
    ctx.ellipse(rocher.x * largeur, rocher.y * hauteur, rocher.r, rocher.r * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // des stalactites au plafond
  ctx.fillStyle = "#44403c";
  for (let x = 20; x < largeur; x += 70) {
    ctx.beginPath();
    ctx.moveTo(x - 18, 0);
    ctx.lineTo(x + 18, 0);
    ctx.lineTo(x, 50 + (x % 3) * 20);
    ctx.fill();
  }
  dessinerSol("#292524");

  // L'animal endormi
  if (etape && etape.type === "grotte") {
    const animal = ANIMAUX[choixAnimal];
    dessinerEmoji(animal.emoji, cachette.x, cachette.y, etapeTerminee ? 100 : 70, false);
    if (!etapeTerminee) {
      dessinerTexteContour("z z z", cachette.x + 45, cachette.y - 40 - (temps / 40) % 15, 20);
    }
  }
}

function devantGrotte() {
  // Tout est noir, sauf un rond de lumière autour du doigt
  const degrade = ctx.createRadialGradient(lumiere.x, lumiere.y, rayonLumiere * 0.3, lumiere.x, lumiere.y, rayonLumiere);
  degrade.addColorStop(0, "rgba(0, 0, 0, 0)");
  degrade.addColorStop(1, "rgba(0, 0, 0, 0.96)");
  ctx.fillStyle = degrade;
  ctx.fillRect(0, 0, largeur, hauteur);
}

function fondGrotteEclairee(temps) {
  fondGrotte(temps);
  // une lueur chaude au milieu
  const position = positionAnimalRencontre();
  const lueur = ctx.createRadialGradient(position.x, position.y, 10, position.x, position.y, largeur * 0.8);
  lueur.addColorStop(0, "rgba(253, 224, 71, 0.45)");
  lueur.addColorStop(1, "rgba(253, 224, 71, 0)");
  ctx.fillStyle = lueur;
  ctx.fillRect(0, 0, largeur, hauteur);
}

// --- Maison ---
function fondMaison() {
  dessinerCiel("#fb923c", "#fde68a");
  dessinerSoleil(largeur * 0.15, niveauSol() - 10, 45); // soleil couchant
  dessinerSol("#65a30d");
  const cx = largeur * 0.5;
  const bas = niveauSol() + 15;
  const l = 170;
  const h = 130;
  ctx.fillStyle = "#fef3c7";                      // les murs
  ctx.fillRect(cx - l / 2, bas - h, l, h);
  ctx.fillStyle = "#b91c1c";                      // le toit
  ctx.beginPath();
  ctx.moveTo(cx - l / 2 - 20, bas - h);
  ctx.lineTo(cx, bas - h - 80);
  ctx.lineTo(cx + l / 2 + 20, bas - h);
  ctx.fill();
  ctx.fillStyle = "#92400e";                      // la porte
  ctx.fillRect(cx - 22, bas - 70, 44, 70);
  ctx.fillStyle = "#fde047";                      // les fenêtres allumées
  ctx.fillRect(cx - l / 2 + 18, bas - h + 25, 36, 32);
  ctx.fillRect(cx + l / 2 - 54, bas - h + 25, 36, 32);
}

// La liste des décors : pour chaque nom, sa fonction "fond" et sa fonction "devant"
const DECORS = {
  "prairie":         { fond: fondPrairie,        devant: devantPrairie },
  "riviere":         { fond: fondRiviere,        devant: devantRiviere },
  "boue":            { fond: fondBoue,           devant: devantBoue },
  "foret":           { fond: fondForet,          devant: null },
  "neige":           { fond: fondNeige,          devant: devantNeige },
  "grotte":          { fond: fondGrotte,         devant: devantGrotte },
  "grotte-eclairee": { fond: fondGrotteEclairee, devant: null },
  "maison":          { fond: fondMaison,         devant: null }
};

// =====================================================
// 13. Dessiner les personnages et les indications
// =====================================================
function dessinerPersonnages(temps) {
  if (!etape) return;
  const animal = ANIMAUX[choixAnimal];

  // L'animal pendant le retour (il court derrière) et à la maison
  if (etape.type === "retour" || etape.type === "maison") {
    const saut = -Math.abs(Math.sin(temps / 110)) * 12;
    const miroir = etape.type === "retour" && animal.regardeAGauche; // il doit regarder vers la droite
    dessinerEmoji(animal.emoji, compagnon.x, yHeros() - 10 + saut, 80, miroir);
  }

  // L'animal dans la grotte éclairée : il grossit de bonheur à chaque câlin !
  if (etape.type === "rencontre") {
    const position = positionAnimalRencontre();
    const rebond = Math.sin(temps / 250) * 6;
    dessinerEmoji(animal.emoji, position.x, position.y + rebond, 120 + progression * 8, false);
  }

  // Le héros : il sautille quand il marche
  const enMarche = Math.abs(heros.xCible - heros.x) > 2;
  const sautille = enMarche ? -Math.abs(Math.sin(temps / 90)) * 10 : 0;
  dessinerEmoji("🧒", heros.x, yHeros() + sautille, 64, false);
  dessinerTexteContour(prenom, heros.x, yHeros() + sautille - 54, 18);
}

function dessinerFeuilles() {
  for (const feuille of feuilles) {
    dessinerEmoji("🍂", feuille.x, feuille.y, 48, false);
  }
}

function dessinerParticules() {
  for (const p of particules) {
    ctx.globalAlpha = Math.max(0, p.vie / p.vieMax);
    if (p.texte) {
      dessinerEmoji(p.texte, p.x, p.y, 28, false);
    } else {
      ctx.fillStyle = p.couleur;
      cercle(p.x, p.y, p.taille);
    }
  }
  ctx.globalAlpha = 1;
}

function dessinerMots() {
  for (const mot of mots) {
    ctx.globalAlpha = Math.min(1, mot.vie / 20);
    dessinerTexteContour(mot.texte, mot.x, mot.y, 40);
  }
  ctx.globalAlpha = 1;
}

function dessinerIndications(temps) {
  if (!etape) return;
  const bas = hauteur - 40;

  // Des petits ronds qui se remplissent (●●●○○○)
  if (etape.type === "traverser" || etape.type === "attraper" || etape.type === "rencontre") {
    const ecart = 28;
    const depart = largeur / 2 - (etape.nombre - 1) * ecart / 2;
    ctx.strokeStyle = "rgba(0, 0, 0, 0.35)"; // un contour : visible même sur la neige
    ctx.lineWidth = 2;
    for (let i = 0; i < etape.nombre; i++) {
      ctx.fillStyle = i < progression ? "#facc15" : "rgba(255, 255, 255, 0.6)";
      cercle(depart + i * ecart, bas, 9);
      ctx.stroke();
    }
  }

  // Pendant le retour : une barre jusqu'à la maison
  if (etape.type === "retour") {
    const x0 = largeur * 0.18;
    const x1 = largeur * 0.82;
    const avancement = Math.min(1, (decorRetour + heros.x / largeur) / etape.decors.length);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x0, bas);
    ctx.lineTo(x1, bas);
    ctx.strokeStyle = "rgba(0, 0, 0, 0.3)";   // un trait foncé en dessous...
    ctx.lineWidth = 12;
    ctx.stroke();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.9)"; // ... puis le trait blanc par-dessus
    ctx.lineWidth = 8;
    ctx.stroke();
    dessinerEmoji("🏠", x1 + 10, bas - 4, 32, false);
    dessinerEmoji("🧒", x0 + (x1 - x0) * avancement, bas - 4, 26, false);
  }

  // Une petite main qui montre quoi faire, tant que l'enfant n'a pas commencé
  if (progression === 0 && !etapeTerminee) {
    if (etape.geste === "glisser") {
      dessinerEmoji("👆", largeur / 2 + Math.sin(temps / 300) * 70, hauteur * 0.5, 54, false);
    } else if (etape.geste === "taper" || etape.type === "retour") {
      dessinerEmoji("👆", largeur / 2, hauteur * 0.5, 50 + Math.abs(Math.sin(temps / 250)) * 12, false);
    } else if (etape.type === "rencontre") {
      const position = positionAnimalRencontre();
      dessinerEmoji("👆", position.x + 40, position.y + 60, 50 + Math.abs(Math.sin(temps / 250)) * 12, false);
    }
  }
}

// =====================================================
// 14. La boucle d'animation
// =====================================================
let dernierTemps = 0;

function boucle(temps) {
  let dt = (temps - dernierTemps) / 16.67;
  dernierTemps = temps;
  if (dt > 3) dt = 3;

  mettreAJour(temps, dt);

  // On dessine du fond vers l'avant, comme des calques
  const decor = DECORS[decorActuel()];
  decor.fond(temps);
  dessinerPersonnages(temps);
  dessinerFeuilles();
  if (decor.devant) decor.devant(temps);
  dessinerParticules();
  dessinerMots();
  dessinerIndications(temps);

  // Le fondu au noir entre deux décors
  if (fondu > 0) {
    ctx.fillStyle = "rgba(0, 0, 0, " + fondu + ")";
    ctx.fillRect(0, 0, largeur, hauteur);
  }

  requestAnimationFrame(boucle);
}

requestAnimationFrame(boucle);

// =====================================================
// 15. Le service worker (pour jouer sans internet)
// =====================================================
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js");
}
