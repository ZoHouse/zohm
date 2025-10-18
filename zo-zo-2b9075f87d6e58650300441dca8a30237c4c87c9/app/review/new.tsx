import React, { useCallback, useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { LegendList } from "@legendapp/list";
import {
  Button,
  Chip,
  Divider,
  GradientFooter,
  GradientHeader,
  Iconz,
  Loader,
  NoContent,
  Pressable,
  SafeAreaView,
  SectionTitle,
  TextInput,
} from "@/components/ui";
import StarRating from "@/components/ui/StarRating";
import Text from "@/components/ui/Text";
import Ziew from "@/components/ui/View";

import { Review, ReviewCategory, StayBooking } from "@/definitions/booking";
import { GeneralObject, SearchResult } from "@/definitions/general";

import useMutation from "@/hooks/useMutation";
import useQuery from "@/hooks/useQuery";
import useUploadMedia from "@/hooks/useUploadMedia";

import { getDateWithOptionalYear } from "@/utils/data-types/date";
import { logAxiosError } from "@/utils/network";
import helpers from "@/utils/styles/helpers";
import { showToast } from "@/utils/toast";
import ZoImage from "@/components/ui/ZoImage";
import FullCarousel from "@/components/sheets/FullCarousel";

const ReviewScreen: React.FC = () => {
  const { booking_code, rating: _rating } = useLocalSearchParams<{
    booking_code: string;
    rating: string;
  }>();
  const { data: isReviewsDisabled = true } = useQuery("AUTH_APPLICATION_SEED", {
    select: (data) => data.data.disabled_features.includes("reviews"),
  });

  const { data: categories, isLoading: isLoadingCategories } = useQuery(
    "BOOKINGS_REVIEWS_CATEGORIES",
    {
      enabled: !isReviewsDisabled,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      select: (data) => data.data.results,
    }
  );

  const { data: lastReview, isLoading: isLoadingReviews } = useQuery<
    "ZO_BOOKINGS",
    SearchResult<Review>,
    Review
  >(
    "ZO_BOOKINGS",
    {
      select: (data) => data.data.results?.[0],
      enabled: !isReviewsDisabled,
      throwOnError: (er) => {
        logAxiosError(er);
        return false;
      },
    },
    {
      path: [booking_code, "reviews"],
    }
  );

  const { data: booking, isLoading: isLoadingBooking } = useQuery(
    "STAY_BOOKING",
    { select: (data) => data.data, enabled: !!booking_code },
    {
      path: [booking_code],
    }
  );

  if (isLoadingBooking || isLoadingCategories || isLoadingReviews) {
    return (
      <Ziew background style={helpers.flexCenter}>
        <SafeAreaView safeArea="top" style={styles.onlyBack}>
          <View style={styles.onlyBackContent}>
            <Iconz
              name="arrow-left"
              size={24}
              fillTheme="Primary"
              onPress={router.back}
            />
          </View>
        </SafeAreaView>
        <Loader width={48} height={48} />
      </Ziew>
    );
  }

  return !isReviewsDisabled && booking ? (
    lastReview ? (
      <DisplayReview review={lastReview} booking={booking} />
    ) : (
      <AddReview booking={booking} categories={categories ?? []} />
    )
  ) : (
    <Ziew background style={helpers.flexCenter}>
      <SafeAreaView safeArea="top" style={styles.onlyBack}>
        <View style={styles.onlyBackContent}>
          <Iconz
            name="arrow-left"
            size={24}
            fillTheme="Primary"
            onPress={router.back}
          />
        </View>
      </SafeAreaView>
      <NoContent
        source={require("@/assets/lottie/chat-empty.json")}
        title="Uh oh!"
        subtitle={`Something went wrong.\nPlease try again later.`}
      />
    </Ziew>
  );
};

interface DisplayReviewProps {
  review: Review;
  booking: StayBooking;
}

const DisplayReview: React.FC<DisplayReviewProps> = ({ review, booking }) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const closeCarousel = useCallback(() => {
    setSelectedIndex(null);
  }, []);

  const renderItem = useCallback(
    ({ item, index }: { item: Review["media"][number]; index: number }) => (
      <Pressable
        style={styles.mediaItem}
        onPress={() => setSelectedIndex(index)}
      >
        <ZoImage url={item.url} width="xs" id={item.id} />
      </Pressable>
    ),
    []
  );
  return (
    <Ziew background style={helpers.stretch}>
      <ScrollView
        contentContainerStyle={styles.list}
        style={helpers.stretch}
        showsVerticalScrollIndicator={false}
      >
        <SafeAreaView safeArea="top" />
        <View style={styles.head} />
        <SectionTitle
          noHorizontalPadding
          subtitle={`${getDateWithOptionalYear(
            booking.checkin
          )} → ${getDateWithOptionalYear(booking.checkout)}`}
          type="Title"
        >{`Thanks for sharing your experience at ${booking.operator.name}`}</SectionTitle>
        <View style={styles.content}>
          <StarRating
            rating={review.rating / 2}
            disabled
            onChange={() => {}}
            starSize={40}
            starStyle={styles.mainStar}
          />
        </View>
        {review.comment ? (
          <View style={styles.commentContainer}>
            <SectionTitle noHorizontalPadding>
              {review.rating >= 3
                ? "Great! Tell us more..."
                : "How can we improve?"}
            </SectionTitle>
            <Text>{review.comment}</Text>
          </View>
        ) : null}
        {review.media.length > 0 ? (
          <View style={styles.mediaContainer}>
            <LegendList
              data={review.media}
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.mediaList}
              contentContainerStyle={styles.mediaListContent}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
            />
          </View>
        ) : null}
        <Divider marginTop={24} marginBottom={8} />
        <View style={styles.categories}>
          {review.segments.map((segment) => (
            <View key={segment.id} style={styles.category}>
              <Text type="SectionTitle">{segment.category.name}</Text>
              <StarRating
                rating={segment.rating / 2}
                disabled
                onChange={() => {}}
                starSize={40}
                starStyle={styles.mainStar}
              />
            </View>
          ))}
        </View>
        <SafeAreaView safeArea="bottom" style={styles.bottom} />
      </ScrollView>
      <GradientHeader y={0.6}>
        <View style={styles.header}>
          <Iconz
            onPress={router.back}
            name="arrow-left"
            size={24}
            fillTheme="Primary"
          />
        </View>
      </GradientHeader>
      {selectedIndex !== null && (
        <FullCarousel
          images={review.media}
          initialIndex={selectedIndex}
          isOpen
          onDismiss={closeCarousel}
          title={""}
        />
      )}
    </Ziew>
  );
};

