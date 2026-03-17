import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors, Font, Radius, Spacing } from '../components/theme';
import { useAppState } from '../hooks/useAppState';
import { cardLibrary } from '../data/cardLibrary';
import type { BonusChallenge } from '../types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function challengeUrgencyColor(daysLeft: number): string {
  if (daysLeft > 30) return '#00C9A7';
  if (daysLeft > 15) return '#D97706';
  if (daysLeft > 7)  return '#F97316';
  return '#DC2626';
}

function getDaysToDeadline(deadline: string, now: Date): number {
  const d = new Date(deadline);
  const today  = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDeadline(deadline: string): string {
  return new Date(deadline).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function parseDeadlineInput(str: string): Date | null {
  const parts = str.split('/');
  if (parts.length !== 3) return null;
  const [m, d, y] = parts.map((p) => parseInt(p, 10));
  if (isNaN(m) || isNaN(d) || isNaN(y)) return null;
  if (m < 1 || m > 12 || d < 1 || d > 31 || y < 2024) return null;
  const date = new Date(y, m - 1, d);
  return isNaN(date.getTime()) ? null : date;
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

  const vaultCardNames = useMemo(
    () => state.cards.map((uc) => {
      const lib = cardLibrary.find((lc) => lc.id === uc.cardLibraryId);
      return uc.name || lib?.name || '';
    }).filter(Boolean),
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
        vaultCardNames={vaultCardNames}
      />
    </SafeAreaView>
  );
}

// ─── Challenge card ───────────────────────────────────────────────────────────

function ChallengeCard({
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
        {/* Title row */}
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
        {!!challenge.note && (
          <Text style={styles.noteText}>{challenge.note}</Text>
        )}

        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${pctComplete}%` as any, backgroundColor: urgency }]} />
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <Text style={styles.statsLeft}>
            {pctComplete}% · ${remaining.toLocaleString()} remaining
          </Text>
          <Text style={styles.statsRight}>{formatDeadline(challenge.deadline)}</Text>
        </View>

        {/* Urgency badge + $/day needed */}
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

        {/* Inline spend + mark complete */}
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

// ─── Add challenge sheet ──────────────────────────────────────────────────────

interface FormState {
  cardName: string;
  bonusDescription: string;
  minSpend: string;
  currentSpend: string;
  deadline: string;
  bonusValue: string;
  note: string;
}

interface FormErrors {
  cardName?: string;
  bonusDescription?: string;
  minSpend?: string;
  deadline?: string;
}

const BLANK_FORM: FormState = {
  cardName: '', bonusDescription: '', minSpend: '', currentSpend: '0',
  deadline: '', bonusValue: '', note: '',
};

function AddChallengeSheet({
  visible, onClose, onSave, vaultCardNames,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (c: BonusChallenge) => void;
  vaultCardNames: string[];
}) {
  const [form, setForm] = useState<FormState>(BLANK_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showAutocomplete, setShowAutocomplete] = useState(false);

  const filtered = useMemo(
    () => form.cardName.length > 0
      ? vaultCardNames.filter((n) => n.toLowerCase().includes(form.cardName.toLowerCase()))
      : vaultCardNames,
    [form.cardName, vaultCardNames],
  );

  const set = useCallback(<K extends keyof FormState>(key: K, val: string) => {
    setForm((f) => ({ ...f, [key]: val }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }, []);

  const handleClose = useCallback(() => {
    setForm(BLANK_FORM);
    setErrors({});
    setShowAutocomplete(false);
    onClose();
  }, [onClose]);

  const handleSave = useCallback(() => {
    const errs: FormErrors = {};
    if (!form.cardName.trim())         errs.cardName = 'Required';
    if (!form.bonusDescription.trim()) errs.bonusDescription = 'Required';

    const minSpend = parseFloat(form.minSpend);
    if (isNaN(minSpend) || minSpend <= 0) errs.minSpend = 'Enter a valid amount';

    const deadlineDate = parseDeadlineInput(form.deadline);
    if (!deadlineDate) errs.deadline = 'Use MM/DD/YYYY format';

    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    const bonusValueNum = parseFloat(form.bonusValue);

    onSave({
      id: generateId(),
      cardName: form.cardName.trim(),
      bonusDescription: form.bonusDescription.trim(),
      minSpend,
      currentSpend: parseFloat(form.currentSpend) || 0,
      deadline: deadlineDate!.toISOString(),
      bonusValue: isNaN(bonusValueNum) ? undefined : bonusValueNum,
      completed: false,
      note: form.note.trim() || undefined,
    });

    setForm(BLANK_FORM);
    setErrors({});
    setShowAutocomplete(false);
  }, [form, onSave]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.sheetSafe}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.sheetKAV}
        >
          <View style={styles.sheetHeader}>
            <TouchableOpacity onPress={handleClose}>
              <Text style={styles.sheetCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.sheetTitle}>New Challenge</Text>
            <TouchableOpacity onPress={handleSave}>
              <Text style={styles.sheetSave}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.sheetScroll}
            contentContainerStyle={styles.sheetContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Card name + autocomplete */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Card Name</Text>
              <TextInput
                style={[styles.textInput, errors.cardName ? styles.inputError : null]}
                placeholder="e.g. Chase Sapphire Reserve"
                placeholderTextColor={Colors.textMuted}
                value={form.cardName}
                onChangeText={(v) => { set('cardName', v); setShowAutocomplete(true); }}
                onFocus={() => setShowAutocomplete(true)}
                onBlur={() => setTimeout(() => setShowAutocomplete(false), 160)}
                returnKeyType="next"
              />
              {!!errors.cardName && <Text style={styles.errorText}>{errors.cardName}</Text>}
              {showAutocomplete && filtered.length > 0 && (
                <View style={styles.autocomplete}>
                  {filtered.map((name) => (
                    <TouchableOpacity
                      key={name}
                      style={styles.autocompleteItem}
                      onPress={() => { set('cardName', name); setShowAutocomplete(false); }}
                    >
                      <Text style={styles.autocompleteText}>{name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Bonus description */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Bonus Description</Text>
              <TextInput
                style={[styles.textInput, errors.bonusDescription ? styles.inputError : null]}
                placeholder="e.g. 75,000 miles after $4,000 spend"
                placeholderTextColor={Colors.textMuted}
                value={form.bonusDescription}
                onChangeText={(v) => set('bonusDescription', v)}
                returnKeyType="next"
              />
              {!!errors.bonusDescription && <Text style={styles.errorText}>{errors.bonusDescription}</Text>}
            </View>

            {/* Min spend + current spend */}
            <View style={styles.fieldRow}>
              <View style={[styles.fieldGroup, styles.fieldHalf]}>
                <Text style={styles.fieldLabel}>Min. Spend ($)</Text>
                <TextInput
                  style={[styles.textInput, errors.minSpend ? styles.inputError : null]}
                  placeholder="4000"
                  placeholderTextColor={Colors.textMuted}
                  value={form.minSpend}
                  onChangeText={(v) => set('minSpend', v)}
                  keyboardType="decimal-pad"
                />
                {!!errors.minSpend && <Text style={styles.errorText}>{errors.minSpend}</Text>}
              </View>
              <View style={styles.fieldRowGap} />
              <View style={[styles.fieldGroup, styles.fieldHalf]}>
                <Text style={styles.fieldLabel}>Current Spend ($)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="0"
                  placeholderTextColor={Colors.textMuted}
                  value={form.currentSpend}
                  onChangeText={(v) => set('currentSpend', v)}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            {/* Deadline */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Deadline</Text>
              <TextInput
                style={[styles.textInput, errors.deadline ? styles.inputError : null]}
                placeholder="MM/DD/YYYY"
                placeholderTextColor={Colors.textMuted}
                value={form.deadline}
                onChangeText={(v) => set('deadline', v)}
                keyboardType="numbers-and-punctuation"
                returnKeyType="next"
              />
              {!!errors.deadline && <Text style={styles.errorText}>{errors.deadline}</Text>}
            </View>

            {/* Est. bonus value */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>
                Est. Bonus Value ($){' '}
                <Text style={styles.optionalLabel}>optional</Text>
              </Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. 1500"
                placeholderTextColor={Colors.textMuted}
                value={form.bonusValue}
                onChangeText={(v) => set('bonusValue', v)}
                keyboardType="decimal-pad"
              />
            </View>

            {/* Notes */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>
                Notes{' '}
                <Text style={styles.optionalLabel}>optional</Text>
              </Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Any extra context..."
                placeholderTextColor={Colors.textMuted}
                value={form.note}
                onChangeText={(v) => set('note', v)}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.sheetBottomPad} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
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
    backgroundColor: Colors.surface,
    borderRadius: Radius.card,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  accentBarTrack: {
    height: 3,
    backgroundColor: Colors.border,
    borderTopLeftRadius: Radius.card,
    borderTopRightRadius: Radius.card,
    overflow: 'hidden',
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
  noteText: {
    fontFamily: Font.regular, fontSize: 13, color: Colors.textSecondary, fontStyle: 'italic',
  },

  progressTrack: {
    height: 8, backgroundColor: Colors.border, borderRadius: Radius.pill, overflow: 'hidden',
  },
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
    fontFamily: Font.semiBold, fontSize: 14, color: Colors.textMuted,
    textDecorationLine: 'line-through',
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
    fontFamily: Font.regular, fontSize: 15, color: Colors.textSecondary,
    textAlign: 'center', lineHeight: 22,
  },
  emptyAddBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    marginTop: Spacing.sm, backgroundColor: Colors.action,
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.xxxl, borderRadius: Radius.pill,
  },
  emptyAddBtnText: { fontFamily: Font.semiBold, fontSize: 15, color: '#fff' },

  // ── Add challenge sheet ────────────────────────────────────────────────────
  sheetSafe: { flex: 1, backgroundColor: Colors.background },
  sheetKAV: { flex: 1 },
  sheetHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  sheetCancel: { fontFamily: Font.medium, fontSize: 16, color: Colors.textSecondary },
  sheetTitle: { fontFamily: Font.bold, fontSize: 17, color: Colors.textPrimary },
  sheetSave: { fontFamily: Font.semiBold, fontSize: 16, color: Colors.action },
  sheetScroll: { flex: 1 },
  sheetContent: { padding: Spacing.lg },
  sheetBottomPad: { height: 32 },

  // Form fields
  fieldGroup: { marginBottom: Spacing.lg },
  fieldRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: Spacing.lg },
  fieldRowGap: { width: Spacing.md },
  fieldHalf: { flex: 1, marginBottom: 0 },
  fieldLabel: {
    fontFamily: Font.semiBold, fontSize: 13, color: Colors.textSecondary, marginBottom: Spacing.sm,
  },
  optionalLabel: { fontFamily: Font.regular, fontSize: 12, color: Colors.textMuted },
  textInput: {
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.input, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    fontFamily: Font.regular, fontSize: 15, color: Colors.textPrimary,
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  inputError: { borderColor: '#DC2626' },
  errorText: { fontFamily: Font.regular, fontSize: 12, color: '#DC2626', marginTop: 4 },

  autocomplete: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.input,
    backgroundColor: Colors.surface, marginTop: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 6, elevation: 4,
  },
  autocompleteItem: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  autocompleteText: { fontFamily: Font.medium, fontSize: 15, color: Colors.textPrimary },
});
