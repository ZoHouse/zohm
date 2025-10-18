import { Linking, StyleSheet, View } from "react-native";
import React, { Fragment, useCallback, useMemo, useState } from "react";
import { Sheet } from "@/components/sheets";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import useQuery from "@/hooks/useQuery";
import useVisibilityState from "@/hooks/useVisibilityState";
import { router } from "expo-router";
import DeleteAccount from "@/components/sheets/profile/DeleteAccount";
import AboutZostel from "@/components/sheets/profile/AboutZostel";
import Iconz from "@/components/ui/Iconz";
import { Icons } from "@/components/ui/Iconz";
import Pressable from "@/components/ui/Pressable";
import Text from "@/components/ui/Text";
import Divider from "@/components/ui/Divider";
import Ziew from "@/components/ui/View";
import helpers from "@/utils/styles/helpers";

interface ProfileActionsProps {
  isOpen: boolean;
  onDismiss: () => void;
}

const ProfileActions = ({ isOpen, onDismiss }: ProfileActionsProps) => {
  const [extraLinks, setExtraLink] = useState<string | null>(null);
  const [
    isAboutZostelSheetVisible,
    showAboutZostelSheet,
    hideAboutZostelSheet,
  ] = useVisibilityState(false);

  const [isDeleteModalVisible, showDeleteModal, hideDeleteModal] =
    useVisibilityState(false);

  const toBlogs = useCallback(() => {
    onDismiss();
    router.push("/blog/all");
  }, []);

  const { data } = useQuery("DISCOVER_APP_SEED", {
    select: (data) => data.data,
  });

  const toLink = useCallback((link: string) => {
    onDismiss();
    router.navigate(`/web-view?url=${link}`);
  }, []);

  const { menu, socialLinks } = useMemo(() => {
    if (!data) return { menu: [], socialLinks: [] };
    const menu: {
      id: string;
      value: string;
      icon?: React.ReactNode;
      emoji?: string;
      onPress?: () => void;
    }[] = [];
    menu.push({
      id: "about-zostel",
      value: "About Zostel",
      icon: <Iconz noFill name="zostel" size={24} />,
      onPress: showAboutZostelSheet,
    });
    menu.push({
      id: "blogs",
      value: "Blogs",
      emoji: "📰",
      onPress: toBlogs,
    });
    data.extra_links.forEach((link) => {
      link.data.forEach((linkData) => {
        const obj = {
          id: `${link.title}-${linkData.id}`,
          value: linkData.title,
          emoji: linkData.emoji,
          onPress: () => toLink(linkData.link),
        };
        menu.push(obj);
      });
    });
    menu.push({
      id: "delete",
      value: "Delete Account",
      emoji: "💀",
      onPress: showDeleteModal,
    });
    const socialLinks = data.social_links.map((sl) => ({
      id: sl.id,
      emoji: <Iconz noFill name={sl.id as Icons} size={24} />,
      onPress: () => Linking.openURL(sl.link),
    }));
    return { menu, socialLinks };
  }, [data]);

  return (
    <>
      <Sheet
        enableDynamicSizing
        maxDynamicContentSize={700}
        isOpen={isOpen}
        onDismiss={onDismiss}
      >
        <BottomSheetScrollView
          contentContainerStyle={styles.ph}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {menu.map((el) => (
            <Fragment key={el.id}>
              <Pressable style={styles.row} onPress={el.onPress}>
                {el.icon ? el.icon : el.emoji ? <Text>{el.emoji}</Text> : null}
                <Text>{el.value}</Text>
              </Pressable>
              <Divider key={`${el.id}-divider`} />
            </Fragment>
          ))}
          <View style={styles.footView}>
            <View style={styles.footGraffiti}>
              <Iconz noFill name="zograffiti" size={300} style={styles.mt} />
              <Ziew style={styles.graffiti} background="Sheet" />
            </View>
            <Text type="SectionTitle" center>
              Checkout Zo Social Vibes
            </Text>
            <View style={styles.foot}>
              {socialLinks.map((el) => (
                <Pressable onPress={el.onPress} key={el.id}>
                  {el.emoji}
                </Pressable>
              ))}
            </View>
          </View>
        </BottomSheetScrollView>
      </Sheet>
      {isDeleteModalVisible && (
        <DeleteAccount
          isOpen={isDeleteModalVisible}
          onDismiss={hideDeleteModal}
        />
      )}
      {isAboutZostelSheetVisible && (
        <AboutZostel
          isOpen={isAboutZostelSheetVisible}
          onDismiss={hideAboutZostelSheet}
        />
      )}
    </>
  );
};

export default ProfileActions;

const styles = StyleSheet.create({
  stretch: {
    flex: 1,
    alignSelf: "stretch",
  },
  foot: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
  },
  footView: { marginTop: 24, gap: 16, paddingBottom: 72 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 16,
    height: 56,
    // paddingBottom: 72
  },
  ph: { paddingHorizontal: 24 },
  footGraffiti: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginTop: -32,
  },
  mt: { marginTop: 16 },
  graffiti: {
    ...helpers.absoluteEnds,
    opacity: 1 / 2,
  },
});
