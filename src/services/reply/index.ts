export enum Status {
  Success,
  Problematic,
  Failed,
}

export interface Reply<T> {
  data: T;
  status: Status;
  message: string;
  warning?: string;
  tip?: string;
}
