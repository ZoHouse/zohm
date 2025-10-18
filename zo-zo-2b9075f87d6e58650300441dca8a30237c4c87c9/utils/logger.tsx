import analytics from "@/components/helpers/misc/analytics";
import { logEvent, setUserId } from "@react-native-firebase/analytics";
import { voidFn } from "./data-types/fn";

interface Route {
  key: string;
  name: string;
  path: undefined | string;
  params?: Record<string, any>;
  state?: {
    index: number;
  };
}

const Logger = {
  screen: (screen: string, specific: string = screen) => {
    logEvent(analytics, "screen_view", {
      firebase_screen: screen,
      firebase_screen_class: specific,
    }).catch(voidFn);
  },
  viewItem: (item_id: string, item_category: string, item_name?: string) => {
    logEvent(analytics, "view_item", {
      items: [
        item_name
          ? {
              item_id,
              item_category,
              item_name,
            }
          : {
              item_id,
              item_category,
            },
      ],
    }).catch(voidFn);
  },
  mapClick: (item_id: string, item_name: string, item_category: string) => {
    logEvent(analytics, "view_item", {
      items: [
        {
          item_id,
          item_name: item_name,
          item_category: item_category,
          item_category_2: "Map Marker",
        },
      ],
    }).catch(voidFn);
  },
  addRoom: (
    count: number,
    name: string,
    id: string,
    property: string,
    action: "I" | "D"
  ) => {
    logEvent(analytics, action === "I" ? "add_to_cart" : "remove_from_cart", {
      items: [
        {
          item_id: id,
          item_name: name,
          item_category: property,
          quantity: count,
        },
      ],
    }).catch(voidFn);
  },
  beginCheckout: (
    value: number,
    info: Record<
      number,
      {
        name: string;
        price: number;
        count: number;
      }
    >,
    property: string
  ) => {
    const items = Object.values(info).map((item) => ({
      price: item.price,
      quantity: item.count,
      item_name: item.name,
      item_category: property,
      item_category2: "Stay",
    }));
    logEvent(analytics, "begin_checkout", {
      value,
      currency: "INR",
      items,
      category: "Property",
    }).catch(voidFn);
  },
  tripBeginCheckout: (
    item_id: string,
    item_name: string,
    value: number,
    quantity: number
  ) => {
    logEvent(analytics, "begin_checkout", {
      value,
      currency: "INR",
      category: "Trip",
      items: [
        {
          item_id,
          item_name,
          quantity,
        },
      ],
    }).catch(voidFn);
  },
  search: (search_term: string) => {
    logEvent(analytics, "view_search_results", {
      search_term,
    }).catch(voidFn);
  },
  dateUpdate: (start_date: string, end_date: string) => {
    logEvent(analytics, "change_date", {
      start_date,
      end_date,
    }).catch(voidFn);
  },
  login: () => {
    logEvent(analytics, "login").catch(voidFn);
  },
  setUserId: (user_id: string) => {
    setUserId(analytics, user_id).catch(voidFn);
  },
  appOpen: () => {
    logEvent(analytics, "app_open").catch(voidFn);
  },
  purchase: (value: number, currency: string) => {
    logEvent(analytics, "purchase", {
      value,
      currency,
      transaction_id: "",
    }).catch(voidFn);
  },
  logScreen: (screen: string, route: Route) => {
    if (screenLogMap[screen] && route) {
      screenLogMap[screen](route);
    }
  },
};

export default Logger;

const screenLogMap: Record<string, (route: Route) => void> = {
  "(tabs)": (route: Route) => {
    const tab = route.state?.index === 1 ? "trips" : "explore";
    Logger.screen(tab, "Home");
  },
  "chat/all": (_: Route) => {
    Logger.screen("Chat List");
  },
  "zo-map/index": (_: Route) => {
    Logger.screen("Map");
  },
  "zo/list": (_: Route) => {
    Logger.screen("$Zo Coins");
  },
  profile: (_: Route) => {
    Logger.screen("Profile");
  },
  "trip/[id]/index": (route: Route) => {
    Logger.screen("Trip Details", `Trip Details_${route.params?.id ?? ""}`);
    if (route.params?.id) {
      Logger.viewItem(route.params.id, "Trip Details");
    }
  },
  "trip/[id]/select": (route: Route) => {
    Logger.screen(
      "Trip Select Batch",
      `Trip Select Batch_${route.params?.id ?? ""}`
    );
  },
  "trip/[id]/add-guests": (route: Route) => {
    Logger.screen(
      "Trip Add Guests",
      `Trip Add Guests_${route.params?.id ?? ""}`
    );
  },
  "trip/[id]/confirm": (route: Route) => {
    Logger.screen("Trip Confirm", `Trip Confirm_${route.params?.id ?? ""}`);
  },
  "property/[id]": (route: Route) => {
    Logger.screen("Property", `Property_${route.params?.id ?? ""}`);
    if (route.params?.id) {
      Logger.viewItem(route.params.id, "Property");
    }
  },
  "stay-confirm": (route: Route) => {
    Logger.screen(
      "Stay Confirm",
      `Stay Confirm_${route.params?.property_code ?? ""}`
    );
  },
  payment: (_: Route) => {
    Logger.screen("Stay Payment");
  },
  "booking/all": (_: Route) => {
    Logger.screen("Booking List");
  },
  "booking/[id]": (_: Route) => {
    Logger.screen("Stay Booking");
  },
  "trip/booking/[id]/index": (_: Route) => {
    Logger.screen("Trip Booking");
  },
  onboarding: (_: Route) => {
    Logger.screen("Onboarding");
  },
  "checkin/[id]": (route: Route) => {
    Logger.screen("Checkin", `Checkin_${route.params?.id ?? ""}`);
  },
  "review/new": (route: Route) => {
    Logger.screen("Review", `Review_${route.params?.booking_code ?? ""}`);
  },
  "gallery/index": (route: Route) => {
    Logger.screen("Gallery", `Gallery_${route.params?.code ?? ""}`);
  },
};
