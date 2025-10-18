import React from "react";
import { Profile, ProfileInfoRow, ZostelProfile } from "@/definitions/profile";
import { isValidString } from "@/utils/data-types/string";
import { formatNickname, getFullName, ProfileFields } from "@/utils/profile";
import { isValidObject } from "@/utils/object";
import moment from "moment";
import { StyleSheet, View } from "react-native";
import {
  SectionTitle,
  Pressable,
  Emooji,
  Text,
  Iconz,
  Icons,
} from "@/components/ui";
import { ZoChip } from ".";
import { FormattedCredit } from "@/definitions/credits";

export const getProfileInfoRows = (
  profile: Profile,
  grantsMap: Record<string, number>,
  showNameEdit: () => void,
  showNicknameEdit: () => void,
  showDOBEdit: () => void,
  showGenderEdit: () => void,
  showCitizenEdit: () => void,
  showEmailConnect: () => void,
  showCityEdit: () => void,
  credits?: FormattedCredit,
  showCredits?: () => void,
  hasTransactions?: boolean
) => {
  if (!profile) return [];

  const rightBtn = <Iconz name="rightAngle" size={16} fillTheme="ViewOnly" />;
  const fullNameContent = isValidString(getFullName(profile)) ? (
    rightBtn
  ) : grantsMap?.["first_name"] > 0 ? (
    <ZoChip amount={grantsMap["first_name"]} />
  ) : (
    rightBtn
  );

  const nickNameContent = isValidString(profile.nickname) ? null : grantsMap?.[
      "nickname"
    ] > 0 ? (
    <ZoChip amount={grantsMap["nickname"]} />
  ) : (
    rightBtn
  );

  const dobContent = isValidString(profile.date_of_birth) ? (
    rightBtn
  ) : grantsMap?.["date_of_birth"] > 0 ? (
    <ZoChip amount={grantsMap["date_of_birth"]} />
  ) : (
    rightBtn
  );

  const genderContent = profile.gender ? (
    rightBtn
  ) : grantsMap?.["gender"] > 0 ? (
    <ZoChip amount={grantsMap["gender"]} />
  ) : (
    rightBtn
  );

  const emailContent = isValidString(profile.email_address) ? (
    rightBtn
  ) : grantsMap?.["email_address"] > 0 ? (
    <ZoChip amount={grantsMap["email_address"]} />
  ) : (
    rightBtn
  );

  const citizenContent =
    isValidObject(profile.country) && isValidString(profile.country.code) ? (
      rightBtn
    ) : grantsMap?.["country"] > 0 ? (
      <ZoChip amount={grantsMap["country"]} />
    ) : (
      rightBtn
    );

  const cityContent = isValidString(profile.place_name) ? (
    rightBtn
  ) : grantsMap?.["place_name"] > 0 ? (
    <ZoChip amount={grantsMap["place_name"]} />
  ) : (
    rightBtn
  );

  if (!profile) return [];
  const list = [
    {
      id: "full-name",
      emoji: "🖋️",
      label: "Full name: ",
      value: isValidString(getFullName(profile)) ? getFullName(profile) : "",
      content: fullNameContent,
      onPress: showNameEdit,
      type: "item" as const,
    },
    {
      id: "short-name",
      emoji: "🤠",
      label: "Nick name: ",
      value: isValidString(profile.nickname)
        ? formatNickname(profile.nickname)
        : "",
      content: nickNameContent,
      onPress: isValidString(profile.nickname) ? undefined : showNicknameEdit,
      type: "item" as const,
    },
    {
      id: "date_of_birth",
      emoji: "🎈",
      label: `Birthday: `,
      value: isValidString(profile.date_of_birth)
        ? `${moment(profile.date_of_birth).format("DD MMMM")}`
        : "",
      content: dobContent,
      onPress: showDOBEdit,
      type: "item" as const,
    },
    {
      id: "gender",
      emoji:
        ProfileFields.gender.find((g) => g.id === profile.gender)?.icon || "👤",
      label: "Gender: ",
      value:
        ProfileFields.gender.find((g) => g.id === profile.gender)?.value ?? "",
      content: genderContent,
      onPress: showGenderEdit,
      type: "item" as const,
    },
    {
      id: "mobile",
      emoji: "📱",
      label: "Phone Number: ",
      value: `+${profile.mobile_number}`,
      content: <></>,
      // onPress: showMobileEdit,
      type: "item" as const,
    },
    {
      id: "email",
      emoji: "📫",
      label: "Email: ",
      value: profile.email_address ?? "",
      content: emailContent,
      onPress: showEmailConnect,
      type: "item" as const,
    },
    {
      id: "citizen",
      emoji: isValidString(profile.country?.code)
        ? profile.country.flag || "🌐"
        : "🏴‍☠️",
      label: "Proud citizen of ",
      value: isValidString(profile.country?.name) ? profile.country.name : "",
      content: citizenContent,
      onPress: showCitizenEdit,
      type: "item" as const,
    },
    // {
    //   id: "location",
    //   emoji: "📍",
    //   label: "Current City: ",
    //   value: "",
    //   content: null,
    // },
    {
      id: "city",
      emoji: "🏠",
      label: "Home City: ",
      value: profile.place_name ?? "",
      content: cityContent,
      onPress: showCityEdit,
      type: "item" as const,
    },
  ];
  if (credits && showCredits && hasTransactions) {
    list.push({
      id: "credits",
      emoji: "💰",
      label: "Zo Credits: ",
      value: credits.value,
      content: rightBtn,
      onPress: showCredits,
      type: "item",
    });
  }
  return list;
};

