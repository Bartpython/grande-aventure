// Nom du cache. Quand tu modifies le jeu, passe à v2, v3...
const NOM_CACHE = "aventure-v1";

const FICHIERS = [
  "./",
  "./index.html",
  "./style.css",
  "./jeu.js",
  "./manifest.json",
  "./icones/icone-192.png",
  "./icones/icone-512.png"
];

// 1. Installation : on range les fichiers dans le cache
self.addEventListener("install", function (evenement) {
  evenement.waitUntil(
    caches.open(NOM_CACHE).then(function (cache) {
      return cache.addAll(FICHIERS);
    })
  );
});

// 2. Activation : on supprime les anciens caches
self.addEventListener("activate", function (evenement) {
  evenement.waitUntil(
    caches.keys().then(function (noms) {
      return Promise.all(
        noms
          .filter(function (nom) { return nom !== NOM_CACHE; })
          .map(function (nom) { return caches.delete(nom); })
      );
    })
  );
});

// 3. Chaque demande de fichier : d'abord le cache, sinon internet
self.addEventListener("fetch", function (evenement) {
  evenement.respondWith(
    caches.match(evenement.request).then(function (reponse) {
      return reponse || fetch(evenement.request);
    })
  );
});
