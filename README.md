# ✦ Manifestation

Application de manifestation premium — **crée ta réalité** au quotidien.
PWA installable sur **Mac** et **iPhone**, fonctionne **hors-ligne**, données 100 % **privées** (stockées uniquement sur ton appareil).

---

## Ce que fait l'app

Une pratique quotidienne fondée sur ce qui marche vraiment (neurosciences + méthodes éprouvées) :

- **Ma Vision** — ta vision principale + par piliers (Richesse, Carrière, Santé, Relations, Soi). Affichée en permanence pour recalibrer ton attention (système réticulé activateur).
- **Rituel du jour** (5 rituels, tracker + anneau de progression) :
  1. **Gratitude** — accorde le cerveau à l'abondance.
  2. **Méthode 369** — écris ton affirmation 3× / 6× / 9× (compteur guidé).
  3. **Visualisation** — 2 min guidées avec respiration + prompts (le cerveau active les mêmes circuits que l'expérience réelle).
  4. **Scripting** — écris ta réalité au présent.
  5. **Action alignée** — LA chose concrète du jour. *La manifestation sans action crée de l'impuissance ; l'app t'oblige à agir.*
- **Blocages** — identifie une croyance limitante → questionne → recadre → **libère par le tapping EFT guidé** (9 points, minuteur, diagramme).
- **Affirmations** — bibliothèque par domaine, favoris, création perso, tirage du jour.
- **Progrès** — série (streak), calendrier d'intensité, statistiques, export/import de sauvegarde.

---

## Installer l'app

### Héberger (une fois)
L'app est 100 % statique — n'importe quel hébergement HTTPS fonctionne. Le plus simple :

**GitHub Pages** : Settings → Pages → Source = branche `main` (racine). L'URL sera
`https://<utilisateur>.github.io/manifestation/`.

Ou en local pour tester :
```bash
python3 -m http.server 8000   # puis ouvrir http://localhost:8000
```

### Sur iPhone (Safari)
1. Ouvre l'URL dans **Safari**.
2. Bouton **Partager** → **Sur l'écran d'accueil**.
3. L'app s'ouvre en plein écran, comme une app native, même hors-ligne.

### Sur Mac
- **Safari** : menu **Fichier → Ajouter au Dock**.
- **Chrome/Edge** : icône **Installer** dans la barre d'adresse.

---

## Technique

Aucune dépendance, aucun build. Vanilla JS + service worker.

```
index.html            # shell + PWA meta
css/styles.css        # design system (dark / gold / premium)
js/content.js         # contenu FR : piliers, affirmations, prompts, EFT, citations
js/app.js             # state (localStorage), routeur, vues, rituels
manifest.webmanifest  # PWA
sw.js                 # cache offline-first
icons/                # icônes (SVG + PNG 180/192/512 + maskable)
```

**Données & vie privée** : par défaut tout est stocké en local (`localStorage`). Utilise **Progrès → Exporter/Importer** pour une sauvegarde manuelle.

---

## Synchro temps réel Mac ↔ iPhone (Firebase)

Pour que tes données soient identiques et **synchronisées en direct** sur tous tes appareils, active la synchro depuis **Progrès → Synchronisation → Activer**. C'est gratuit et privé (les données vivent dans **ton** projet Firebase).

**Mise en place (une fois, ~2 min) :**
1. [console.firebase.google.com](https://console.firebase.google.com/) → **Créer un projet** (plan Spark gratuit).
2. **Ajouter une application Web** (icône `</>`) et copie l'objet `firebaseConfig`.
3. **Authentication** → *Sign-in method* → active **Email/Password**.
4. **Firestore Database** → *Créer une base* (mode production).
5. **Firestore → Règles** → colle le contenu de [`firestore.rules`](firestore.rules) → *Publier*.
6. Dans l'app (Progrès → Synchronisation → Activer), colle la config, puis **crée un compte** (email + mot de passe).
7. Sur ton 2ᵉ appareil : installe l'app, colle la **même** config, **connecte-toi** avec le même compte. ✦

Le point coloré en haut à droite indique l'état : gris = local, doré clignotant = connexion, vert = synchronisé.

- **Temps réel** : les changements apparaissent en quelques instants d'un appareil à l'autre (Firestore `onSnapshot`).
- **Hors-ligne** : la synchro reprend automatiquement au retour du réseau (cache Firestore).
- **Sécurité** : chaque utilisateur n'accède qu'à ses propres données (voir `firestore.rules`).

---

*Vois-le. Deviens-le. Agis. ✦*
