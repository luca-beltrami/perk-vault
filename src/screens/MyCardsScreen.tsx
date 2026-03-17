import React, { useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  Dimensions,
  ScrollView,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TILE_WIDTH = Math.floor((SCREEN_WIDTH - 32 - 12) / 2);
const PERK_TILE_WIDTH = 148;

import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Font, Radius, Spacing } from '../components/theme';
import { CardsStackParamList } from '../navigation/CardsStack';
import { useAppState } from '../hooks/useAppState';
import { cardLibrary } from '../data/cardLibrary';
import CreditCardGraphic from '../components/CreditCardGraphic';
import {
  resolveAllPerks,
  getCarouselPerks,
  calculateGrade,
  getGradeInfo,
  isPerkCurrentHalf,
  formatDaysRemaining,
  urgencyColor,
} from '../utils/perkUtils';
import type { CarouselPerk } from '../utils/perkUtils';
import type { UserCard } from '../types';

type Props = NativeStackScreenProps<CardsStackParamList, 'MyCards'>;

function getHealthScore(userCard: UserCard): number {
  if (userCard.perks.length === 0) return 1;
  return userCard.perks.filter((p) => p.used).length / userCard.perks.length;
}

export default function MyCardsScreen({ navigation }: Props) {
  const { state } = useAppState();
  const cards = state.cards;
  const now = useRef(new Date()).current;

  const resolvedPerks = useMemo(
    () => resolveAllPerks(state.cards, cardLibrary, now),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.cards],
  );

  const grade = useMemo(() => calculateGrade(resolvedPerks), [resolvedPerks]);
  const gradeInfo = useMemo(() => getGradeInfo(grade), [grade]);

  // Captured = used perks value this period; available = active perk value
  const capturedValue = useMemo(() => {
    let total = 0;
    for (const userCard of state.cards) {
      const libCard = cardLibrary.find((c) => c.id === userCard.cardLibraryId);
      if (!libCard) continue;
      for (const perk of libCard.perks) {
        if (!isPerkCurrentHalf(perk, now)) continue;
        const userPerk = userCard.perks.find((up) => up.perkId === perk.id);
        if (userPerk?.used && perk.amount > 0) total += perk.amount;
      }
    }
    return total;
  }, [state.cards]); // eslint-disable-line react-hooks/exhaustive-deps

  const availableValue = useMemo(
    () => resolvedPerks.reduce((sum, rp) => sum + rp.perk.amount, 0),
    [resolvedPerks],
  );

  // Sort by health score ascending (most urgent = fewest perks used)
  const sortedCards = useMemo(
    () => [...cards].sort((a, b) => getHealthScore(a) - getHealthScore(b)),
    [cards],
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
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation.navigate('CardLibrary')}
          >
            <Text style={styles.addBtnText}>Add your first card</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const ListHeader = (
    <View>
      {/* Summary header */}
      <View style={[styles.summaryCard, { backgroundColor: gradeInfo.bg }]}>
        <View style={styles.summaryLeft}>
          <Text style={styles.summaryEyebrow}>Vault overview</Text>
          <View style={styles.summaryValues}>
            <View style={styles.summaryStatBlock}>
              <Text style={[styles.summaryValue, { color: Colors.success }]}>
                ${capturedValue}
              </Text>
              <Text style={styles.summaryStatLabel}>captured</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryStatBlock}>
              <Text style={[styles.summaryValue, { color: Colors.action }]}>
                ${availableValue}
              </Text>
              <Text style={styles.summaryStatLabel}>available</Text>
            </View>
          </View>
        </View>
        <View style={[styles.summaryGradeBadge, { backgroundColor: gradeInfo.color }]}>
          <Text style={styles.summaryGradeLabel}>YOUR GRADE</Text>
          <Text style={styles.summaryGradeLetter}>{gradeInfo.grade}</Text>
        </View>
      </View>

      {/* Add another card */}
      <TouchableOpacity
        style={styles.addCardRow}
        onPress={() => navigation.navigate('CardLibrary')}
      >
        <Ionicons name="add-circle-outline" size={20} color={Colors.action} />
        <Text style={styles.addCardRowText}>Add another card</Text>
      </TouchableOpacity>
    </View>
  );

  const ListFooter = (
    <View style={styles.carouselsSection}>
      <Text style={styles.carouselsSectionTitle}>Benefits by card</Text>

      {sortedCards.map((userCard) => {
        const libCard = cardLibrary.find((c) => c.id === userCard.cardLibraryId);
        if (!libCard) return null;

        const carouselPerks = getCarouselPerks(userCard, libCard, now);
        const activePerks = carouselPerks.filter((p) => p.status === 'active');

        return (
          <View key={userCard.id} style={styles.carouselCard}>
            <View style={styles.carouselHeader}>
              <View style={styles.carouselHeaderText}>
                <Text style={styles.carouselCardName} numberOfLines={1}>
                  {userCard.name}
                </Text>
                <Text style={styles.carouselIssuer} numberOfLines={1}>
                  {libCard.issuer}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.seeAllBtn}
                onPress={() => navigation.navigate('CardBenefits', { userCardId: userCard.id })}
              >
                <Text style={styles.seeAllText}>See all</Text>
                <Ionicons name="chevron-forward" size={14} color={Colors.action} />
              </TouchableOpacity>
            </View>

            {activePerks.length === 0 ? (
              <View style={styles.carouselEmpty}>
                <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                <Text style={styles.carouselEmptyText}>All perks used this period</Text>
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.carouselScroll}
              >
                {carouselPerks.map((cp) => (
                  <MiniPerkTile key={cp.userPerk.id} cp={cp} />
                ))}
              </ScrollView>
            )}
          </View>
        );
      })}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <FlatList
          data={cards}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          ListHeaderComponent={ListHeader}
          ListFooterComponent={ListFooter}
          renderItem={({ item }) => {
            const libCard = cardLibrary.find((c) => c.id === item.cardLibraryId);
            return (
              <View style={[styles.card, { width: TILE_WIDTH }]}>
                {libCard && (
                  <CreditCardGraphic
                    cardId={libCard.id}
                    cardName={libCard.name}
                    network={libCard.network}
                    width={TILE_WIDTH}
                  />
                )}
                <View style={styles.cardDetails}>
                  <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.cardMeta}>{item.perks.length} perks</Text>
                </View>
              </View>
            );
          }}
        />
      </View>
    </SafeAreaView>
  );
}

