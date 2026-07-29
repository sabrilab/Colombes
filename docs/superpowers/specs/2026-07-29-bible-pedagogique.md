# Colombes — bible pédagogique

Date : 2026-07-29 · Statut : conception, rien n'est implémenté · Portée : socle (couche 0)
détaillé, couches suivantes esquissées

## Pourquoi ce document

Le simulateur est exact et il est illisible pour qui n'a pas le vocabulaire. On peut
régler un CAC sans savoir ce qu'est un CAC, voir un LTV:CAC de 1,2 sans savoir que c'est
mauvais, et repartir avec un chiffre auquel on ne croit pas — donc inutile.

Ce document définit **comment on enseigne** dans Colombes. Pas un cours en ligne collé à
côté de l'outil : une couche de compréhension tissée dans l'outil, qui se déclenche au
moment où l'utilisateur bute.

## La doctrine : le pad comme modèle

Le pad de l'accueil est déjà le meilleur professeur de l'application, et il ne donne
aucun cours. On y traîne une colombe, le quadrant s'allume, le chiffre monte : on
comprend que prix × clients = revenu, et que les deux axes ne se valent pas, sans
qu'une phrase l'ait dit. C'est ce qu'on généralise.

**Quatre règles, dans cet ordre de priorité.**

1. **La conséquence avant l'explication.** Un grain commence toujours par quelque chose
   qu'on manipule et dont on voit l'effet. Le texte arrive après, pour nommer ce qu'on
   vient de ressentir — jamais pour l'annoncer.
2. **Une idée fausse par grain.** Un grain n'existe que s'il corrige une croyance
   précise. « Expliquer le NRR » n'est pas un objectif ; « montrer qu'on peut croître
   en perdant de l'argent » en est un.
3. **Les vrais chiffres, jamais des chiffres d'école.** Chaque grain tourne sur
   `compute()`, le moteur de production. Un exemple pédagogique qui ne serait pas
   reproductible dans le simulateur serait un mensonge pédagogique.
4. **On peut toujours partir.** Un grain se ferme en un geste et rend l'utilisateur là
   où il était, ses réglages intacts. Le savoir est offert, jamais imposé.

**Le test du grain réussi** : si on retire tout le texte, reste-t-il quelque chose à
comprendre ? Si non, ce n'est pas un grain, c'est une définition — sa place est dans le
glossaire.

## L'unité : le grain

Un grain est la plus petite chose qu'on puisse comprendre seule. Il porte :

| Champ | Rôle |
|---|---|
| `id` | Identifiant stable, sert d'adresse de lien |
| `question` | La question **dans les mots du fondateur**, pas dans le jargon |
| `misconception` | La croyance précise qu'on corrige |
| `mechanic` | Ce qu'on manipule → ce qu'on voit bouger |
| `insight` | La phrase qu'on doit pouvoir dire après, de soi-même |
| `needs` | Grains prérequis — le graphe, pas une liste plate |
| `anchors` | Les endroits de l'app qui pointent vers lui |
| `level` | `socle` · `métier` · `avancé` |

Le graphe compte plus que l'ordre : on n'entre jamais par le début, on entre par là où
ça coince. `needs` sert à proposer le prérequis manquant, pas à verrouiller l'accès.

## La carte des couches

```
couche 0  SOCLE        ce qu'on vend · ce qui reste · ce que ça vaut · le palier
              ↓
couche 1  REVENU       ARPU · mix de plans · le plafond de MRR
              ↓
couche 2  FUITE        churn · NRR · expansion · le churn « normal » de ta zone
              ↓
couche 3  ACQUISITION  CAC · LTV · payback · LTV:CAC · l'audience possédée
              ↓
couche 4  PROFIT       marge brute · charges fixes · SDE
              ↓
couche 5  VALEUR       le barème · les 9 lignes du multiple · la fourchette
              ↓
          PIÈGES       LTD hors MRR · annuel vs churn · les baleines hors cadran
```

## Couche 0 — Le socle

**Quatre grains. C'est la seule couche à construire d'abord, et elle suffit à rendre
l'accueil autonome.** Les couches suivantes ne sont utiles qu'à qui a franchi celle-ci.

### 0.1 — `prix-clients` · « D'où sort ce chiffre ? »

- **Idée fausse** : « il faut plus de clients » — l'axe des clients paraît le seul levier.
- **Mécanique** : le pad, verrous compris. On verrouille les clients, on pousse le prix :
  le chiffre bouge autant. Le module met les deux gestes côte à côte et affiche le
  rapport d'effort — passer de 500 à 1 000 clients contre passer de 23 € à 46 €.
