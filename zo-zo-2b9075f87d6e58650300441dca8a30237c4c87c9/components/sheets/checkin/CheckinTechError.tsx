import { useEffect } from "react";
import { StyleSheet, View, Platform, BackHandler } from "react-native";
import Sheet from "../Base";
import { Button, SafeAreaView, Text } from "@/components/ui";
import helpers from "@/utils/styles/helpers";
import constants from "@/utils/constants";
import ZoImage from "@/components/ui/ZoImage";

const CheckinTechErrorSheet = ({
  isVisible,
  onClose,
  goBack,
}: {
  isVisible: boolean;
  onClose: () => void;
  goBack: () => void;
}) => {
  useEffect(() => {
    if (Platform.OS !== "android") {
      return;
    }
    const backAction = () => Boolean(isVisible);

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, [isVisible]);

  return (
    <Sheet
      isOpen={isVisible}
      enablePanDownToClose={false}
      disableBackdropPress
      fullScreen
      onDismiss={onClose}
    >
      <SafeAreaView safeArea="bottom" style={styles.screen}>
        <View style={helpers.stretch}>
          <View style={styles.image}>
            <ZoImage url={constants.assetURLS.bell} width="s" />
          </View>
          <Text center type="Title">
            Still not working?{"\n"}Check-in at reception!
          </Text>
          <Text center style={styles.mt}>
            Tech can be tricky, but your journey shouldn't stop here! 😃
          </Text>
        </View>
        <View>
          <Button style={styles.mb} onPress={goBack}>
            Back to my Booking
          </Button>
        </View>
      </SafeAreaView>
    </Sheet>
  );
};

const styles = StyleSheet.create({
  mb: {
    marginBottom: 16,
  },
  mt: {
    marginTop: 8,
  },
  screen: {
    flex: 1,
    alignSelf: "stretch",
    paddingHorizontal: 24,
  },
  image: {
    marginBottom: 24,
    marginTop: 108,
    alignSelf: "center",
    width: 220,
    height: 220,
  },
  dimensions: {
    width: 220,
    height: 220,
  },
});

export default CheckinTechErrorSheet;
