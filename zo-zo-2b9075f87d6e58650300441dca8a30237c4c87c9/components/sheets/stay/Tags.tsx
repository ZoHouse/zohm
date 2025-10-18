import { Operator } from "@/definitions/discover";
import { Sheet } from "@/components/sheets";
import { BottomSheetView } from "@gorhom/bottom-sheet";
import { ScrollView, StyleSheet, View } from "react-native";
import {
  SectionTitle,
  Text,
  DetailRow,
  Button,
  SafeAreaView,
  Iconz,
} from "@/components/ui";

interface TagsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  tags: Operator["tags"];
  onBook: () => void;
}

const TagsSheet = ({ isOpen, onClose, tags, onBook }: TagsSheetProps) => {
  return (
    <Sheet
      isOpen={isOpen}
      onDismiss={onClose}
      enableDynamicSizing
      maxDynamicContentSize={600}
    >
      <BottomSheetView style={styles.flex}>
        <SectionTitle type="Title">Know before you go</SectionTitle>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          style={styles.flex}
        >
          <View style={styles.content}>
            {tags.map((tag) => (
              <DetailRow
                key={tag.slug}
                emoji={tag.emoji}
                label={
                  tag.title && tag.subtitle
                    ? `${tag.title}: ${tag.subtitle}`
                    : tag.title ?? tag.subtitle
                }
              />
            ))}
          </View>
        </ScrollView>
        <SafeAreaView safeArea="bottom" style={styles.tagsBottomBar}>
          <View style={styles.tagsBottomInfo}>
            <Iconz name="check-circle" size={12} fillTheme="ViewOnly" />
            <Text type="Subtitle" color="Secondary">
              We'll remind you a day before your trip
            </Text>
          </View>
          <Button onPress={onBook}>Understood, Let's Continue</Button>
        </SafeAreaView>
      </BottomSheetView>
    </Sheet>
  );
};

export default TagsSheet;

const styles = StyleSheet.create({
  content: {
    gap: 16,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    paddingBottom: 24,
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 8,
  },
  tagsBottomBar: {
    paddingHorizontal: 24,
    gap: 8,
    marginBottom: 4,
  },
  tagsBottomInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
});
