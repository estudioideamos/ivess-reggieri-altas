import {
  BOARD_SIZE,
  createInitialState,
  restartGame,
  setDirection,
  startGame,
  tick,
  togglePause,
} from "./snake-logic.js";

const boardElement = document.querySelector("#board");
const scoreElement = document.querySelector("#score");
const statusElement = document.querySelector("#status");
const startButton = document.querySelector("#start-button");
const pauseButton = document.querySelector("#pause-button");
const restartButton = document.querySelector("#restart-button");
const controlButtons = Array.from(document.querySelectorAll("[data-direction]"));

const TICK_MS = 140;
const directionKeys = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  w: "up",
  a: "left",
  s: "down",
  d: "right",
};

let state = createInitialState();

buildBoard();
render();
window.setInterval(() => {
  const nextState = tick(state);
  if (nextState !== state) {
    state = nextState;
    render();
  }
}, TICK_MS);

startButton.addEventListener("click", () => {
  state = startGame(state);
  render();
});

pauseButton.addEventListener("click", () => {
  state = togglePause(state);
  render();
});

restartButton.addEventListener("click", () => {
  state = restartGame();
  render();
});

controlButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const direction = button.dataset.direction;
    state = setDirection(state, direction);

    if (!state.hasStarted) {
      state = startGame(state);
    }

    render();
  });
});

window.addEventListener("keydown", (event) => {
  const direction = directionKeys[event.key];
  if (direction) {
    event.preventDefault();
    state = setDirection(state, direction);

    if (!state.hasStarted) {
      state = startGame(state);
    }

    render();
  }

  if (event.code === "Space") {
    event.preventDefault();

    if (!state.hasStarted) {
      state = startGame(state);
    } else {
      state = togglePause(state);
    }

    render();
  }

  if (event.key.toLowerCase() === "r") {
    state = restartGame();
    render();
  }
});

function buildBoard() {
  const fragment = document.createDocumentFragment();

  for (let index = 0; index < BOARD_SIZE * BOARD_SIZE; index += 1) {
    const cell = document.createElement("div");
    cell.className = "cell";
    cell.dataset.index = String(index);
    fragment.appendChild(cell);
  }

  boardElement.appendChild(fragment);
}

function render() {
  const snakeCells = new Set(state.snake.map((segment) => `${segment.x},${segment.y}`));
  const head = state.snake[0];

  Array.from(boardElement.children).forEach((cell, index) => {
    const x = index % BOARD_SIZE;
    const y = Math.floor(index / BOARD_SIZE);
    const isSnake = snakeCells.has(`${x},${y}`);
    const isHead = head.x === x && head.y === y;
    const isFood = state.food && state.food.x === x && state.food.y === y;

    cell.className = "cell";

    if (isSnake) {
      cell.classList.add("cell--snake");
    }

    if (isHead) {
      cell.classList.add("cell--head");
    }

    if (isFood) {
      cell.classList.add("cell--food");
    }
  });

  scoreElement.textContent = String(state.score);
  pauseButton.textContent = state.isPaused && state.hasStarted && !state.isGameOver ? "Resume" : "Pause";
  statusElement.textContent = getStatusText(state);
}

function getStatusText(currentState) {
  if (currentState.isGameOver) {
    return "Game over. Press Restart or R to play again.";
  }

  if (!currentState.hasStarted) {
    return "Press Start to play.";
  }

  if (currentState.isPaused) {
    return "Paused.";
  }

  return "Use arrow keys or WASD to steer.";
}
