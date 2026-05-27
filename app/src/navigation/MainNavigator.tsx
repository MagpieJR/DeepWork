import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import TimerScreen from '../screens/TimerScreen';
import TasksScreen from '../screens/TasksScreen';
import StatisticsScreen from '../screens/StatisticsScreen';
import SettingsScreen from '../screens/SettingsScreen';

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
          backgroundColor: '#12121a',
          borderTopColor: '#222233',
        },
        tabBarActiveTintColor: '#a0a0ff',
        tabBarInactiveTintColor: '#555566',
      }}
    >
      <Tab.Screen name="Timer" component={TimerScreen} />
      <Tab.Screen name="Tasks" component={TasksScreen} />
      <Tab.Screen name="Statistics" component={StatisticsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}
