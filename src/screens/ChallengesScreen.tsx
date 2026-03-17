import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors, Font, Radius, Spacing } from '../components/theme';
import { useAppState } from '../hooks/useAppState';
import { cardLibrary } from '../data/cardLibrary';
import AddChallengeSheet from '../components/AddChallengeSheet';
import type { VaultCardOption } from '../components/AddChallengeSheet';
import type { BonusChallenge } from '../types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

export { challengeUrgencyColor, getDaysToDeadline } from '../utils/challengeUtils';
import { challengeUrgencyColor, getDaysToDeadline } from '../utils/challengeUtils';

function formatDeadline(deadline: string): string {
  return new Date(deadline).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ChallengesScreen() {
  const navigation = useNavigation();
  const { state, setState } = useAppState();
  const now = useRef(new Date()).current;

  const [showAdd, setShowAdd] = useState(false);
  const [completedExpanded, setCompletedExpanded] = useState(false);

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={() => setShowAdd(true)} style={styles.headerAddBtn}>
          <Ionicons name="add" size={26} color={Colors.action} />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const active = useMemo(
    () => [...state.challenges]
      .filter((c) => !c.completed)
      .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()),
    [state.challenges],
  );

  const completed = useMemo(
    () => state.challenges.filter((c) => c.completed),
    [state.challenges],
  );

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleAdd = useCallback((challenge: BonusChallenge) => {
    setState({ ...state, challenges: [...state.challenges, challenge] });
    setShowAdd(false);
  }, [state, setState]);

  const handleMarkComplete = useCallback((id: string) => {
    setState({
      ...state,
      challenges: state.challenges.map((c) =>
        c.id !== id ? c : { ...c, completed: true },
      ),
    });
  }, [state, setState]);

  const handleUndo = useCallback((id: string) => {
    setState({
      ...state,
      challenges: state.challenges.map((c) =>
        c.id !== id ? c : { ...c, completed: false },
      ),
    });
  }, [state, setState]);

  const handleDelete = useCallback((id: string) => {
    Alert.alert('Delete Challenge', 'Are you sure? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: () => setState({
          ...state,
          challenges: state.challenges.filter((c) => c.id !== id),
        }),
      },
    ]);
  }, [state, setState]);

  const handleUpdateSpend = useCallback((id: string, spend: number) => {
    setState({
      ...state,
      challenges: state.challenges.map((c) =>
        c.id !== id ? c : { ...c, currentSpend: spend },
      ),
    });
  }, [state, setState]);

  const vaultCards = useMemo<VaultCardOption[]>(
    () => state.cards.map((uc) => {
      const lib = cardLibrary.find((lc) => lc.id === uc.cardLibraryId);
      return { id: uc.id, name: uc.name || lib?.name || '', issuer: lib?.issuer ?? '', color: lib?.color };
    }).filter((vc) => vc.name),
    [state.cards],
  );

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {active.length === 0 && completed.length === 0 ? (
          <EmptyState onAdd={() => setShowAdd(true)} />
        ) : (
          <>
            {active.length === 0 && (
              <View style={styles.allDoneBox}>
                <Ionicons name="trophy" size={22} color="#00C9A7" />
                <Text style={styles.allDoneText}>All challenges complete!</Text>
              </View>
            )}

            {active.map((c) => (
              <ChallengeCard
                key={c.id}
                challenge={c}
                now={now}
                onMarkComplete={handleMarkComplete}
                onUpdateSpend={handleUpdateSpend}
              />
            ))}

            {completed.length > 0 && (
              <View style={styles.archiveSection}>
                <TouchableOpacity
                  style={styles.archiveHeader}
                  onPress={() => setCompletedExpanded((v) => !v)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.archiveTitle}>Completed</Text>
                  <View style={styles.archiveBadge}>
                    <Text style={styles.archiveBadgeText}>{completed.length}</Text>
                  </View>
                  <Ionicons
                    name={completedExpanded ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color={Colors.textMuted}
                    style={styles.archiveChevron}
                  />
                </TouchableOpacity>

                {completedExpanded && completed.map((c) => (
                  <CompletedRow
                    key={c.id}
                    challenge={c}
                    onUndo={handleUndo}
                    onDelete={handleDelete}
                  />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      <AddChallengeSheet
        visible={showAdd}
        onClose={() => setShowAdd(false)}
        onSave={handleAdd}
        vaultCards={vaultCards}
      />
    </SafeAreaView>
  );
}

// ─── Challenge card ───────────────────────────────────────────────────────────

export function ChallengeCard({
  challenge, now, onMarkComplete, onUpdateSpend,
}: {
  challenge: BonusChallenge;
  now: Date;
  onMarkComplete: (id: string) => void;
  onUpdateSpend: (id: string, spend: number) => void;
}) {
  const [spendInput, setSpendInput] = useState(String(challenge.currentSpend));

  const daysLeft    = getDaysToDeadline(challenge.deadline, now);
  const urgency     = challengeUrgencyColor(daysLeft);
  const progress    = challenge.minSpend > 0
    ? Math.min(challenge.currentSpend / challenge.minSpend, 1)
    : 0;
  const pctComplete = Math.round(progress * 100);
  const remaining   = Math.max(challenge.minSpend - challenge.currentSpend, 0);
  const perDay      = daysLeft > 0 && remaining > 0
    ? Math.ceil(remaining / daysLeft)
    : null;

  React.useEffect(() => {
    setSpendInput(String(challenge.currentSpend));
  }, [challenge.currentSpend]);

  const commitSpend = useCallback(() => {
    const val = parseFloat(spendInput);
    if (!isNaN(val) && val >= 0) {
      onUpdateSpend(challenge.id, val);
    } else {
      setSpendInput(String(challenge.currentSpend));
    }
  }, [spendInput, challenge, onUpdateSpend]);

  const urgencyLabel = daysLeft > 0
    ? `${daysLeft}d left`
    : daysLeft === 0 ? 'Due today' : 'Overdue';

  return (
    <View style={styles.challengeCard}>
      {/* Top accent progress bar */}
      <View style={styles.accentBarTrack}>
        <View style={[styles.accentBarFill, { width: `${pctComplete}%` as any, backgroundColor: urgency }]} />
      </View>

      <View style={styles.cardBody}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.cardName} numberOfLines={1}>{challenge.cardName}</Text>
          <View style={[styles.bonusPill, { borderColor: urgency }]}>
            <Text style={[styles.bonusPillText, { color: urgency }]} numberOfLines={1}>
              {challenge.bonusDescription}
            </Text>
          </View>
        </View>

        {challenge.bonusValue != null && challenge.bonusValue > 0 && (
          <Text style={styles.bonusValueText}>
            Est. value: ${challenge.bonusValue.toLocaleString()}
          </Text>
        )}
        {!!challenge.note && <Text style={styles.noteText}>{challenge.note}</Text>}

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${pctComplete}%` as any, backgroundColor: urgency }]} />
        </View>

        <View style={styles.statsRow}>
          <Text style={styles.statsLeft}>{pctComplete}% · ${remaining.toLocaleString()} remaining</Text>
          <Text style={styles.statsRight}>{formatDeadline(challenge.deadline)}</Text>
        </View>

        {(daysLeft <= 30 || perDay != null) && (
          <View style={styles.urgencyRow}>
            {daysLeft <= 30 && (
              <View style={[styles.urgencyBadge, { backgroundColor: urgency + '22' }]}>
                <Text style={[styles.urgencyText, { color: urgency }]}>⚠ {urgencyLabel}</Text>
              </View>
            )}
            {perDay != null && (
              <Text style={styles.perDayText}>Need ${perDay}/day to hit target</Text>
            )}
          </View>
        )}

        <View style={styles.actionRow}>
          <View style={styles.spendField}>
            <Text style={styles.spendFieldLabel}>Current spend</Text>
            <View style={styles.spendInputRow}>
              <Text style={styles.spendDollar}>$</Text>
              <TextInput
                style={styles.spendInput}
                value={spendInput}
                onChangeText={setSpendInput}
                onBlur={commitSpend}
                onSubmitEditing={commitSpend}
                keyboardType="decimal-pad"
                returnKeyType="done"
                selectTextOnFocus
              />
            </View>
          </View>

          <TouchableOpacity
            style={styles.completeBtn}
            onPress={() => onMarkComplete(challenge.id)}
            activeOpacity={0.8}
          >
            <Ionicons name="checkmark" size={15} color="#fff" />
            <Text style={styles.completeBtnText}>Mark Complete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ─── Completed row ────────────────────────────────────────────────────────────

function CompletedRow({
  challenge, onUndo, onDelete,
}: {
  challenge: BonusChallenge;
  onUndo: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <View style={styles.completedRow}>
      <View style={styles.completedLeft}>
        <Text style={styles.completedCardName}>{challenge.cardName}</Text>
        <Text style={styles.completedBonus}>{challenge.bonusDescription}</Text>
        {challenge.bonusValue != null && challenge.bonusValue > 0 && (
          <View style={styles.earnedRow}>
            <Text style={styles.earnedLabel}>EARNED</Text>
            <Text style={styles.earnedValue}>${challenge.bonusValue.toLocaleString()}</Text>
          </View>
        )}
      </View>
      <View style={styles.completedActions}>
        <TouchableOpacity style={styles.undoBtn} onPress={() => onUndo(challenge.id)}>
          <Text style={styles.undoBtnText}>Undo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => onDelete(challenge.id)}>
          <Ionicons name="close" size={17} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <View style={styles.emptyContainer}>
      <Ionicons name="trophy-outline" size={68} color={Colors.textMuted} />
      <Text style={styles.emptyTitle}>No active challenges</Text>
      <Text style={styles.emptySubtitle}>
        Add a welcome bonus spend target to make sure you hit it in time.
      </Text>
      <TouchableOpacity style={styles.emptyAddBtn} onPress={onAdd} activeOpacity={0.85}>
        <Ionicons name="add" size={18} color="#fff" />
        <Text style={styles.emptyAddBtnText}>Add Challenge</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg, paddingBottom: 48 },
  headerAddBtn: { marginRight: Spacing.sm },

  allDoneBox: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.surface, borderRadius: Radius.row,
    paddingVertical: Spacing.lg, paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border,
  },
  allDoneText: { fontFamily: Font.semiBold, fontSize: 15, color: '#00C9A7' },

  // ── Challenge card ─────────────────────────────────────────────────────────
  challengeCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.card, marginBottom: Spacing.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  accentBarTrack: {
    height: 3, backgroundColor: Colors.border,
    borderTopLeftRadius: Radius.card, borderTopRightRadius: Radius.card, overflow: 'hidden',
  },
  accentBarFill: { height: 3 },
  cardBody: { padding: Spacing.lg, gap: Spacing.md },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  cardName: { fontFamily: Font.bold, fontSize: 17, color: Colors.textPrimary, flex: 1 },
  bonusPill: {
    borderWidth: 1.5, borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md, paddingVertical: 3, flexShrink: 1,
  },
  bonusPillText: { fontFamily: Font.semiBold, fontSize: 12 },
  bonusValueText: { fontFamily: Font.regular, fontSize: 13, color: Colors.textMuted },
  noteText: { fontFamily: Font.regular, fontSize: 13, color: Colors.textSecondary, fontStyle: 'italic' },
  progressTrack: { height: 8, backgroundColor: Colors.border, borderRadius: Radius.pill, overflow: 'hidden' },
  progressFill: { height: 8, borderRadius: Radius.pill },
  statsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statsLeft: { fontFamily: Font.medium, fontSize: 13, color: Colors.textSecondary },
  statsRight: { fontFamily: Font.regular, fontSize: 13, color: Colors.textMuted },
  urgencyRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flexWrap: 'wrap' },
  urgencyBadge: { borderRadius: Radius.pill, paddingHorizontal: Spacing.md, paddingVertical: 4 },
  urgencyText: { fontFamily: Font.bold, fontSize: 12 },
  perDayText: { fontFamily: Font.medium, fontSize: 13, color: Colors.textSecondary },
  actionRow: {
    flexDirection: 'row', alignItems: 'flex-end',
    justifyContent: 'space-between', gap: Spacing.md, marginTop: Spacing.xs,
  },
  spendField: { flex: 1 },
  spendFieldLabel: { fontFamily: Font.medium, fontSize: 12, color: Colors.textMuted, marginBottom: 4 },
  spendInputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.background, borderRadius: Radius.input,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
  },
  spendDollar: { fontFamily: Font.semiBold, fontSize: 15, color: Colors.textSecondary, marginRight: 2 },
  spendInput: { flex: 1, fontFamily: Font.semiBold, fontSize: 15, color: Colors.textPrimary, padding: 0 },
  completeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    backgroundColor: '#00C9A7', borderRadius: Radius.pill,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
  },
  completeBtnText: { fontFamily: Font.semiBold, fontSize: 13, color: '#fff' },

  // ── Archive ────────────────────────────────────────────────────────────────
  archiveSection: {
    backgroundColor: Colors.surface, borderRadius: Radius.card,
    overflow: 'hidden', borderWidth: 1, borderColor: Colors.border,
  },
  archiveHeader: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingVertical: Spacing.lg, paddingHorizontal: Spacing.lg,
  },
  archiveTitle: { fontFamily: Font.semiBold, fontSize: 15, color: Colors.textSecondary },
  archiveBadge: {
    backgroundColor: Colors.border, borderRadius: Radius.pill,
    paddingHorizontal: 10, paddingVertical: 2, minWidth: 24, alignItems: 'center',
  },
  archiveBadgeText: { fontFamily: Font.bold, fontSize: 12, color: Colors.textMuted },
  archiveChevron: { marginLeft: 'auto' as any },
  completedRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  completedLeft: { flex: 1, gap: 3 },
  completedCardName: {
    fontFamily: Font.semiBold, fontSize: 14, color: Colors.textMuted, textDecorationLine: 'line-through',
  },
  completedBonus: { fontFamily: Font.regular, fontSize: 12, color: Colors.textMuted },
  earnedRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginTop: 2 },
  earnedLabel: { fontFamily: Font.bold, fontSize: 10, color: '#059669', letterSpacing: 0.5 },
  earnedValue: { fontFamily: Font.bold, fontSize: 13, color: '#059669' },
  completedActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  undoBtn: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md, paddingVertical: 4,
  },
  undoBtnText: { fontFamily: Font.semiBold, fontSize: 12, color: Colors.textSecondary },
  deleteBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center',
  },

  // ── Empty state ────────────────────────────────────────────────────────────
  emptyContainer: {
    alignItems: 'center', paddingHorizontal: Spacing.xxxl, paddingTop: 80, gap: Spacing.lg,
  },
  emptyTitle: { fontFamily: Font.bold, fontSize: 22, color: Colors.textPrimary, textAlign: 'center' },
  emptySubtitle: {
    fontFamily: Font.regular, fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22,
  },
  emptyAddBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    marginTop: Spacing.sm, backgroundColor: Colors.action,
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.xxxl, borderRadius: Radius.pill,
  },
  emptyAddBtnText: { fontFamily: Font.semiBold, fontSize: 15, color: '#fff' },
});
