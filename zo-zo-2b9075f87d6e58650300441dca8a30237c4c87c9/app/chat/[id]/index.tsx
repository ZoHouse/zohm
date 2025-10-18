import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import Ziew from "@/components/ui/View";
import helpers from "@/utils/styles/helpers";
import CommProvider from "@/context/CommProvider";
import ChatHead from "@/components/helpers/chat/ChatHead";
import { NoContent } from "@/components/ui";
import Animated, { FadeInDown } from "react-native-reanimated";

const ChatDetailScreen: React.FC = () => {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <Ziew style={helpers.stretch} background>
      <ChatHead id={id} />
      <Animated.View
        style={helpers.flexCenter}
        entering={FadeInDown.delay(100).springify()}
      >
        <NoContent
          source={require("@/assets/lottie/wip.json")}
          title="Work in Progress"
          subtitle="This feature shall be back soon"
          btnProps={{
            title: "Go Back",
            onPress: () => router.back(),
          }}
        />
      </Animated.View>
    </Ziew>
  );
};

const ChatDetailWithProvider = () => (
  <CommProvider>
    <ChatDetailScreen />
  </CommProvider>
);

export default ChatDetailWithProvider;
