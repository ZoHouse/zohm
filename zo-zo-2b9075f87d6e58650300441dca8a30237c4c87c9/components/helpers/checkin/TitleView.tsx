import { StyleSheet, View } from "react-native";
import React from "react";
import { CheckinFormStates } from "@/definitions/checkin";
import { CheckBox, Iconz, Pressable, Text } from "@/components/ui";

const TitleView = ({
  goBack,
  formState,
  isIdPreview,
}: {
  goBack: () => void;
  formState: CheckinFormStates | null;
  isIdPreview: boolean;
}) => {
  return (
    <View style={styles.titleView}>
      <Pressable onPress={goBack} style={styles.left}>
        <Iconz
          name={isIdPreview ? "cross" : "arrow-left"}
          size={24}
          fillTheme="Primary"
        />
      </Pressable>
      <View style={styles.title}>
        {isIdPreview ? (
          <Text type="TextHighlight">Edit ID Card</Text>
        ) : (
          <>
            <Text type="TextHighlight">Check-in</Text>
            <Stages formState={formState} />
          </>
        )}
      </View>
    </View>
  );
};

export default TitleView;

const Stages = ({ formState }: { formState: CheckinFormStates | null }) => {
  return (
    <View style={styles.stages}>
      <Stage
        title="Basic Info"
        state={formState === "info_edit" ? "focus" : "done"}
      />
      <Iconz
        name="arrow-right"
        size={8}
        fillTheme={
          ["id_view", "id_edit"].includes(formState ?? "")
            ? "Primary"
            : "ViewOnly"
        }
      />
      <Stage
        title="Gov. ID"
        state={
          ["id_view", "id_edit"].includes(formState ?? "")
            ? "focus"
            : formState === "info_edit"
            ? "pending"
            : "done"
        }
      />
      <Iconz
        name="arrow-right"
        size={8}
        fillTheme={formState === "time" ? "Primary" : "ViewOnly"}
      />
      <Stage title="Time" state={formState === "time" ? "focus" : "pending"} />
    </View>
  );
};

const Stage = ({
  title,
  state,
}: {
  title: string;
  state: "focus" | "done" | "pending";
}) => {
  return (
    <View style={styles.stage}>
      {state === "done" ? (
        <Iconz name="check-circle" size={12} fill="#54B835" />
      ) : (
        <CheckBox
          size={12}
          strokeW={2}
          isSelected={false}
          outline={state === "focus" ? "Text.Primary" : "Text.Secondary"}
        />
      )}
      <Text
        type="Tertiary"
        color={state === "pending" ? "Secondary" : "Primary"}
      >
        {title}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  stage: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  stages: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  titleView: {
    width: "100%",
    height: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  left: {
    position: "absolute",
    left: 24,
  },
  title: {
    flexDirection: "column",
    alignItems: "center",
  },
});
