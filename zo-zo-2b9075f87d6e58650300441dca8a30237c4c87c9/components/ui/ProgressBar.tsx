import { StyleSheet, View } from "react-native";
import React, { useMemo } from "react";
import Svg, { Circle } from "react-native-svg";

interface ProgressBarProps {
  size: number;
  total: number;
  current: number;
  secondaryStroke?: string;
  primaryStroke?: string;
}

const ProgressBar = ({
  size,
  total,
  current,
  secondaryStroke,
  primaryStroke,
}: ProgressBarProps) => {
  // Calculate the progress percentage
  const progress = (current / total) * 100;

  // Calculate radius and stroke width
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const style = useMemo(
    () => [styles.container, { width: size, height: size }],
    [size]
  );

  return (
    <View style={style}>
      <Svg width={size} height={size}>
        {/* Background Circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          fill={"none"}
          stroke={secondaryStroke || "none"}
        />
        {/* Progress Circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={primaryStroke || "#FFF"}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
    </View>
  );
};

export default ProgressBar;

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
});
