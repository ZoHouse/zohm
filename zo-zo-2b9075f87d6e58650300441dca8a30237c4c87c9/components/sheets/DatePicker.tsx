import { StyleSheet, View } from "react-native";
import { BottomSheetView } from "@gorhom/bottom-sheet";
import CalendarPicker, {
  DateChangedCallback,
} from "react-native-calendar-picker";
import { useBooking } from "@/context/BookingContext";
import { useCallback, useMemo, useState } from "react";
import moment from "moment";
import Typography from "@/config/typography.json";
import Colors from "@/config/colors.json";
import { useThemeColors } from "@/context/ThemeContext";
import Sheet from "@/components/sheets/Base";
import SectionTitle from "@/components/ui/SectionTitle";
import SafeAreaView from "@/components/ui/SafeAreaView";
import Iconz from "@/components/ui/Iconz";
import Button from "@/components/ui/Button";
import Text from "@/components/ui/Text";
import Logger from "@/utils/logger";

interface DatePickeSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
  title?: string;
}

const DatePickerSheet = ({
  isOpen,
  onClose,
  onSave,
  title = "Select Dates",
}: DatePickeSheetProps) => {
  const { startDate, endDate, setStartDate, setEndDate } = useBooking();
  const [_startDate, _setStartDate] = useState<Date | undefined>(
    startDate.toDate()
  );
  const [_endDate, _setEndDate] = useState<Date | undefined>(endDate.toDate());

  const handleSave = useCallback(() => {
    setStartDate(moment(_startDate));
    setEndDate(moment(_endDate));
    if (onSave) {
      onSave();
    }
    onClose();
    if (_startDate && _endDate) {
      Logger.dateUpdate(
        moment(_startDate).format("YYYY-MM-DD"),
        moment(_endDate).format("YYYY-MM-DD")
      );
    }
  }, [onSave, onClose, _startDate, _endDate]);

  const handleDateChange: DateChangedCallback = useCallback((date, type) => {
    if (type === "END_DATE") {
      _setEndDate(date);
    } else {
      _setStartDate(date);
      _setEndDate(undefined);
    }
  }, []);

  const [textSecondary, buttonPrimary, textButtonPrimary, textPrimary] =
    useThemeColors([
      "Text.Secondary",
      "Button.Primary",
      "Text.Button",
      "Text.Primary",
    ]);

  const datePreviewText = useMemo(() => {
    if (_startDate && _endDate) {
      return `${moment(_startDate).format("DD MMM")} - ${moment(
        _endDate
      ).format("DD MMM")}`;
    }
    if (_startDate) {
      return moment(_startDate).format("DD MMM") + " -";
    }
    return "";
  }, [_startDate, _endDate]);

  const [todayStyle, disabledStyle, textStyle, monthStyle, yearStyle] = useMemo(
    () => [
      [Typography.Subtitle, { color: textPrimary }],
      [Typography.Subtitle, { color: textSecondary }],
      [Typography.Subtitle, { color: textPrimary }],
      [Typography.SubtitleHighlight, { color: textPrimary }],
      [Typography.SubtitleHighlight, { color: textPrimary }],
    ],
    [textPrimary, textSecondary]
  );

  const [prev, next, minDate, maxDate] = useMemo(
    () => [
      <Iconz name="arrow-left" size={16} fillTheme="Primary" />,
      <Iconz name="arrow-right" size={16} fillTheme="Primary" />,
      new Date(),
      moment().add(2, "year").toDate(),
    ],
    []
  );

  const enabled = useMemo(
    () => !!_startDate && !!_endDate,
    [_startDate, _endDate]
  );

  return (
    <Sheet isOpen={isOpen} onDismiss={onClose} snapPoints={[560]}>
      <BottomSheetView style={styles.container}>
        <SectionTitle
          children={title}
          icon="cross"
          iconSize={24}
          iconFill="Primary"
          onIconPress={onClose}
        />
        <View style={styles.calendar}>
          <CalendarPicker
            onDateChange={handleDateChange}
            allowRangeSelection
            selectedStartDate={_startDate}
            selectedEndDate={_endDate}
            minDate={minDate}
            maxDate={maxDate}
            textStyle={textStyle}
            monthTitleStyle={monthStyle}
            yearTitleStyle={yearStyle}
            todayBackgroundColor={Colors.light.Background.Card}
            selectedDayColor={buttonPrimary}
            selectedDayTextColor={textButtonPrimary}
            todayTextStyle={todayStyle}
            disabledDatesTextStyle={disabledStyle}
            nextComponent={next}
            previousComponent={prev}
          />
        </View>
        <View style={styles.footer}>
          <Text type="Subtitle" center>
            🗓️ {datePreviewText}
          </Text>
          <Button isDisabled={!enabled} onPress={handleSave}>
            Update
          </Button>
        </View>
        <SafeAreaView safeArea="bottom" />
      </BottomSheetView>
    </Sheet>
  );
};

export default DatePickerSheet;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  footer: {
    paddingHorizontal: 24,
    marginVertical: 16,
    gap: 8,
    flex: 1,
    justifyContent: "flex-end",
  },
  calendar: {
    marginTop: 8,
  },
});
