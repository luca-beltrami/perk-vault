import React, { useMemo, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Font, Radius, Spacing } from '../components/theme';
import { useAppState } from '../hooks/useAppState';
import { cardLibrary } from '../data/cardLibrary';
import BenefitDetailSheet from '../components/BenefitDetailSheet';
import {
  resolveAllPerks,
  calculateGrade,
  getGradeInfo,
  formatDaysRemaining,
  urgencyColor,
  getPerkIcon,
  getCurrentPeriodKey,
} from '../utils/perkUtils';
import type { ResolvedPerk } from '../utils/perkUtils';

interface UndoState {
  userPerkId: string;
  userCardId: string;
  perkName: string;
}

// ─── Tier definitions ─────────────────────────────────────────────────────────

const TIER_TODAY = { label: 'Expiring Today', color: '#DC2626' };
const TIER_WEEK  = { label: 'This Week',       color: '#D97706' };
const TIER_MONTH = { label: 'This Month',      color: '#2563EB' };

function filterTier(perks: ResolvedPerk[], minDays: number, maxDays: number): ResolvedPerk[] {
  return perks
    .filter((p) => p.daysRemaining >= minDays && p.daysRemaining <= maxDays)
    .sort((a, b) => b.perk.amount - a.perk.amount); // value descending
}

// ─── Placeholder insights ─────────────────────────────────────────────────────

