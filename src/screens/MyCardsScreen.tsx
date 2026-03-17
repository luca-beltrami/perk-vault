import React, { useMemo, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Dimensions,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_ART_WIDTH = Math.round(SCREEN_WIDTH * 0.46);
const CARD_ART_HEIGHT = Math.round(CARD_ART_WIDTH / 1.586);
const BENEFIT_TILE_WIDTH = 148;

import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Font, Radius, Spacing } from '../components/theme';
import { CardsStackParamList } from '../navigation/CardsStack';
import { useAppState } from '../hooks/useAppState';
import { cardLibrary } from '../data/cardLibrary';
import CreditCardGraphic from '../components/CreditCardGraphic';
import BenefitDetailSheet from '../components/BenefitDetailSheet';
import {
  resolveAllPerks,
  getCarouselPerks,
  calculateGrade,
  getGradeInfo,
  isPerkCurrentHalf,
  formatDaysRemaining,
  urgencyColor,
  getCurrentPeriodKey,
} from '../utils/perkUtils';
import type { ResolvedPerk, CarouselPerk } from '../utils/perkUtils';
import type { UserCard } from '../types';

type Props = NativeStackScreenProps<CardsStackParamList, 'MyCards'>;

function getHealthScore(userCard: UserCard): number {
  if (userCard.perks.length === 0) return 1;
  return userCard.perks.filter((p) => p.used).length / userCard.perks.length;
}

