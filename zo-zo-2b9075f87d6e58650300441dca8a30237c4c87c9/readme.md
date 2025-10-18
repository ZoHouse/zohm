## Get started

1. Install dependencies

   ```bash
   bun install
   ```

2. Start the app

   ```bash
    bun expo run:ios --no-build-cache
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Structure

Screens:

1. Splash (default expo one + index.tsx)
2. Onboarding (login.tsx)
3. Explore (explore.tsx)
4. Destination
   a. Single Destination (destination/[id].tsx)
   b. All Destinations (destination/all.tsx)
5. Zostel
   a. Single Zostel (zostel/[id].tsx)
   b. All Zostel (zostel/all.tsx)
6. House
   a. Single House (house/[id].tsx)
   b. All House (house/all.tsx)
7. Trip
   a. Single Trip (trip/[id].tsx)
   b. All Trips (trip/all.tsx)
8. Blog
   a. Single Blog (blog/[id].tsx)
   b. All Blogs (blog/all.tsx)
9. Chat
   a. Single Chat (chat/[id].tsx)
   b. All Chats (chat/all.tsx)
10. Profile
    a. My Profile (profile/me.tsx)
    b. User Profile (profile/[id].tsx)
11. Booking
    a. Single Booking (booking/[id].tsx)
    d. All Bookings (booking/all.tsx)
12. (Activity)
    a. Single Activity (activity/[id]/index.tsx)
    b. All Activities (activity/all.tsx)
    c. New Activity (activity/new.tsx)
13. Booking Flow
    a. Booking Confirm
    i. Zostel (booking-flow/zostel.tsx)
    ii. House (booking-flow/house.tsx)
    iii. Trip (booking-flow/trip.tsx)
    b. Booking Payment
14. Review
    a. New Review (review/new.tsx)
    b. Single Review (review/[id].tsx)
15. Checkin (checkin.tsx)

Sheets:

1. Content (will pass text or list of items/text) (AboutTripSheet)
2. AccountSettings
3. ActionMenu
4. CancellationRefundDetails
5. ChatBlockUser
6. ChatMessageInfo
7. ChatPledge
8. ChatReactions
9. Prompt (ChatReportMessage, DeleteAccount)
10. VerifiedInput (AddEmail, AddPhone)
11. ListSelector (Currency, Language)
12. DateSelector
13. EmojiSelector
14. SearchListSelector (GooglePlaceSearch)
15. Image
16. Input
17. Itinerary
18. MergeAccount
19. Nickname
20. NotificationPermission
21. LocationPermission
22. GuestDetails
23. TimePicker
24. Video

Milestones:

1. Auth (Single layer for Zostel and Zo with refresh tokens in interceptors)
2. API Layer
3. Analytics
4. Deep Links
5. Splash + Onboarding
6. Notifications
7. Associated Domains
8. Explore ...
