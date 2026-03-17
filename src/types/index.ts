export type Issuer =
  | 'American Express'
  | 'Chase'
  | 'Capital One'
  | 'Hilton'
  | 'Marriott'
  | 'Delta'
  | 'Citi'
  | 'Wells Fargo';

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

// --- User data model ---

export interface UserPerk {
  id: string;
  perkId: string;
  used: boolean;
  skipped: boolean;
  usedAt?: string;
}

export interface UserCard {
  id: string;
  cardLibraryId: string;
  name: string;
  colorIdx: number;
  anniversaryMonth?: number;
  perks: UserPerk[];
}

export interface BonusChallenge {
  id: string;
  cardName: string;
  bonusDescription: string;
  minSpend: number;
  currentSpend: number;
  deadline: string;
  bonusValue?: number;
  completed: boolean;
  note?: string;
}

export interface MilestoneRecord {
  id: string;
  cardId: string;
  type: string;
  achievedAt: string;
}

export interface NotificationSettings {
  expiryReminders: boolean;
  monthlyDaysBefore: number;
  quarterlyDaysBefore: number;
  semiAnnualDaysBefore: number;
  annualFeeReminders: boolean;
  annualFeeDaysBefore: number;
}

export interface AppState {
  cards: UserCard[];
  challenges: BonusChallenge[];
  milestoneHistory: MilestoneRecord[];
  settings: NotificationSettings;
  lastUpdated: string;
}
