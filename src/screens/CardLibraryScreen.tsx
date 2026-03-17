import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  SectionList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Font, Radius, Spacing } from '../components/theme';
import { CardsStackParamList } from '../navigation/CardsStack';
import { cardLibrary } from '../data/cardLibrary';
import { useAppState } from '../hooks/useAppState';
import { uuid } from '../utils/uuid';
import type { Card } from '../types';
import type { UserCard } from '../types';
import CardDetailSheet from '../components/CardDetailSheet';

type Props = NativeStackScreenProps<CardsStackParamList, 'CardLibrary'>;

function groupByIssuer(cards: Card[]) {
  const map: Record<string, Card[]> = {};
  for (const card of cards) {
    if (!map[card.issuer]) map[card.issuer] = [];
    map[card.issuer].push(card);
  }
  return Object.entries(map).map(([title, data]) => ({ title, data }));
}

export default function CardLibraryScreen({ navigation }: Props) {
  const [query, setQuery] = useState('');
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const { state, setState } = useAppState();

  const sections = useMemo(() => {
    const lower = query.toLowerCase().trim();
    const filtered = lower
      ? cardLibrary.filter(
          (c) =>
            c.name.toLowerCase().includes(lower) ||
            c.issuer.toLowerCase().includes(lower),
        )
      : cardLibrary;
    return groupByIssuer(filtered);
  }, [query]);

  const addedIds = useMemo(
    () => new Set(state.cards.map((c) => c.cardLibraryId)),
    [state.cards],
  );

  const handleAdd = useCallback(
    (card: Card, month: number | undefined) => {
      const newCard: UserCard = {
        id: uuid(),
        cardLibraryId: card.id,
        name: card.name,
        colorIdx: 0,
        anniversaryMonth: month,
        perks: card.perks.map((p) => ({
          id: uuid(),
          perkId: p.id,
          used: false,
          skipped: false,
        })),
      };
      setState({ ...state, cards: [...state.cards, newCard] });
    },
    [state, setState],
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Search bar */}
        <View style={styles.searchWrapper}>
          <Ionicons name="search-outline" size={18} color={Colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search cards or issuers…"
            placeholderTextColor={Colors.textMuted}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
        </View>

        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionHeader}>{section.title}</Text>
          )}
          renderItem={({ item, index, section }) => {
            const isLast = index === section.data.length - 1;
            const isAdded = addedIds.has(item.id);
            return (
              <TouchableOpacity
                style={[styles.row, isLast && styles.rowLast]}
                onPress={() => setSelectedCard(item)}
                activeOpacity={0.6}
              >
                <View style={styles.rowLeft}>
                  <Text style={styles.cardName}>{item.name}</Text>
                  <Text style={styles.cardMeta}>
                    {item.annualFee === 0 ? 'No annual fee' : `$${item.annualFee}/yr`}
                    {'  ·  '}
                    {item.perks.length} perks
                    {isAdded ? '  ·  In vault' : ''}
                  </Text>
                </View>
                {isAdded ? (
                  <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                ) : (
                  <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
                )}
              </TouchableOpacity>
            );
          }}
          renderSectionFooter={() => <View style={styles.sectionGap} />}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No cards match "{query}"</Text>
          }
        />

        {selectedCard && (
          <CardDetailSheet
            card={selectedCard}
            alreadyAdded={addedIds.has(selectedCard.id)}
            onClose={() => setSelectedCard(null)}
            onAdd={handleAdd}
            onGoToVault={() => {
              setSelectedCard(null);
              navigation.goBack();
            }}
            onAddAnother={() => setSelectedCard(null)}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1 },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.input,
    borderWidth: 1,
    borderColor: Colors.border,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  searchIcon: { marginRight: Spacing.sm },
  searchInput: {
    flex: 1,
    height: 44,
    fontFamily: Font.regular,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  listContent: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxxl },
  sectionHeader: {
    fontFamily: Font.semiBold,
    fontSize: 13,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  row: {
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowLeft: { flex: 1, marginRight: Spacing.sm },
  cardName: {
    fontFamily: Font.semiBold,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  cardMeta: {
    fontFamily: Font.regular,
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  sectionGap: { height: Spacing.xs },
  emptyText: {
    fontFamily: Font.regular,
    fontSize: 15,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.xxxl,
  },
});