// ─── Mini perk tile for carousels ─────────────────────────────────────────────

function MiniPerkTile({ cp }: { cp: CarouselPerk }) {
  const { perk, status, daysRemaining } = cp;
  const isLocked = status === 'locked';
  const isCompleted = status === 'completed';
  const dayColor = daysRemaining != null ? urgencyColor(daysRemaining) : Colors.textMuted;

  return (
    <View
      style={[
        styles.miniTile,
        isLocked && styles.miniTileLocked,
        isCompleted && styles.miniTileCompleted,
      ]}
    >
      {isCompleted && (
        <View style={styles.miniTileIcon}>
          <Ionicons name="checkmark-circle" size={13} color={Colors.success} />
        </View>
      )}
      {isLocked && (
        <View style={styles.miniTileIcon}>
          <Ionicons name="lock-closed-outline" size={12} color={Colors.textMuted} />
        </View>
      )}

      <Text
        style={[styles.miniTileName, (isLocked || isCompleted) && styles.miniTileNameDim]}
        numberOfLines={2}
      >
        {perk.name}
      </Text>

      {perk.amount > 0 && (
        <Text
          style={[styles.miniTileAmount, (isLocked || isCompleted) && styles.miniTileAmountDim]}
        >
          ${perk.amount}
        </Text>
      )}

      {daysRemaining != null && !isCompleted && (
        <View style={[styles.miniDayBadge, { backgroundColor: dayColor + '1A' }]}>
          <Text style={[styles.miniDayText, { color: dayColor }]}>
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
  container: { flex: 1 },

  // Empty state
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxxl,
    gap: Spacing.lg,
  },
  emptyTitle: {
    fontFamily: Font.bold,
    fontSize: 22,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontFamily: Font.regular,
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  addBtn: {
    marginTop: Spacing.sm,
    backgroundColor: Colors.action,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xxxl,
    borderRadius: Radius.pill,
  },
  addBtnText: {
    fontFamily: Font.semiBold,
    fontSize: 16,
    color: Colors.surface,
  },

  // List layout
  list: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxxl },
  row: { gap: 12, marginBottom: Spacing.md },

  // Summary card
  summaryCard: {
    borderRadius: Radius.card,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryLeft: { flex: 1 },
  summaryEyebrow: {
    fontFamily: Font.semiBold,
    fontSize: 11,
    letterSpacing: 1,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
  },
  summaryValues: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  summaryStatBlock: { alignItems: 'flex-start' },
  summaryValue: {
    fontFamily: Font.bold,
    fontSize: 22,
  },
  summaryStatLabel: {
    fontFamily: Font.regular,
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 1,
  },
  summaryDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.border,
  },
  summaryGradeBadge: {
    borderRadius: Radius.card,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    marginLeft: Spacing.lg,
  },
  summaryGradeLabel: {
    fontFamily: Font.semiBold,
    fontSize: 9,
    letterSpacing: 1.5,
    color: 'rgba(255,255,255,0.8)',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  summaryGradeLetter: {
    fontFamily: Font.bold,
    fontSize: 32,
    color: '#fff',
    lineHeight: 36,
  },

  // Add card row
  addCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  addCardRowText: {
    fontFamily: Font.semiBold,
    fontSize: 15,
    color: Colors.action,
  },

  // Card grid tile
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.card,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardDetails: { padding: Spacing.lg },
  cardName: {
    fontFamily: Font.semiBold,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  cardMeta: {
    fontFamily: Font.regular,
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },

  // Carousels section (footer)
  carouselsSection: {
    marginTop: Spacing.xl,
  },
  carouselsSectionTitle: {
    fontFamily: Font.semiBold,
    fontSize: 12,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: Spacing.md,
  },
  carouselCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.card,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  carouselHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  carouselHeaderText: { flex: 1 },
  carouselCardName: {
    fontFamily: Font.semiBold,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  carouselIssuer: {
    fontFamily: Font.regular,
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    fontFamily: Font.semiBold,
    fontSize: 13,
    color: Colors.action,
  },
  carouselEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  carouselEmptyText: {
    fontFamily: Font.regular,
    fontSize: 13,
    color: Colors.textMuted,
  },
  carouselScroll: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    gap: Spacing.sm,
  },

  // Mini perk tile
  miniTile: {
    width: PERK_TILE_WIDTH,
    backgroundColor: Colors.background,
    borderRadius: Radius.row,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  miniTileLocked: { opacity: 0.42 },
  miniTileCompleted: { opacity: 0.52 },
  miniTileIcon: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
  },
  miniTileName: {
    fontFamily: Font.semiBold,
    fontSize: 12,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
    paddingRight: 18,
    lineHeight: 17,
  },
  miniTileNameDim: { color: Colors.textMuted },
  miniTileAmount: {
    fontFamily: Font.bold,
    fontSize: 16,
    color: Colors.action,
    marginBottom: Spacing.xs,
  },
  miniTileAmountDim: { color: Colors.textMuted },
  miniDayBadge: {
    alignSelf: 'flex-start',
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  miniDayText: {
    fontFamily: Font.semiBold,
    fontSize: 11,
  },
});
