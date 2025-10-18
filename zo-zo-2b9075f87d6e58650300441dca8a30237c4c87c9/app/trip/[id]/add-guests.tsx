import ContactSheet from "@/components/sheets/trips/ContactSheet";
import {
  View as Ziew,
  Text,
  Iconz,
  Pressable,
  SafeAreaView,
  Button,
  SectionTitle,
  TextInput,
  EmailInput,
  MobileInput,
  Divider,
} from "@/components/ui";
import { defaultCountryCode } from "@/components/ui/MobileInput";
import CountryPicker from "@/components/ui/CountryPicker";
import DateInput from "@/components/ui/DateInput";
import RadioFields from "@/components/ui/RadioFields";
import { TripContact, TripGuest, ZoServerGuest } from "@/definitions/trip";
import useProfile from "@/hooks/useProfile";
import useVisibilityState from "@/hooks/useVisibilityState";
import { useReactiveRef } from "@/utils/hooks";
import { getFullName, ProfileFields } from "@/utils/profile";
import { useTripStore } from "@/utils/store/trip";
import helpers from "@/utils/styles/helpers";
import { router, useLocalSearchParams } from "expo-router";
import moment from "moment";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import * as Contacts from "expo-contacts";
import parsePhoneNumber from "libphonenumber-js";
import { useSeedData } from "@/utils/store/seed";

