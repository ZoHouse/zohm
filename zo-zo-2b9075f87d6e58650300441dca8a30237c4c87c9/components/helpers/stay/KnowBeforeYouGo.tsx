import { StyleSheet, View } from "react-native";
import { Operator } from "@/definitions/discover";
import { memo, useMemo } from "react";
import { groupList } from "@/utils/object";
import Tag from "@/components/helpers/stay/Tag";
import AdultIcon from "@/components/helpers/stay/AdultIcon";

const KnowBeforeYouGo = memo(
  ({
    show,
    age,
    items,
    max,
  }: {
    show: boolean;
    age: number;
    items: (Operator["tags"][number] & { icon?: React.JSX.Element })[];
    max?: number;
  }) => {
    const allItems = useMemo(() => {
      const tagsToShow = [...items];
      if (show) {
        tagsToShow.push({
          slug: "guests-age",
          title: "Guests",
          subtitle: `${age}+ only`,
          emoji: "🔞",
          icon: <AdultIcon age={age} />,
        });
        tagsToShow.push({
          slug: "no-kids",
          title: "Kids/Infants",
          subtitle: "Not allowed",
          emoji: "🧒",
        });
      }
      if (max) {
        tagsToShow.push({
          slug: "max-occupancy",
          title: "Guests in group",
          subtitle: `Max ${max} per group`,
          emoji: max > 1 ? "👥" : "👤",
        });
      }
      return tagsToShow;
    }, [show, age, items, max]);

    const groupedItems = groupList(allItems, 2, "-" as const);

    return (
      <View style={{ gap: 24 }}>
        {groupedItems.map((items, index) => (
          <View key={index} style={styles.row}>
            {items.map((item, index) => (
              <View
                key={item === "-" ? `-${index}` : item.slug}
                style={{ flex: 1, justifyContent: "center" }}
              >
                {item === "-" ? <></> : <Tag key={item.slug} item={item} />}
              </View>
            ))}
          </View>
        ))}
      </View>
    );
  }
);

export default memo(KnowBeforeYouGo);

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 8,
  },
});
