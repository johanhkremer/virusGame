import { PlayerId } from "@shared/types/Socket_types";
import prisma from "../prisma";

export const createGame = (timestamp: number) => {
	return prisma.gameRoom.create({
		data: {
			timestamp,
			usernames: [],
			score: [],
		},
		include: {
			users: true,
		},
	});
};

export const getGameRoom = (roomId: string) => {
	return prisma.gameRoom.findUnique({
		where: {
			id: roomId,
		},
		include: {
			users: true,
		},
	});
};

export const getLatestGames = () => {
	return prisma.gameRoom.findMany({
		where: {
			NOT: {
				usernames: {
					isEmpty: true,
				},
			},
		},
		take: 10,
		orderBy: {
			timestamp: "desc",
		},
		select: {
			usernames: true,
			score: true,
		},
	});
};

/**
 * Add player to game
 *
 * @param gameId The ID of the game room
 * @param userIds The players to add to room
 */
export const addPlayersToGameRoom = (gameId: string, userIds: PlayerId[]) => {
	return prisma.gameRoom.update({
		where: {
			id: gameId,
		},
		data: {
			users: {
				connect: userIds,
			},
		},
		include: {
			users: true,
		},
	});
};

export const addResultToGameRoom = async (
	gameId: string,
	username: string,
	points: number
) => {
	const gameRoom = await prisma.gameRoom.findUnique({
		where: {
			id: gameId,
		},
	});

	if (!gameRoom) {
		throw new Error("Game room not found");
	}

	const roomUsernames = gameRoom.usernames || [];
	const roomScore = gameRoom.score || [];

	const updatedUsernames = [...roomUsernames, username];
	const updatedScore = [...roomScore, points];

	const updatedResult = await prisma.gameRoom.update({
		where: {
			id: gameId,
		},
		data: {
			usernames: updatedUsernames,
			score: updatedScore,
		},
	});

	return updatedResult;
};

export const addGameRound = async (roomId: string) => {
	const gameRoom = await prisma.gameRoom.findUnique({
		where: {
			id: roomId,
		},
	});

	if (!gameRoom) {
		throw new Error("Game room not found");
	}

	// Increment the rounds field by 1
	return await prisma.gameRoom.update({
		where: {
			id: roomId,
		},
		data: {
			rounds: gameRoom.rounds + 1,
		},
	});
};

export const addRoundClick = async (roomId: string) => {
	const gameRoom = await prisma.gameRoom.findUnique({
		where: {
			id: roomId,
		},
	});

	if (!gameRoom) {
		throw new Error("Game room not found");
	}

	// Increment the rounds field by 1
	return await prisma.gameRoom.update({
		where: {
			id: roomId,
		},
		data: {
			clicks: gameRoom.clicks + 1,
		},
	});
};

export const resetClicks = (roomId: string) => {
	return prisma.gameRoom.update({
		where: {
			id: roomId,
		},
		data: {
			clicks: 0,
		},
	});
};

export const getClicks = (roomId: string) => {
	return prisma.gameRoom.findUnique({
		where: {
			id: roomId,
		},
		select: {
			clicks: true,
		},
	});
};
