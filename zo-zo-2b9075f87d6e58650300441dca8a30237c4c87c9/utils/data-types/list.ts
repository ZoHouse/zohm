/**
 * Divides a list into two halves.
 * @param list - The list to divide.
 * @returns An array containing two halves of the list.
 */
export const divideListIntoHalf = <T>(list: T[]) => {
  const halfIndex = Math.ceil(list.length / 2);
  const firstHalf = list.slice(0, halfIndex);
  const secondHalf = list.slice(halfIndex);
  return [firstHalf, secondHalf] as const;
};

/*
 * Groups a list into sublists of a given size.
 * @param list - The list to group.
 * @param size - The size of each group.
 * @param fillWith - The value to fill the last group with if it has fewer elements than the size.
 * @returns An array of sublists.
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

/**
 * Groups a list into two halves based on a condition.
 * @param arr - The list to group.
 * @param fn - The condition to group by.
 * @returns An array containing two halves of the list.
 */
export const groupListByCondition = <T>(
  arr: T[],
  fn: (val: T) => boolean
): [T[], T[]] => {
  const yes: T[] = [];
  const no: T[] = [];

  arr.forEach((val) => {
    if (fn(val)) {
      yes.push(val);
    } else {
      no.push(val);
    }
  });

  return [yes, no] as const;
};

/**
 * Divides a list into two halves, alternating between every element.
 * @param list - The list to divide.
 * @returns An array containing two halves of the list.
 * eg: [1,2,3,4,5,6,7,8] -> [[1,3,5,7], [2,4,6,8]]
 */
export const divideAlternate = <T>(list: T[]) => {
  const firstHalf = [];
  const secondHalf = [];
  for (let i = 0; i < list.length; i++) {
    if (i % 2 === 0) {
      firstHalf.push(list[i]);
    } else {
      secondHalf.push(list[i]);
    }
  }
  return [firstHalf, secondHalf] as const;
};
