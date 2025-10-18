import { useCallback, useMemo, useRef } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import StarRatingComponent, {
  StarIconProps,
} from "react-native-star-rating-widget";
import Iconz from "./Iconz";
import { Theme } from "@/context/ThemeContext";

interface StarRatingProps {
  rating: number;
  onChange?: (rating: number) => void;
  disabled?: boolean;
  emptyColor?: Theme;
  fillColor?: Theme;
  starSize?: number;
  containerStyle?: ViewStyle;
  starStyle?: ViewStyle;
}

const StarRating: React.FC<StarRatingProps> = ({
  rating,
  onChange,
  disabled = false,
  starSize = 16,
  emptyColor = "Background.Inputbox",
  fillColor = "Brand.Zostel",
  containerStyle,
  starStyle,
}) => {
  const StarIcon = useCallback(
    (props: StarIconProps) => (
      <Iconz
        name="star"
        size={props.size}
        theme={props.type === "empty" ? emptyColor : fillColor}
      />
    ),
    [emptyColor, fillColor]
  );

  const _starStyle = useMemo(() => [styles.star, starStyle], [starStyle]);

  const hasPressed = useRef(false);

  const handleChange = useCallback(
    (rating: number) => {
      if (hasPressed.current) return;
      hasPressed.current = true;
      setTimeout(() => (hasPressed.current = false), 1000);
      onChange?.(rating);
    },
    [onChange]
  );

  return (
    <View style={containerStyle} pointerEvents={disabled ? "none" : "auto"}>
      <StarRatingComponent
        rating={rating}
        onChange={handleChange}
        enableSwiping={false}
        enableHalfStar={false}
        starSize={starSize}
        StarIconComponent={StarIcon}
        starStyle={_starStyle}
      />
    </View>
  );
};

export default StarRating;

const styles = StyleSheet.create({
  star: {
    marginHorizontal: 2,
  },
});