- **Le déclic** : « doubler mon prix et doubler mes clients font la même chose, sauf que
  l'un est gratuit ».
- **Ancres** : légende du pad · titre de la carte d'accueil.
- **Existe déjà** : le pad. Le grain ajoute la mise en regard des deux gestes.

### 0.2 — `palier` · « Je suis quoi, moi, dans cette histoire ? »

- **Idée fausse** : « mon prix est un détail de packaging ». Non : il détermine le métier
  — qui vend, qui accompagne, combien de clients il faut.
- **Mécanique** : la ronde des paliers de Janz, déjà là. Le grain y branche les repères
  (`landmarks.ts`) : Spotify à ~2 $/mois par utilisateur est une **souris**. Voir une
  entreprise à 15 milliards classée en bas de l'échelle dit tout de ce que l'échelle mesure.
- **Le déclic** : « le palier n'est pas une taille, c'est un modèle de vente ».
- **Ancres** : ronde des paliers · badge de palier des KPI · profils de la volière.
- **Existe déjà** : `PRICING_ANIMALS.whatItMeans`, `LANDMARKS.lesson`. Rien à écrire,
  tout à relier.

### 0.3 — `ce-qui-reste` · « Pourquoi mon chiffre d'affaires n'est pas mon revenu ? »

- **Idée fausse** : « je fais 12 K€ de MRR, donc je gagne 12 K€ ».
- **Mécanique** : une cascade animée qu'on remonte à la source. MRR → moins les coûts
  directs → moins l'acquisition → moins les charges fixes → **ce qui reste**. Chaque
  étage se manipule et la barre du bas se réduit à vue d'œil. Le passage sous zéro est
  l'événement du module : la barre devient rouge et la valorisation s'effondre.
- **Le déclic** : « c'est le bas de la cascade qu'on achète, pas le haut ».
- **Ancres** : tuile Marge brute · jauge Charges fixes · insight « vous perdez X par mois ».
- **Existe déjà** : `diagnose.ts` reconstitue exactement cette cascade pour son premier
  insight. Le module en est la version manipulable.

### 0.4 — `multiple` · « Pourquoi ça vaut 3 fois et pas 10 fois ? »

- **Idée fausse** : « la valorisation est une opinion » ou « c'est ×10 l'ARR, tout le monde
  le sait ».
- **Mécanique** : deux curseurs, MRR et churn, et la courbe du barème qui se déplace sous
  un point. On voit que le multiple monte avec la taille (le barème) puis qu'il est
  corrigé par la qualité (les 9 lignes). Chaque ligne s'allume quand elle pèse.
- **Le déclic** : « le multiple n'est pas donné, il est **construit**, et je peux nommer
  chacune de ses neuf lignes ».
- **Ancres** : carte de valorisation · popover « Barème » · bloc « pourquoi elle vaut ça »
  des profils.
- **Existe déjà** : `benchmarks.ts` (la courbe), `valuation.ts` (les 9 lignes avec leur
  `deltaMultiple`). Le module rend visible un calcul déjà exact.

## Couches suivantes — esquisses

À détailler quand le socle tourne. Chacune suit la même anatomie.

