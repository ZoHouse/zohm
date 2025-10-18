import {
  Button,
  GradientFooter,
  GradientHeader,
  Iconz,
  Loader,
  Pressable,
  SafeAreaView,
  Text,
  TextInput,
} from "@/components/ui";
import { ApiServer } from "@/definitions/auth";
import { StayBooking } from "@/definitions/booking";
import useQuery from "@/hooks/useQuery";
import { axiosInstances } from "@/utils/auth/client";
import { logAxiosError } from "@/utils/network";
import helpers from "@/utils/styles/helpers";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import Ziew from "@/components/ui/View";
import BookingNotFound from "@/components/helpers/checkin/BookingNotFound";
import { Operator } from "@/definitions/discover";
import useMutation from "@/hooks/useMutation";
import useProfile from "@/hooks/useProfile";
import {
  AssetMedia,
  CheckinFormStates,
  IDState,
  MediaStatus,
} from "@/definitions/checkin";
import { GeneralObject } from "@/definitions/general";
import useVisibilityState from "@/hooks/useVisibilityState";
import moment from "moment";
import { isValidEmail, isValidString } from "@/utils/data-types/string";
import { Profile } from "@/definitions/profile";
import { RequireAtLeastOne } from "type-fest";
import { useAuth } from "@/context/AuthContext";
import { openPicker } from "react-native-image-crop-picker";
import TitleView from "@/components/helpers/checkin/TitleView";
import DisplayCheckinIDSheet from "@/components/sheets/checkin/DisplayCheckinIDSheet";
import CheckinInfoPreviewSheet from "@/components/sheets/checkin/CheckinInfoPreview";
import CheckinIDUploadErrorSheet from "@/components/sheets/checkin/CheckinIDUploadError";
import CheckinTechErrorSheet from "@/components/sheets/checkin/CheckinTechError";
import FinishedCheckinView from "@/components/helpers/checkin/FinishedCheckinView";
import TimeEdit from "@/components/helpers/checkin/TimeEdit";
import IDEdit from "@/components/helpers/checkin/IDEdit";
import IDCapture from "@/components/helpers/checkin/IDCapture";
import PersonalInfoEdit from "@/components/helpers/checkin/UserInfoEdit";

const goBack = router.back;
const fetchBooking = (code: string) =>
  axiosInstances.ZOSTEL.get(`/api/v2/stay/bookings/${code}/`);

