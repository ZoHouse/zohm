import { useEffect, useMemo, useRef } from "react";
import { BackHandler, Platform, StyleSheet } from "react-native";
import {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetModalProps,
} from "@gorhom/bottom-sheet";
import { useThemeColors } from "@/context/ThemeContext";
import device from "@/config/Device";

interface DefaultSheetProps extends BottomSheetModalProps {
  isOpen: boolean;
}

const animationConfigs = {
  duration: 200,
};

const DefaultSheet = ({ isOpen, onDismiss, ...props }: DefaultSheetProps) => {
  const ref = useRef<BottomSheetModal>(null);

  useEffect(() => {
    if (isOpen) {
      ref.current?.present();
    } else {
      ref.current?.close();
      onDismiss?.();
    }
  }, [isOpen, onDismiss]);

  return <BottomSheetModal ref={ref} onDismiss={onDismiss} {...props} />;
};

export interface SheetProps extends DefaultSheetProps {
  fullScreen?: boolean;
  hideHandle?: boolean;
  disableBackdropPress?: boolean;
  disableContentDragForAndroid?: boolean;
}

const Sheet = (props: SheetProps) => {
  const [backgroundColor, handleColor] = useThemeColors([
    "Background.Sheet",
    "Background.Card",
  ]);
  const backgroundStyle = useMemo(
    () => ({
      backgroundColor,
    }),
    [backgroundColor]
  );
  const backdropComponent = useMemo(() => {
    if (props.backdropComponent) {
      return props.backdropComponent;
    }
    return props.disableBackdropPress ? SolidFixedBackdrop : SolidBackdrop;
  }, [props.backdropComponent, props.disableBackdropPress]);

  const handleStyle = useMemo(() => {
    if (props.hideHandle) {
      return styles.none;
    }
    return [styles.indicator, { backgroundColor: handleColor }];
  }, [props.hideHandle, handleColor]);

  useEffect(() => {
    if (Platform.OS !== "android" || !props.isOpen) {
      return;
    }
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (props.disableBackdropPress) {
          return true;
        }
        props.onDismiss?.();
        return true;
      }
    );

    return () => backHandler.remove();
  }, [props.isOpen, props.onDismiss, props.disableBackdropPress]);

  return (
    <DefaultSheet
      snapPoints={props.fullScreen ? ["100%"] : props.snapPoints}
      stackBehavior={props.stackBehavior ?? "push"}
      enableDynamicSizing={props.enableDynamicSizing ?? false}
      enableDismissOnClose={props.enableDismissOnClose ?? true}
      handleStyle={props.hideHandle ? styles.none : styles.handleView}
      handleIndicatorStyle={handleStyle}
      animationConfigs={props.animationConfigs ?? animationConfigs}
      backgroundStyle={props.backgroundStyle ?? backgroundStyle}
      backdropComponent={backdropComponent}
      enableContentPanningGesture={
        device.isAndroid && props.disableContentDragForAndroid
          ? false
          : props.enableContentPanningGesture
      }
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  indicator: {
    borderRadius: 56,
    borderCurve: "continuous",
    width: 56,
  },
  handleView: {
    borderTopLeftRadius: 200,
    borderTopRightRadius: 200,
    borderCurve: "continuous",
  },
  none: {
    display: "none",
  },
});

export default Sheet;

const SolidBackdrop = ({
  animatedIndex,
  style,
  animatedPosition,
}: BottomSheetBackdropProps) => {
  const bdStyle = useMemo(
    () => [
      style,
      {
        backgroundColor: "#111111CC",
      },
    ],
    []
  );

  return (
    <BottomSheetBackdrop
      animatedPosition={animatedPosition}
      animatedIndex={animatedIndex}
      style={bdStyle}
      disappearsOnIndex={-1}
      appearsOnIndex={0}
      opacity={1}
    />
  );
};

const SolidFixedBackdrop = ({
  animatedIndex,
  style,
  animatedPosition,
}: BottomSheetBackdropProps) => {
  const bdStyle = useMemo(
    () => [
      style,
      {
        backgroundColor: "#111111CC",
      },
    ],
    []
  );

  return (
    <BottomSheetBackdrop
      animatedPosition={animatedPosition}
      animatedIndex={animatedIndex}
      style={bdStyle}
      disappearsOnIndex={-1}
      appearsOnIndex={0}
      opacity={1}
      pressBehavior="none"
    />
  );
};
