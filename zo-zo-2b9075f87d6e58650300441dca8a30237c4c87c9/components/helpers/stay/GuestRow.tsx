import { memo, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { AddGuest } from "@/components/sheets/stay";
import { Avatar, Iconz, Pressable, Text, View as Ziew } from "@/components/ui";
import { FormGuest } from "@/definitions/booking";
import useVisibilityState from "@/hooks/useVisibilityState";
import { isValidGuest } from "@/utils/stay";

interface GuestRowProps {
  guest: FormGuest;
  index: number;
  setGuest: (guest: FormGuest, index: number) => void;
}

const GuestRow: React.FC<GuestRowProps> = ({ guest, index, setGuest }) => {
  const [isAddGuestSheetOpen, openAddGuestSheet, closeAddGuestSheet] =
    useVisibilityState(false);

  const isValid = useMemo(() => isValidGuest(guest), [guest]);

  return (
    <Ziew background="Input">
      {isValid ? (
        <ValidGuestRow
          index={index}
          openAddGuestSheet={openAddGuestSheet}
          guest={guest}
        />
      ) : (
        <AddGuestRow
          index={index}
          openAddGuestSheet={openAddGuestSheet}
          guest={guest}
        />
      )}

      {isAddGuestSheetOpen && (
        <AddGuest
          isOpen={isAddGuestSheetOpen}
          onClose={closeAddGuestSheet}
          guest={guest}
          setGuest={setGuest}
          index={index}
        />
      )}
    </Ziew>
  );
};

const AddGuestRow: React.FC<{
  index: number;
  openAddGuestSheet: () => void;
  guest: FormGuest;
}> = ({ index, openAddGuestSheet, guest }) => (
  <Pressable
    onPress={openAddGuestSheet}
    activeOpacity={0.8}
    style={styles.addGuestRow}
    key={index}
  >
    <View style={styles.iconContainer}>
      <Iconz name="plus" size={16} theme="Button.Primary" />
    </View>
    <Text type="Subtitle" color="ButtonSecondary">
      Add Guest {index + 1} {guest.isOptional ? "(Optional)" : ""}
    </Text>
  </Pressable>
);

const ValidGuestRow: React.FC<{
  index: number;
  openAddGuestSheet: () => void;
  guest: FormGuest;
}> = ({ index, openAddGuestSheet, guest }) => (
  <Pressable
    onPress={openAddGuestSheet}
    activeOpacity={0.8}
    style={styles.validGuestRow}
    key={index}
  >
    <Avatar size={40} alt={`${guest.firstName} ${guest.lastName}`} />
    <View style={styles.guestInfo}>
      <Text type="Subtitle">
        {guest.firstName} {guest.lastName}
      </Text>
      {guest.email && <Text type="Tertiary">{guest.email}</Text>}
      {guest.phone && (
        <Text type="Tertiary">
          {guest.countryCode?.dial_code ?? ""}
          {guest.phone}
        </Text>
      )}
    </View>
    <Iconz name="edit" size={16} fillTheme="ViewOnly" />
  </Pressable>
);

export default memo(GuestRow);

const styles = StyleSheet.create({
  addGuestRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    position: "relative",
    alignItems: "center",
    gap: 12,
    height: 76,
  },
  validGuestRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    position: "relative",
    alignItems: "center",
    gap: 8,
    height: 76,
  },
  iconContainer: {
    width: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  guestInfo: {
    flex: 1,
  },
});
