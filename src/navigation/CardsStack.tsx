import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Colors, Font } from '../components/theme';
import MyCardsScreen from '../screens/MyCardsScreen';
import CardLibraryScreen from '../screens/CardLibraryScreen';

export type CardsStackParamList = {
  MyCards: undefined;
  CardLibrary: undefined;
};

const Stack = createNativeStackNavigator<CardsStackParamList>();

export default function CardsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: Colors.background },
        headerShadowVisible: false,
        headerTitleStyle: { fontFamily: Font.semiBold, color: Colors.textPrimary },

        contentStyle: { backgroundColor: Colors.background },
      }}
    >
      <Stack.Screen name="MyCards" component={MyCardsScreen} options={{ title: 'My Vault' }} />
      <Stack.Screen name="CardLibrary" component={CardLibraryScreen} options={{ title: 'Add Card' }} />
    </Stack.Navigator>
  );
}
