import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Font, Radius, Spacing } from './theme';
import type { BonusChallenge } from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface VaultCardOption {
  id: string;
  name: string;
  issuer: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: (c: BonusChallenge) => void;
  vaultCards: VaultCardOption[];
  prefilledCardId?: string;   // pre-select a vault card
}

interface FormErrors {
  card?: string;
  bonusDescription?: string;
  minSpend?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function defaultDeadline(): Date {
  const d = new Date();
  d.setMonth(d.getMonth() + 3);
  return d;
}

function fmt(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AddChallengeSheet({
  visible, onClose, onSave, vaultCards, prefilledCardId,
}: Props) {
  const hasVaultCards = vaultCards.length > 0;

  // ── Form state ──────────────────────────────────────────────────────────────
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [cardNameFallback, setCardNameFallback] = useState('');
  const [bonusDescription, setBonusDescription] = useState('');
  const [minSpend, setMinSpend] = useState('');
  const [currentSpend, setCurrentSpend] = useState('0');
  const [deadline, setDeadline] = useState<Date>(defaultDeadline);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [bonusValue, setBonusValue] = useState('');
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});

  // When the sheet becomes visible, apply prefill; reset when hidden
  useEffect(() => {
    if (visible) {
      if (prefilledCardId) setSelectedCardId(prefilledCardId);
    } else {
      setSelectedCardId(null);
      setCardNameFallback('');
      setBonusDescription('');
      setMinSpend('');
      setCurrentSpend('0');
      setDeadline(defaultDeadline());
      setShowDatePicker(false);
      setBonusValue('');
      setNote('');
      setErrors({});
    }
  }, [visible, prefilledCardId]);

  const selectedCard = useMemo(
    () => vaultCards.find((c) => c.id === selectedCardId) ?? null,
    [vaultCards, selectedCardId],
  );

  // ── Validation & save ────────────────────────────────────────────────────────

  const handleSave = useCallback(() => {
    const errs: FormErrors = {};
    const cardName = selectedCard?.name ?? cardNameFallback.trim();
    if (!cardName) errs.card = hasVaultCards ? 'Select a card' : 'Required';
    if (!bonusDescription.trim()) errs.bonusDescription = 'Required';

    const minSpendNum = parseFloat(minSpend);
    if (isNaN(minSpendNum) || minSpendNum <= 0) errs.minSpend = 'Enter a valid amount';

    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    const bonusValueNum = parseFloat(bonusValue);

    onSave({
      id: generateId(),
      cardName,
      userCardId: selectedCardId ?? undefined,
      bonusDescription: bonusDescription.trim(),
      minSpend: minSpendNum,
      currentSpend: parseFloat(currentSpend) || 0,
      deadline: deadline.toISOString(),
      bonusValue: isNaN(bonusValueNum) ? undefined : bonusValueNum,
      completed: false,
      note: note.trim() || undefined,
    });
  }, [
    selectedCard, cardNameFallback, hasVaultCards, bonusDescription,
    minSpend, currentSpend, deadline, bonusValue, note,
    selectedCardId, onSave,
  ]);

  // ── Date picker handlers ─────────────────────────────────────────────────────