interface AddReviewProps {
  booking: StayBooking;
  categories: ReviewCategory[];
}

const AddReview: React.FC<AddReviewProps> = ({ booking, categories }) => {
  const { mutateAsync: submit } = useMutation<
    "ZO_BOOKINGS",
    {
      rating: number;
      comment: string;
      segments: { category: number; rating: number }[];
    },
    { id: string }
  >("ZO_BOOKINGS");

  const [localRating, setLocalRating] = useState(0);
  const [localComment, setLocalComment] = useState("");
  const [segmentRatings, setSegmentRatings] = useState<Record<number, number>>(
    {}
  );
  const handleSegmentRatingChange = (categoryId: number, rating: number) => {
    setSegmentRatings((prev) => ({ ...prev, [categoryId]: rating }));
  };

  const [reviewMedia, setReviewMedia] = useState<GeneralObject[]>([]);
  const [isSending, setSending] = useState(false);

  const addReviewMedia = useCallback(
    (media: GeneralObject[]) => {
      setReviewMedia((prev) => [...prev, ...media].slice(0, MAX_MEDIA_COUNT));
    },
    [setReviewMedia]
  );

  const { setIsActionSheetVisible, sheetContent, uploadMediaToServer } =
    useUploadMedia(addReviewMedia, mediaConfig);

  const onAddMedia = useCallback(() => {
    setIsActionSheetVisible(true);
  }, []);

  const onSubmit = useCallback(() => {
    const data = {
      path: `${booking.code}/reviews/`,
      rating: localRating * 2,
      comment: localComment,
      segments: categories.map((category) => ({
        category: category.id,
        rating: segmentRatings[category.id] * 2 || 0,
      })),
    };
    setSending(true);
    submit(data)
      .then((res) => res.data.id)
      .then((id) => {
        return uploadMediaToServer(
          `/api/v1/bookings/media/review/${id}/`,
          reviewMedia
        );
      })
      .finally(() => setSending(false))
      .then(() => {
        showToast({
          message: "Zo! Thanks for your feedback!",
          type: "success",
        });
        router.back();
      })
      .catch((er) => {
        logAxiosError(er);
        showToast({
          message: "Uh oh! Something went wrong.",
          type: "error",
        });
        router.back();
      });
  }, [
    booking.code,
    localRating,
    localComment,
    segmentRatings,
    reviewMedia,
    uploadMediaToServer,
    categories.length,
  ]);

  const mediaSection = useMemo(
    () =>
      reviewMedia.length > 0 ? (
        <View>
          <LegendList
            data={reviewMedia}
            horizontal
            recycleItems
            style={styles.mediaList}
            contentContainerStyle={styles.mediaListContent}
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.name}
            renderItem={({ item }) => (
              <View style={styles.mediaItem}>
                <ZoImage url={item.path} width={null} />
                <Pressable
                  style={styles.crossContainer}
                  onPress={() => {
                    setReviewMedia((prev) =>
                      prev.filter((m) => m.path !== item.path)
                    );
                  }}
                >
                  <Chip style={styles.cross} background>
                    <Iconz name="cross" size={12} fillTheme="Primary" />
                  </Chip>
                </Pressable>
              </View>
            )}
          />
        </View>
      ) : null,
    [reviewMedia]
  );

  return (
    <Ziew background style={helpers.stretch}>
      <ScrollView
        contentContainerStyle={styles.list}
        style={helpers.stretch}
        showsVerticalScrollIndicator={false}
      >
        <SafeAreaView safeArea="top" />
        <View style={styles.head} />
        <SectionTitle
          noHorizontalPadding
          subtitle={`${getDateWithOptionalYear(
            booking.checkin
          )} → ${getDateWithOptionalYear(booking.checkout)}`}
          type="Title"
        >{`How was your stay at ${booking.operator.name}?`}</SectionTitle>
        <View style={styles.content}>
          <StarRating
            rating={localRating}
            onChange={setLocalRating}
            starSize={40}
            starStyle={styles.mainStar}
          />
        </View>
        <TextInput
          placeholder={
            localRating >= 3 ? "Great! Tell us more..." : "How can we improve?"
          }
          value={localComment}
          onChangeText={setLocalComment}
          multiline
          numberOfLines={4}
          style={styles.comment}
          textAlignVertical="top"
        />
        <Pressable onPress={onAddMedia} activeOpacity={0.8}>
          <Chip background="Input" curve={12} style={styles.addMedia}>
            <Iconz name="camera" size={24} fillTheme="Primary" />
            <Text type="TextHighlight">Add Photos & Videos</Text>
          </Chip>
        </Pressable>
        {mediaSection}
        <Divider marginTop={24} marginBottom={8} />
        <View style={styles.categories}>
          {categories?.map((category) => (
            <View key={category.id} style={styles.category}>
              <Text type="SectionTitle">{category.name}</Text>
              <StarRating
                rating={segmentRatings[category.id] ?? 0}
                onChange={(rating) =>
                  handleSegmentRatingChange(category.id, rating)
                }
                starSize={40}
                starStyle={styles.mainStar}
              />
            </View>
          ))}
        </View>
        <SafeAreaView safeArea="bottom" style={styles.bottom} />
      </ScrollView>
      <GradientHeader y={0.6}>
        <View style={styles.header}>
          <Iconz
            onPress={router.back}
            name="arrow-left"
            size={24}
            fillTheme="Primary"
          />
        </View>
      </GradientHeader>
      <GradientFooter style={styles.footer}>
        <Button
          isDisabled={localRating === 0}
          style={styles.button}
          onPress={onSubmit}
          isLoading={isSending}
        >
          Zo Zo Zo! Share Vibes
        </Button>
      </GradientFooter>
      {sheetContent}
    </Ziew>
  );
};

