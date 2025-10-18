import React, { useCallback, useMemo } from "react";
import moment from "moment";
import { StyleSheet, View } from "react-native";
import DatePicker from "react-native-date-picker";
import useVisibilityState from "@/hooks/useVisibilityState";
import {
  Chip,
  Divider,
  Iconz,
  Pressable,
  SectionTitle,
  Text,
  TextInput,
} from "@/components/ui";
import helpers from "@/utils/styles/helpers";

const TimeEdit = ({
  timeState,
  setTimeState,
  showPreview,
  showBasicInfo,
  showGovIDs,
}: {
  timeState: { date: Date } & Record<"from" | "next", string>;
  setTimeState: React.Dispatch<
    React.SetStateAction<{ date: Date } & Record<"from" | "next", string>>
  >;
  showPreview: boolean;
  showBasicInfo: () => void;
  showGovIDs: () => void;
}) => {
  const [isTimePickerVisible, showTimePicker, hideTimePicker] =
    useVisibilityState(false);

  const onConfirm = useCallback((date: Date) => {
    setTimeState((prev) => ({ ...prev, date }));
    hideTimePicker();
  }, []);

  const timeString = useMemo(() => {
    return moment(timeState.date).format("hh:mm A");
  }, [timeState.date]);

  const handleChange = useCallback((key: "from" | "next", value: string) => {
    setTimeState((prev) => ({ ...prev, [key]: value }));
  }, []);

  return (
    <View style={styles.mv}>
      <View style={styles.timeContainer}>
        <SectionTitle
          style={helpers.flex}
          noHorizontalPadding
          subtitle="Helps us prepare your room"
        >
          Time of arrival
        </SectionTitle>
        <Pressable activeOpacity={0.8} onPress={showTimePicker}>
          <Chip background="Inputbox" style={styles.time} curve={24}>
            <Text type="TextHighlight">{timeString}</Text>
            <Iconz name="downAngle" size={16} fillTheme="Primary" />
          </Chip>
        </Pressable>
      </View>
      <Divider marginTop={8} marginBottom={8} />
      <View>
        <SectionTitle
          noHorizontalPadding
          subtitle="Required as per government rules"
        >
          Coming From*
        </SectionTitle>
        <TextInput
          placeholder="Delhi"
          keyboardType="ascii-capable"
          value={timeState.from}
          onChangeText={(value) => handleChange("from", value)}
        />
      </View>
      <Divider marginTop={24} marginBottom={8} />
      <View>
        <SectionTitle
          noHorizontalPadding
          subtitle="Get travel recommendations for your next stop!"
        >
          Next Destination*
        </SectionTitle>
        <TextInput
          placeholder="San Francisco"
          keyboardType="ascii-capable"
          value={timeState.next}
          onChangeText={(value) => handleChange("next", value)}
        />
      </View>
      <Divider marginTop={24} marginBottom={8} />
      {/* <SectionTitle noHorizontalPadding>Basic Info</SectionTitle> */}
      {!showPreview ? null : (
        <>
          <Pressable
            activeOpacity={0.8}
            onPress={showBasicInfo}
            style={styles.container}
          >
            <Text type="SectionTitle">Basic Info</Text>
            <Iconz name="check-circle" size={16} fill="#54B835" />
            <View style={helpers.flex} />
            <Iconz name="downAngle" size={16} fillTheme="Primary" />
          </Pressable>
          <Divider marginTop={8} marginBottom={8} />
          <Pressable
            onPress={showGovIDs}
            activeOpacity={0.8}
            style={styles.govIds}
          >
            <Text type="SectionTitle">Gov. ID</Text>
            <Iconz name="check-circle" size={16} fill="#54B835" />
            <View style={helpers.flex} />
            <Iconz name="downAngle" size={16} fillTheme="Primary" />
          </Pressable>
        </>
      )}
      {isTimePickerVisible && (
        <DatePicker
          mode="time"
          modal
          open={isTimePickerVisible}
          date={timeState.date}
          onConfirm={onConfirm}
          onCancel={hideTimePicker}
        />
      )}
    </View>
  );
};

export default TimeEdit;

const styles = StyleSheet.create({
  govIds: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    marginVertical: 12,
    gap: 8,
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    marginVertical: 12,
    gap: 8,
  },
  time: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 4,
  },
  topRight: { position: "absolute", top: "24%", right: 0 },
  mv: { marginVertical: 16 },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});
