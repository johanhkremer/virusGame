export {};

export interface Room {
  id: string;
  timestamp: number;
}

export interface Player {
  id: string;
  username: string;
  roomId: string | null;
  highscore: number;
  reactionTimes: number[] | undefined;
  points: number;
}

export interface UserResult {
  id: string;
  gameId: string;
  username: string;
  points: number;
}
