import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert } from 'react-native';
import { useCounter } from '../../context/CounterContext';
import { differenceInDays, format, startOfDay } from 'date-fns';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function CounterScreen() {
  const { totalCount, dailyStatus, lastAction, targetDate, addAction, resetAction, undoAction, setTargetDate } = useCounter();
  
  const [showPicker, setShowPicker] = useState(false);

  const today = format(new Date(), 'yyyy-MM-dd');
  const hasAddedToday = dailyStatus[today] === 'ADD';
  const canUndo = lastAction && lastAction.date === today;

  const confirmReset = () => {
    Alert.alert(
      "Reset Counter",
      "Tem certeza que deseja zerar a contagem?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Zerar", style: "destructive", onPress: resetAction }
      ]
    );
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowPicker(false);
    if (selectedDate) {
      setTargetDate(format(selectedDate, 'yyyy-MM-dd'));
    }
  };

  const clearTarget = () => {
    setTargetDate(null);
  };

  const renderCountdown = () => {
    if (!targetDate) {
      return (
        <TouchableOpacity style={styles.targetButton} onPress={() => setShowPicker(true)}>
          <Text style={styles.targetButtonText}>Definir Meta (Data do Evento)</Text>
        </TouchableOpacity>
      );
    }

    const todayDate = startOfDay(new Date());
    const target = startOfDay(new Date(targetDate));
    const daysLeft = differenceInDays(target, todayDate);

    if (daysLeft < 0) {
      return (
        <TouchableOpacity style={styles.targetButton} onPress={clearTarget}>
          <Text style={styles.targetButtonText}>O evento já passou! (Limpar Meta)</Text>
        </TouchableOpacity>
      );
    }

    if (daysLeft === 0) {
      return (
        <TouchableOpacity style={styles.targetButton} onPress={clearTarget}>
          <Text style={styles.targetButtonText}>É hoje! 🎉 (Limpar Meta)</Text>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity style={styles.targetButton} onPress={clearTarget}>
        <Text style={styles.targetButtonText}>Faltam {daysLeft} dias para o evento!</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Contador</Text>
      
      <View style={styles.counterCard}>
        <Text style={styles.countText}>{totalCount}</Text>
        <Text style={styles.countLabel}>Dias Acumulados</Text>
      </View>

      {renderCountdown()}

      {showPicker && (
        <DateTimePicker
          value={targetDate ? new Date(targetDate) : new Date()}
          mode="date"
          display="default"
          onChange={handleDateChange}
          minimumDate={new Date()}
          themeVariant="dark"
        />
      )}

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.buttonRound, styles.resetButton]}
          onPress={confirmReset}
          activeOpacity={0.8}
        >
          <Text style={[styles.buttonTextRound, { color: '#EF4444' }]}>X</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.buttonRound, styles.addButton, hasAddedToday && styles.disabledButton]}
          onPress={addAction}
          disabled={hasAddedToday}
          activeOpacity={0.8}
        >
          <Text style={[styles.buttonTextRound, { color: hasAddedToday ? '#52525B' : '#10B981' }]}>+</Text>
        </TouchableOpacity>
      </View>

      {hasAddedToday && (
        <Text style={styles.feedbackText}>Você já marcou hoje! 🎉</Text>
      )}

      <View style={styles.undoContainer}>
        <TouchableOpacity
          style={[styles.undoButton, !canUndo && styles.disabledUndoButton]}
          onPress={undoAction}
          disabled={!canUndo}
          activeOpacity={0.8}
        >
          <Text style={[styles.undoButtonText, !canUndo && { color: '#52525B' }]}>Desfazer Última Ação</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090B', // Zinc-950
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FAFAFA', // Zinc-50
    marginBottom: 40,
    marginTop: 40,
    letterSpacing: 0.5,
  },
  counterCard: {
    backgroundColor: '#18181B', // Zinc-900
    borderRadius: 32,
    paddingVertical: 50,
    paddingHorizontal: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 8,
    marginBottom: 40,
    minWidth: 260,
    borderWidth: 1,
    borderColor: '#27272A', // Zinc-800
  },
  countText: {
    fontSize: 96,
    fontWeight: '900',
    color: '#10B981', // Emerald-500
    lineHeight: 100,
    marginBottom: 8,
    fontVariant: ['tabular-nums'],
  },
  countLabel: {
    fontSize: 16,
    color: '#A1A1AA', // Zinc-400
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  targetButton: {
    backgroundColor: '#18181B',
    borderWidth: 1,
    borderColor: '#27272A',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 20,
    marginBottom: 40,
  },
  targetButtonText: {
    color: '#818CF8', // Indigo-400
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
    marginBottom: 30,
    maxWidth: 320,
  },
  buttonRound: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  addButton: {
    backgroundColor: '#042F2E', // Emerald-950
    borderColor: '#065F46', // Emerald-800
  },
  resetButton: {
    backgroundColor: '#450A0A', // Red-950
    borderColor: '#7F1D1D', // Red-800
  },
  disabledButton: {
    backgroundColor: '#18181B', // Zinc-900
    borderColor: '#27272A', // Zinc-800
  },
  buttonTextRound: {
    fontSize: 42,
    fontWeight: '600',
  },
  feedbackText: {
    fontSize: 16,
    color: '#34D399', // Emerald-400
    fontWeight: '600',
    marginBottom: 20,
  },
  undoContainer: {
    marginTop: 'auto',
    marginBottom: 20,
    width: '100%',
  },
  undoButton: {
    backgroundColor: '#18181B',
    borderWidth: 1,
    borderColor: '#27272A',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  disabledUndoButton: {
    backgroundColor: '#09090B',
    borderColor: '#18181B',
  },
  undoButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FAFAFA',
  },
});
