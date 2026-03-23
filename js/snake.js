// ===== NAVIGATION =====
function goToPage(page) {
    window.location.href = page; // Redirect user to another page
}

// ===== GAME VARIABLES =====
var grid = 20; // Size of each square (20px grid system)

var snake; // Array storing snake body segments
var food;  // Object storing food position

var velocityX = grid; // Current horizontal movement
var velocityY = 0;    // Current vertical movement

// 🔥 BUFFERED INPUT (prevents missed or delayed turns)
var nextVelocityX = grid; // Next horizontal direction
var nextVelocityY = 0;    // Next vertical direction

var gameState = "menu"; // Game states: menu | playing | gameover

// ===== OVERLAY =====
var overlay = document.getElementById("overlay"); // Game over screen
var overlayText = document.getElementById("overlayText"); // Text inside overlay

// ===== SCORE =====
var score = 0;       // Player score
var gameInterval;   // Stores game loop interval

// ===== START GAME =====
function startGame() {
    if (gameInterval) clearInterval(gameInterval); // Stop previous loop if exists

    myGameArea.start(); // Setup canvas
    resetGame();        // Reset snake, food, score

    gameState = "playing"; // Start playing

    // 🔥 Faster update loop (70ms per frame)
    gameInterval = setInterval(updateGameArea, 70);
}

// ===== RESTART GAME =====
function restartGame() {
    overlay.style.display = "none"; // Hide game over screen

    if (gameInterval) clearInterval(gameInterval); // Stop old loop

    resetGame(); // Reset everything
    gameState = "playing"; // Set state

    gameInterval = setInterval(updateGameArea, 70); // Restart loop
}

// ===== GAME OVER =====
function gameOver() {
    clearInterval(gameInterval); // Stop game loop
    gameState = "gameover"; // Set state

    // Show overlay with styled message and restart button
    overlay.style.display = "block";
    overlayText.innerHTML = "Game Over<br>Score: " + score
}

// ===== RESET GAME =====
function resetGame() {
    // Create starting snake (3 segments)
    snake = [
        { x: 200, y: 200 },
        { x: 180, y: 200 },
        { x: 160, y: 200 }
    ];

    // Reset movement
    velocityX = grid;
    velocityY = 0;

    // Reset buffered input
    nextVelocityX = grid;
    nextVelocityY = 0;

    score = 0; // Reset score

    spawnFood(); // Spawn food safely
}

// ===== SAFE FOOD SPAWN (AVOIDS SPAWNING ON SNAKE) =====
function spawnFood() {
    let valid = false; // Keep trying until valid position found

    while (!valid) {
        let newFood = {
            // Generate random grid-aligned position
            x: Math.floor(Math.random() * (600 / grid)) * grid,
            y: Math.floor(Math.random() * (400 / grid)) * grid
        };

        valid = true; // Assume valid unless proven otherwise

        // Check if food overlaps snake
        for (let part of snake) {
            if (part.x === newFood.x && part.y === newFood.y) {
                valid = false; // Invalid if on snake
                break;
            }
        }

        if (valid) food = newFood; // Assign food if valid
    }
}

