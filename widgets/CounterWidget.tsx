import React from 'react';
import {
  FlexWidget,
  TextWidget,
  ImageWidget,
} from 'react-native-android-widget';

interface CounterWidgetProps {
  totalCount: number;
  goalDays: number;
  hasAddedToday: boolean;
  countMode?: 'streak' | 'simple';
}

export function CounterWidget({ totalCount, goalDays, hasAddedToday, countMode = 'streak' }: CounterWidgetProps) {
  const percent = Math.min(Math.round((totalCount / goalDays) * 100), 100);
  const isComplete = percent >= 100;

  // Color palette
  const accentColor = isComplete ? '#F59E0B' : hasAddedToday ? '#10B981' : '#818CF8';
  const accentDim = isComplete ? '#78350F' : hasAddedToday ? '#065F46' : '#312E81';
  const accentBg = isComplete ? '#292009' : hasAddedToday ? '#042F2E' : '#1E1B4B';

  // Status emoji and text
  const statusEmoji = isComplete ? '🏆' : hasAddedToday ? '✅' : countMode === 'streak' ? '🔥' : '📊';
  const modeLabel = countMode === 'streak' ? 'SEQUÊNCIA' : 'CONTAGEM';

  // Progress bar: use flex trick, ensure minimum visible fill
  const fillFlex = percent > 0 ? percent : 0.5;
  const emptyFlex = percent < 100 ? (100 - percent) : 0.5;
  const showEmpty = percent < 100;

  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: '#09090B',
        borderRadius: 24,
        padding: 14,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      {/* ── Top row: mode label + status ── */}
      <FlexWidget
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: 'match_parent',
        }}
      >
        <TextWidget
          text={modeLabel}
          style={{
            fontSize: 8,
            fontWeight: 'bold',
            color: '#52525B',
            letterSpacing: 1,
          }}
        />
        <TextWidget
          text={statusEmoji}
          style={{
            fontSize: 14,
          }}
        />
      </FlexWidget>

      {/* ── Center: big count circle ── */}
      <FlexWidget
        style={{
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: accentBg,
          borderRadius: 999,
          width: 88,
          height: 88,
          borderWidth: 2,
          borderColor: accentColor,
        }}
      >
        <TextWidget
          text={`${totalCount}`}
          style={{
            fontSize: 30,
            fontWeight: 'bold',
            color: accentColor,
          }}
        />
        <TextWidget
          text="DIAS"
          style={{
            fontSize: 8,
            color: accentColor,
            fontWeight: 'bold',
            letterSpacing: 1,
          }}
        />
      </FlexWidget>

      {/* ── Percent label ── */}
      <TextWidget
        text={`${percent}% de ${goalDays}d`}
        style={{
          fontSize: 10,
          color: accentColor,
          fontWeight: 'bold',
        }}
      />

      {/* ── Progress Bar ── */}
      <FlexWidget
        style={{
          width: 'match_parent',
          height: 5,
          backgroundColor: '#1E1E24',
          borderRadius: 3,
          flexDirection: 'row',
          overflow: 'hidden',
        }}
      >
        <FlexWidget
          style={{
            flex: fillFlex,
            height: 'match_parent',
            backgroundColor: accentColor,
            borderRadius: 3,
          }}
        />
        {showEmpty && (
          <FlexWidget
            style={{
              flex: emptyFlex,
              height: 'match_parent',
            }}
          />
        )}
      </FlexWidget>

      {/* ── Action Button ── */}
      <FlexWidget
        clickAction={hasAddedToday ? 'OPEN_APP' : 'INCREMENT_COUNTER'}
        style={{
          width: 'match_parent',
          backgroundColor: hasAddedToday ? '#18181B' : accentBg,
          borderRadius: 12,
          paddingVertical: 7,
          borderWidth: 1,
          borderColor: hasAddedToday ? '#27272A' : accentDim,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <TextWidget
          text={hasAddedToday ? '✓  CONCLUÍDO HOJE' : '+  MARCAR HOJE'}
          style={{
            fontSize: 9,
            fontWeight: 'bold',
            color: hasAddedToday ? '#3F3F46' : accentColor,
            letterSpacing: 0.5,
          }}
        />
      </FlexWidget>
    </FlexWidget>
  );
}
