# Avatar Selection & Firebase Profile Integration (Mobile App)

**Scope**: React Native app in `zo-club-dj-ar_work` (revamp build)  
**Last Updated**: November 13, 2025  
**Audience**: Mobile engineers, product designers, technical PMs, QA

---

## Table of Contents
- [1. Overview](#1-overview)
- [2. Avatar Selection Journey](#2-avatar-selection-journey)
  - [2.1 Entry Points](#21-entry-points)
  - [2.2 Data Dependencies](#22-data-dependencies)
  - [2.3 NFT Fetch Pipeline](#23-nft-fetch-pipeline)
  - [2.4 UI/UX Responsibilities](#24-uiux-responsibilities)
  - [2.5 Mutation & Persistence Flow](#25-mutation--persistence-flow)
  - [2.6 Empty-State & Fallback Handling](#26-empty-state--fallback-handling)
  - [2.7 Operational Notes](#27-operational-notes)
- [3. Firebase Linking for Profiles](#3-firebase-linking-for-profiles)
  - [3.1 Modules & Configuration](#31-modules--configuration)
  - [3.2 Device Registration Pipeline](#32-device-registration-pipeline)
  - [3.3 Runtime Notification Handling](#33-runtime-notification-handling)
  - [3.4 Background / Cold-Start Behaviour](#34-background--cold-start-behaviour)
  - [3.5 Failure Modes & Mitigations](#35-failure-modes--mitigations)
- [4. Cross-Cutting Concerns](#4-cross-cutting-concerns)
- [5. Future Enhancements](#5-future-enhancements)
- [6. Verification Checklist](#6-verification-checklist)

---

## 1. Overview

The mobile onboarding flow asks every citizen to select a profile avatar and ensures that their profile can receive push notifications via Firebase Cloud Messaging (FCM). Two core subsystems orchestrate this:

1. **Avatar Selection** – driven by the `PFPSelector` / `PFPSelector2` components and the `PROFILE_ME`/`PROFILE_ME_PFP` API family. This allows members to pick any NFT they own (fetched from the Zo APIs) as their display picture.
2. **Firebase Profile Integration** – powered by the `useDeviceRegister`, `useNotifications`, and `initiateNotifications` utilities. These hooks register the device, obtain an FCM token, and synchronise it with the Zo backend so pushes remain tied to the member’s profile.

The following sections document the end-to-end data flows, UI responsibilities, network calls, caching, and operational caveats for both areas.

---

## 2. Avatar Selection Journey

### 2.1 Entry Points

There are three places where avatar selection is surfaced today:

- **Primary Onboarding** (`OnboardingScreen`): After ENS nickname selection, the flow transitions into the PFP step.
- **PFP Bottom Sheet** (`PFPSelectionModal`): Allows avatar changes post-onboarding.
- **Updated Onboarding (v2)** (`Onboarding2`): Same semantics but updated visuals via `PFPSelector2`.

Key wiring inside onboarding:

```59:93:zo-club-dj-app_revamp/src/screens/Onboarding.tsx
return (
  <Box flex="1" safeArea background="zui.background">
    {step === "nickname" ? (
      <ENSSelector ... />
    ) : step === "pfp" ? (
      <VStack flex="1">
        <PFPSelector
          isOpen
          close={noop}
          onSelect={onSelectPFP}
          FlatlistComponent={FlatList}
        />
        {isNoPFP && (
          <Pressable ... onPress={proceedWelcome}>
            <Text>Continue</Text>
          </Pressable>
        )}
      </VStack>
    ) : null}
  </Box>
);
```

### 2.2 Data Dependencies

All avatar flows depend on three hooks:

| Hook | Responsibility | Notes |
|------|----------------|-------|
| `useProfile()` | Fetches `PROFILE_ME` payload (citizen id, wallet address, current PFP metadata) via `react-query`. | Auto refetch on mutation success. Handles forced logout on 403. |
| `useQueryApi("PROFILE_ME_PFP")` | Queries NFT inventory authorised for the wallet. | Adds `limit=1000` to ensure large collections load in one page. |
| `useMutationApi("PROFILE_ME_PFP")` | Persists contract/token selection. | Wraps Axios mutation factory; defaults to POST. |

The selectors use checksum-normalised addresses via `toChecksumAddress` to avoid mismatches when comparing contract records.

### 2.3 NFT Fetch Pipeline

1. **Trigger** – component mounts with `isOpen === true` and a logged-in profile that has `wallet_address`.
2. **API Call** – `useQueryApi` issues `GET /profile/me/pfp?limit=1000`.
3. **Transformation** – `.select` coerces Axios response to `data.results` array; each result contains `token_address`, `token_id`, `metadata` (title, image, etc.).
4. **Image Resolution** – `getImageUri` rewrites `ipfs://` URIs to `https://ipfs.io/ipfs/...`, otherwise passes through HTTP URLs.
5. **State Setup** – On success, `setLoading(false)`, `setSelectedPFP(profile.pfp_metadata)`

Relevant snippet:

```31:188:zo-club-dj-app_revamp/src/components/helpers/PFPSelector.tsx
const {
  data: pfpOwnedData,
  isLoading: isLoadingPFP,
  isFetching: isFetchingPFP,
} = useQueryApi(
  "PROFILE_ME_PFP",
  { enabled: profile != null && profile?.wallet_address != null && isOpen,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
    select: (data) => data?.data?.results || [],
  },
  "",
  "limit=1000"
);
```

### 2.4 UI/UX Responsibilities

- **Grid Rendering** – The selector renders a 2-column grid using the injected `FlatList` for ergonomic scrolling. Each tile is a `FastImage` sized to half the device width minus padding.
- **Selection Feedback** – Active tile overlays a semi-transparent scrim and displays a `CheckCircle` icon in Zo neon green (`#CFFF50`).
- **Search** – Search box filters NFT titles locally each keystroke; `triggerHaptic()` provides tactile feedback when clearing.
- **Animations** – `react-native-reanimated`’s `FadeIn` animates list appearance.
- **Skeleton Loading** – `PFPListSkeleton` covers the grid while network fetches.
- **Haptics** – Each selection runs `triggerHaptic()` to mimic native tap feel.

### 2.5 Mutation & Persistence Flow

When a user taps an NFT tile:

1. `setSelectedPFP(pfp)` updates local state.
2. A `useEffect` detects the delta between current selection and persisted `profile.pfp_metadata`.
3. `updatePFP()` calls `useMutationApi("PROFILE_ME_PFP")` with `contract_ref_address` + `token_ref_id`.
4. On success, `refetchProfile()` ensures `PROFILE_ME` cache is up-to-date, the optional `onSelect` callback fires, and the sheet closes.

Mutation excerpt:

```88:134:zo-club-dj-app_revamp/src/components/helpers/PFPSelector.tsx
const updatePFP = async () => {
  if (selectedPFP) {
    updatePfp(
      { data: {
          contract_ref_address: toChecksumAddress(selectedPFP.token_address),
          token_ref_id: selectedPFP.token_id,
        },
      },
      {
        onSuccess: () => {
          onSelect?.(selectedPFP);
          refetchProfile();
          close();
        },
        onError: () => console.log("Error updating PFP"),
      }
    );
  }
};
```

### 2.6 Empty-State & Fallback Handling

- If the wallet owns **zero NFTs**, `pfpOwnedData.length === 0` triggers the empty state. `onSelect("")` notifies the parent, which allows users to skip via the explicit “Continue” CTA (`isNoPFP`).
- `PFPSelector2` decorates this state with `MemoProfile2Frame` (framed citizen card + welcome message) to reinforce brand tone.
- When the backend returns no `pfp_metadata`, `selectedPFP` remains null and no mutation fires—ensuring safety for new members.

### 2.7 Operational Notes

- **API Dependencies** – `PROFILE_ME_PFP` relies on backend wallet synchronisation; any delay in NFT ingestion delays avatar availability.
- **Caching** – `react-query` caches results per endpoint; closing/reopening the modal reuses cached data unless a refetch is forced.
- **Images** – Since URIs are proxied via `ipfs.io`, slow networks may degrade load times. Consider bundling a local placeholder if the IPFS gateway is unavailable.
- **Haptics & Accessibility** – Ensure haptic cues still comply with accessibility guidelines (optionally disable for reduced motion users in future work).

---

## 3. Firebase Linking for Profiles

### 3.1 Modules & Configuration

The project depends on several `@react-native-firebase/*` packages (App, Messaging, Analytics, Crashlytics). Messaging powers push notifications and is the only Firebase module directly touching profile data right now.

Key config files:
- `firebase.json` (root) – standard React Native Firebase multi-app configuration.
- Xcode/Gradle pods – set up via `RNFBApp`, `RNFBMessaging`, etc. (see `ios/Pods/Target Support Files/...`).

### 3.2 Device Registration Pipeline

`useDeviceRegister()` is invoked once when the navigation container mounts:

```96:101:src/components/helpers/AppNavigation.tsx
const AppNavigation = memo(() => {
  useDeviceRegister();
  useNotifications();
  ...
});
```

Workflow:

1. **Login Gate** – Hook short-circuits unless `useAuth().isLoggedIn` is true.
2. **Version Check** – `isAppUpdatedOrUpgraded()` ensures registration runs only when the build or version changes, avoiding redundant PUTs.
3. **FCM Setup** – Registers for remote messages (APNS on iOS), fetches FCM token via `messaging().getToken()`.
4. **Device Metadata** – Reads device id, name, and unique id from `react-native-device-info` alongside app `version`/`build` (from `appInfo`).
5. **Backend Sync** – Upserts device record with `AUTH_USER_DEVICES` (HTTP PUT) using `useMutationApi`. Payload includes optional `notification_token` (FCM token) and semantic app metadata.

Snippet:

```10:47:src/hooks/useDeviceRegister.tsx
if (isLoggedIn) {
  const hasAppUpdatedOrUpgraded = await isAppUpdatedOrUpgraded();
  if (hasAppUpdatedOrUpgraded) {
    if (!messaging().isDeviceRegisteredForRemoteMessages) {
      await messaging().registerDeviceForRemoteMessages();
    }
    await messaging().getAPNSToken();
    const token = await messaging().getToken();
    const deviceId = await deviceInfoModule.getDeviceId();
    const deviceName = await deviceInfoModule.getDeviceName();
    const uniqueId = await deviceInfoModule.getUniqueId();
    const deviceInfo = {
      device_id: uniqueId,
      device_name: deviceName || deviceId,
      client_version: appInfo[Platform.OS].version,
      client_build: appInfo[Platform.OS].build,
      ...(token && { notification_token: token }),
    };
    mutate({ data: deviceInfo }, ...);
  }
}
```

**Outcome**: Every authenticated profile has a backend record linking their account → device → FCM token, enabling notification fan-out.

### 3.3 Runtime Notification Handling

Two layers process incoming messages:

1. **Foreground & Launch Lifecycle** – `useNotifications()` wires `messaging().onMessage`, `getInitialNotification`, and `onNotificationOpenedApp` to render notifications via Notifee and navigate to the target screen when `screen_name` is supplied in the payload.
2. **Background Handler** – `initiateNotifications()` (called during app bootstrap) sets `messaging().setBackgroundMessageHandler` to ensure navigation still occurs after a background push.

Foreground handling excerpt:

```6:125:src/hooks/useNotifications.tsx
messaging().onMessage((message) => {
  notifee.displayNotification({
    title: message.notification?.title,
    body: message.notification?.body,
    android: { channelId: "general", pressAction: { id: "default", launchActivity: "default" }, smallIcon: "ic_stat_name" },
    data: message.data,
  });
});
...
messaging().onNotificationOpenedApp((message) => {
  if (message.data?.screen_name) {
    navigate(String(message.data.screen_name), message.data);
  }
});
```

Background handler:

```6:33:src/utils/notification.ts
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  if (remoteMessage.data?.screen_name) {
    setTimeout(() => {
      navigate(String(remoteMessage.data?.screen_name), remoteMessage.data);
    }, 5000);
  }
});
```

### 3.4 Background / Cold-Start Behaviour

- **Cold Start**: `messaging().getInitialNotification()` (in `useNotifications`) and `notifee.getInitialNotification()` (inside `initiateNotifications`) both inspect launch data to determine deep-link targets. The code waits 3–5 seconds before navigation to avoid racing the splash stack initialisation.
- **Background**: The `notifee.onBackgroundEvent` + `setBackgroundMessageHandler` pair ensures taps on notifications while the app is backgrounded still route to the intended screen.

### 3.5 Failure Modes & Mitigations

| Failure | Symptom | Handling | Follow-up |
|---------|---------|----------|-----------|
| `messaging().registerDeviceForRemoteMessages` throws | Token never issued on iOS simulators | Wrapped in try/catch; hook logs but does not crash | Consider user feedback toast, add retry/backoff |
| Backend PUT fails | Device not tracked | Currently only logs; mutation `onError` can be enhanced to surface to Sentry | Add offline queue or local cache |
| `navigate` call from background fails (navigator not ready) | Tap on notification does nothing | Guarded by checking `navigationRef` state and delaying navigation | Could add global event bus to defer navigation until navigator ready |
| IPFS gateway offline | Avatar thumbnails broken | No fallback today | Add local placeholder & retry logic |

---

## 4. Cross-Cutting Concerns

- **Concurrency**: Avatar mutation and device registration are independent; both rely on `react-query` / Axios wrappers. Ensure hook invocations remain inside the React tree to avoid duplicate effects.
- **Auth Lifecycle**: Logging out clears profile context; a future enhancement should also invalidate FCM tokens on the backend (`AUTH_USER_DEVICES` DELETE) to maintain hygiene.
- **Haptics + Notifications**: When combining haptic triggers with notification taps, verify there is no double-navigation or double-haptic (e.g., pressing continue in the empty state).
- **Testing**:
  - Use `react-native-testing-library` to assert empty state fallbacks and search filtering.
  - For Firebase, rely on `@react-native-firebase/testing` or stub `messaging()` in Jest to simulate tokens/events.

---

## 5. Future Enhancements

1. **Local Avatars**: Allow camera/gallery uploads with a fallback to NFT selection.
2. **Offline Caching**: Cache last-known NFT metadata to render immediately when offline.
3. **Token Revocation**: Expose API to revoke notification tokens on logout/device removal.
4. **Multi-Device Support**: Display the list of registered devices in settings for transparency.
5. **Push Debug Overlay**: Developer setting to show raw FCM payloads and navigation outcomes.

---

## 6. Verification Checklist

### Avatar Selection
- [ ] `PROFILE_ME` returns current `pfp_metadata`.
- [ ] `PROFILE_ME_PFP` returns NFT list (non-empty for known wallets).
- [ ] Selecting an NFT triggers haptic + updates profile after mutation.
- [ ] Empty NFT state exposes “Continue” CTA and sets `onSelect("")`.

### Firebase Integration
- [ ] Logging in on a new build registers device & token with backend.
- [ ] FCM push received in foreground shows Notifee banner and navigates.
- [ ] Background push tap navigates after splash (both iOS & Android).
- [ ] Updating build version triggers fresh registration (verify via backend logs).

---

**Maintainers**: Mobile Platform Team  
**Contact**: #zo-mobile slack channel  
**Related Docs**: `MOBILE_APP_DATABASE_API.md`, `APP_OVERVIEW.md`

