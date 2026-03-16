export type Issuer =
  | 'American Express'
  | 'Chase'
  | 'Capital One'
  | 'Hilton'
  | 'Marriott'
  | 'Delta'
  | 'Citi';

export type Network = 'Amex' | 'Visa' | 'Mastercard';

export type PerkFrequency = 'monthly' | 'quarterly' | 'semi-annual' | 'annual';

export interface Perk {
  id: string;
  name: string;
  amount: number;
  frequency: PerkFrequency;
  description: string;
  isH1?: boolean;
  isH2?: boolean;
}

export interface Card {
  id: string;
  name: string;
  issuer: Issuer;
  network: Network;
  annualFee: number;
  color: string;
  perks: Perk[];
}
