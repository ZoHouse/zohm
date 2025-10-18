import moment from "moment";
import Pressable from "./Pressable";
import View from "./View";
import Text from "./Text";
import Iconz from "./Iconz";
import useVisibilityState from "@/hooks/useVisibilityState";
import DatePicker from "react-native-date-picker";
import { useCallback } from "react";
import { StyleSheet } from "react-native";

interface DateInputProps {
  value?: moment.Moment;
  onChange: (date: moment.Moment) => void;
}

const todayMinus18 = moment().subtract(18, "years").toDate();

const DateInput = ({ value, onChange }: DateInputProps) => {
  const [isOpen, open, close] = useVisibilityState(false);

  const handleChange = useCallback(
    (date: Date) => {
      onChange(moment(date));
      close();
    },
    [onChange, close]
  );

  return (
    <>
      <Pressable onPress={open} activeOpacity={0.8}>
        <View background="Inputbox" style={styles.container}>
          {value ? (
            <Text>{value.format("DD/MM/YYYY")}</Text>
          ) : (
            <Text color="Secondary">{"DD/MM/YYYY"}</Text>
          )}
          <Iconz name="downAngle" size={16} fillTheme="ViewOnly" />
        </View>
      </Pressable>
      {isOpen && (
        <DatePicker
          modal
          open
          date={value ? value.toDate() : todayMinus18}
          mode="date"
          onConfirm={handleChange}
          onCancel={close}
          maximumDate={todayMinus18}
        />
      )}
    </>
  );
};

export default DateInput;

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    borderCurve: "continuous",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});
