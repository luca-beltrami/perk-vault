import React from 'react';
import { enableScreens } from 'react-native-screens';
import { NavigationContainer } from '@react-navigation/native';
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import TabNavigator from './src/navigation/TabNavigator';
import { AppStateProvider } from './src/context/AppStateContext';

enableScreens();

export default function App() {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  if (!fontsLoaded) return null;

  return (
    <AppStateProvider>
      <NavigationContainer>
        <TabNavigator />
      </NavigationContainer>
    </AppStateProvider>
  );
}
