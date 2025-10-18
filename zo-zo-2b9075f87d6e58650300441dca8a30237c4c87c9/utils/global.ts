const navData = {
  value: "zostel:///",
  canNavigateToDeepLink: false,
  notificationData: null,
} as {
  value: string;
  canNavigateToDeepLink: boolean;
  notificationData: {
    name: string;
    code: string;
  } | null;
};

export default navData;
