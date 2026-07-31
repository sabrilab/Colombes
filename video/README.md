# Les vidéos

Rendues par [Remotion](https://remotion.dev) depuis le design system de l'app :
les compositions importent directement `../src`, donc les chiffres affichés
sortent de `compute()`, le moteur de production, et les animaux sont les vrais
modèles 3D. Ce que le spectateur voit est reproductible dans le simulateur.

## Rendre

```bash
pnpm video:audio               # le son de tous les films : bruitage, sous-titres, mixages
pnpm video:shoot             # photographie les vraies vues de l'app (film 16/9)
pnpm video:render:product    # → colombes-product.mp4  (1 min, 16/9, le produit)
pnpm video:render:heuristics # → colombes-heuristics.mp4 (1 min 10, les six règles)
pnpm video:render:levers     # → colombes-levers.mp4   (1 min 10, les deux leviers)
pnpm video:render:built      # → colombes-built.mp4    (1 min 10, la version rapide)
pnpm video:render:70         # → colombes-70s.mp4      (1 min 10, anglais, voix off)
pnpm video:render:ladder     # → colombes-ladder.mp4   (35 s, l'échelle des prix)
pnpm video:render:remains    # → colombes-remains.mp4  (35 s, ce qui reste)
pnpm video:render            # → colombes-40s.mp4      (40 s, français, la première)
pnpm video:studio            # l'aperçu interactif, pour régler un montage
```

`video:audio` est à relancer dès qu'on touche à un montage : il replace le
bruitage sur les nouvelles coupes.

## Sept films, une langue

`kit.tsx` porte le vocabulaire commun — pigments, titres qui s'écrivent lettre à
lettre, pad de tarification, molette de coffre, barres de réglage, entrées
lancées, traits de vitesse, emojis, chute. `tokens.ts` les jetons, `data.ts` les
chiffres des repères, `three.ts` les matières et la projection, `Scene3D.tsx` le
rendu des volumes. Sans ce partage, chaque film redéfinirait une molette
légèrement différente et les sept cesseraient d'avoir l'air du même produit —
le contraire de ce qu'ils démontrent.

Le dernier, `Heuristics70.tsx`, s'écarte des autres sur un point de fond : il
n'explique pas une mécanique, il s'adresse à quelqu'un. Le sujet de chaque
réplique est le spectateur, le premier mot lisible du film est « you », et les six
règles qu'il donne ne sont pas écrites pour le film — ce sont les seuils de
`HEALTH_THRESHOLDS`, ceux que l'app applique déjà, libellés compris. Il s'interdit
par ailleurs toute arête vive : relief, anneaux, cylindres, billes. La seule
grille rectangulaire est celle du tableur, c'est-à-dire ce que le film désigne
comme l'adversaire, et elle se dissout à l'image.

## Le film qui montre le produit

`Product60.tsx` est le seul en 16/9, et le seul dont l'image n'est pas dessinée :
ce sont des captures de l'app construite, prises par `scripts/shoot-ui.mjs`, avec
ses vrais modèles en volume et les chiffres que le moteur venait de calculer.
Redessiner l'interface aurait été plus commode et aurait produit un film qui
vieillit sans prévenir — le jour où un bouton change, la publicité ment.

Les captures ne sont pas posées à plat : elles vivent sur des plaques dans un
espace en perspective CSS que la caméra traverse. De la perspective et non de la
3D, pour une raison de netteté — une capture collée en texture sur un plan
devient molle dès qu'elle s'incline, alors qu'un `transform` la garde au pixel.

Un plan y fait monter les prix pendant que la valorisation suit. Ce sont **deux
états réels** de l'app, photographiés l'un après l'autre par un lien de partage
`#s=…` qui porte les réglages — pas un chiffre animé par-dessus une image fixe.
Le fondu entre les deux dure huit images : à vingt-quatre, le milieu superposait
deux montants et se lisait comme un défaut de rendu.

Trois pièges de la capture, tous vérifiés :

- **le serveur et le navigateur dans le même processus.** `execFileSync` fige la
  boucle d'événements, donc le serveur statique ne répond plus pendant que
  Chromium charge la page : la capture n'arrive jamais et rien ne le dit. Il faut
  `spawn` et attendre la promesse ;
- **le profil de Chromium.** Deux lancements qui se suivent se disputent le
  profil par défaut ; le second attend indéfiniment. Un `--user-data-dir` par vue
  règle la question ;
- **les sorties.** Chromium écrit beaucoup sur la sortie d'erreur ; un tube que
  personne ne vide se remplit et bloque le navigateur en écriture.

## Le montage

Un fichier par film dans `cuts/`. Il porte les durées de plan, le bruit de chaque
coupe et les rampes crantées, et rien d'autre ne les redit : la composition y
associe un composant par identifiant, `scripts/build-mix.mjs` y pose les sons.
Rallonger un plan déplace donc son bruit avec lui.

`timeline()` refuse de construire si le total ne tombe pas juste — un montage
faux laisse du noir en fin de film ou coupe la chute, et rien dans le rendu ne le
signale. `Film` refuse de son côté un plan sans composant.

Ces fichiers sont chargés par Node pour construire le son : ils restent donc du
JavaScript pur, sans import de `src/`. Quand un compte doit suivre une donnée de
l'app — cinq paliers, neuf lignes — c'est la composition qui vérifie la
concordance.

## Les sons qui s'enchaînent

`motion.mjs` décrit une rampe crantée une fois pour les deux côtés :
`stepsPassed` dit à l'image combien de crans sont franchis, `stepFrames` dit au
mixage à quelles images ils tombent. Les deux dérivent de la même formule, donc
un clic ne peut pas rater son cran. C'est ce qui permet dix-huit clics de molette
qui ralentissent avec elle, ou vingt-quatre grésillements sous une barre qui
monte.

Poser ces sons à la main marche pour trois crans et se décale dès qu'on change
l'accélération — et l'erreur ne s'entend qu'après le rendu.

## Déposer une voix off

Trois films en attendent une — la version rapide (`voice-built.wav`), les six
règles (`voice-heuristics.wav`) et la présentation du produit
(`voice-product.wav`). Le fichier va dans `video/audio/`, puis

```bash
pnpm video:audio && pnpm video:render:built
```

`build-mix.mjs` et `align-captions.mjs` sautent proprement une voix absente et le
disent — ils ne bloquent pas les autres films. Tant qu'elle manque, la musique du
film concerné passe à son niveau de repli, huit décibels plus haut : réglée pour
tenir sous une voix, elle sortirait sinon trop bas et le film paraîtrait cassé
alors qu'il ne manque qu'un fichier.

Tant que le fichier manque, `align-captions.mjs` estime le calage à partir de la
durée annoncée par la synthèse : le film est donc livré sous-titré sans attendre
l'onde. L'estimation vaut ce qu'elle vaut — six dixièmes d'écart en moyenne,
mesurés sur le film des leviers, mais une seconde sept sur le pire plan. Assez
pour des sous-titres, pas pour un montage.

Quand le fichier arrive, le script imprime aussi **les durées de plan à recopier
dans le montage**, calculées sur l'onde. Les films qui déclarent des `anchors` —
quel plan commence sur quelle réplique — en profitent automatiquement ; il n'y a
qu'à coller la liste dans le fichier de `cuts/` et relancer le rendu.

## Le son

Une piste par film, `public/film/mix-*.mp3`, construite avant le rendu par
`scripts/build-mix.mjs` depuis `video/audio/` :

- la voix off, quand il y en a une, est compressée puis calée à −17 dBFS. La
  synthèse la rend à −25, ce que personne n'entend sur un téléphone ;
- la musique s'écarte de 9 dB quand la voix parle et remonte dans les silences.
  Les films sans voix la montent de huit décibels, et chacun entre à un endroit
  différent de la piste — sinon les trois ouvriraient sur les mêmes mesures ;
- le bruitage, synthétisé par `scripts/build-sfx.mjs`, tombe quatre images avant
  chaque coupe — un souffle qui commence à l'image exacte arrive en retard à
  l'oreille. Les crans, eux, tombent pile : ils accompagnent un mouvement visible ;
- les trois films sortent au même niveau, sinon on touche au volume entre deux
  vidéos.

Remotion sait empiler plusieurs `<Audio>`, mais pas les faire s'écouter entre
elles : la musique passerait au même volume sous la voix que dans les silences,
et il faudrait rendre le film pour l'entendre. Ici le mixage est un fichier, donc
mesurable en quelques secondes.

## Les sous-titres

`scripts/align-captions.mjs` mesure l'onde de la voix : il découpe la parole en
salves, répartit le texte au prorata des caractères prononcés sur le temps de
parole effectif, puis recale chaque début sur la salve la plus proche. Une ligne
ne peut donc pas tomber dans un blanc. Il écrit `video/captions.json`, lu par le
montage pour l'incrustation, et `public/film/colombes-70s.en.srt` pour les
plateformes.

La version datée à la main qui l'a précédé oubliait deux phrases et dérivait de
plus d'une seconde : ne pas y revenir.

## La caméra qui se déplace

`Scene3D` accepte une caméra décrite comme une fonction du temps du plan, et non
comme une pose figée. C'est ce qui permet les traversées de `Built70.tsx` — un
couloir d'anneaux, un nuage de tuiles, une allée d'animaux.

La pose reste déduite du numéro d'image, condition non négociable : Remotion
capture dans le désordre et parfois deux fois la même image, dans deux onglets
différents. Une caméra animée par une horloge donnerait deux cadrages pour la
même image.

Un piège de cadrage s'y ajoute, vérifié à l'image : en format vertical, la
demi-largeur visible ne fait qu'un tiers de la distance. Un objet placé à
cinquante centimètres de l'axe sort du cadre dès un mètre cinquante — c'est-à-dire
au moment précis où la caméra arrive sur lui. Les animaux de l'allée sont donc à
trente centimètres, et la course s'arrête avant le dernier.

## Les schémas en volume

Deux plans du film de l'échelle et deux de celui de la cascade sont de la vraie
géométrie, parce que la démonstration EST géométrique : un escalier dont la
marche monte en prix et se resserre en clientèle, deux blocs de même contenance
aux proportions opposées, une colonne dont on retire des tranches, neuf barres en
relief. À plat, il faudrait les expliquer.

Les étiquettes restent du HTML, positionnées par `project()` — la même
description de caméra que la scène. Collées sur une texture, elles tourneraient
avec le volume et deviendraient floues ; là elles restent nettes et de face.

Les proportions sont vérifiées à la construction : les deux blocs doivent
contenir la même chose, et les tranches de la colonne retomber sur le revenu. Un
schéma dont les parts ne s'additionnent pas est un mensonge, même joli.

## Trois pièges vérifiés

**Le dossier public.** Les scripts passent `--public-dir=public`. Remotion le
déduit sinon du dossier du point d'entrée — `video/public`, qui n'existe pas — et
tout `staticFile()` répond 404 *dans la page* sans faire échouer le rendu.
`Config.setPublicDir()` ne suffit pas, testé. Le symptôme trompe : les pistes
audio continuent de marcher, puisqu'elles sont mixées côté serveur depuis le
disque, mais un modèle 3D revient vide et le plan sort noir.

**La toile WebGL.** `AnimalShot` rend dans une toile gardée hors du document,
avec `preserveDrawingBuffer`, puis la recopie sur une toile 2D visible. Une toile
WebGL posée dans le document revient vide de la capture : le compositeur a déjà
rendu sa mémoire.

**Les emojis.** `Emoji` nomme explicitement Noto Color Emoji dans sa pile de
polices. Le rendu se fait dans un Chromium sans interface, où la police par défaut
ne couvre pas ces glyphes : sans ça, un plan entier de rectangles vides, découvert
au montage final.

**Le décodeur meshopt.** Les modèles de `public/models` sont compressés en
meshopt. Sans `loader.setMeshoptDecoder(MeshoptDecoder)`, le chargement échoue par
le rappel d'erreur — donc sans rien interrompre — et l'animal n'apparaît jamais.

## Les marques

Les logos à l'image viennent de `public/logos`, en CC0, et l'usage est nominatif :
on situe des entreprises connues sur une échelle de prix pour expliquer l'échelle.
Deux repères de l'app n'ont volontairement pas de fichier — leurs marques ont
demandé le retrait de Simple Icons — et ils n'apparaissent donc pas dans les films.

Aucune marque n'est redessinée de mémoire, y compris celle de Claude : le nom est
composé en typographie. Redessiner un logo de tête produit un faux qui prétend à
l'officiel ; le nom dit la même chose et n'invente rien. Voir
`public/logos/README.md`.

## Le navigateur

Dans un environnement sans Chrome installable, désigner un binaire existant :

```bash
REMOTION_BROWSER=/chemin/vers/headless_shell pnpm video:render:70
```

`remotion.config.ts` lit cette variable ; les scripts de `package.json` restent
donc valables sur une machine ordinaire, où Remotion télécharge son propre
Chromium. Là où la sortie réseau est filtrée, ce téléchargement répond 403 et plus
rien ne se rend — alors qu'un binaire utilisable est souvent déjà installé.

Il faut le **headless shell**, pas Chrome complet : les versions récentes de
Chrome ont retiré l'ancien mode sans interface dont Remotion se sert.

## La police

`assets/fonts.css` embarque Chakra Petch en base64, latin seulement. Le rendu ne
doit dépendre d'aucun réseau — une police qui arrive en retard donne des images
composées avec la police de repli, et on ne s'en aperçoit qu'à la fin.

## Licence

Remotion est gratuit pour un individu ou une société jusqu'à trois salariés, et
demande une licence entreprise au-delà. Voir `LICENSE.md` du paquet.
