import React from 'react';
import {
  FlexWidget,
  TextWidget,
} from 'react-native-android-widget';

interface CounterWidgetProps {
  totalCount: number;
  goalDays: number;
  hasAddedToday: boolean;
}

export function CounterWidget({ totalCount, goalDays, hasAddedToday }: CounterWidgetProps) {
  const percent = Math.min(Math.round((totalCount / goalDays) * 100), 100);
  
  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: '#09090B',
        borderRadius: 24,
        padding: 16,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <FlexWidget
        style={{
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#18181B',
          borderRadius: 100,
          width: 80,
          height: 80,
          borderWidth: 3,
          borderColor: hasAddedToday ? '#10B981' : '#3F3F46',
        }}
      >
        <TextWidget
          text={`${totalCount}`}
          style={{
            fontSize: 28,
            fontWeight: 'bold',
            color: '#FAFAFA',
          }}
        />
        <TextWidget
          text="DIAS"
          style={{
            fontSize: 9,
            color: '#71717A',
            fontWeight: 'bold',
          }}
        />
      </FlexWidget>

      <TextWidget
        text={`${percent}% da meta`}
        style={{
          marginTop: 8,
          fontSize: 11,
          color: '#10B981',
          fontWeight: 'bold',
        }}
      />
      
      {/* Progress Bar Container */}
      <FlexWidget
        style={{
          marginTop: 6,
          width: 'match_parent',
          height: 4,
          backgroundColor: '#27272A',
          borderRadius: 2,
          flexDirection: 'row',
        }}
      >
        <FlexWidget
          style={{
            flex: percent > 0 ? percent : 0.001,
            height: 'match_parent',
            backgroundColor: '#10B981',
            borderRadius: 2,
          }}
        />
        <FlexWidget
          style={{
            flex: (100 - percent) > 0 ? (100 - percent) : 0.001,
            height: 'match_parent',
          }}
        />
      </FlexWidget>

      {/* Action Button */}
      <FlexWidget
        clickAction={hasAddedToday ? "OPEN_APP" : "INCREMENT_COUNTER"}
        style={{
          marginTop: 12,
          backgroundColor: hasAddedToday ? '#18181B' : '#042F2E',
          borderRadius: 12,
          paddingVertical: 6,
          paddingHorizontal: 20,
          borderWidth: 1,
          borderColor: hasAddedToday ? '#27272A' : '#065F46',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <TextWidget
          text={hasAddedToday ? "✓ CONCLUÍDO" : "+ MARCAR HOJE"}
          style={{
            fontSize: 10,
            fontWeight: 'bold',
            color: hasAddedToday ? '#71717A' : '#10B981',
          }}
        />
      </FlexWidget>
    </FlexWidget>
  );
}
