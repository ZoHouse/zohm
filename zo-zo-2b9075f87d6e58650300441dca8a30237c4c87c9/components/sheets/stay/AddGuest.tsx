import { Sheet } from "@/components/sheets";
import React, { Fragment, useCallback, useMemo, useState } from "react";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { StyleSheet, View } from "react-native";
import { ProfileFields } from "@/utils/profile";
import { FormGuest } from "@/definitions/booking";
import { CountryCodeType } from "@/definitions/auth";
import { isValidGuest } from "@/utils/stay";
import {
  Pressable,
  Iconz,
  SectionTitle,
  TextInput,
  EmailInput,
  MobileInput,
  GenderInput,
  Divider,
  DashedBorder,
  SafeAreaView,
  Button,
  InputProps,
  EmailInputProps,
  MobileInputProps,
  GenderInputProps,
} from "@/components/ui";

interface AddGuestSheetProps {
  isOpen: boolean;
  onClose: () => void;
  guest: FormGuest;
  setGuest: (guest: FormGuest, index: number) => void;
  index: number;
}

const AddGuestSheet: React.FC<AddGuestSheetProps> = ({
  isOpen,
  onClose,
  guest,
  setGuest,
  index,
}) => {
  const close = useMemo(
    () => (
      <Pressable onPress={onClose} style={styles.close}>
        <Iconz name="cross" fillTheme="Primary" size={24} />
      </Pressable>
    ),
    [onClose]
  );

  const [localGuest, setLocalGuest] = useState<FormGuest>(guest);

  const [
    setFirstName,
    setLastName,
    setEmail,
    setPhone,
    setGender,
    setCountryCode,
  ] = useMemo(() => {
    return [
      (name: string) => setLocalGuest((prev) => ({ ...prev, firstName: name })),
      (name: string) => setLocalGuest((prev) => ({ ...prev, lastName: name })),
      (email: string) => setLocalGuest((prev) => ({ ...prev, email })),
      (phone: string) => setLocalGuest((prev) => ({ ...prev, phone })),
      (gender: (typeof ProfileFields.gender)[number]) =>
        setLocalGuest((prev) => ({ ...prev, gender })),
      (countryCode: CountryCodeType) =>
        setLocalGuest((prev) => ({ ...prev, countryCode })),
    ];
  }, []);

  const [isValidEmail, setIsValidEmail] = useState(false);
  const [isValidPhone, setIsValidPhone] = useState(false);

  const isValid = (guest.isFirst ? isValidEmail : true) && isValidPhone;
  const isComplete = isValidGuest(localGuest);

  const onSave = useCallback(() => {
    setGuest(localGuest, index);
    onClose();
  }, [localGuest, index, setGuest, onClose]);

  const enableSave = isValid && isComplete;

  return (
    <Sheet
      isOpen={isOpen}
      onDismiss={onClose}
      snapPoints={["90%"]}
      keyboardBlurBehavior="restore"
    >
      <SectionTitle type="Title" content={close}>
        Edit Details
      </SectionTitle>
      <BottomSheetScrollView
        style={styles.flex}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.gap}>
          <Form
            elements={
              [
                {
                  label: "First Name",
                  type: "text",
                  placeholder: "First Name",
                  inSheet: true,
                  customSheetBehavior: true,
                  value: localGuest.firstName,
                  onChangeText: setFirstName,
                },
                {
                  label: "Last Name",
                  type: "text",
                  placeholder: "Last Name",
                  inSheet: true,
                  customSheetBehavior: true,
                  value: localGuest.lastName,
                  onChangeText: setLastName,
                },
                guest.isFirst
                  ? {
                      label: "Email",
                      type: "email",
                      placeholder: "Email",
                      inSheet: true,
                      customSheetBehavior: true,
                      value: localGuest.email,
                      onChangeText: setEmail,
                      setIsValid: setIsValidEmail,
                    }
                  : null,
                {
                  label: "Phone Number",
                  type: "mobile",
                  placeholder: "Phone Number",
                  inSheet: true,
                  customSheetBehavior: true,
                  value: localGuest.phone,
                  onChangeText: setPhone,
                  setIsValidNumber: setIsValidPhone,
                  countryCode: localGuest.countryCode,
                  setCountryCode: setCountryCode,
                },
                {
                  label: "Gender",
                  type: "gender",
                  onSelect: setGender,
                  selected: localGuest.gender,
                },
              ].filter(Boolean) as FormElementProps[]
            }
            separator="line"
          />
        </View>
        <SafeAreaView safeArea="bottom" />
      </BottomSheetScrollView>
      <View style={styles.ph}>
        <Button isDisabled={!enableSave} onPress={onSave}>
          Save
        </Button>
        <SafeAreaView safeArea="bottom" />
      </View>
    </Sheet>
  );
};

export default AddGuestSheet;

type FormElementProps =
  | ({ type: "text"; label: string } & InputProps)
  | ({ type: "email"; label: string } & EmailInputProps)
  | ({ type: "mobile"; label: string } & MobileInputProps)
  | ({ type: "gender"; label: string } & GenderInputProps);

const FormElement = (props: FormElementProps) => {
  const { label, type } = props;
  return (
    <View>
      {label && <SectionTitle noHorizontalPadding>{label}</SectionTitle>}
      {type === "text" ? (
        <TextInput {...props} />
      ) : type === "email" ? (
        <EmailInput {...props} />
      ) : type === "gender" ? (
        <GenderInput {...props} />
      ) : type === "mobile" ? (
        <MobileInput {...props} />
      ) : (
        <></>
      )}
    </View>
  );
};

type FormProps = {
  elements: FormElementProps[];
  separator?: "line" | "dashed";
};

const Form = (props: FormProps) => {
  return props.elements.map((element, index) => (
    <Fragment key={`${element.type}-${index}`}>
      <FormElement {...element} />
      {index !== props.elements.length - 1 &&
        (props.separator === "line" ? (
          <Divider marginTop={16} />
        ) : props.separator === "dashed" ? (
          <DashedBorder style={styles.mt} />
        ) : null)}
    </Fragment>
  ));
};

const styles = StyleSheet.create({
  mt: { marginTop: 16 },
  ph: { paddingHorizontal: 24 },
  contentContainer: { padding: 24, gap: 16, paddingTop: 8 },
  gap: { gap: 8 },
  flex: { flex: 1 },
  close: { marginHorizontal: -24, paddingHorizontal: 24 },
});
