import AsyncStorage from "@react-native-async-storage/async-storage";
import SecureKeys from "@/config/secure-keys.json";
import { randomUUID } from "expo-crypto";

type SecureKey = keyof typeof SecureKeys;

const getData = (key: SecureKey) => {
  return AsyncStorage.getItem(SecureKeys[key]).then(str => {
    if (str?.startsWith(`\"`)) {
      return JSON.parse(str)
    }
    return str;
  });
};

const storeData = (key: SecureKey, value: string) => {
  return AsyncStorage.setItem(SecureKeys[key], value);
};

const setString = (key: string, value: string) => {
  return AsyncStorage.setItem(key, value);
};
const getString = (key: string) => AsyncStorage.getItem(key);

const storeMultipleData = (data: [SecureKey, string][]) => {
  return AsyncStorage.multiSet(data.map(([key, value]) => [SecureKeys[key], value]));
};

const deleteData = (key: SecureKey) => {
  return AsyncStorage.removeItem(SecureKeys[key]);
};

const deleteMultipleData = (keys: SecureKey[]) => {
  return AsyncStorage.multiRemove(keys.map((key) => SecureKeys[key]));
};

const clearAll = (excludeKeys: SecureKey[] = []) => {
  const keys = Object.keys(SecureKeys);
  const keysToRemove = keys.filter((key) => !excludeKeys.includes(key as SecureKey));
  return AsyncStorage.multiRemove(
    keysToRemove.map((key) => SecureKeys[key as SecureKey])
  );
};

/**
 * Generates a new UUID and stores it in secure storage if it doesn't exist
 * @param key - The secure storage key to store the UUID under
 * @param id - Optional existing UUID to check
 * @returns The existing UUID if found, otherwise a newly generated UUID
 */
const generateIfNotExists = (key: SecureKey, id?: string | null) => {
  if (!id) {
    const newId = randomUUID();
    storeData(key, newId);
    return newId;
  }
  return id;
};

const storage = {
  getData,
  storeData,
  deleteData,
  storeMultipleData,
  deleteMultipleData,
  generateIfNotExists,
  clearAll,
  setString,
  getString,
};

export default storage;
