import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, Code2, Undo2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { DoveLogo } from '@/components/DoveLogo'
import { TierBadge } from '@/components/AnimalGlyph'
import { EggGlyph } from '@/components/nest/EggGlyph'
import { NestGraph } from '@/components/nest/NestGraph'
import { useAnnounceAccounts } from '@/components/SectionShell'
import { formatCompactCurrency, formatCurrency } from '@/lib/format'
import { fetchRepoSignals, parseRepo, repoUrl, type RepoSignals } from '@/lib/github'
import { buildNest, nestCensus, orderNest, NEST_ORDERS, type NestOrder, type NestIdea } from '@/lib/nestView'
import { navigate } from '@/lib/router'
import { useSimulator, useT } from '@/store/simulator'

/**
 * Le nid.
 *
 * Une idée arrive ici comme un œuf, et l'écran ne fait qu'une promesse : dire ce
 * qui manque pour qu'elle éclose. Pas une note sur dix — cinq postes nommés,
 * dont le dernier est le seul qui compte vraiment, quelqu'un qui paie.
 *
 * Deux partis pris de mise en scène :
 *
 *  — **la constellation d'abord, la fiche ensuite.** On voit le nid entier avant
 *    de voir une idée, parce que la question qu'on se pose en arrivant porte sur
 *    l'ensemble — laquelle je reprends ? — et pas sur une ligne de liste ;
 *  — **rien ne disparaît.** Une idée abandonnée reste dans le graphe, grise. La
 *    supprimer donnerait un nid propre et une mémoire fausse.
 */

/**
 * Les signaux publics des dépôts liés, tous en un.
 *
 * Un appel par idée, en parallèle, sans clé : GitHub plafonne à soixante par
 * heure et par adresse, ce qui laisse largement la place pour douze idées. Tout
 * échec — dépôt privé, quota, réseau — se traduit par une absence, jamais par un
 * chiffre inventé.
 */
function useRepoSignals(slugs: readonly string[]): Map<string, RepoSignals | null> {
  const [signals, setSignals] = useState<Map<string, RepoSignals | null>>(new Map())
  // La liste des dépôts change d'identité à chaque rendu ; sa forme sérialisée,
  // non — c'est elle qui décide s'il faut rappeler GitHub.
  const key = slugs.join(',')

  useEffect(() => {
    const wanted = key ? key.split(',') : []
    if (wanted.length === 0) return

    const controller = new AbortController()
    void Promise.all(
      wanted.map(async (slug) => [slug, await fetchRepoSignals(slug, controller.signal)] as const),
    ).then((pairs) => {
      if (!controller.signal.aborted) setSignals(new Map(pairs))
    })
    return () => controller.abort()
  }, [key])

  return signals
}

