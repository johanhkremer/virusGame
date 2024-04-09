import { socket } from "./main";

let player1Timer: HTMLElement = document.getElementById("player1Timer")!;
let player1ElapsedTime: HTMLElement =
  document.getElementById("player1ElapsedTime")!;

let player1StartTime: number;
let player1Interval: number;
let player1TotalElapsedTime: number = 0;

// Handel when player clicks on virus or when time runs out

function handleVirusClick() {
  const timestamp = Date.now();

  const elapsedTime1 = player1StartTime
    ? Date.now() - player1StartTime + player1TotalElapsedTime
    : 0;

  resetTimers();

  const virusElement = document.getElementById("virus") as HTMLImageElement;
  // Change the imgage source
  virusElement.src = "/img/brainfart-smashed.png";

  //Make the image visivle
  virusElement.style.display = "block";

  //Remove the click event listener temporarily
  virusElement.removeEventListener("click", clickHandler);

  if (!socket.id) {
    return;
  }

  // Send (emit) the message to the server
  socket.emit("sendReactionTime", elapsedTime1, socket.id, timestamp);

  console.log("Emitted 'elapsedtime' event to server", elapsedTime1);
  console.log("Socket ID is:", socket.id);
  console.log("Elapsed time for Player 1:", elapsedTime1);
}

// Click event handler
function clickHandler() {
  handleVirusClick();
}

export function startTimer(player: string) {
  // Reset the start time and total elapsed time to 0
  player1StartTime = 0;
  player1TotalElapsedTime = 0;

  const startTime = Date.now();
  if (player === "player1") {
    player1StartTime = startTime;
    player1Interval = setInterval(updatePlayer1Timer, 10);
  }

  const virusElement = document.getElementById("virus") as HTMLImageElement;

  if (virusElement) {
    // Add click event listener
    virusElement.addEventListener("click", clickHandler);
  }
}

function updatePlayer1Timer() {
  if (player1StartTime && player1Timer) {
    let elapsedTime = Date.now() - player1StartTime + player1TotalElapsedTime;

    if (elapsedTime >= 30000) {
      player1StartTime = Date.now();
      player1TotalElapsedTime = 30000;
      elapsedTime = 30000;

      const formattedTime = formatTime(elapsedTime);
      player1Timer.innerText = formattedTime;

      handleVirusClick();
    } else {
      const formattedTime = formatTime(elapsedTime);
      player1Timer.innerText = formattedTime;
    }
  }
}

export function formatTime(milliseconds: number): string {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const seconds = totalSeconds % 60;
  const millisecondsString = (milliseconds % 1000).toString().padStart(3, "0");
  return `${seconds.toString().padStart(2, "0")}.${millisecondsString}`;
}

function resetTimers() {
  if (player1Interval) {
    clearInterval(player1Interval);
  }

  if (player1StartTime) {
    player1TotalElapsedTime += Date.now() - player1StartTime;
  }

  player1StartTime = player1TotalElapsedTime;

  // Update the displayed elapsed time
  if (player1ElapsedTime) {
    player1ElapsedTime.innerText = formatTime(player1TotalElapsedTime);
  }
}
