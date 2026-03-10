import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';

export type ActionType = 'ADD' | 'RESET';

export type DailyStatus = {
  [date: string]: ActionType; // 'YYYY-MM-DD' format
};

export interface LastAction {
  type: ActionType;
  previousCount: number;
  date: string;
  previousDailyStatusAction?: ActionType | null;
}

export interface CounterState {
  totalCount: number;
  dailyStatus: DailyStatus;
  lastAction: LastAction | null;
  targetDate: string | null;
  countdownTargetDate: string | null;
}

interface CounterContextType extends CounterState {
  addAction: () => void;
  resetAction: () => void;
  undoAction: () => void;
  setTargetDate: (date: string | null) => void;
  setCountdownTargetDate: (date: string | null) => void;
  isLoading: boolean;
}

const CounterContext = createContext<CounterContextType | undefined>(undefined);

const STORAGE_KEY = '@contador_state';

const getToday = () => format(new Date(), 'yyyy-MM-dd');

export const CounterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<CounterState>({
    totalCount: 0,
    dailyStatus: {},
    lastAction: null,
    targetDate: null,
    countdownTargetDate: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Load state from AsyncStorage on app start
  useEffect(() => {
    const loadState = async () => {
      try {
        const storedState = await AsyncStorage.getItem(STORAGE_KEY);
        if (storedState) {
          setState(JSON.parse(storedState));
        }
      } catch (error) {
        console.error('Failed to load state', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadState();
  }, []);

  // Save state whenever it changes
  useEffect(() => {
    if (!isLoading) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(err =>
        console.error('Failed to save state', err)
      );
    }
  }, [state, isLoading]);

  const addAction = () => {
    const today = getToday();
    if (state.dailyStatus[today] === 'ADD') {
      // Already added today, limit 1 per day
      return;
    }

    setState((prevState) => {
      const newCount = prevState.totalCount + 1;
      const previousDailyStatusAction = prevState.dailyStatus[today] || null;
      
      return {
        ...prevState,
        totalCount: newCount,
        dailyStatus: {
          ...prevState.dailyStatus,
          [today]: 'ADD',
        },
        lastAction: {
          type: 'ADD',
          previousCount: prevState.totalCount,
          date: today,
          previousDailyStatusAction,
        },
      };
    });
  };

  const resetAction = () => {
    const today = getToday();
    setState((prevState) => {
      const previousDailyStatusAction = prevState.dailyStatus[today] || null;
      
      return {
        ...prevState,
        totalCount: 0, // Reset count to 0
        dailyStatus: {
          ...prevState.dailyStatus,
          [today]: 'RESET',
        },
        lastAction: {
          type: 'RESET',
          previousCount: prevState.totalCount,
          date: today,
          previousDailyStatusAction,
        },
      };
    });
  };

  const undoAction = () => {
    const today = getToday();
    setState((prevState) => {
      const lastAction = prevState.lastAction;
      
      // Can only undo if there is a last action and it happened TODAY
      if (!lastAction || lastAction.date !== today) {
        return prevState;
      }

      const newDailyStatus = { ...prevState.dailyStatus };
      if (lastAction.previousDailyStatusAction) {
        newDailyStatus[today] = lastAction.previousDailyStatusAction;
      } else {
        delete newDailyStatus[today]; // Revert back to nothing if it was nothing
      }

      return {
        ...prevState,
        totalCount: lastAction.previousCount,
        dailyStatus: newDailyStatus,
        lastAction: null, // Once undone, cannot undo again
      };
    });
  };

  const setTargetDate = (date: string | null) => {
    setState((prevState) => ({
      ...prevState,
      targetDate: date,
    }));
  };

  const setCountdownTargetDate = (date: string | null) => {
    setState((prevState) => ({
      ...prevState,
      countdownTargetDate: date,
    }));
  };

  return (
    <CounterContext.Provider value={{ ...state, addAction, resetAction, undoAction, setTargetDate, setCountdownTargetDate, isLoading }}>
      {children}
    </CounterContext.Provider>
  );
};

export const useCounter = () => {
  const context = useContext(CounterContext);
  if (context === undefined) {
    throw new Error('useCounter must be used within a CounterProvider');
  }
  return context;
};
