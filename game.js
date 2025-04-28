document.addEventListener("DOMContentLoaded", () => {
  // --- Ensure user is logged in ---
  const currentUser = window.mazeGame.getCurrentUser();
  if (!currentUser) {
    alert("Morate biti ulogovani da biste igrali.");
    window.location.href = "index.html";
    return;
  }

  // --- Apply Theme ---
  const savedTheme = localStorage.getItem("mazeGameTheme") || "light";
  window.mazeGame.applyTheme(savedTheme); // Use function from app.js

  // --- DOM Elements ---
  const canvas = document.getElementById("mazeCanvas");
  const ctx = canvas.getContext("2d");
  const levelDisplay = document.getElementById("level-display");
  const timerDisplay = document.getElementById("timer-display");
  const attemptsDisplay = document.getElementById("attempts-display");
  const messageOverlay = document.getElementById("message-overlay");
  const messageText = document.getElementById("message-text");
  const nextLevelBtn = document.getElementById("next-level-btn");
  const restartLevelBtn = document.getElementById("restart-level-btn");
  const backToMenuBtn = document.getElementById("back-to-menu-game");
  const backToMenuWinBtn = document.getElementById("back-to-menu-win-btn"); // Get the new button

  // --- Sound Elements (Optional) ---
  const collisionSound = document.getElementById("collision-sound");
  const winSound = document.getElementById("win-sound");
  const backgroundMusic = document.getElementById("background-music"); // Get background music element

  // --- Game State ---
  let currentLevelIndex = 0;
  let currentLevelData;
  let playerPos;
  let mazeVisible = true;
  let viewTimeout;
  let gameTimerInterval;
  let startTime;
  let elapsedTime = 0;
  let attempts = 0;
  let cellSize; // Calculated based on canvas size and maze dimensions
  let playerSize;
  let wallColor, pathColor, playerColor, startColor, endColor; // Theme dependent colors
  let gameActive = false; // Is the player allowed to move?
  let userData = window.mazeGame.getUserData(currentUser);
  let collisionSoundTimeout = null; // Za čuvanje setTimeout reference

  // --- Touch Controls State ---
  let touchStartX = 0;
  let touchStartY = 0;
  let touchEndX = 0;
  let touchEndY = 0;
  const swipeThreshold = 30; // Minimum distance in pixels to register as a swipe

  // --- Initialization ---
  function initGame() {
    // Load user progress
    currentLevelIndex = userData.progress.currentLevel - 1; // 0-based index
    if (currentLevelIndex >= levels.length) {
      // User has completed all levels, just redirect to menu
      console.log("Svi nivoi pređeni. Preusmeravanje na meni.");
      window.location.href = "index.html";
      return; // Stop further execution of initGame
    }
    // If not all levels completed, load the current level
    loadLevel(currentLevelIndex);
  }

  function loadLevel(levelIndex) {
    stopCollisionSound(); // Zaustavi zvuk ako je prethodno svirao
    pauseBackgroundMusic(); // Pauziraj muziku pri učitavanju nivoa
    clearTimeout(viewTimeout);
    clearInterval(gameTimerInterval);
    gameActive = false; // Disable movement initially

    currentLevelData = levels[levelIndex];
    playerPos = { ...currentLevelData.start }; // Copy start position

    // Load attempts for this level
    attempts = userData.progress.levels[currentLevelData.level]?.attempts || 0;
    attemptsDisplay.textContent = attempts;

    levelDisplay.textContent = currentLevelData.level;
    timerDisplay.textContent = "0.0";
    elapsedTime = 0;

    resizeCanvas(); // Adjust canvas size based on maze dimensions
    updateThemeColors(); // Get colors based on current theme

    mazeVisible = true;
    messageOverlay.classList.add("hidden");
    nextLevelBtn.classList.add("hidden");
    restartLevelBtn.classList.add("hidden");

    drawMaze();

    // Show maze for viewTime duration
    messageText.textContent = `Nivo ${currentLevelData.level}. Zapamtite put!`;
    messageOverlay.classList.remove("hidden");

    viewTimeout = setTimeout(() => {
      console.log(
        `View timeout expired for level ${currentLevelData.level}. Hiding overlay and maze walls.`
      ); // Log
      mazeVisible = false;
      if (messageOverlay) {
        // Provera da li element postoji
        messageOverlay.classList.add("hidden");
        console.log("Overlay hidden class added."); // Log
      } else {
        console.error("messageOverlay element not found!"); // Log greške ako nije pronađen
      }

      // --- Ensure this block remains commented out ---
      /*
      // This block is now irrelevant as startSound variable is removed
      if (startSound) {
        console.log("This should NOT be logged - startSound in game.js timeout"); // Debug log
        startSound.currentTime = 0; // Premotaj na početak za svaki slučaj
        startSound
          .play()
          .catch((e) => console.error("Greška pri puštanju start zvuka (game.js):", e)); // Dodaj error handling
      }
      */
      // --- End of commented out block ---

      console.log("About to play background music (uzicko.wav)."); // Log before playing background music
      playBackgroundMusic(); // Pokreni pozadinsku muziku kada igra postane aktivna
      startGameTimer();
      gameActive = true; // Enable movement
      drawMaze(); // Redraw without walls (or with player only)
    }, currentLevelData.viewTime);
  }

  function resizeCanvas() {
    const maze = currentLevelData.maze;
    const mazeWidth = maze[0].length;
    const mazeHeight = maze.length;

    // Use window dimensions for mobile, parent dimensions otherwise
    const isMobile = window.innerWidth <= 600; // Check if likely mobile based on CSS breakpoint
    // Further reduce padding/margin space estimate for mobile height - try minimum
    const mobileVerticalPadding = 40; // Keep this minimal (for UI)
    // Use full innerWidth on mobile, container padding is handled by box-sizing
    const availableWidth = isMobile
      ? window.innerWidth
      : canvas.parentElement.clientWidth * 0.9;
    const availableHeight = isMobile
      ? window.innerHeight - mobileVerticalPadding
      : window.innerHeight * 0.7;

    const maxCellSizeW = Math.floor(availableWidth / mazeWidth);
    const maxCellSizeH = Math.floor(availableHeight / mazeHeight);

    // Allow larger cells on mobile by increasing the hard limit significantly
    const maxAllowedCellSize = isMobile ? 50 : 30; // Povećan limit za mobilne na 50
    cellSize = Math.max(
      5, // Ensure minimum cell size
      // Limit only by available space and the new larger cap
      Math.min(maxCellSizeW, maxCellSizeH, maxAllowedCellSize)
    );
    playerSize = cellSize * 0.6; // Player slightly smaller than cell

    canvas.width = mazeWidth * cellSize;
    canvas.height = mazeHeight * cellSize;

    // Center canvas vertically if needed (optional, CSS margin:auto might be enough)
    // const marginTop = Math.max(0, (availableHeight - canvas.height) / 2);
    // canvas.style.marginTop = `${marginTop}px`;
    console.log(
      `Resized canvas to: ${canvas.width}x${canvas.height}, CellSize: ${cellSize}, Available H: ${availableHeight}, Available W: ${availableWidth}` // Log width too
    );
  }

  function updateThemeColors() {
    const currentTheme = document.body.getAttribute("data-theme");
    const style = getComputedStyle(document.documentElement);
    if (currentTheme === "dark") {
      wallColor = style.getPropertyValue("--wall-color-dark").trim();
      pathColor = style.getPropertyValue("--path-color-dark").trim();
      playerColor = style.getPropertyValue("--player-color-dark").trim();
      startColor = style.getPropertyValue("--start-color-dark").trim();
      endColor = style.getPropertyValue("--end-color-dark").trim();
    } else {
      wallColor = style.getPropertyValue("--wall-color-light").trim();
      pathColor = style.getPropertyValue("--path-color-light").trim();
      playerColor = style.getPropertyValue("--player-color-light").trim();
      startColor = style.getPropertyValue("--start-color-light").trim();
      endColor = style.getPropertyValue("--end-color-light").trim();
    }
  }

  // --- Drawing ---
  function drawMaze() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const maze = currentLevelData.maze;
    // No longer need bgColor here for drawing invisible walls

    for (let y = 0; y < maze.length; y++) {
      for (let x = 0; x < maze[y].length; x++) {
        // Determine fill style based on cell type and visibility
        if (maze[y][x] === 1) {
          // It's a wall
          if (mazeVisible) {
            ctx.fillStyle = wallColor; // Visible wall color
          } else {
            // Invisible wall - use the path color to blend in
            ctx.fillStyle = pathColor;
          }
        } else {
          // It's a path
          // Check if it's the start or end cell, only relevant if maze is visible
          if (
            mazeVisible &&
            x === currentLevelData.start.x &&
            y === currentLevelData.start.y
          ) {
            ctx.fillStyle = startColor;
          } else if (
            mazeVisible &&
            x === currentLevelData.end.x &&
            y === currentLevelData.end.y
          ) {
            ctx.fillStyle = endColor;
          } else {
            // Regular path color (also used for invisible walls)
            ctx.fillStyle = pathColor;
          }
        }

        // Draw cell background
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
      }
    }
    // Always draw the player last
    drawPlayer();
  }

  function drawPlayer() {
    ctx.fillStyle = playerColor;
    const playerOffset = (cellSize - playerSize) / 2;
    ctx.fillRect(
      playerPos.x * cellSize + playerOffset,
      playerPos.y * cellSize + playerOffset,
      playerSize,
      playerSize
    );
  }

  // --- Movement & Collision ---
  function movePlayer(dx, dy) {
    if (!gameActive) return;

    const nextX = playerPos.x + dx;
    const nextY = playerPos.y + dy;

    // Check boundaries
    if (
      nextX < 0 ||
      nextX >= currentLevelData.maze[0].length ||
      nextY < 0 ||
      nextY >= currentLevelData.maze.length
    ) {
      return; // Hit outer boundary
    }

    // Check wall collision
    if (currentLevelData.maze[nextY][nextX] === 1) {
      if (collisionSound) {
        stopCollisionSound(); // Zaustavi prethodni ako je svirao
        collisionSound.currentTime = 0; // Počni od početka
        collisionSound
          .play()
          .then(() => {
            console.log("Playing collision sound...");
            // Postavi timeout da zaustavi zvuk nakon 6 sekundi
            collisionSoundTimeout = setTimeout(() => {
              if (collisionSound && !collisionSound.paused) {
                collisionSound.pause();
                collisionSound.currentTime = 0; // Resetuj vreme
                console.log("Collision sound stopped after 6 seconds.");
              }
              collisionSoundTimeout = null; // Resetuj referencu
            }, 6000); // 6000 milisekundi = 6 sekundi
          })
          .catch((e) =>
            console.error("Greška pri puštanju collision zvuka:", e)
          );
      }
      handleCollision();
      return;
    }

    // Move player
    playerPos.x = nextX;
    playerPos.y = nextY;

    drawMaze(); // Redraw everything

    // Check win condition
    if (
      playerPos.x === currentLevelData.end.x &&
      playerPos.y === currentLevelData.end.y
    ) {
      stopCollisionSound(); // Zaustavi zvuk sudara ako je svirao pre pobede
      // Play win sound
      if (winSound) {
        winSound.currentTime = 0;
        winSound
          .play()
          .catch((e) => console.error("Greška pri puštanju win zvuka:", e));
      }
      handleWin();
    }
  }

  function handleCollision() {
    gameActive = false; // Stop movement
    clearInterval(gameTimerInterval);
    pauseBackgroundMusic(); // Pauziraj muziku kod sudara
    attempts++;
    attemptsDisplay.textContent = attempts;

    // Update attempts in user data
    const levelStats = userData.progress.levels[currentLevelData.level] || {
      bestTime: null,
      attempts: 0,
    };
    levelStats.attempts = attempts;
    userData.progress.levels[currentLevelData.level] = levelStats;
    window.mazeGame.updateUserData(currentUser, {
      progress: userData.progress,
    });

    messageText.textContent = "Udarili ste u zid! Pokušajte ponovo.";
    restartLevelBtn.classList.remove("hidden");
    nextLevelBtn.classList.add("hidden"); // Sakrij dugme za sledeći nivo kod sudara
    backToMenuWinBtn.classList.add("hidden"); // Hide win button on collision
    messageOverlay.classList.remove("hidden");
  }

  function handleWin() {
    gameActive = false;
    clearInterval(gameTimerInterval);
    pauseBackgroundMusic(); // Pauziraj muziku kod pobede
    const level = currentLevelData.level;

    // Update stats
    const levelStats = userData.progress.levels[level] || {
      bestTime: null,
      attempts: 0,
    };
    levelStats.attempts = attempts + 1; // Include the winning attempt
    if (levelStats.bestTime === null || elapsedTime < levelStats.bestTime) {
      levelStats.bestTime = elapsedTime;
    }
    userData.progress.levels[level] = levelStats;

    // Unlock next level
    if (level >= userData.progress.currentLevel) {
      userData.progress.currentLevel = level + 1;
    }

    // Check Achievements (Example)
    let newAchievements = [];
    const achievementKeyLevel = `Level ${level} Complete`;
    if (!userData.achievements.includes(achievementKeyLevel)) {
      userData.achievements.push(achievementKeyLevel);
      newAchievements.push(achievementKeyLevel);
    }
    // Add more achievement checks here (e.g., perfect run, speed run)

    // Save updated user data
    window.mazeGame.updateUserData(currentUser, {
      progress: userData.progress,
      achievements: userData.achievements,
    });

    // Display win message
    let winMsg = `Nivo ${level} pređen za ${(elapsedTime / 1000).toFixed(2)}s!`;
    if (newAchievements.length > 0) {
      winMsg += `\nNova dostignuća: ${newAchievements.join(", ")}`;
    }
    messageText.textContent = winMsg; // Set message text first

    // Hide standard buttons initially
    nextLevelBtn.classList.add("hidden");
    restartLevelBtn.classList.add("hidden");
    backToMenuWinBtn.classList.add("hidden"); // Hide win button initially

    // Show appropriate button based on level completion
    if (currentLevelIndex < levels.length - 1) {
      nextLevelBtn.classList.remove("hidden"); // Show next level button
    } else {
      messageText.textContent += "\nČestitamo, prešli ste sve nivoe!";
      backToMenuWinBtn.classList.remove("hidden"); // Show back to menu button on final level win
    }

    messageOverlay.classList.remove("hidden"); // Show overlay with message and correct button
  }

  // --- Timer ---
  function startGameTimer() {
    startTime = Date.now();
    elapsedTime = 0; // Reset elapsed time for the current attempt
    timerDisplay.textContent = "0.0";

    gameTimerInterval = setInterval(() => {
      elapsedTime = Date.now() - startTime;
      timerDisplay.textContent = (elapsedTime / 1000).toFixed(1);
    }, 100); // Update every 100ms
  }

  // --- Event Listeners ---
  window.addEventListener("keydown", (e) => {
    if (!gameActive) return;
    switch (e.key) {
      case "ArrowUp":
      case "w":
        movePlayer(0, -1);
        break;
      case "ArrowDown":
      case "s":
        movePlayer(0, 1);
        break;
      case "ArrowLeft":
      case "a":
        movePlayer(-1, 0);
        break;
      case "ArrowRight":
      case "d":
        movePlayer(1, 0);
        break;
    }
    e.preventDefault(); // Prevent page scrolling
  });

  window.addEventListener("resize", () => {
    // Only redraw if a level is loaded
    if (currentLevelData) {
      resizeCanvas();
      updateThemeColors(); // Colors might depend on viewport in complex CSS
      drawMaze();
    }
  });

  // --- Touch Event Listeners for Swipe Controls ---
  canvas.addEventListener(
    "touchstart",
    (e) => {
      // Prevent scrolling when touching the canvas
      e.preventDefault();
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
    },
    { passive: false }
  ); // Use passive: false to allow preventDefault

  canvas.addEventListener(
    "touchmove",
    (e) => {
      // Prevent scrolling during swipe
      e.preventDefault();
      // We only need the end position, so we update it here but don't act yet
      touchEndX = e.changedTouches[0].screenX;
      touchEndY = e.changedTouches[0].screenY;
    },
    { passive: false }
  ); // Use passive: false to allow preventDefault

  canvas.addEventListener("touchend", (e) => {
    // No preventDefault needed here as the touch sequence ends
    touchEndX = e.changedTouches[0].screenX;
    touchEndY = e.changedTouches[0].screenY;
    handleSwipe();
  });

  function handleSwipe() {
    if (!gameActive) return; // Only handle swipes if game is active

    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;

    // Check if it's more horizontal or vertical swipe
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal swipe
      if (Math.abs(deltaX) > swipeThreshold) {
        if (deltaX > 0) {
          // Swipe Right
          console.log("Swipe Right");
          movePlayer(1, 0);
        } else {
          // Swipe Left
          console.log("Swipe Left");
          movePlayer(-1, 0);
        }
      }
    } else {
      // Vertical swipe
      if (Math.abs(deltaY) > swipeThreshold) {
        if (deltaY > 0) {
          // Swipe Down
          console.log("Swipe Down");
          movePlayer(0, 1);
        } else {
          // Swipe Up
          console.log("Swipe Up");
          movePlayer(0, -1);
        }
      }
    }

    // Reset touch coordinates for the next swipe
    touchStartX = 0;
    touchStartY = 0;
    touchEndX = 0;
    touchEndY = 0;
  }

  nextLevelBtn.addEventListener("click", () => {
    stopCollisionSound(); // Zaustavi zvuk pre učitavanja sledećeg nivoa
    // Stop win sound if it's playing
    if (winSound && !winSound.paused) {
      winSound.pause();
      winSound.currentTime = 0;
      console.log("Win sound stopped by Next Level button.");
    }
    backToMenuWinBtn.classList.add("hidden"); // Hide win button
    // Muzika će se pauzirati i ponovo pokrenuti u loadLevel
    currentLevelIndex++;
    if (currentLevelIndex < levels.length) {
      loadLevel(currentLevelIndex);
    } else {
      // Should not happen if button is hidden correctly, but handle anyway
      alert("Prešli ste sve nivoe!");
      window.location.href = "index.html";
    }
  });

  restartLevelBtn.addEventListener("click", () => {
    stopCollisionSound(); // Zaustavi zvuk pre restarta
    // Stop win sound if it's playing (less likely here, but good practice)
    if (winSound && !winSound.paused) {
      winSound.pause();
      winSound.currentTime = 0;
      console.log("Win sound stopped by Restart Level button.");
    }
    backToMenuWinBtn.classList.add("hidden"); // Hide win button
    // Muzika će se pauzirati i ponovo pokrenuti u loadLevel
    // Reload the current level, reset timer and player position
    loadLevel(currentLevelIndex);
  });

  backToMenuBtn.addEventListener("click", () => {
    stopCollisionSound(); // Zaustavi zvuk pre povratka u meni
    pauseBackgroundMusic(); // Pauziraj muziku pre povratka u meni
    // Stop win sound if it's playing
    if (winSound && !winSound.paused) {
      winSound.pause();
      winSound.currentTime = 0;
      console.log("Win sound stopped by Back to Menu button.");
    }
    window.location.href = "index.html";
  });

  // Add theme toggle listener specific to game page if needed
  const themeToggleGame = document.getElementById("theme-toggle-game");
  if (themeToggleGame) {
    themeToggleGame.addEventListener("click", () => {
      // Toggle theme using the function from app.js
      const currentTheme = document.body.getAttribute("data-theme") || "light";
      const newTheme = currentTheme === "light" ? "dark" : "light";
      window.mazeGame.applyTheme(newTheme); // Apply theme to body and save preference

      // Update canvas colors and redraw immediately
      updateThemeColors(); // Recalculate wallColor, pathColor etc.
      drawMaze(); // Redraw the maze and player with new colors
    });
  }

  // Optional: Pause music when tab loses focus
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      pauseBackgroundMusic();
    } else {
      // Only resume if game is supposed to be active (might need more complex state check)
      // For simplicity, we let loadLevel handle restarting music
      // if (gameActive && backgroundMusic && backgroundMusic.paused) {
      //     backgroundMusic.play().catch(e => console.error("Greška pri nastavljanju pozadinske muzike:", e));
      // }
    }
  });

  // Add event listener for the new win button
  backToMenuWinBtn.addEventListener("click", () => {
    stopCollisionSound();
    pauseBackgroundMusic();
    // Stop win sound if it's playing
    if (winSound && !winSound.paused) {
      winSound.pause();
      winSound.currentTime = 0;
      console.log("Win sound stopped by Back to Menu (Win) button.");
    }
    window.location.href = "index.html";
  });

  // --- Start the game ---
  initGame();

  // Funkcija za zaustavljanje zvuka sudara
  function stopCollisionSound() {
    if (collisionSoundTimeout) {
      clearTimeout(collisionSoundTimeout); // Obriši timeout ako postoji
      collisionSoundTimeout = null;
    }
    if (collisionSound && !collisionSound.paused) {
      collisionSound.pause();
      collisionSound.currentTime = 0; // Vrati na početak za sledeći put
      console.log("Collision sound stopped.");
    }
  }

  // Funkcija za kontrolu pozadinske muzike
  function playBackgroundMusic() {
    if (backgroundMusic) {
      backgroundMusic.currentTime = 49; // Počni od 49. sekunde
      backgroundMusic
        .play()
        .catch((e) =>
          console.error("Greška pri puštanju pozadinske muzike:", e)
        );
      console.log("Playing background music from 49s.");
    }
  }

  function pauseBackgroundMusic() {
    if (backgroundMusic && !backgroundMusic.paused) {
      backgroundMusic.pause();
      console.log("Background music paused.");
    }
  }
});
