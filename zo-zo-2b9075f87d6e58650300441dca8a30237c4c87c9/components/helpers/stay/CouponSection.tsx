import { CouponResponse } from "@/definitions/booking";
import useVisibilityState from "@/hooks/useVisibilityState";
import { memo, useCallback, useState } from "react";
import { Keyboard, StyleSheet, View } from "react-native";
import Animated, { FadeInRight, FadeOutRight } from "react-native-reanimated";
import InvalidCoupon from "@/components/helpers/stay/InvalidCoupon";
import ValidCoupon from "@/components/helpers/stay/ValidCoupon";
import Loader from "@/components/ui/Loader";
import Pressable from "@/components/ui/Pressable";
import SmallButton from "@/components/ui/SmallButton";
import Text from "@/components/ui/Text";
import TextInput from "@/components/ui/TextInput";

interface CouponSectionProps {
  applyCouponCode: (coupon?: string) => Promise<void | CouponResponse>;
}

const CouponSection: React.FC<CouponSectionProps> = ({ applyCouponCode }) => {
  const [isDisplayed, show] = useVisibilityState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponStatus, setCouponStatus] = useState<
    "valid" | "invalid" | "loading" | null
  >(null);
  const displayApply = couponCode.length > 2;

  const onApply = useCallback(() => {
    if (couponCode.length < 3) return;
    setCouponStatus("loading");
    Keyboard.dismiss();
    applyCouponCode(couponCode)
      .then((res) => {
        if (res?.coupon_code) {
          setCouponStatus("valid");
        } else {
          setCouponStatus("invalid");
        }
      })
      .catch((err) => {
        setCouponStatus("invalid");
      });
  }, [couponCode, applyCouponCode]);

  const onClear = useCallback(() => {
    setCouponCode("");
    setCouponStatus(null);
    applyCouponCode();
  }, []);

  return isDisplayed ? (
    <View style={styles.container}>
      <TextInput
        placeholder="Enter coupon code"
        returnKeyType="done"
        value={couponCode}
        onChangeText={setCouponCode}
        editable={!couponStatus}
        onSubmitEditing={onApply}
      />
      <View style={styles.buttonContainer}>
        {displayApply ? (
          couponStatus === "invalid" ? (
            <InvalidCoupon onClear={onClear} />
          ) : couponStatus === "valid" ? (
            <ValidCoupon onClear={onClear} />
          ) : couponStatus === "loading" ? (
            <Animated.View
              key="stay-coupon-loader"
              entering={FadeInRight.springify()}
              exiting={FadeOutRight}
            >
              <Loader />
            </Animated.View>
          ) : (
            <Animated.View
              entering={FadeInRight.springify()}
              exiting={FadeOutRight}
            >
              <SmallButton onPress={onApply}>Apply</SmallButton>
            </Animated.View>
          )
        ) : null}
      </View>
    </View>
  ) : (
    <Pressable activeOpacity={0.8} onPress={show} style={styles.showButton}>
      <Text style={styles.showButtonText}>Have a coupon code?</Text>
    </Pressable>
  );
};

export default memo(CouponSection);

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    overflow: "hidden",
  },
  buttonContainer: {
    position: "absolute",
    right: 0,
    paddingRight: 8,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  showButton: {
    marginTop: 8,
    alignSelf: "flex-start",
  },
  showButtonText: {
    textDecorationLine: "underline",
  },
});