  const onDateChange = useCallback((_event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS !== 'ios') setShowDatePicker(false);
    if (date) setDeadline(date);
  }, []);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.kav}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.cancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.title}>New Challenge</Text>
            <TouchableOpacity onPress={handleSave}>
              <Text style={styles.save}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            {/* ── Card picker ── */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Card</Text>
              {hasVaultCards ? (
                <View style={styles.cardPicker}>
                  {vaultCards.map((vc) => {
                    const selected = vc.id === selectedCardId;
                    return (
                      <TouchableOpacity
                        key={vc.id}
                        style={[styles.cardOption, selected && styles.cardOptionSelected]}
                        onPress={() => { setSelectedCardId(vc.id); setErrors((e) => ({ ...e, card: undefined })); }}
                        activeOpacity={0.75}
                      >
                        <View style={styles.cardOptionLeft}>
                          <Text style={[styles.cardOptionName, selected && styles.cardOptionNameSelected]}
                            numberOfLines={1}>
                            {vc.name}
                          </Text>
                          <Text style={[styles.cardOptionIssuer, selected && styles.cardOptionIssuerSelected]}>
                            {vc.issuer}
                          </Text>
                        </View>
                        {selected && <Ionicons name="checkmark-circle" size={20} color="#fff" />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : (
                <TextInput
                  style={[styles.textInput, errors.card ? styles.inputError : null]}
                  placeholder="Card name"
                  placeholderTextColor={Colors.textMuted}
                  value={cardNameFallback}
                  onChangeText={(v) => { setCardNameFallback(v); setErrors((e) => ({ ...e, card: undefined })); }}
                  returnKeyType="next"
                />
              )}
              {!!errors.card && <Text style={styles.errorText}>{errors.card}</Text>}
            </View>

            {/* ── Bonus description ── */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Bonus Description</Text>
              <TextInput
                style={[styles.textInput, errors.bonusDescription ? styles.inputError : null]}
                placeholder="e.g. 75,000 miles after $4,000 spend"
                placeholderTextColor={Colors.textMuted}
                value={bonusDescription}
                onChangeText={(v) => { setBonusDescription(v); setErrors((e) => ({ ...e, bonusDescription: undefined })); }}
                returnKeyType="next"
              />
              {!!errors.bonusDescription && <Text style={styles.errorText}>{errors.bonusDescription}</Text>}
            </View>

            {/* ── Min spend + current spend ── */}
            <View style={styles.fieldRow}>
              <View style={[styles.fieldGroup, styles.fieldHalf]}>
                <Text style={styles.fieldLabel}>Min. Spend ($)</Text>
                <TextInput
                  style={[styles.textInput, errors.minSpend ? styles.inputError : null]}
                  placeholder="4000"
                  placeholderTextColor={Colors.textMuted}
                  value={minSpend}
                  onChangeText={(v) => { setMinSpend(v); setErrors((e) => ({ ...e, minSpend: undefined })); }}
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
                  value={currentSpend}
                  onChangeText={setCurrentSpend}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            {/* ── Deadline date picker ── */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Deadline</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker((v) => !v)}
                activeOpacity={0.75}
              >
                <Ionicons name="calendar-outline" size={18} color={Colors.action} />
                <Text style={styles.dateButtonText}>{fmt(deadline)}</Text>
                <Ionicons name="chevron-down" size={15} color={Colors.textMuted} />
              </TouchableOpacity>
              {showDatePicker && (
                <View style={styles.datePickerWrapper}>
                  <DateTimePicker
                    value={deadline}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    minimumDate={today}
                    onChange={onDateChange}
                  />
                  {Platform.OS === 'ios' && (
                    <TouchableOpacity
                      style={styles.datePickerDone}
                      onPress={() => setShowDatePicker(false)}
                    >
                      <Text style={styles.datePickerDoneText}>Done</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>

            {/* ── Est. bonus value ── */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>
                Est. Bonus Value ($){' '}
                <Text style={styles.optional}>optional</Text>
              </Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. 1500"
                placeholderTextColor={Colors.textMuted}
                value={bonusValue}
                onChangeText={setBonusValue}
                keyboardType="decimal-pad"
              />
            </View>

            {/* ── Notes ── */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>
                Notes{' '}
                <Text style={styles.optional}>optional</Text>
              </Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Any extra context..."
                placeholderTextColor={Colors.textMuted}
                value={note}
                onChangeText={setNote}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.bottomPad} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  kav: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  cancel: { fontFamily: Font.medium, fontSize: 16, color: Colors.textSecondary },
  title: { fontFamily: Font.bold, fontSize: 17, color: Colors.textPrimary },
  save: { fontFamily: Font.semiBold, fontSize: 16, color: Colors.action },

  scroll: { flex: 1 },
  content: { padding: Spacing.lg },
  bottomPad: { height: 32 },

  // Card picker
  cardPicker: { gap: Spacing.sm },
  cardOption: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.row,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
  },
  cardOptionSelected: { backgroundColor: Colors.action, borderColor: Colors.action },
  cardOptionLeft: { flex: 1 },
  cardOptionName: { fontFamily: Font.semiBold, fontSize: 15, color: Colors.textPrimary },
  cardOptionNameSelected: { color: '#fff' },
  cardOptionIssuer: { fontFamily: Font.regular, fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  cardOptionIssuerSelected: { color: 'rgba(255,255,255,0.75)' },

  // Date picker
  dateButton: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.input, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
  },
  dateButtonText: { fontFamily: Font.medium, fontSize: 15, color: Colors.textPrimary, flex: 1 },
  datePickerWrapper: {
    backgroundColor: Colors.surface, borderRadius: Radius.row,
    borderWidth: 1, borderColor: Colors.border, marginTop: Spacing.sm, overflow: 'hidden',
  },
  datePickerDone: { alignItems: 'flex-end', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  datePickerDoneText: { fontFamily: Font.semiBold, fontSize: 15, color: Colors.action },

  // Form fields
  fieldGroup: { marginBottom: Spacing.lg },
  fieldRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: Spacing.lg },
  fieldRowGap: { width: Spacing.md },
  fieldHalf: { flex: 1, marginBottom: 0 },
  fieldLabel: {
    fontFamily: Font.semiBold, fontSize: 13, color: Colors.textSecondary, marginBottom: Spacing.sm,
  },
  optional: { fontFamily: Font.regular, fontSize: 12, color: Colors.textMuted },
  textInput: {
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.input, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    fontFamily: Font.regular, fontSize: 15, color: Colors.textPrimary,
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  inputError: { borderColor: '#DC2626' },
  errorText: { fontFamily: Font.regular, fontSize: 12, color: '#DC2626', marginTop: 4 },
});
