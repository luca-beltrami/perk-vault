import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Font, Radius, Spacing } from './theme';
import type { Card } from '../types';

interface Props {
  card: Card;
  isAdded: boolean;
  onPress: () => void;
}

export default function CardTile({ card, isAdded, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.tile} onPress={onPress} activeOpacity={0.7}>
      {/* Coloured accent bar — rounded top corners match card radius */}
      <View style={[styles.accentBar, { backgroundColor: card.color }]} />

      <View style={styles.content}>
        <Text style={styles.cardName} numberOfLines={2}>
          {card.name}
        </Text>
        <Text style={styles.issuer} numberOfLines={1}>
          {card.issuer}
        </Text>
        <View style={styles.footer}>
          <Text style={styles.fee}>
            {card.annualFee === 0 ? 'No annual fee' : `$${card.annualFee}/yr`}
          </Text>
          {isAdded && (
            <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: '48%',
    backgroundColor: Colors.surface,
    borderRadius: Radius.card,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  accentBar: {
    height: 4,
    borderTopLeftRadius: Radius.card,
    borderTopRightRadius: Radius.card,
  },
  content: {
    padding: Spacing.md,
  },
  cardName: {
    fontFamily: Font.semiBold,
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 20,
    marginBottom: Spacing.xs,
  },
  issuer: {
    fontFamily: Font.regular,
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fee: {
    fontFamily: Font.medium,
    fontSize: 13,
    color: Colors.textSecondary,
  },
});
