import {
  Divider,
  EmailInput,
  Pressable,
  SectionTitle,
  TextInput,
} from "@/components/ui";
import CountryPicker from "@/components/ui/CountryPicker";
import RadioFields from "@/components/ui/RadioFields";
import { GeneralObject } from "@/definitions/general";
import useVisibilityState from "@/hooks/useVisibilityState";
import { isValidString } from "@/utils/data-types/string";
import { ProfileFields } from "@/utils/profile";
import moment from "moment";
import { useCallback, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import DatePicker from "react-native-date-picker";

const genderOptions = ProfileFields.gender.map((g) => ({
  id: g.id,
  title: g.value,
  emoji: g.icon,
}));

const thisYearMinus16 = new Date(
  new Date().setFullYear(new Date().getFullYear() - 16)
);
const thisYearMinus100 = new Date(
  new Date().setFullYear(new Date().getFullYear() - 100)
);

const PersonalInfoEdit = ({
  personalInfo: formData,
  setPersonalInfo,
  onEditEmailAddress,
}: {
  personalInfo: GeneralObject;
  setPersonalInfo: React.Dispatch<React.SetStateAction<GeneralObject>>;
  onEditEmailAddress: (email: string) => void;
}) => {
  const [isShowingDatePicker, openDatePicker, closeDatePicker] =
    useVisibilityState(false);
  const handleChange = (key: string, value: any) => {
    setPersonalInfo((prev) => ({ ...prev, [key]: value }));
  };
  const handleDOBEdit = useCallback(
    (date: Date) => {
      const dateStr = moment(date).format("YYYY-MM-DD");
      setPersonalInfo((prev) => ({ ...prev, birthDate: dateStr }));
      closeDatePicker();
    },
    [closeDatePicker]
  );

  const dobString = useMemo(() => {
    if (isValidString(formData?.birthDate)) {
      return moment(formData?.birthDate).format("DD/MM/YYYY");
    }
    return "";
  }, [formData?.birthDate]);

  return (
    <View style={styles.mv}>
      <View style={styles.gap}>
        <TextInput
          placeholder="First Name*"
          value={formData.first_name}
          onChangeText={(value) => handleChange("first_name", value)}
        />
        <TextInput
          placeholder="Last Name*"
          value={formData.last_name}
          onChangeText={(value) => handleChange("last_name", value)}
        />
        <EmailInput
          placeholder="Your Email*"
          value={formData.email_address}
          onChangeText={onEditEmailAddress}
        />
      </View>
      <Divider marginTop={24} marginBottom={8} />
      <SectionTitle noHorizontalPadding>Gender*</SectionTitle>
      <RadioFields
        items={genderOptions}
        style={styles.gender}
        selected={formData.gender}
        onSelect={(value) => handleChange("gender", value)}
      />
      <Divider marginTop={16} marginBottom={24} />
      <CountryPicker
        country={formData.country}
        setCountry={(value) => handleChange("country", value)}
      />
      <Divider marginTop={24} marginBottom={8} />
      <SectionTitle noHorizontalPadding>Date of Birth*</SectionTitle>
      <Pressable activeOpacity={0.8} onPress={openDatePicker}>
        <TextInput
          placeholder="DD/MM/YYYY"
          value={dobString}
          editable={false}
          pointerEvents="none"
        />
      </Pressable>
      <Divider marginTop={24} marginBottom={8} />
      <SectionTitle
        noHorizontalPadding
        subtitle="Required as per government rules"
      >
        Permanent Address*
      </SectionTitle>
      <TextInput
        value={formData.address}
        onChangeText={(value) => handleChange("address", value)}
        placeholder="Your complete address goes here"
        numberOfLines={4}
        style={styles.address}
        textAlignVertical="top"
        multiline
      />
      {isShowingDatePicker && (
        <DatePicker
          modal
          mode="date"
          open={isShowingDatePicker}
          date={
            isValidString(formData?.birthDate)
              ? new Date(formData?.birthDate)
              : new Date()
          }
          onConfirm={handleDOBEdit}
          onCancel={closeDatePicker}
          maximumDate={thisYearMinus16}
          minimumDate={thisYearMinus100}
        />
      )}
    </View>
  );
};

export default PersonalInfoEdit;

const styles = StyleSheet.create({
  countryItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 12,
    borderCurve: "continuous",
    height: 56,
    gap: 12,
    paddingHorizontal: 16,
  },
  countryItemActive: {
    //   backgroundColor: Colors.Background.Card,
  },
  countryItemTextContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    overflow: "hidden",
  },
  selectedCountryItem: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  // countryItemText: { ...Typography.Paragraph, color: Colors.Text.Primary },
  mv: { marginVertical: 16 },
  gap: { gap: 16 },
  mh: { marginHorizontal: -24 },
  address: { height: 120 },
  gender: {
    marginTop: 16,
    gap: 8,
  },
});
