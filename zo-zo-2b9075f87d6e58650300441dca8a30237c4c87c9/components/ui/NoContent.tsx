import LottieView, { LottieViewProps } from "lottie-react-native";
import { memo } from "react";
import { StyleSheet } from "react-native";
import Text from "@/components/ui/Text";
import SmallButton from "@/components/ui/SmallButton";

interface NoContentProps {
  source: LottieViewProps['source']
  title: string;
  subtitle?: string;
  btnProps?: { title: string; onPress: () => void };
}

const NoContent = ({ source, title, subtitle, btnProps }: NoContentProps) => {
  return (
    <>
      <LottieView
        source={source}
        autoPlay
        key={`no-content-${title}`}
        loop
        style={styles.icon}
      />
      <Text type="Title" center style={styles.title}>
        {title}
      </Text>
      {subtitle && (
        <Text color="Secondary" center>
          {subtitle}
        </Text>
      )}
      {btnProps && (
        <SmallButton style={styles.btn} onPress={btnProps.onPress}>
          {btnProps.title}
        </SmallButton>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  btn: {
    margin: 32,
  },
  title: {
    marginTop: 40,
    width: 300,
    paddingHorizontal: 24,
    marginBottom: 8,
  },
  icon: {
    width: 80,
    height: 80,
  },
});

export default memo(NoContent);
