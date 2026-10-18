import { StatusType } from "../../enums/statusType.enum";

export interface AlertOptions {
  title: string;
  message: string;
  status?: StatusType;
  duration?: number;
}
