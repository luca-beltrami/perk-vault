export function challengeUrgencyColor(daysLeft: number): string {
  if (daysLeft > 30) return '#00C9A7';
  if (daysLeft > 15) return '#D97706';
  if (daysLeft > 7)  return '#F97316';
  return '#DC2626';
}

export function getDaysToDeadline(deadline: string, now: Date): number {
  const d = new Date(deadline);
  const today  = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}
