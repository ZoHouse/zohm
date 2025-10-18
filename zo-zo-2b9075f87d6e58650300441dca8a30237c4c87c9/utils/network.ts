import * as Sentry from '@sentry/react-native';

const logError = (error: any, report: boolean | undefined = false) => {
  if (error?.response) {
    const stringified = `[N/W ERROR - ${error.response.status}] ${
      error.config.method
    } ${error.request.responseURL}\n${JSON.stringify(
      {
        response: error.response.status < 500 ? error.response.data : null,
        request: {
          headers: error.config.headers,
          body:
            typeof error.config.data === "object"
              ? JSON.parse(error.config.data)
              : error.config.data,
        },
      },
      null,
      2
    )}`;
    console.log("\x1b[31m%s\x1b[0m", stringified);
    if (report) {
      Sentry.captureException(new Error(stringified));
    }
  }
};

export const logAxiosError = (error: any) => {
  logError(error);
}

export const reportError = (error: any) => {
  logError(error, true);
}