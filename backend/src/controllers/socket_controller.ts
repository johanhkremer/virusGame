/**
 * Socket Controller
 */
import Debug from "debug";
import { Server, Socket } from "socket.io";
import {
	ClientToServerEvents,
	PlayerId,
	ServerToClientEvents,
} from "@shared/types/Socket_types";
import {
	getHighscores,
	addReactionTime,
	createPlayer,
	getPlayer,
	getLatestReactionTimes,
	calcPlayerHighscore,
	addPointToPlayer,
	calcWinnerOfGame,
	clearOldData,
} from "../services/Player_service";
import {
	addGameRound,
	addPlayersToGameRoom,
	addResultToGameRoom,
	addRoundClick,
	createGame,
	getClicks,
	getGameRoom,
	getLatestGames,
	resetClicks,
} from "../services/Room_service";
import {
	delay,
	generateRoomName,
	randomVirusPosition,
} from "./game_controller";
import { Player } from "@shared/types/Models";

// Create a new debug instance
const debug = Debug("backend:socket_controller");

let waitingRoom: PlayerId[] = [];

// Handle a user connecting
export const handleConnection = (
	socket: Socket<ClientToServerEvents, ServerToClientEvents>,
	io: Server<ClientToServerEvents, ServerToClientEvents>
) => {
	debug("🙋 A user connected", socket.id);

	socket.on("playerJoinRequest", async (username, callback) => {
		const timestamp = Date.now();
		debug(
			'Received "playerJoinRequest" event from client. Someone wants to PLAY!'
		);
		debug("People in waiting room:", waitingRoom.length);

		const existingPlayer = await getPlayer(socket.id);
		debug("Check if username has value:", username);

		if (waitingRoom.length === 0) {
			if (!existingPlayer && username) {
				debug("Value of username:", username);
				debug("Creating new player in db");
				// Create player in db
				const newPlayer = (await createPlayer({
					id: socket.id,
					username,
					roomId: null,
					highscore: 0,
					reactionTimes: [],
					points: 0,
				})) as Player;

				debug("New player added to DB:", newPlayer);
			} else if (existingPlayer && username === null) {
				debug("Value of username:", username);
				if (!existingPlayer || !existingPlayer.roomId) {
					throw new Error("No player or room exists");
				}

				socket.leave(existingPlayer.roomId);
				const refreshedPlayer = (await clearOldData(
					socket.id
				)) as Player;
				debug("Existing player with cleared data:", refreshedPlayer);
			}

			waitingRoom.push({
				id: socket.id,
			});

			const player = await getPlayer(socket.id);

			debug("Players in waiting room:", waitingRoom.length);
			debug("Player 1 waiting:", player?.username);

			callback({
				success: true,
				room: null,
			});

			debug("Players in queue:", waitingRoom.length);
		} else if (waitingRoom.length === 1) {
			debug("Value of username:", username);
			// Create player in db
			if (!existingPlayer && username) {
				// Create player in db
				const newPlayer = (await createPlayer({
					id: socket.id,
					username,
					roomId: null,
					highscore: 0,
					reactionTimes: [],
					points: 0,
				})) as Player;

				debug("New player added to DB:", newPlayer);
			} else if (existingPlayer && username === null) {
				if (!existingPlayer || !existingPlayer.roomId) {
					throw new Error("No player or room exists");
				}

				socket.leave(existingPlayer.roomId);
				const refreshedPlayer = (await clearOldData(
					socket.id
				)) as Player;
				debug("Existing player with cleared data:", refreshedPlayer);
			}

			waitingRoom.push({
				id: socket.id,
			});

			const player = await getPlayer(socket.id);

			debug("Players in waiting room:", waitingRoom.length);
			debug("Player 2 waiting:", player?.username);

			const newRoom = await createGame(timestamp);

			const room = await addPlayersToGameRoom(newRoom.id, waitingRoom);

			waitingRoom.forEach((player) => {
				const socket = io.sockets.sockets.get(player.id);
				if (socket) {
					socket.join(room.id);
					debug("Player:", socket.id);
				}
			});

			const roomCheck = io.sockets.adapter.rooms.get(room.id);

			debug("Sockets in room:", roomCheck);

			// if (roomCheck) {
			// 	for (const socketId of roomCheck) {
			// 		debug("Socket ID:", socketId);
			// 	}
			// } else {
			// 	debug("Room not found or no sockets connected to the room.");
			// }

			callback({
				success: true,
				room,
			});

			waitingRoom = [];
			debug("Players in queue:", waitingRoom.length);

			io.to(room.id).emit("roomName", generateRoomName());

			prepareGameRound(room.id);
		}
	});

	const prepareGameRound = async (roomId: string) => {
		debug(
			'Received "prepareGameRound" event from client. Ppl want to PLAY!'
		);

		const gameRoom = await getGameRoom(roomId);

		if (!gameRoom) {
			throw new Error("No game room found");
		}

		debug("Rounds played:", gameRoom.rounds);

		if (gameRoom.rounds === 10) {
			debug("GAME FINISHED BABY!");

			// const playerHighscore = await calcPlayerHighscore(socket.id);
			// debug(playerHighscore);

			// Calculate high scores for each player
			for (const player of gameRoom.users) {
				const playerHighscore = await calcPlayerHighscore(player.id);
				debug(playerHighscore);
			}

			const result = await calcWinnerOfGame(roomId);

			if (!result) {
				throw new Error("Could not get result");
			}

			//End game
			io.to(roomId).emit("gameFinished", result);

			for (const player of gameRoom.users) {
				await addResultToGameRoom(
					gameRoom.id,
					player.username,
					player.points
				);
			}

			debug("Result added to room");
		} else {
			await addGameRound(roomId);
			debug("Current round is:", gameRoom.rounds);

			let virusPosition = randomVirusPosition();
			let virusDelay = delay();

			//Sends virus position and virus delay to client
			io.to(roomId).emit("startGameRound", virusPosition, virusDelay);
			debug('Emitted "startGameRound" event to clients. Let them PLAY!');
		}
	};

	socket.on("sendReactionTime", async (reactionTime, socketId, timestamp) => {
		debug("Received sendReactionTime at:", timestamp);
		const player = await getPlayer(socketId);

		if (!player || !player.roomId) {
			throw new Error("No player or game room found");
		}

		// Do a broadcast to client 2 in frontend
		socket.broadcast.to(player.roomId).emit("reactionTimeBE", reactionTime);

		const gameRoom = await getGameRoom(player.roomId);

		if (!gameRoom) {
			throw new Error("No player or game room found");
		}

		await addRoundClick(gameRoom.id);
		await addReactionTime(socketId, reactionTime);

		const clicks = await getClicks(gameRoom.id);
		if (!clicks) {
			return;
		}

		const currentClicks = clicks.clicks;

		debug("clicks registerered:", currentClicks);

		if (currentClicks === 2) {
			debug("2 clicks have been registered");
			const fastestPlayer = await getLatestReactionTimes(player.roomId);

			if (typeof fastestPlayer === "string") {
				debug("It was a draw!");

				io.to(player.roomId).emit("endOfRound", {
					winner: null,
					roomId: gameRoom.id,
					player1Id: fastestPlayer,
				});

				prepareGameRound(gameRoom.id);
			} else {
				if (!fastestPlayer) {
					throw new Error("Could not find the fastest player");
				}
				const winner = await addPointToPlayer(fastestPlayer.id);

				debug("Winner of round:", winner);

				io.to(player.roomId).emit("endOfRound", {
					winner: winner,
					roomId: gameRoom.id,
				});
				prepareGameRound(gameRoom.id);
			}

			await resetClicks(gameRoom.id);
		}
	});

	socket.on("getHighscores", async () => {
		const highscores = await getHighscores();
		const games = await getLatestGames();

		debug("Highscores:", highscores);

		socket.emit("sendHighscores", highscores, games);
	});
};
