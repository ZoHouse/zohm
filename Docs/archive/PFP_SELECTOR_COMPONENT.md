# `PFPSelector.tsx` – Technical Documentation

**Location**: `src/components/helpers/PFPSelector.tsx`  
**Purpose**: Display and persist NFT-based profile pictures during onboarding and profile editing in the Zo Club mobile app.  
**Last Updated**: November 13, 2025

---

## 1. High-Level Role

`PFPSelector` renders a modal-style selector that lets a member pick one of the NFTs linked to their wallet as a profile picture. It acts as the visual and data bridge between Zo’s profile APIs and the user-facing onboarding flow:

- **Fetch**: Loads NFT metadata (`PROFILE_ME_PFP`).
- **Render**: Shows a grid of NFT images with selection feedback, search filtering (v1), and empty-state messaging.
- **Persist**: Calls `PROFILE_ME_PFP` mutation with the chosen contract address/token id, then refreshes the profile via `useProfile`.
- **Feedback**: Provides skeleton loaders, haptic confirmation, and success/empty fallbacks.

---

## 2. Dependencies & Imports

| Module | Reason |
|--------|--------|
| `native-base` components (`Center`, `Pressable`, `Text`, `VStack`, `View`) | Layout and typography |
| `react-native` (`ListRenderItem`, `StyleSheet`) | FlatList rendering types and styles |
| `react-native-fast-image` | Efficient NFT image loading with caching |
| `react-native-reanimated` (`Animated`, `FadeIn`) | Entry animation for list/empty state |
| `device` config | Responsive sizing tied to device width |
| Hooks: `useProfile`, `useQueryApi`, `useMutationApi` | Data fetch & mutation wrappers |
| Utilities: `triggerHaptic`, `toChecksumAddress` | Haptic feedback, Ethereum address normalisation |
| Visual assets: `Frame` illustration, `PFPListSkeleton`, `Icon` | Empty state art, loading skeleton, selection icon |

---

## 3. Component Lifecycle & State

```typescript
const [selectedPFP, setSelectedPFP] = useState(profile?.ens_nickname);
const [isLoading, setLoading] = useState(true);
```

- `selectedPFP`: Tracks the currently highlighted NFT (object with `token_address`, `token_id`). Initialises from `profile.pfp_metadata` once the profile hook resolves.
- `isLoading`: Drives skeleton visibility; toggled by `isLoadingPFP`/`isFetchingPFP` flags from `useQueryApi`.

### Key Effects

1. **Loading State Sync** – An effect watches `isLoadingPFP || isFetchingPFP` and updates `isLoading` accordingly.
2. **Profile Sync** – On profile change, seeds `selectedPFP` with the persisted metadata (checksum-normalised address + token id).
3. **Empty-State Notifier** – If API returns zero NFTs, it triggers `onSelect("")` so parent flows can expose skip/continue CTAs.
4. **Auto-Mutation** – Whenever the user selects a new NFT that differs from the stored metadata, an effect invokes `updatePFP()`.

---

## 4. Data Fetching Flow

### Query: `PROFILE_ME_PFP`
- Triggered when component is open **and** the profile has a wallet address.
- Uses `limit=1000` query parameter to load large collections.
- Returns an Axios response under `pfpOwnedData?.data.results` (array of NFT records).
- Each record contains `token_address`, `token_id`, and `metadata` (image, title).

### Mutation: `PROFILE_ME_PFP`
- Sends `{ contract_ref_address, token_ref_id }` constructed from the selected NFT.
- On success: fires optional `onSelect` callback, refetches profile, closes the selector.
- On error: logs to console (TODO: surface toasts/errors for UX polish).

---

## 5. Rendering Mechanics

### Layout
- **Header**: Title text `Select NFT to use as profile photo`.
- **Body**:
  - If loading: show `PFPListSkeleton` overlay.
  - If empty: show `Frame` illustration + “You haven’t added any NFTs yet” copy.
  - Else: display a `FlatlistComponent` (injected from parent) with 2-column grid.

### Item Renderer
```typescript
const isSelected =
  toChecksumAddress(selectedPFP?.token_address) === toChecksumAddress(item.token_address) &&
  selectedPFP?.token_id === item.token_id;
```

- Each tile uses `FastImage` sized to `(device.WINDOW_WIDTH / 2) - 36` for responsive squares.
- Selected item overlay: semi-transparent black scrim + `CheckCircle` icon in Zo neon green.
- Tapping a tile triggers haptics (`triggerHaptic()`) and updates `selectedPFP`.

### Image URI Normalisation
- `getImageUri()` converts `ipfs://` URIs to `https://ipfs.io/ipfs/...` to ensure compatibility with `FastImage`.

---

## 6. Empty-State Workflow

When `pfpOwnedData?.data.results.length === 0`:
1. Renders animated empty-state block using `Frame` illustration.
2. Notifies parent via `onSelect("")` effect (enables skip button in `OnboardingScreen`).
3. Component still displays skeleton while `isLoading` is true to prevent flicker.

---

## 7. Integration Points

- **Onboarding** (`OnboardingScreen`): `onSelect` callback toggles `Continue` button when no NFT is available, otherwise advances onboarding.
- **Modal Variant** (`PFPSelectionModal`): Presents `PFPSelector` inside a bottom sheet for profile editing.
- **Selector v2** (`PFPSelector2`): Enhanced visuals but shares the same data patterns and mutation logic.

---

## 8. Operational Notes & Pitfalls

| Concern | Mitigation / Current Behaviour |
|---------|--------------------------------|
| **Multiple rapid taps** | `selectedPFP` updates synchronously; repeated taps on same item do not trigger duplicate mutations because the effect compares against `profile.pfp_metadata`. |
| **Network errors** | Only logged to console today; consider user-facing error states. |
| **Null profile** | Effects guard on `profile` existence; no fetch occurs when wallet address missing. |
| **IPFS outages** | No placeholder yet; consider fallback image. |
| **Performance** | FlatList is injected from parent to allow virtualization control (e.g., `FlashList`). |

---

## 9. Testing & Debug Tips

- **Unit/UI tests** (Jest + RTL): mock `useProfile`, `useQueryApi`, `useMutationApi` to simulate loading, empty, and success states; assert overlay rendering.
- **Manual QA**: Use a test wallet with known NFT holdings; confirm selection updates profile in backend and reopens with correct highlight.
- **Logging**: Add temporary logging in `updatePFP` to inspect payload or intercept network traffic using Flipper.

---

## 10. Future Enhancements

1. **Search Bar**: The v1 component omitted search due to UX refactor; reintroduce if large collections become unwieldy.
2. **Error Messaging**: Show toast or inline error if mutation fails.
3. **Upload Support**: Extend to support direct image uploads when the wallet holds no NFTs.
4. **Optimistic Updates**: Optionally update profile context immediately to reduce perceived latency.
5. **Accessibility**: Add voiceover labels, larger tap targets, and consider haptic opt-out.

---

**Maintainers**: Zo Mobile Platform Team  
**Related Docs**: `AVATAR_PROFILE_FIREBASE_DOCUMENTATION.md`, `APP_OVERVIEW.md`, `MOBILE_APP_DATABASE_API.md`