const AddGuests = () => {
  const { setTripState } = useTripStore();
  const {
    id,
    guests: _guests,
    date,
    sku,
  } = useLocalSearchParams<Record<string, string>>();
  const guestCount = useMemo(() => parseInt(_guests ?? "1") || 1, [_guests]);

  const [guests, setGuests] = useState<TripGuest[]>(
    new Array(guestCount).fill({})
  );

  const [validGuestNumbers, setValidGuestNumbers] = useState<
    Record<number, boolean>
  >({});
  const [validGuestEmails, setValidGuestEmails] = useState<
    Record<number, boolean>
  >({});

  const handleGuestChange = useCallback(
    <K extends keyof TripGuest>(index: number, key: K, value: TripGuest[K]) => {
      setGuests((prev) => {
        const newGuests = [...prev];
        newGuests[index] = { ...newGuests[index], [key]: value };
        return newGuests;
      });
    },
    []
  );

  const { profile, zostelProfile } = useProfile();

  const [isContactSheetOpen, showContacts, hideContacts] =
    useVisibilityState(false);
  const [fetchedContacts, setFetchedContacts] = useState<null | TripContact[]>(
    null
  );

  useEffect(() => {
    let guest: TripGuest | null = null;
    if (profile) {
      const name = getFullName(profile);
      guest = { name };
      if (zostelProfile?.mobile) {
        guest.mobile = zostelProfile.mobile;
      }
      if (profile.email_address) {
        guest.email = profile.email_address;
      }
      if (profile.gender) {
        guest.gender = profile.gender;
      }
      if (profile.date_of_birth) {
        guest.date_of_birth = profile.date_of_birth;
      }
      if (profile.country?.code) {
        guest.country = profile.country;
      }
      if (profile.address) {
        guest.address = profile.address;
      }
      setGuests((prev) => {
        prev[0] = guest ?? ({} as TripGuest);
        return [...prev];
      });
    }
  }, [profile, zostelProfile]);

  const vacantGuestsCount = useMemo(
    () => guests.filter((el) => !el.name && !el.mobile).length,
    [guests]
  );
  const vacantGuestRef = useReactiveRef(vacantGuestsCount);

  const openContactSheet = useCallback(() => {
    if (vacantGuestRef.current > 0) {
      showContacts();
    }
  }, []);

  const initContacts = useCallback(() => {
    if (guestCount < 2) return;
    Contacts.requestPermissionsAsync()
      .then((status) => status.status === "granted")
      .then((granted) => {
        if (granted) {
          Contacts.getContactsAsync({
            fields: [
              "addresses",
              "birthday",
              "firstName",
              "lastName",
              "middleName",
              "phoneNumbers",
              "nonGregorianBirthday",
              "name",
            ],
          }).then((contacts) => {
            const tripContacts = contacts.data.map((contact, index) => ({
              id: contact.id ?? `contact-${index}`,
              name: contact.name ?? "",
              email: contact.emails?.[0]?.email,
              mobile: contact.phoneNumbers?.[0]?.number ?? "",
              address: [
                contact.addresses?.[0]?.street,
                contact.addresses?.[0]?.city,
                contact.addresses?.[0]?.postalCode,
                contact.addresses?.[0]?.region,
                contact.addresses?.[0]?.country,
              ]
                .filter(Boolean)
                .join(", "),
              birthday: contact.birthday?.day
                ? moment()
                    .set("date", contact.birthday.day)
                    .set("month", contact.birthday.month + 1)
                    .set("year", contact.birthday.year ?? 2000)
                : undefined,
            }));
            setFetchedContacts(tripContacts);
            openContactSheet();
          });
        } else {
          throw new Error("Permission denied");
        }
      })
      .catch((er) => {
        setFetchedContacts([]);
      });
  }, [guestCount]);

  useEffect(() => {
    setTimeout(() => {
      if (vacantGuestRef.current > 0) {
        initContacts();
      }
    }, 100);
  }, []);

  const handleGuestValidityChange = useCallback(
    (index: number, valid: boolean) => {
      setValidGuestNumbers((prev) => ({ ...prev, [index]: valid }));
    },
    []
  );

  const handleValidEmailChange = useCallback(
    (index: number, valid: boolean) => {
      setValidGuestEmails((prev) => ({ ...prev, [index]: valid }));
    },
    []
  );

  const validGuests = useMemo(() => {
    const validGuests: ZoServerGuest[] = [];
    guests.forEach((guest, index) => {
      if (
        guest.name?.trim() &&
        guest.email?.trim() &&
        guest.mobile?.trim() &&
        validGuestNumbers[index] &&
        validGuestEmails[index] &&
        guest.gender?.trim() &&
        guest.country?.code.trim() &&
        guest.date_of_birth
      ) {
        const cc = guest.countryCode ?? defaultCountryCode;
        const validGuest = {
          first_name: guest.name,
          mobile: `${cc.dial_code.replace("+", "")}${guest.mobile!}`,
          email: guest.email!,
          date_of_birth: guest.date_of_birth!,
          address: guest.address,
          gender: ProfileFields.gender.find((el) => el.id === guest.gender)
            ?.value!,
          nationality: guest.country!.code,
        };
        validGuests.push(validGuest);
      }
    });
    return validGuests;
  }, [guests, validGuestNumbers, validGuestEmails]);

  const onConfirm = useCallback(() => {
    if (validGuests.length > 0) {
      setTripState({
        guest: validGuests,
      });
      router.push(
        `/trip/${id}/confirm?sku=${sku}&date=${date}&guests=${guestCount}`
      );
    }
  }, [validGuests]);

  const countryCodes = useSeedData("mobile_country_codes");

  const onGuestSelect = useCallback((contacts: TripContact[]) => {
    setGuests((prev) => {
      prev.forEach((el, index) => {
        if (!el.name && !el.mobile) {
          const contact = contacts.shift();
          if (contact) {
            prev[index] = contact;
            const parsedNumber = parsePhoneNumber(contact.mobile ?? "");
            if (parsedNumber?.isValid()) {
              prev[index].mobile = parsedNumber.nationalNumber;
              const countryCode = countryCodes?.find(
                (c) => c.code === parsedNumber.country
              );
              if (countryCode) {
                prev[index].countryCode = countryCode;
              }
            }
            prev[index].date_of_birth = contact.birthday?.format("YYYY-MM-DD");
            prev[index].address = contact.address;
          }
        }
      });
      return [...prev];
    });
    hideContacts();
  }, [countryCodes?.length]);

  const handleGuestRemove = useCallback((index: number) => {
    setGuests((prev) => {
      prev[index] = {} as TripGuest;
      return [...prev];
    });
  }, []);

  return (
    <Ziew background style={helpers.stretch}>
      <SafeAreaView safeArea="top" />
      <View style={styles.header}>
        <Iconz
          name="arrow-left"
          size={24}
          fillTheme="Primary"
          onPress={router.back}
        />
      </View>
      <View style={styles.titleContainer}>
        <View>
          <Text type="Title">Add Guests Info</Text>
          <Text color="Secondary" type="Paragraph">
            Will add you to Whatsapp group
          </Text>
        </View>
        <Pressable
          disabled={!fetchedContacts?.length}
          onPress={openContactSheet}
        >
          <Iconz
            name="contact-book"
            size={24}
            onPress={!fetchedContacts?.length ? undefined : openContactSheet}
            fillTheme={!fetchedContacts?.length ? "ViewOnly" : "Primary"}
          />
        </Pressable>
      </View>
      <KeyboardAvoidingView
        style={helpers.stretch}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
        >
          {guests.map((guest, index) => (
            <GuestForm
              key={index}
              index={index}
              guest={guest}
              isValidNumber={validGuestNumbers[index]}
              handleGuestChange={handleGuestChange}
              handleGuestRemove={handleGuestRemove}
              handleGuestValidityChange={handleGuestValidityChange}
              handleValidEmailChange={handleValidEmailChange}
              length={guests.length}
            />
          ))}
        </ScrollView>
      </KeyboardAvoidingView>
      <View style={styles.button}>
        <Button
          onPress={onConfirm}
          isDisabled={validGuests.length < guestCount}
        >
          Confirm Info
        </Button>
        <SafeAreaView safeArea="bottom" />
      </View>
      {isContactSheetOpen && vacantGuestsCount > 0 && (
        <ContactSheet
          isOpen={isContactSheetOpen}
          onClose={hideContacts}
          maxSelectable={vacantGuestsCount}
          contacts={fetchedContacts ?? []}
          submit={onGuestSelect}
        />
      )}
    </Ziew>
  );
};

