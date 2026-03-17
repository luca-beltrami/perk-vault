import type { Perk, Card, UserCard, UserPerk, AppState } from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ResolvedPerk {
  userCard: UserCard;
  libCard: Card;
  perk: Perk;
  userPerk: UserPerk;
  expiryDate: Date;
  daysRemaining: number;
}

export interface CarouselPerk {
  perk: Perk;
  userPerk: UserPerk;
  status: 'active' | 'locked' | 'completed';
  expiryDate: Date | null;
  daysRemaining: number | null;
}

export type Grade = 'A' | 'B' | 'C' | 'D';

export interface GradeInfo {
  grade: Grade;
  color: string;
  bg: string;
  label: string;
  message: string;
}

// ─── Half helpers ─────────────────────────────────────────────────────────────

export function isInH1(now: Date): boolean {
  return now.getMonth() < 6;
}

export function isPerkCurrentHalf(perk: Perk, now: Date): boolean {
  if (perk.isH1) return isInH1(now);
  if (perk.isH2) return !isInH1(now);
  return true;
}

// ─── Expiry date ─────────────────────────────────────────────────────────────

export function getPerkExpiryDate(perk: Perk, userCard: UserCard, now: Date): Date {
  const year = now.getFullYear();
  const month = now.getMonth();

  switch (perk.frequency) {
    case 'monthly':
      return new Date(year, month + 1, 0);
    case 'quarterly': {
      const qEnd = Math.floor(month / 3) * 3 + 2;
      return new Date(year, qEnd + 1, 0);
    }
    case 'semi-annual':
      if (perk.isH2 || (!perk.isH1 && month >= 6)) {
        return new Date(year, 11, 31);
      }
      return new Date(year, 5, 30);
    case 'annual': {
      if (userCard.anniversaryMonth != null) {
        const a = userCard.anniversaryMonth;
        const curMonth1 = month + 1;
        const nextYear = curMonth1 < a ? year : year + 1;
        return new Date(nextYear, a - 1, 0);
      }
      return new Date(year, 11, 31);
    }
    default:
      return new Date(year, 11, 31);
  }
}

