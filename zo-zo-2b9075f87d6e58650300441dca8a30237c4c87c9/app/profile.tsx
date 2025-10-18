import React, { useCallback, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import useVisibilityState from "@/hooks/useVisibilityState";
import useProfile from "@/hooks/useProfile";
import { isValidString } from "@/utils/data-types/string";
import { formatNickname, ID } from "@/utils/profile";
import useQuery from "@/hooks/useQuery";
import { logAxiosError } from "@/utils/network";
import { ProfileInfoRow } from "@/definitions/profile";
import { isValidObject } from "@/utils/object";
import moment from "moment";
import { useAuth } from "@/context/AuthContext";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { LegendList } from "@legendapp/list";
import DatePicker from "react-native-date-picker";
import { todayMinus5 } from "@/utils/data-types/date";
import {
  ZoPassport,
  ProfileHead,
  VersionInfo,
  ProfileShimmer,
} from "@/components/helpers/profile";
import {
  CreditsSheet,
  NameSheet,
  ConnectEmail,
  NicknameEdit,
  HomeCity,
  IDSheet,
  GenderSheet,
} from "@/components/sheets/profile";
import { CountrySearch } from "@/components/sheets/";
import {
  View as Ziew,
  GradientHeader,
  SafeAreaView,
  Text,
  Iconz,
  Pressable,
} from "@/components/ui/";
import {
  getProfileInfoRows,
  renderItem,
  getGovIdRows,
} from "@/components/helpers/profile/utils";
import useCredits from "@/hooks/useCredit";
import { router } from "expo-router";

export default function () {
  const [isNicknameEditOpen, showNicknameEdit, hideNicknameEdit] =
    useVisibilityState(false);
  const [isNameEditOpen, showNameEdit, hideNameEdit] =
    useVisibilityState(false);
  const [isDOBEditOpen, showDOBEdit, hideDOBEdit] = useVisibilityState(false);
  const [isGenderEditOpen, showGenderEdit, hideGenderEdit] =
    useVisibilityState(false);
  const [isCitizenEditOpen, showCitizenEdit, hideCitizenEdit] =
    useVisibilityState(false);
  const [isCityEditOpen, showCityEdit, hideCityEdit] =
    useVisibilityState(false);
  const [isEmailConnectOpen, showEmailConnect, hideEmailConnect] =
    useVisibilityState(false);
  const [isCreditsOpen, showCredits, hideCredits] = useVisibilityState(false);

  const [selectedId, setSelectedId] = useState<ID | null>(null);

  const { profile, zostelProfile, updateProfile } = useProfile();
  const { data: grants } = useQuery("PROFILE_COMPLETION_GRANTS", {
    select: (data) => data.data.results,
    enabled: isValidObject(profile),
    throwOnError: (er) => {
      logAxiosError(er);
      return false;
    },
  });

  const { credits, hasTransactions } = useCredits();

  const [grantsMap, completionMap] = useMemo(() => {
    const results: Record<string, number> = {};
    const completion: { done: number; total: number } = { done: 0, total: 1 };
    if (!profile || !grants?.length) return [results, completion];
    completion.done = 0;
    completion.total = grants.length;
    grants?.forEach((grant) => {
      if (!profile[grant.field]) {
        results[grant.field] = grant.amount;
      } else {
        completion.done++;
      }
    });
    return [results, completion];
  }, [grants, profile]);

  const listData: ({ title: string; type: "title" } | ProfileInfoRow)[] =
    useMemo(() => {
      if (!profile || !zostelProfile) return [];
      const profileInfo: ProfileInfoRow[] = getProfileInfoRows(
        profile,
        grantsMap,
        showNameEdit,
        showNicknameEdit,
        showDOBEdit,
        showGenderEdit,
        showCitizenEdit,
        showEmailConnect,
        showCityEdit,
        credits,
        showCredits,
        hasTransactions
      );
      const result = [
        { title: "Personal Info" as string, type: "title" } as const,
        ...profileInfo,
      ];
      const govIdRows = getGovIdRows(
        setSelectedId,
        profile,
        zostelProfile,
        grantsMap
      );
      if (govIdRows.length) {
        result.push({ title: "Government IDs", type: "title" } as const);
        result.push(...govIdRows);
      }
      return result;
    }, [profile, zostelProfile, grantsMap, credits, hasTransactions]);

  const handleDobEdit = useCallback(
    (date: Date) => {
      updateProfile({
        date_of_birth: moment(date).format("YYYY-MM-DD"),
      });
      hideDOBEdit();
    },
    [updateProfile]
  );

  const handleCountrySelect = useCallback(
    (country: string) => {
      updateProfile(
        {
          // @ts-ignore
          country: country,
        },
        {
          onError: logAxiosError,
        }
      );
      hideCitizenEdit();
    },
    [updateProfile]
  );

  const onBookingPress = useCallback(() => {
    router.push("/booking/all");
  }, []);

  const listHead = useMemo(
    () =>
      !profile ? null : (
        <SafeAreaView safeArea="top">
          <View style={styles.head} />
          <View style={styles.passport}>
            <ZoPassport
              avatar={profile.avatar.image}
              name={formatNickname(profile.nickname)}
              founder={profile.membership === "founder"}
              done={completionMap.done}
              total={completionMap.total}
              placeholder="Your nick name"
              onPress={showNicknameEdit}
            />
          </View>
          <Pressable
            activeOpacity={0.8}
            onPress={onBookingPress}
            style={styles.bookBar}
          >
            <Ziew style={styles.booking} background="Input">
              <Iconz name="calendar" size={16} fillTheme="ViewOnly" />
              <Text style={styles.flex}>My Bookings</Text>
              <Iconz name="rightAngle" size={16} fillTheme="ViewOnly" />
            </Ziew>
          </Pressable>
        </SafeAreaView>
      ),
    [profile, completionMap]
  );

  const listFooter = useMemo(() => <VersionInfo />, []);

  const keyExtractor = useCallback((item: (typeof listData)[number]) => {
    if (item.type === "item") return item.id;
    return item.title.toLowerCase();
  }, []);

  return (
    <Ziew background style={styles.flex}>
      {!(profile && zostelProfile) ? (
        <Animated.View
          style={styles.flex}
          entering={FadeIn}
          exiting={FadeOut}
          key="shimmer"
        >
          <ProfileShimmer />
        </Animated.View>
      ) : (
        <View style={styles.flex}>
          <LegendList
            data={listData}
            ListHeaderComponent={listHead}
            ListFooterComponent={listFooter}
            showsVerticalScrollIndicator={false}
            keyExtractor={keyExtractor}
            contentContainerStyle={styles.contentContainer}
            renderItem={renderItem}
          />
          <GradientHeader>
            <ProfileHead />
          </GradientHeader>
          {isNameEditOpen && profile && (
            <NameSheet isOpen={isNameEditOpen} onDismiss={hideNameEdit} />
          )}
          {isDOBEditOpen && (
            <DatePicker
              modal
              open
              date={
                isValidString(profile?.date_of_birth)
                  ? new Date(profile!.date_of_birth!)
                  : todayMinus5
              }
              mode="date"
              onConfirm={handleDobEdit}
              onCancel={hideDOBEdit}
              maximumDate={todayMinus5}
            />
          )}
          {isEmailConnectOpen && (
            <ConnectEmail
              isOpen={isEmailConnectOpen}
              onDismiss={hideEmailConnect}
            />
          )}
          {isNicknameEditOpen && (
            <NicknameEdit
              isOpen={isNicknameEditOpen}
              onDismiss={hideNicknameEdit}
            />
          )}
          {isCitizenEditOpen && (
            <CountrySearch
              isOpen={isCitizenEditOpen}
              onDismiss={hideCitizenEdit}
              selectedValue={profile.country}
              onSelectCountryCode={handleCountrySelect}
            />
          )}
          {isCityEditOpen && profile && (
            <HomeCity
              isOpen={isCityEditOpen}
              onDismiss={hideCityEdit}
              name={profile.first_name}
            />
          )}
          {selectedId && profile && (
            <IDSheet
              isOpen={!!selectedId}
              onDismiss={() => setSelectedId(null)}
              id={selectedId}
            />
          )}
          {isCreditsOpen && (
            <CreditsSheet isOpen={isCreditsOpen} onClose={hideCredits} />
          )}
          {isGenderEditOpen && (
            <GenderSheet
              isOpen={isGenderEditOpen}
              onDismiss={hideGenderEdit}
              gender={profile.gender}
            />
          )}
        </View>
      )}
    </Ziew>
  );
}

const styles = StyleSheet.create({
  passport: {
    marginTop: 12,
    marginBottom: 24,
  },

  flex: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    gap: 24,
    paddingBottom: 72,
  },
  head: {
    height: 56,
  },
  booking: {
    borderRadius: 16,
    borderCurve: "continuous",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
  },
  bookBar: {
    marginBottom: 16,
    marginTop: 24,
  },
});
