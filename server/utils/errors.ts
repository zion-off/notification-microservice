export class ServerError extends Error {
  status: number;
  details?: any;

  constructor(message: string, status: number = 500, details?: any) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export class ClientError extends Error {
  status: number;
  details?: any;

  constructor(message: string, status: number = 400, details?: any) {
    super(message);
    this.status = status;
    this.details = details;
  }
}