export const getGovIdRows = (
  openIdSheet: (id: (typeof ProfileFields)["ids"][number]) => void,
  profile?: Profile,
  zostelProfile?: ZostelProfile,
  grantsMap?: Record<string, number>
): ProfileInfoRow[] => {
  if (!profile || !zostelProfile || !profile.country.code) return [];

  const fields =
    profile.country.code === "IND"
      ? ProfileFields.ids.filter(
          (id) => id.id === "aadhar" || id.id === "passport-indian"
        )
      : ProfileFields.ids.filter((id) => id.id === "passport");

  const result: ProfileInfoRow[] = [];
  const rightBtn = <Iconz name="rightAngle" size={16} fillTheme="ViewOnly" />;

  fields.forEach((field) => {
    const hasAsset = field.pages.some((page) =>
      zostelProfile.assets?.find((asset) => asset.type === page.id)
    );
    const content = grantsMap ? (
      hasAsset ? (
        rightBtn
      ) : grantsMap?.[field.id] > 0 ? (
        <ZoChip amount={grantsMap[field.id]} />
      ) : (
        rightBtn
      )
    ) : (
      rightBtn
    );
    result.push({
      id: field.id,
      emoji: "",
      icon: field.icon.toLowerCase() as Icons,
      label: field.name,
      value: "",
      type: "item" as const,
      content,
      onPress: () => openIdSheet(field),
    });
  });

  return result;
};

export const renderItem = ({
  item,
}: {
  item:
    | ProfileInfoRow
    | {
        title: string;
        type: "title";
      };
}) =>
  item.type === "title" ? (
    <View style={styles.title}>
      <SectionTitle type="Title" noHorizontalPadding>
        {item.title}
      </SectionTitle>
    </View>
  ) : (
    <Pressable
      disabled={!item.onPress}
      key={item.id}
      activeOpacity={0.8}
      onPress={item.onPress}
      style={styles.profileDetailItem}
    >
      <View style={styles.profileDetailItemContent}>
        {item.emoji ? (
          <Emooji size={24}>{item.emoji}</Emooji>
        ) : (
          <Iconz name={item.icon as Icons} size={24} noFill />
        )}
        <Text style={styles.flex}>
          {item.label}
          <Text type="TextHighlight">{item.value}</Text>
        </Text>
      </View>
      {item.content && <View>{item.content}</View>}
    </Pressable>
  );

const styles = StyleSheet.create({
  title: { marginBottom: -16 },
  profileDetailList: { paddingHorizontal: 24, gap: 24, marginTop: 8 },
  profileDetailItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  profileDetailItemContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    flex: 1,
  },
  flex: {
    flex: 1,
  },
});
