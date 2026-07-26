import { describe, expect, it } from 'vitest'
import { describeHiddenAssumptions } from './assumptions'
import { DEFAULT_INPUTS } from './defaults'
import { formatCurrency, formatPercent } from './format'

describe('describeHiddenAssumptions', () => {
  it('résume les réglages masqués par le mode simple, en français lisible', () => {
    const text = describeHiddenAssumptions(DEFAULT_INPUTS)
    expect(text).toContain(`CAC ${formatCurrency(180)}`)
    expect(text).toContain(`margin ${formatPercent(0.85, 0)}`)
    expect(text).toContain(`expansion ${formatPercent(0.008)}`)
    expect(text).toContain(`fixed costs ${formatCurrency(3_500)}`)
  })
})