const CheckinScreen = () => {
  const { id: operatorCode, booking_code } = useLocalSearchParams<{
    id: string;
    booking_code: string;
  }>();

  const [localBookingCode, setLocalBookingCode] = useState(booking_code);
  const [error, setError] = useState<string | null>(null);
  const [showBookingView, setShowBookingView] = useState(false);
  const [booking, setBooking] = useState<StayBooking | undefined>();
  const [isBookingLoading, setIsBookingLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);

  const { data: operator, isLoading: isOperatorLoading } = useQuery(
    "STAY_OPERATORS",
    {
      enabled: !!operatorCode,
      select: (data) => data.data.operator,
      throwOnError: (er) => {
        logAxiosError(er);
        return false;
      },
    },
    {
      path: [operatorCode],
    }
  );

  const searchBooking = useCallback(() => {
    if (!localBookingCode) return;
    setIsBookingLoading(true);
    fetchBooking(localBookingCode)
      .then((data) => data.data)
      .then((res) => {
        setLocalBookingCode("");
        setError(null);
        setShowBookingView(true);
        setBooking(res);
      })
      .catch((er) => {
        logAxiosError(er);
        setLocalBookingCode("");
        setError("Hmm, that doesn't match any booking.");
      })
      .finally(() => {
        setIsBookingLoading(false);
      });
  }, [localBookingCode]);

  const extraContent = useMemo(
    () => (
      <View style={styles.bookingNotFoundButton}>
        <Button
          isLoading={isBookingLoading}
          isDisabled={!localBookingCode}
          onPress={searchBooking}
        >
          Get Booking Info
        </Button>
        <SafeAreaView safeArea="bottom" />
      </View>
    ),
    [searchBooking, localBookingCode, isBookingLoading]
  );

  const onSkipCheckin = useCallback(() => {
    setShowBookingView(true);
  }, []);

  useEffect(() => {
    if (booking_code) {
      setInitialLoading(true);
      fetchBooking(booking_code)
        .then((data) => data.data)
        .then((res) => {
          setLocalBookingCode("");
          setError(null);
          setShowBookingView(true);
          setBooking(res);
          setIsBookingLoading(false);
        })
        .catch((er) => {
          logAxiosError(er);
          setLocalBookingCode("");
          // setError("Hmm, that doesn't match any booking.");
        })
        .finally(() => {
          setInitialLoading(false);
        });
    }
  }, [booking_code]);

  if (initialLoading || isOperatorLoading) {
    return (
      <Ziew background style={styles.noBookingLoader}>
        <Loader />
      </Ziew>
    );
  }

  if (showBookingView && operator) {
    return <Checkin operator={operator} booking={booking} />;
  }

  return (
    <Ziew background style={helpers.stretch}>
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <SafeAreaView safeArea="top" />
        <View style={styles.content}>
          <BookingNotFound />
          <TextInput
            style={styles.mt}
            placeholder="Booking ID"
            value={localBookingCode}
            onChangeText={setLocalBookingCode}
            returnKeyType="done"
            onSubmitEditing={searchBooking}
          />
          {!isBookingLoading && error && (
            <View style={styles.noBookingError}>
              <Iconz size={16} name="alert" />
              <Text style={styles.noBookingErrorText} type="Tertiary">
                {error}
              </Text>
            </View>
          )}
          <View style={styles.otherWays}>
            <Pressable onPress={onSkipCheckin}>
              <Text style={styles.otherWaysText}>
                I don't have a booking ID
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
      {extraContent}
    </Ziew>
  );
};

interface CheckinProps {
  operator: Operator;
  booking?: StayBooking;
}

