import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AppState } from '../types';

const STORAGE_KEY = 'perk_vault_state';

export const defaultNotificationSettings = {
  expiryReminders: true,
  monthlyDaysBefore: 5,
  quarterlyDaysBefore: 14,
  semiAnnualDaysBefore: 21,
  annualFeeReminders: true,
  annualFeeDaysBefore: 45,
};

export const defaultAppState: AppState = {
  cards: [],
  challenges: [],
  milestoneHistory: [],
  settings: defaultNotificationSettings,
  lastUpdated: new Date().toISOString(),
};

export async function saveAppState(state: AppState): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export async function loadAppState(): Promise<AppState | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (raw === null) return null;
  return JSON.parse(raw) as AppState;
}
