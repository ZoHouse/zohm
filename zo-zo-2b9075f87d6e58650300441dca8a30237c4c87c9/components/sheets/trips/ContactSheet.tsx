import { TripContact } from "@/definitions/trip";
import { FlatList, StyleSheet, View } from "react-native";
import Sheet from "../Base";
import { useCallback } from "react";
import { useMemo, useState } from "react";
import {
  Avatar,
  Button,
  Chip,
  Iconz,
  Pressable,
  SafeAreaView,
  Text,
  TextInput,
} from "@/components/ui";
import { BottomSheetFlatList } from "@gorhom/bottom-sheet";

interface ContactSheetProps {
  isOpen: boolean;
  onClose: () => void;
  contacts: TripContact[];
  submit: (contacts: TripContact[]) => void;
  maxSelectable: number;
}

const ContactSheet = ({
  isOpen,
  onClose,
  contacts,
  submit,
  maxSelectable,
}: ContactSheetProps) => {
  const [text, setText] = useState("");
  const filteredContacts = useMemo(
    () =>
      contacts.filter((contact) =>
        (contact.name ?? "").toLowerCase().includes(text.toLowerCase())
      ),
    [contacts, text]
  );

  const [selectedContacts, setSelectedContacts] = useState<
    Record<string, TripContact>
  >({});

  const selectedContactsList = useMemo(
    () => Object.values(selectedContacts),
    [selectedContacts]
  );

  const toggleContact = useCallback(
    (contact: TripContact) => {
      const isSelected = Boolean(selectedContacts[contact.id]);
      if (isSelected) {
        setSelectedContacts((prev) => {
          const { [contact.id]: _, ...rest } = prev;
          return rest;
        });
      } else {
        if (selectedContactsList.length >= maxSelectable) return;
        setSelectedContacts((prev) => ({
          ...prev,
          [contact.id]: contact,
        }));
      }
    },
    [selectedContacts, selectedContactsList, maxSelectable]
  );

  const onSave = useCallback(() => {
    submit(selectedContactsList);
    onClose();
  }, [selectedContactsList, submit, onClose]);

  const isDisabledNonSelected = useMemo(
    () => selectedContactsList.length >= maxSelectable,
    [selectedContactsList, maxSelectable]
  );

  return (
    <Sheet isOpen={isOpen} onDismiss={onClose} hideHandle fullScreen disableContentDragForAndroid>
      <SafeAreaView style={styles.container} safeArea>
        <View style={styles.header}>
          <Text center type="TextHighlight">
            Select Guests
          </Text>
          <Text center color="Secondary" type="Subtitle">
            {selectedContactsList.length}/{maxSelectable}
          </Text>
          <View style={styles.backButton}>
            <Iconz
              name="cross"
              size={24}
              fillTheme="Primary"
              onPress={onClose}
            />
          </View>
        </View>
        <Chip background="Inputbox" curve={100} style={styles.searchContainer}>
          <Iconz name="search" size={24} fillTheme="ViewOnly" />
          <TextInput
            placeholder="Search name or number"
            style={styles.searchInput}
            value={text}
            onChangeText={setText}
          />
        </Chip>
        {selectedContactsList.length ? (
          <View>
            <BottomSheetFlatList
              style={styles.selectedList}
              contentContainerStyle={styles.selectedListContent}
              horizontal
              data={selectedContactsList}
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => (
                <Pressable
                  activeOpacity={0.8}
                  onPress={() => toggleContact(item)}
                >
                  <Chip
                    background="Inputbox"
                    style={styles.selectedItem}
                    curve={100}
                  >
                    <Text type="Subtitle">{item.name}</Text>
                    <Iconz size={16} fillTheme="ViewOnly" name="cross-circle" />
                  </Chip>
                </Pressable>
              )}
            />
          </View>
        ) : null}
        <BottomSheetFlatList
          data={filteredContacts}
          style={styles.contactList}
          contentContainerStyle={styles.contactListContent}
          renderItem={({ item }) => {
            const isSelected = Boolean(selectedContacts[item.id]);
            return (
              <View style={styles.contactItem}>
                <View>
                  <Avatar uri="" size={40} alt={item.name} />
                </View>
                <View style={styles.contactInfo}>
                  <Text type="Subtitle">{item.name}</Text>
                  <Text type="Tertiary">{item.mobile}</Text>
                </View>
                <Pressable
                  onPress={() => toggleContact(item)}
                  disabled={isSelected ? false : isDisabledNonSelected}
                >
                  <Chip background="Inputbox" style={styles.addButton}>
                    {isSelected ? (
                      <>
                        <Iconz
                          name="check-circle"
                          size={16}
                          fillTheme="Primary"
                        />
                        <Text type="SubtitleHighlight">Added</Text>
                      </>
                    ) : (
                      <Text
                        color={
                          isDisabledNonSelected
                            ? "Secondary"
                            : "ButtonSecondary"
                        }
                        type="SubtitleHighlight"
                      >
                        + Add
                      </Text>
                    )}
                  </Chip>
                </Pressable>
              </View>
            );
          }}
        />
        <View style={styles.buttonContainer}>
          <Button
            isDisabled={
              selectedContactsList.length === 0 ||
              selectedContactsList.length > maxSelectable
            }
            onPress={onSave}
          >
            Save
          </Button>
        </View>
      </SafeAreaView>
    </Sheet>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 100,
    borderCurve: "continuous",
    gap: 4,
  },
  header: {
    marginBottom: 16,
  },
  backButton: {
    width: 24,
    position: "absolute",
    left: 0,
    bottom: 0,
    top: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    paddingVertical: 4,
    marginBottom: 16,
  },
  searchInput: {
    borderWidth: 0,
    flex: 1,
    backgroundColor: "transparent",
  },
  selectedList: {
    marginHorizontal: -24,
    marginTop: 8,
    marginBottom: 16,
  },
  selectedListContent: {
    gap: 8,
    paddingHorizontal: 24,
  },
  selectedItem: {
    padding: 8,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  contactList: {
    marginTop: 8,
  },
  contactListContent: {
    gap: 16,
    paddingBottom: 72,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  contactInfo: {
    flex: 1,
  },
  buttonContainer: {
    marginBottom: 8,
  },
});

export default ContactSheet;
