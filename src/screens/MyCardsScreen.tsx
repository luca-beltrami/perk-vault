import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  Dimensions,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TILE_WIDTH = Math.floor((SCREEN_WIDTH - 32 - 12) / 2);
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Font, Radius, Spacing } from '../components/theme';
import { CardsStackParamList } from '../navigation/CardsStack';
import { useAppState } from '../hooks/useAppState';
import { cardLibrary } from '../data/cardLibrary';
import CreditCardGraphic from '../components/CreditCardGraphic';

type Props = NativeStackScreenProps<CardsStackParamList, 'MyCards'>;

export default function MyCardsScreen({ navigation }: Props) {
  const { state } = useAppState();
  const cards = state.cards;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {cards.length === 0 ? (
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
        ) : (
          <FlatList
            data={cards}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.list}
            ListHeaderComponent={
              <TouchableOpacity
                style={styles.addCardRow}
                onPress={() => navigation.navigate('CardLibrary')}
              >
                <Ionicons name="add-circle-outline" size={20} color={Colors.action} />
                <Text style={styles.addCardRowText}>Add another card</Text>
              </TouchableOpacity>
            }
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
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1 },
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
  list: { padding: Spacing.lg },
  row: { gap: 12, marginBottom: Spacing.md },
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
  cardDetails: {
    padding: Spacing.lg,
  },
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
});
