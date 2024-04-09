import { PlayerJoinResponse } from "@shared/types/Socket_types";
import { socket } from "./main";

// Game divs
export const startSection = document.getElementById("start") as HTMLDivElement;
export const gameSection = document.getElementById(
  "game-section"
) as HTMLDivElement;

// Login elements
const joinForm = document.getElementById("username-form") as HTMLFormElement;
const usernameInput = document.getElementById("username") as HTMLInputElement;
const formSubmitButton = document.querySelector(
  "#username-form button"
) as HTMLButtonElement;
const waitingMessage = document.getElementById(
  "waiting-message"
) as HTMLDivElement;

let username: string | null = null;

// Functions
export const handlePlayerJoinRequestCallback = (
  response: PlayerJoinResponse
) => {
  // console.log(response.room.id);
  console.log("Join was successful?", response.success);

  if (!response.success) {
    alert("NO ACCESS 4 U");
    return;
  }
  console.log("New player joined:", response);

  if (response.room !== null) {
    console.log('Two players have joined, game is ready to start!');
  } else {
    waitingMessage.classList.remove("hide");
    console.log("Join successful. Waiting for another player to join!");
  }
};

// SOCKET HANDLERS

// Set username when form is submitted
joinForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const trimmedUsername = usernameInput.value.trim();

  if (!trimmedUsername) {
    return;
  }

  username = trimmedUsername;

  // let timestamp = Date.now();

  // emit and acknowledge "userJoinRequest"-event before showing chatView
  socket.emit("playerJoinRequest", username, handlePlayerJoinRequestCallback);
  formSubmitButton.disabled = true;

  console.log("Form submitted");
});
