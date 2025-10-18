import { TripSearchItem } from "@/definitions/trip";
import {
  DiscoverSearchItem,
  OperatingModel,
  Operator,
  OperatorTypes,
  ReverseOperatorType,
  ReverseOperatorTypeMap,
} from "@/definitions/discover";

export const getURLType: (
  typeCode: OperatorTypes,
  operatingModel: OperatingModel
) => ReverseOperatorType[OperatorTypes] = (typeCode, operatingModel) => {
  if (operatingModel === "F") {
    return ReverseOperatorTypeMap[typeCode] || "zostel";
  } else {
    return "trusted-by-zostel";
  }
};

const ZO_HOUSE_TITLE = "Zo House";
const TRIP_TITLE = "Trips";

export const queryResultsToSections = (
  queryResults?: DiscoverSearchItem,
  tripResults?: TripSearchItem[]
) => {
  const result: (
    | string
    | {
        name: string;
        media: string;
        screen: string;
        id: string;
      }
  )[] = [];
  if (queryResults) {
    const { destinations, operators, experiences } = queryResults;
    const _queriedData = {
      destinations,
      zostel: [],
      "zostel-homes": [],
      "zostel-plus": [],
      "trusted-by-zostel": [],
      experiences,
    } as Record<string, any[]>;

    operators.forEach((o: Operator) => {
      if (o.type_code === "HO") return;
      const urlType = getURLType(o.type_code, o.operating_model);
      if (_queriedData[urlType]) {
        _queriedData[urlType].push({
          name: o.name,
          media: o.images?.[0]?.image,
          screen: "property",
          id: o.slug,
        });
      }
    });
    for (const urlType in _queriedData) {
      if (urlType === "destinations" && destinations.length) {
        result.push("Destinations");
        result.push(
          ...destinations.map((e) => ({
            name: e.name,
            media: e.images?.[0]?.image,
            screen: "destination",
            id: e.slug,
          }))
        );
        continue;
      }
      if (_queriedData[urlType]) {
        const elements = _queriedData[urlType] as {
          name: string;
          media: string;
          screen: string;
          id: string;
        }[];
        if (elements.length) {
          result.push(urlType.replace(/-/g, " "));
          result.push(
            ...elements.map((e) => ({
              name: e.name,
              media: e.media,
              screen: "property",
              id: e.id,
            }))
          );
        }
      }
    }

    const zoHouses = operators.filter((e: Operator) => e.type_code === "HO");
    if (zoHouses.length) {
      result.unshift(
        ...zoHouses.map((e) => ({
          name: e.name,
          media: e.images?.[0]?.image,
          screen: "property",
          id: e.code,
        }))
      );
      result.unshift(ZO_HOUSE_TITLE);
    }
  }
  if (tripResults?.length) {
    result.push(TRIP_TITLE);
    result.push(
      ...tripResults.map((e) => ({
        name: e.name,
        media: e.media?.[0]?.url,
        screen: "trip",
        id: e.pid,
      }))
    );
  }

  return result;
};
