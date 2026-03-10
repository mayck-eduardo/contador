import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { useCounter } from '../../context/CounterContext';
import { differenceInDays, format, startOfDay } from 'date-fns';
import DateTimePicker from '@react-native-community/datetimepicker';

const { width } = Dimensions.get('window');
const BOX_SIZE = (width - 48 - 16) / 2; // container padding 24*2, gap 16

export default function CountdownScreen() {
  const { countdownTargetDate, setCountdownTargetDate } = useCounter();
  const [showPicker, setShowPicker] = useState(false);
  const [timeLeft, setTimeLeft] = useState<{days: number, hours: number, minutes: number, seconds: number} | null>(null);

  const calculateTimeLeft = () => {
    if (!countdownTargetDate) return;
    
    // Target is mid-night (start of day) of the target date
    const target = startOfDay(new Date(countdownTargetDate));
    const now = new Date();
    const diffMs = target.getTime() - now.getTime();
    
    if (diffMs > 0) {
      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
      setTimeLeft({ days, hours, minutes, seconds });
    } else {
      setTimeLeft(null);
    }
  };

  useEffect(() => {
    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [countdownTargetDate]);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowPicker(false);
    if (selectedDate) {
      setCountdownTargetDate(format(selectedDate, 'yyyy-MM-dd'));
    }
  };

  const clearTarget = () => {
    setCountdownTargetDate(null);
  };

  const padZero = (num: number) => num.toString().padStart(2, '0');

  const renderContent = () => {
    if (!countdownTargetDate) {
      return (
        <View style={styles.stateContainer}>
          <Text style={styles.promptText}>Qual a data do seu grande evento?</Text>
          <TouchableOpacity style={styles.actionButton} onPress={() => setShowPicker(true)}>
            <Text style={styles.actionButtonText}>Definir Data</Text>
          </TouchableOpacity>
        </View>
      );
    }

    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const isToday = countdownTargetDate === todayStr;
    const isPast = !isToday && startOfDay(new Date(countdownTargetDate)).getTime() < startOfDay(new Date()).getTime();

    if (isPast) {
      const targetDateObj = startOfDay(new Date(countdownTargetDate));
      const todayDateObj = startOfDay(new Date());
      const daysPassed = differenceInDays(todayDateObj, targetDateObj);
      
      return (
        <View style={styles.stateContainer}>
          <Text style={styles.heroText}>Já Passou!</Text>
          <Text style={styles.subText}>O evento foi há {daysPassed} dia(s).</Text>
          <TouchableOpacity style={styles.secondaryButton} onPress={clearTarget}>
            <Text style={styles.secondaryButtonText}>Nova Meta</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (isToday) {
      return (
        <View style={styles.stateContainer}>
          <Text style={styles.heroText}>É Hoje!</Text>
          <Text style={styles.subText}>O grande dia chegou! 🎉</Text>
          <TouchableOpacity style={styles.secondaryButton} onPress={clearTarget}>
            <Text style={styles.secondaryButtonText}>Nova Meta</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.stateContainer}>
        <View style={styles.timeGrid}>
          <View style={styles.timeBox}>
            <Text style={styles.timeValue}>{timeLeft?.days ?? 0}</Text>
            <Text style={styles.timeLabel}>Dias</Text>
          </View>
          <View style={styles.timeBox}>
            <Text style={styles.timeValue}>{padZero(timeLeft?.hours ?? 0)}</Text>
            <Text style={styles.timeLabel}>Horas</Text>
          </View>
          <View style={styles.timeBox}>
            <Text style={styles.timeValue}>{padZero(timeLeft?.minutes ?? 0)}</Text>
            <Text style={styles.timeLabel}>Min</Text>
          </View>
          <View style={styles.timeBox}>
            <Text style={styles.timeValue}>{padZero(timeLeft?.seconds ?? 0)}</Text>
            <Text style={styles.timeLabel}>Seg</Text>
          </View>
        </View>
        
        <TouchableOpacity style={styles.secondaryButton} onPress={clearTarget}>
          <Text style={styles.secondaryButtonText}>Editar Data</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Contagem Regressiva</Text>
      
      {renderContent()}

      {showPicker && (
        <DateTimePicker
          value={countdownTargetDate ? new Date(countdownTargetDate) : new Date()}
          mode="date"
          display="default"
          onChange={handleDateChange}
          minimumDate={new Date()}
          themeVariant="dark"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090B', // Zinc-950
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FAFAFA', // Zinc-50
    marginBottom: 40,
    marginTop: 60,
    letterSpacing: 0.5,
  },
  stateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    width: '100%',
    paddingBottom: 60,
  },
  promptText: {
    fontSize: 20,
    color: '#A1A1AA', // Zinc-400
    textAlign: 'center',
    marginBottom: 40,
    fontWeight: '500',
  },
  heroText: {
    fontSize: 48,
    fontWeight: '900',
    color: '#818CF8', // Indigo-400
    marginBottom: 10,
    letterSpacing: -1,
  },
  subText: {
    fontSize: 18,
    color: '#A1A1AA',
    marginBottom: 40,
  },
  timeGrid: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 60,
  },
  timeBox: {
    backgroundColor: '#18181B', // Zinc-900
    borderRadius: 24,
    width: BOX_SIZE > 160 ? 160 : BOX_SIZE, 
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#27272A', // Zinc-800
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  timeValue: {
    fontSize: 48,
    fontWeight: '800',
    color: '#FAFAFA',
    marginBottom: 4,
    fontVariant: ['tabular-nums'], // Keep numbers vertically stable
  },
  timeLabel: {
    fontSize: 14,
    color: '#A1A1AA',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    fontWeight: '600',
  },
  actionButton: {
    backgroundColor: '#FAFAFA',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 20,
    shadowColor: '#FAFAFA',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  actionButtonText: {
    color: '#09090B',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: '#18181B',
    borderWidth: 1,
    borderColor: '#27272A',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 20,
  },
  secondaryButtonText: {
    color: '#A1A1AA',
    fontSize: 15,
    fontWeight: '600',
  },
});
