import { useState } from 'react'
import type { Landmark } from '@/lib/landmarks'

/**
 * Le logo officiel de l'entreprise, servi depuis `public/logos/<id>.svg`.
 * Tant que le fichier n'est pas déposé — ou s'il échoue — on retombe sur
 * une lettrine dans la couleur de la marque : la carte ne casse jamais.
 * Voir public/logos/README.md pour l'origine des fichiers.
 */
export function CompanyLogo({ company, className }: { company: Landmark; className?: string }) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <span
        aria-hidden
        className={`font-display flex items-center justify-center rounded-full text-base font-bold ${className ?? ''}`}
        style={{ background: company.color, color: '#0d0f0c' }}
      >
        {company.initial}
      </span>
    )
  }

  return (
    <span
      aria-hidden
      className={`flex items-center justify-center overflow-hidden rounded-full bg-white ${className ?? ''}`}
    >
      <img
        src={`/logos/${company.id}.svg`}
        alt=""
        loading="lazy"
        onError={() => setFailed(true)}
        className="size-[68%] object-contain"
      />
    </span>
  )
}