// TODO P1: Replace with dynamic rule-based insights engine
const PLACEHOLDER_INSIGHTS = [
  { id: '1', text: "You haven't used your DoorDash credit this month", color: '#D97706' },
  { id: '2', text: "You're on track to break even on your Chase Sapphire Reserve", color: '#059669' },
  { id: '3', text: 'Your Saks credit expires in 8 days', color: '#DC2626' },
];

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ChecklistScreen() {
  const { state, setState } = useAppState();
  const now = useRef(new Date()).current;

  const [selectedPerk, setSelectedPerk] = useState<ResolvedPerk | null>(null);
  const [undoState, setUndoState] = useState<UndoState | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resolvedPerks = useMemo(
    () => resolveAllPerks(state.cards, cardLibrary, now),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.cards],
  );

  const grade = useMemo(() => calculateGrade(resolvedPerks), [resolvedPerks]);
  const gradeInfo = useMemo(() => getGradeInfo(grade), [grade]);

  const tierToday = useMemo(() => filterTier(resolvedPerks, -Infinity, 0), [resolvedPerks]);
  const tierWeek  = useMemo(() => filterTier(resolvedPerks, 1, 7),         [resolvedPerks]);
  const tierMonth = useMemo(() => filterTier(resolvedPerks, 8, 30),        [resolvedPerks]);

  const hasAnyUrgent = tierToday.length + tierWeek.length + tierMonth.length > 0;

  // ── Actions ─────────────────────────────────────────────────────────────

  const handleMarkUsed = useCallback(
    (rp: ResolvedPerk) => {
      setState({
        ...state,
        cards: state.cards.map((c) =>
          c.id !== rp.userCard.id ? c : {
            ...c,
            perks: c.perks.map((up) =>
              up.id !== rp.userPerk.id ? up : { ...up, used: true, usedAt: new Date().toISOString() },
            ),
          },
        ),
        lastUpdated: new Date().toISOString(),
      });
      setSelectedPerk(null);
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
      setUndoState({ userPerkId: rp.userPerk.id, userCardId: rp.userCard.id, perkName: rp.perk.name });
      undoTimerRef.current = setTimeout(() => setUndoState(null), 4000);
    },
    [state, setState],
  );

  const handleSkip = useCallback(
    (rp: ResolvedPerk) => {
      const periodKey = getCurrentPeriodKey(rp.perk, now);
      setState({
        ...state,
        cards: state.cards.map((c) =>
          c.id !== rp.userCard.id ? c : {
            ...c,
            perks: c.perks.map((up) =>
              up.id !== rp.userPerk.id ? up : { ...up, skipped: true, skippedPeriod: periodKey },
            ),
          },
        ),
        lastUpdated: new Date().toISOString(),
      });
      setSelectedPerk(null);
    },
    [state, setState, now],
  );

  const handleUndo = useCallback(() => {
    if (!undoState) return;
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    setState({
      ...state,
      cards: state.cards.map((c) =>
        c.id !== undoState.userCardId ? c : {
          ...c,
          perks: c.perks.map((up) =>
            up.id !== undoState.userPerkId ? up : { ...up, used: false, usedAt: undefined },
          ),
        },
      ),
      lastUpdated: new Date().toISOString(),
    });
    setUndoState(null);
  }, [undoState, state, setState]);

  // ── Empty state ──────────────────────────────────────────────────────────

  if (state.cards.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.emptyCenterContainer}>
          <Ionicons name="wallet-outline" size={52} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>No cards in your vault</Text>
          <Text style={styles.emptySubtitle}>
            Add your credit cards in the Cards tab to start tracking your perks here.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── Grade report card ────────────────────────────────────── */}
        <View style={[styles.gradeCard, { backgroundColor: gradeInfo.bg }]}>
          <Text style={styles.gradeEyebrow}>YOUR GRADE</Text>
          <Text style={[styles.gradeLetter, { color: gradeInfo.color }]}>{gradeInfo.grade}</Text>
          <Text style={[styles.gradeCaption, { color: gradeInfo.color }]}>{gradeInfo.message}</Text>
        </View>

        {/* ── Urgency tiers ────────────────────────────────────────── */}
        {!hasAnyUrgent ? (
          <View style={styles.allClearBox}>
            <Ionicons name="checkmark-circle" size={22} color={Colors.success} />
            <Text style={styles.allClearText}>Nothing needs attention right now.</Text>
          </View>
        ) : (
          <View style={styles.tiersContainer}>
            {tierToday.length > 0 && (
              <TierSection tier={TIER_TODAY} perks={tierToday} onPress={setSelectedPerk} onMarkUsed={handleMarkUsed} />
            )}
            {tierWeek.length > 0 && (
              <TierSection tier={TIER_WEEK} perks={tierWeek} onPress={setSelectedPerk} onMarkUsed={handleMarkUsed} />
            )}
            {tierMonth.length > 0 && (
              <TierSection tier={TIER_MONTH} perks={tierMonth} onPress={setSelectedPerk} onMarkUsed={handleMarkUsed} />
            )}
          </View>
        )}

        {/* ── Insights ─────────────────────────────────────────────── */}
        <View style={styles.insightsSection}>
          <View style={styles.insightsHeader}>
            <Text style={styles.insightsIcon}>💡</Text>
            <Text style={styles.insightsTitle}>Insights</Text>
          </View>
          {PLACEHOLDER_INSIGHTS.map((insight) => (
            <View key={insight.id} style={[styles.insightCard, { borderLeftColor: insight.color }]}>
              <Text style={styles.insightText}>{insight.text}</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
            </View>
          ))}
        </View>

      </ScrollView>

      {/* ── Undo toast ──────────────────────────────────────────────── */}
      {undoState && (
        <View style={styles.toast}>
          <Text style={styles.toastText} numberOfLines={1}>"{undoState.perkName}" marked as used</Text>
          <TouchableOpacity onPress={handleUndo}>
            <Text style={styles.toastUndo}>Undo</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Benefit detail sheet ────────────────────────────────────── */}
      {selectedPerk && (
        <BenefitDetailSheet
          resolvedPerk={selectedPerk}
          onClose={() => setSelectedPerk(null)}
          onMarkUsed={() => handleMarkUsed(selectedPerk)}
          onSkip={() => handleSkip(selectedPerk)}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Tier section ─────────────────────────────────────────────────────────────

function TierSection({
  tier, perks, onPress, onMarkUsed,
}: {
  tier: { label: string; color: string };
  perks: ResolvedPerk[];
  onPress: (rp: ResolvedPerk) => void;
  onMarkUsed: (rp: ResolvedPerk) => void;
}) {
  return (
    <View style={styles.tierSection}>
      <View style={[styles.tierHeader, { borderLeftColor: tier.color }]}>
        <Text style={[styles.tierLabel, { color: tier.color }]}>{tier.label}</Text>
        <View style={[styles.tierBadge, { backgroundColor: tier.color }]}>
          <Text style={styles.tierBadgeText}>{perks.length}</Text>
        </View>
      </View>
      {perks.map((rp) => (
        <BenefitRow key={rp.userPerk.id} rp={rp} color={tier.color} onPress={onPress} onMarkUsed={onMarkUsed} />
      ))}
    </View>
  );
}

// ─── Benefit row ──────────────────────────────────────────────────────────────

function BenefitRow({
  rp, color, onPress, onMarkUsed,
}: {
  rp: ResolvedPerk;
  color: string;
  onPress: (rp: ResolvedPerk) => void;
  onMarkUsed: (rp: ResolvedPerk) => void;
}) {
  const swipeableRef = useRef<Swipeable>(null);
  const dayColor = urgencyColor(rp.daysRemaining);
  const iconName = getPerkIcon(rp.perk.name) as any;
  const iconColor = color + 'CC'; // 80% opacity

  const renderRightActions = useCallback(() => (
    <TouchableOpacity
      style={styles.swipeAction}
      onPress={() => {
        swipeableRef.current?.close();
        onMarkUsed(rp);
      }}
      activeOpacity={0.85}
    >
      <Ionicons name="checkmark-circle" size={26} color="#fff" />
      <Text style={styles.swipeActionText}>Done</Text>
    </TouchableOpacity>
  ), [rp, onMarkUsed]);

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      rightThreshold={72}
      onSwipeableOpen={(direction) => {
        if (direction === 'right') {
          swipeableRef.current?.close();
          onMarkUsed(rp);
        }
      }}
      friction={2}
      overshootRight={false}
      containerStyle={styles.swipeableContainer}
    >
      <TouchableOpacity style={styles.benefitRow} onPress={() => onPress(rp)} activeOpacity={0.72}>
        {/* Category icon */}
        <View style={[styles.categoryIcon, { backgroundColor: color + '18' }]}>
          <Ionicons name={iconName} size={20} color={iconColor} />
        </View>

        {/* Text */}
        <View style={styles.benefitRowLeft}>
          <Text style={styles.benefitCardName} numberOfLines={1}>{rp.libCard.name}</Text>
          <Text style={styles.benefitPerkName} numberOfLines={1}>{rp.perk.name}</Text>
        </View>

        {/* Right: amount + day badge */}
        <View style={styles.benefitRowRight}>
          {rp.perk.amount > 0 && (
            <Text style={styles.benefitAmount}>${rp.perk.amount}</Text>
          )}
          <View style={[styles.dayBadge, { backgroundColor: dayColor }]}>
            <Text style={styles.dayBadgeText}>{formatDaysRemaining(rp.daysRemaining)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Swipeable>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 96 },

  emptyCenterContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: Spacing.xxxl, gap: Spacing.lg,
  },
  emptyTitle: { fontFamily: Font.bold, fontSize: 22, color: Colors.textPrimary, textAlign: 'center' },
  emptySubtitle: { fontFamily: Font.regular, fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },

  // Grade report card
  gradeCard: {
    margin: Spacing.lg, borderRadius: Radius.card,
    alignItems: 'center', paddingTop: Spacing.xxl, paddingBottom: Spacing.xl, paddingHorizontal: Spacing.xxl,
  },
  gradeEyebrow: {
    fontFamily: Font.semiBold, fontSize: 11, letterSpacing: 2,
    color: Colors.textMuted, textTransform: 'uppercase', marginBottom: Spacing.xs,
  },
  gradeLetter: { fontFamily: Font.bold, fontSize: 96, lineHeight: 110 },
  gradeCaption: { fontFamily: Font.semiBold, fontSize: 14, textAlign: 'center', marginTop: Spacing.xs },

  // All-clear
  allClearBox: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    marginHorizontal: Spacing.lg, marginTop: Spacing.sm,
    backgroundColor: Colors.surface, borderRadius: Radius.row,
    paddingVertical: Spacing.lg, paddingHorizontal: Spacing.lg,
    borderWidth: 1, borderColor: Colors.border,
  },
  allClearText: { fontFamily: Font.medium, fontSize: 15, color: Colors.textSecondary, flex: 1 },

  // Tiers
  tiersContainer: { gap: Spacing.xl, paddingHorizontal: Spacing.lg, marginTop: Spacing.sm },
  tierSection: {},
  tierHeader: {
    flexDirection: 'row', alignItems: 'center', borderLeftWidth: 3,
    paddingLeft: Spacing.md, marginBottom: Spacing.sm, gap: Spacing.sm,
  },
  tierLabel: { fontFamily: Font.bold, fontSize: 15, flex: 1 },
  tierBadge: { borderRadius: Radius.pill, paddingHorizontal: 9, paddingVertical: 2, minWidth: 24, alignItems: 'center' },
  tierBadgeText: { fontFamily: Font.bold, fontSize: 12, color: '#fff' },

  // Benefit rows
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.row,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: 'rgba(5, 150, 105, 0.25)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryIcon: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    marginRight: Spacing.md, flexShrink: 0,
  },
  benefitRowLeft: { flex: 1, marginRight: Spacing.md },
  benefitCardName: { fontFamily: Font.medium, fontSize: 12, color: Colors.textMuted, marginBottom: 2 },
  benefitPerkName: { fontFamily: Font.semiBold, fontSize: 15, color: Colors.textPrimary },
  benefitRowRight: { alignItems: 'flex-end', gap: Spacing.xs },
  benefitAmount: { fontFamily: Font.bold, fontSize: 16, color: Colors.action },
  dayBadge: { borderRadius: Radius.pill, paddingHorizontal: 8, paddingVertical: 3 },
  dayBadgeText: { fontFamily: Font.bold, fontSize: 11, color: '#fff' },
  swipeableContainer: { borderRadius: Radius.row, marginBottom: Spacing.sm, overflow: 'hidden' },
  swipeAction: {
    backgroundColor: Colors.success, width: 80, alignItems: 'center', justifyContent: 'center', gap: 4,
  },
  swipeActionText: { fontFamily: Font.bold, fontSize: 11, color: '#fff' },

  // Insights
  insightsSection: { marginTop: Spacing.xxl, paddingHorizontal: Spacing.lg, marginBottom: Spacing.lg },
  insightsHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
  insightsIcon: { fontSize: 18 },
  insightsTitle: { fontFamily: Font.semiBold, fontSize: 16, color: Colors.textPrimary },
  insightCard: {
    backgroundColor: Colors.surface, borderRadius: 12, borderLeftWidth: 4,
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: Spacing.lg, paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  insightText: { fontFamily: Font.regular, fontSize: 14, color: Colors.textPrimary, flex: 1, marginRight: Spacing.sm },

  // Toast
  toast: {
    position: 'absolute', bottom: Spacing.xxxl, left: Spacing.lg, right: Spacing.lg,
    backgroundColor: Colors.toastBg, borderRadius: Radius.row,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 8,
  },
  toastText: { fontFamily: Font.regular, fontSize: 14, color: '#fff', flex: 1, marginRight: Spacing.md },
  toastUndo: { fontFamily: Font.semiBold, fontSize: 14, color: '#60A5FA' },
});
