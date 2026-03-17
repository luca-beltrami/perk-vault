// Gradient colour stops per card ID.
// Used by CreditCardGraphic to paint the card background.
export const CARD_GRADIENTS: Record<string, readonly [string, string, string]> = {
  'amex-platinum':                  ['#8E9EAB', '#C8D6DF', '#8E9EAB'],
  'amex-platinum-business':         ['#6B7A8D', '#A0ADB8', '#6B7A8D'],
  'amex-gold':                      ['#C9A84C', '#F0D080', '#C9A84C'],
  'chase-sapphire-reserve':         ['#0A2F6E', '#1A4F8C', '#0A2F6E'],
  'chase-sapphire-reserve-business':['#0A2F6E', '#1A4F8C', '#0A2F6E'],
  'chase-sapphire-preferred':       ['#1A5276', '#2E86C1', '#1A5276'],
  'chase-freedom-unlimited':        ['#2C3E50', '#4A5568', '#2C3E50'],
  'chase-freedom-flex':             ['#1A252F', '#2C3E50', '#1A252F'],
  'united-explorer':                ['#003087', '#0052CC', '#003087'],
  'united-business':                ['#003087', '#0052CC', '#003087'],
  'capital-one-venture-x':          ['#1C1C1E', '#2C2C2E', '#1C1C1E'],
  'hilton-honors-aspire':           ['#00205B', '#003087', '#00205B'],
  'marriott-bonvoy-brilliant':      ['#8B0000', '#C0392B', '#8B0000'],
  'delta-skymiles-reserve':         ['#003366', '#CC0000', '#003366'],
  'citi-strata-elite':              ['#003087', '#1A5276', '#003087'],
  'wells-fargo-premier-autograph':  ['#CC0000', '#A50000', '#CC0000'],
};

const FALLBACK: readonly [string, string, string] = ['#1A1A1A', '#2C2C2C', '#1A1A1A'];

export function getCardGradient(cardId: string): readonly [string, string, string] {
  return CARD_GRADIENTS[cardId] ?? FALLBACK;
}
