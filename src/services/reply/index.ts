export enum Status {
  Success,
  Failed,
}

export interface Reply<T> {
  data: T;
  status: Status;
  message: string;
}
