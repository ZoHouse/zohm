import { Entries } from "type-fest";

/**
 * Returns an array of the keys of an object
 * @param obj - The object to get the keys of
 * @returns An array of the keys of the object
 */
export const keys = <T extends object>(obj: T) =>
  Object.keys(obj) as Array<keyof T>;

/**
 * Returns an array of the values of an object
 * @param obj - The object to get the values of
 * @returns An array of the values of the object
 */
export const values = <T extends object>(obj: T) =>
  Object.values(obj) as Array<T[keyof T]>;

/**
 * Returns an array of the values of an object
 * @param obj - The object to get the values of
 * @returns An array of the values of the object
 */
export const entries = <T extends object>(obj: T) =>
  Object.entries(obj) as Entries<T>;

/**
 * Formats a JSON object into a string with 2 spaces of indentation
 * @param json - The JSON object to format
 * @returns A string representation of the JSON object with 2 spaces of indentation
 */
export const formatJson = (json: object, space = 2) => {
  return JSON.stringify(json, null, space);
};

/**
 * Groups an array into a list of arrays of a given size
 * @param list - The array to group
 * @param size - The size of the groups
 * @param fillWith - The value to fill the last group with if it has fewer elements than the size
 * @returns A list of arrays of the given size
 */
export const groupList = <T, F>(list: T[], size: number, fillWith?: F) => {
  const result: (T | F)[][] = [];
  for (let i = 0; i < list.length; i++) {
    const groupIndex = Math.floor(i / size);
    if (!result[groupIndex]) {
      result[groupIndex] = [];
    }
    result[groupIndex].push(list[i]);
  }

  // If the last group has fewer elements than the size, fill it with '-'
  const lastGroup = result[result.length - 1];
  if (lastGroup && lastGroup.length < size && fillWith) {
    const remaining = size - lastGroup.length;
    for (let i = 0; i < remaining; i++) {
      lastGroup.push(fillWith);
    }
  }

  return result;
};

type ValidKey = string | number | symbol;
type ValidKeys<T> = {
  [K in keyof T]: T[K] extends ValidKey ? K : never;
}[keyof T];

/*
  Groups an array by a key
  @param array - The array to group
  @param key - The key to group by
  @returns A record of the grouped array
*/
export const groupBy = <T extends object, K extends ValidKeys<T>>(
  array: T[],
  key: K
) => {
  return array.reduce((acc, item) => {
    const id = item[key] as T[K] & ValidKey;
    if (!acc[id]) {
      acc[id] = [];
    }
    acc[id].push(item);
    return acc;
  }, {} as Record<T[K] & ValidKey, T[]>);
};

/*
  Groups an array by a key
  @param array - The array to group
  @param key - The key to group by
  @returns A key value pair.
*/
export const toMapBy = <T extends object, K extends ValidKeys<T>>(
  array: T[],
  key: K
) => {
  return array.reduce((acc, item) => {
    const id = item[key] as T[K] & ValidKey;
    acc[id] = item;;
    return acc;
  }, {} as Record<T[K] & ValidKey, T>);
};

/**
 * Returns a circular slice of an array
 * @param array - The array to slice
 * @param start - The start index of the slice
 * @param length - The length of the slice
 * @returns A circular slice of the array
 */
export const circularSlice = <T>(array: T[], start: number, length: number) => {
  const result: T[] = [];
  for (let i = 0; i < length; i++) {
    result.push(array[(start + i) % array.length]);
  }
  return result;
};

/**
 * Checks if an object is valid
 * @param data - The object to check
 * @returns True if the object is valid, false otherwise
 */
export const isValidObject = (data: any) =>
  data != null && typeof data === "object" && Object.keys(data).length > 0;
