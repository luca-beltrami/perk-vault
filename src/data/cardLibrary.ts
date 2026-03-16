export type Issuer =
  | 'American Express'
  | 'Chase'
  | 'Capital One'
  | 'Hilton'
  | 'Marriott'
  | 'Delta'
  | 'Citi';

export type Network = 'Amex' | 'Visa' | 'Mastercard';

export interface Card {
  id: string;
  name: string;
  issuer: Issuer;
  network: Network;
  annualFee: number;
  color: string;
}

export const cardLibrary: Card[] = [
  {
    id: 'amex-platinum',
    name: 'Amex Platinum',
    issuer: 'American Express',
    network: 'Amex',
    annualFee: 895,
    color: '#A8A9AD',
  },
  {
    id: 'amex-platinum-business',
    name: 'Amex Platinum for Business',
    issuer: 'American Express',
    network: 'Amex',
    annualFee: 695,
    color: '#8C8C8C',
  },
  {
    id: 'amex-gold',
    name: 'Amex Gold',
    issuer: 'American Express',
    network: 'Amex',
    annualFee: 325,
    color: '#C9A84C',
  },
  {
    id: 'chase-sapphire-reserve',
    name: 'Chase Sapphire Reserve',
    issuer: 'Chase',
    network: 'Visa',
    annualFee: 795,
    color: '#1A1F71',
  },
  {
    id: 'chase-sapphire-reserve-business',
    name: 'Chase Sapphire Reserve for Business',
    issuer: 'Chase',
    network: 'Visa',
    annualFee: 695,
    color: '#141852',
  },
  {
    id: 'chase-sapphire-preferred',
    name: 'Chase Sapphire Preferred',
    issuer: 'Chase',
    network: 'Visa',
    annualFee: 95,
    color: '#2E5299',
  },
  {
    id: 'chase-freedom-unlimited',
    name: 'Chase Freedom Unlimited',
    issuer: 'Chase',
    network: 'Visa',
    annualFee: 0,
    color: '#0072CE',
  },
  {
    id: 'chase-freedom-flex',
    name: 'Chase Freedom Flex',
    issuer: 'Chase',
    network: 'Mastercard',
    annualFee: 0,
    color: '#00A9E0',
  },
  {
    id: 'united-explorer',
    name: 'United Explorer Card',
    issuer: 'Chase',
    network: 'Visa',
    annualFee: 95,
    color: '#005DAA',
  },
  {
    id: 'united-business',
    name: 'United Business Card',
    issuer: 'Chase',
    network: 'Visa',
    annualFee: 99,
    color: '#004C97',
  },
  {
    id: 'capital-one-venture-x',
    name: 'Capital One Venture X',
    issuer: 'Capital One',
    network: 'Visa',
    annualFee: 395,
    color: '#D03027',
  },
  {
    id: 'hilton-honors-aspire',
    name: 'Hilton Honors Aspire',
    issuer: 'Hilton',
    network: 'Amex',
    annualFee: 550,
    color: '#1A4A8A',
  },
  {
    id: 'marriott-bonvoy-brilliant',
    name: 'Marriott Bonvoy Brilliant',
    issuer: 'Marriott',
    network: 'Amex',
    annualFee: 650,
    color: '#8B1A2F',
  },
  {
    id: 'delta-skymiles-reserve',
    name: 'Delta SkyMiles Reserve',
    issuer: 'Delta',
    network: 'Amex',
    annualFee: 650,
    color: '#003A70',
  },
  {
    id: 'citi-strata-elite',
    name: 'Citi Strata Elite',
    issuer: 'Citi',
    network: 'Mastercard',
    annualFee: 595,
    color: '#003B70',
  },
];
