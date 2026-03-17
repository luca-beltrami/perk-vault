import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Font } from './theme';
import { getCardGradient } from '../data/cardGradients';
import type { Network } from '../types';

interface Props {
  cardId: string;
  cardName: string;
  network: Network;
}

const NETWORK_LABEL: Record<Network, string> = {
  Amex: 'AMEX',
  Visa: 'VISA',
  Mastercard: 'MASTERCARD',
};

export default function CreditCardGraphic({ cardId, cardName, network }: Props) {
  const colors = getCardGradient(cardId);

  return (
    // Outer wrapper carries the drop shadow without clipping the gradient
    <View style={styles.shadow}>
      <LinearGradient
        colors={colors as unknown as [string, string, string]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.card}
      >
        {/* EMV chip */}
        <View style={styles.chip}>
          <View style={styles.chipInner} />
        </View>

        {/* Shimmer line for depth */}
        <View style={styles.shimmer} />

        {/* Card name + network badge */}
        <View style={styles.bottom}>
          <Text style={styles.cardName} numberOfLines={2}>
            {cardName}
          </Text>
          <Text style={styles.network}>{NETWORK_LABEL[network]}</Text>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 6,
  },
  card: {
    aspectRatio: 1.586,
    borderRadius: 12,
    overflow: 'hidden',
    padding: 12,
    justifyContent: 'space-between',
  },
  // EMV chip
  chip: {
    width: 30,
    height: 22,
    backgroundColor: '#C9A84C',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipInner: {
    width: 18,
    height: 13,
    backgroundColor: '#A07820',
    borderRadius: 2,
  },
  // Subtle horizontal shimmer at mid-card
  shimmer: {
    position: 'absolute',
    top: '44%',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  // Bottom row
  bottom: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  cardName: {
    fontFamily: Font.bold,
    fontSize: 10,
    color: '#FFFFFF',
    flex: 1,
    lineHeight: 14,
    marginRight: 6,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  network: {
    fontFamily: Font.bold,
    fontSize: 8,
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
