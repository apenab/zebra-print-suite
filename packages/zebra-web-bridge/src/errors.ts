export enum ZebraErrorCode {
  SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",
  VALIDATION_ERROR = "VALIDATION_ERROR",
}

export class ZebraError extends Error {
  readonly code: ZebraErrorCode;

  constructor(code: ZebraErrorCode, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "ZebraError";
    this.code = code;
  }
}
