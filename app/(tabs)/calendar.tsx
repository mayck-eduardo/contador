import React, { useMemo } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { useCounter } from '../../context/CounterContext';

// Configure Portuguese locale for the calendar
LocaleConfig.locales['pt-br'] = {
  monthNames: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],
  monthNamesShort: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
  dayNames: ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'],
  dayNamesShort: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
  today: 'Hoje'
};
LocaleConfig.defaultLocale = 'pt-br';

export default function CalendarScreen() {
  const { dailyStatus } = useCounter();

  const markedDates = useMemo(() => {
    const marks: any = {};
    Object.keys(dailyStatus).forEach((date) => {
      if (dailyStatus[date] === 'ADD') {
        marks[date] = { selected: true, selectedColor: '#00CC52' }; // Green
      } else if (dailyStatus[date] === 'RESET') {
        marks[date] = { selected: true, selectedColor: '#FF3333' }; // Red
      }
    });
    return marks;
  }, [dailyStatus]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Histórico</Text>
      
      <View style={styles.calendarCard}>
        <Calendar
          markedDates={markedDates}
          theme={{
            backgroundColor: '#1E1E1E',
            calendarBackground: '#1E1E1E',
            textSectionTitleColor: '#AAAAAA',
            selectedDayBackgroundColor: '#00CC52',
            selectedDayTextColor: '#ffffff',
            todayTextColor: '#00E5FF',
            dayTextColor: '#FFFFFF',
            textDisabledColor: '#444444',
            dotColor: '#00CC52',
            selectedDotColor: '#ffffff',
            arrowColor: '#00E5FF',
            monthTextColor: '#FFFFFF',
            indicatorColor: '#00E5FF',
            textDayFontFamily: 'System',
            textMonthFontFamily: 'System',
            textDayHeaderFontFamily: 'System',
            textDayFontWeight: '300',
            textMonthFontWeight: 'bold',
            textDayHeaderFontWeight: '300',
            textDayFontSize: 16,
            textMonthFontSize: 18,
            textDayHeaderFontSize: 14
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 24,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  calendarCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#333333',
  }
});
