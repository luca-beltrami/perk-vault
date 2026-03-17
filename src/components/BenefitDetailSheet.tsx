import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Font, Radius, Spacing } from './theme';
import { getCardGradient } from '../data/cardGradients';
import { formatDaysRemaining, urgencyColor } from '../utils/perkUtils';
import type { ResolvedPerk } from '../utils/perkUtils';

interface Props {
  resolvedPerk: ResolvedPerk;
  onClose: () => void;
  onMarkUsed: () => void;
  onSkip: () => void;
}

const FREQ_LABEL: Record<string, string> = {
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  'semi-annual': 'Semi-annual',
  annual: 'Annual',
};

export default function BenefitDetailSheet({ resolvedPerk, onClose, onMarkUsed, onSkip }: Props) {
  const { perk, libCard, userCard, daysRemaining } = resolvedPerk;
  const gradientColors = getCardGradient(libCard.id);
  const dayColor = urgencyColor(daysRemaining);

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        {/* Drag handle */}
        <View style={styles.handle} />

        {/* Card colour badge */}
        <LinearGradient
          colors={gradientColors as unknown as [string, string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.cardBadge}
        >
          <Text style={styles.cardBadgeName} numberOfLines={1}>{libCard.name}</Text>
          <Text style={styles.cardBadgeNickname} numberOfLines={1}>{userCard.name}</Text>
        </LinearGradient>

        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Perk name + amount */}
          <View style={styles.titleRow}>
            <Text style={styles.perkName}>{perk.name}</Text>
            {perk.amount > 0 && (
              <Text style={styles.perkAmount}>${perk.amount}</Text>
            )}
          </View>

          {/* Badges */}
          <View style={styles.badges}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{FREQ_LABEL[perk.frequency]}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: dayColor + '1A' }]}>
              <Text style={[styles.badgeText, { color: dayColor }]}>
                {formatDaysRemaining(daysRemaining)}
              </Text>
            </View>
          </View>

          {/* Description */}
          <Text style={styles.description}>{perk.description}</Text>
        </ScrollView>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.skipBtn} onPress={onSkip}>
            <Text style={styles.skipText}>Skip for now</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.usedBtn} onPress={onMarkUsed}>
            <Ionicons name="checkmark-circle" size={18} color="#fff" style={{ marginRight: 6 }} />
            <Text style={styles.usedText}>Mark as used</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 34,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  cardBadge: {
    marginHorizontal: Spacing.lg,
    borderRadius: Radius.card,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  cardBadgeName: {
    fontFamily: Font.bold,
    fontSize: 14,
    color: '#fff',
  },
  cardBadgeNickname: {
    fontFamily: Font.regular,
    fontSize: 12,
    color: 'rgba(255,255,255,0.72)',
    marginTop: 2,
  },
  body: {
    maxHeight: 260,
  },
  bodyContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  perkName: {
    fontFamily: Font.bold,
    fontSize: 20,
    color: Colors.textPrimary,
    flex: 1,
    marginRight: Spacing.md,
    lineHeight: 26,
  },
  perkAmount: {
    fontFamily: Font.bold,
    fontSize: 22,
    color: Colors.action,
  },
  badges: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  badge: {
    backgroundColor: Colors.border,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  badgeText: {
    fontFamily: Font.medium,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  description: {
    fontFamily: Font.regular,
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    gap: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  skipBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.pill,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipText: {
    fontFamily: Font.semiBold,
    fontSize: 15,
    color: Colors.textSecondary,
  },
  usedBtn: {
    flex: 2,
    backgroundColor: Colors.action,
    borderRadius: Radius.pill,
    paddingVertical: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  usedText: {
    fontFamily: Font.semiBold,
    fontSize: 15,
    color: '#fff',
  },
});
