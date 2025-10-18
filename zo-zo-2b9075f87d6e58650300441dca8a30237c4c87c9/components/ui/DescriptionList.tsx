import { StyleSheet, View } from "react-native";
import React from "react";
import { DetailRowProps } from "./DetailRow";
import helpers from "@/utils/styles/helpers";
import SectionTitle from "./SectionTitle";
import Text from "./Text";
import DetailList from "./DetailList";
import Divider from "./Divider";

interface DescriptionListProps {
  list: {
    title?: string;
    value?: React.JSX.Element | string | (DetailRowProps & { id: string })[];
  }[];
}

const DescriptionList: React.FC<DescriptionListProps> = ({
  list,
}: DescriptionListProps) => {
  return (
    <View style={helpers.flex}>
      {list.map((element, index) => (
        <View key={index}>
          <View>
            {element.title && (
              <SectionTitle noHorizontalPadding style={styles.marginBottom}>
                {element.title}
              </SectionTitle>
            )}
            {typeof element.value === "string" ? (
              <Text style={styles.marginTop}>{`${element.value}`}</Text>
            ) : Array.isArray(element.value) ? (
              <DetailList
                data={element.value}
                style={{
                  marginTop: element.title ? 0 : 12,
                  gap: 16,
                }}
                alignToTop
              />
            ) : (
              <View style={styles.marginTop}>{element.value}</View>
            )}
          </View>
          {index !== list.length - 1 && (
            <Divider marginTop={24} marginBottom={8} />
          )}
        </View>
      ))}
    </View>
  );
};

export default DescriptionList;

const styles = StyleSheet.create({
  marginTop: { marginTop: 16 },
  marginBottom: { marginBottom: 8 },
});