const genderFields = ProfileFields.gender.map((el) => ({
  emoji: el.icon,
  id: el.id,
  title: el.value,
}));

const GuestForm = ({
  index,
  guest,
  isValidNumber,
  handleGuestChange,
  handleGuestRemove,
  handleGuestValidityChange,
  handleValidEmailChange,
  length,
}: {
  index: number;
  guest: TripGuest;
  isValidNumber: boolean;
  handleGuestChange: <K extends keyof TripGuest>(
    index: number,
    key: K,
    value: TripGuest[K]
  ) => void;
  handleGuestRemove: (index: number) => void;
  handleGuestValidityChange: (index: number, valid: boolean) => void;
  handleValidEmailChange: (index: number, isValid: boolean) => void;
  length: number;
}) => {
  const removeGuest = useCallback(
    () => handleGuestRemove(index),
    [handleGuestRemove, index]
  );

  const setIsValidNumber = useCallback(
    (isValid: boolean) => {
      handleGuestValidityChange(index, isValid);
    },
    [handleGuestValidityChange, index]
  );

  const setIsValidEmail = useCallback(
    (isValid: boolean) => {
      handleValidEmailChange(index, isValid);
    },
    [handleValidEmailChange, index]
  );

  return (
    <View key={index}>
      <SectionTitle
        noHorizontalPadding
        content={
          index > 0 && guest.name && guest.mobile && isValidNumber ? (
            <Pressable onPress={removeGuest}>
              <Iconz size={24} name="cross" fillTheme="ViewOnly" />
            </Pressable>
          ) : null
        }
      >
        {`Guest ${String(index + 1)}`}
      </SectionTitle>
      <View style={styles.inputContainer}>
        <TextInput
          placeholder="Name"
          value={guest.name ?? ""}
          onChangeText={(value) => handleGuestChange(index, "name", value)}
        />
        <EmailInput
          placeholder="Email"
          value={guest.email ?? ""}
          onChangeText={(value) => handleGuestChange(index, "email", value)}
          setIsValid={setIsValidEmail}
        />
        <MobileInput
          placeholder="Mobile"
          value={guest.mobile ?? ""}
          onChangeText={(value) => handleGuestChange(index, "mobile", value)}
          countryCode={guest.countryCode}
          setCountryCode={(value) =>
            handleGuestChange(index, "countryCode", value)
          }
          setIsValidNumber={setIsValidNumber}
        />
        <RadioFields
          items={genderFields}
          onSelect={(value) => handleGuestChange(index, "gender", value)}
          selected={guest.gender}
          itemStyle={{ paddingVertical: 8 }}
        />
        <CountryPicker
          country={guest.country}
          setCountry={(value) => handleGuestChange(index, "country", value)}
        />
        <DateInput
          value={guest.date_of_birth ? moment(guest.date_of_birth) : undefined}
          onChange={(date) =>
            handleGuestChange(index, "date_of_birth", date.format("YYYY-MM-DD"))
          }
        />
        <TextInput
          placeholder="Your complete address goes here"
          value={guest.address ?? ""}
          numberOfLines={4}
          onChangeText={(value) => handleGuestChange(index, "address", value)}
          style={{ height: 120 }}
          textAlignVertical="top"
          multiline
        />
      </View>
      {index !== length - 1 ? <Divider marginTop={24} /> : null}
    </View>
  );
};

export default AddGuests;

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    height: 56,
  },
  inputContainer: {
    paddingVertical: 8,
    gap: 16,
  },
  dashedBorder: {
    marginVertical: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
    gap: 8,
    paddingBottom: 72,
  },
  button: {
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  titleContainer: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  mh: {
    marginHorizontal: -24,
  },
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
    // backgroundColor: Colors.Background.Card,
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
  country: {
    marginHorizontal: -24,
    marginTop: -8,
  },
  address: {
    marginTop: -24,
  },
});