const Checkin = ({ operator, booking }: CheckinProps) => {
  const { mutate: checkin, isPending: isCheckinLoading } = useMutation(
    "STAY_CHECKIN",
    {},
    `${operator.code}/`
  );
  const { mutate: addEmail } = useMutation("AUTH_USER_EMAIL");

  const docTypesMap = useRef<Record<"front" | "back", number>>({
    front: 116,
    back: 117,
  });

  const { data: docTypes } = useQuery("DISCOVER_APP_SEED", {
    select: (data) => data.data.profile.document_types,
    throwOnError: (er) => {
      logAxiosError(er);
      return false;
    },
  });

  useEffect(() => {
    if (docTypes) {
      docTypesMap.current = {
        front: docTypes[0]?.[0] ?? 116,
        back: docTypes[1]?.[0] ?? 117,
      };
    }
  }, [docTypes]);

  const kycDocs = operator?.kyc_documents ?? [];
  const { profile, zostelProfile, refetchZostelProfile, updateProfileAsync } =
    useProfile();

  const [formState, setFormState] = useState<CheckinFormStates | null>(
    "info_edit"
  );
  const [personalInfo, setPersonalInfo] = useState<GeneralObject>({});
  const [validEmail, setValidEmail] = useState(false);
  const emailAddress = useRef("");
  const onEditEmailAddress = useCallback((email: string) => {
    emailAddress.current = email;
    setPersonalInfo((prev) => ({ ...prev, email_address: email }));
  }, []);
  const [id, setId] = useState<IDState>({
    front: undefined,
    back: undefined,
    side: "front",
    source: "gallery",
    isUploading: false,
    isUsingCamera: false,
    isPreviewing: false,
  });
  const [timeState, setTimeState] = useState<{
    date: Date;
    from: string;
    next: string;
  }>(() => {
    const d = new Date();
    d.setHours(11);
    d.setMinutes(0);
    return { date: d, from: "", next: "" };
  });
  const [previewSheet, setPreviewSheet] = useState<
    "basic_info" | "gov_ids" | null
  >(null);
  const [
    isIdUploadErrorSheetVisible,
    showIdUploadErrorSheet,
    hideIdUploadErrorSheet,
  ] = useVisibilityState();
  const [isTechErrorSheetVisible, showTechErrorSheet, hideTechErrorSheet] =
    useVisibilityState();
  const [isIdViewSheetVisible, showIdViewSheet, hideIdViewSheet] =
    useVisibilityState();

  const uploadErrorCount = useRef<Record<"front" | "back", number>>({
    front: 0,
    back: 0,
  });

  const isLoading = !operator || !profile || !zostelProfile;

  const doCheckin = useCallback(() => {
    const data = {
      booking_code: booking?.code,
      arrival_time: moment(timeState.date).format("hh:mm:00"),
      next_destination: timeState.next,
      coming_from: timeState.from,
      arrival_on: booking?.checkin,
      departure_on: booking?.checkout,
      email_address: personalInfo.email_address,
    };

    checkin(data, {
      onSuccess: () => {
        setFormState("done");
      },
      onError: logAxiosError,
    });
  }, [timeState, booking, personalInfo]);

  useEffect(() => {
    setPersonalInfo({
      first_name: profile?.first_name,
      last_name: profile?.last_name,
      email_address:
        profile?.email_address || zostelProfile?.email || emailAddress.current,
      gender: profile?.gender,
      country: profile?.country.code ? profile?.country : undefined,
      birthDate: profile?.date_of_birth,
      address: profile?.address,
    });
  }, [profile, zostelProfile]);

  const timeOut = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    const email: string = personalInfo.email_address || emailAddress.current;
    if (timeOut.current) {
      clearTimeout(timeOut.current);
    }
    setValidEmail(false);
    if (!email?.trim()) {
      return;
    }
    timeOut.current = setTimeout(() => {
      timeOut.current = null;
      setValidEmail(isValidEmail(email));
    }, 1500);
  }, [personalInfo.email_address]);

  const isPersonalInfoValid = useMemo(() => {
    if (!personalInfo) return false;
    return (
      isValidString(personalInfo.first_name) &&
      isValidString(personalInfo.last_name) &&
      (isValidString(personalInfo.email_address) ||
        isValidString(emailAddress.current)) &&
      isValidString(personalInfo.gender) &&
      isValidString(personalInfo.birthDate) &&
      isValidString(personalInfo.address)
    );
  }, [personalInfo]);

  const [isIdValid, profileMedia] = useMemo(() => {
    if (!zostelProfile?.assets) return [false, undefined];
    if (!docTypesMap.current) return [false, undefined];
    const front = zostelProfile.assets.find(
      (a) => a.type === docTypesMap.current.front
    );
    const back = zostelProfile.assets.find(
      (a) => a.type === docTypesMap.current.back
    );

    if (!front) return [false, undefined];
    return [
      Boolean(
        front.validation_status === "Validated" &&
          (!front.document_type?.requires_back || back?.file)
      ),
      front?.document_type?.requires_back ? { front, back } : { front },
    ];
  }, [zostelProfile?.assets]);

  const isTimeInfoValid = useMemo(() => {
    if (!timeState) return false;
    return isValidString(timeState.from) && isValidString(timeState.next);
  }, [timeState]);

  const initNavDone = useRef(false);
  useEffect(() => {
    if (!zostelProfile || !profile || initNavDone.current) return;
    if (isIdValid && isProfileValid(profile, zostelProfile)) {
      setFormState("time");
    } else {
      setFormState("info_edit");
    }
    initNavDone.current = true;
  }, [profile, zostelProfile, isIdValid]);

  const saveProfileInfo = useCallback(() => {
    const data: Partial<Profile> = {};
    if (personalInfo.first_name !== profile?.first_name) {
      data.first_name = personalInfo.first_name;
    }
    if (personalInfo.last_name !== profile?.last_name) {
      data.last_name = personalInfo.last_name;
    }
    if (personalInfo.gender !== profile?.gender) {
      data.gender = personalInfo.gender;
    }
    if (personalInfo.birthDate !== profile?.date_of_birth) {
      data.date_of_birth = personalInfo.birthDate;
    }
    if (personalInfo.address !== profile?.address) {
      data.address = personalInfo.address;
    }
    if (
      personalInfo.country?.code &&
      personalInfo.country.code !== profile?.country?.code
    ) {
      data.country = personalInfo.country.code;
    }

    if (Object.keys(data).length > 0) {
      updateProfileAsync(data as RequireAtLeastOne<Profile>).catch(
        logAxiosError
      );
    }
    if (isValidString(personalInfo.email_address) && validEmail) {
      addEmail(
        { email_address: personalInfo.email_address, path: "create/" },
        {
          onError: logAxiosError,
        }
      );
    }
  }, [personalInfo, profile, updateProfileAsync, validEmail]);

  const checkIDStatus = useCallback((key: string) => {
    return new Promise<MediaStatus>((resolve, reject) => {
      const checkStatus = (key: string, increment: number = 1) => {
        if (increment > 10) {
          reject(new Error("ID status check timed out"));
          return;
        }
        axiosInstances.ZOSTEL.get(`/api/v1/profile/me/assets/status/${key}/`)
          .then((d) => d.data)
          .then((res: MediaStatus) => {
            if (res.status === "Processing" || res.status === "Pending") {
              setTimeout(() => {
                checkStatus(res.key, increment + 1);
              }, 6000 + 1000 * increment);
            } else if (res.status === "Validated") {
              resolve(res);
            } else {
              reject(new Error(res.validation_error ?? "ID validation failed"));
            }
          });
      };
      checkStatus(key);
    });
  }, []);

  const showUploadErrorSheet = useCallback((side: "front" | "back") => {
    uploadErrorCount.current[side]++;
    if (uploadErrorCount.current[side] > 1) {
      showTechErrorSheet();
    } else {
      showIdUploadErrorSheet();
    }
  }, []);

  const { getZostelAuthHeaders } = useAuth();

  const uploadId = (path: string, id: number, side: "front" | "back") => {
    setId((prev) => ({ ...prev, isUploading: true }));
    const formdata = new FormData();
    // @ts-ignore
    formdata.append("file", {
      uri: path,
      type: "image/jpg",
      name: `${id}-${+new Date()}.jpg`,
    });
    axiosInstances.ZOSTEL.post(
      `/api/v1/profile/me/assets/${id}/upload/`,
      formdata,
      {
        headers: {
          ...getZostelAuthHeaders(),
          "Content-Type": "multipart/form-data",
        },
      }
    )
      .then((res) => res.data)
      .then((res) => (side === "front" ? checkIDStatus(res.key) : undefined))
      .then(() => refetchZostelProfile())
      .catch((er) => {
        console.log("UPLOADING ERROR: ", er);
        logAxiosError(er);
        showUploadErrorSheet(side);
      })
      .finally(() => setId((prev) => ({ ...prev, isUploading: false })));
  };

  const handleIdSubmit = useCallback(
    (
      value: AssetMedia,
      side: "front" | "back",
      source: "camera" | "gallery"
    ) => {
      setId((prev) => ({ ...prev, [side]: value, source, side }));
      setFormState("id_edit");
      uploadId(value.path, docTypesMap.current[side], side);
    },
    [uploadId]
  );

  const openGallery = useCallback(
    (side: "front" | "back") => {
      hideIdViewSheet();
      hideIdUploadErrorSheet();
      openGalleryPicker()
        .then((value) => handleIdSubmit(value, side, "gallery"))
        .catch((er) => {
          console.warn("Error picking image: ", er.message);
        });
    },
    [handleIdSubmit]
  );

  const openCamera = useCallback((side: "front" | "back") => {
    hideIdViewSheet();
    hideIdUploadErrorSheet();
    setFormState("id_edit");
    setId((prev) => ({ ...prev, side, isUsingCamera: true }));
  }, []);

  const captureRef =
    useRef<(cb: (file: IDState["front"]) => void) => void>(undefined);

  const takePicture = () => {
    captureRef.current?.((photo) => {
      setId((prev) => ({ ...prev, isUsingCamera: false }));
      if (photo) {
        handleIdSubmit(photo, id.side, "camera");
      }
    });
  };

  const onLooksCool = useCallback(() => {
    if (
      id.side === "front" &&
      profileMedia?.front?.document_type?.requires_back
    ) {
      if (formState === "id_edit") {
        if (id.source === "gallery") {
          openGallery("back");
        } else {
          openCamera("back");
        }
      }
      setId((prev) => ({ ...prev, side: "back" }));
    } else {
      setFormState("time");
    }
  }, [id, formState, profileMedia]);

  const onSavePreview = useCallback(() => {
    if (id.side === "front") {
      setId((prev) => ({ ...prev, side: "back" }));
    } else {
      setFormState("time");
    }
  }, [id.side]);

  const onReuploadPhoto = useCallback(
    (side: "front" | "back") => {
      setId((prev) => ({ ...prev, source: "gallery", side }));
      openGallery(side);
    },
    [id.side]
  );

  const onRetakePhoto = useCallback(
    (side: "front" | "back") => {
      setId((prev) => ({
        ...prev,
        side,
        source: "camera",
        isUsingCamera: true,
      }));
      openCamera(side);
    },
    [id.side]
  );

  const onPersonalInfoDone = useCallback(() => {
    if (isIdValid) {
      setFormState("time");
    } else {
      showIdViewSheet();
    }
    saveProfileInfo();
  }, [isIdValid, saveProfileInfo]);

  const onNavBack = useCallback(() => {
    if (id.isPreviewing && formState === "id_edit") {
      setFormState("time");
    } else {
      goBack();
    }
  }, [id.isPreviewing, formState]);

  const navContent = useMemo(
    () => (
      <TitleView
        isIdPreview={id.isPreviewing && formState === "id_edit"}
        formState={formState}
        goBack={onNavBack}
      />
    ),
    [onNavBack, formState, id.isPreviewing]
  );

  const sheetContent = useMemo(
    () => (
      <>
        {isIdViewSheetVisible && (
          <DisplayCheckinIDSheet
            onClose={hideIdViewSheet}
            onCameraClick={openCamera.bind(null, "front")}
            onGalleryClick={openGallery.bind(null, "front")}
            isVisible={isIdViewSheetVisible}
            ids={kycDocs}
          />
        )}
        {previewSheet && (
          <CheckinInfoPreviewSheet
            isVisible={!!previewSheet}
            previewType={previewSheet}
            personalInfo={personalInfo}
            profileMedia={profileMedia}
            onClose={() => setPreviewSheet(null)}
            onEdit={() => {
              if (previewSheet === "basic_info") {
                setFormState("info_edit");
              } else {
                setFormState("id_edit");
                setId((prev) => ({
                  ...prev,
                  side: "front",
                  isPreviewing: true,
                }));
              }
              setPreviewSheet(null);
            }}
          />
        )}
        {isIdUploadErrorSheetVisible && (
          <CheckinIDUploadErrorSheet
            id={id}
            isVisible={isIdUploadErrorSheetVisible}
            onClose={hideIdUploadErrorSheet}
            onRetake={openCamera.bind(null, id.side)}
            onUpload={openGallery.bind(null, id.side)}
          />
        )}
        {isTechErrorSheetVisible && (
          <CheckinTechErrorSheet
            isVisible={isTechErrorSheetVisible}
            onClose={hideTechErrorSheet}
            goBack={goBack}
          />
        )}
      </>
    ),
    [
      isIdViewSheetVisible,
      isTechErrorSheetVisible,
      kycDocs,
      previewSheet,
      personalInfo,
      profileMedia,
      isIdUploadErrorSheetVisible,
      id,
      openGallery,
      openCamera,
    ]
  );

  const editViewButton = useMemo(
    () => (
      <GradientFooter style={styles.gradient}>
        <Button
          onPress={onPersonalInfoDone}
          isDisabled={!(isPersonalInfoValid && validEmail)}
        >
          {isIdValid ? "Save" : "Add an ID"}
        </Button>
      </GradientFooter>
    ),
    [isPersonalInfoValid, onPersonalInfoDone, isIdValid, validEmail]
  );

  const editIdButton = useMemo(
    () =>
      id.isUploading ? null : (
        <GradientFooter style={styles.gradient}>
          <>
            {(id.side === "front" &&
              profileMedia?.front?.validation_status === "Validated") ||
            (id.side === "back" && profileMedia?.back?.file) ? (
              <Button onPress={onLooksCool}>Looks Cool</Button>
            ) : null}
            {id.source === "gallery" ? (
              <Button
                onPress={onReuploadPhoto.bind(null, id.side)}
                variant="secondary"
              >
                Reupload Photo
              </Button>
            ) : (
              <Button
                onPress={onRetakePhoto.bind(null, id.side)}
                variant="secondary"
              >
                Retake Photo
              </Button>
            )}
          </>
        </GradientFooter>
      ),
    [onLooksCool, onRetakePhoto, onReuploadPhoto, id, profileMedia]
  );

  const previewIdButton = useMemo(
    () =>
      id.isUploading ? null : (
        <>
          <GradientFooter style={styles.gradient}>
            {id.side === "front" ? (
              <>
                <Button onPress={onSavePreview}>Save</Button>
                <View style={styles.saveRetakebtnRow}>
                  <View style={helpers.flex}>
                    <Button
                      onPress={onRetakePhoto.bind(null, "front")}
                      variant="secondary"
                    >
                      Retake
                    </Button>
                  </View>
                  <View style={helpers.flex}>
                    <Button
                      onPress={onReuploadPhoto.bind(null, "front")}
                      variant="secondary"
                    >
                      Reupload
                    </Button>
                  </View>
                </View>
              </>
            ) : (
              <>
                <Button onPress={onSavePreview}>Save</Button>
                {id.source === "gallery" ? (
                  <Button
                    onPress={onReuploadPhoto.bind(null, "back")}
                    variant="secondary"
                  >
                    Reupload
                  </Button>
                ) : (
                  <Button
                    onPress={onRetakePhoto.bind(null, "back")}
                    variant="secondary"
                  >
                    Retake
                  </Button>
                )}
              </>
            )}
          </GradientFooter>
        </>
      ),
    [onSavePreview, onRetakePhoto, onReuploadPhoto, id]
  );

  const timeCTA = useMemo(
    () => (
      <GradientFooter style={styles.gradient}>
        <Button
          onPress={doCheckin}
          isLoading={isCheckinLoading}
          isDisabled={!isTimeInfoValid}
        >
          Finish Check-in
        </Button>
      </GradientFooter>
    ),
    [isTimeInfoValid, doCheckin, isCheckinLoading]
  );

  const shutterButton = useMemo(
    () => (
      <View style={styles.shutterContainer}>
        <Pressable onPress={takePicture} style={styles.shutterButton}>
          <View style={styles.shutter} />
        </Pressable>
        <SafeAreaView safeArea="bottom" />
      </View>
    ),
    [takePicture]
  );

  const extraContent = useMemo(
    () => (
      <>
        {isLoading ? (
          <></>
        ) : formState === "info_edit" ? (
          editViewButton
        ) : formState === "id_edit" && id.isUsingCamera ? (
          shutterButton
        ) : id.isPreviewing && formState === "id_edit" ? (
          previewIdButton
        ) : formState === "id_edit" ? (
          editIdButton
        ) : formState === "time" ? (
          timeCTA
        ) : (
          <></>
        )}
        {sheetContent}
      </>
    ),
    [
      isLoading,
      formState,
      editViewButton,
      editIdButton,
      timeCTA,
      sheetContent,
      shutterButton,
      previewIdButton,
      id.isUsingCamera,
      id.isPreviewing,
    ]
  );

  if (formState === "done" && operator) {
    return (
      <FinishedCheckinView
        booking={booking}
        operator={operator}
        onClose={goBack}
      />
    );
  }

  return (
    <Ziew background style={helpers.stretch}>
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        style={helpers.stretch}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <SafeAreaView safeArea="top" style={styles.head} />
        <View style={styles.content}>
          {isLoading ? (
            <View style={styles.loader}>
              <Loader />
            </View>
          ) : formState === "info_edit" ? (
            <PersonalInfoEdit
              personalInfo={personalInfo}
              setPersonalInfo={setPersonalInfo}
              onEditEmailAddress={onEditEmailAddress}
            />
          ) : formState === "time" ? (
            <TimeEdit
              timeState={timeState}
              setTimeState={setTimeState}
              showPreview={isPersonalInfoValid && isIdValid}
              showBasicInfo={setPreviewSheet.bind(null, "basic_info")}
              showGovIDs={setPreviewSheet.bind(null, "gov_ids")}
            />
          ) : formState === "id_edit" ? (
            id.isUsingCamera ? (
              <IDCapture id={id} captureRef={captureRef} />
            ) : (
              <IDEdit
                id={id}
                profileMedia={profileMedia}
                isPreview={id.isPreviewing}
              />
            )
          ) : (
            <></>
          )}
          {formState == "time" ? (
            <View style={styles.bottomSmallSpace} />
          ) : formState == "info_edit" ? (
            <View style={styles.bottomSpacer} />
          ) : null}
        </View>
      </ScrollView>
      <GradientHeader y={0.8} horizontalPadding>
        {navContent}
      </GradientHeader>
      {extraContent}
    </Ziew>
  );
};

