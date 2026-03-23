// ===== NAVIGATION =====
function goToPage(page) {
    window.location.href = page; // Redirects to another page
}

// ===== GAME VARIABLES =====
var myGamePiece; // The bird/player object
var pipes = [];  // Array storing all pipes
var score = 0;   // Player score

var gravity = 0.4; // Downward force applied every frame
var velocity = 0;  // Bird's vertical speed

var gameState = "menu"; // Game states: menu | playing | gameover

// ===== INPUT FIX (ANTI-SPAM) =====
let lastFlapTime = 0; // Tracks last flap time to prevent spamming

// ===== OVERLAY =====
var overlay = document.getElementById("overlay"); // Game over screen
var overlayText = document.getElementById("overlayText"); // Text inside overlay

// ===== ANIMATION =====
let wingFrame = 0;     // Controls wing position (up/down)
let wingDirection = 1; // Controls animation direction

// ===== CLOUDS =====
let clouds = []; // Background clouds array

// Create clouds at random positions
function createClouds() {
    clouds = []; // Reset clouds

    for (let i = 0; i < 5; i++) {
        clouds.push({
            x: Math.random() * 600, // Random X position
            y: Math.random() * 150, // Random Y (top area)
            speed: 0.5 + Math.random() * 0.5 // Random slow speed
        });
    }
}

// ===== START GAME =====
function startGame() {
    createClouds(); // Generate clouds
    myGameArea.start(); // Start canvas and game loop
}

// ===== RESTART GAME =====
function restartGame() {
    pipes = []; // Clear pipes
    score = 0; // Reset score
    velocity = 0; // Reset movement
    gameState = "playing"; // Set game state

    overlay.style.display = "none"; // Hide game over screen

    createClouds(); // Regenerate clouds
    myGameArea.start(); // Restart game
}

// ===== GAME AREA (CANVAS SYSTEM) =====
var myGameArea = {
    canvas: document.createElement("canvas"), // Create canvas element
    context: null, // Drawing context
    interval: null, // Game loop interval

    start: function () {

        // Stop previous game loop if it exists
        if (this.interval) clearInterval(this.interval);

        this.canvas.width = 600; // Canvas width
        this.canvas.height = 400; // Canvas height

        this.context = this.canvas.getContext("2d"); // Get drawing context

        const container = document.getElementById("gameContainer");

        // Reset canvas inside container
        container.innerHTML = "";
        container.appendChild(this.canvas);

        // Create bird/player in middle-left of screen
        myGamePiece = new component(30, 30, "yellow", 50, this.canvas.height / 2);

        // Start main game loop (runs every 20ms)
        this.interval = setInterval(updateGameArea, 20);
    },

    clear: function () {
        // Clears entire canvas each frame
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    },

    stop: function () {
        if (this.interval) clearInterval(this.interval); // Stop game loop

        gameState = "gameover"; // Set game state

        // Show game over overlay
        overlay.style.display = "block";
        overlayText.innerHTML = "Game Over<br>Score: " + score;
    }
};

// ===== BIRD (PLAYER OBJECT) =====
function component(width, height, color, x, y) {
    this.width = width;
    this.height = height;
    this.x = x;
    this.y = y;

    // Draw and update bird
    this.update = function () {
        let ctx = myGameArea.context;

        ctx.save(); // Save canvas state

        // Move origin to center of bird
        let centerX = this.x + this.width / 2;
        let centerY = this.y + this.height / 2;
        ctx.translate(centerX, centerY);

        // Tilt bird based on velocity (falling = tilt down)
        let tilt = velocity * 0.05;
        if (tilt > 1) tilt = 1;
        if (tilt < -1) tilt = -1;

        ctx.rotate(tilt); // Rotate bird

        // ===== DRAW BODY =====
        ctx.fillStyle = "yellow";
        ctx.beginPath();
        ctx.arc(0, 0, 15, 0, Math.PI * 2);
        ctx.fill();

        // ===== DRAW EYE =====
        ctx.fillStyle = "black";
        ctx.beginPath();
        ctx.arc(5, -5, 3, 0, Math.PI * 2);
        ctx.fill();

        // ===== DRAW WING (ANIMATED) =====
        ctx.fillStyle = "orange";
        ctx.beginPath();
        ctx.moveTo(-5, 0);
        ctx.lineTo(-25, wingFrame - 5); // Wing moves up/down
        ctx.lineTo(-5, 15);
        ctx.fill();

        // ===== DRAW BEAK =====
        ctx.fillStyle = "orange";
        ctx.beginPath();
        ctx.moveTo(15, 0);
        ctx.lineTo(25, -3);
        ctx.lineTo(15, 5);
        ctx.fill();

        ctx.restore(); // Restore canvas state
    };
}

