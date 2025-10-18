import moment from "moment";
import { createContext, useContext, useMemo, useState } from "react";

interface BookingContext {
  startDate: moment.Moment;
  endDate: moment.Moment;
  setStartDate: (date: moment.Moment) => void;
  setEndDate: (date: moment.Moment) => void;
  setDates: (startDate: moment.Moment, endDate: moment.Moment) => void;
  duration: number;
}

const BookingContext = createContext<BookingContext>({
  startDate: moment().add(1, "day"),
  endDate: moment().add(2, "day"),
  setStartDate: () => {},
  setEndDate: () => {},
  setDates: () => {},
  duration: 1,
});

const BookingProvider = ({ children }: { children: React.ReactNode }) => {
  const [startDate, setStartDate] = useState(moment().add(1, "day"));
  const [endDate, setEndDate] = useState(moment().add(2, "day"));
  const duration = useMemo(() => {
    return moment(endDate).diff(moment(startDate), "days");
  }, [startDate, endDate]);

  const value = useMemo(
    () => ({
      startDate,
      endDate,
      setStartDate,
      setEndDate,
      setDates: (startDate: moment.Moment, endDate: moment.Moment) => {
        setStartDate(startDate);
        setEndDate(endDate);
        return { startDate, endDate };
      },
      duration,
    }),
    [startDate, endDate]
  );

  return <BookingContext.Provider value={value} children={children} />;
};

export default BookingProvider;

export const useBooking = () => {
  return useContext(BookingContext);
};
