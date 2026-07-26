# Colombes — accueil, volière et mode Simple/Expert

Date : 2026-07-26 · Statut : validé par l'utilisateur (échange oral, exécution rapide demandée)

## Vision

L'app devient **Colombes** : les SaaS sont des oiseaux qu'on admire ou qu'on élève.
Deux faces : explorer des boîtes fictives réalistes (la volière), et simuler la sienne.

## Décisions actées

- **Marque** : « Colombes » en haut à gauche avec le logo existant (favicon.svg), partout.
- **Accueil** (`#/`) : header avec logo + CTA « Créer son simulateur » ; en dessous, hero
  court puis grille de 6 cards de boîtes fictives.
- **Clic sur une card** → page profil dédiée (`#/colombe/<id>`) : identité, tous les
  indices calculés en direct par le moteur, bloc pédagogique « pourquoi elle vaut ça »
  (top 3 des lignes du barème + leçon rédigée), bouton « Ouvrir dans le simulateur ».
- **CTA « Créer son simulateur »** → simulateur direct (`#/simulateur`), pas de wizard
  (l'assistant guidé viendra plus tard).
- **6 colombes, noms d'oiseaux**, pitchs français crédibles, archétypes différenciés
  (PLG dev tool, vertical resto, B2C fitness, outil newsletters, agence devenue SaaS,
  RH mid-market). Chiffres calibrés sur benchmarks.ts, dans les bornes des jauges.
- **Mode Simple / Expert** (à la Suno) : bascule en haut du panneau, persistée.
  - Simple : pricing (plans), clients, nouveaux clients/mois, churn. Le reste caché
    mais conservé, résumé en une ligne « Hypothèses appliquées : marge 85 %, CAC 180 €… ».
    Tous les résultats restent affichés.
  - Expert : panneau actuel complet.
- **Plans de pricing flexibles : 1 à 4** (au lieu de 3 figés). « + Ajouter un plan »,
  croix pour retirer (jamais moins de 1). Anciens liens à 3 plans toujours valides.

## Architecture

- **Routage** : mini-routeur par hash maison (`src/lib/router.ts`, testé) :
  `#/` accueil · `#/simulateur` simulateur · `#/colombe/<id>` profil ·
  legacy `#s=<b64>` → simulateur avec inputs importés (compat totale).
- **Données volière** : `src/lib/aviary.ts` — 6 entrées `{ id, name, emoji, sector,
  pitch, lesson, inputs }`. Aucune métrique stockée : tout est recalculé par
  `compute()`, garantie de cohérence avec le moteur. Testé (ids uniques, bornes,
  valorisation finie).
- **Moteur** : `tiers` passe de tuple de 3 à `Tier[]` (1..4, bornes dans
  inputBounds.ts). revenue.ts est déjà générique. urlState valide et écrête 1..4.
- **Store** : `setTier(index)`, `addTier()`, `removeTier(index)`, `panelMode`
  persisté, `loadInputs(inputs)` pour « Ouvrir dans le simulateur ».
  Correction au passage : id de scénario par compteur unique (collision connue).
- **Vues** : `AppHeader` partagé (logo Colombes → accueil, actions par vue),
  `HomeView`, `ColombeProfileView`, `SimulatorView` (extraction de l'existant).
  `KpiGrid` refactoré en `KpiTiles({ inputs })` réutilisable hors store.
- **Meta** : titre et OG passent à « Colombes — Simulateur d'actif SaaS ».

## Hors périmètre (itérations suivantes)

Assistant IA/wizard, analytics, découpage du bundle, refonte du barème (churn ×4),
vraies URLs sans hash, édition des noms de plans.
