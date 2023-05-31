// TODO make to an abstract type?
export type ApiResponse<T = null> = {
  responseCode: ResponseCode,
  title: string,
  detail: string,
  error?: Error|string,
  data?: T,
};
