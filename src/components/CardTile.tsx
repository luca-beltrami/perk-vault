import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Font, Radius, Spacing } from './theme';
import CreditCardGraphic from './CreditCardGraphic';
import type { Card } from '../types';

interface Props {
  card: Card;
  isAdded: boolean;
  onPress: () => void;
}

export default function CardTile({ card, isAdded, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.tile} onPress={onPress} activeOpacity={0.7}>
      <CreditCardGraphic
        cardId={card.id}
        cardName={card.name}
        network={card.network}
      />

      <View style={styles.content}>
        <Text style={styles.issuer} numberOfLines={1}>
          {card.issuer}
        </Text>
        <View style={styles.footer}>
          <Text style={styles.fee}>
            {card.annualFee === 0 ? 'No fee' : `$${card.annualFee}/yr`}
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
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  content: {
    padding: Spacing.sm,
  },
  issuer: {
    fontFamily: Font.regular,
    fontSize: 11,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
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
