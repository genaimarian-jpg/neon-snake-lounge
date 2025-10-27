import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Play, RotateCcw, Pause } from "lucide-react";
import { toast } from "sonner";

type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";
type Position = { x: number; y: number };

const GRID_SIZE = 20;
const CELL_SIZE = 20;
const INITIAL_SNAKE: Position[] = [
  { x: 10, y: 10 },
  { x: 9, y: 10 },
  { x: 8, y: 10 },
];
const INITIAL_DIRECTION: Direction = "RIGHT";
const GAME_SPEED = 100;

const Index = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [snake, setSnake] = useState<Position[]>(INITIAL_SNAKE);
  const [direction, setDirection] = useState<Direction>(INITIAL_DIRECTION);
  const [food, setFood] = useState<Position>({ x: 15, y: 15 });
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [showScorePop, setShowScorePop] = useState(false);

  // Load high score from localStorage
  useEffect(() => {
    const savedHighScore = localStorage.getItem("snakeHighScore");
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore));
    }
  }, []);

  // Generate random food position
  const generateFood = useCallback((currentSnake: Position[]): Position => {
    let newFood: Position;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
    } while (
      currentSnake.some((segment) => segment.x === newFood.x && segment.y === newFood.y)
    );
    return newFood;
  }, []);

  // Handle keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isPlaying || isPaused) {
        if (e.key === " ") {
          e.preventDefault();
          if (!isPlaying) {
            startGame();
          } else {
            setIsPaused(!isPaused);
          }
        }
        return;
      }

      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          if (direction !== "DOWN") setDirection("UP");
          break;
        case "ArrowDown":
          e.preventDefault();
          if (direction !== "UP") setDirection("DOWN");
          break;
        case "ArrowLeft":
          e.preventDefault();
          if (direction !== "RIGHT") setDirection("LEFT");
          break;
        case "ArrowRight":
          e.preventDefault();
          if (direction !== "LEFT") setDirection("RIGHT");
          break;
        case " ":
          e.preventDefault();
          setIsPaused(!isPaused);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [direction, isPlaying, isPaused]);

  // Game loop
  useEffect(() => {
    if (!isPlaying || isGameOver || isPaused) return;

    const gameInterval = setInterval(() => {
      setSnake((prevSnake) => {
        const newSnake = [...prevSnake];
        const head = { ...newSnake[0] };

        // Move head
        switch (direction) {
          case "UP":
            head.y -= 1;
            break;
          case "DOWN":
            head.y += 1;
            break;
          case "LEFT":
            head.x -= 1;
            break;
          case "RIGHT":
            head.x += 1;
            break;
        }

        // Check wall collision
        if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
          setIsGameOver(true);
          setIsPlaying(false);
          toast.error("Game Over! You hit the wall!");
          return prevSnake;
        }

        // Check self collision
        if (newSnake.some((segment) => segment.x === head.x && segment.y === head.y)) {
          setIsGameOver(true);
          setIsPlaying(false);
          toast.error("Game Over! You hit yourself!");
          return prevSnake;
        }

        newSnake.unshift(head);

        // Check food collision
        if (head.x === food.x && head.y === food.y) {
          const newScore = score + 1;
          setScore(newScore);
          setShowScorePop(true);
          setTimeout(() => setShowScorePop(false), 300);
          
          if (newScore > highScore) {
            setHighScore(newScore);
            localStorage.setItem("snakeHighScore", newScore.toString());
            toast.success("🎉 New High Score!", {
              description: `You scored ${newScore} points!`,
            });
          }
          
          setFood(generateFood(newSnake));
          toast.success("+1 Point!");
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    }, GAME_SPEED);

    return () => clearInterval(gameInterval);
  }, [direction, isPlaying, isGameOver, food, score, highScore, generateFood, isPaused]);

  // Draw game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = "hsl(220, 18%, 6%)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = "hsl(220, 15%, 15%)";
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL_SIZE, 0);
      ctx.lineTo(i * CELL_SIZE, GRID_SIZE * CELL_SIZE);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i * CELL_SIZE);
      ctx.lineTo(GRID_SIZE * CELL_SIZE, i * CELL_SIZE);
      ctx.stroke();
    }

    // Draw snake with glow
    snake.forEach((segment, index) => {
      const gradient = ctx.createRadialGradient(
        segment.x * CELL_SIZE + CELL_SIZE / 2,
        segment.y * CELL_SIZE + CELL_SIZE / 2,
        0,
        segment.x * CELL_SIZE + CELL_SIZE / 2,
        segment.y * CELL_SIZE + CELL_SIZE / 2,
        CELL_SIZE
      );
      
      if (index === 0) {
        gradient.addColorStop(0, "hsl(145, 80%, 60%)");
        gradient.addColorStop(1, "hsl(145, 80%, 40%)");
      } else {
        gradient.addColorStop(0, "hsl(145, 80%, 50%)");
        gradient.addColorStop(1, "hsl(145, 80%, 30%)");
      }

      ctx.fillStyle = gradient;
      ctx.shadowBlur = 15;
      ctx.shadowColor = "hsl(145, 80%, 50%)";
      ctx.fillRect(
        segment.x * CELL_SIZE + 1,
        segment.y * CELL_SIZE + 1,
        CELL_SIZE - 2,
        CELL_SIZE - 2
      );
    });

    // Draw food with glow
    const foodGradient = ctx.createRadialGradient(
      food.x * CELL_SIZE + CELL_SIZE / 2,
      food.y * CELL_SIZE + CELL_SIZE / 2,
      0,
      food.x * CELL_SIZE + CELL_SIZE / 2,
      food.y * CELL_SIZE + CELL_SIZE / 2,
      CELL_SIZE
    );
    foodGradient.addColorStop(0, "hsl(15, 100%, 70%)");
    foodGradient.addColorStop(1, "hsl(15, 100%, 50%)");

    ctx.fillStyle = foodGradient;
    ctx.shadowBlur = 20;
    ctx.shadowColor = "hsl(15, 100%, 60%)";
    ctx.beginPath();
    ctx.arc(
      food.x * CELL_SIZE + CELL_SIZE / 2,
      food.y * CELL_SIZE + CELL_SIZE / 2,
      CELL_SIZE / 2 - 2,
      0,
      Math.PI * 2
    );
    ctx.fill();

    ctx.shadowBlur = 0;
  }, [snake, food]);

  const startGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    setFood(generateFood(INITIAL_SNAKE));
    setScore(0);
    setIsGameOver(false);
    setIsPlaying(true);
    setIsPaused(false);
    toast.success("Game Started! Use arrow keys to control the snake.");
  };

  const togglePause = () => {
    if (!isPlaying || isGameOver) return;
    setIsPaused(!isPaused);
    toast.info(isPaused ? "Game Resumed" : "Game Paused");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-card">
      <div className="w-full max-w-2xl space-y-6 animate-fade-in-up">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-5xl font-bold text-primary text-glow-primary tracking-wider uppercase">
            Snake Game
          </h1>
          <p className="text-muted-foreground text-sm">Use arrow keys to control • Space to pause</p>
        </div>

        {/* Score Display */}
        <Card className="p-6 border-2 border-primary/20 bg-card/50 backdrop-blur">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center space-y-1">
              <p className="text-sm text-muted-foreground uppercase tracking-wider">Score</p>
              <p className={`text-4xl font-bold text-primary ${showScorePop ? "animate-score-pop" : ""}`}>
                {score}
              </p>
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm text-muted-foreground uppercase tracking-wider">High Score</p>
              <p className="text-4xl font-bold text-secondary text-glow-secondary">
                {highScore}
              </p>
            </div>
          </div>
        </Card>

        {/* Game Canvas */}
        <Card className="relative p-4 border-2 border-primary/20 bg-card/50 backdrop-blur">
          <div className="relative flex items-center justify-center">
            <canvas
              ref={canvasRef}
              width={GRID_SIZE * CELL_SIZE}
              height={GRID_SIZE * CELL_SIZE}
              className="border-2 border-primary/30 rounded-lg neon-glow-primary"
            />
            
            {/* Game Over Overlay */}
            {isGameOver && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/90 backdrop-blur-sm rounded-lg">
                <div className="text-center space-y-4 p-8 animate-fade-in-up">
                  <h2 className="text-4xl font-bold text-destructive text-glow-accent">Game Over!</h2>
                  <p className="text-2xl text-foreground">Final Score: <span className="text-primary font-bold">{score}</span></p>
                  {score === highScore && score > 0 && (
                    <p className="text-lg text-secondary text-glow-secondary animate-pulse-glow">
                      🎉 New High Score! 🎉
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Pause Overlay */}
            {isPaused && !isGameOver && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg">
                <div className="text-center space-y-2 animate-fade-in-up">
                  <p className="text-3xl font-bold text-secondary text-glow-secondary">Paused</p>
                  <p className="text-sm text-muted-foreground">Press Space to resume</p>
                </div>
              </div>
            )}

            {/* Start Overlay */}
            {!isPlaying && !isGameOver && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg">
                <div className="text-center space-y-2 animate-fade-in-up">
                  <p className="text-2xl font-bold text-primary text-glow-primary">Press Start or Space</p>
                  <p className="text-sm text-muted-foreground">to begin playing</p>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Controls */}
        <div className="flex gap-3 justify-center">
          {!isPlaying || isGameOver ? (
            <Button
              onClick={startGame}
              size="lg"
              className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold uppercase tracking-wider neon-glow-primary transition-all duration-300"
            >
              {isGameOver ? (
                <>
                  <RotateCcw className="w-5 h-5" />
                  Restart
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  Start Game
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={togglePause}
              size="lg"
              variant="outline"
              className="gap-2 border-2 border-secondary text-secondary hover:bg-secondary/10 font-semibold uppercase tracking-wider neon-glow-secondary transition-all duration-300"
            >
              <Pause className="w-5 h-5" />
              {isPaused ? "Resume" : "Pause"}
            </Button>
          )}
        </div>

        {/* Instructions */}
        <Card className="p-4 border-2 border-muted/20 bg-card/30 backdrop-blur">
          <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div>
              <p className="font-semibold text-foreground mb-2">Controls:</p>
              <ul className="space-y-1">
                <li>• ↑ ↓ ← → Arrow Keys</li>
                <li>• Space: Pause/Resume</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-foreground mb-2">Rules:</p>
              <ul className="space-y-1">
                <li>• Eat food to grow</li>
                <li>• Avoid walls & yourself</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Index;
