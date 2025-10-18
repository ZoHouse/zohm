import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Platform, StatusBar, useColorScheme } from "react-native";
import colors from "@/config/colors.json";
import { entries } from "@/utils/object";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import * as SecureStore from "expo-secure-store";
import { voidFn } from "@/utils/data-types/fn";

type Color = typeof colors;
type ColorScheme = keyof Color;
type ColorTheme = Color["light"];
type ColorKeys = keyof ColorTheme;

export type Theme = {
  [K in ColorKeys]: `${K & string}.${keyof ColorTheme[K] & string}`;
}[ColorKeys];
export type BackgroundType = keyof ColorTheme["Background"];
export type IconColorType = keyof ColorTheme["Icon"];
export type TextColorType = keyof ColorTheme["Text"];
export type StrokeColorType = keyof ColorTheme["Stroke"];

const _mergeColors = (colorObject: ColorTheme) => {
  const result = {} as Record<Theme, string>;
  entries(colorObject).forEach(([key1, value]) => {
    entries(value).forEach(([key2, value2]) => {
      const key = `${key1}.${key2}` as Theme;
      result[key] = value2;
    });
  });

  return result;
};

const _mergedColors: Record<ColorScheme, Record<Theme, string>> = {
  light: _mergeColors(colors.light),
  dark: _mergeColors(colors.dark),
};

interface ThemeContextProps {
  theme: typeof colors.light;
  colorScheme: ColorScheme;
  getColor: (color: Theme) => string;
  allColors: typeof _mergedColors;
  userTheme: ColorScheme | "system";
  selectUserTheme: (theme: ColorScheme | "system") => void;
}

const ThemeContext = createContext<ThemeContextProps>({
  theme: colors.dark,
  colorScheme: "dark",
  getColor: (color: Theme) => _getColor(color, "dark"),
  allColors: _mergedColors,
  userTheme: "dark",
  selectUserTheme: voidFn,
});

const useUserTheme = () => {
  const [userTheme, setUserTheme] = useState<ColorScheme | "system">("system");

  const selectUserTheme = useCallback((theme: ColorScheme | "system") => {
    setUserTheme(theme);
    SecureStore.setItemAsync("theme", theme);
  }, []);

  useEffect(() => {
    SecureStore.getItemAsync("theme").then((theme) => {
      if (theme) {
        selectUserTheme(theme as typeof userTheme);
      }
    });
  }, []);

  return { userTheme, selectUserTheme };
};

interface GlobalThemeProviderProps {
  children: React.ReactNode;
}

export const GlobalThemeProvider: React.FC<GlobalThemeProviderProps> = ({
  children,
}) => {
  const { userTheme, selectUserTheme } = useUserTheme();
  const systemSelectedTheme = useColorScheme() || "light";

  const finalColorScheme = useMemo(
    () =>
      (userTheme === "system" ? null : userTheme) ||
      systemSelectedTheme ||
      "light",
    [userTheme, systemSelectedTheme]
  );

  const theme = colors[finalColorScheme];
  const getColor = useCallback(
    (color: Theme) => {
      return _getColor(color, finalColorScheme);
    },
    [finalColorScheme]
  );
  const values = useMemo(
    () => ({
      theme,
      colorScheme: finalColorScheme,
      getColor,
      allColors: _mergedColors,
      userTheme,
      selectUserTheme,
    }),
    [userTheme, finalColorScheme, systemSelectedTheme]
  );

  useEffect(() => {
    if (Platform.OS === "android") {
      StatusBar.setBarStyle(
        finalColorScheme === "dark" ? "light-content" : "dark-content"
      );
    }
  }, [finalColorScheme]);

  return (
    <ThemeContext.Provider value={values}>{children}</ThemeContext.Provider>
  );
};

interface ThemeProviderProps {
  children: React.ReactNode;
  force?: ColorScheme;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  force,
}) => {
  const colorScheme = force || useColorScheme() || "light";
  const theme = colors[colorScheme];
  const getColor = useCallback(
    (color: Theme) => {
      return _getColor(color, colorScheme);
    },
    [colorScheme]
  );
  const values = useMemo(
    () => ({
      theme,
      colorScheme,
      getColor,
      allColors: _mergedColors,
      userTheme: colorScheme,
      selectUserTheme: voidFn,
    }),
    [colorScheme]
  );
  return (
    <ThemeContext.Provider value={values}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

type ThemeFunction = (isDark: boolean) => Theme;
type ThemeInput = Theme | ThemeFunction;

export const useThemeColors = <T extends ThemeInput[]>(
  themes: readonly [...T]
) => {
  const { getColor, colorScheme } = useTheme();

  return themes.map((themeInput) =>
    typeof themeInput === "function"
      ? getColor(themeInput(colorScheme === "dark"))
      : getColor(themeInput)
  ) as {
    [K in keyof T]: string;
  };
};

const _getColor = (color: Theme, scheme: ColorScheme) => {
  return _mergedColors[scheme][color];
};

export function WithDarkTheme<T extends any>(
  Component: React.ComponentType<T>
): React.ComponentType<T> {
  return (props: T) => (
    <ThemeProvider force="dark">
      <BottomSheetModalProvider>
        <Component {...(props as any)} />
      </BottomSheetModalProvider>
    </ThemeProvider>
  );
}

export function WithLightTheme<T extends any>(
  Component: React.ComponentType<T>
): React.ComponentType<T> {
  return (props: T) => (
    <ThemeProvider force="light">
      <BottomSheetModalProvider>
        <Component {...(props as any)} />
      </BottomSheetModalProvider>
    </ThemeProvider>
  );
}