// ===== GAME AREA (CANVAS SYSTEM) =====
var myGameArea = {
    canvas: document.createElement("canvas"), // Create canvas
    context: null, // Drawing context

    start: function () {
        this.canvas.width = 600;  // Canvas width
        this.canvas.height = 400; // Canvas height

        this.context = this.canvas.getContext("2d"); // Get drawing context

        var container = document.getElementById("gameContainer");
        container.innerHTML = ""; // Clear previous canvas
        container.appendChild(this.canvas); // Add new canvas
    },

    clear: function () {
        // Clear entire screen each frame
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
};

// ===== MAIN GAME LOOP =====
function updateGameArea() {
    myGameArea.clear(); // Clear screen

    if (gameState !== "playing") return; // Stop if not playing

    let ctx = myGameArea.context;

    // 🔥 APPLY BUFFERED INPUT (smooth direction changes)
    velocityX = nextVelocityX;
    velocityY = nextVelocityY;

    // Calculate new head position
    let head = {
        x: snake[0].x + velocityX,
        y: snake[0].y + velocityY
    };

    // ===== WALL COLLISION =====
    if (
        head.x < 0 ||
        head.y < 0 ||
        head.x >= myGameArea.canvas.width ||
        head.y >= myGameArea.canvas.height
    ) {
        gameOver(); // End game if hitting wall
        return;
    }

    // ===== SELF COLLISION =====
    for (let part of snake) {
        if (head.x === part.x && head.y === part.y) {
            gameOver(); // End game if hitting itself
            return;
        }
    }

    snake.unshift(head); // Add new head to snake

    // ===== FOOD COLLISION =====
    if (head.x === food.x && head.y === food.y) {
        score++; // Increase score
        spawnFood(); // Generate new food
    } else {
        snake.pop(); // Remove tail if no food eaten
    }

    // ===== DRAW FOOD (APPLE) =====
    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.arc(food.x + grid / 2, food.y + grid / 2, grid / 2, 0, Math.PI * 2);
    ctx.fill();

    // Stem
    ctx.fillStyle = "brown";
    ctx.fillRect(food.x + grid / 2 - 2, food.y - 4, 4, 6);

    // Leaf
    ctx.fillStyle = "green";
    ctx.beginPath();
    ctx.ellipse(food.x + grid / 2 + 4, food.y, 6, 3, 0.5, 0, Math.PI * 2);
    ctx.fill();

    // ===== DRAW SNAKE =====
    for (let i = 0; i < snake.length; i++) {
        let part = snake[i];

        ctx.fillStyle = "lime";
        ctx.fillRect(part.x, part.y, grid, grid);

        // Draw eyes on head
        if (i === 0) {
            ctx.fillStyle = "white";

            // Position eyes based on movement direction
            if (velocityX > 0) {
                ctx.fillRect(part.x + 12, part.y + 5, 4, 4);
                ctx.fillRect(part.x + 12, part.y + 12, 4, 4);
            } else if (velocityX < 0) {
                ctx.fillRect(part.x + 4, part.y + 5, 4, 4);
                ctx.fillRect(part.x + 4, part.y + 12, 4, 4);
            } else if (velocityY < 0) {
                ctx.fillRect(part.x + 5, part.y + 4, 4, 4);
                ctx.fillRect(part.x + 12, part.y + 4, 4, 4);
            } else if (velocityY > 0) {
                ctx.fillRect(part.x + 5, part.y + 12, 4, 4);
                ctx.fillRect(part.x + 12, part.y + 12, 4, 4);
            }
        }
    }

    // ===== DRAW SCORE =====
    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.fillText("Score: " + score, 10, 20);
}

// ===== INPUT HANDLER =====
function setDirection(x, y) {
    if (gameState === "menu") startGame(); // Start game on first input

    // Prevent reversing into itself
    if (x !== 0 && velocityX === 0) {
        nextVelocityX = x;
        nextVelocityY = 0;
    }

    if (y !== 0 && velocityY === 0) {
        nextVelocityX = 0;
        nextVelocityY = y;
    }
}

// ===== KEYBOARD CONTROLS =====
document.addEventListener("keydown", function (e) {

    // Prevent page scrolling when using arrow keys
    if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.key)) {
        e.preventDefault();
    }

    if (e.key === "ArrowUp") setDirection(0, -grid);
    if (e.key === "ArrowDown") setDirection(0, grid);
    if (e.key === "ArrowLeft") setDirection(-grid, 0);
    if (e.key === "ArrowRight") setDirection(grid, 0);
});

// ===== POINTER INPUT (MOBILE / CLICK) =====
document.addEventListener("pointerdown", function () {
    if (gameState === "menu") startGame(); // Start game on tap/click
});

// ===== BUTTON CONTROLS =====
function moveUp() { setDirection(0, -grid); }
function moveDown() { setDirection(0, grid); }
function moveLeft() { setDirection(-grid, 0); }
function moveRight() { setDirection(grid, 0); }

// ===== INITIALIZE =====
myGameArea.start(); // Create canvas when page loads