import { MediaType } from "../../../enums/mediaType.enum";

export interface SaveProgressReq
{
    Id: string;
    Type: MediaType;
    Duration: number;
    ProgressSecond: number;
}
