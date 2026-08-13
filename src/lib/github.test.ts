import { describe, expect, it } from 'vitest'
import { activityOf, parseRepo, repoUrl, type RepoSignals } from './github'

function signals(patch: Partial<RepoSignals> = {}): RepoSignals {
  return {
    slug: 'sabrilab/Colombes',
    description: null,
    language: null,
    stars: 0,
    openIssues: 0,
    ageMonths: 12,
    daysSincePush: 3,
    isArchived: false,
    ...patch,
  }
}

describe('parseRepo', () => {
  it('accepte ce qu’on colle vraiment', () => {
    const expected = 'sabrilab/Colombes'
    for (const input of [
      'https://github.com/sabrilab/Colombes',
      'http://github.com/sabrilab/Colombes/',
      'https://www.github.com/sabrilab/Colombes.git',
      'github.com/sabrilab/Colombes',
      'sabrilab/Colombes',
      '  sabrilab/Colombes  ',
      // Une adresse de sous-page : on garde le dépôt, pas le chemin.
      'https://github.com/sabrilab/Colombes/tree/main/src',
    ]) {
      expect(parseRepo(input), input).toBe(expected)
    }
  })

  it('refuse ce qui n’est pas un dépôt', () => {
    for (const input of ['', '   ', 'https://gitlab.com/a/b', 'juste-un-mot', 'https://github.com/']) {
      expect(parseRepo(input), input).toBeNull()
    }
  })

  it('reconstruit l’adresse', () => {
    expect(repoUrl('sabrilab/Colombes')).toBe('https://github.com/sabrilab/Colombes')
  })
})

describe('activityOf', () => {
  it('lit la dernière poussée, et rien d’autre', () => {
    expect(activityOf(signals({ daysSincePush: 3 }))).toBe('active')
    expect(activityOf(signals({ daysSincePush: 30 }))).toBe('active')
    expect(activityOf(signals({ daysSincePush: 31 }))).toBe('slowing')
    expect(activityOf(signals({ daysSincePush: 90 }))).toBe('slowing')
    expect(activityOf(signals({ daysSincePush: 91 }))).toBe('dormant')
  })

  it('classe un dépôt archivé comme dormant, même poussé hier', () => {
    expect(activityOf(signals({ daysSincePush: 1, isArchived: true }))).toBe('dormant')
  })
})
