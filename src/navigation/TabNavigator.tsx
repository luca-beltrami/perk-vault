import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Font } from '../components/theme';
import ChecklistScreen from '../screens/ChecklistScreen';
import CardsStack from './CardsStack';
import ChallengesScreen from '../screens/ChallengesScreen';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const icons: Record<string, string> = {
            Checklist: focused ? 'checkmark-circle' : 'checkmark-circle-outline',
            Cards: focused ? 'card' : 'card-outline',
            Challenges: focused ? 'trophy' : 'trophy-outline',
          };
          return <Ionicons name={icons[route.name] as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: Colors.action,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: { backgroundColor: Colors.surface, borderTopColor: Colors.border },
        tabBarLabelStyle: { fontFamily: Font.medium, fontSize: 11 },
        headerStyle: { backgroundColor: Colors.background },
        headerShadowVisible: false,
        headerTitleStyle: { fontFamily: Font.semiBold, color: Colors.textPrimary },
      })}
    >
      <Tab.Screen name="Checklist" component={ChecklistScreen} />
      <Tab.Screen name="Cards" component={CardsStack} options={{ headerShown: false }} />
      <Tab.Screen name="Challenges" component={ChallengesScreen} />
    </Tab.Navigator>
  );
}