export default CheckinScreen;

const styles = StyleSheet.create({
  content: {
    flex: 1,
    alignSelf: "stretch",
    paddingTop: 24,
    gap: 8,
  },
  loader: {
    flex: 1,
    alignSelf: "stretch",
    justifyContent: "center",
    alignItems: "center",
  },
  contentContainer: {
    flexGrow: 1,
    alignSelf: "stretch",
    paddingBottom: 96,
    paddingHorizontal: 24,
  },
  bottomSpacer: {
    height: 180,
  },
  bottomSmallSpace: {
    height: 64,
  },
  gradient: {
    position: "absolute",
    bottom: 0,
    paddingTop: 16,
    // paddingBottom: 8,
    gap: 16,
  },
  saveRetakebtnRow: { flexDirection: "row", gap: 16 },
  shutter: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#F1563F",
  },
  shutterButton: {
    width: 88,
    height: 88,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: "#F1563F",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
  },
  shutterContainer: {
    position: "absolute",
    bottom: 8,
    width: "100%",
    alignItems: "center",
  },
  bookingNotFoundButton: {
    position: "absolute",
    bottom: 8,
    width: "100%",
    paddingHorizontal: 24,
  },
  noBookingLoader: {
    ...helpers.stretch,
    ...helpers.center,
  },
  mt: { marginTop: 16 },
  noBookingError: {
    marginTop: 4,
    flexDirection: "row",
    alignContent: "center",
    justifyContent: "flex-start",
    gap: 4,
  },
  noBookingErrorText: { color: "#FF4545" },
  otherWays: {
    alignSelf: "stretch",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 32,
  },
  otherWaysText: { textDecorationLine: "underline" },
  head: {
    marginBottom: 56,
  },
});

const isProfileValid = (
  zoProfile: GeneralObject,
  zostelProfile: GeneralObject
) => {
  return (
    isValidString(zoProfile.first_name) &&
    isValidString(zoProfile.last_name) &&
    (isValidEmail(zoProfile.email_address) ||
      isValidEmail(zostelProfile.email)) &&
    isValidString(zoProfile.gender) &&
    isValidString(zoProfile.date_of_birth) &&
    isValidString(zoProfile.address)
  );
};

const openGalleryPicker = () =>
  openPicker({
    enableRotationGesture: true,
    mediaType: "photo",
    freeStyleCropEnabled: true,
    forceJpg: true,
    cropping: true,
    showCropGuidelines: true,
    showCropFrame: true,
    multiple: false,
    width: 2000,
    height: 2000,
  }).then((value) => ({
    name: value.filename ?? "_id_",
    size: value.size,
    path: value.path,
    mime: value.mime,
  }));
