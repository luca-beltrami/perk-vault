import React, { useMemo, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Font, Radius, Spacing } from '../components/theme';
import CreditCardGraphic from '../components/CreditCardGraphic';
import BenefitDetailSheet from '../components/BenefitDetailSheet';
import { CardsStackParamList } from '../navigation/CardsStack';
import { useAppState } from '../hooks/useAppState';
import { cardLibrary } from '../data/cardLibrary';
import {
  getCarouselPerks,
  resolveAllPerks,
  formatDaysRemaining,
  urgencyColor,
} from '../utils/perkUtils';
import type { ResolvedPerk, CarouselPerk } from '../utils/perkUtils';

type Props = NativeStackScreenProps<CardsStackParamList, 'CardBenefits'>;

const CARD_WIDTH = 200;

const FREQ_LABEL: Record<string, string> = {
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  'semi-annual': 'Semi-annual',
  annual: 'Annual',
};

export default function CardBenefitsScreen({ route, navigation }: Props) {
  const { userCardId } = route.params;
  const { state, setState } = useAppState();
  const now = useRef(new Date()).current;

  const [selectedPerk, setSelectedPerk] = useState<ResolvedPerk | null>(null);

  const userCard = state.cards.find((c) => c.id === userCardId);
  const libCard = userCard ? cardLibrary.find((c) => c.id === userCard.cardLibraryId) : undefined;

  const resolvedPerks = useMemo(
    () => resolveAllPerks(state.cards, cardLibrary, now),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.cards],
  );

  const carouselPerks = useMemo(() => {
    if (!userCard || !libCard) return [];
    return getCarouselPerks(userCard, libCard, now);
  }, [userCard, libCard, state.cards]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update header title with card name
  React.useLayoutEffect(() => {
    if (userCard) {
      navigation.setOptions({ title: userCard.name });
    }
  }, [userCard?.name]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleMarkUsed = useCallback(
    (rp: ResolvedPerk) => {
      setState({
        ...state,
        cards: state.cards.map((c) =>
          c.id !== rp.userCard.id
            ? c
            : {
                ...c,
                perks: c.perks.map((up) =>
                  up.id !== rp.userPerk.id
                    ? up
                    : { ...up, used: true, usedAt: new Date().toISOString() },
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
      setState({
        ...state,
        cards: state.cards.map((c) =>
          c.id !== rp.userCard.id
            ? c
            : {
                ...c,
                perks: c.perks.map((up) =>
                  up.id !== rp.userPerk.id ? up : { ...up, skipped: true },
                ),
              },
        ),
        lastUpdated: new Date().toISOString(),
      });
      setSelectedPerk(null);
    },
    [state, setState],
  );

  if (!userCard || !libCard) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>Card not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const active = carouselPerks.filter((p) => p.status === 'active');
  const completed = carouselPerks.filter((p) => p.status === 'completed');
  const locked = carouselPerks.filter((p) => p.status === 'locked');

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Card graphic + info */}
        <View style={styles.cardHeader}>
          <CreditCardGraphic
            cardId={libCard.id}
            cardName={libCard.name}
            network={libCard.network}
            width={CARD_WIDTH}
          />
          <View style={styles.cardInfo}>
            <Text style={styles.cardInfoName}>{userCard.name}</Text>
            <Text style={styles.cardInfoIssuer}>{libCard.issuer}</Text>
            <Text style={styles.cardInfoFee}>
              {libCard.annualFee === 0 ? 'No annual fee' : `$${libCard.annualFee}/yr`}
            </Text>
            <View style={styles.progressRow}>
              <Text style={styles.progressText}>
                {completed.length}/{active.length + completed.length} done
              </Text>
            </View>
          </View>
        </View>

        {/* Active perks */}
        {active.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Available now</Text>
            {active.map((cp) => {
              const rp = resolvedPerks.find((r) => r.userPerk.id === cp.userPerk.id);
              return (
                <BenefitListRow
                  key={cp.userPerk.id}
                  cp={cp}
                  onPress={rp ? () => setSelectedPerk(rp) : undefined}
                />
              );
            })}
          </View>
        )}

        {/* Completed perks */}
        {completed.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Used this period</Text>
            {completed.map((cp) => (
              <BenefitListRow key={cp.userPerk.id} cp={cp} />
            ))}
          </View>
        )}

        {/* Locked (other half) perks */}
        {locked.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Other half</Text>
            {locked.map((cp) => (
              <BenefitListRow key={cp.userPerk.id} cp={cp} />
            ))}
          </View>
        )}
      </ScrollView>

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

// ─── Benefit list row ─────────────────────────────────────────────────────────

function BenefitListRow({
  cp,
  onPress,
}: {
  cp: CarouselPerk;
  onPress?: () => void;
}) {
  const { perk, status, daysRemaining } = cp;
  const isLocked = status === 'locked';
  const isCompleted = status === 'completed';
  const dayColor = daysRemaining != null ? urgencyColor(daysRemaining) : Colors.textMuted;

  return (
    <TouchableOpacity
      style={[
        styles.benefitRow,
        (isLocked || isCompleted) && styles.benefitRowDim,
      ]}
      onPress={onPress}
      activeOpacity={onPress ? 0.72 : 1}
    >
      <View style={styles.benefitLeft}>
        <Text style={styles.benefitName} numberOfLines={1}>{perk.name}</Text>
        <Text style={styles.benefitFreq}>{FREQ_LABEL[perk.frequency]}</Text>
      </View>

      <View style={styles.benefitRight}>
        {perk.amount > 0 && (
          <Text style={[styles.benefitAmount, (isLocked || isCompleted) && styles.benefitAmountDim]}>
            ${perk.amount}
          </Text>
        )}

        {isCompleted && (
          <View style={styles.completedBadge}>
            <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
            <Text style={styles.completedBadgeText}>Used</Text>
          </View>
        )}

        {isLocked && (
          <View style={styles.lockedBadge}>
            <Ionicons name="lock-closed-outline" size={12} color={Colors.textMuted} />
            <Text style={styles.lockedBadgeText}>
              {perk.isH1 ? 'H1' : 'H2'}
            </Text>
          </View>
        )}

        {!isCompleted && !isLocked && daysRemaining != null && (
          <View style={[styles.dayBadge, { backgroundColor: dayColor }]}>
            <Text style={styles.dayBadgeText}>{formatDaysRemaining(daysRemaining)}</Text>
          </View>
        )}

        {!isCompleted && !isLocked && onPress && (
          <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
        )}
      </View>
    </TouchableOpacity>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: 48 },

  errorBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontFamily: Font.regular,
    fontSize: 15,
    color: Colors.textMuted,
  },

  // Card header
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.lg,
    gap: Spacing.lg,
    backgroundColor: Colors.surface,
    marginBottom: Spacing.md,
  },
  cardInfo: {
    flex: 1,
    paddingTop: Spacing.xs,
  },
  cardInfoName: {
    fontFamily: Font.bold,
    fontSize: 17,
    color: Colors.textPrimary,
    marginBottom: 3,
    lineHeight: 22,
  },
  cardInfoIssuer: {
    fontFamily: Font.regular,
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
  },
  cardInfoFee: {
    fontFamily: Font.medium,
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  progressRow: {},
  progressText: {
    fontFamily: Font.semiBold,
    fontSize: 13,
    color: Colors.action,
  },

  // Sections
  section: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontFamily: Font.semiBold,
    fontSize: 12,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },

  // Benefit rows
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  benefitRowDim: { opacity: 0.55 },
  benefitLeft: { flex: 1, marginRight: Spacing.md },
  benefitName: {
    fontFamily: Font.semiBold,
    fontSize: 15,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  benefitFreq: {
    fontFamily: Font.regular,
    fontSize: 12,
    color: Colors.textMuted,
  },
  benefitRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  benefitAmount: {
    fontFamily: Font.bold,
    fontSize: 16,
    color: Colors.action,
  },
  benefitAmountDim: { color: Colors.textMuted },

  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F0FDF4',
    borderRadius: Radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  completedBadgeText: {
    fontFamily: Font.semiBold,
    fontSize: 12,
    color: Colors.success,
  },

  lockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.border,
    borderRadius: Radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  lockedBadgeText: {
    fontFamily: Font.semiBold,
    fontSize: 12,
    color: Colors.textMuted,
  },

  dayBadge: {
    borderRadius: Radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  dayBadgeText: {
    fontFamily: Font.bold,
    fontSize: 11,
    color: '#fff',
  },
});