export default function MyCardsScreen({ navigation }: Props) {
  const { state, setState } = useAppState();
  const cards = state.cards;
  const now = useRef(new Date()).current;

  // All cards start expanded
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    () => new Set(cards.map((c) => c.id)),
  );
  const [selectedPerk, setSelectedPerk] = useState<ResolvedPerk | null>(null);

  const resolvedPerks = useMemo(
    () => resolveAllPerks(state.cards, cardLibrary, now),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.cards],
  );

  // Sort by health score ascending (most urgent = fewest perks used = lowest score)
  const sortedCards = useMemo(
    () => [...cards].sort((a, b) => getHealthScore(a) - getHealthScore(b)),
    [cards],
  );

  const handleToggle = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

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

  if (cards.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.empty}>
          <Ionicons name="card-outline" size={56} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>No cards yet</Text>
          <Text style={styles.emptySubtitle}>
            Add your cards to start tracking perks and making sure every dollar of your annual fees is working for you.
          </Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('CardLibrary')}>
            <Text style={styles.addBtnText}>Add your first card</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Add another card */}
        <TouchableOpacity style={styles.addCardRow} onPress={() => navigation.navigate('CardLibrary')}>
          <Ionicons name="add-circle-outline" size={20} color={Colors.action} />
          <Text style={styles.addCardRowText}>Add another card</Text>
        </TouchableOpacity>

        {/* Per-card sections */}
        {sortedCards.map((userCard) => {
          const libCard = cardLibrary.find((c) => c.id === userCard.cardLibraryId);
          if (!libCard) return null;

          const isExpanded = expandedIds.has(userCard.id);
          const cardResolvedPerks = resolvedPerks.filter((rp) => rp.userCard.id === userCard.id);
          const cardGrade = calculateGrade(cardResolvedPerks);
          const cardGradeInfo = getGradeInfo(cardGrade);

          // Metrics
          let capturedValue = 0;
          for (const perk of libCard.perks) {
            if (!isPerkCurrentHalf(perk, now)) continue;
            const up = userCard.perks.find((u) => u.perkId === perk.id);
            if (up?.used && perk.amount > 0) capturedValue += perk.amount;
          }
          const availableValue = cardResolvedPerks.reduce((s, rp) => s + rp.perk.amount, 0);
          const expiringValue  = cardResolvedPerks
            .filter((rp) => rp.daysRemaining <= 15)
            .reduce((s, rp) => s + rp.perk.amount, 0);

          // Carousel: active perks only, sorted by daysRemaining ascending (getCarouselPerks already does this)
          const allCarouselPerks = getCarouselPerks(userCard, libCard, now);
          const activeCarouselPerks = allCarouselPerks.filter((cp) => cp.status === 'active');

          return (
            <View key={userCard.id} style={styles.cardSection}>
              {/* Header — always visible, tappable */}
              <TouchableOpacity
                style={styles.cardHeader}
                onPress={() => handleToggle(userCard.id)}
                activeOpacity={0.85}
              >
                {isExpanded ? (
                  // Expanded header
                  <View style={styles.expandedHeader}>
                    <View style={styles.expandedHeaderTop}>
                      <View style={styles.expandedHeaderNames}>
                        <Text style={styles.cardNameLarge}>{userCard.name}</Text>
                        <Text style={styles.cardIssuer}>{libCard.issuer}</Text>
                      </View>
                      <View style={styles.expandedHeaderRight}>
                        <View style={[styles.gradePill, { backgroundColor: cardGradeInfo.color }]}>
                          <Text style={styles.gradePillText}>{cardGradeInfo.grade}</Text>
                        </View>
                        <Ionicons name="chevron-up" size={16} color={Colors.textMuted} style={{ marginTop: 4 }} />
                      </View>
                    </View>
                    {/* Metrics row */}
                    <View style={styles.metricsRow}>
                      <MetricItem label="Captured" value={`$${capturedValue}`} color={Colors.success} />
                      <View style={styles.metricDivider} />
                      <MetricItem label="Available" value={`$${availableValue}`} color={Colors.action} />
                      <View style={styles.metricDivider} />
                      <MetricItem label="Expiring" value={`$${expiringValue}`} color={expiringValue > 0 ? '#D97706' : Colors.textMuted} />
                    </View>
                    {/* See all */}
                    <TouchableOpacity
                      style={styles.seeAllBtn}
                      onPress={() => navigation.navigate('CardBenefits', { userCardId: userCard.id })}
                    >
                      <Text style={styles.seeAllText}>See all benefits</Text>
                      <Ionicons name="chevron-forward" size={14} color={Colors.action} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  // Collapsed header — one line
                  <View style={styles.collapsedHeader}>
                    <View style={[styles.gradePill, { backgroundColor: cardGradeInfo.color }]}>
                      <Text style={styles.gradePillText}>{cardGradeInfo.grade}</Text>
                    </View>
                    <Text style={styles.collapsedName} numberOfLines={1}>{userCard.name}</Text>
                    <Text style={styles.collapsedFee}>
                      {libCard.annualFee > 0 ? `$${libCard.annualFee}/yr` : 'No fee'}
                    </Text>
                    <Text style={styles.collapsedSummary}>
                      ${capturedValue} / ${capturedValue + availableValue}
                    </Text>
                    <Ionicons name="chevron-down" size={16} color={Colors.textMuted} />
                  </View>
                )}
              </TouchableOpacity>

              {/* Expanded: horizontal carousel */}
              {isExpanded && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.carouselScroll}
                >
                  {/* Card artwork tile */}
                  <View style={[styles.artworkTile, { width: CARD_ART_WIDTH }]}>
                    <CreditCardGraphic
                      cardId={libCard.id}
                      cardName={libCard.name}
                      network={libCard.network}
                      width={CARD_ART_WIDTH}
                    />
                    <Text style={styles.artworkFee}>
                      {libCard.annualFee > 0 ? `$${libCard.annualFee}/yr` : 'No annual fee'}
                    </Text>
                  </View>

                  {/* Active benefit tiles */}
                  {activeCarouselPerks.length === 0 ? (
                    <View style={styles.allDoneTile}>
                      <Ionicons name="checkmark-circle" size={28} color={Colors.success} />
                      <Text style={styles.allDoneText}>All perks{'\n'}used!</Text>
                    </View>
                  ) : (
                    activeCarouselPerks.map((cp) => {
                      const rp = resolvedPerks.find((r) => r.userPerk.id === cp.userPerk.id);
                      return (
                        <TouchableOpacity
                          key={cp.userPerk.id}
                          style={styles.benefitTile}
                          onPress={() => rp && setSelectedPerk(rp)}
                          activeOpacity={0.72}
                        >
                          <BenefitCarouselTile cp={cp} />
                        </TouchableOpacity>
                      );
                    })
                  )}
                </ScrollView>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* Benefit detail sheet */}
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

// ─── Metric item ──────────────────────────────────────────────────────────────

function MetricItem({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <Text style={{ fontFamily: Font.bold, fontSize: 17, color }}>{value}</Text>
      <Text style={{ fontFamily: Font.regular, fontSize: 11, color: Colors.textMuted, marginTop: 1 }}>{label}</Text>
    </View>
  );
}

// ─── Benefit carousel tile ────────────────────────────────────────────────────

function BenefitCarouselTile({ cp }: { cp: CarouselPerk }) {
  const { perk, daysRemaining } = cp;
  const dayColor = daysRemaining != null ? urgencyColor(daysRemaining) : Colors.textMuted;

  return (
    <View style={styles.benefitTileInner}>
      <Text style={styles.benefitTileName} numberOfLines={2}>{perk.name}</Text>
      {perk.amount > 0 && (
        <Text style={styles.benefitTileAmount}>${perk.amount}</Text>
      )}
      {daysRemaining != null && (
        <View style={[styles.benefitTileDayBadge, { backgroundColor: dayColor + '1A' }]}>
          <Text style={[styles.benefitTileDayText, { color: dayColor }]}>
            {formatDaysRemaining(daysRemaining)}
          </Text>
        </View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: Spacing.lg, paddingBottom: 48, paddingTop: Spacing.sm },

  // Empty state
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xxxl, gap: Spacing.lg },
  emptyTitle: { fontFamily: Font.bold, fontSize: 22, color: Colors.textPrimary, textAlign: 'center' },
  emptySubtitle: { fontFamily: Font.regular, fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  addBtn: { marginTop: Spacing.sm, backgroundColor: Colors.action, paddingVertical: Spacing.lg, paddingHorizontal: Spacing.xxxl, borderRadius: Radius.pill },
  addBtnText: { fontFamily: Font.semiBold, fontSize: 16, color: Colors.surface },

  // Add card row
  addCardRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
  addCardRowText: { fontFamily: Font.semiBold, fontSize: 15, color: Colors.action },

  // Card section
  cardSection: {
    backgroundColor: Colors.surface, borderRadius: Radius.card, marginBottom: Spacing.md,
    overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  cardHeader: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },

  // Expanded header
  expandedHeader: { gap: Spacing.sm },
  expandedHeaderTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  expandedHeaderNames: { flex: 1, marginRight: Spacing.md },
  expandedHeaderRight: { alignItems: 'center', gap: Spacing.xs },
  cardNameLarge: { fontFamily: Font.bold, fontSize: 16, color: Colors.textPrimary, lineHeight: 22 },
  cardIssuer: { fontFamily: Font.regular, fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  metricsRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.background, borderRadius: Radius.row,
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.sm,
  },
  metricDivider: { width: 1, height: 28, backgroundColor: Colors.border },
  seeAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 3, alignSelf: 'flex-start' },
  seeAllText: { fontFamily: Font.semiBold, fontSize: 13, color: Colors.action },

  // Grade pill
  gradePill: { borderRadius: Radius.pill, paddingHorizontal: Spacing.md, paddingVertical: 3, alignItems: 'center' },
  gradePillText: { fontFamily: Font.bold, fontSize: 13, color: '#fff' },

  // Collapsed header
  collapsedHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  collapsedName: { fontFamily: Font.semiBold, fontSize: 14, color: Colors.textPrimary, flex: 1 },
  collapsedFee: { fontFamily: Font.regular, fontSize: 12, color: Colors.textMuted },
  collapsedSummary: { fontFamily: Font.medium, fontSize: 12, color: Colors.textSecondary },

  // Carousel
  carouselScroll: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg, paddingTop: Spacing.xs, gap: Spacing.md },
  artworkTile: {},
  artworkFee: { fontFamily: Font.regular, fontSize: 11, color: Colors.textMuted, marginTop: Spacing.xs, textAlign: 'center' },
  allDoneTile: {
    width: BENEFIT_TILE_WIDTH, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.background, borderRadius: Radius.row,
    padding: Spacing.lg, gap: Spacing.sm, borderWidth: 1, borderColor: Colors.border,
  },
  allDoneText: { fontFamily: Font.semiBold, fontSize: 13, color: Colors.success, textAlign: 'center' },

  benefitTile: {
    width: BENEFIT_TILE_WIDTH,
  },
  benefitTileInner: {
    flex: 1, backgroundColor: Colors.background, borderRadius: Radius.row,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.border,
  },
  benefitTileName: { fontFamily: Font.semiBold, fontSize: 13, color: Colors.textPrimary, marginBottom: Spacing.xs, lineHeight: 18 },
  benefitTileAmount: { fontFamily: Font.bold, fontSize: 18, color: Colors.action, marginBottom: Spacing.xs },
  benefitTileDayBadge: { alignSelf: 'flex-start', borderRadius: Radius.pill, paddingHorizontal: Spacing.sm, paddingVertical: 2 },
  benefitTileDayText: { fontFamily: Font.semiBold, fontSize: 11 },
});
