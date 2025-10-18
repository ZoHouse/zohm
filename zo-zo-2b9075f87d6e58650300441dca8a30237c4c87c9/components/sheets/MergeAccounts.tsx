import { MergeResponse } from "@/definitions/auth";
import { StyleSheet, View } from "react-native";
import Sheet from "./Base";
import {
  Avatar,
  Button,
  Chip,
  Divider,
  Iconz,
  Pressable,
  SafeAreaView,
  Text,
} from "../ui";
import helpers from "@/utils/styles/helpers";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { useCallback, useMemo, useState } from "react";
import { isValidString } from "@/utils/data-types/string";
import moment from "moment";
import useProfile from "@/hooks/useProfile";
import RadioFields from "../ui/RadioFields";
import useMutation from "@/hooks/useMutation";
import { RequireAtLeastOne } from "type-fest";
import { Profile } from "@/definitions/profile";
import { showToast } from "@/utils/toast";
import { logAxiosError } from "@/utils/network";

interface MergeAccountsProps {
  isOpen: boolean;
  onDismiss: () => void;
  onSuccess: () => void;
  mergeResponse: MergeResponse;
}

const MergeAccountsSheet: React.FC<MergeAccountsProps> = ({
  isOpen,
  mergeResponse,
  onDismiss,
  onSuccess,
}) => {
  const { mutateAsync: mergeAccounts } = useMutation("AUTH_MERGE_ACCOUNTS");

  const [selectedCustomNickname, setSelectedCustomNickname] =
    useState<string>("");

  const [isLoading, setIsLoading] = useState(false);

  const { profile, updateProfile, refetchProfile } = useProfile();

  const merge = useCallback(() => {
    setIsLoading(true);
    mergeAccounts({
      merge_id: mergeResponse.merge_id,
      verification: mergeResponse.auth,
      path: "email/",
    })
      .then(() => {
        if (
          conflictingNicknames.length > 0 &&
          selectedCustomNickname !== profile?.custom_nickname
        ) {
          const updateData: RequireAtLeastOne<Profile> = {
            custom_nickname: selectedCustomNickname,
          };
          if (
            isValidString(profile?.nickname) &&
            profile?.nickname === profile?.custom_nickname
          ) {
            updateData.selected_nickname = "custom";
          }
          updateProfile(updateData, {
            onSuccess: () => {
              showToast({
                message: "Zo Zo Zo! Accounts merged.",
                type: "success",
              });
              refetchProfile();
              onSuccess();
            },
            onError: (er) => {
              logAxiosError(er);
              onDismiss();
            },
          });
        } else {
          showToast({
            message: "Zo Zo Zo! Accounts merged.",
            type: "success",
          });
          refetchProfile();
          onSuccess();
        }
      })
      .catch((er) => {
        logAxiosError(er);
        onDismiss();
      });
  }, [mergeResponse, selectedCustomNickname, profile]);

  const conflictingNicknames = useMemo(() => {
    if (
      mergeResponse &&
      isValidString(mergeResponse.custom_nickname) &&
      profile &&
      isValidString(profile.custom_nickname)
    ) {
      return [mergeResponse.custom_nickname, profile.custom_nickname];
    }
    return [];
  }, [mergeResponse, profile]);

  const conflictingRadio = useMemo(() => {
    return conflictingNicknames.filter(Boolean).map((n) => ({
      id: n ?? "",
      emoji: "🤠",
      title: n ?? "",
    }));
  }, [conflictingNicknames]);

  return (
    <Sheet
      isOpen={isOpen}
      onDismiss={onDismiss}
      fullScreen
      enableContentPanningGesture={false}
      keyboardBlurBehavior="restore"
    >
      <SafeAreaView safeArea style={helpers.flex}>
        <BottomSheetScrollView
          showsVerticalScrollIndicator={false}
          style={styles.flex}
          contentContainerStyle={styles.scrollView}
        >
          <Text type="Title">
            Found an existing Zo account linked with{" "}
            {mergeResponse.auth.email_address}
          </Text>
          <Chip style={styles.accountContainer} stroke="Secondary">
            <View style={styles.accountRow}>
              <Avatar
                uri={mergeResponse.pfp_image}
                alt={mergeResponse.nickname}
                size={40}
              />
              <View style={styles.accountData}>
                {isValidString(mergeResponse.nickname) && (
                  <Text type="TextHighlight" numberOfLines={1}>
                    {mergeResponse.nickname}
                  </Text>
                )}
                <Text type="Subtitle" color="Secondary" numberOfLines={1}>
                  {mergeResponse.email_address}
                </Text>
              </View>
            </View>
            <Divider />
            <View style={styles.accountRow}>
              <View style={styles.infoIconContainer}>
                <Iconz name="info" size={24} fillTheme="ViewOnly" />
              </View>
              <Text type="Tertiary" color="Secondary">
                Created on{" "}
                {moment(mergeResponse.created_at).format("DD MMM YYYY")} at{" "}
                {moment(mergeResponse.created_at).format("LT")}
              </Text>
            </View>
          </Chip>
          {conflictingNicknames.length > 0 && (
            <>
              <Divider marginBottom={24} marginTop={30} />
              <View>
                <Text type="SectionTitle">
                  To merge this account, please select the username you wish to
                  keep
                </Text>
                <Chip background="Input" style={styles.usernameCards}>
                  <RadioFields
                    items={conflictingRadio}
                    onSelect={setSelectedCustomNickname}
                    selected={selectedCustomNickname}
                    gap={16}
                  />
                </Chip>
              </View>
            </>
          )}
        </BottomSheetScrollView>
        <View style={styles.footer}>
          <Button isLoading={isLoading} onPress={merge}>
            Zo Zo Zo! Merge Accounts
          </Button>
          <Pressable onPress={onDismiss}>
            <Text
              type="TextHighlight"
              color="ButtonSecondary"
              style={styles.textButton}
            >
              Nah, Leave it.
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Sheet>
  );
};

export default MergeAccountsSheet;

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollView: {
    padding: 24,
  },
  accountContainer: {
    marginTop: 24,
    borderWidth: 1,
    borderRadius: 16,
    borderCurve: "continuous",
  },
  accountRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  accountData: {
    flex: 1,
    // gap: 2,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  usernameCards: {
    borderRadius: 16,
    borderCurve: "continuous",
    marginTop: 24,
    padding: 16,
  },
  usernameCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    position: "relative",
  },
  usernameDetails: {
    gap: 12,
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  footer: {
    flexShrink: 0,
    padding: 24,
  },
  textButton: {
    textAlign: "center",
    padding: 16,
    marginTop: 8,
  },
});
