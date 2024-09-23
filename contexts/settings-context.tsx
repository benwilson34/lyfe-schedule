import React, { Dispatch, createContext, useContext, useState } from "react";

const DEFAULT_MONTH_INFO_SETTINGS = {
  isShowing: true,
  monthTotalSection: {
    isTaskCountShowing: true,
    isTimeEstimateShowing: true,
  },
  dailyAverageSection: {
    isTaskCountShowing: true,
    isTimeEstimateShowing: true,
    isTimePercentageShowing: false,
  },
};
export type MonthInfoSettings = typeof DEFAULT_MONTH_INFO_SETTINGS;
const DEFAULT_DAY_INFO_SETTINGS = {
  isShowing: true,
  dayTotalSection: {
    // TODO total regardless of completed or not
  },
  remainingTaskSection: {
    isTaskCountShowing: true,
    isTimeEstimateShowing: true,
    isTimePercentageShowing: false,
  },
  completedTaskSection: {
    isTaskCountShowing: true,
    isTimeEstimateShowing: true,
    isTimePercentageShowing: false,
  },
};
export type DayInfoSettings = typeof DEFAULT_DAY_INFO_SETTINGS;

export type SettingsContext = {
  monthInfoSettings: MonthInfoSettings;
  setMonthInfoSettings: Dispatch<React.SetStateAction<MonthInfoSettings>>;
  dayInfoSettings: DayInfoSettings;
  setDayInfoSettings: Dispatch<React.SetStateAction<DayInfoSettings>>;
};

export const SettingsContext = createContext<SettingsContext | null>(null);

export default function SettingsContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // user-configurable settings
  const [monthInfoSettings, setMonthInfoSettings] = useState(
    DEFAULT_MONTH_INFO_SETTINGS
  );
  const [dayInfoSettings, setDayInfoSettings] = useState(
    DEFAULT_DAY_INFO_SETTINGS
  );

  return (
    <SettingsContext.Provider
      value={{
        monthInfoSettings,
        setMonthInfoSettings,
        dayInfoSettings,
        setDayInfoSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettingsContext() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error(
      "useSettingsContext must be used within a SettingsContextProvider"
    );
  }
  return context;
}
