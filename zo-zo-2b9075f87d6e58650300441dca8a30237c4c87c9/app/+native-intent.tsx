import { webLinkToHref } from "@/utils/deep-linking";
import navData from "@/utils/global";

/**
 * Every deep-link passes through this function, it can be used to mutate the path.
 */
export function redirectSystemPath({
  path,
  initial,
}: {
  path: string;
  initial: boolean;
}) {
  navData.value = path;
  if (!navData.canNavigateToDeepLink) {
    return "zostel:///";
  }
  navData.value = "";
  if (path.startsWith("http")) {
    return webLinkToHref(path).then(({ type, path }) => {
      if (type === "webview") {
        const route = `zostel://web-view?url=${path}`;
        return route;
      } else {
        return path;
      }
    });
  }
  return path;
}