export function getDaysRemaining(expiryDate: Date, now: Date): number {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const expiry = new Date(expiryDate.getFullYear(), expiryDate.getMonth(), expiryDate.getDate());
  return Math.round((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

// ─── Perk resolution ─────────────────────────────────────────────────────────

export function resolveAllPerks(
  userCards: UserCard[],
  cardLibraryData: Card[],
  now: Date,
): ResolvedPerk[] {
  const result: ResolvedPerk[] = [];
  for (const userCard of userCards) {
    const libCard = cardLibraryData.find((c) => c.id === userCard.cardLibraryId);
    if (!libCard) continue;
    for (const perk of libCard.perks) {
      const userPerk = userCard.perks.find((up) => up.perkId === perk.id);
      if (!userPerk) continue;
      if (userPerk.used || userPerk.skipped) continue;
      if (!isPerkCurrentHalf(perk, now)) continue;
      const expiryDate = getPerkExpiryDate(perk, userCard, now);
      const daysRemaining = getDaysRemaining(expiryDate, now);
      result.push({ userCard, libCard, perk, userPerk, expiryDate, daysRemaining });
    }
  }
  return result;
}

export function getCarouselPerks(userCard: UserCard, libCard: Card, now: Date): CarouselPerk[] {
  const result: CarouselPerk[] = [];
  for (const perk of libCard.perks) {
    const userPerk = userCard.perks.find((up) => up.perkId === perk.id);
    if (!userPerk) continue;
    const inCurrentHalf = isPerkCurrentHalf(perk, now);
    if (!inCurrentHalf) {
      result.push({ perk, userPerk, status: 'locked', expiryDate: null, daysRemaining: null });
    } else if (userPerk.used || userPerk.skipped) {
      const expiryDate = getPerkExpiryDate(perk, userCard, now);
      result.push({ perk, userPerk, status: 'completed', expiryDate, daysRemaining: null });
    } else {
      const expiryDate = getPerkExpiryDate(perk, userCard, now);
      const daysRemaining = getDaysRemaining(expiryDate, now);
      result.push({ perk, userPerk, status: 'active', expiryDate, daysRemaining });
    }
  }
  result.sort((a, b) => {
    const order: Record<CarouselPerk['status'], number> = { active: 0, completed: 1, locked: 2 };
    if (a.status !== b.status) return order[a.status] - order[b.status];
    if (a.status === 'active' && a.daysRemaining != null && b.daysRemaining != null) {
      return a.daysRemaining - b.daysRemaining;
    }
    return 0;
  });
  return result;
}

// ─── Grade ───────────────────────────────────────────────────────────────────

export function calculateGrade(resolvedPerks: ResolvedPerk[]): Grade {
  if (resolvedPerks.length === 0) return 'A';
  const min = Math.min(...resolvedPerks.map((p) => p.daysRemaining));
  if (min <= 3) return 'D';
  if (min <= 7) return 'C';
  if (min <= 15) return 'B';
  return 'A';
}

export function getGradeInfo(grade: Grade): GradeInfo {
  switch (grade) {
    case 'A':
      return { grade, color: '#059669', bg: '#F0FDF4', label: 'All clear', message: "You're on top of everything. No urgent perks." };
    case 'B':
      return { grade, color: '#6EBF8B', bg: '#F2FAF6', label: 'Heads up', message: 'A few perks expire in the next 2 weeks.' };
    case 'C':
      return { grade, color: '#D97706', bg: '#FFFBEB', label: 'Act soon', message: 'Some perks expire this week — use them fast.' };
    case 'D':
      return { grade, color: '#DC2626', bg: '#FEF2F2', label: 'Urgent', message: 'Critical: perks expiring in 3 days or already gone.' };
  }
}

// ─── Sort cards by urgency ────────────────────────────────────────────────────

export function sortCardsByUrgency(userCards: UserCard[], resolvedPerks: ResolvedPerk[]): UserCard[] {
  return [...userCards].sort((a, b) => {
    const aPerks = resolvedPerks.filter((p) => p.userCard.id === a.id);
    const bPerks = resolvedPerks.filter((p) => p.userCard.id === b.id);
    const aMin = aPerks.length > 0 ? Math.min(...aPerks.map((p) => p.daysRemaining)) : Infinity;
    const bMin = bPerks.length > 0 ? Math.min(...bPerks.map((p) => p.daysRemaining)) : Infinity;
    return aMin - bMin;
  });
}

// ─── Formatting ──────────────────────────────────────────────────────────────

export function formatDaysRemaining(days: number): string {
  if (days < 0) return 'Expired';
  if (days === 0) return 'Today';
  if (days === 1) return '1d left';
  return `${days}d left`;
}

export function urgencyColor(days: number): string {
  if (days <= 3) return '#DC2626';
  if (days <= 7) return '#D97706';
  if (days <= 15) return '#1D4ED8';
  return '#94A3B8';
}

// ─── Category icons ───────────────────────────────────────────────────────────

export function getPerkIcon(perkName: string): string {
  const n = perkName.toLowerCase();
  if (/doordash|dining|restaurant|uber eats|dunkin|grubhub|resy|cheesecake/.test(n)) return 'restaurant-outline';
  if (/airline|travel|hotel|clear|global entry|tsa|lounge|united|hilton|marriott|delta/.test(n)) return 'airplane-outline';
  if (/saks|walmart|lululemon|dell/.test(n)) return 'bag-outline';
  if (/digital entertainment|disney|hulu|peacock|apple tv|peloton/.test(n)) return 'play-circle-outline';
  if (/lyft|uber cash|uber one/.test(n)) return 'car-outline';
  if (/instacart/.test(n)) return 'cart-outline';
  if (/wireless|cell phone/.test(n)) return 'phone-portrait-outline';
  return 'star-outline';
}

// ─── Period key (for skipped-perk reset) ──────────────────────────────────────

export function getCurrentPeriodKey(perk: Perk, now: Date): string {
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  switch (perk.frequency) {
    case 'monthly':    return `${year}-${String(month).padStart(2, '0')}`;
    case 'quarterly':  return `${year}-Q${Math.ceil(month / 3)}`;
    case 'semi-annual':return `${year}-${month <= 6 ? 'H1' : 'H2'}`;
    case 'annual':     return `${year}`;
    default:           return `${year}`;
  }
}

export function resetSkippedPerks(state: AppState, cardLibraryData: Card[], now: Date): AppState {
  const cards = state.cards.map((userCard) => {
    const libCard = cardLibraryData.find((c) => c.id === userCard.cardLibraryId);
    if (!libCard) return userCard;

    let cardChanged = false;
    const perks = userCard.perks.map((userPerk) => {
      if (!userPerk.skipped || !userPerk.skippedPeriod) return userPerk;
      const perk = libCard.perks.find((p) => p.id === userPerk.perkId);
      if (!perk) return userPerk;
      const current = getCurrentPeriodKey(perk, now);
      if (current !== userPerk.skippedPeriod) {
        cardChanged = true;
        return { ...userPerk, skipped: false, skippedPeriod: undefined };
      }
      return userPerk;
    });
    return cardChanged ? { ...userCard, perks } : userCard;
  });

  const changed = cards.some((c, i) => c !== state.cards[i]);
  return changed ? { ...state, cards } : state;
}
