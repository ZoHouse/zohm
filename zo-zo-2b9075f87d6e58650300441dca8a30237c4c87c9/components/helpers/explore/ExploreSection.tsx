import React, { memo } from "react";
import { FeedItem, Playlist } from "@/definitions/explore";
import { StyleSheet, View } from "react-native";
import StandardHorizontalList from "@/components/helpers/explore/StandardHorizontalList";
import ExploreFilters from "@/components/helpers/explore/ExploreFilters";
import CapsuleHorizontalList from "@/components/helpers/explore/CapsuleHorizontalList";
import SectionTitle from "@/components/ui/SectionTitle";
import Text from "@/components/ui/Text";
import Animated, { FadeInDown } from "react-native-reanimated";

interface ExploreSectionProps {
  data: FeedItem;
  index: number;
  isVisible: boolean;
}

interface PlaylistViewProps {
  playlist: Playlist;
  isVisible: boolean;
}

const PlaylistView = ({ playlist, isVisible }: PlaylistViewProps) => {
  return playlist.structure === "standard-horizontal-list" ? (
    <View style={styles.playlist}>
      {playlist.title ? (
        <SectionTitle subtitle={playlist.subtitle}>
          {playlist.title}
        </SectionTitle>
      ) : null}
      <StandardHorizontalList data={playlist.tracks} isVisible={isVisible} />
    </View>
  ) : playlist.structure === "filter" ? (
    <View style={styles.playlist}>
      {playlist.title ? (
        <SectionTitle subtitle={playlist.subtitle}>
          {playlist.title}
        </SectionTitle>
      ) : null}
      <ExploreFilters data={playlist.tracks} tags={playlist.tags} />
    </View>
  ) : playlist.structure === "nx3-vertical-list" ? (
    <View style={styles.playlist}>
      {playlist.title ? (
        <SectionTitle subtitle={playlist.subtitle}>
          {playlist.title}
        </SectionTitle>
      ) : null}
      <CapsuleHorizontalList data={playlist.tracks} />
    </View>
  ) : playlist.structure === "portrait-horizontal-list" ? (
    <View style={styles.playlist}>
      {playlist.title ? (
        <SectionTitle subtitle={playlist.subtitle}>
          {playlist.title}
        </SectionTitle>
      ) : null}
      <StandardHorizontalList
        portrait
        data={playlist.tracks}
        isVisible={isVisible}
      />
    </View>
  ) : playlist.structure === "3xn-horizontal-list" ? (
    <View style={styles.playlist}>
      {playlist.title ? (
        <SectionTitle subtitle={playlist.subtitle}>
          {playlist.title}
        </SectionTitle>
      ) : null}
      <CapsuleHorizontalList data={playlist.tracks} />
    </View>
  ) : playlist.structure === "capsule-horizontal-list" ? (
    <View style={styles.playlist}>
      {playlist.title ? (
        <SectionTitle subtitle={playlist.subtitle}>
          {playlist.title}
        </SectionTitle>
      ) : null}
      <CapsuleHorizontalList data={playlist.tracks} />
    </View>
  ) : null;
};

const ExploreSection = ({ data, isVisible }: ExploreSectionProps) => {
  return (
    <Animated.View style={styles.section} entering={FadeInDown}>
      {data._type === "head" ? (
        <View style={styles.sectionHead}>
          <Text type="Title" center>
            {data.title}
          </Text>
          {data.subtitle ? (
            <Text center type="Subtitle">
              {data.subtitle}
            </Text>
          ) : null}
        </View>
      ) : (
        <PlaylistView playlist={data} isVisible={isVisible} />
      )}
    </Animated.View>
  );
};

export default memo(ExploreSection);

const styles = StyleSheet.create({
  section: {
    // marginBottom: 16,
    // borderWidth: 1 / 4,
    // borderColor: "red",
  },
  z: {
    zIndex: 10,
  },
  sectionHead: {
    marginBottom: 16,
    marginTop: 24,
  },
  playlist: {
    gap: 8,
    paddingBottom: 24,
    // borderWidth: 1 / 4,
    // borderColor: "blue",
  },
});
