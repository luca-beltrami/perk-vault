import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Font, Radius, Spacing } from './theme';
import type { Card, Perk } from '../types';

type Step = 'detail' | 'anniversary' | 'success';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const FREQ_SUFFIX: Record<string, string> = {
  monthly: '/mo',
  quarterly: '/qtr',
  'semi-annual': '/6mo',
  annual: '/yr',
};

interface Props {
  card: Card;
  alreadyAdded: boolean;
  onClose: () => void;
  onAdd: (card: Card, month: number | undefined) => void;
  onGoToVault: () => void;
  onAddAnother: () => void;
}

export default function CardDetailSheet({
  card,
  alreadyAdded,
  onClose,
  onAdd,
  onGoToVault,
  onAddAnother,
}: Props) {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<Step>('detail');
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [showToast, setShowToast] = useState(false);
  const toastOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (showToast) {
      Animated.sequence([
        Animated.timing(toastOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.delay(3500),
        Animated.timing(toastOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start(() => setShowToast(false));
    }
  }, [showToast]);

  function handleAddToVault() {
    setStep('anniversary');
  }

  function handleConfirmMonth() {
    onAdd(card, selectedMonth ?? undefined);
    setStep('success');
  }

  function handleSkip() {
    onAdd(card, undefined);
    setStep('success');
    setShowToast(true);
  }

  const annualFeeLabel = card.annualFee === 0 ? 'No annual fee' : `$${card.annualFee}/yr`;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        {/* Backdrop */}
        <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={onClose} activeOpacity={1} />

        {/* Sheet */}
        <View style={[styles.sheet, { paddingBottom: insets.bottom + Spacing.lg }]}>
          {/* Handle */}
          <View style={styles.handle} />

          {step === 'detail' && (
            <DetailStep
              card={card}
              annualFeeLabel={annualFeeLabel}
              alreadyAdded={alreadyAdded}
              onClose={onClose}
              onAdd={handleAddToVault}
            />
          )}

          {step === 'anniversary' && (
            <AnniversaryStep
              selectedMonth={selectedMonth}
              onSelectMonth={setSelectedMonth}
              onConfirm={handleConfirmMonth}
              onSkip={handleSkip}
            />
          )}

          {step === 'success' && (
            <SuccessStep
              cardName={card.name}
              onAddAnother={onAddAnother}
              onGoToVault={onGoToVault}
            />
          )}
        </View>

        {/* Toast */}
        {showToast && (
          <Animated.View style={[styles.toast, { opacity: toastOpacity, bottom: insets.bottom + 16 }]}>
            <Ionicons name="information-circle-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.toastText}>
              Without a renewal date we won't be able to remind you before your annual fee. Add it later in card settings.
            </Text>
          </Animated.View>
        )}
      </View>
    </Modal>
  );
}

// ─── Detail Step ────────────────────────────────────────────────────────────

function DetailStep({
  card,
  annualFeeLabel,
  alreadyAdded,
  onClose,
  onAdd,
}: {
  card: Card;
  annualFeeLabel: string;
  alreadyAdded: boolean;
  onClose: () => void;
  onAdd: () => void;
}) {
  return (
    <>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.sheetTitle}>{card.name}</Text>
          <Text style={styles.sheetSubtitle}>
            {annualFeeLabel}{'  ·  '}{card.perks.length} perks
          </Text>
        </View>
        <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="close" size={22} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Perk list */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {card.perks.map((perk) => (
          <PerkRow key={perk.id} perk={perk} />
        ))}
      </ScrollView>

      {/* CTA */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.ctaBtn, alreadyAdded && styles.ctaBtnDisabled]}
          onPress={alreadyAdded ? undefined : onAdd}
          activeOpacity={alreadyAdded ? 1 : 0.8}
        >
          <Text style={styles.ctaBtnText}>
            {alreadyAdded ? 'Already in your vault' : 'Add to My Vault'}
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

function PerkRow({ perk }: { perk: Perk }) {
  const amountLabel =
    perk.amount > 0
      ? `$${perk.amount % 1 === 0 ? perk.amount : perk.amount.toFixed(2)}${FREQ_SUFFIX[perk.frequency]}`
      : null;
  const periodTag = perk.isH1 ? 'Jan–Jun' : perk.isH2 ? 'Jul–Dec' : null;

  return (
    <View style={styles.perkRow}>
      <View style={styles.perkTop}>
        <Text style={styles.perkName}>{perk.name}</Text>
        <View style={styles.perkBadges}>
          {periodTag && (
            <View style={styles.pill}>
              <Text style={styles.pillText}>{periodTag}</Text>
            </View>
          )}
          {amountLabel && <Text style={styles.perkAmount}>{amountLabel}</Text>}
        </View>
      </View>
      <Text style={styles.perkDesc}>{perk.description}</Text>
    </View>
  );
}

// ─── Anniversary Step ────────────────────────────────────────────────────────

function AnniversaryStep({
  selectedMonth,
  onSelectMonth,
  onConfirm,
  onSkip,
}: {
  selectedMonth: number | null;
  onSelectMonth: (m: number) => void;
  onConfirm: () => void;
  onSkip: () => void;
}) {
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>When is your annual fee due?</Text>
      <Text style={styles.stepSubtitle}>
        We use this to remind you before it hits — so you have time to cancel if the card hasn't paid for itself.
      </Text>

      <View style={styles.helperRow}>
        <Ionicons name="card-outline" size={16} color={Colors.textMuted} style={{ marginTop: 1 }} />
        <Text style={styles.helperText}>
          Not sure? The expiry month on the front of your card is usually your anniversary month.
        </Text>
      </View>

      {/* Month grid */}
      <View style={styles.monthGrid}>
        {MONTHS.map((month, i) => {
          const num = i + 1;
          const selected = selectedMonth === num;
          return (
            <TouchableOpacity
              key={month}
              style={[styles.monthBtn, selected && styles.monthBtnSelected]}
              onPress={() => onSelectMonth(num)}
              activeOpacity={0.7}
            >
              <Text style={[styles.monthText, selected && styles.monthTextSelected]}>
                {month}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.ctaBtn, !selectedMonth && styles.ctaBtnDisabled]}
          onPress={selectedMonth ? onConfirm : undefined}
          activeOpacity={selectedMonth ? 0.8 : 1}
        >
          <Text style={styles.ctaBtnText}>
            {selectedMonth ? `Set to ${MONTHS[selectedMonth - 1]}` : 'Select a month'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.skipBtn} onPress={onSkip}>
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Success Step ────────────────────────────────────────────────────────────

function SuccessStep({
  cardName,
  onAddAnother,
  onGoToVault,
}: {
  cardName: string;
  onAddAnother: () => void;
  onGoToVault: () => void;
}) {
  return (
    <View style={styles.successContainer}>
      <View style={styles.successIcon}>
        <Ionicons name="checkmark-circle" size={56} color={Colors.success} />
      </View>
      <Text style={styles.successTitle}>Card added to your vault</Text>
      <Text style={styles.successSubtitle}>{cardName} is ready to track.</Text>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.ctaBtn} onPress={onGoToVault} activeOpacity={0.8}>
          <Text style={styles.ctaBtnText}>Go to my vault</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.skipBtn} onPress={onAddAnother}>
          <Text style={styles.skipText}>Add another card</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '88%',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerLeft: { flex: 1 },
  sheetTitle: {
    fontFamily: Font.bold,
    fontSize: 20,
    color: Colors.textPrimary,
  },
  sheetSubtitle: {
    fontFamily: Font.regular,
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },

  // Perk list
  scrollArea: { flexShrink: 1 },
  scrollContent: { paddingHorizontal: Spacing.xxl, paddingTop: Spacing.md, paddingBottom: Spacing.sm },
  perkRow: {
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  perkTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  perkName: {
    fontFamily: Font.semiBold,
    fontSize: 14,
    color: Colors.textPrimary,
    flex: 1,
  },
  perkBadges: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  pill: {
    backgroundColor: Colors.background,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  pillText: {
    fontFamily: Font.medium,
    fontSize: 11,
    color: Colors.textSecondary,
  },
  perkAmount: {
    fontFamily: Font.semiBold,
    fontSize: 14,
    color: Colors.accent,
  },
  perkDesc: {
    fontFamily: Font.regular,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },

  // Footer / CTA
  footer: {
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.lg,
    gap: Spacing.md,
  },
  ctaBtn: {
    backgroundColor: Colors.action,
    borderRadius: Radius.pill,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  ctaBtnDisabled: {
    backgroundColor: Colors.border,
  },
  ctaBtnText: {
    fontFamily: Font.semiBold,
    fontSize: 16,
    color: Colors.surface,
  },
  skipBtn: { alignItems: 'center', paddingVertical: Spacing.sm },
  skipText: {
    fontFamily: Font.medium,
    fontSize: 15,
    color: Colors.textMuted,
  },

  // Anniversary step
  stepContainer: { paddingHorizontal: Spacing.xxl, paddingTop: Spacing.xl },
  stepTitle: {
    fontFamily: Font.bold,
    fontSize: 22,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  stepSubtitle: {
    fontFamily: Font.regular,
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  helperRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    backgroundColor: Colors.background,
    borderRadius: Radius.row,
    padding: Spacing.md,
    marginBottom: Spacing.xxl,
  },
  helperText: {
    fontFamily: Font.regular,
    fontSize: 13,
    color: Colors.textMuted,
    flex: 1,
    lineHeight: 19,
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.xxl,
  },
  monthBtn: {
    width: '30%',
    paddingVertical: Spacing.md,
    borderRadius: Radius.row,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
  monthBtnSelected: {
    backgroundColor: Colors.action,
    borderColor: Colors.action,
  },
  monthText: {
    fontFamily: Font.medium,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  monthTextSelected: {
    color: Colors.surface,
    fontFamily: Font.semiBold,
  },

  // Success step
  successContainer: {
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.xxxl,
    alignItems: 'center',
  },
  successIcon: { marginBottom: Spacing.lg },
  successTitle: {
    fontFamily: Font.bold,
    fontSize: 22,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  successSubtitle: {
    fontFamily: Font.regular,
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xxxl,
  },

  // Toast
  toast: {
    position: 'absolute',
    left: Spacing.lg,
    right: Spacing.lg,
    backgroundColor: Colors.toastBg,
    borderRadius: Radius.row,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  toastText: {
    fontFamily: Font.regular,
    fontSize: 13,
    color: '#fff',
    flex: 1,
    lineHeight: 19,
  },
});
