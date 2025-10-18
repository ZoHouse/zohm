import moment from "moment";
import { Platform } from "react-native";

export const todayMinus5 = moment().subtract(5, "years").toDate();

export const formatDateForServer: (momentInstance: moment.Moment) => string = (
  momentInstance
) => {
  return moment(momentInstance).format("YYYY-MM-DD");
};

const arrow = Platform.OS === "ios" ? "→" : "-";

export const formatDates = (d1: moment.Moment, d2: moment.Moment) =>
  d1.isSame(d2, "month")
    ? `${d1.format("MMM DD")} ${arrow} ${d2.format("DD")}`
    : `${d1.format("MMM DD")} ${arrow} ${d2.format("MMM DD")}`;

export const getDateWithOptionalYear = (date: string) => {
  const _date = moment(date);
  const currentYear = moment().year();

  // If date is in current year, only show DD MMM
  // If date is in different year, show DD MMM YYYY
  if (_date.year() === currentYear) {
    return _date.format("DD MMM");
  } else {
    return _date.format("DD MMM YYYY");
  }
};

export const getUptoMinutes = (dateString: string) =>
  Math.floor(+new Date(dateString) / 60000);
