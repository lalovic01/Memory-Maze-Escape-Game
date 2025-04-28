document.addEventListener("DOMContentLoaded", () => {
  // --- Global Namespace ---
  window.mazeGame = window.mazeGame || {};

  // --- DOM Elements ---
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
  const toggleSoundBtn = document.getElementById("toggle-sound-btn"); // Novo dugme

  // --- Sound Elements (index.html specific) ---
  const leaderboardSound = document.getElementById("leaderboard-sound");
  const startSound = document.getElementById("start-sound");
  const indexAudioElements = [leaderboardSound, startSound].filter(Boolean); // Filtriraj null ako neki ne postoji

  // --- State ---
  let currentUser = null;
  let isMuted = localStorage.getItem("mazeGameMuted") === "true"; // Učitaj stanje

  // --- Initialization ---
  function initApp() {
    // Apply theme
    const savedTheme = localStorage.getItem("mazeGameTheme") || "light";
    applyTheme(savedTheme);

    // Apply initial mute state
    applyMuteState(isMuted);

    // Check login status
    currentUser = getCurrentUser();
    if (currentUser) {
      showMenu();
    } else {
      showAuth();
    }
  }

  // --- Sound Control ---
  function applyMuteState(muted) {
    isMuted = muted;
    // Ažuriraj ikonicu dugmeta
    if (toggleSoundBtn) {
      toggleSoundBtn.textContent = muted ? "🔇" : "🔊";
    }
    // Ažuriraj sve audio elemente na ovoj stranici
    indexAudioElements.forEach((audio) => {
      if (audio) audio.muted = muted;
    });
    // Sačuvaj stanje u localStorage
    localStorage.setItem("mazeGameMuted", muted);
    console.log("Sound state updated:", muted ? "Muted" : "Unmuted");
  }

  // Funkcija za puštanje zvuka uz proveru mute stanja
  function playSound(audioElement) {
    // Proveri direktno iz localStorage jer je ovo globalna funkcija
    const currentlyMuted = localStorage.getItem("mazeGameMuted") === "true";
    if (audioElement && !currentlyMuted) {
      audioElement.currentTime = 0; // Premotaj na početak
      audioElement
        .play()
        .catch((e) => console.error("Greška pri puštanju zvuka:", e));
    }
  }
  // Izloži playSound globalno ako je potrebno iz game.js (mada game.js može sam da proveri localStorage)
  // window.mazeGame.playSound = playSound;

  // --- Authentication ---
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
    // Clear message after a few seconds
    setTimeout(() => {
      if (targetElement.textContent === message) {
        // Clear only if message hasn't changed
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
      password, // U realnoj aplikaciji, lozinka bi trebalo da bude heširana!
      progress: {
        currentLevel: 1,
        levels: {}, // { 1: { bestTime: null, attempts: 0 }, ... }
      },
      achievements: [], // ["Level 1 Complete", "Perfect Run (Level 1)"]
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

  // --- UI Updates ---
  const stopLeaderboardSound = () => {
    if (leaderboardSound && !leaderboardSound.paused) {
      console.log("Attempting to stop leaderboard sound."); // Log: Pokušaj zaustavljanja
      leaderboardSound.pause();
      leaderboardSound.currentTime = 0; // Reset for next time
      console.log("Leaderboard sound stopped."); // Log: Uspešno zaustavljen
    } else if (leaderboardSound && leaderboardSound.paused) {
      // console.log("Leaderboard sound was already paused."); // Opcioni log
    } else {
      // console.log("Leaderboard sound element not found or not playing."); // Opcioni log
    }
  };

  const stopStartSound = () => {
    if (startSound && !startSound.paused) {
      console.log("Attempting to stop start sound (menu)."); // Log: Pokušaj zaustavljanja
      startSound.pause();
      startSound.currentTime = 0; // Reset for next time
      console.log("Start sound (menu) stopped."); // Log: Uspešno zaustavljen
    } else if (startSound && startSound.paused) {
      // console.log("Start sound (menu) was already paused."); // Opcioni log
    } else {
      // console.log("Start sound (menu) element not found or not playing."); // Opcioni log
    }
  };

  function showAuth() {
    stopLeaderboardSound(); // Stop sound if returning from leaderboard to auth
    stopStartSound(); // Stop start sound if logging out
    if (authSection) authSection.classList.remove("hidden");
    if (menuSection) menuSection.classList.add("hidden");
    if (leaderboardSection) leaderboardSection.classList.add("hidden");
    if (achievementsSection) achievementsSection.classList.add("hidden");
    if (loginForm) loginForm.reset();
    showMessage("");
    if (themeToggle) themeToggle.classList.remove("hidden"); // Pokaži theme toggle na auth
    if (toggleSoundBtn) toggleSoundBtn.classList.add("hidden"); // Sakrij sound toggle na auth
  }

  function showMenu() {
    console.log("showMenu function called."); // Log: Ulazak u funkciju
    stopLeaderboardSound(); // Stop sound when returning to menu
    const username = getCurrentUser();
    if (!username) {
      showAuth();
      return;
    }
    if (authSection) authSection.classList.add("hidden");
    if (menuSection) menuSection.classList.remove("hidden");
    if (leaderboardSection) leaderboardSection.classList.add("hidden");
    if (achievementsSection) achievementsSection.classList.add("hidden");
    if (welcomeUsername) welcomeUsername.textContent = username;

    // Play start sound when menu appears
    if (startSound) {
      console.log("Start sound element found:", startSound); // Log: Element pronađen
      startSound.currentTime = 0;
      startSound
        .play()
        .then(() => {
          console.log("Start sound (menu) playing successfully."); // Log: Uspešno pušteno
        })
        .catch((e) => {
          console.error("Greška pri puštanju start zvuka (menu):", e); // Log: Greška
          // Dodatni log za proveru putanje
          console.log("Attempted to play sound from src:", startSound.src);
        });
    } else {
      console.error("Start sound element NOT found!"); // Log: Element nije pronađen
    }
    if (themeToggle) themeToggle.classList.remove("hidden"); // Pokaži theme toggle u meniju
    if (toggleSoundBtn) toggleSoundBtn.classList.remove("hidden"); // Pokaži sound toggle u meniju
  }

  function showLeaderboard() {
    console.log("showLeaderboard function called."); // Log: Function entry
    stopStartSound(); // Stop start sound when going to leaderboard
    if (menuSection) menuSection.classList.add("hidden");
    if (achievementsSection) achievementsSection.classList.add("hidden"); // Hide achievements too
    if (leaderboardSection) leaderboardSection.classList.remove("hidden");
    populateLeaderboard();
    // Play sound
    if (leaderboardSound) {
      console.log("Leaderboard sound element found:", leaderboardSound); // Log: Element found
      leaderboardSound.currentTime = 0;
      leaderboardSound
        .play()
        .then(() => {
          console.log("Leaderboard sound playing successfully."); // Log: Playback started
        })
        .catch((e) => {
          console.error("Greška pri puštanju leaderboard zvuka:", e); // Log: Playback error
          // Dodatni log za proveru putanje
          console.log(
            "Attempted to play sound from src:",
            leaderboardSound.src
          );
        });
    } else {
      console.error("Leaderboard sound element NOT found!"); // Log: Element not found
    }
    if (themeToggle) themeToggle.classList.add("hidden"); // Sakrij theme toggle na leaderboard
    if (toggleSoundBtn) toggleSoundBtn.classList.add("hidden"); // Sakrij sound toggle na leaderboard
  }

  function showAchievements() {
    console.log("showAchievements function called."); // Log: Ulazak u funkciju
    stopStartSound(); // Stop start sound when going to achievements
    stopLeaderboardSound(); // Stop leaderboard sound if switching to achievements
    if (menuSection) menuSection.classList.add("hidden");
    if (leaderboardSection) leaderboardSection.classList.add("hidden"); // Hide leaderboard
    if (achievementsSection) achievementsSection.classList.remove("hidden"); // Show achievements
    populateAchievements();
    // Nema puštanja zvuka ovde
    if (themeToggle) themeToggle.classList.add("hidden"); // Sakrij theme toggle na achievements
    if (toggleSoundBtn) toggleSoundBtn.classList.add("hidden"); // Sakrij sound toggle na achievements
  }

  // --- Leaderboard ---
  const populateLeaderboard = () => {
    if (!leaderboardTableBody) return;

    leaderboardTableBody.innerHTML = ""; // Clear previous entries
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

    // Sort by level (desc), then bestTime (asc)
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
      row.insertCell(2).textContent = (entry.bestTime / 1000).toFixed(2); // ms to seconds
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

  // --- Achievements ---
  const populateAchievements = () => {
    if (!achievementsList) return;

    achievementsList.innerHTML = ""; // Clear previous entries
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

  // --- Reset Progress ---
  const handleResetProgress = () => {
    const username = getCurrentUser();
    if (!username) return; // Should not happen if button is visible only when logged in

    const confirmation = confirm(
      "Da li ste sigurni da želite da resetujete sav progres? Ovo će obrisati vaša najbolja vremena, pokušaje, dostignuća i vratiti vas na Nivo 1."
    );

    if (confirmation) {
      const users = getUsers();
      const userIndex = users.findIndex((user) => user.username === username);
      if (userIndex !== -1) {
        // Reset progress and achievements
        users[userIndex].progress = {
          currentLevel: 1,
          levels: {}, // Empty the level stats
        };
        users[userIndex].achievements = []; // Clear achievements

        saveUsers(users);
        // Update the userData variable in game.js if it's running (though unlikely from menu)
        // If game.js is loaded, its userData might become stale. Reloading the page or game is safest.
        console.log(`Progres za korisnika ${username} je resetovan.`);
        showMessage("Progres uspešno resetovan!", false, menuMessage); // Show message in menu
        // Optionally, update UI elements immediately if needed, though starting game will reflect changes.
      } else {
        console.error("Korisnik nije pronađen za resetovanje progresa.");
        showMessage("Greška pri resetovanju progresa.", true, menuMessage);
      }
    } else {
      showMessage("Resetovanje progresa otkazano.", false, menuMessage);
    }
  };

  // --- Theme Toggle ---
  function applyTheme(theme) {
    document.body.setAttribute("data-theme", theme);
    localStorage.setItem("mazeGameTheme", theme);
    if (themeToggle) {
      // Optional: Change button text/icon based on theme
      // themeToggle.textContent = theme === 'light' ? 'Dark Mode' : 'Light Mode';
    }
  }
  window.mazeGame.applyTheme = applyTheme; // Expose for game.js

  // --- Event Listeners ---
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
      playSound(startSound); // Koristi novu funkciju
      // Malo odlaganje pre preusmeravanja da bi se zvuk čuo
      setTimeout(() => {
        window.location.href = "game.html";
      }, 150); // 150ms odlaganje
    });
  }
  if (leaderboardBtn) {
    leaderboardBtn.addEventListener("click", showLeaderboard);
  }
  if (achievementsBtn) {
    achievementsBtn.addEventListener("click", showAchievements);
  }
  if (resetProgressBtn) {
    resetProgressBtn.addEventListener("click", () => {
      stopStartSound(); // Explicitly stop sound on reset click
      handleResetProgress();
    });
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
  // Listener za novo dugme za zvuk
  if (toggleSoundBtn) {
    toggleSoundBtn.addEventListener("click", () => {
      applyMuteState(!isMuted); // Toggle i primeni novo stanje
    });
  }

  // --- Global User Data Access (for game.js) ---
  // Expose functions to window scope or use a shared object if preferred
  window.mazeGame = {
    getCurrentUser,
    getUserData,
    updateUserData,
    getUsers, // For potential global leaderboard updates if needed elsewhere
    applyTheme, // Allow game.js to apply theme if needed on load
  };

  // --- Run Init ---
  initApp();

  // --- Initial State ---
  if (getCurrentUser()) {
    showMenu();
  } else {
    showAuth();
  }
});
