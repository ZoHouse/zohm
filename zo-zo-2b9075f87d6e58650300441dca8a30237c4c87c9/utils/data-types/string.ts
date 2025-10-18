import CONSTANTS from "../constants";

/**
 * Checks if a value is a valid string
 * @param value - The value to check
 * @returns True if the value is a valid string, false otherwise
 */
const isValidString = (value: string | null | undefined) => {
  return typeof value === "string" && value.trim() !== "";
};

/**
 * Checks if a value is a valid email
 * @param email - The value to check
 * @returns True if the value is a valid email, false otherwise
 */
const isValidEmail = (email: string | null | undefined) =>
  isValidString(email) && CONSTANTS.REGEX_EMAIL.test(email ?? "");

/**
 * Joins an array of strings into a grammatically correct list:
 * - For a single item: returns just that item
 * - For two items: joins them with "and"
 * - For three or more items: uses commas between all items except the last one,
 *   which is joined with "and"
 *
 * Examples:
 * - ["apple"] → "apple"
 * - ["apple", "banana"] → "apple and banana"
 * - ["apple", "banana", "cherry"] → "apple, banana and cherry"
 */
function joinArrayOfStrings(arr: string[]): string {
  if (!arr || arr.length === 0) return "";
  if (arr.length === 1) return arr[0];
  if (arr.length === 2) return `${arr[0]} and ${arr[1]}`;
  if (arr.length > 2)
    return `${arr.slice(0, -1).join(", ")} and ${arr[arr.length - 1]}`;
  return "";
}

const toTitleCase = (str: string) =>
  isValidString(str)
    ? str.replace(
        /\w\S*/g,
        (txt: string) =>
          txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
      )
    : "";

/**
 * Joins an array of strings into a grammatically correct list till a limit:
 * - Given a limit N, and a list of strings, it joins them with a comma till first N items, then shows the rest as "and N others"
 *
 * Examples:
 * - 3, ["apple", "banana", "cherry", "date", "elderberry"] → "apple, banana, cherry and 2 others"
 * - 4, ["apple", "banana", "cherry", "date", "elderberry", "fig", "grape"] → "apple, banana, cherry, date and 3 others"
 */
function joinArrayOfStringsTillLimit(arr: string[], limit: number): string {
  if (!arr || arr.length === 0) return "";
  if (arr.length <= limit) return joinArrayOfStrings(arr);

  const visibleItems = arr.slice(0, limit);
  const remainingCount = arr.length - limit;

  return `${visibleItems.join(", ")} & ${remainingCount} other${
    remainingCount === 1 ? "" : "s"
  }`;
}

const formatNickname = (nickname?: string) =>
  (nickname || "").replace(".zo", "");

const svgFormatToPng = (url: string, w: number = 360) => `${url}?format=png&w=${w}`;


const toInitials = (alt?: string) => {
  if (!alt?.trim()) return "";
  if (alt.length === 1) return alt.toUpperCase();

  let initials = alt[0].toUpperCase();

  for (let i = 1; i < alt.length; i++) {
    const charPrev = alt[i - 1];
    const char = alt[i];
    if (charPrev === " ") {
      if (char.trim()) {
        initials += char.toUpperCase();
      }
    }
    if (initials.length === 2) {
      return initials;
    }
  }
  return initials;
};


export {
  isValidString,
  isValidEmail,
  joinArrayOfStrings,
  toTitleCase,
  joinArrayOfStringsTillLimit,
  formatNickname,
  svgFormatToPng,
  toInitials,
};
