export const BOARD_SIZE = 16;
export const INITIAL_DIRECTION = "right";

const DIRECTION_VECTORS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const OPPOSITE_DIRECTIONS = {
  up: "down",
  down: "up",
  left: "right",
  right: "left",
};

export function createInitialState(random = Math.random) {
  const snake = [
    { x: 2, y: 8 },
    { x: 1, y: 8 },
    { x: 0, y: 8 },
  ];

  return {
    boardSize: BOARD_SIZE,
    snake,
    direction: INITIAL_DIRECTION,
    nextDirection: INITIAL_DIRECTION,
    food: placeFood(snake, BOARD_SIZE, random),
    score: 0,
    isGameOver: false,
    isPaused: true,
    hasStarted: false,
  };
}

export function setDirection(state, requestedDirection) {
  if (!DIRECTION_VECTORS[requestedDirection] || state.isGameOver) {
    return state;
  }

  const blockedDirection = OPPOSITE_DIRECTIONS[state.direction];
  if (requestedDirection === blockedDirection && state.snake.length > 1) {
    return state;
  }

  return {
    ...state,
    nextDirection: requestedDirection,
  };
}

export function togglePause(state) {
  if (!state.hasStarted || state.isGameOver) {
    return state;
  }

  return {
    ...state,
    isPaused: !state.isPaused,
  };
}

export function startGame(state) {
  if (state.isGameOver) {
    return state;
  }

  return {
    ...state,
    hasStarted: true,
    isPaused: false,
  };
}

export function restartGame(random = Math.random) {
  return createInitialState(random);
}

export function tick(state, random = Math.random) {
  if (!state.hasStarted || state.isPaused || state.isGameOver) {
    return state;
  }

  const direction = state.nextDirection;
  const head = state.snake[0];
  const vector = DIRECTION_VECTORS[direction];
  const nextHead = {
    x: head.x + vector.x,
    y: head.y + vector.y,
  };

  const hitsWall =
    nextHead.x < 0 ||
    nextHead.x >= state.boardSize ||
    nextHead.y < 0 ||
    nextHead.y >= state.boardSize;

  if (hitsWall) {
    return {
      ...state,
      direction,
      isGameOver: true,
      isPaused: true,
    };
  }

  const ateFood =
    state.food !== null &&
    nextHead.x === state.food.x &&
    nextHead.y === state.food.y;
  const candidateSnake = [nextHead, ...state.snake];
  const trimmedSnake = ateFood ? candidateSnake : candidateSnake.slice(0, -1);

  if (hasSelfCollision(trimmedSnake)) {
    return {
      ...state,
      direction,
      isGameOver: true,
      isPaused: true,
      snake: trimmedSnake,
    };
  }

  return {
    ...state,
    snake: trimmedSnake,
    direction,
    nextDirection: direction,
    food: ateFood ? placeFood(trimmedSnake, state.boardSize, random) : state.food,
    score: ateFood ? state.score + 1 : state.score,
  };
}

export function placeFood(snake, boardSize, random = Math.random) {
  const occupied = new Set(snake.map((segment) => `${segment.x},${segment.y}`));
  const availableCells = [];

  for (let y = 0; y < boardSize; y += 1) {
    for (let x = 0; x < boardSize; x += 1) {
      const key = `${x},${y}`;
      if (!occupied.has(key)) {
        availableCells.push({ x, y });
      }
    }
  }

  if (availableCells.length === 0) {
    return null;
  }

  const index = Math.floor(random() * availableCells.length);
  return availableCells[index];
}

export function hasSelfCollision(snake) {
  const [head, ...body] = snake;
  return body.some((segment) => segment.x === head.x && segment.y === head.y);
}
