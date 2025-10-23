export type UrlOptions = {
  protocol: "http" | "https";
  host: string;
  port: number;
};

export const EndpointsMap = {
  local: "/available",
};

export function getEndpointUrl(
  options: { endpoint: keyof typeof EndpointsMap } & UrlOptions
): string {
  return `${options.protocol}://${options.host}:${options.port}${
    EndpointsMap[options.endpoint]
  }`;
}
