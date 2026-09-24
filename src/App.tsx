import { useRef, useCallback, useEffect, useState } from 'react';
import { useSnakeGame, Direction, Difficulty } from './hooks/useSnakeGame';

function App() {
  const {
    snake,
    food,
    gameState,
    score,
    highScore,
    difficulty,
    scoreAnimation,
    gridSize,
    startGame,
    resetGame,
    togglePause,
    changeDirection,
    setDifficulty,
  } = useSnakeGame();

  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const gameBoardRef = useRef<HTMLDivElement>(null);
  const [cellSize, setCellSize] = useState(20);

  // Responsive cell size
  useEffect(() => {
    const updateSize = () => {
      const maxWidth = Math.min(window.innerWidth - 32, 500);
      const maxHeight = window.innerHeight * 0.5;
      const size = Math.floor(Math.min(maxWidth, maxHeight) / gridSize);
      setCellSize(Math.max(size, 12));
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [gridSize]);

  // Touch controls
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    const minSwipe = 30;

    if (Math.abs(dx) < minSwipe && Math.abs(dy) < minSwipe) return;

    if (Math.abs(dx) > Math.abs(dy)) {
      changeDirection(dx > 0 ? 'RIGHT' : 'LEFT');
    } else {
      changeDirection(dy > 0 ? 'DOWN' : 'UP');
    }
    touchStartRef.current = null;
  }, [changeDirection]);

  const handleDirectionButton = useCallback((dir: Direction) => {
    if (gameState === 'playing') {
      changeDirection(dir);
    }
  }, [gameState, changeDirection]);

  const boardSize = cellSize * gridSize;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 flex flex-col items-center justify-center p-4 select-none overflow-hidden">
      {/* Header */}
      <div className="w-full max-w-lg mb-4">
        <h1 className="text-3xl md:text-4xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500 mb-4">
          🐍 Змейка
        </h1>

        {/* Score Panel */}
        <div className="flex justify-between items-center mb-3 px-2">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-xs text-gray-400 uppercase tracking-wide">Счёт</div>
              <div className={`text-2xl font-bold text-white transition-transform ${scoreAnimation ? 'scale-125 text-green-400' : ''}`}>
                {score}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-400 uppercase tracking-wide">Рекорд</div>
              <div className="text-2xl font-bold text-yellow-400">
                {highScore}
              </div>
            </div>
          </div>

          {/* Difficulty Selector */}
          <div className="flex gap-1">
            {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
              <button
                key={d}
                onClick={() => {
                  if (gameState === 'idle' || gameState === 'gameover') {
                    setDifficulty(d);
                  }
                }}
                disabled={gameState === 'playing' || gameState === 'paused'}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                  difficulty === d
                    ? d === 'easy'
                      ? 'bg-green-500/20 text-green-400 ring-1 ring-green-500/50'
                      : d === 'medium'
                      ? 'bg-yellow-500/20 text-yellow-400 ring-1 ring-yellow-500/50'
                      : 'bg-red-500/20 text-red-400 ring-1 ring-red-500/50'
                    : 'bg-gray-700/50 text-gray-400 hover:bg-gray-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {d === 'easy' ? 'Легко' : d === 'medium' ? 'Средне' : 'Сложно'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Game Board */}
      <div className="relative">
        <div
          ref={gameBoardRef}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="relative rounded-xl overflow-hidden shadow-2xl shadow-green-900/20 border border-gray-700/50"
          style={{
            width: boardSize,
            height: boardSize,
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          }}
        >
          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `
                linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)
              `,
              backgroundSize: `${cellSize}px ${cellSize}px`,
            }}
          />

          {/* Food */}
          <div
            className="absolute rounded-full transition-all duration-200 animate-pulse"
            style={{
              width: cellSize - 2,
              height: cellSize - 2,
              left: food.x * cellSize + 1,
              top: food.y * cellSize + 1,
              background: 'radial-gradient(circle, #ff6b6b 0%, #ee5a24 100%)',
              boxShadow: '0 0 10px rgba(255, 107, 107, 0.6), 0 0 20px rgba(255, 107, 107, 0.3)',
            }}
          />

          {/* Snake */}
          {snake.map((segment, index) => {
            const isHead = index === 0;
            const opacity = 1 - (index / snake.length) * 0.4;
            return (
              <div
                key={index}
                className="absolute transition-all duration-75"
                style={{
                  width: cellSize - 2,
                  height: cellSize - 2,
                  left: segment.x * cellSize + 1,
                  top: segment.y * cellSize + 1,
                  borderRadius: isHead ? '6px' : '4px',
                  background: isHead
                    ? 'linear-gradient(135deg, #00d2ff 0%, #3a7bd5 100%)'
                    : `rgba(52, 211, 153, ${opacity})`,
                  boxShadow: isHead
                    ? '0 0 8px rgba(0, 210, 255, 0.5)'
                    : 'none',
                  transform: isHead ? 'scale(1.05)' : 'scale(0.95)',
                }}
              >
                {/* Eyes on head */}
                {isHead && (
                  <div className="w-full h-full flex items-center justify-center gap-1">
                    <div className="w-1.5 h-1.5 bg-white rounded-full shadow-sm" />
                    <div className="w-1.5 h-1.5 bg-white rounded-full shadow-sm" />
                  </div>
                )}
              </div>
            );
          })}

          {/* Overlay for idle/paused/gameover */}
          {gameState !== 'playing' && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-10">
              {gameState === 'idle' && (
                <>
                  <div className="text-5xl mb-2">🐍</div>
                  <p className="text-gray-300 text-sm text-center px-4">
                    Управление: стрелки / WASD / свайпы
                  </p>
                  <button
                    onClick={startGame}
                    className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-green-500/30 hover:shadow-green-500/50 hover:scale-105 transition-all duration-200"
                  >
                    Начать игру
                  </button>
                  <p className="text-gray-500 text-xs">
                    или нажмите Пробел / Enter
                  </p>
                </>
              )}
              {gameState === 'paused' && (
                <>
                  <div className="text-4xl">⏸️</div>
                  <p className="text-white text-xl font-bold">Пауза</p>
                  <button
                    onClick={togglePause}
                    className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-xl shadow-lg hover:scale-105 transition-all duration-200"
                  >
                    Продолжить
                  </button>
                </>
              )}
              {gameState === 'gameover' && (
                <>
                  <div className="text-4xl">💀</div>
                  <p className="text-white text-xl font-bold">Игра окончена!</p>
                  <p className="text-gray-300 text-lg">
                    Счёт: <span className="text-green-400 font-bold">{score}</span>
                  </p>
                  {score >= highScore && score > 0 && (
                    <p className="text-yellow-400 text-sm font-semibold animate-bounce">
                      🏆 Новый рекорд!
                    </p>
                  )}
                  <div className="flex gap-3 mt-2">
                    <button
                      onClick={startGame}
                      className="px-6 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl shadow-lg hover:scale-105 transition-all duration-200"
                    >
                      Играть снова
                    </button>
                    <button
                      onClick={resetGame}
                      className="px-6 py-2.5 bg-gray-700 text-gray-300 font-bold rounded-xl hover:bg-gray-600 transition-all duration-200"
                    >
                      Меню
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="mt-4 flex flex-col items-center gap-3">
        {/* Action buttons */}
        <div className="flex gap-3">
          {gameState === 'playing' && (
            <button
              onClick={togglePause}
              className="px-4 py-2 bg-gray-700/80 text-gray-300 rounded-lg hover:bg-gray-600 transition-all text-sm font-medium"
            >
              ⏸ Пауза
            </button>
          )}
          {(gameState === 'playing' || gameState === 'paused') && (
            <button
              onClick={resetGame}
              className="px-4 py-2 bg-gray-700/80 text-gray-300 rounded-lg hover:bg-gray-600 transition-all text-sm font-medium"
            >
              🔄 Заново
            </button>
          )}
        </div>

        {/* D-Pad for mobile */}
        <div className="md:hidden grid grid-cols-3 gap-1 w-36 mt-2">
          <div />
          <button
            onTouchStart={(e) => { e.preventDefault(); handleDirectionButton('UP'); }}
            className="w-12 h-12 bg-gray-700/80 rounded-xl flex items-center justify-center text-white text-xl active:bg-gray-600 active:scale-95 transition-all shadow-lg"
          >
            ▲
          </button>
          <div />
          <button
            onTouchStart={(e) => { e.preventDefault(); handleDirectionButton('LEFT'); }}
            className="w-12 h-12 bg-gray-700/80 rounded-xl flex items-center justify-center text-white text-xl active:bg-gray-600 active:scale-95 transition-all shadow-lg"
          >
            ◀
          </button>
          <div className="w-12 h-12 bg-gray-800/50 rounded-xl flex items-center justify-center text-gray-600 text-xs">
            ●
          </div>
          <button
            onTouchStart={(e) => { e.preventDefault(); handleDirectionButton('RIGHT'); }}
            className="w-12 h-12 bg-gray-700/80 rounded-xl flex items-center justify-center text-white text-xl active:bg-gray-600 active:scale-95 transition-all shadow-lg"
          >
            ▶
          </button>
          <div />
          <button
            onTouchStart={(e) => { e.preventDefault(); handleDirectionButton('DOWN'); }}
            className="w-12 h-12 bg-gray-700/80 rounded-xl flex items-center justify-center text-white text-xl active:bg-gray-600 active:scale-95 transition-all shadow-lg"
          >
            ▼
          </button>
          <div />
        </div>
      </div>

      {/* Footer info */}
      <div className="mt-4 text-center text-gray-500 text-xs hidden md:block">
        <p>Стрелки / WASD — движение • Пробел — пауза</p>
      </div>
    </div>
  );
}

export default App;
