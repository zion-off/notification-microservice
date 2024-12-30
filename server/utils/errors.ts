export class ServerError extends Error {
  status: number;
  details?: any;

  constructor(message: string, details?: any) {
    super(message);
    this.details = details;
  }
}

export class ClientError extends Error {
  status: number;
  details?: any;

  constructor(message: string, details?: any) {
    super(message);
    this.details = details;
  }
}
