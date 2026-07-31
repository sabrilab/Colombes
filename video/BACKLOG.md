# La file des films

Ce fichier existe pour une raison précise : rendre la fabrication d'un film
*reprenable sans conversation*. Tant que le sujet du prochain film vit dans un
échange, personne d'autre — ni une session planifiée, ni soi-même la semaine
suivante — ne peut le fabriquer. Écrit ici, il devient une tâche.

Chaque entrée porte quatre choses, et pas une de plus : la **croyance** qu'on
corrige, le **format**, le **registre**, et le **plan qui doit tuer** — celui
qu'on saurait décrire à quelqu'un qui n'a pas lu le reste. Un film qui n'a pas
ces quatre-là n'est pas prêt à être monté ; il est prêt à être discuté.

## Comment un film se fabrique

```bash
pnpm video:audio                          # sous-titres, bruitage, mixages
REMOTION_BROWSER=… pnpm video:render:…    # le rendu
```

Le reste — un fichier de montage dans `cuts/`, une composition, une entrée dans
`Root.tsx`, `build-mix.mjs` et `align-captions.mjs` — est décrit dans
`video/README.md`. Compter une heure par film, dont quatre minutes de rendu.

## Ce qui manque à tous les films en attente

Une voix off. Elle se génère avec la voix Bram par le MCP Higgsfield, puis se
dépose dans `video/audio/voice-<film>.wav`. Sans elle, le film sort avec sa
musique et ses sous-titres, et `align-captions.mjs` estime le calage — six
dixièmes de seconde d'écart en moyenne, mesurés. Le jour où l'onde arrive, le
même script imprime les durées de plan exactes et le montage se recale en une
copie.

## Faits

| Film | Format | Croyance corrigée | Voix |
| --- | --- | --- | --- |
| `Colombes70` | 9/16, 1 min 10 | « un calculateur donne un chiffre » | ✅ |
| `Built70` | 9/16, 1 min 10 | « le difficile, c'est de coder » | ❌ |
| `Levers70` | 9/16, 1 min 10 | « il me faut plus de clients » | ✅ |
| `Heuristics70` | 9/16, 1 min 10 | « je devrais savoir ce que ça vaut » | ❌ |
| `Product60` | 16/9, 1 min | — (présentation, appel à l'inscription) | ❌ |
| `Ladder35` | 9/16, 35 s | — (sans parole) | — |
| `Remains35` | 9/16, 35 s | — (sans parole) | — |

## À faire

### 1. « Why is my revenue not my income? »

- **Croyance** : « je fais 12 000 € de MRR, donc je gagne 12 000 € ».
- **Format** : 9/16, 1 min 10.
- **Registre** : la cascade. Un volume plein qu'on vide part par part.
- **Le plan qui doit tuer** : une colonne de liquide dont on retire les tranches
  une à une — coûts directs, acquisition, coûts fixes — et le fond qui reste,
  seul, éclairé. C'est ce fond que quelqu'un achète.
- **Source** : `GRAINS.what-remains`, et la cascade de `Remains35` à reprendre en
  voix off.

### 2. « Why three times and not ten? »

- **Croyance** : « une valorisation, c'est un avis ».
- **Format** : 9/16, 1 min 10.
- **Registre** : la construction. On empile, on nomme, on montre le total.
- **Le plan qui doit tuer** : les neuf lignes de qualité qui poussent le multiple,
  chacune nommée, chacune avec son signe — et le multiple qui monte à mesure.
  Les valeurs viennent de `computeValuation`, jamais écrites à la main.

### 3. « My price is a packaging detail »

- **Croyance** : le prix est un habillage, pas une décision d'entreprise.
- **Format** : 9/16, 1 min 10.
- **Registre** : la comparaison. Deux entreprises au même revenu, tout le reste
  différent.
- **Le plan qui doit tuer** : la même somme d'argent portée par une souris et par
  une baleine, côte à côte, avec le nombre de clients qu'il faut de chaque côté.
- **Attention** : les repères nommés viennent de `LANDMARKS` ; deux marques n'ont
  volontairement pas de logo (voir `public/logos/README.md`).

### 4. La version française du film de présentation

- **Format** : 16/9, 1 min.
- Même montage que `Product60`, texte et voix en français. Les captures d'écran
  sont à reprendre avec la langue de l'app en français —
  `scripts/shoot-ui.mjs` sait le faire dès qu'on lui passe la route qui va bien.

### 5. Un format court, 20 s, une seule idée

- **Format** : 9/16, 20 s, sans parole.
- **Registre** : un seul geste, une seule valeur qui bouge, un seul son.
- **Pourquoi** : les six films existants durent tous plus d'une minute. Rien dans
  la série ne tient dans une boucle de fil d'actualité.
