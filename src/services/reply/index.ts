export enum Status {
  // eslint-disable-next-line no-unused-vars
  Success,
  // eslint-disable-next-line no-unused-vars
  Problematic,
  // eslint-disable-next-line no-unused-vars
  Failed,
}

export interface Reply<T> {
  data: T;
  status: Status;
  message: string;
  warning?: string;
  tip?: string;
}
