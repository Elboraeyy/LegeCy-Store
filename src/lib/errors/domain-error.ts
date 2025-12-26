export abstract class DomainError extends Error {
  public readonly isOperational: boolean = true;
  
  constructor(
    public readonly message: string,
    public readonly code: string,
    public readonly httpStatus: number = 500,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}
