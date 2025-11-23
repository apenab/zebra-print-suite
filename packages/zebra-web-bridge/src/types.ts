export type ZebraDevice = {
  name?: string;
  deviceType?: string;
  connection?: string;
  uid?: string;
  version?: number;
  provider?: string;
  manufacturer?: string;
};

export type SupportedConversionMap = Record<string, string[]>;

export type ApplicationInfo = {
  version?: string;
  buildNumber?: number;
  apiLevel?: number;
  platform?: string;
  supportedConversions: SupportedConversionMap;
};

export type ApplicationConfiguration = {
  application: ApplicationInfo | null;
};
