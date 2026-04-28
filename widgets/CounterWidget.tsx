import React from 'react';
import {
  FlexWidget,
  TextWidget,
} from 'react-native-android-widget';

interface CounterWidgetProps {
  totalCount?: number;
  goalDays?: number;
  hasAddedToday?: boolean;
  countMode?: 'streak' | 'simple' | 'both';
}

export default function CounterWidget({ 
  totalCount = 0, 
  goalDays = 30, 
  hasAddedToday = false, 
  countMode = 'streak' 
}: CounterWidgetProps) {
  const displayCount = hasAddedToday ? totalCount : totalCount;
  const safeGoal = goalDays && goalDays > 0 ? goalDays : 30;
  const percent = safeGoal > 0 ? Math.min(Math.round((displayCount / safeGoal) * 100), 100) : 0;
  
  const colors = hasAddedToday 
    ? { bg: '#042F2E', border: '#10B981', text: '#10B981' }
    : { bg: '#1E1B4B', border: '#818CF8', text: '#818CF8' };
  
  const emoji = hasAddedToday ? '✅' : countMode === 'streak' ? '🔥' : '📊';
  const label = countMode === 'streak' ? 'STREAK' : countMode === 'both' ? 'BOTH' : 'COUNT';

  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        backgroundColor: '#09090B',
        padding: 12,
        borderRadius: 16,
      }}
    >
      <FlexWidget style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <TextWidget text={label} style={{ color: '#71717A', fontSize: 9, fontWeight: 'bold' }} />
        <TextWidget text={emoji} style={{ fontSize: 14 }} />
      </FlexWidget>

      <FlexWidget style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 8 }}>
        <TextWidget 
          text={`${displayCount}`} 
          style={{ color: colors.text as any, fontSize: 28, fontWeight: 'bold' }} 
        />
        <TextWidget 
          text="dias" 
          style={{ color: colors.text as any, fontSize: 8, fontWeight: 'bold' }} 
        />
      </FlexWidget>

      <FlexWidget style={{ flexDirection: 'row' }}>
        <TextWidget 
          text={`${percent}%`} 
          style={{ color: colors.text as any, fontSize: 10, fontWeight: 'bold' }} 
        />
        <TextWidget 
          text={`/ ${safeGoal}d`} 
          style={{ color: '#52525B', fontSize: 9 }} 
        />
      </FlexWidget>

      <FlexWidget style={{ flexDirection: 'row', height: 4, borderRadius: 2 }}>
        <FlexWidget style={{ flex: percent, backgroundColor: colors.text as any, height: '100%' }} />
        <FlexWidget style={{ flex: 100 - percent, backgroundColor: '#27272A', height: '100%' }} />
      </FlexWidget>

      <FlexWidget 
        clickAction={hasAddedToday ? 'OPEN_APP' : 'INCREMENT_COUNTER'}
        style={{ 
          backgroundColor: hasAddedToday ? '#18181B' : colors.bg as any, 
          borderRadius: 8, 
          paddingVertical: 6,
          borderWidth: 1,
          borderColor: hasAddedToday ? '#27272A' : colors.border as any,
        }}
      >
        <TextWidget 
          text={hasAddedToday ? '✓ Feito hoje' : '+ Marcar hoje'} 
          style={{ 
            color: hasAddedToday ? '#52525B' : colors.text as any, 
            fontSize: 9, 
            fontWeight: 'bold' 
          }} 
        />
      </FlexWidget>
    </FlexWidget>
  );
}