export default ReviewScreen;

const styles = StyleSheet.create({
  head: {
    height: 56,
  },
  list: {
    paddingHorizontal: 24,
  },
  content: { paddingTop: 8, paddingBottom: 24 },
  mainStar: {
    marginRight: 16,
  },
  comment: {
    height: 120,
  },
  categories: {
    paddingVertical: 16,
    gap: 24,
  },
  category: {
    gap: 8,
  },
  bottom: {
    marginBottom: 90,
  },
  footer: {
    position: "absolute",
    bottom: 0,
  },
  button: {
    marginBottom: 8,
  },
  header: {
    height: 56,
    paddingHorizontal: 24,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  mediaButton: {
    marginTop: 24,
  },
  addMedia: {
    flexDirection: "row",
    gap: 16,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
  },
  mediaList: {
    height: 96,
    marginHorizontal: -24,
    marginTop: 16,
  },
  mediaListContent: {
    gap: 16,
    paddingHorizontal: 24,
  },
  mediaItem: {
    width: 96,
    height: 96,
    borderRadius: 12,
    borderCurve: "continuous",
    overflow: "hidden",
  },
  cross: {
    padding: 6,
    borderRadius: 50,
  },
  crossContainer: {
    position: "absolute",
    top: 8,
    right: 8,
  },
  onlyBack: {
    paddingHorizontal: 24,
    position: "absolute",
    top: 0,
    left: 0,
  },
  onlyBackContent: {
    height: 56,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  mediaContainer: {
    // marginTop: 8,
  },
  commentContainer: {
    marginBottom: 8,
  },
});

const mediaConfig = {
  enableRotationGesture: true,
  mediaType: "any",
  freeStyleCropEnabled: true,
  forceJpg: true,
  cropping: true,
  showCropGuidelines: true,
  showCropFrame: true,
  multiple: true,
  width: 800,
  height: 800,
} as const;

const MAX_MEDIA_COUNT = 10;
