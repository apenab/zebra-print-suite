export type UrlOptions = {
  protocol: "http" | "https";
  host: string;
  port: number;
};

export const EndpointsMap = {
  local: "/available",
  defaultDevice: "/default",
  applicationConfiguration: "/config",
  write: "/write",
  read: "/read",
};

export function getEndpointUrl(
  options: { endpoint: keyof typeof EndpointsMap } & UrlOptions
): string {
  return `${options.protocol}://${options.host}:9102${
    EndpointsMap[options.endpoint]
  }`;
}
