import { io, Socket } from "socket.io-client";
import {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@shared/types/Socket_types";
import "./assets/scss/style.scss";
import "./lobby";
import "./assets/scss/style.scss";
import {
  gameSection,
  handlePlayerJoinRequestCallback,
  startSection,
} from "./lobby";
import { startTimer, formatTime } from "./game_page";

export const SOCKET_HOST = import.meta.env.VITE_SOCKET_HOST;

const myScoreSpan = document.getElementById("you") as HTMLSpanElement;
const opponentScoreSpan = document.getElementById(
  "opponent"
) as HTMLSpanElement;

const playAgainButton = document.getElementById(
  "playAgain"
) as HTMLButtonElement;

// Connect to Socket.IO Server
console.log("Connecting to Socket.IO Server at:", SOCKET_HOST);
export const socket: Socket<ServerToClientEvents, ClientToServerEvents> =
  io(SOCKET_HOST);

// Listen for when connection is established
socket.on("connect", () => {
  console.log("💥 Connected to the server", SOCKET_HOST);
  console.log("🔗 Socket ID:", socket.id);

  socket.emit("getHighscores");
});

// Listen for when server got tired of us
socket.on("disconnect", () => {
  console.log("💀 Disconnected from the server:", SOCKET_HOST);

});

// Listen for when we're reconnected (either due to our or the servers connection)
socket.io.on("reconnect", () => {
  console.log("🍽️ Reconnected to the server:", SOCKET_HOST);
  console.log("🔗 Socket ID:", socket.id);
});

socket.on("sendHighscores", (highscores, games) => {
  console.log(highscores);
  console.log(games);

  const highscoreList = document.getElementById(
    "highscore"
  ) as HTMLOListElement;
  const highscoreEndPageList = document.getElementById(
    "highscoreEndPage"
  ) as HTMLOListElement;

  const latestGamesList = document.getElementById(
    "latestGame"
  ) as HTMLUListElement;

  highscoreList.innerHTML = "";
  highscoreEndPageList.innerHTML = "";
  latestGamesList.innerHTML = "";

  games.forEach((game) => {
    const li = document.createElement("li");
    li.innerHTML = `<div class="listStyleLG">
    <h6>${game.usernames[0]}</h6>
    <h6>${game.score[0]}p</h6>
    <span> - </span>
    <h6>${game.score[1]}p</h6>
    <h6>${game.usernames[1]}</h6>
 
  </div>`;

    latestGamesList.appendChild(li);
  });

  if (highscores && Array.isArray(highscores)) {
    highscores.forEach((score) => {
      const li = document.createElement("li");
      li.textContent = ` ${score.username}: ${score.highscore}`;
      highscoreList.appendChild(li);

      const liClone = li.cloneNode(true) as HTMLLIElement;
      highscoreEndPageList.appendChild(liClone);
    });
  } else {
    console.error("Highscores data is invalid");
  }
});

socket.on("roomName", (generateRoomName) => {
  console.log("Room name is:", generateRoomName);
  const roomName = document.getElementById("room-name") as HTMLHeadingElement;

  roomName.innerText = generateRoomName;
});

//Listens for virus positon and delay and renders virus
socket.on("startGameRound", (virusPosition, virusDelay) => {
  if (gameSection.classList.contains("hide")) {
    startSection.classList.add("hide");
    gameSection.classList.remove("hide");

    const endgameElement = document.getElementById("endgame");
    if (endgameElement) {
      endgameElement.classList.add("hide");
    }
  }

  const gridItem = document.querySelector(
    `.grid-item:nth-child(${virusPosition})`
  ) as HTMLDivElement;

  setTimeout(() => {
    gridItem.innerHTML =
      '<img id="virus" class="img-fluid" src="/img/brainfart.png" alt="Virus">';
    startTimer("player1");
  }, virusDelay);

  console.log("⏰ Delay is:", virusDelay);
});

// Listen for the reactiontime event from the server
socket.on("reactionTimeBE", (reactionTime) => {
  // Handle the reactiontime event
  console.log("Received reaction time for other player:", reactionTime);

  const player2TimerDiv = document.getElementById("player-2") as HTMLDivElement;
  player2TimerDiv.classList.remove("hide");

  const player2TimerElement = document.getElementById("player2Timer")!;
  player2TimerElement.innerText = formatTime(reactionTime);
});

socket.on("endOfRound", (response) => {
  const myScoreSpan = document.getElementById("you") as HTMLSpanElement;
  const opponentScoreSpan = document.getElementById(
    "opponent"
  ) as HTMLSpanElement;
  const finalScoreMe = document.getElementById(
    "finalScoreMe"
  ) as HTMLSpanElement;
  const finalScoreYou = document.getElementById(
    "finalScoreYou"
  ) as HTMLSpanElement;

  if (!response || !response.roomId) {
    console.error("No winner or room ID found");
    return;
  }

  if (response.winner === null) {
  } else if (response.winner && response.winner.id === socket.id) {
    console.log(response.winner);
    console.log("You won! Your points:", response.winner.points);
    myScoreSpan.innerText = `${response.winner.points}`;
    finalScoreMe.innerText = `${response.winner.points}`;
  } else {
    console.log(response.winner);
    console.log("You lost! Oppoinent's points:", response.winner.points);
    opponentScoreSpan.innerText = `${response.winner.points}`;
    finalScoreYou.innerText = `${response.winner.points}`;
  }

  const allGridItems = document.querySelectorAll(".grid-item");

  allGridItems.forEach((item) => {
    item.innerHTML = "";
  });

});

socket.on("gameFinished", (result) => {
  playAgainButton.disabled = false;
  // Empty game board, score board and reset timers

  const winnerMessage = document.getElementById(
    "winner-message"
  ) as HTMLHeadingElement;

  if (result === "draw") {
    winnerMessage.innerText = `It was a draw!`;
  } else {
    winnerMessage.innerText = `${result} won!`;
  }

  document.getElementById("endgame")?.classList.remove("hide");
  document.getElementById("game-section")?.classList.add("hide");

  socket.emit("getHighscores");
});

playAgainButton.addEventListener("click", () => {
  playAgainButton.disabled = true;

  socket.emit("playerJoinRequest", null, handlePlayerJoinRequestCallback);

  myScoreSpan.innerText = `0`;
  opponentScoreSpan.innerText = `0`;
});
