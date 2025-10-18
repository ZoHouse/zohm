import { StyleSheet, View as RnView } from "react-native";
import React from "react";
import { Track } from "@/definitions/explore";
import { groupList } from "@/utils/object";
import View from "@/components/ui/View";
import { Image } from "expo-image";
import Text from "@/components/ui/Text";
import SmallButton from "@/components/ui/SmallButton";

interface InfoBlocksProps<T extends Track> {
  data: T[];
}

const InfoBlocks = <T extends Track>({ data }: InfoBlocksProps<T>) => {
  const groupedBlocks = groupList(data, 2, "-" as const);

  return (
    <RnView style={styles.container}>
      {groupedBlocks.map((blocks, index) => (
        <RnView key={index} style={styles.container}>
          {blocks.map((block, index) =>
            block === "-" ? (
              <RnView key={index} style={styles.flex} />
            ) : (
              <View background="Secondary" style={styles.block} key={block.id}>
                <Image source={block.media} style={styles.image} />
                <View style={styles.blockInfo}>
                  <Text>{block.title}</Text>
                  <SmallButton>Apply</SmallButton>
                </View>
              </View>
            )
          )}
        </RnView>
      ))}
    </RnView>
  );
};

export default InfoBlocks;

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    gap: 16,
  },
  block: {
    flex: 1,
    gap: 4,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderCurve: "continuous",
  },
  image: { width: 100, height: 100 },
  blockInfo: {
    gap: 4,
    alignItems: "center",
  },
});
