import { StatusCodes } from "http-status-codes";

export interface Response<T> {
  data: T;
  status: StatusCodes;
  message: string;
}
