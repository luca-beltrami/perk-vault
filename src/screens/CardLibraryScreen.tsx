import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import AddChallengeSheet from '../components/AddChallengeSheet';
import type { VaultCardOption } from '../components/AddChallengeSheet';
import type { BonusChallenge } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
// 16px padding each side + 12px gap between the two columns
const TILE_WIDTH = Math.floor((SCREEN_WIDTH - 32 - 12) / 2);
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Font, Radius, Spacing } from '../components/theme';
import { CardsStackParamList } from '../navigation/CardsStack';
import { cardLibrary } from '../data/cardLibrary';
import { useAppState } from '../hooks/useAppState';
import { uuid } from '../utils/uuid';
import type { Card, UserCard } from '../types';
import CardDetailSheet from '../components/CardDetailSheet';
import CardTile from '../components/CardTile';

type Props = NativeStackScreenProps<CardsStackParamList, 'CardLibrary'>;

// ─── Sorting / grouping ──────────────────────────────────────────────────────

function getHealthScore(userCard: UserCard): number {
  if (userCard.perks.length === 0) return 1;
  return userCard.perks.filter((p) => p.used).length / userCard.perks.length;
}

type DisplaySection = { title: string | null; cards: Card[] };

function buildSections(
  all: Card[],
  query: string,
  userCards: UserCard[],
): DisplaySection[] {
  const lower = query.toLowerCase().trim();
  const filtered = lower
    ? all.filter(
        (c) =>
          c.name.toLowerCase().includes(lower) ||
          c.issuer.toLowerCase().includes(lower),
      )
    : all;

  if (userCards.length === 0) {
    // No vault cards → group by issuer, alphabetical within each group
    const sorted = [...filtered].sort(
      (a, b) => a.issuer.localeCompare(b.issuer) || a.name.localeCompare(b.name),
    );
    const map: Record<string, Card[]> = {};
    for (const card of sorted) {
      if (!map[card.issuer]) map[card.issuer] = [];
      map[card.issuer].push(card);
    }
    return Object.entries(map).map(([title, cards]) => ({ title, cards }));
  }

  // Has vault cards → flat list, vault cards sorted by health score (lowest first),
  // then non-vault cards sorted alphabetically
  const vaultMap = new Map(userCards.map((uc) => [uc.cardLibraryId, uc]));
  const sorted = [...filtered].sort((a, b) => {
    const ucA = vaultMap.get(a.id);
    const ucB = vaultMap.get(b.id);
    if (ucA && ucB) return getHealthScore(ucA) - getHealthScore(ucB);
    if (ucA) return -1;
    if (ucB) return 1;
    return a.issuer.localeCompare(b.issuer) || a.name.localeCompare(b.name);
  });

  return [{ title: null, cards: sorted }];
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function CardLibraryScreen({ navigation }: Props) {
  const [query, setQuery] = useState('');
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [challengePrefill, setChallengePrefill] = useState<{ cardId: string } | null>(null);
  const { state, setState } = useAppState();

  const sections = useMemo(
    () => buildSections(cardLibrary, query, state.cards),
    [query, state.cards],
  );

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

  // Called from the bonus challenge prompt step in CardDetailSheet
  const handleAddChallenge = useCallback((libraryCardId: string) => {
    // Find the newly added user card for this library card
    const userCard = state.cards.find((uc) => uc.cardLibraryId === libraryCardId);
    setSelectedCard(null);
    setChallengePrefill({ cardId: userCard?.id ?? '' });
  }, [state.cards]);

  const handleSaveChallenge = useCallback((challenge: BonusChallenge) => {
    setState({ ...state, challenges: [...state.challenges, challenge] });
    setChallengePrefill(null);
  }, [state, setState]);

  const vaultCards = useMemo<VaultCardOption[]>(
    () => state.cards.map((uc) => {
      const lib = cardLibrary.find((lc) => lc.id === uc.cardLibraryId);
      return { id: uc.id, name: uc.name || lib?.name || '', issuer: lib?.issuer ?? '' };
    }).filter((vc) => vc.name),
    [state.cards],
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Search bar */}
        <View style={styles.searchWrapper}>
          <Ionicons
            name="search-outline"
            size={18}
            color={Colors.textMuted}
            style={styles.searchIcon}
          />
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

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {sections.length === 0 && (
            <Text style={styles.emptyText}>No cards match "{query}"</Text>
          )}

          {sections.map((section, si) => (
            <View key={si}>
              {section.title !== null && (
                <Text style={styles.sectionHeader}>{section.title}</Text>
              )}
              <View style={styles.grid}>
                {section.cards.map((card) => (
                  <CardTile
                    key={card.id}
                    card={card}
                    isAdded={addedIds.has(card.id)}
                    onPress={() => setSelectedCard(card)}
                    width={TILE_WIDTH}
                  />
                ))}
              </View>
            </View>
          ))}
        </ScrollView>

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
            onAddChallenge={(libraryCardId) => handleAddChallenge(libraryCardId)}
          />
        )}

        <AddChallengeSheet
          visible={challengePrefill != null}
          onClose={() => setChallengePrefill(null)}
          onSave={handleSaveChallenge}
          vaultCards={vaultCards}
          prefilledCardId={challengePrefill?.cardId}
        />
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

  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },

  sectionHeader: {
    fontFamily: Font.semiBold,
    fontSize: 13,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  emptyText: {
    fontFamily: Font.regular,
    fontSize: 15,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.xxxl,
  },
});
