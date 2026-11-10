import * as signalR from "@microsoft/signalr";
import { computed, inject, Injectable, signal, WritableSignal } from "@angular/core";
import { Subject } from "rxjs";
import { WatchPartyRoom } from "../../interfaces/watchParty/watchPartyRoom.interface";
import { AuthService } from "../../auth/auth.service";
import { environment } from "../../../../environments/environment";
import { WatchPartyParticipant } from "../../interfaces/watchParty/watchPartyParticipant.interface";
import { ReceiveSyncAction } from "../../interfaces/watchParty/receiveSyncAction.interface";
import { MediaType } from "../../enums/mediaType.enum";

@Injectable({ providedIn: "root" })
export class WatchPartyService {
  private hubConnection?: signalR.HubConnection;
  private auth = inject(AuthService);

  private syncActionSubject = new Subject<ReceiveSyncAction>();
  public syncAction$ = this.syncActionSubject.asObservable();

  public room: WritableSignal<WatchPartyRoom | null> = signal(null);
  public isConnected: WritableSignal<boolean> = signal(false);
  public error: WritableSignal<string | null> = signal(null);

  public currentParticipant = computed(() => {
    const myUser = this.auth.currentUser()?.username?.toLowerCase();
    const participants = this.room()?.participants ?? [];
    return participants.find((p) => p.username.toLowerCase() === myUser) ?? null;
  });

  public isHost = computed(() => this.currentParticipant()?.isHost ?? false);
  public canControl = computed(() => this.currentParticipant()?.canControl ?? false);

  public async connect(): Promise<void> {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) return;

    const hubUrl = environment.apiUrl.replace(/\/api\/?$/, "") + "/hubs/watch-party";

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => this.auth.currentUser()?.token ?? "",
      })
      .withAutomaticReconnect()
      .build();

    this.registerListeners();

    await this.hubConnection.start();
    this.isConnected.set(true);
  }

  public async disconnect(): Promise<void> {
    if (!this.hubConnection) return;

    await this.hubConnection.stop();
    this.isConnected.set(false);
    this.room.set(null);
  }

  public async createParty(mediaId: string, mediaType: MediaType): Promise<void> {
    await this.connect();
    await this.hubConnection?.invoke("CreateParty", mediaId, mediaType);
  }

  public async joinParty(roomCode: string): Promise<void> {
    await this.connect();
    await this.hubConnection?.invoke("JoinParty", roomCode);
  }

  public async sendSyncAction(action: string, currentTime: number, isPlaying: boolean): Promise<void> {
    const code = this.room()?.roomCode;
    if (!code || this.hubConnection?.state !== signalR.HubConnectionState.Connected) return;

    await this.hubConnection.invoke("SendSyncAction", code, action, currentTime, isPlaying);
  }

  public async leaveParty(): Promise<void> {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      await this.hubConnection.invoke("LeaveParty");
    }
    this.room.set(null);
  }

  public async toggleParticipantControl(targetUserId: string, allowControl: boolean): Promise<void> {
    const code = this.room()?.roomCode;
    if (!code || this.hubConnection?.state !== signalR.HubConnectionState.Connected) return;

    await this.hubConnection.invoke("ToggleParticipantControl", code, targetUserId, allowControl);
  }

  private registerListeners(): void {
    this.hubConnection?.on("PartyJoined", (room: WatchPartyRoom) => {
      this.room.set(room);
      this.error.set(null);
    });

    this.hubConnection?.on("PartyError", (message: string) => {
      this.error.set(message);
    });

    this.hubConnection?.on("ParticipantsUpdated", (participants: WatchPartyParticipant[]) => {
      this.room.update((current) => (current ? { ...current, participants } : null));
    });

    this.hubConnection?.on("ReceiveSyncAction", (payload: ReceiveSyncAction) => {
      this.syncActionSubject.next(payload);
    });

    this.hubConnection?.onclose(() => {
      this.isConnected.set(false);
      this.room.set(null);
    });
  }
}
