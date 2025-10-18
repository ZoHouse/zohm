import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "expo-router";
import useProfile from "@/hooks/useProfile";
import { useAuth } from "@/context/AuthContext";
import { Platform, StyleSheet, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import AnimatedOverlay from "@/components/helpers/login/AnimatedOverlay";
import NumberSection from "@/components/helpers/login/NumberSection";
import { CountryCodeType } from "@/definitions/auth";
import NameSection from "@/components/helpers/login/NameSection";
import SafeAreaView from "@/components/ui/SafeAreaView";
import OTPSection from "@/components/helpers/login/OTPSection";
import AvatarSection from "@/components/helpers/login/AvatarSection";
import { useLocation } from "@/context/LocationContext";
import LocationPrompt from "@/components/helpers/login/LocationPrompt";
import CityPrompt from "@/components/helpers/login/CityPrompt";
import AvatarCapsule from "@/components/helpers/login/AvatarCapsule";
import { isValidString } from "@/utils/data-types/string";
import { triggerFeedBack } from "@/utils/haptics";
import SmallButton from "@/components/ui/SmallButton";
import { useReactiveRef, useToggleState } from "@/utils/hooks";
import { WithDarkTheme } from "@/context/ThemeContext";
import useDisableAndroidBack from "@/hooks/useDisableAndroidBack";
import Chip from "@/components/ui/Chip";
import Iconz from "@/components/ui/Iconz";
import Pressable from "@/components/ui/Pressable";
import Video, { ReactVideoProps, VideoRef } from "react-native-video";
import helpers from "@/utils/styles/helpers";

type Steps =
  | null
  | "number"
  | "otp"
  | "name"
  | "avatar"
  | "location"
  | "city"
  | "LFG";

const Onboarding = () => {
  const videoPlayer = useRef<VideoRef>(null);
  const audioPlayer = useRef<VideoRef>(null);

  const {
    authState: { isAuthenticated },
  } = useAuth();
  const wasLoggedIn = useRef(!!isAuthenticated);
  const { profile } = useProfile();
  const { whereabouts, status } = useLocation();
  const statusRef = useReactiveRef(status);
  const [step, setStep] = useState<Steps | null>(null);

  const userData = useMemo(
    () => ({
      name: profile?.first_name,
      hasAvatar: profile?.body_type,
      city: profile?.place_name,
      location: whereabouts?.place_name,
    }),
    [profile, whereabouts?.place_name]
  );

  const stepsRef = useRef<
    Record<"info" | "location", Steps[]> & {
      phase1: boolean;
      phase2: boolean;
      phase3: boolean;
      isAuthenticated: boolean;
    }
  >({
    isAuthenticated: false,
    info: [],
    location: [],
    phase1: false,
    phase2: false,
    phase3: false,
  });
  const [name, setName] = useState<string>("");
  const [countryCode, setCountryCode] = useState<CountryCodeType>({
    name: "India",
    flag: "🇮🇳",
    code: "IN",
    dial_code: "+91",
  });
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [hasEnded, setHasEnded] = useState(false);

  const onSkip = useCallback(() => {
    if (!stepsRef.current.isAuthenticated && !stepsRef.current.phase1) {
      setStep("number");
      videoPlayer.current?.seek(13.5);
      videoPlayer.current?.pause();
      audioPlayer.current?.resume();
      stepsRef.current.phase1 = true;
    } else if (stepsRef.current.info.length > 0) {
      setStep(stepsRef.current.info.splice(0, 1)[0]);
      stepsRef.current.phase1 = true;
      videoPlayer.current?.seek(13.5);
      videoPlayer.current?.pause();
      audioPlayer.current?.resume();
    } else if (stepsRef.current.location.length > 0) {
      setStep(stepsRef.current.location.splice(0, 1)[0]);
      stepsRef.current.phase2 = true;
      videoPlayer.current?.seek(25.2);
      videoPlayer.current?.pause();
      audioPlayer.current?.resume();
    } else {
      setStep("LFG");
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (!profile) return;
    if (stepsRef.current.isAuthenticated) return;
    stepsRef.current.isAuthenticated = true;

    if (!isValidString(userData.name)) {
      stepsRef.current.info.push("name");
    }

    if (!userData.hasAvatar) {
      stepsRef.current.info.push("avatar");
    }

    if (
      statusRef.current?.status !== "granted" &&
      statusRef.current?.canAskAgain
    ) {
      stepsRef.current.location.push("location");
    }

    if (!isValidString(userData.city)) {
      stepsRef.current.location.push("city");
    }

    if (wasLoggedIn.current) {
    } else {
      if (stepsRef.current.info.length > 0) {
        setStep(stepsRef.current.info.splice(0, 1)[0]);
        videoPlayer.current?.pause();
        audioPlayer.current?.resume();
      } else {
        videoPlayer.current?.resume();
        audioPlayer.current?.pause();
      }

      stepsRef.current.phase1 = true;
      // stepsRef.current.phase2 = true;
    }
  }, [isAuthenticated, profile]);

  const router = useRouter();
  useEffect(() => {
    if (step === "LFG") {
      router.replace("/(tabs)/explore");
    }
  }, [step]);

  const onVideoProgress = useCallback(
    ({ currentTime }: { currentTime: number }) => {
      if (!stepsRef.current.phase3 && currentTime > 25.5) {
        stepsRef.current.phase3 = true;
        setShowCoins(true);
      } else if (!stepsRef.current.phase2 && currentTime > 25.2) {
        if (stepsRef.current.location.length > 0) {
          videoPlayer.current?.pause();
          audioPlayer.current?.resume();
          setStep(stepsRef.current.location[0]);
        }
        stepsRef.current.phase2 = true;
      } else if (!stepsRef.current.phase1 && currentTime > 13.46) {
        if (!stepsRef.current.isAuthenticated) {
          videoPlayer.current?.pause();
          audioPlayer.current?.resume();
          setStep("number");
        } else if (stepsRef.current.info.length > 0) {
          videoPlayer.current?.pause();
          audioPlayer.current?.resume();
          setStep(stepsRef.current.info[0]);
        }
        stepsRef.current.phase1 = true;
      }
    },
    []
  );

  const onEnd = useCallback(() => {
    setStep("LFG");
    setHasEnded(true);
  }, []);

  const handleNameSubmit = useCallback(() => {
    triggerFeedBack();
    if (stepsRef.current.info.includes("avatar")) {
      setStep("avatar");
      stepsRef.current.info = [];
    } else {
      setStep(null);
      videoPlayer.current?.resume();
      audioPlayer.current?.pause();
      stepsRef.current.phase1 = true;
    }
  }, []);

  const handleAvatarSubmit = useCallback(() => {
    setShowAvatarAnimation(true);
    setTimeout(() => {
      triggerFeedBack();
      setStep(null);
      audioPlayer.current?.pause();
      videoPlayer.current?.resume();
    }, 800);
    stepsRef.current.phase1 = true;
  }, []);

  const [showAvatarAnimation, setShowAvatarAnimation] = useState(false);

  const handleLocationSubmit = useCallback(() => {
    triggerFeedBack();
    if (stepsRef.current.location.includes("city")) {
      setStep("city");
      stepsRef.current.location = [];
    } else {
      setStep(null);
      audioPlayer.current?.pause();
      videoPlayer.current?.resume();
      stepsRef.current.phase2 = true;
    }
  }, []);

  const handleCitySubmit = useCallback(() => {
    triggerFeedBack();
    setStep(null);
    audioPlayer.current?.pause();
    videoPlayer.current?.resume();
    stepsRef.current.phase2 = true;
  }, []);

  const handleNumberSubmit = useCallback(() => {
    triggerFeedBack();
    setStep("otp");
  }, []);

  const handleOTPSuccess = useCallback(() => {
    triggerFeedBack();
    setStep(null);
    videoPlayer.current?.resume();
    audioPlayer.current?.pause();
  }, []);

  const [showCoins, setShowCoins] = useState(false);
  const [mute, toggleMute] = useToggleState(true);

  const skipButton = useMemo(
    () =>
      step ? null : (
        <SafeAreaView safeArea="top" style={styles.skip}>
          <SmallButton
            onPress={onSkip}
            type="secondary"
            style={styles.smallButton}
          >
            Skip
          </SmallButton>
        </SafeAreaView>
      ),
    [step, onSkip]
  );

  const muteButton = useMemo(
    () =>
      !step ? (
        <Pressable
          onPress={toggleMute}
          activeOpacity={0.8}
          style={styles.muteButton}
        >
          <Chip background="Input" curve={100} style={styles.mute}>
            <Iconz
              name={mute ? "mute" : "unmute"}
              size={24}
              fillTheme="Primary"
            />
          </Chip>
        </Pressable>
      ) : null,
    [mute, step]
  );

  const avatarView = useMemo(() => {
    if (!profile) return null;
    if (!isAuthenticated || hasEnded) return null;
    if (!(userData.hasAvatar && userData.name)) return null;
    return (
      <AvatarCapsule
        profile={profile}
        city={profile?.place_name}
        location={userData.location}
        showCoins={showCoins}
        showAvatarAnimation={showAvatarAnimation}
        hideAvatar={step === "avatar"}
      />
    );
  }, [
    profile,
    isAuthenticated,
    hasEnded,
    userData,
    showCoins,
    showAvatarAnimation,
    step,
  ]);

  useDisableAndroidBack();

  const onVideoLoad = useCallback(() => {
    if (Platform.OS === "android") {
      setTimeout(() => {
        videoPlayer.current?.resume();
      }, 50);
    }
  }, []);

  return (
    <View style={styles.absoluteBlack}>
      <StatusBar backgroundColor="transparent" translucent />
      <OgVideo
        ref={videoPlayer}
        muted={mute}
        onEnd={onEnd}
        onProgress={onVideoProgress}
        onLoad={onVideoLoad}
        controls={false}
      />
      <OgAudio ref={audioPlayer} muted={mute} />
      <AnimatedOverlay show={step !== null && !hasEnded} />
      <SafeAreaView safeArea style={styles.absoluteFill}>
        {step === "number" ? (
          <NumberSection
            countryCode={countryCode}
            setCountryCode={setCountryCode}
            phoneNumber={phoneNumber}
            setPhoneNumber={setPhoneNumber}
            onSubmit={handleNumberSubmit}
          />
        ) : step === "otp" ? (
          <OTPSection
            countryCode={countryCode}
            phoneNumber={phoneNumber}
            onBack={() => setStep("number")}
            onSuccess={handleOTPSuccess}
          />
        ) : step === "name" ? (
          <NameSection
            name={name}
            setName={setName}
            onSubmit={handleNameSubmit}
          />
        ) : step === "avatar" ? (
          <AvatarSection
            fadeAvatar={showAvatarAnimation}
            onSubmit={handleAvatarSubmit}
          />
        ) : step === "location" ? (
          <LocationPrompt
            name={name}
            onSkip={handleLocationSubmit}
            onSuccess={handleLocationSubmit}
          />
        ) : step === "city" ? (
          <CityPrompt onSubmit={handleCitySubmit} />
        ) : null}
        {/* {logoutButton} */}
        {avatarView}
        {skipButton}
        {muteButton}
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  absoluteBlack: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "black",
  },
  absoluteFill: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  skip: { position: "absolute", right: 24, top: 8 },
  skipContainer: { position: "absolute", top: 8, right: 24 },
  muteButton: { position: "absolute", right: 24, bottom: 48 },
  audioPlayer: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 1,
    height: 1,
    opacity: 0.1,
  },
  mute: { padding: 16, backgroundColor: "#11111179" },
  smallButton: {
    backgroundColor: "#11111179",
  },
});

export default WithDarkTheme(Onboarding);

interface OgVideoProps extends ReactVideoProps {
  ref: React.RefObject<VideoRef | null>;
}

const OgVideo = memo(({ ref, ...props }: OgVideoProps) => {
  const source = useMemo(
    () => ({ uri: require("@/assets/videos/onboarding.mp4") }),
    []
  );

  return (
    <View pointerEvents="none" style={helpers.absoluteEnds}>
      <Video
        source={source}
        style={helpers.absoluteEnds}
        resizeMode="cover"
        ref={ref}
        repeat={false}
        {...props}
      />
    </View>
  );
});

const OgAudio = memo(({ ref, ...props }: OgVideoProps) => {
  const onLoad = useCallback(() => {
    ref.current?.pause();
  }, []);

  const source = useMemo(
    () => ({ uri: require("@/assets/sounds/onboarding-beats.mp3") }),
    []
  );

  return (
    <View pointerEvents="none" style={styles.audioPlayer}>
      <Video
        source={source}
        style={styles.audioPlayer}
        resizeMode="cover"
        repeat
        onLoad={onLoad}
        ref={ref}
        {...props}
      />
    </View>
  );
});
