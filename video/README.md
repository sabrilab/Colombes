# Les vidéos

Rendues par [Remotion](https://remotion.dev) depuis le design system de l'app :
les compositions importent directement `../src`, donc les chiffres affichés
sortent de `compute()`, le moteur de production, et les animaux sont les vrais
modèles 3D. Ce que le spectateur voit est reproductible dans le simulateur.

## Rendre

```bash
pnpm video:audio           # le son : bruitage, sous-titres calés, mixage
pnpm video:render:70       # → public/film/colombes-70s.mp4  (1 min 10, anglais)
pnpm video:render          # → public/film/colombes-40s.mp4  (40 s, français)
pnpm video:studio          # l'aperçu interactif, pour régler le montage
```

`video:audio` est à relancer dès qu'on touche au montage : il replace le
bruitage sur les nouvelles coupes.

## Le montage

`cut.mjs` porte les durées de plan et le bruit de chaque coupe, et rien d'autre
ne les redit : `Colombes70.tsx` y associe un composant par identifiant,
`scripts/build-mix.mjs` y pose les effets sonores. Rallonger un plan déplace donc
son bruit avec lui. Le fichier refuse de se charger si le total ne fait pas
exactement 2 100 images — un montage qui ne tombe pas juste laisse du noir ou
coupe la chute.

## Le son

Une seule piste, `public/film/mix-70s.mp3`, construite avant le rendu par
`scripts/build-mix.mjs` depuis `video/audio/` :

- la voix off est compressée puis calée à −17 dBFS. La synthèse la rend à −25,
  ce que personne n'entend sur un téléphone ;
- la musique s'écarte de 9 dB quand la voix parle et remonte dans les silences ;
- le bruitage, synthétisé par `scripts/build-sfx.mjs`, tombe quatre images avant
  chaque coupe — un souffle qui commence à l'image exacte arrive en retard à
  l'oreille.

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

**Le décodeur meshopt.** Les modèles de `public/models` sont compressés en
meshopt. Sans `loader.setMeshoptDecoder(MeshoptDecoder)`, le chargement échoue par
le rappel d'erreur — donc sans rien interrompre — et l'animal n'apparaît jamais.

## Le navigateur

Dans un environnement sans Chrome installable, désigner un binaire existant :

```bash
pnpm video:render:70 --browser-executable=/chemin/vers/headless_shell
```

Il faut le **headless shell**, pas Chrome complet : les versions récentes de
Chrome ont retiré l'ancien mode sans interface dont Remotion se sert.

## La police

`assets/fonts.css` embarque Chakra Petch en base64, latin seulement. Le rendu ne
doit dépendre d'aucun réseau — une police qui arrive en retard donne des images
composées avec la police de repli, et on ne s'en aperçoit qu'à la fin.

## Licence

Remotion est gratuit pour un individu ou une société jusqu'à trois salariés, et
demande une licence entreprise au-delà. Voir `LICENSE.md` du paquet.
