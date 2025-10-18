import { KeyboardAvoidingView, StyleSheet } from "react-native";
import React, { useCallback } from "react";
import Animated, { FadeIn } from "react-native-reanimated";
import Text from "@/components/ui/Text";
import Button from "@/components/ui/Button";
import TextInput from "@/components/ui/TextInput";
import useProfile from "@/hooks/useProfile";

interface NameSectionProps {
  name: string;
  setName: (name: string) => void;
  onSubmit: () => void;
}

const NameSection: React.FC<NameSectionProps> = ({
  name,
  setName,
  onSubmit,
}) => {
  const { updateProfileAsync, isUpdating } = useProfile();

  const handleNameSubmit = useCallback(() => {
    const data = dataFromName(name);
    if (!data) return;
    updateProfileAsync(data).then(() => {
      onSubmit();
    });
  }, [name, onSubmit]);

  return (
    <KeyboardAvoidingView behavior="padding" style={styles.container}>
      <Animated.View
        entering={FadeIn.delay(100).duration(150)}
        style={styles.innerContainer}
      >
        <Text type="Title">Pick a username</Text>
        <Text color="Secondary" type="Subtitle">
          Your permanent identity in Zo World
        </Text>
        <TextInput
          // value={name}
          onChangeText={setName}
          font="Title"
          style={styles.input}
          autoFocus
        />
      </Animated.View>
      {name.trim().length > 0 ? (
        <Button isLoading={isUpdating} onPress={handleNameSubmit} style={styles.mb}>
          Sounds Cool!
        </Button>
      ) : null}
    </KeyboardAvoidingView>
  );
};

export default NameSection;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: "center",
    paddingTop: 80,
    paddingBottom: 8,
  },
  innerContainer: { alignItems: "center", flex: 1 },
  input: {
    marginVertical: 40,
    textAlign: "center",
    alignSelf: "stretch",
    backgroundColor: "transparent",
    borderWidth: 0,
  },
  mb: {
    marginBottom: 8,
  },
});

const dataFromName = (name: string) => {
  if (!name) return null;
  const names = name.trim().split(" ");
  if (names.length === 1) {
    return {
      first_name: names[0],
      middle_name: "",
      last_name: "",
    };
  } else if (names.length === 2) {
    return {
      first_name: names[0],
      middle_name: "",
      last_name: names[1],
    };
  } else if (names.length === 3) {
    return {
      first_name: names[0],
      middle_name: names[1],
      last_name: names[2],
    };
  } else {
    return {
      first_name: names[0],
      middle_name: names[1],
      last_name: names.slice(2).join(" "),
    };
  }
};