// ===== CREATE PIPES =====
function createPipe() {
    let gap = 120; // Space between top and bottom pipes

    let min = 50;
    let max = myGameArea.canvas.height - gap - 50;

    // Random height for top pipe
    let topHeight = Math.random() * (max - min) + min;

    pipes.push({
        x: myGameArea.canvas.width, // Start off-screen right
        top: topHeight, // Top pipe height
        bottom: topHeight + gap, // Bottom pipe start
        passed: false // Track if player already scored
    });
}

// ===== DRAW CLOUD =====
function drawCloud(cloud) {
    let ctx = myGameArea.context;

    ctx.fillStyle = "white";

    // Draw cloud using multiple circles
    ctx.beginPath();
    ctx.arc(cloud.x, cloud.y, 20, 0, Math.PI * 2);
    ctx.arc(cloud.x + 20, cloud.y + 10, 25, 0, Math.PI * 2);
    ctx.arc(cloud.x - 20, cloud.y + 10, 25, 0, Math.PI * 2);
    ctx.fill();
}

// ===== MAIN GAME LOOP =====
function updateGameArea() {
    myGameArea.clear(); // Clear screen

    let ctx = myGameArea.context;

    // ===== CLOUD BACKGROUND =====
    for (let cloud of clouds) {
        cloud.x -= cloud.speed; // Move cloud left

        // Reset cloud when off screen
        if (cloud.x < -60) {
            cloud.x = myGameArea.canvas.width + 60;
            cloud.y = Math.random() * 150;
        }

        drawCloud(cloud); // Draw cloud
    }

    // ===== GAME LOGIC =====
    if (gameState === "playing") {

        // Apply gravity
        velocity += gravity;
        myGamePiece.y += velocity;

        // Animate wing movement
        wingFrame += wingDirection * 0.8;
        if (wingFrame > 10 || wingFrame < -10) {
            wingDirection *= -1; // Reverse direction
        }

        // ===== CHECK TOP/BOTTOM COLLISION =====
        if (
            myGamePiece.y < 0 ||
            myGamePiece.y + myGamePiece.height > myGameArea.canvas.height
        ) {
            myGameArea.stop(); // End game
            return;
        }

        // ===== CREATE PIPES =====
        if (pipes.length === 0 || pipes[pipes.length - 1].x < 250) {
            createPipe();
        }

        // ===== MOVE & DRAW PIPES =====
        for (let pipe of pipes) {
            pipe.x -= 2; // Move pipe left

            ctx.fillStyle = "green";

            // Draw top pipe
            ctx.fillRect(pipe.x, 0, 50, pipe.top);

            // Draw bottom pipe
            ctx.fillRect(pipe.x, pipe.bottom, 50, myGameArea.canvas.height - pipe.bottom);

            // ===== COLLISION DETECTION =====
            if (
                myGamePiece.x < pipe.x + 50 &&
                myGamePiece.x + myGamePiece.width > pipe.x &&
                (
                    myGamePiece.y < pipe.top ||
                    myGamePiece.y + myGamePiece.height > pipe.bottom
                )
            ) {
                myGameArea.stop(); // End game
                return;
            }

            // ===== SCORE SYSTEM =====
            if (!pipe.passed && pipe.x + 50 < myGamePiece.x) {
                score++; // Increase score when passing pipe
                pipe.passed = true; // Prevent double scoring
            }
        }

        // Remove pipes that left screen
        pipes = pipes.filter(p => p.x > -50);

        // Draw score
        ctx.fillStyle = "white";
        ctx.font = "20px Arial";
        ctx.fillText("Score: " + score, 10, 20);
    }

    // Draw bird (always runs)
    myGamePiece.update();
}

// ===== CONTROLS =====
function flap() {
    let now = Date.now(); // Current time

    // Prevent spam clicking/tapping
    if (now - lastFlapTime < 150) return;
    lastFlapTime = now;

    // Start game if in menu
    if (gameState === "menu") {
        gameState = "playing";
        return;
    }

    // Make bird jump
    if (gameState === "playing") {
        velocity = -6;
    }
}

// Keyboard control (spacebar)
document.addEventListener("keydown", function (e) {
    if (e.code === "Space") {
        flap();
    }
});

// Universal input (works for mouse + touch)
document.addEventListener("pointerdown", function () {
    flap();
});

// ===== START GAME =====
startGame(); // Initialize game