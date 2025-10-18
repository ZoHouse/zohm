import { StyleSheet, View } from "react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { DetailRowProps } from "@/components/ui/DetailRow";
import {
  AccordionItem,
  Divider,
  Pressable,
  SafeAreaView,
  Text,
} from "@/components/ui";
import AnimatedArrow from "@/components/ui/AnimatedArrow";
import Sheet from "../Base";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import DescriptionList from "@/components/ui/DescriptionList";

interface InfoSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  list:
    | {
        title?: string;
        value?:
          | React.JSX.Element
          | string
          | (DetailRowProps & { id: string })[];
      }[]
    | null;
  faqs?: { title: string; description: string }[];
}

const Faqs = ({ faqs }: { faqs: { title: string; description: string }[] }) => {
  const [selectedIndices, setSelectedIndices] = useState<number[]>(
    faqs.length ? [0] : []
  );

  const toggleSelectedIndex = useCallback(
    (index: number) => {
      setSelectedIndices(
        selectedIndices.includes(index)
          ? selectedIndices.filter((i) => i !== index)
          : [...selectedIndices, index]
      );
    },
    [selectedIndices]
  );

  return (
    <View style={styles.faqsContainer}>
      {faqs.map((faq, index) => (
        <View key={index}>
          <Pressable
            activeOpacity={0.8}
            style={styles.faqTitle}
            onPress={() => toggleSelectedIndex(index)}
          >
            <Text style={styles.flex} type="TextHighlight">
              {faq.title}
            </Text>
            <AnimatedArrow isDown={selectedIndices.includes(index)} />
          </Pressable>
          <AccordionItem show={selectedIndices.includes(index)}>
            <>
              {selectedIndices.includes(index) && (
                <View style={styles.faqContent}>
                  <Text style={styles.flex}>{`${faq.description}`}</Text>
                </View>
              )}
            </>
          </AccordionItem>
          <View>
            {index < faqs.length - 1 && (
              <Divider marginBottom={16} marginTop={16} />
            )}
          </View>
        </View>
      ))}
    </View>
  );
};

const InfoSheet = ({ isOpen, onClose, title, list, faqs }: InfoSheetProps) => {
  return (
    <Sheet isOpen={isOpen} onDismiss={onClose} snapPoints={["90%"]}>
      <BottomSheetScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollV}
        showsVerticalScrollIndicator={false}
      >
        <SafeAreaView style={styles.container} safeArea="bottom">
          <Text style={styles.title} center type="Title">
            {title}
          </Text>
          {list ? (
            <DescriptionList list={list} />
          ) : faqs ? (
            <Faqs faqs={faqs} />
          ) : null}
        </SafeAreaView>
      </BottomSheetScrollView>
    </Sheet>
  );
};

export default InfoSheet;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  title: {
    marginTop: 16,
    marginBottom: 8,
  },
  flex: {
    flex: 1,
  },
  faqTitle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  scrollV: {
    paddingBottom: 48,
  },
  faqContent: {
    paddingTop: 8,
    flex: 1,
    alignSelf: "stretch",
  },
  faqsContainer: {
    marginTop: 24,
  },
});
