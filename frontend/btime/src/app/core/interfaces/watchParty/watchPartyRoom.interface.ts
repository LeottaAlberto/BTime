import { MediaType } from "../../enums/mediaType.enum";
import { WatchPartyParticipant } from "./watchPartyParticipant.interface";

export interface WatchPartyRoom {
  roomCode: string;
  mediaId: string;
  mediaType: MediaType;
  hostUserId: string;
  isPlaying: boolean;
  currentTimeSeconds: number;
  lastUpdatedUtc?: string;
  participants: WatchPartyParticipant[];
}
