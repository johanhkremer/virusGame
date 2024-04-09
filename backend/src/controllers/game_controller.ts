import Debug from "debug";

const debug = Debug("backend:game_controller");

function fisherYatesShuffle<T>(array: T[]): T[] {
	for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[array[i], array[j]] = [array[j], array[i]];
	}
	return array;
}

//calculate virusposition
export const randomVirusPosition = () => {
	const shuffledIndexes = fisherYatesShuffle(Array.from({ length: 25 }, (_, index) => index));
	const virusPosition = shuffledIndexes[0]+1;
	return virusPosition;
};

//calculate delay between 1.5 and 10 seconds with fisherYatesShuffle
export const delay = () => {
	const delays = Array.from({ length: 8501 }, (_, index) => index + 1500);
	const shuffledDelays = fisherYatesShuffle(delays);
	return shuffledDelays[0];
};

//Game room name generator
export const generateRoomName = () => {
	const gameRoomNameArray = [
		"Virus Vault",
		"Microbe Maze",
		"Pathogen Chamber",
		"Contagion Corridor",
		"Viral Labryinth",
		"Germ Grotto",
		"Infection Arena",
		"Pathogen Pit",
		"Microscopic Mansion",
		"Virus Nexus",
		"Bacteria Bunker",
		"Parasite Palace",
		"Viral Vault",
		"Microbe Maze",
	];
	const gameRoom = fisherYatesShuffle(gameRoomNameArray);
	return `${gameRoom[0]}`;
};
