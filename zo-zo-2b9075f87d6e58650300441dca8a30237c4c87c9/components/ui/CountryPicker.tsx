import { Profile } from "@/definitions/profile";
import Pressable from "./Pressable";
import Text from "./Text";
import Ziew from "./View";
import useVisibilityState from "@/hooks/useVisibilityState";
import Iconz from "./Iconz";
import { CountrySearch } from "../sheets";
import { StyleSheet } from "react-native";

interface CountryPicker {
  country?: Profile["country"];
  setCountry: (country: Profile["country"]) => void;
}

const CountryPicker = ({ country, setCountry }: CountryPicker) => {
  const [isOpen, open, close] = useVisibilityState(false);

  return (
    <>
      <Pressable onPress={open} activeOpacity={0.8}>
        <Ziew background="Inputbox" style={styles.container}>
          {country ? (
            <Text>
              {country.flag}
              {"   "}
              {country.name}
            </Text>
          ) : (
            <Text color="Secondary">Select Country</Text>
          )}
          <Iconz name="downAngle" size={16} fillTheme="ViewOnly" />
        </Ziew>
      </Pressable>
      {isOpen && (
        <CountrySearch
          isOpen={isOpen}
          onDismiss={close}
          selectedValue={country ?? null}
          onSelectCountry={setCountry}
        />
      )}
    </>
  );
};

export default CountryPicker;

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    borderCurve: "continuous",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});
