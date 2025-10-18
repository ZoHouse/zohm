import React, { useCallback, useState } from "react";
import { StyleSheet } from "react-native";
import { Sheet } from "@/components/sheets";
import { CitySearch } from "@/components/helpers/common";
import { SafeAreaView, SectionTitle, Loader, View } from "@/components/ui";
import useProfile from "@/hooks/useProfile";
import { GooglePlace } from "@/definitions/general";
import { logAxiosError } from "@/utils/network";
import { googlePlaceToProfileCity } from "@/utils/geo";
import helpers from "@/utils/styles/helpers";

interface HomeCityProps {
  isOpen: boolean;
  onDismiss: () => void;
  name: string;
}

const HomeCity = ({ isOpen, onDismiss, name }: HomeCityProps) => {
  const { updateProfile } = useProfile();
  const [isLoading, setIsLoading] = useState(false);

  const onSelect = useCallback(
    (place: GooglePlace) => {
      setIsLoading(true);
      googlePlaceToProfileCity(place)
        .then(updateProfile)
        .catch(logAxiosError)
        .finally(() => setIsLoading(false))
        .finally(onDismiss);
    },
    [onDismiss, updateProfile]
  );

  return (
    <Sheet hideHandle isOpen={isOpen} fullScreen onDismiss={onDismiss}>
      <SafeAreaView style={styles.container} safeArea>
        <SectionTitle
          icon="cross"
          iconFill="Primary"
          iconSize={24}
          type="Title"
          onIconPress={onDismiss}
        >{`Where's your home, ${name} 🏠?`}</SectionTitle>
        <CitySearch onSelect={onSelect} inSheet />
      </SafeAreaView>
      {isLoading && <CityPromptLoader />}
    </Sheet>
  );
};

export default HomeCity;

const CityPromptLoader = () => {
  return (
    <View background="Card" style={helpers.absoluteCenter}>
      <Loader />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 8,
  },
});