export function NestView() {
  const savedSims = useSimulator((state) => state.savedSims)
  const goal = useSimulator((state) => state.goal)
  const [order, setOrder] = useState<NestOrder>('ready')
  const [selected, setSelected] = useState<string | null>(null)
  const announceAccounts = useAnnounceAccounts()
  const t = useT()

  const slugs = useMemo(
    () => [...new Set(savedSims.map((sim) => sim.repo).filter((slug): slug is string => Boolean(slug)))],
    [savedSims],
  )
  const signals = useRepoSignals(slugs)

  const ideas = useMemo(
    () => orderNest(buildNest(savedSims, goal, signals), order),
    [savedSims, goal, signals, order],
  )
  const census = nestCensus(ideas)
  const open = ideas.find((idea) => idea.sim.id === selected) ?? null

  /*
   * Sur un téléphone, la fiche s'ouvre sous le graphe — donc hors de l'écran.
   * Toucher un œuf et ne rien voir bouger passe pour une panne. On l'amène
   * jusqu'à l'œil ; sur grand écran elle est déjà visible et `nearest` ne fait
   * alors rien du tout.
   */
  const sheetRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!selected) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    sheetRef.current?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'nearest' })
  }, [selected])

  return (
    <>
      <header className="max-w-2xl">
        <h1
          className="font-display reveal text-2xl font-bold uppercase tracking-tight sm:text-3xl"
          style={{ '--reveal-order': 0 } as React.CSSProperties}
        >
          {t('The nest')}
        </h1>
        <p
          className="reveal mt-3 text-sm leading-relaxed text-muted-foreground"
          style={{ '--reveal-order': 1 } as React.CSSProperties}
        >
          {t(
            'Every idea you save lands here as an egg. It fills as you learn what it is, what it costs, whether the code is alive — and it hatches the day someone pays for it. Then it becomes an animal and joins the aviary.',
          )}
        </p>
      </header>

      {savedSims.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border/70 px-6 py-14 text-center">
          <DoveLogo className="w-10 text-lume/40" />
          <p className="max-w-sm text-sm text-muted-foreground">
            {t('The nest is empty. Run a simulation, name it, and it will wait here as an egg.')}
          </p>
          <Button className="lume-pill px-5" onClick={() => navigate('#/simulateur')}>
            {t('Open the simulator')}
          </Button>
          <button
            type="button"
            onClick={announceAccounts}
            className="min-h-9 text-xs text-muted-foreground underline-offset-4 hover:underline"
          >
            {t('Where are my ideas stored?')}
          </button>
        </div>
      ) : (
        <>
          <div className="mt-6 flex flex-wrap items-center gap-2">
            {NEST_ORDERS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setOrder(option.id)}
                aria-pressed={order === option.id}
                title={t(option.note)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  order === option.id
                    ? 'bg-lume text-[oklch(0.2_0.03_112)]'
                    : 'glass-bevel text-muted-foreground hover:text-foreground'
                }`}
              >
                {t(option.label)}
              </button>
            ))}
            {/* Deux comptes, deux libellés : « 1 œufs » se voit, et une app qui
                écrit mal les nombres qu'elle affiche perd le peu de crédit
                qu'elle a sur ceux qu'elle calcule. */}
            <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
              {t(census.egg === 1 ? '{count} egg' : '{count} eggs', { count: census.egg })} ·{' '}
              {t(census.hatched === 1 ? '{count} hatched idea' : '{count} hatched ideas', {
                count: census.hatched,
              })}
            </span>
          </div>

          <div className="mt-4 flex flex-col gap-4 lg:flex-row">
            <NestGraph ideas={ideas} selected={selected} onSelect={setSelected} />
            <div ref={sheetRef} className="lg:w-[22rem] lg:shrink-0">
              {open ? (
                <IdeaSheet idea={open} onClose={() => setSelected(null)} />
              ) : (
                <RankList ideas={ideas} onSelect={setSelected} />
              )}
            </div>
          </div>
        </>
      )}
    </>
  )
}

/**
 * Le classement, tant qu'aucune idée n'est ouverte.
 *
 * Le graphe montre les rapports entre les idées ; il ne montre pas un ordre. Une
 * constellation n'a pas de premier, et « par laquelle je commence » demande une
 * réponse numérotée.
 */
function RankList({
  ideas,
  onSelect,
}: {
  ideas: NestIdea[]
  onSelect: (id: string) => void
}) {
  const t = useT()

  return (
    <Card className="gap-0 p-0">
      <p className="border-b border-border/50 px-3 py-2 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
        {t('In order')}
      </p>
      <ul>
        {ideas.map((idea, index) => (
          <li key={idea.sim.id}>
            <button
              type="button"
              onClick={() => onSelect(idea.sim.id)}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-foreground/[0.03]"
            >
              <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                {String(index + 1).padStart(2, '0')}
              </span>
              <EggGlyph
                status={idea.status}
                readiness={idea.readiness}
                animal={idea.animal}
                className={`size-5 shrink-0 ${
                  idea.status === 'abandoned' ? 'text-muted-foreground' : 'text-lume'
                }`}
              />
              <span className="min-w-0 flex-1 truncate text-sm">{idea.sim.name}</span>
              {/* Une abandonnée n'a pas de maturité à afficher : le pourcentage
                  d'un œuf qu'on ne couve plus ne veut plus rien dire. */}
              <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">
                {idea.status === 'abandoned'
                  ? t('given up')
                  : idea.status === 'hatched'
                    ? formatCompactCurrency(idea.proven) + t('/mo')
                    : `${Math.round(idea.readiness * 100)}%`}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </Card>
  )
}

/** Une case du relevé. `measured` porte un point plein : elle vient d'un fait. */
function CheckRow({ check }: { check: NestIdea['checks'][number] }) {
  const t = useT()

  return (
    <li className="flex items-start gap-2 py-1.5">
      <span
        className={`mt-0.5 inline-flex size-4 shrink-0 items-center justify-center rounded-full border ${
          check.done ? 'border-lume/70 bg-lume/15 text-lume' : 'border-border text-transparent'
        }`}
        aria-hidden
      >
        <Check className="size-2.5" />
      </span>
      <span className="min-w-0">
        <span className={`text-xs ${check.done ? 'text-foreground' : 'text-muted-foreground'}`}>
          {t(check.label)}
        </span>
        <span className="ml-1.5 text-[10px] uppercase tracking-[0.1em] text-muted-foreground/70">
          {t(check.kind === 'measured' ? 'measured' : 'declared')}
        </span>
        <span className="block text-[11px] leading-snug text-muted-foreground">{t(check.hint)}</span>
      </span>
    </li>
  )
}

/**
 * La fiche d'une idée : ce qui manque, ce qui rentre, ce qui s'est passé.
 *
 * Le champ des clients qui paient est le seul de l'app qui change un état plutôt
 * qu'un réglage — c'est lui qui fait éclore. Il est donc écrit en clair, sans
 * curseur : on ne fait pas glisser un fait.
 */
function IdeaSheet({ idea, onClose }: { idea: NestIdea; onClose: () => void }) {
  const { sim, results, status } = idea
  const openSimulation = useSimulator((state) => state.openSimulation)
  const describeSimulation = useSimulator((state) => state.describeSimulation)
  const setProvenCustomers = useSimulator((state) => state.setProvenCustomers)
  const abandonSimulation = useSimulator((state) => state.abandonSimulation)
  const reviveSimulation = useSimulator((state) => state.reviveSimulation)
  const [editing, setEditing] = useState<'note' | 'repo' | null>(null)
  const [draft, setDraft] = useState('')
  const [reason, setReason] = useState('')
  const [asking, setAsking] = useState(false)
  const language = useSimulator((state) => state.language)
  const t = useT()

  // La date suit la langue choisie dans l'app : un journal français daté à
  // l'américaine se lit de travers, et « 8/12 » ne veut pas dire la même chose
  // des deux côtés de l'Atlantique.
  const day = new Intl.DateTimeFormat(language === 'fr' ? 'fr-FR' : 'en-GB', {
    day: 'numeric',
    month: 'short',
  })

  function commit() {
    if (editing === 'note') describeSimulation(sim.id, { note: draft })
    if (editing === 'repo') describeSimulation(sim.id, { repo: parseRepo(draft) ?? '' })
    setEditing(null)
  }

  return (
    <Card className="gap-0 p-0">
      <div className="card-band flex items-start gap-3 border-b border-border/50 p-3">
        <EggGlyph
          status={status}
          readiness={idea.readiness}
          animal={idea.animal}
          className={`size-8 shrink-0 ${
            status === 'abandoned' ? 'text-muted-foreground' : 'text-lume'
          }`}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{sim.name}</p>
          <p className="text-[11px] text-muted-foreground">
            {status === 'hatched'
              ? t('Hatched · {count} paying', { count: sim.provenCustomers ?? 0 })
              : status === 'abandoned'
                ? t('Abandoned · {reason}', { reason: sim.abandonReason ?? t('no reason given') })
                : t('Egg · {done} of 5', {
                    done: idea.checks.filter((check) => check.done).length,
                  })}
          </p>
        </div>
        {idea.animal && <TierBadge animal={idea.animal} />}
        <button
          type="button"
          onClick={onClose}
          aria-label={t('Back to the nest')}
          className="shrink-0 rounded p-1 text-muted-foreground/60 hover:text-foreground"
        >
          <Undo2 className="size-4" aria-hidden />
        </button>
      </div>

      <div className="space-y-3 p-3">
        {editing ? (
          <Input
            autoFocus
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={commit}
            onKeyDown={(event) => {
              if (event.key === 'Enter') commit()
              if (event.key === 'Escape') setEditing(null)
            }}
            placeholder={t(editing === 'note' ? 'What is it? Who pays for it?' : 'github.com/owner/repo')}
            className="h-9 text-sm"
          />
        ) : (
          <button
            type="button"
            onClick={() => {
              setDraft(sim.note ?? '')
              setEditing('note')
            }}
            className="block w-full text-left text-xs leading-relaxed text-muted-foreground hover:text-foreground"
          >
            {sim.note || <span className="italic opacity-70">{t('Add what it is')}</span>}
          </button>
        )}

        {sim.repo && !editing ? (
          <p className="flex min-w-0 items-center gap-1 text-[11px] text-muted-foreground">
            <a
              href={repoUrl(sim.repo)}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex min-w-0 items-center gap-1 hover:text-foreground"
            >
              <Code2 className="size-3 shrink-0" aria-hidden />
              <span className="truncate">{sim.repo}</span>
            </a>
            {/* Silence plutôt qu'erreur : un dépôt privé et un quota dépassé se
                ressemblent vus du navigateur, et ni l'un ni l'autre n'est un
                problème que le lecteur puisse régler. */}
            <span className={`shrink-0 tabular-nums ${idea.repo ? '' : 'opacity-60'}`}>
              ·{' '}
              {!idea.repo
                ? t('public signals unavailable')
                : idea.repo.daysSincePush === 0
                  ? t('pushed today')
                  : t('pushed {days}d ago', { days: idea.repo.daysSincePush })}
            </span>
            <button
              type="button"
              onClick={() => describeSimulation(sim.id, { repo: '' })}
              className="ml-auto shrink-0 underline-offset-2 hover:text-foreground hover:underline"
            >
              {t('remove')}
            </button>
          </p>
        ) : (
          !editing && (
            <button
              type="button"
              onClick={() => {
                setDraft('')
                setEditing('repo')
              }}
              className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
            >
              <Code2 className="size-3" aria-hidden />
              {t('Link a repository')}
            </button>
          )
        )}

        <ul className="border-y border-border/40 py-1">
          {idea.checks.map((check) => (
            <CheckRow key={check.key} check={check} />
          ))}
        </ul>

        <label className="flex items-center justify-between gap-3 text-xs">
          <span className="min-w-0">
            <span className="block">{t('People who actually pay')}</span>
            <span className="block text-[11px] text-muted-foreground">
              {t('This is what hatches it.')}
            </span>
          </span>
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            value={sim.provenCustomers ?? 0}
            onChange={(event) => setProvenCustomers(sim.id, Number(event.target.value))}
            className="h-9 w-20 text-right font-mono tabular-nums"
          />
        </label>

        <dl className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <dt className="text-[11px] text-muted-foreground">{t('Coming in now')}</dt>
            <dd className="font-mono text-sm tabular-nums">
              {formatCurrency(idea.proven)}
              <span className="text-muted-foreground">{t('/mo')}</span>
            </dd>
          </div>
          <div>
            <dt className="text-[11px] text-muted-foreground">{t('If it holds')}</dt>
            <dd className="font-mono text-sm tabular-nums">
              {formatCompactCurrency(results.valuation.value)}
            </dd>
            <dd className="text-[11px] text-muted-foreground">
              {idea.goal.monthReached === null
                ? t('never reaches the goal')
                : t('goal in month {month}', { month: idea.goal.monthReached })}
            </dd>
          </div>
        </dl>

        {(sim.journal?.length ?? 0) > 0 && (
          <ol className="space-y-1 border-t border-border/40 pt-2">
            {sim.journal?.slice(0, 4).map((entry) => (
              <li key={entry.at} className="flex gap-2 text-[11px] text-muted-foreground">
                <span className="shrink-0 font-mono tabular-nums opacity-70">
                  {day.format(entry.at)}
                </span>
                <span className="min-w-0">{entry.text}</span>
              </li>
            ))}
          </ol>
        )}

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Button
            className="lume-pill h-9 flex-1 px-4"
            onClick={() => {
              openSimulation(sim.id)
              navigate('#/simulateur')
            }}
          >
            {t('Open in the simulator')}
          </Button>
          {status === 'abandoned' ? (
            <button
              type="button"
              onClick={() => reviveSimulation(sim.id)}
              className="text-[11px] text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              {t('Pick it back up')}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setAsking((value) => !value)}
              className="text-[11px] text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              {t('Give up on it')}
            </button>
          )}
        </div>

        {/* La raison est demandée, pas exigée : ce qu'on veut retrouver dans six
            mois, c'est pourquoi on a arrêté, et une case obligatoire produirait
            surtout des « bof ». */}
        {asking && status !== 'abandoned' && (
          <div className="flex gap-2">
            <Input
              autoFocus
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') abandonSimulation(sim.id, reason)
                if (event.key === 'Escape') setAsking(false)
              }}
              placeholder={t('Why are you stopping?')}
              className="h-9 text-sm"
            />
            <Button
              variant="secondary"
              className="h-9"
              onClick={() => {
                abandonSimulation(sim.id, reason)
                setAsking(false)
              }}
            >
              {t('Confirm')}
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}
