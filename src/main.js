import { GameEngine } from './game/GameEngine.js';
import { sound } from './game/SoundManager.js';

// Game state variables
let gameEngine = null;
let currentLevel = 1;
let unlockedLevel = 1;
const totalLevels = 4;

const CITY_NAMES = {
  1: "MUMBAI",
  2: "DELHI",
  3: "PUNE",
  4: "BANGALORE"
};

// DOM Elements
const screens = {
  home: document.getElementById('home-screen'),
  levels: document.getElementById('levels-screen'),
  hud: document.getElementById('hud-screen'),
  pause: document.getElementById('pause-screen'),
  gameOver: document.getElementById('game-over-screen'),
  levelClear: document.getElementById('level-clear-screen'),
  howToPlay: document.getElementById('how-to-play-screen')
};

// Initialize localStorage progress
function initProgress() {
  const storedUnlocked = localStorage.getItem('bharatrush_unlocked_level');
  if (storedUnlocked) {
    unlockedLevel = parseInt(storedUnlocked);
  } else {
    localStorage.setItem('bharatrush_unlocked_level', '1');
    unlockedLevel = 1;
  }

  // Refresh Highscores on level cards
  for (let lvl = 1; lvl <= totalLevels; lvl++) {
    const hs = localStorage.getItem(`bharatrush_high_score_${lvl}`) || '0';
    const hsEl = document.getElementById(`hs-${lvl}`);
    if (hsEl) hsEl.textContent = hs;
  }

  updateLevelCardsUI();
}

function updateLevelCardsUI() {
  for (let lvl = 1; lvl <= totalLevels; lvl++) {
    const card = document.getElementById(`card-level-${lvl}`);
    if (!card) continue;

    const playBtn = card.querySelector('.btn-level-play');

    if (lvl <= unlockedLevel) {
      card.classList.remove('locked');
      card.classList.add('unlocked');
      
      const lockOverlay = card.querySelector('.lock-overlay');
      if (lockOverlay) lockOverlay.style.display = 'none';

      if (playBtn) {
        playBtn.removeAttribute('disabled');
        playBtn.textContent = 'TRAVEL';
        playBtn.onclick = () => launchLevel(lvl);
      }
    } else {
      card.classList.remove('unlocked');
      card.classList.add('locked');

      const lockOverlay = card.querySelector('.lock-overlay');
      if (lockOverlay) lockOverlay.style.display = 'flex';

      if (playBtn) {
        playBtn.setAttribute('disabled', 'true');
        playBtn.textContent = 'LOCKED';
      }
    }
  }
}

// Show a specific UI screen
function showScreen(activeScreen) {
  // Hide all screens
  Object.values(screens).forEach(screen => {
    if (screen) screen.classList.remove('active');
  });

  // Show active screen
  if (activeScreen) {
    activeScreen.classList.add('active');
  }
}

// Launches level
function launchLevel(levelNum) {
  currentLevel = levelNum;
  showScreen(screens.hud);

  // Close modals
  screens.pause.classList.remove('active');
  screens.gameOver.classList.remove('active');
  screens.levelClear.classList.remove('active');

  // Display initial HUD values
  const cityNameEl = document.getElementById('hud-city-name');
  if (cityNameEl) cityNameEl.textContent = CITY_NAMES[levelNum] || "MUMBAI";

  // Lazy initialise audio context on interaction
  sound.init();
  sound.startBGM();

  // Instantiate Game Engine if not present
  if (!gameEngine) {
    gameEngine = new GameEngine('game-canvas', {
      onScoreUpdate: handleScoreUpdate,
      onCoinsUpdate: handleCoinsUpdate,
      onGameOver: handleGameOver,
      onLevelClear: handleLevelClear
    });
  }

  // Load level configuration and start
  gameEngine.initLevel(levelNum);
  gameEngine.start();
}

// HUD Calbacks
function handleScoreUpdate(score, targetScore) {
  const scoreEl = document.getElementById('hud-score');
  if (scoreEl) {
    scoreEl.textContent = String(score).padStart(4, '0');
  }

  // Progress Bar
  const progressEl = document.getElementById('hud-progress-bar');
  if (progressEl) {
    const percentage = Math.min(100, (score / targetScore) * 100);
    progressEl.style.width = `${percentage}%`;
  }

  const targetScoreEl = document.getElementById('hud-target-score');
  if (targetScoreEl) {
    targetScoreEl.textContent = targetScore;
  }
}

function handleCoinsUpdate(coins) {
  const coinsEl = document.getElementById('hud-coins');
  if (coinsEl) {
    coinsEl.textContent = coins;
  }
}

