import { View, StyleSheet, Keyboard } from "react-native";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { Sheet } from "@/components/sheets";
import {
  SafeAreaView,
  TextInput,
  Iconz,
  Button,
  Loader,
  Text,
} from "@/components/ui";
import useProfile from "@/hooks/useProfile";
import useQuery from "@/hooks/useQuery";
import helpers from "@/utils/styles/helpers";

interface NicknameEditProps {
  isOpen: boolean;
  onDismiss: () => void;
  disableClose?: boolean;
  onSubmit?: (nickname: string) => void;
}

const nameErrorFields = {
  available: {
    true: {
      text: "Username available",
      color: "Vibes.Green",
      icon: "check-circle",
      iconColor: "Vibes.Green",
    },
    loading: {
      text: "Checking username availability...",
      color: "Text.Secondary",
      icon: "loader",
      iconColor: "Text.Secondary",
    },
    false: {
      text: "Username not available",
      color: "Vibes.Red",
      icon: "cross-circle",
      iconColor: "Vibes.Red",
    },
    null: {
      text: "Username available",
      color: "Text.Secondary",
      icon: "check-circle",
      iconColor: "Text.Secondary",
    },
  },
  length: {
    true: {
      text: "Must be 4-16 characters long",
      color: "Vibes.Green",
      icon: "check-circle",
      iconColor: "Vibes.Green",
    },
    false: {
      text: "Must be 4-16 characters long",
      color: "Vibes.Red",
      icon: "cross-circle",
      iconColor: "Vibes.Red",
    },
    null: {
      text: "Must be 4-16 characters long",
      color: "Text.Secondary",
      icon: "check-circle",
      iconColor: "Text.Secondary",
    },
  },
  alphanumeric: {
    true: {
      text: "Should only be alphanumeric",
      color: "Vibes.Green",
      icon: "check-circle",
      iconColor: "Vibes.Green",
    },
    false: {
      text: "Should only be alphanumeric",
      color: "Vibes.Red",
      icon: "cross-circle",
      iconColor: "Vibes.Red",
    },
    null: {
      text: "Should only be alphanumeric",
      color: "Text.Secondary",
      icon: "check-circle",
      iconColor: "Text.Secondary",
    },
  },
} as const;

const NicknameEdit = ({ isOpen, onDismiss, onSubmit }: NicknameEditProps) => {
  const watchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { updateProfile, refetchProfile, isUpdating } = useProfile();
  const [value, setValue] = useState<string>("");
  const [isWatchingText, setWatchingText] = useState<boolean>(true);

  const onValueChange = useCallback((text: string) => {
    setValue(text);
    setWatchingText(true);
    if (watchTimeout.current) {
      clearTimeout(watchTimeout.current);
    }
    watchTimeout.current = setTimeout(() => {
      setWatchingText(false);
    }, 1500);
  }, []);

  const isAlphaNumeric = useMemo(() => /^[a-z0-9]+$/i.test(value), [value]);
  const isLengthValid = useMemo(
    () => value.length >= 4 && value.length <= 16,
    [value]
  );

  const { data, isLoading } = useQuery(
    "PROFILE_CUSTOM_NICKNAME_AVAILABLE",
    {
      enabled: Boolean(!isWatchingText && isAlphaNumeric && isLengthValid),
      staleTime: 0,
      //   cacheTime: 0,
      select: (data) => data.data,
    },
    {
      search: {
        nickname: value + ".zo",
      },
    }
  );

  const isLoadingResponse = isWatchingText || isLoading;

  const availableResponse = useMemo(() => {
    if (!isLengthValid || !isAlphaNumeric) {
      return nameErrorFields.available.null;
    }
    if (isLoadingResponse) {
      return nameErrorFields.available.loading;
    }
    if (data?.available === true) {
      return nameErrorFields.available.true;
    }
    if (data?.available === false) {
      return nameErrorFields.available.false;
    }
    return nameErrorFields.available.null;
  }, [data, isLoadingResponse, isAlphaNumeric, isLengthValid]);

  const lengthResponse = useMemo(() => {
    if (isLengthValid) {
      return nameErrorFields.length.true;
    }
    return nameErrorFields.length.false;
  }, [isLengthValid]);

  const alphanumericResponse = useMemo(() => {
    if (isAlphaNumeric) {
      return nameErrorFields.alphanumeric.true;
    }
    return nameErrorFields.alphanumeric.false;
  }, [isAlphaNumeric]);

  const handleSave = useCallback(() => {
    Keyboard.dismiss();
    updateProfile(
      {
        custom_nickname: value + ".zo",
        selected_nickname: "custom",
      },
      {
        onSuccess: (data) => {
          refetchProfile();
          setValue("");
          if (onSubmit) {
            onSubmit(value + ".zo");
          }
          onDismiss();
        },
      }
    );
  }, [value, onSubmit, onDismiss]);

  return (
    <Sheet
      keyboardBlurBehavior="restore"
      enablePanDownToClose={false}
      enableContentPanningGesture={false}
      snapPoints={["60%"]}
      isOpen={isOpen}
      onDismiss={onDismiss}
    >
      <SafeAreaView safeArea="bottom" style={style.container}>
        <Text type="SectionTitle">
          How do you want to be known as around here?
        </Text>
        <TextInput
          autoFocus
          onChangeText={onValueChange}
          value={value}
          placeholder="For eg. Naagraaj, Prabhudeva, etc."
          style={style.textinput}
          inSheet
        />
        <View style={style.gap}>
          <View style={style.row}>
            {availableResponse.icon === "loader" ? (
              <Loader width={16} height={16} />
            ) : (
              <Iconz
                size={16}
                name={availableResponse.icon}
                theme={availableResponse.iconColor}
              />
            )}
            <Text type="Subtitle" theme={availableResponse.color}>
              {availableResponse.text}
            </Text>
          </View>
          <View style={style.row}>
            <Iconz
              size={16}
              name={lengthResponse.icon}
              theme={lengthResponse.iconColor}
            />
            <Text type="Subtitle" theme={lengthResponse.color}>
              {lengthResponse.text}
            </Text>
          </View>
          <View style={style.row}>
            <Iconz
              size={16}
              name={alphanumericResponse.icon}
              theme={alphanumericResponse.iconColor}
            />
            <Text type="Subtitle" theme={alphanumericResponse.color}>
              {alphanumericResponse.text}
            </Text>
          </View>
        </View>
        <View style={helpers.flex} />
        <Button
          isLoading={isUpdating}
          isDisabled={isLoadingResponse || !isAlphaNumeric || !isLengthValid}
          onPress={handleSave}
        >
          Save
        </Button>
      </SafeAreaView>
    </Sheet>
  );
};

export default NicknameEdit;

const style = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingTop: 16,
    gap: 16,
    flex: 1,
    marginTop: 4,
    marginBottom: 8,
  },
  textinput: {
    marginBottom: 8,
    marginTop: 12,
    lineHeight: 20,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  gap: {
    gap: 8,
  },
});
