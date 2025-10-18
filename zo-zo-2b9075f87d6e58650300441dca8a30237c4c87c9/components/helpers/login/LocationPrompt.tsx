import { StyleSheet } from "react-native";
import React, { useCallback, useState } from "react";
import helpers from "@/utils/styles/helpers";
import Text from "@/components/ui/Text";
import View from "@/components/ui/View";
import Button from "@/components/ui/Button";
import Pressable from "@/components/ui/Pressable";
import { useLocation } from "@/context/LocationContext";
import { logAxiosError } from "@/utils/network";

interface LocationPromptProps {
  name: string;
  onSkip: () => void;
  onSuccess: () => void;
}

const LocationPrompt = ({ name, onSkip, onSuccess }: LocationPromptProps) => {
  const [isLoading, setLoading] = useState(false);

  const { createWhereAbout } = useLocation();

  const onRequestingLocation = useCallback(() => {
    setLoading(true);
    createWhereAbout()
      .then((resp) => {
        if (resp) {
          onSuccess();
        } else {
          onSkip();
        }
      })
      .catch((er) => {
        logAxiosError(er);
        onSkip();
      })
      .finally(() => setLoading(false));
  }, [createWhereAbout]);

  return (
    <View style={styles.container}>
      <View style={helpers.flex} />
      <View style={styles.askLocationContent}>
        <View style={styles.textContainer}>
          <Text type="Title">And where are you {name}?</Text>
          <Text type="Subtitle" color="Secondary">
            Let's find the coolest trips & quests right near you!
          </Text>
        </View>
        <View style={styles.buttonContainer}>
          <Button isLoading={isLoading} onPress={onRequestingLocation}>
            Share my Location
          </Button>
          <Pressable onPress={onSkip}>
            <Text type="BigButton" style={styles.maybeLaterText}>
              Maybe Later
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

export default LocationPrompt;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    alignItems: "center",
    paddingTop: 80,
  },
  askLocationContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  textContainer: {
    gap: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonContainer: {
    alignSelf: "stretch",
    gap: 16,
    alignItems: "center",
    marginTop: 40,
    marginBottom: 16,
  },
  maybeLaterText: {
    paddingVertical: 16,
    textDecorationLine: "underline",
  },
});
