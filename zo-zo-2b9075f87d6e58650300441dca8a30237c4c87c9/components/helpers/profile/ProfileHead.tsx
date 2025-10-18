import React, { memo } from "react";
import { StyleSheet, View } from "react-native";
import useVisibilityState from "@/hooks/useVisibilityState";
import { ZoTotalCoins } from "@/components/helpers/zo";
import { CurrencySheet } from "@/components/sheets";
import { Iconz, Pressable } from "@/components/ui";
import { ProfileActions, SettingsMenu } from "@/components/sheets/profile";
import { router } from "expo-router";

const ProfileHead = () => {
  const [isSettingsMenuOpen, showSettingsMenu, hideSettingsMenu] =
    useVisibilityState(false);
  const [isProfileActionsOpen, showProfileActions, hideProfileActions] =
    useVisibilityState(false);
  const [isCurrencySheetOpen, showCurrencySheet, hideCurrencySheet] =
    useVisibilityState(false);

  return (
    <>
      <View style={styles.head}>
        <View style={styles.headRight}>
          <Pressable onPress={router.back}>
            <Iconz name="arrow-left" size={24} />
          </Pressable>
        </View>
        <View style={styles.headRight}>
          <ZoTotalCoins animate />
          <Pressable onPress={showSettingsMenu}>
            <Iconz name="settings" size={24} />
          </Pressable>
          <Pressable onPress={showProfileActions}>
            <Iconz name="more" size={24} />
          </Pressable>
        </View>
      </View>
      {isProfileActionsOpen && (
        <ProfileActions
          isOpen={isProfileActionsOpen}
          onDismiss={hideProfileActions}
        />
      )}
      {isSettingsMenuOpen && (
        <SettingsMenu
          isOpen={isSettingsMenuOpen}
          onDismiss={hideSettingsMenu}
          openCurrencySheet={showCurrencySheet}
        />
      )}
      {isCurrencySheetOpen && (
        <CurrencySheet
          isOpen={isCurrencySheetOpen}
          onClose={hideCurrencySheet}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  head: {
    paddingHorizontal: 24,
    height: 56,
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headRight: {
    flexDirection: "row",
    gap: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  padRight: { paddingRight: 24 },
});

export default memo(ProfileHead);