**Couche 1 — Revenu.** `arpu` (le prix moyen te classe, ce n'est pas toi qui choisis ta
zone) · `mix-plans` (le plan le moins cher décide de ton ARPU si la majorité s'y trouve) ·
`plafond-mrr` — **le plus fort du lot** : nouveaux clients par mois ÷ churn = le MRR au
delà duquel tu ne monteras jamais à ce rythme. Une asymptote qu'on approche à la main et
qu'on ne franchit pas, quel que soit le temps. `growth.mrrCeiling` existe déjà.

**Couche 2 — Fuite.** `churn` (5 %/mois, c'est la moitié de tes clients en un an — la
composition ne s'intuitionne pas) · `nrr` (comment un client qui grossit compense un
client perdu, et pourquoi ≥ 100 % change la nature de l'actif) · `churn-de-ta-zone` (à
15 €/mois on ne tient pas le churn d'un contrat à 2 000 € ; `priceZoneFor` le sait déjà
et le panneau le signale déjà).

**Couche 3 — Acquisition.** `cac` · `ltv` · `payback` · `ltv-cac` · `audience`. C'est la
couche que l'utilisateur a citée en exemple, et celle où le panneau est le plus muet.
Mécanique commune : une file de clients qu'on achète, chacun avec son coût d'entrée et sa
durée de vie ; la trésorerie descend avant de remonter. Le payback devient un temps qu'on
regarde passer, pas un ratio. `audience` montre le levier propre à Colombes : une audience
possédée ne rend pas l'actif plus cher, elle rend l'acquisition moins chère — et cette
distinction est déjà écrite dans le panneau.

**Couche 4 — Profit.** `marge-brute` · `charges-fixes` · `sde`. Le grain `ce-qui-reste`
du socle en est la porte ; ces trois-là en sont le détail.

**Couche 5 — Valeur.** `courbe-du-marche` (pourquoi un petit SaaS se paie moins cher
qu'un gros, à qualité égale) · `les-neuf-lignes` · `fourchette` (pourquoi on donne une
plage et non un prix) · `dependance-fondateur` (le grain le plus dérangeant : plus tu es
indispensable, moins ça vaut).

**Pièges.** Trois pièges méritent leur grain, parce qu'ils produisent des chiffres faux
chez qui ne les connaît pas : `ltd-hors-mrr` (les ventes à vie font du cash et ne valent
rien au multiple), `annuel-vs-churn` (payer douze mois d'avance ne fait pas rester, ça
décale la décision), `baleines-hors-cadran` (voir Décisions ouvertes).

## Ce qui enseigne déjà — inventaire

À relier avant d'écrire quoi que ce soit de neuf. La moitié du travail est faite.

| Brique | Fichier | Ce qu'elle enseigne | Où elle apparaît |
|---|---|---|---|
| Le pad | `PricePad.tsx` | prix × clients, les deux axes | Accueil |
| Paliers de Janz | `pricePad.ts` | le prix détermine le métier | Ronde, badges |
| Repères | `landmarks.ts` | des marques connues sur l'échelle | Bas d'accueil |
| Volière | `aviary.ts` | 6 archétypes avec leur leçon | Accueil, profils |
| Glossaire | `glossary.ts` | 10 définitions + seuils | **Tuiles KPI seulement** |
| Lecture en direct | `diagnose.ts` | pourquoi ça coince, ici, maintenant | Carte de valo |
| Hypothèses cachées | `assumptions.ts` | ce que le mode Simple suppose | Accueil, panneau |
| Les 9 lignes | `valuation.ts` | ce qui fait bouger le multiple | Profils |

**Le trou est net** : le glossaire ne sort que sur les résultats. Les **entrées** — CAC,
churn, expansion, audience, part annuelle, LTD, dépendance au fondateur — n'ont que sept
`hint` épars. On demande donc de régler ce qu'on n'explique pas.

## L'interconnexion : trois portes

### La porte froide — le point d'interrogation

Un composant unique, `<Learn grain="cac" />` : une pastille discrète de 24 px, posée
contre un libellé. Elle ouvre le grain. Elle se pose partout où un mot du métier
apparaît : libellés du panneau, tuiles KPI, légende du pad, lignes du multiple.

Règle : **une seule pastille par notion et par écran**. Un panneau constellé de points
d'interrogation dit « c'est compliqué », ce qui est l'inverse du but.

### La porte chaude — le diagnostic

La plus précieuse, et presque gratuite : `diagnose()` sait **déjà** quand ça coince et
pourquoi. Chaque `Insight` reçoit un champ optionnel `grain`. « Churn optimiste pour un
ARPU de 15 € » devient cliquable et mène au grain `churn-de-ta-zone`.

C'est l'enseignement au moment du besoin : on n'apprend pas le churn parce qu'on a décidé
d'apprendre le churn, mais parce que l'app vient de dire que le nôtre est douteux.

### La porte de retour

Un grain ouvert depuis le simulateur affiche « revenir à ma simulation ». Les réglages
sont déjà persistés par le store : le retour est exact, sans sauvegarde explicite.

Et l'inverse, plus ambitieux : un grain peut proposer « essayer ça sur mes chiffres » —
il charge le réglage démontré dans le simulateur de l'utilisateur.

## Placement et route

**Les modules ne vivent qu'à un seul endroit : l'accueil, sous le simulateur d'accueil.**
Pas de page « Apprendre », pas de menu, pas de parcours à terminer. On tombe dessus en
descendant, ou on y est envoyé par un lien.

Ordre de l'accueil, de haut en bas :

```
en-tête
titre
simulateur d'accueil          ← le module zéro, celui qu'on ne présente pas
── LES MODULES ──             ← la bible, ici et nulle part ailleurs
vos simulations
la volière
les repères
```

**Adresse d'un grain** : `#/apprendre/<id>`. La route rend **l'accueil**, déroulé jusqu'au
module visé et ouvert. Elle ne crée pas de page : elle vise un endroit de l'accueil. Un
grain est donc partageable, et le lien depuis le simulateur est un lien ordinaire.

## Le design des modules

Un grain n'est pas une carte avec un graphique dedans. **C'est une scène.** Le pad n'est
pas une carte : c'est une plaque qu'on touche, et c'est pour ça qu'il enseigne. Les
modules se tiennent à ce niveau-là ou ils ne se font pas.

### Le vocabulaire existant, qu'on ne renégocie pas

Ce langage est déjà écrit dans `index.css`. Un module s'y conforme sans discuter.

| Élément | Ce qui est acté |
|---|---|
| **Accent** | `--lume`, citron-chartreuse, **le seul**. Pas de seconde couleur d'accent. |
| **Sémantique** | Rouge, ambre, émeraude viennent de `diagnose` (`bad`/`warn`/`good`) et de nulle part ailleurs. |
| **Titres** | Chakra Petch, capitales, interlettrage large. |
| **Chiffres** | Mono, `tabular-nums`. Les chiffres héros en `.metal-number`. |
| **Surfaces** | `.card-surface` verre sur métal · `.pad-surface` plaque nue · `.glass-bevel` · `.lume-pill`. |
| **Ambiance** | Halos radiaux et grain photographique sur `body`. Un module ne pose **jamais** son propre fond coloré : il flotte dans cette ambiance. |
| **Rayon** | `--radius`, 0.75rem clair / 0.625rem sombre. |

**La règle du lume.** Le citron ne décore pas. Il signifie exactement deux choses : *ceci
est vivant / ceci répond à ton geste*, et *ceci est toi*. Un module qui teinte en lume
un élément inerte casse la convention de toute l'application.

### La grammaire du mouvement

Elle est déjà signée, il suffit de la reprendre :

- **La courbe** : `cubic-bezier(0.22, 1, 0.36, 1)`. Départ franc, arrivée longuement
  amortie. Tout glisse et se pose, rien ne rebondit, rien ne saute.
- **Les durées** : réponse au geste 0 ms (le pad ne lisse pas pendant qu'on traîne) ·
  conséquence 150–200 ms · déplacement narratif 700–900 ms · respiration en boucle 2,4 s.
- **L'entrée** : `.reveal` avec `--reveal-order`, décalage de 90 ms. Les éléments d'un
  module arrivent en cascade, jamais tous ensemble.
- **L'invite** : `.orb-invite`, l'anneau qui respire tant qu'on n'a pas touché, puis
  s'éteint **définitivement** au premier contact. C'est l'idiome « ceci se manipule » de
  la maison. Tout grain doit le porter, sur ce qu'il faut saisir.
- **`prefers-reduced-motion`** : traité dans chaque animation, comme les trois existantes.
  Non négociable, ce n'est pas une finition.

### La règle des couches, héritée du banc d'essai

Le banc d'essai du pad a servi à ça : éteindre les couches une à une et regarder ce qui
manque. On en a tiré « Paliers ». **Toute couche graphique d'un module doit porter une
information.** Si on l'éteint et que rien ne se perd, elle dégage. C'est la discipline
qui a fait un pad épuré ; elle vaut pour les grains.

### Où l'on a le droit d'inventer

L'innovation est attendue, mais bornée : **une nouveauté signature par grain, au plus**,
et elle doit servir l'idée enseignée — pas l'effet. Le reste du module se fait avec le
vocabulaire existant. C'est ce qui garantit que quatre modules forment une famille et non
quatre démos.

### Les quatre scènes du socle

**`prix-clients` — la trace.** Le pad, mais la position de départ reste en fantôme et le
trajet s'inscrit en traînée de lume qui s'estompe. Deux compteurs d'effort en regard :
doubler le prix, doubler les clients. On voit sa propre trajectoire, et que les deux
chemins mènent à la même surface allumée. *Nouveauté : la traînée persistante* — le pad
vit dans l'instant, ce grain donne une mémoire au geste.

**`palier` — l'échelle habitée.** Les bandes de paliers du pad redressées en échelle
pleine hauteur. Les repères (`landmarks.ts`) sont des pastilles lettrées qui **volent se
poser** sur leur barreau à l'entrée du module, en cascade de 90 ms. Ta colombe occupe le
sien. On pousse le prix, elle grimpe, les repères ne bougent pas : on voit à côté de qui
on se tient. Spotify sur le barreau des souris fait tout le travail. *Nouveauté : la
migration des repères à l'entrée.*

**`ce-qui-reste` — la cascade.** Une colonne de lume qui descend et se fait pincer à
chaque étage : coûts directs, acquisition, charges fixes. Chaque pince se traîne. En bas,
un bassin se remplit de ce qui reste. Sous zéro, le bassin vire au rouge, se vide, et le
chiffre de valorisation au-dessus s'effondre dans le même mouvement. *Nouveauté : le
bassin, seul endroit de l'app à métaphore de volume* — justifié : le grain parle de ce
qui **reste**, pas d'une position.

**`multiple` — la construction.** La courbe du barème tracée en tirets fins, exactement
l'idiome des iso-revenus du pad. Un point y glisse quand le MRR change. Puis les neuf
lignes de `valuation.ts` s'empilent horizontalement, gauche à droite, chacune poussant le
multiple : lume si elle ajoute, rouge si elle retire, longueur proportionnelle à son
`deltaMultiple`. *Nouveauté : l'empilement qui s'assemble à l'entrée* — on voit un
multiple se **construire**, ce qui est précisément la leçon.

### Le format de l'enveloppe

Carte `.card-surface`, comme les profils de la volière — mais **scindée** comme
`.card-band` : la question en bandeau sourd, la scène sur socle plus clair. La question
en Chakra Petch capitales, la scène plein cadre sans marge intérieure inutile, le déclic
en une ligne dessous — jamais un paragraphe.

Sur mobile, la scène passe avant le texte, comme le module d'accueil : on manipule
d'abord.

## Architecture technique

Le principe du dépôt vaut ici : **la donnée dans `lib/` et testée, le rendu dans
`components/`.**

- `src/lib/learn.ts` — le catalogue : `LEARN_GRAINS: Record<GrainId, Grain>`. Textes en
  anglais comme partout, traduits par `fr.ts`.
- **Tests** (`learn.test.ts`) : tout `needs` pointe vers un grain existant ; le graphe est
  acyclique ; toute `GlossaryKey` référencée existe ; tout grain est atteignable par au
  moins une ancre — un grain sans porte est un grain mort.
- `src/components/learn/Learn.tsx` — la pastille.
- `src/components/learn/GrainCard.tsx` — l'enveloppe : question, scène, déclic.
- `src/components/learn/mechanics/` — une scène par grain. Chacune consomme `compute()`,
  jamais de chiffres en dur.
- `index.css` — au plus **une** classe de surface nouvelle, `.grain-stage`, dans la
  famille de `.pad-surface`. Les scènes se font autrement avec l'existant : au-delà, le
  langage se dilue.
- **Pas de bibliothèque d'animation.** Transitions CSS et `@keyframes`, comme
  `.orb-invite` et `.reveal`. Le bundle est déjà à 843 ko.
- `router.ts` — `#/apprendre/<id>` → `{ view: 'home', grain: id }`.
- **Aucune dépendance nouvelle.** Le budget est déjà tendu : 843 ko de bundle principal.
  Les mécaniques se chargent en `lazy()`, comme `AnimalStage3D`.

**Mobile d'abord**, comme le reste : une mécanique qui exige un survol ou un glissement
fin est refusée par construction. Cibles de 44 px, alternative sans glissement — les
règles posées pour le pad valent pour tous les grains.

## Ce qu'on ne fait pas

Pas de comptes, pas de progression sauvegardée, pas de badges, pas de score, pas de
quiz, pas de vidéo, pas de parcours linéaire à terminer, pas de page dédiée. Le jeu est
dans la manipulation, pas dans la récompense — un badge apprendrait à collectionner des
badges.

## Décisions ouvertes

1. **Les baleines.** Le simulateur plafonne à 500 €/mois par plan (`TIER_BOUNDS.price.max`)
   alors que le palier commence à 2 634 € : il est inatteignable, sur le pad comme dans le
   panneau expert. La mention « hors du simulateur » est livrée, la borne reste. Deux
   voies : l'assumer et en faire un grain (**recommandé** — la borne enseigne quelque
   chose de vrai sur le périmètre de l'outil et sur le métier du grand compte), ou relever
   la borne à ~5 000 € et sortir de la plage où le barème est calibré.
2. **Combien de grains sur l'accueil ?** Quatre modules déroulés font une page longue.
   Repliés par défaut, ils font une bande. Réponse suggérée : le premier ouvert, les
   trois autres repliés.
3. **Ordre de construction.** Suggestion : `ce-qui-reste` d'abord — c'est l'idée fausse la
   plus coûteuse et la mécanique la plus démonstrative — puis la porte chaude via
   `diagnose()`, qui rentabilise immédiatement le premier grain.
