import { useMemo } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import ZoImage from "./ZoImage";

type CollageImage = {
  id: string;
  title?: string;
  image: string;
  description?: string;
  alt_text?: string;
};

interface CollageProps {
  images: CollageImage[];
  onClick?: (image: CollageImage, index: number) => void;
  gap?: number;
  fillType?: "vertical" | "horizontal";
}

const CollageView = ({
  images,
  onClick,
  gap = 4,
  fillType = "horizontal",
}: CollageProps) => {
  const imagesArray = useMemo(() => {
    const imagesProp = [...images];
    if (imagesProp.length === 1) return [imagesProp];
    const suffix = imagesProp.splice(Math.floor(imagesProp.length / 2));
    return [imagesProp, suffix];
  }, [images]);

  return (
    <View
      style={[
        styles.container,
        { gap, flexDirection: fillType === "vertical" ? "row" : "column" },
      ]}
    >
      {imagesArray.map((list, listIndex) => (
        <View
          key={listIndex}
          style={[
            styles.stretch,
            { gap, flexDirection: fillType === "vertical" ? "column" : "row" },
          ]}
        >
          {list.map((image, imageIndex) => (
            <TouchableOpacity
              style={styles.stretch}
              disabled={!Boolean(onClick)}
              activeOpacity={0.5}
              key={imageIndex}
              onPress={
                !onClick
                  ? undefined
                  : () =>
                      onClick(
                        image,
                        listIndex === 0
                          ? imageIndex
                          : imagesArray[0].length + imageIndex
                      )
              }
            >
              <View style={styles.stretch}>
                <ZoImage url={image.image} width="s" />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignSelf: "stretch",
    borderRadius: 16,
    borderCurve: "continuous",
    overflow: "hidden",
  },
  stretch: { flex: 1, alignSelf: "stretch" },
});

export default CollageView;
