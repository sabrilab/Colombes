# Les vidéos

Rendues par [Remotion](https://remotion.dev) depuis le design system de l'app :
les compositions importent directement `../src`, donc les chiffres affichés
sortent de `compute()`, le moteur de production. Ce que le spectateur voit est
reproductible dans le simulateur.

## Rendre

```bash
pnpm video:render          # → public/film/colombes-40s.mp4  (40 s, français)
pnpm video:render:70       # → public/film/colombes-70s.mp4  (1 min 10, anglais)
pnpm video:studio          # l'aperçu interactif, pour régler le montage
```

## La voix off

La composition de 70 s accepte une voix off, désactivée par défaut. Déposer le
fichier dans `public/voice-en.wav`, puis :

```bash
pnpm video:render:70 --props '{"voiceOver":true}'
```

Le récit dure 64,5 s pour une image de 70 s : la voix se tait pendant la chute,
ce qui est voulu. Les incrustations de sous-titres sont calées sur ce texte, et
`public/film/colombes-70s.en.srt` en donne la version complète pour les
plateformes — elle couvre aussi les plans où la phrase est déjà à l'écran en
très grand, que l'incrustation saute pour ne pas doubler l'information.

Dans un environnement sans Chrome installable, désigner un binaire existant :

```bash
REMOTION_BROWSER_EXECUTABLE=/chemin/vers/headless_shell pnpm video:render
```

Il faut le **headless shell**, pas Chrome complet : les versions récentes de
Chrome ont retiré l'ancien mode sans interface dont Remotion se sert.

## La police

`assets/fonts.css` embarque Chakra Petch en base64, latin seulement. Le rendu
ne doit dépendre d'aucun réseau — une police qui arrive en retard donne des
images composées avec la police de repli, et on ne s'en aperçoit qu'à la fin.

## Licence

Remotion est gratuit pour un individu ou une société jusqu'à trois salariés,
et demande une licence entreprise au-delà. Voir `LICENSE.md` du paquet.
