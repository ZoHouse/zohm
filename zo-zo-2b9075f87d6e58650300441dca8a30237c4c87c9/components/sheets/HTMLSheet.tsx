import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { memo, useMemo } from "react";
import { StyleSheet } from "react-native";
import Sheet from "@/components/sheets/Base";
import SectionTitle from "@/components/ui/SectionTitle";
import Pressable from "@/components/ui/Pressable";
import Iconz from "@/components/ui/Iconz";
import SafeAreaView from "@/components/ui/SafeAreaView";
import RenderHTMLText from "@/components/ui/RenderHTMLText";

interface HTMLSheetProps {
  isOpen: boolean;
  onClose: () => void;
  html: string;
  title: string;
}

const HTMLSheet = ({ isOpen, onClose, html, title }: HTMLSheetProps) => {
  const closeButton = useMemo(
    () => (
      <Pressable onPress={onClose} style={styles.closeButton}>
        <Iconz size={24} name="cross" fillTheme="Primary" />
      </Pressable>
    ),
    [onClose]
  );

  return (
    <Sheet isOpen={isOpen} onDismiss={onClose} snapPoints={["100%"]} hideHandle>
      <SafeAreaView safeArea="top" />
      <SectionTitle content={closeButton}>{title}</SectionTitle>
      <BottomSheetScrollView
        contentContainerStyle={styles.list}
        style={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <RenderHTMLText html={html} type="Subtitle" />
        <SafeAreaView safeArea="bottom" />
      </BottomSheetScrollView>
    </Sheet>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    padding: 24,
    paddingTop: 12,
  },
  closeButton: {
    marginHorizontal: -24,
    paddingHorizontal: 24,
  },
});

export default memo(HTMLSheet);
