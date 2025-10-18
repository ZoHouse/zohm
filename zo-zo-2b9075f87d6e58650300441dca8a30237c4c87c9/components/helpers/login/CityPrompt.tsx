import { StyleSheet, View } from "react-native";
import React, { memo, useCallback, useState } from "react";
import Text from "@/components/ui/Text";
import CitySearch from "@/components/helpers/common/CitySearch";
import { GooglePlace } from "@/definitions/general";
import { logAxiosError } from "@/utils/network";
import Loader from "@/components/ui/Loader";
import ZView from "@/components/ui/View";
import helpers from "@/utils/styles/helpers";
import useProfile from "@/hooks/useProfile";
import { googlePlaceToProfileCity } from "@/utils/geo";
import { Button } from "@/components/ui";

interface CityPromptProps {
  onSubmit: () => void;
}

const CityPrompt = ({ onSubmit }: CityPromptProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { updateProfile } = useProfile();

  const onSelect = useCallback(
    (place: GooglePlace) => {
      setIsLoading(true);
      googlePlaceToProfileCity(place)
        .then(updateProfile)
        .catch(logAxiosError)
        .finally(() => setIsLoading(false))
        .finally(onSubmit);
    },
    [onSubmit, updateProfile]
  );

  return (
    <>
      <View style={styles.cityContainer}>
        <Text type="Title" center>
          What's your hometown? 🏠
        </Text>
        <View style={styles.citySearchContainer}>
          <CitySearch onSelect={onSelect} />
          <View style={styles.skipButton}>
            <Button onPress={onSubmit} variant="secondary">
              Skip
            </Button>
          </View>
        </View>
      </View>
      {isLoading && <CityPromptLoader />}
    </>
  );
};

export default CityPrompt;

const styles = StyleSheet.create({
  cityContainer: {
    flex: 1,
    alignSelf: "stretch",
    marginTop: 48,
  },
  citySearchContainer: {
    alignSelf: "stretch",
    flex: 1,
    marginTop: 24,
  },
  loader: {
    opacity: 0.4,
    ...helpers.center,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  skipButton: {
    paddingHorizontal: 24
  },
});

const CityPromptLoader = memo(() => {
  return (
    <ZView background style={styles.loader}>
      <Loader />
    </ZView>
  );
});
