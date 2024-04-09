import { Room, Player } from "./Models";

export {};

// Events emitted by the server to the client
export interface ServerToClientEvents {
  playerOneReady: (username: string, room: RoomInfo) => void;
  startGameRound: (virusPosition: number, virusDelay: number) => void;
  gameRoomCreated: (room: RoomInfo) => void;
  roomName: (generateRoomName: string) => void;
  sendHighscores: (highscores: HighscoreInfo[], games: GameInfo[]) => void;
  reactionTimeBE: (reactionTime: number) => void;
  endOfRound: (response: EndOfRoundResponse) => void;
  gameFinished: (result: string | "draw") => void;
}

// Events emitted by the client to the server
export interface ClientToServerEvents {
  playerJoinRequest: (
    username: string | null,
    callback: (response: PlayerJoinResponse) => void
  ) => void;
  playerTwoReady: () => void;
  //prepareGameRound: (gridIndex: number[], roomId: string) => void;
  getHighscores: () => void;
  reactionTime: (reactionTime: number, socketId: string) => void;
  sendReactionTime: (
    reactionTime: number,
    socketId: string,
    timestamp: number
  ) => void;
}

export interface RoomInfo extends Room {
  users: Player[];
}

// User join response
export interface PlayerJoinResponse {
  success: boolean;
  room: RoomInfo | null;
}

export interface EndOfRoundResponse {
  winner: Player | null;
  roomId: string;
  player1Id?: string;
}

export interface HighscoreInfo {
  username: string;
  highscore: number;
}

export interface GameInfo {
  usernames: string[];
  score: number[];
}

export type PlayerId = Pick<Player, "id">;
