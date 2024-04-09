import prisma from "../prisma";
import { Player } from "@shared/types/Models";

export const createPlayer = (data: Player) => {
	return prisma.user.create({
		data,
	});
};

export const getPlayers = (roomId: string) => {
	return prisma.user.findMany({
		where: {
			roomId: roomId,
		},
	});
};

export const getPlayer = (socketId: string) => {
	return prisma.user.findUnique({
		where: {
			id: socketId,
		},
	});
};

export const getHighscores = () => {
	return prisma.user.findMany({
		where: {
			highscore: {
				not: 0,
			},
		},
		orderBy: {
			highscore: "asc",
		},
		select: {
			username: true,
			highscore: true,
		},
		take: 10,
	});
};

export const getLatestReactionTimes = async (roomId: string) => {
	const users = await prisma.user.findMany({
		where: {
			roomId: roomId,
		},
	});

	if (!users) {
		return;
	}

	const [player1, player2] = users;

	const player1ReactionTime =
		player1.reactionTimes[player1.reactionTimes.length - 1];
	const player2ReactionTime =
		player2.reactionTimes[player2.reactionTimes.length - 1];

	if (player1ReactionTime < player2ReactionTime) {
		return player1 as Player;
	} else if (player1ReactionTime > player2ReactionTime) {
		return player2 as Player;
	} else if (player1ReactionTime === player2ReactionTime) {
		return player1.id;
	}
};

export const addReactionTime = async (socketId: string, time: number) => {
	const player = await prisma.user.findUnique({
		where: {
			id: socketId,
		},
		select: {
			reactionTimes: true,
		},
	});

	if (!player) {
		throw new Error("User not found");
	}

	const reactionsArray = player.reactionTimes || [];

	const updatedReactionsArray = [...reactionsArray, time];

	const updatedUser = await prisma.user.update({
		where: {
			id: socketId,
		},
		data: {
			reactionTimes: updatedReactionsArray,
		},
	});

	return updatedUser;
};

export const calcPlayerHighscore = async (socketId: string) => {
	const player = await prisma.user.findUnique({
		where: {
			id: socketId,
		},
		select: {
			reactionTimes: true,
		},
	});

	if (!player || !player.reactionTimes) {
		throw new Error("User or reaction times not found");
	}

	const sumOfReactionTimes = player.reactionTimes.reduce(
		(acc, curr) => acc + curr,
		0
	);

	const highscore = sumOfReactionTimes / 10;

	return prisma.user.update({
		where: {
			id: socketId,
		},
		data: {
			highscore,
		},
	});
};

export const addPointToPlayer = async (socketId: string) => {
	const player = await prisma.user.findUnique({
		where: {
			id: socketId,
		},
	});

	if (!player) {
		throw new Error("Player not found");
	}

	// Increment the rounds field by 1
	return await prisma.user.update({
		where: {
			id: socketId,
		},
		data: {
			points: player.points + 1,
		},
	});
};

export const calcWinnerOfGame = async (roomId: string) => {
	const players = await prisma.user.findMany({
		where: {
			roomId: roomId,
		},
	});

	if (!players) {
		return;
	}

	const [player1, player2] = players;

	const player1Points = player1.points;
	const player2Points = player2.points;

	if (player1Points > player2Points) {
		return player1.username;
	} else if (player1Points < player2Points) {
		return player2.username;
	} else if (player1Points === player2Points) {
		return "draw";
	}
};

export const clearOldData = (socketId: string) => {
	return prisma.user.update({
		where: {
			id: socketId,
		},
		data: {
			roomId: null,
			reactionTimes: [],
			points: 0,
		},
	});
};
