// App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

import HomeScreen from './src/screens/HomeScreen';
import BoxesStackNavigator from './src/navigation/BoxesStackNavigator';
import HistoryScreen from './src/screens/HistoryScreen';
import AnalyticsScreen from './src/screens/AnalyticsScreen';
import SettingsScreen from './src/screens/SettingsScreen';

import { ThemeProvider, useThemeColors } from './src/theme/ThemeContext';
import { DataProvider } from './src/data/DataContext';
import { ToastProvider } from './src/components/ToastContext';

const Tab = createBottomTabNavigator();

function AppTabs() {
  const theme = useThemeColors();

  return (
    <>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      <NavigationContainer theme={theme.navigationTheme}>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarActiveTintColor: theme.accent,
            tabBarInactiveTintColor: theme.tabBarInactive,
            tabBarStyle: {
              backgroundColor: theme.tabBarBg,
              borderTopColor: theme.tabBarBorder,
            },
            tabBarIcon: ({ color, size, focused }) => {
              let iconName = 'home-outline';
              if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
              if (route.name === 'Boxes') iconName = focused ? 'cube' : 'cube-outline';
              if (route.name === 'History') iconName = focused ? 'time' : 'time-outline';
              if (route.name === 'Analytics') iconName = focused ? 'stats-chart' : 'stats-chart-outline';
              if (route.name === 'Settings') iconName = focused ? 'settings' : 'settings-outline';
              return <Ionicons name={iconName} size={size} color={color} />;
            },
          })}
        >
          <Tab.Screen name="Home" component={HomeScreen} options={{ title: '首頁' }} />
          <Tab.Screen name="Boxes" component={BoxesStackNavigator} options={{ title: '共享箱' }} />
          <Tab.Screen name="History" component={HistoryScreen} options={{ title: '紀錄' }} />
          <Tab.Screen name="Analytics" component={AnalyticsScreen} options={{ title: '統計' }} />
          <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: '設定' }} />
        </Tab.Navigator>
      </NavigationContainer>
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <DataProvider>
        <ToastProvider>
          <AppTabs />
        </ToastProvider>
      </DataProvider>
    </ThemeProvider>
  );
}
