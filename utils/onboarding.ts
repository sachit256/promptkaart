import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'hasSeenWelcome';

export async function setHasSeenWelcome(value: boolean) {
  await AsyncStorage.setItem(KEY, value ? 'true' : 'false');
}

export async function getHasSeenWelcome(): Promise<boolean> {
  const value = await AsyncStorage.getItem(KEY);
  return value === 'true';
}

export async function resetHasSeenWelcome() {
  await AsyncStorage.removeItem(KEY);
} 