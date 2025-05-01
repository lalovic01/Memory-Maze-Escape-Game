document.addEventListener("DOMContentLoaded", () => {
  const currentUser = window.mazeGame.getCurrentUser();
  if (!currentUser) {
    alert("Morate biti ulogovani da biste igrali.");
    window.location.href = "index.html";
    return;
  }

  const savedTheme = localStorage.getItem("mazeGameTheme") || "light";
  window.mazeGame.applyTheme(savedTheme);

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
  const backToMenuWinBtn = document.getElementById("back-to-menu-win-btn");
  const viewTimerBarContainer = document.getElementById(
    "view-timer-bar-container"
  );
  const viewTimerBar = document.getElementById("view-timer-bar");
  const controlsContainer = document.getElementById("controls-container");
  const btnUp = document.getElementById("btn-up");
  const btnDown = document.getElementById("btn-down");
  const btnLeft = document.getElementById("btn-left");
  const btnRight = document.getElementById("btn-right");

  const collisionSound = document.getElementById("collision-sound");
  const winSound = document.getElementById("win-sound");
  const backgroundMusic = document.getElementById("background-music");
  const gameAudioElements = [collisionSound, winSound, backgroundMusic].filter(
    Boolean
  );

  let currentLevelIndex = 0;
  let currentLevelData;
  let playerPos;
  let mazeVisible = true;
  let viewTimeout;
  let viewTimerInterval;
  let gameTimerInterval;
  let startTime;
  let elapsedTime = 0;
  let attempts = 0;
  let cellSize;
  let playerSize;
  let wallColor, pathColor, playerColor, startColor, endColor;
  let gameActive = false;
  let userData = window.mazeGame.getUserData(currentUser);
  let collisionSoundTimeout = null;
  let isMuted = localStorage.getItem("mazeGameMuted") === "true";

  let touchStartX = 0;
  let touchStartY = 0;
  let touchEndX = 0;
  let touchEndY = 0;
  const swipeThreshold = 30;

  function initGame() {
    applyMuteStateToGameSounds(isMuted);

    currentLevelIndex = userData.progress.currentLevel - 1;
    if (currentLevelIndex >= levels.length) {
      console.log("Svi nivoi pređeni. Preusmeravanje na meni.");
      window.location.href = "index.html";
      return;
    }
    loadLevel(currentLevelIndex);

    if (controlsContainer) controlsContainer.style.display = "none";
  }

  function applyMuteStateToGameSounds(muted) {
    isMuted = muted;
    gameAudioElements.forEach((audio) => {
      if (audio) audio.muted = muted;
    });
    if (muted && backgroundMusic && !backgroundMusic.paused) {
      backgroundMusic.pause();
      console.log("Background music paused due to mute.");
    }
  }

  function loadLevel(levelIndex) {
    isMuted = localStorage.getItem("mazeGameMuted") === "true";
    applyMuteStateToGameSounds(isMuted);

    stopCollisionSound();
    pauseBackgroundMusic();
    clearTimeout(viewTimeout);
    clearInterval(gameTimerInterval);
    clearInterval(viewTimerInterval);
    gameActive = false;

    currentLevelData = levels[levelIndex];
    playerPos = { ...currentLevelData.start };

    attempts = userData.progress.levels[currentLevelData.level]?.attempts || 0;
    attemptsDisplay.textContent = attempts;

    levelDisplay.textContent = currentLevelData.level;
    timerDisplay.textContent = "0.0";
    elapsedTime = 0;

    resizeCanvas();
    updateThemeColors();

    mazeVisible = true;
    messageOverlay.classList.add("hidden");
    nextLevelBtn.classList.add("hidden");
    restartLevelBtn.classList.add("hidden");
    viewTimerBarContainer.classList.add("hidden");
    canvas.classList.remove("maze-fading");

    drawMaze();

    messageText.textContent = `Nivo ${currentLevelData.level}. Zapamtite put!`;
    messageOverlay.classList.remove("hidden");

    startVisualTimer(currentLevelData.viewTime);

    viewTimeout = setTimeout(() => {
      console.log(
        `View timeout expired for level ${currentLevelData.level}. Hiding overlay and maze walls.`
      );
      clearInterval(viewTimerInterval);
      viewTimerBarContainer.classList.add("hidden");
      mazeVisible = false;
      if (messageOverlay) {
        messageOverlay.classList.add("hidden");
        console.log("Overlay hidden class added.");
      } else {
        console.error("messageOverlay element not found!");
      }

      canvas.classList.add("maze-fading");
      setTimeout(() => canvas.classList.remove("maze-fading"), 300);

      console.log("About to play background music (uzicko.wav).");
      playBackgroundMusic();
      startGameTimer();
      gameActive = true;
      if (controlsContainer) controlsContainer.style.display = "";
      drawMaze();
    }, currentLevelData.viewTime);
  }

  function resizeCanvas() {
    const maze = currentLevelData.maze;
    const mazeWidth = maze[0].length;
    const mazeHeight = maze.length;

    const isMobile = window.innerWidth <= 600;
    const mobileVerticalPadding = 0;
    const availableWidth = isMobile
      ? window.innerWidth
      : canvas.parentElement.clientWidth * 0.9;
    const availableHeight = isMobile
      ? window.innerHeight - mobileVerticalPadding
      : window.innerHeight * 0.7;

    const maxCellSizeW = Math.floor(availableWidth / mazeWidth);
    const maxCellSizeH = Math.floor(availableHeight / mazeHeight);

    const maxAllowedCellSize = isMobile ? 50 : 30;
    cellSize = Math.max(
      5,
      Math.min(maxCellSizeW, maxCellSizeH, maxAllowedCellSize)
    );
    playerSize = cellSize * 0.6;

    canvas.width = mazeWidth * cellSize;
    canvas.height = mazeHeight * cellSize;

    console.log(
      `Resized canvas to: ${canvas.width}x${canvas.height}, CellSize: ${cellSize}, Available H: ${availableHeight}, Available W: ${availableWidth}`
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

  function drawMaze() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const maze = currentLevelData.maze;

    for (let y = 0; y < maze.length; y++) {
      for (let x = 0; x < maze[y].length; x++) {
        if (maze[y][x] === 1) {
          if (mazeVisible) {
            ctx.fillStyle = wallColor;
          } else {
            ctx.fillStyle = pathColor;
          }
        } else {
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
            ctx.fillStyle = pathColor;
          }
        }

        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
      }
    }
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

  function movePlayer(dx, dy) {
    if (!gameActive) return;

    const nextX = playerPos.x + dx;
    const nextY = playerPos.y + dy;

    if (
      nextX < 0 ||
      nextX >= currentLevelData.maze[0].length ||
      nextY < 0 ||
      nextY >= currentLevelData.maze.length
    ) {
      return;
    }

    if (currentLevelData.maze[nextY][nextX] === 1) {
      isMuted = localStorage.getItem("mazeGameMuted") === "true";
      if (collisionSound && !isMuted) {
        stopCollisionSound();
        collisionSound.currentTime = 0;
        collisionSound
          .play()
          .then(() => {
            console.log("Playing collision sound...");
            collisionSoundTimeout = setTimeout(() => {
              if (collisionSound && !collisionSound.paused) {
                collisionSound.pause();
                collisionSound.currentTime = 0;
                console.log("Collision sound stopped after 6 seconds.");
              }
              collisionSoundTimeout = null;
            }, 6000);
          })
          .catch((e) =>
            console.error("Greška pri puštanju collision zvuka:", e)
          );
      } else if (isMuted) {
        console.log("Collision sound muted.");
      }
      handleCollision();
      return;
    }

    playerPos.x = nextX;
    playerPos.y = nextY;

    drawMaze();

    if (
      playerPos.x === currentLevelData.end.x &&
      playerPos.y === currentLevelData.end.y
    ) {
      stopCollisionSound();
      isMuted = localStorage.getItem("mazeGameMuted") === "true";
      if (winSound && !isMuted) {
        winSound.currentTime = 0;
        winSound
          .play()
          .catch((e) => console.error("Greška pri puštanju win zvuka:", e));
      } else if (isMuted) {
        console.log("Win sound muted.");
      }
      handleWin();
    }
  }

  function handleCollision() {
    gameActive = false;
    if (controlsContainer) controlsContainer.style.display = "none";

    if (document.body) {
      document.body.classList.add("screen-shake");
      requestAnimationFrame(() => {
        setTimeout(() => {
          if (document.body) {
            document.body.classList.remove("screen-shake");
          }
        }, 350);
      });
    }

    clearInterval(gameTimerInterval);
    pauseBackgroundMusic();
    attempts++;
    attemptsDisplay.textContent = attempts;

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
    nextLevelBtn.classList.add("hidden");
    backToMenuWinBtn.classList.add("hidden");
    messageOverlay.classList.remove("hidden");
  }

  function handleWin() {
    gameActive = false;
    if (controlsContainer) controlsContainer.style.display = "none";
    clearInterval(gameTimerInterval);
    pauseBackgroundMusic();
    const level = currentLevelData.level;

    const endX = currentLevelData.end.x * cellSize;
    const endY = currentLevelData.end.y * cellSize;
    const flashColor = "#FFFF00";
    let flashCount = 0;
    const maxFlashes = 4;
    const flashInterval = 100;

    const flashEffect = setInterval(() => {
      ctx.clearRect(endX, endY, cellSize, cellSize);
      ctx.fillStyle = pathColor;
      ctx.fillRect(endX, endY, cellSize, cellSize);
      ctx.fillStyle = endColor;
      ctx.fillRect(endX, endY, cellSize, cellSize);
      if (
        playerPos.x === currentLevelData.end.x &&
        playerPos.y === currentLevelData.end.y
      ) {
        drawPlayer();
      }

      if (flashCount % 2 === 0) {
        ctx.fillStyle = flashColor;
        ctx.globalAlpha = 0.7;
        ctx.fillRect(endX, endY, cellSize, cellSize);
        ctx.globalAlpha = 1.0;
      }

      flashCount++;
      if (flashCount >= maxFlashes) {
        clearInterval(flashEffect);
        ctx.clearRect(endX, endY, cellSize, cellSize);
        ctx.fillStyle = pathColor;
        ctx.fillRect(endX, endY, cellSize, cellSize);
        ctx.fillStyle = endColor;
        ctx.fillRect(endX, endY, cellSize, cellSize);
        drawPlayer();
        displayWinMessage(level);
      }
    }, flashInterval);
  }

  function displayWinMessage(level) {
    const levelStats = userData.progress.levels[level] || {
      bestTime: null,
      attempts: 0,
    };
    levelStats.attempts = attempts + 1;
    if (levelStats.bestTime === null || elapsedTime < levelStats.bestTime) {
      levelStats.bestTime = elapsedTime;
    }
    userData.progress.levels[level] = levelStats;

    if (level >= userData.progress.currentLevel) {
      userData.progress.currentLevel = level + 1;
    }

    let newAchievements = [];
    const achievementKeyLevel = `Level ${level} Complete`;
    if (!userData.achievements.includes(achievementKeyLevel)) {
      userData.achievements.push(achievementKeyLevel);
      newAchievements.push(achievementKeyLevel);
    }

    window.mazeGame.updateUserData(currentUser, {
      progress: userData.progress,
      achievements: userData.achievements,
    });

    let winMsg = `Nivo ${level} pređen za ${(elapsedTime / 1000).toFixed(2)}s!`;
    if (newAchievements.length > 0) {
      winMsg += `\nNova dostignuća: ${newAchievements.join(", ")}`;
    }
    messageText.textContent = winMsg;

    nextLevelBtn.classList.add("hidden");
    restartLevelBtn.classList.add("hidden");
    backToMenuWinBtn.classList.add("hidden");

    if (currentLevelIndex < levels.length - 1) {
      nextLevelBtn.classList.remove("hidden");
    } else {
      messageText.textContent += "\nČestitamo, prešli ste sve nivoe!";
      backToMenuWinBtn.classList.remove("hidden");
    }

    messageOverlay.classList.remove("hidden");
  }

  function startGameTimer() {
    startTime = Date.now();
    elapsedTime = 0;
    timerDisplay.textContent = "0.0";

    gameTimerInterval = setInterval(() => {
      elapsedTime = Date.now() - startTime;
      timerDisplay.textContent = (elapsedTime / 1000).toFixed(1);
    }, 100);
  }

  function startVisualTimer(duration) {
    if (!viewTimerBar || !viewTimerBarContainer) return;

    const startTime = Date.now();
    viewTimerBar.style.width = "100%";
    viewTimerBarContainer.classList.remove("hidden");

    viewTimerInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, duration - elapsed);
      const percentage = (remaining / duration) * 100;
      viewTimerBar.style.width = `${percentage}%`;

      if (remaining <= 0) {
        clearInterval(viewTimerInterval);
      }
    }, 50);
  }

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
    e.preventDefault();
  });

  window.addEventListener("resize", () => {
    if (currentLevelData) {
      resizeCanvas();
      updateThemeColors();
      drawMaze();
    }
  });

  canvas.addEventListener(
    "touchstart",
    (e) => {
      e.preventDefault();
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
    },
    { passive: false }
  );

  canvas.addEventListener(
    "touchmove",
    (e) => {
      e.preventDefault();
      touchEndX = e.changedTouches[0].screenX;
      touchEndY = e.changedTouches[0].screenY;
    },
    { passive: false }
  );

  canvas.addEventListener("touchend", (e) => {
    touchEndX = e.changedTouches[0].screenX;
    touchEndY = e.changedTouches[0].screenY;
    handleSwipe();
  });

  function handleSwipe() {
    if (!gameActive) return;

    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (Math.abs(deltaX) > swipeThreshold) {
        if (deltaX > 0) {
          console.log("Swipe Right");
          movePlayer(1, 0);
        } else {
          console.log("Swipe Left");
          movePlayer(-1, 0);
        }
      }
    } else {
      if (Math.abs(deltaY) > swipeThreshold) {
        if (deltaY > 0) {
          console.log("Swipe Down");
          movePlayer(0, 1);
        } else {
          console.log("Swipe Up");
          movePlayer(0, -1);
        }
      }
    }

    touchStartX = 0;
    touchStartY = 0;
    touchEndX = 0;
    touchEndY = 0;
  }

  if (btnUp) btnUp.addEventListener("click", () => movePlayer(0, -1));
  if (btnDown) btnDown.addEventListener("click", () => movePlayer(0, 1));
  if (btnLeft) btnLeft.addEventListener("click", () => movePlayer(-1, 0));
  if (btnRight) btnRight.addEventListener("click", () => movePlayer(1, 0));

  nextLevelBtn.addEventListener("click", () => {
    stopCollisionSound();
    if (winSound && !winSound.paused) {
      winSound.pause();
      winSound.currentTime = 0;
      console.log("Win sound stopped by Next Level button.");
    }
    if (controlsContainer) controlsContainer.style.display = "none";
    backToMenuWinBtn.classList.add("hidden");
    currentLevelIndex++;
    if (currentLevelIndex < levels.length) {
      loadLevel(currentLevelIndex);
    } else {
      alert("Prešli ste sve nivoe!");
      window.location.href = "index.html";
    }
  });

  restartLevelBtn.addEventListener("click", () => {
    stopCollisionSound();
    if (winSound && !winSound.paused) {
      winSound.pause();
      winSound.currentTime = 0;
      console.log("Win sound stopped by Restart Level button.");
    }
    if (controlsContainer) controlsContainer.style.display = "none";
    backToMenuWinBtn.classList.add("hidden");
    loadLevel(currentLevelIndex);
  });

  backToMenuBtn.addEventListener("click", () => {
    stopCollisionSound();
    pauseBackgroundMusic();
    if (winSound && !winSound.paused) {
      winSound.pause();
      winSound.currentTime = 0;
      console.log("Win sound stopped by Back to Menu button.");
    }
    if (controlsContainer) controlsContainer.style.display = "none";
    window.location.href = "index.html";
  });

  const themeToggleGame = document.getElementById("theme-toggle-game");
  if (themeToggleGame) {
    themeToggleGame.addEventListener("click", () => {
      const currentTheme = document.body.getAttribute("data-theme") || "light";
      const newTheme = currentTheme === "light" ? "dark" : "light";
      window.mazeGame.applyTheme(newTheme);

      updateThemeColors();
      drawMaze();

      isMuted = localStorage.getItem("mazeGameMuted") === "true";
      applyMuteStateToGameSounds(isMuted);
    });
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      pauseBackgroundMusic();
    } else {
      isMuted = localStorage.getItem("mazeGameMuted") === "true";
      if (gameActive && !isMuted) {
        playBackgroundMusic();
      }
    }
  });

  backToMenuWinBtn.addEventListener("click", () => {
    stopCollisionSound();
    pauseBackgroundMusic();
    if (winSound && !winSound.paused) {
      winSound.pause();
      winSound.currentTime = 0;
      console.log("Win sound stopped by Back to Menu (Win) button.");
    }
    if (controlsContainer) controlsContainer.style.display = "none";
    window.location.href = "index.html";
  });

  initGame();

  function stopCollisionSound() {
    if (collisionSoundTimeout) {
      clearTimeout(collisionSoundTimeout);
      collisionSoundTimeout = null;
    }
    if (collisionSound && !collisionSound.paused) {
      collisionSound.pause();
      collisionSound.currentTime = 0;
      console.log("Collision sound stopped.");
    }
  }

  function playBackgroundMusic() {
    isMuted = localStorage.getItem("mazeGameMuted") === "true";
    if (backgroundMusic && !isMuted) {
      if (backgroundMusic.paused) {
        backgroundMusic.currentTime = 49;
        backgroundMusic
          .play()
          .catch((e) =>
            console.error("Greška pri puštanju pozadinske muzike:", e)
          );
        console.log("Playing background music from 49s.");
      } else {
        console.log("Background music already playing.");
      }
    } else if (isMuted) {
      console.log("Background music muted.");
      pauseBackgroundMusic();
    }
  }

  function pauseBackgroundMusic() {
    if (backgroundMusic && !backgroundMusic.paused) {
      backgroundMusic.pause();
      console.log("Background music paused.");
    }
  }

  window.addEventListener("storage", (event) => {
    if (event.key === "mazeGameMuted") {
      console.log("Mute state changed in another tab/window.");
      const newMuteState = event.newValue === "true";
      applyMuteStateToGameSounds(newMuteState);
    }
  });
});
