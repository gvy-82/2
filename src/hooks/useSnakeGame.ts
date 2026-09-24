import { useState, useEffect, useCallback, useRef } from 'react';

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
export type Position = { x: number; y: number };
export type Difficulty = 'easy' | 'medium' | 'hard';
export type GameState = 'idle' | 'playing' | 'paused' | 'gameover';

const GRID_SIZE = 20;
const SPEED_MAP: Record<Difficulty, number> = {
  easy: 150,
  medium: 100,
  hard: 60,
};

function getRandomPosition(snake: Position[]): Position {
  let pos: Position;
  do {
    pos = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
  } while (snake.some(seg => seg.x === pos.x && seg.y === pos.y));
  return pos;
}

function getInitialSnake(): Position[] {
  const mid = Math.floor(GRID_SIZE / 2);
  return [
    { x: mid, y: mid },
    { x: mid - 1, y: mid },
    { x: mid - 2, y: mid },
  ];
}

export function useSnakeGame() {
  const [snake, setSnake] = useState<Position[]>(getInitialSnake());
  const [food, setFood] = useState<Position>(() => getRandomPosition(getInitialSnake()));
  const [direction, setDirection] = useState<Direction>('RIGHT');
  const [gameState, setGameState] = useState<GameState>('idle');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('snake-high-score');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [scoreAnimation, setScoreAnimation] = useState(false);

  const directionRef = useRef<Direction>(direction);
  const gameStateRef = useRef<GameState>(gameState);
  const snakeRef = useRef<Position[]>(snake);
  const foodRef = useRef<Position>(food);
  const lastDirectionRef = useRef<Direction>(direction);

  useEffect(() => { directionRef.current = direction; }, [direction]);
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
  useEffect(() => { snakeRef.current = snake; }, [snake]);
  useEffect(() => { foodRef.current = food; }, [food]);

  const resetGame = useCallback(() => {
    const initialSnake = getInitialSnake();
    setSnake(initialSnake);
    setFood(getRandomPosition(initialSnake));
    setDirection('RIGHT');
    directionRef.current = 'RIGHT';
    lastDirectionRef.current = 'RIGHT';
    setScore(0);
    setGameState('idle');
  }, []);

  const startGame = useCallback(() => {
    if (gameState === 'gameover' || gameState === 'idle') {
      const initialSnake = getInitialSnake();
      setSnake(initialSnake);
      setFood(getRandomPosition(initialSnake));
      setDirection('RIGHT');
      directionRef.current = 'RIGHT';
      lastDirectionRef.current = 'RIGHT';
      setScore(0);
    }
    setGameState('playing');
  }, [gameState]);

  const togglePause = useCallback(() => {
    if (gameState === 'playing') {
      setGameState('paused');
    } else if (gameState === 'paused') {
      setGameState('playing');
    }
  }, [gameState]);

  const changeDirection = useCallback((newDir: Direction) => {
    const opposites: Record<Direction, Direction> = {
      UP: 'DOWN',
      DOWN: 'UP',
      LEFT: 'RIGHT',
      RIGHT: 'LEFT',
    };
    const currentDir = lastDirectionRef.current;
    if (opposites[newDir] !== currentDir && newDir !== currentDir) {
      setDirection(newDir);
      directionRef.current = newDir;
    }
  }, []);

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const interval = setInterval(() => {
      const currentSnake = [...snakeRef.current];
      const head = { ...currentSnake[0] };
      const dir = directionRef.current;

      switch (dir) {
        case 'UP': head.y -= 1; break;
        case 'DOWN': head.y += 1; break;
        case 'LEFT': head.x -= 1; break;
        case 'RIGHT': head.x += 1; break;
      }

      // Check wall collision
      if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
        setGameState('gameover');
        setScore(prev => {
          const finalScore = prev;
          setHighScore(hs => {
            const newHigh = Math.max(hs, finalScore);
            localStorage.setItem('snake-high-score', String(newHigh));
            return newHigh;
          });
          return prev;
        });
        return;
      }

      // Check self collision
      if (currentSnake.some(seg => seg.x === head.x && seg.y === head.y)) {
        setGameState('gameover');
        setScore(prev => {
          const finalScore = prev;
          setHighScore(hs => {
            const newHigh = Math.max(hs, finalScore);
            localStorage.setItem('snake-high-score', String(newHigh));
            return newHigh;
          });
          return prev;
        });
        return;
      }

      lastDirectionRef.current = dir;

      const newSnake = [head, ...currentSnake];
      const currentFood = foodRef.current;

      // Check food
      if (head.x === currentFood.x && head.y === currentFood.y) {
        setScore(prev => prev + 10);
        setFood(getRandomPosition(newSnake));
        setScoreAnimation(true);
        setTimeout(() => setScoreAnimation(false), 300);
      } else {
        newSnake.pop();
      }

      setSnake(newSnake);
    }, SPEED_MAP[difficulty]);

    return () => clearInterval(interval);
  }, [gameState, difficulty]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameStateRef.current === 'idle' || gameStateRef.current === 'gameover') {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          startGame();
          return;
        }
      }

      if (e.key === ' ' || e.key === 'Escape') {
        e.preventDefault();
        togglePause();
        return;
      }

      if (gameStateRef.current !== 'playing') return;

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          changeDirection('UP');
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          changeDirection('DOWN');
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          changeDirection('LEFT');
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          changeDirection('RIGHT');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [changeDirection, startGame, togglePause]);

  return {
    snake,
    food,
    direction,
    gameState,
    score,
    highScore,
    difficulty,
    scoreAnimation,
    gridSize: GRID_SIZE,
    startGame,
    resetGame,
    togglePause,
    changeDirection,
    setDifficulty,
  };
}
