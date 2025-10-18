const isVideo = (uri: string) => {
  return uri.endsWith(".mp4") || uri.endsWith(".mov") || uri.endsWith(".avi");
};

const getStandardDimension = (number: number, sd?: boolean) => {
  const dimensions = [
    4096, 2560, 1920, 1280, 1080, 960, 768, 512, 320, 160, 80,
  ];
  const closest = dimensions.reduce((prev, curr) =>
    Math.abs(curr - number * (!sd ? 3 : 1.5)) <
    Math.abs(prev - number * (!sd ? 3 : 1.5))
      ? curr
      : prev
  );
  return closest;
};

export { getStandardDimension, isVideo };
