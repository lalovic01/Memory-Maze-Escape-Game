document.addEventListener("DOMContentLoaded", () => {
  window.mazeGame = window.mazeGame || {};

  const loginForm = document.getElementById("login-form");
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const registerBtn = document.getElementById("register-btn");
  const authMessage = document.getElementById("auth-message");
  const authSection = document.getElementById("auth-section");
  const menuSection = document.getElementById("menu-section");
  const welcomeUsername = document.getElementById("welcome-username");
  const startGameBtn = document.getElementById("start-game-btn");
  const leaderboardBtn = document.getElementById("leaderboard-btn");
  const achievementsBtn = document.getElementById("achievements-btn");
  const resetProgressBtn = document.getElementById("reset-progress-btn");
  const logoutBtn = document.getElementById("logout-btn");
  const menuMessage = document.getElementById("menu-message");
  const leaderboardSection = document.getElementById("leaderboard-section");
  const leaderboardTableBody = document.querySelector(
    "#leaderboard-table tbody"
  );
  const achievementsSection = document.getElementById("achievements-section");
  const achievementsList = document.getElementById("achievements-list");
  const backToMenuBtns = document.querySelectorAll(".back-to-menu");
  const themeToggle = document.getElementById("theme-toggle");
  const toggleSoundBtn = document.getElementById("toggle-sound-btn");
  const howToPlayBtn = document.getElementById("how-to-play-btn");
  const howToPlaySection = document.getElementById("how-to-play-section");

  const leaderboardSound = document.getElementById("leaderboard-sound");
  const startSound = document.getElementById("start-sound");
  const indexAudioElements = [leaderboardSound, startSound].filter(Boolean);

  let currentUser = null;
  let isMuted = localStorage.getItem("mazeGameMuted") === "true";

  function initApp() {
    const savedTheme = localStorage.getItem("mazeGameTheme") || "light";
    applyTheme(savedTheme);

    applyMuteState(isMuted);

    currentUser = getCurrentUser();
    if (currentUser) {
      showMenu();
    } else {
      showAuth();
    }
  }

  function applyMuteState(muted) {
    isMuted = muted;
    if (toggleSoundBtn) {
      toggleSoundBtn.textContent = muted ? "🔇" : "🔊";
    }
    indexAudioElements.forEach((audio) => {
      if (audio) audio.muted = muted;
    });
    localStorage.setItem("mazeGameMuted", muted);
    console.log(
      "applyMuteState called. New state:",
      muted ? "Muted" : "Unmuted"
    );

    const menuIsVisible =
      menuSection && !menuSection.classList.contains("hidden");

    if (!muted && menuIsVisible) {
      console.log(
        "Unmute condition met (no interaction check). Attempting to play start sound via playSound."
      );
      playSound(startSound);
    }
  }

  function playSound(audioElement) {
    const soundSrc = audioElement?.src || "unknown";
    console.log(`playSound called for: ${soundSrc}`);

    const currentlyMuted = localStorage.getItem("mazeGameMuted") === "true";

    if (audioElement && !currentlyMuted) {
      console.log(`Attempting audioElement.play() for ${soundSrc}`);
      audioElement.currentTime = 0;
      const playPromise = audioElement.play();
      if (playPromise !== undefined) {
        playPromise
          .then((_) => {})
          .catch((error) => {
            console.error(
              `Greška pri puštanju zvuka (${soundSrc}): ${error.name}`,
              error
            );
          });
      }
    } else if (audioElement && currentlyMuted) {
      console.log(`Sound muted, not playing: ${soundSrc}`);
    } else if (!audioElement) {
      console.warn(`playSound called with null audioElement.`);
    }
  }
  const getUsers = () => {
    return JSON.parse(localStorage.getItem("mazeGameUsers") || "[]");
  };

  const saveUsers = (users) => {
    localStorage.setItem("mazeGameUsers", JSON.stringify(users));
  };

  const getCurrentUser = () => {
    return localStorage.getItem("mazeGameCurrentUser");
  };

  const setCurrentUser = (username) => {
    if (username) {
      localStorage.setItem("mazeGameCurrentUser", username);
    } else {
      localStorage.removeItem("mazeGameCurrentUser");
    }
  };

  const getUserData = (username) => {
    const users = getUsers();
    return users.find((user) => user.username === username);
  };

  const updateUserData = (username, data) => {
    const users = getUsers();
    const userIndex = users.findIndex((user) => user.username === username);
    if (userIndex !== -1) {
      users[userIndex] = { ...users[userIndex], ...data };
      saveUsers(users);
    }
  };

  const showMessage = (
    message,
    isError = false,
    targetElement = authMessage
  ) => {
    if (!targetElement) return;
    targetElement.textContent = message;
    targetElement.style.color = isError ? "red" : "green";
    setTimeout(() => {
      if (targetElement.textContent === message) {
        targetElement.textContent = "";
      }
    }, 4000);
  };

  const handleRegister = () => {
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (!username || !password) {
      showMessage("Korisničko ime i lozinka su obavezni.", true);
      return;
    }

    const users = getUsers();
    if (users.some((user) => user.username === username)) {
      showMessage("Korisničko ime već postoji.", true);
      return;
    }

    const newUser = {
      username,
      password,
      progress: {
        currentLevel: 1,
        levels: {},
      },
      achievements: [],
    };
    users.push(newUser);
    saveUsers(users);
    showMessage("Registracija uspešna! Možete se ulogovati.", false);
    loginForm.reset();
  };

  const handleLogin = (event) => {
    event.preventDefault();
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (!username || !password) {
      showMessage("Korisničko ime i lozinka su obavezni.", true);
      return;
    }

    const users = getUsers();
    const user = users.find(
      (user) => user.username === username && user.password === password
    );

    if (user) {
      setCurrentUser(username);
      showMessage("Login uspešan!", false);
      showMenu();
    } else {
      showMessage("Pogrešno korisničko ime ili lozinka.", true);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    showAuth();
  };

  const stopLeaderboardSound = () => {
    if (leaderboardSound && !leaderboardSound.paused) {
      console.log("Attempting to stop leaderboard sound.");
      leaderboardSound.pause();
      leaderboardSound.currentTime = 0;
      console.log("Leaderboard sound stopped.");
    }
  };

  const stopStartSound = () => {
    if (startSound && !startSound.paused) {
      console.log("Attempting to stop start sound (menu).");
      startSound.pause();
      startSound.currentTime = 0;
      console.log("Start sound (menu) stopped.");
    }
  };

  function showAuth() {
    stopLeaderboardSound();
    stopStartSound();
    if (authSection) authSection.classList.remove("hidden");
    if (menuSection) menuSection.classList.add("hidden");
    if (leaderboardSection) leaderboardSection.classList.add("hidden");
    if (achievementsSection) achievementsSection.classList.add("hidden");
    if (howToPlaySection) howToPlaySection.classList.add("hidden");
    if (loginForm) loginForm.reset();
    showMessage("");
    if (themeToggle) themeToggle.classList.remove("hidden");
    if (toggleSoundBtn) toggleSoundBtn.classList.add("hidden");
  }

  function showMenu() {
    console.log("showMenu function called.");
    stopLeaderboardSound();
    stopStartSound();
    const username = getCurrentUser();
    if (!username) {
      showAuth();
      return;
    }
    if (authSection) authSection.classList.add("hidden");
    if (menuSection) menuSection.classList.remove("hidden");
    if (leaderboardSection) leaderboardSection.classList.add("hidden");
    if (achievementsSection) achievementsSection.classList.add("hidden");
    if (howToPlaySection) howToPlaySection.classList.add("hidden");
    if (welcomeUsername) welcomeUsername.textContent = username;

    console.log("showMenu calling playSound(startSound)");
    playSound(startSound);

    if (themeToggle) themeToggle.classList.remove("hidden");
    if (toggleSoundBtn) toggleSoundBtn.classList.remove("hidden");
  }

  function showLeaderboard() {
    console.log("showLeaderboard function called.");
    stopStartSound();
    if (menuSection) menuSection.classList.add("hidden");
    if (achievementsSection) achievementsSection.classList.add("hidden");
    if (howToPlaySection) howToPlaySection.classList.add("hidden");
    if (leaderboardSection) leaderboardSection.classList.remove("hidden");
    populateLeaderboard();
    playSound(leaderboardSound);
    if (themeToggle) themeToggle.classList.add("hidden");
    if (toggleSoundBtn) toggleSoundBtn.classList.add("hidden");
  }

  function showAchievements() {
    console.log("showAchievements function called.");
    stopStartSound();
    stopLeaderboardSound();
    if (menuSection) menuSection.classList.add("hidden");
    if (leaderboardSection) leaderboardSection.classList.add("hidden");
    if (howToPlaySection) howToPlaySection.classList.add("hidden");
    if (achievementsSection) achievementsSection.classList.remove("hidden");
    populateAchievements();
    if (themeToggle) themeToggle.classList.add("hidden");
    if (toggleSoundBtn) toggleSoundBtn.classList.add("hidden");
  }

  function showHowToPlay() {
    console.log("showHowToPlay function called.");
    stopStartSound();
    stopLeaderboardSound();
    if (menuSection) menuSection.classList.add("hidden");
    if (leaderboardSection) leaderboardSection.classList.add("hidden");
    if (achievementsSection) achievementsSection.classList.add("hidden");
    if (howToPlaySection) howToPlaySection.classList.remove("hidden");
    if (themeToggle) themeToggle.classList.add("hidden");
    if (toggleSoundBtn) toggleSoundBtn.classList.add("hidden");
  }

  const populateLeaderboard = () => {
    if (!leaderboardTableBody) return;

    leaderboardTableBody.innerHTML = "";
    const users = getUsers();
    const leaderboardData = [];

    users.forEach((user) => {
      Object.entries(user.progress.levels).forEach(([level, data]) => {
        if (data.bestTime !== null) {
          leaderboardData.push({
            username: user.username,
            level: parseInt(level),
            bestTime: data.bestTime,
            attempts: data.attempts,
          });
        }
      });
    });

    leaderboardData.sort((a, b) => {
      if (a.level !== b.level) {
        return b.level - a.level;
      }
      return a.bestTime - b.bestTime;
    });

    leaderboardData.forEach((entry) => {
      const row = leaderboardTableBody.insertRow();
      row.insertCell(0).textContent = entry.username;
      row.insertCell(1).textContent = entry.level;
      row.insertCell(2).textContent = (entry.bestTime / 1000).toFixed(2);
      row.insertCell(3).textContent = entry.attempts;
    });
    if (leaderboardData.length === 0) {
      const row = leaderboardTableBody.insertRow();
      const cell = row.insertCell(0);
      cell.textContent = "Nema rezultata.";
      cell.colSpan = 4;
      cell.style.textAlign = "center";
    }
  };

  const populateAchievements = () => {
    if (!achievementsList) return;

    achievementsList.innerHTML = "";
    const username = getCurrentUser();
    const userData = getUserData(username);

    if (userData && userData.achievements && userData.achievements.length > 0) {
      userData.achievements.forEach((achievement) => {
        const li = document.createElement("li");
        li.textContent = achievement;
        achievementsList.appendChild(li);
      });
    } else {
      const li = document.createElement("li");
      li.textContent = "Nema dostignuća još uvek.";
      achievementsList.appendChild(li);
    }
  };

  const handleResetProgress = () => {
    const username = getCurrentUser();
    if (!username) return;

    stopStartSound();
    stopLeaderboardSound();

    const confirmation = confirm(
      "Da li ste sigurni da želite da resetujete sav progres? Ovo će obrisati vaša najbolja vremena, pokušaje, dostignuća i vratiti vas na Nivo 1."
    );

    if (confirmation) {
      const users = getUsers();
      const userIndex = users.findIndex((user) => user.username === username);
      if (userIndex !== -1) {
        users[userIndex].progress = {
          currentLevel: 1,
          levels: {},
        };
        users[userIndex].achievements = [];

        saveUsers(users);

        console.log(`Progres za korisnika ${username} je resetovan.`);
        showMessage("Progres uspešno resetovan!", false, menuMessage);
        showMenu();
      } else {
        console.error("Korisnik nije pronađen za resetovanje progresa.");
        showMessage("Greška pri resetovanju progresa.", true, menuMessage);
        showMenu();
      }
    } else {
      showMessage("Resetovanje progresa otkazano.", false, menuMessage);
      showMenu();
    }
  };

  function applyTheme(theme) {
    document.body.setAttribute("data-theme", theme);
    localStorage.setItem("mazeGameTheme", theme);
    if (themeToggle) {
      themeToggle.textContent = theme === "light" ? "Dark Mode" : "Light Mode";
    }
  }
  window.mazeGame.applyTheme = applyTheme;

  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin);
  }
  if (registerBtn) {
    registerBtn.addEventListener("click", handleRegister);
  }
  if (logoutBtn) {
    logoutBtn.addEventListener("click", handleLogout);
  }
  if (startGameBtn) {
    startGameBtn.addEventListener("click", () => {
      stopStartSound();
      playSound(startSound);
      setTimeout(() => {
        window.location.href = "game.html";
      }, 150);
    });
  }
  if (leaderboardBtn) {
    leaderboardBtn.addEventListener("click", showLeaderboard);
  }
  if (achievementsBtn) {
    achievementsBtn.addEventListener("click", showAchievements);
  }
  if (howToPlayBtn) {
    howToPlayBtn.addEventListener("click", showHowToPlay);
  }
  if (resetProgressBtn) {
    resetProgressBtn.addEventListener("click", handleResetProgress);
  }
  backToMenuBtns.forEach((btn) => {
    btn.addEventListener("click", showMenu);
  });
  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const currentTheme = document.body.getAttribute("data-theme") || "light";
      applyTheme(currentTheme === "light" ? "dark" : "light");
    });
  }
  if (toggleSoundBtn) {
    toggleSoundBtn.addEventListener("click", () => {
      applyMuteState(!isMuted);
    });
  }

  window.mazeGame = {
    getCurrentUser,
    getUserData,
    updateUserData,
    getUsers,
    applyTheme,
    playSound,
  };

  initApp();

  if (getCurrentUser()) {
    showMenu();
  } else {
    showAuth();
  }
});
