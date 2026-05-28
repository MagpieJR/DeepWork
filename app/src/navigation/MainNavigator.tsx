import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import TimerScreen from '../screens/TimerScreen';
import TasksScreen from '../screens/TasksScreen';
import StatisticsScreen from '../screens/StatisticsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { C, MONO } from '../theme';

export type MainTabParamList = {
  Timer: undefined;
  Tasks: undefined;
  Statistics: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="Timer"
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: C.canvas,
          borderTopColor: C.hairline,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 84 : 60,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          paddingTop: 10,
        },
        tabBarActiveTintColor: C.onDark,
        tabBarInactiveTintColor: C.muted,
        tabBarLabelStyle: {
          fontFamily: MONO,
          fontSize: 9,
          letterSpacing: 1.5,
          textTransform: 'uppercase',
          marginTop: 2,
        },
        tabBarIconStyle: { display: 'none' },
      }}
    >
      <Tab.Screen name="Timer"      component={TimerScreen}      />
      <Tab.Screen name="Tasks"      component={TasksScreen}      />
      <Tab.Screen name="Statistics" component={StatisticsScreen} />
      <Tab.Screen name="Settings"   component={SettingsScreen}   />
    </Tab.Navigator>
  );
}
