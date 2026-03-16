import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import ChecklistScreen from '../screens/ChecklistScreen';
import CardsScreen from '../screens/CardsScreen';
import ChallengesScreen from '../screens/ChallengesScreen';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Checklist" component={ChecklistScreen} />
      <Tab.Screen name="Cards" component={CardsScreen} />
      <Tab.Screen name="Challenges" component={ChallengesScreen} />
    </Tab.Navigator>
  );
}
