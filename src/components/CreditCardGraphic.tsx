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
  /** Pixel width of the graphic — all dimensions scale from this. */
  width: number;
}

const NETWORK_LABEL: Record<Network, string> = {
  Amex: 'AMEX',
  Visa: 'VISA',
  Mastercard: 'MASTERCARD',
};

export default function CreditCardGraphic({ cardId, cardName, network, width }: Props) {
  const colors = getCardGradient(cardId);

  // All sizes derived proportionally from width
  const height      = width / 1.586;
  const pad         = Math.round(width * 0.07);
  const chipW       = Math.round(width * 0.18);
  const chipH       = Math.round(chipW * 0.73);
  const chipInnerW  = Math.round(chipW * 0.60);
  const chipInnerH  = Math.round(chipH * 0.59);
  const shimmerTop  = Math.round(height * 0.44);
  const nameFontSize    = Math.round(width * 0.12);
  const networkFontSize = Math.round(width * 0.08);

  return (
    <View style={[styles.shadow, { width, borderRadius: 12 }]}>
      <LinearGradient
        colors={colors as unknown as [string, string, string]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={{ width, height, borderRadius: 12, overflow: 'hidden', padding: pad, justifyContent: 'space-between' }}
      >
        {/* EMV chip */}
        <View style={{
          width: chipW, height: chipH,
          backgroundColor: '#C9A84C', borderRadius: 4,
          justifyContent: 'center', alignItems: 'center',
        }}>
          <View style={{
            width: chipInnerW, height: chipInnerH,
            backgroundColor: '#A07820', borderRadius: 2,
          }} />
        </View>

        {/* Shimmer line */}
        <View style={{
          position: 'absolute', top: shimmerTop,
          left: 0, right: 0, height: 1,
          backgroundColor: 'rgba(255,255,255,0.18)',
        }} />

        {/* Card name + network badge */}
        <View style={styles.bottom}>
          <Text
            style={{
              fontFamily: Font.bold,
              fontSize: nameFontSize,
              color: '#FFFFFF',
              flex: 1,
              lineHeight: Math.round(nameFontSize * 1.25),
              marginRight: Math.round(width * 0.04),
              textShadowColor: 'rgba(0,0,0,0.3)',
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: 2,
            }}
            numberOfLines={2}
          >
            {cardName}
          </Text>
          <Text style={{
            fontFamily: Font.bold,
            fontSize: networkFontSize,
            color: 'rgba(255,255,255,0.85)',
            letterSpacing: 1,
            textShadowColor: 'rgba(0,0,0,0.3)',
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 2,
          }}>
            {NETWORK_LABEL[network]}
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 6,
  },
  bottom: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
});