function handleGameOver(score, coins, reason) {
  sound.stopBGM();

  // Show stats in game over popup
  document.getElementById('go-score').textContent = score;
  document.getElementById('go-coins').textContent = coins;
  document.getElementById('crashed-reason').textContent = reason;

  // Manage highscores
  const storedHighScoreStr = localStorage.getItem(`bharatrush_high_score_${currentLevel}`) || '0';
  const storedHighScore = parseInt(storedHighScoreStr);
  const hsBadge = document.getElementById('new-high-score-tag');

  if (score > storedHighScore) {
    localStorage.setItem(`bharatrush_high_score_${currentLevel}`, String(score));
    // Update card display
    const hsEl = document.getElementById(`hs-${currentLevel}`);
    if (hsEl) hsEl.textContent = score;
    
    if (hsBadge) hsBadge.classList.remove('hidden');
  } else {
    if (hsBadge) hsBadge.classList.add('hidden');
  }

  screens.gameOver.classList.add('active');
}

function handleLevelClear(score, coins) {
  sound.stopBGM();
  sound.playUnlock();

  document.getElementById('clear-score').textContent = score;
  document.getElementById('clear-coins').textContent = coins;

  // Save score progress
  const storedHighScoreStr = localStorage.getItem(`bharatrush_high_score_${currentLevel}`) || '0';
  const storedHighScore = parseInt(storedHighScoreStr);
  if (score > storedHighScore) {
    localStorage.setItem(`bharatrush_high_score_${currentLevel}`, String(score));
    const hsEl = document.getElementById(`hs-${currentLevel}`);
    if (hsEl) hsEl.textContent = score;
  }

  // Unlock next level
  if (currentLevel < totalLevels) {
    const nextLevel = currentLevel + 1;
    if (nextLevel > unlockedLevel) {
      unlockedLevel = nextLevel;
      localStorage.setItem('bharatrush_unlocked_level', String(unlockedLevel));
      updateLevelCardsUI();
    }
    // Enable "Next Level" button
    const nextBtn = document.getElementById('btn-clear-next');
    if (nextBtn) {
      nextBtn.textContent = 'NEXT CITY';
      nextBtn.onclick = () => launchLevel(nextLevel);
    }
  } else {
    // Game completed (All levels cleared)
    const nextBtn = document.getElementById('btn-clear-next');
    if (nextBtn) {
      nextBtn.textContent = 'VICTORY HOME';
      nextBtn.onclick = () => quitToMenu();
    }
  }

  screens.levelClear.classList.add('active');
}

function quitToMenu() {
  sound.stopBGM();
  if (gameEngine) {
    gameEngine.cleanupGameplay();
  }
  
  // Close modals
  screens.pause.classList.remove('active');
  screens.gameOver.classList.remove('active');
  screens.levelClear.classList.remove('active');
  
  showScreen(screens.home);
}

// Bind Button Event Listeners
function setupUIListeners() {
  // Play latest unlocked level from menu
  document.getElementById('btn-play-now').onclick = () => {
    launchLevel(unlockedLevel);
  };

  // Navigate to Level Select screen
  document.getElementById('btn-show-levels').onclick = () => {
    showScreen(screens.levels);
  };

  // Back to main menu from Levels Grid
  document.getElementById('btn-back-to-home').onclick = () => {
    showScreen(screens.home);
  };

  // Instructions Modals
  document.getElementById('btn-how-to-play').onclick = () => {
    screens.howToPlay.classList.add('active');
  };
  document.getElementById('btn-close-how').onclick = () => {
    screens.howToPlay.classList.remove('active');
  };

  // Pause Gameplay
  document.getElementById('btn-pause-game').onclick = () => {
    if (gameEngine && gameEngine.isPlaying) {
      gameEngine.pause();
      sound.stopBGM();

      document.getElementById('pause-score').textContent = gameEngine.score;
      document.getElementById('pause-coins').textContent = gameEngine.coins;
      screens.pause.classList.add('active');
    }
  };

  // Pause actions
  document.getElementById('btn-resume').onclick = () => {
    screens.pause.classList.remove('active');
    sound.startBGM();
    if (gameEngine) gameEngine.resume();
  };

  document.getElementById('btn-pause-restart').onclick = () => {
    launchLevel(currentLevel);
  };

  document.getElementById('btn-pause-home').onclick = () => {
    quitToMenu();
  };

  // Game over actions
  document.getElementById('btn-go-restart').onclick = () => {
    launchLevel(currentLevel);
  };

  document.getElementById('btn-go-home').onclick = () => {
    quitToMenu();
  };

  // Level Clear actions
  document.getElementById('btn-clear-home').onclick = () => {
    quitToMenu();
  };
}

// Run initializers when DOM is fully loaded
window.addEventListener('DOMContentLoaded', () => {
  initProgress();
  setupUIListeners();
});
