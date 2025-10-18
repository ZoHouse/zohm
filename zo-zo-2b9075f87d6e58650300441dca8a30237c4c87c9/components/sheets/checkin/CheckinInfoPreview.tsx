import { useMemo } from "react";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { StyleSheet, View } from "react-native";
import moment from "moment";
import { GeneralObject } from "@/definitions/general";
import { ZostelProfileAsset } from "@/definitions/profile";
import Sheet from "../Base";
import { Iconz, SafeAreaView, SectionTitle, Text } from "@/components/ui";
import DetailList from "@/components/ui/DetailList";
import { ProfileFields } from "@/utils/profile";
import device from "@/config/Device";
import ZoImage from "@/components/ui/ZoImage";
import helpers from "@/utils/styles/helpers";

const CheckinInfoPreviewSheet = ({
  isVisible,
  onClose,
  personalInfo,
  profileMedia,
  onEdit,
  previewType,
}: {
  isVisible: boolean;
  onClose: () => void;
  previewType: "basic_info" | "gov_ids";
  personalInfo: GeneralObject;
  profileMedia?: { front: ZostelProfileAsset; back?: ZostelProfileAsset };
  onEdit: () => void;
}) => {
  const infoDetailList = useMemo(() => {
    return [
      {
        id: "first_name",
        emoji: "🖋️",
        value: (
          <Text style={helpers.flex}>
            First Name:{" "}
            <Text type="TextHighlight">{personalInfo.first_name}</Text>
          </Text>
        ),
      },
      {
        id: "last_name",
        emoji: "🖋️",
        value: (
          <Text style={helpers.flex}>
            Last Name:{" "}
            <Text type="TextHighlight">{personalInfo.last_name}</Text>
          </Text>
        ),
      },
      {
        id: "email_address",
        emoji: "📧",
        value: (
          <Text style={helpers.flex}>
            Email:{" "}
            <Text type="TextHighlight">{personalInfo.email_address}</Text>
          </Text>
        ),
      },
      // {
      //   id: "mobile_number",
      //   emoji: "📱",
      //   value: `Phone Number: *${personalInfo.mobile_number}*`,
      // },
      {
        id: "gender",
        emoji: "🙋‍♂️",
        value: (
          <Text style={helpers.flex}>
            Gender:{" "}
            <Text type="TextHighlight">{parseGender(personalInfo.gender)}</Text>
          </Text>
        ),
      },
      {
        id: "birthDate",
        emoji: "🎈",
        value: (
          <Text style={helpers.flex}>
            Date of Birth:{" "}
            <Text type="TextHighlight">
              {parseDate(personalInfo.birthDate)}
            </Text>
          </Text>
        ),
      },
      {
        id: "country",
        emoji: "🇮🇳",
        value: (
          <Text style={helpers.flex}>
            Home Country:{" "}
            <Text type="TextHighlight">{personalInfo.country?.code}</Text>
          </Text>
        ),
      },
      {
        id: "address",
        emoji: "🏠",
        value: (
          <Text style={helpers.flex}>
            Permanent Address:{" "}
            <Text type="TextHighlight">{personalInfo.address}</Text>
          </Text>
        ),
      },
    ];
  }, [personalInfo]);

  return (
    <Sheet
      isOpen={isVisible}
      onDismiss={onClose}
      snapPoints={previewType === "basic_info" ? ["60%"] : ["50%"]}
    >
      {previewType === "basic_info" ? (
        <BottomSheetScrollView>
          <SafeAreaView safeArea="bottom" style={styles.screen}>
            <SectionTitle
              type="Title"
              noHorizontalPadding
              icon="edit"
              onPress={onEdit}
            >
              Basic Info
            </SectionTitle>
            <View style={styles.mv}>
              <DetailList
                gap={16}
                style={styles.detailList}
                data={infoDetailList}
              />
            </View>
          </SafeAreaView>
        </BottomSheetScrollView>
      ) : (
        <SafeAreaView safeArea="bottom" style={styles.container}>
          <SectionTitle
            type="Title"
            noHorizontalPadding
            icon="edit"
            onPress={onEdit}
          >
            Gov. ID
          </SectionTitle>
          {profileMedia?.front.file && profileMedia.back?.file ? (
            <View style={styles.images}>
              <View style={styles.img}>
                <ZoImage url={profileMedia?.front?.file} width="s" />
              </View>
              <View style={styles.img}>
                <ZoImage url={profileMedia?.back?.file} width="s" />
              </View>
            </View>
          ) : profileMedia?.front.file ? (
            <View style={styles.images}>
              <View style={styles.singleImage}>
                <ZoImage
                  url={profileMedia?.front?.file}
                  width="sm"
                />
              </View>
            </View>
          ) : null}
          {profileMedia?.front?.identifier ? (
            <View style={styles.id}>
              <Text>
                Number:{" "}
                <Text type="TextHighlight">
                  {profileMedia.front.identifier}
                </Text>
              </Text>
              <Iconz name="check-circle" size={16} fill="#54B835" />
            </View>
          ) : null}
        </SafeAreaView>
      )}
    </Sheet>
  );
};

export default CheckinInfoPreviewSheet;

const styles = StyleSheet.create({
  screen: { flex: 1, alignSelf: "stretch", paddingHorizontal: 24 },
  mv: { marginVertical: 16 },
  id: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  img: {
    flex: 1,
    aspectRatio: 1,
    maxWidth: 180,
    borderRadius: 12,
    overflow: "hidden",
    borderCurve: "continuous",
  },
  images: {
    marginVertical: 16,
    marginBottom: 24,
    width: "100%",
    flexDirection: "row",
    gap: 16,
    justifyContent: "center",
  },
  container: { alignSelf: "stretch", paddingHorizontal: 24 },
  singleImage: {
    aspectRatio: 1.61,
    width: "100%",
    borderRadius: 12,
    overflow: "hidden",
    borderCurve: "continuous",
  },
  detailList: {
    gap: 24,
  },
});

const parseGender = (gender: string) =>
  ProfileFields.gender.find((g) => g.id === gender)?.value ?? "";

const parseDate = (date: string) => moment(date).format("DD MMM YYYY");
