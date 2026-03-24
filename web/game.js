if ('speechSynthesis' in window) {
  speechSynthesis.onvoiceschanged = () => {
    speechSynthesis.getVoices();
  };
}

let audioContext = null;
let audioInitialized = false;

async function initAudio() {
  if (audioInitialized) return;
  
  try {
    if (window.AudioContext || window.webkitAudioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      console.log('Web Audio API已初始化, state:', audioContext.state);
    }
    
    audioInitialized = true;
    console.log('音频系统已初始化');
    
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance('');
      utterance.volume = 0;
      speechSynthesis.speak(utterance);
    }
  } catch (e) {
    console.log('音频系统初始化失败:', e);
  }
}

function playBeep(frequency = 800, duration = 0.1, volume = 0.3) {
  console.log('playBeep called, frequency:', frequency);
  
  initAudio();
  
  if (!audioContext) {
    console.log('audioContext not available');
    return;
  }
  
  if (audioContext.state === 'suspended') {
    audioContext.resume().then(() => {
      console.log('AudioContext resumed, state:', audioContext.state);
      playOscillator(frequency, duration, volume);
    }).catch(e => {
      console.log('AudioContext resume failed:', e);
    });
  } else {
    playOscillator(frequency, duration, volume);
  }
}

function playOscillator(frequency, duration, volume) {
  if (!audioContext) {
    console.log('playOscillator: audioContext is null');
    return;
  }
  
  try {
    console.log('playOscillator: creating oscillator, audioContext.state:', audioContext.state);
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    gainNode.gain.value = volume;
    
    oscillator.start();
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    oscillator.stop(audioContext.currentTime + duration);
    
    console.log('Web Audio音效已播放, frequency:', frequency);
  } catch (e) {
    console.log('playOscillator error:', e);
  }
}

function initAudioOnUserInteraction() {
  console.log('initAudioOnUserInteraction called');
  initAudio();
  
  if (audioContext) {
    if (audioContext.state === 'suspended') {
      audioContext.resume().then(() => {
        console.log('AudioContext resumed on user interaction, state:', audioContext.state);
        playOscillator(440, 0.01, 0.01);
      }).catch(e => {
        console.log('AudioContext resume failed:', e);
      });
    } else {
      console.log('AudioContext already running, state:', audioContext.state);
    }
  }
}

document.addEventListener('click', initAudioOnUserInteraction);
document.addEventListener('touchstart', initAudioOnUserInteraction);
document.addEventListener('touchend', initAudioOnUserInteraction);

async function lockScreenOrientation() {
  try {
    if (screen.orientation && screen.orientation.lock) {
      await screen.orientation.lock('landscape');
      console.log('屏幕方向已锁定为横屏');
    }
  } catch (err) {
    console.log('屏幕方向锁定失败:', err);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  lockScreenOrientation();
});

if (screen.orientation) {
  screen.orientation.addEventListener('change', () => {
    console.log('屏幕方向变化:', screen.orientation.type);
  });
}

let wakeLock = null;

async function requestWakeLock() {
  try {
    if ('wakeLock' in navigator) {
      wakeLock = await navigator.wakeLock.request('screen');
      console.log('屏幕常亮已启用');
      
      wakeLock.addEventListener('release', () => {
        console.log('屏幕常亮已释放');
      });
    }
  } catch (err) {
    console.log('屏幕常亮请求失败:', err);
  }
}

async function releaseWakeLock() {
  if (wakeLock) {
    await wakeLock.release();
    wakeLock = null;
  }
}

document.addEventListener('visibilitychange', async () => {
  if (document.visibilityState === 'visible') {
    await requestWakeLock();
  }
});

document.addEventListener('DOMContentLoaded', () => {
  requestWakeLock();
});

const CARD_COLORS = {
  red: ['上', '丘', '化', '七', '尔', '八', '佳', '福'],
  green: ['大', '乙', '三', '十', '小', '九', '作', '禄'],
  black: ['人', '己', '千', '土', '生', '子', '亡', '寿']
};

const CARD_SENTENCES = {
  '上': 1, '大': 1, '人': 1,
  '丘': 2, '乙': 2, '己': 2,
  '化': 3, '三': 3, '千': 3,
  '七': 4, '十': 4, '土': 4,
  '尔': 5, '小': 5, '生': 5,
  '八': 6, '九': 6, '子': 6,
  '佳': 7, '作': 7, '亡': 7,
  '福': 8, '禄': 8, '寿': 8
};

const CARD_POSITIONS = {
  '上': 0, '大': 1, '人': 2,
  '丘': 0, '乙': 1, '己': 2,
  '化': 0, '三': 1, '千': 2,
  '七': 0, '十': 1, '土': 2,
  '尔': 0, '小': 1, '生': 2,
  '八': 0, '九': 1, '子': 2,
  '佳': 0, '作': 1, '亡': 2,
  '福': 0, '禄': 1, '寿': 2
};

const CARD_PINYIN = {
  '上': 'shang', '大': 'da', '人': 'ren',
  '丘': 'qiu', '乙': 'yi', '己': 'ji',
  '化': 'hua', '三': 'san', '千': 'qian',
  '七': 'qi', '十': 'shi', '土': 'tu',
  '尔': 'er', '小': 'xiao', '生': 'sheng',
  '八': 'ba', '九': 'jiu', '子': 'zi',
  '佳': 'jia', '作': 'zuo', '亡': 'wang',
  '福': 'fu', '禄': 'lu', '寿': 'shou'
};

const SPECIAL_CARDS = ['上', '福'];

let gameState = {
  deck: [],
  players: [
    { id: 'player1', name: '玩家1', type: 'ai', hand: [], melds: [], discards: [], score: 0, piao: 0, isTing: false },
    { id: 'me', name: '我', type: 'human', hand: [], melds: [], discards: [], score: 0, piao: 0, isTing: false },
    { id: 'player2', name: '玩家2', type: 'ai', hand: [], melds: [], discards: [], score: 0, piao: 0, isTing: false }
  ],
  currentPlayerIndex: 0,
  dealerIndex: 0,
  roundNumber: 0,
  sessionNumber: 1,
  lastDiscardedCard: null,
  lastDiscardPlayerIndex: -1,
  lastDrawnCard: null,
  selectedCardIndex: -1,
  countdown: 120,
  countdownTimer: null,
  isMyTurn: false,
  waitingForResponse: false,
  canChi: false,
  canPeng: false,
  canZhao: false,
  canHu: false,
  skipDraw: false,
  isDrawing: false,
  baseScore: 5,
  multiplierBase: 2,
  playerVoices: ['female', 'male', 'female']
};

function selectOption(type, value) {
  gameState[type] = value;
  
  const buttonsContainer = document.getElementById(`${type}Buttons`);
  const buttons = buttonsContainer.querySelectorAll('.option-btn');
  buttons.forEach(btn => {
    btn.classList.toggle('selected', parseInt(btn.dataset.value) === value);
  });
}

function getCardColor(char) {
  if (CARD_COLORS.red.includes(char)) return 'red';
  if (CARD_COLORS.green.includes(char)) return 'green';
  return 'black';
}

function isSpecialCard(char) {
  return SPECIAL_CARDS.includes(char);
}

function createDeck() {
  const deck = [];
  const chars = Object.keys(CARD_SENTENCES);
  for (const char of chars) {
    for (let i = 0; i < 4; i++) {
      deck.push({
        id: `${char}-${deck.length}`,
        character: char,
        sentence: CARD_SENTENCES[char],
        position: CARD_POSITIONS[char],
        color: getCardColor(char),
        isSpecial: isSpecialCard(char)
      });
    }
  }
  return deck;
}

function shuffleDeck(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function sortHand(hand) {
  return hand.sort((a, b) => {
    if (a.sentence !== b.sentence) return a.sentence - b.sentence;
    return a.position - b.position;
  });
}

function validateCardCounts() {
  const counts = {};
  const chars = ['上', '大', '人', '丘', '乙', '己', '化', '三', '千', '七', '十', '土', '尔', '小', '生', '八', '九', '子', '佳', '作', '亡', '福', '禄', '寿'];
  for (const char of chars) {
    counts[char] = { hand: 0, melds: 0, discards: 0, deck: 0, total: 0 };
  }
  
  for (const player of gameState.players) {
    for (const card of player.hand) {
      counts[card.character].hand++;
      counts[card.character].total++;
    }
    for (const meld of player.melds) {
      for (const card of meld.cards) {
        counts[card.character].melds++;
        counts[card.character].total++;
      }
    }
    for (const card of player.discards) {
      counts[card.character].discards++;
      counts[card.character].total++;
    }
  }
  
  for (const card of gameState.deck) {
    counts[card.character].deck++;
    counts[card.character].total++;
  }
  
  console.log('=== 牌数验证 ===');
  let hasError = false;
  for (const char of chars) {
    if (counts[char].total !== 4) {
      console.error(`【错误】${char}: 总数=${counts[char].total} (手牌:${counts[char].hand}, 组合牌:${counts[char].melds}, 弃牌:${counts[char].discards}, 牌堆:${counts[char].deck})`);
      hasError = true;
    }
  }
  if (!hasError) {
    console.log('所有牌数量正确');
  }
  return hasError;
}

async function enterFullscreenAndLockOrientation() {
  try {
    const docEl = document.documentElement;
    
    if (docEl.requestFullscreen) {
      await docEl.requestFullscreen();
    } else if (docEl.webkitRequestFullscreen) {
      await docEl.webkitRequestFullscreen();
    } else if (docEl.mozRequestFullScreen) {
      await docEl.mozRequestFullScreen();
    } else if (docEl.msRequestFullscreen) {
      await docEl.msRequestFullscreen();
    }
    
    console.log('已进入全屏模式');
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    if (screen.orientation && screen.orientation.lock) {
      try {
        await screen.orientation.lock('landscape');
        console.log('屏幕方向已锁定为横屏');
      } catch (e) {
        console.log('屏幕方向锁定不支持:', e);
      }
    }
    
    return true;
  } catch (err) {
    console.log('全屏模式失败:', err);
    return false;
  }
}

function startGame() {
  initAudio();
  
  // 先隐藏开始屏幕
  document.getElementById('startScreen').classList.add('hidden');
  
  // 尝试进入全屏和锁定方向，但不等待结果
  enterFullscreenAndLockOrientation().catch(err => {
    console.log('全屏或锁定方向失败:', err);
  });
  
  // 直接开始游戏
  startRound();
}

let piaoCountdown = 30;
let piaoCountdownTimer = null;
let currentPiaoPlayerIndex = 0;

function showPiaoScreen() {
  currentPiaoPlayerIndex = gameState.dealerIndex;
  showPlayerPiaoScreen();
}

function showPlayerPiaoScreen() {
  const player = gameState.players[currentPiaoPlayerIndex];

  const playerIds = ['player1', 'my', 'player2'];
  const playerId = playerIds[currentPiaoPlayerIndex];
  
  console.log('showPlayerPiaoScreen - currentPiaoPlayerIndex:', currentPiaoPlayerIndex, 'playerId:', playerId);
  
  const piaoPopup = document.getElementById(`${playerId}PiaoPopup`);
  
  if (!piaoPopup) {
    console.error('Missing piao popup element');
    return;
  }
  
  piaoPopup.classList.remove('hidden');
  
  if (player.type === 'ai') {
    setTimeout(() => {
      const piaoOptions = [0, 5, 10, 20];
      const randomIndex = Math.floor(Math.random() * piaoOptions.length);
      const piao = piaoOptions[randomIndex];
      player.piao = piao;
      updatePlayerPiaoBadge(currentPiaoPlayerIndex);
      setTimeout(() => {
        piaoPopup.classList.add('hidden');
        moveToNextPiaoPlayer();
      }, 500);
    }, 800);
  } else {
    console.log('Showing piao options for human player');
    // 启动30秒倒计时
    piaoCountdown = 30;
    if (piaoCountdownTimer) {
      clearInterval(piaoCountdownTimer);
    }
    piaoCountdownTimer = setInterval(() => {
      piaoCountdown--;
      console.log('飘分倒计时:', piaoCountdown);
      if (piaoCountdown <= 0) {
        clearInterval(piaoCountdownTimer);
        piaoCountdownTimer = null;
        // 超时自动选择飘0分
        setPiao(0);
      }
    }, 1000);
  }
}

function updatePlayerPiaoBadge(playerIndex) {
  console.log('=== updatePlayerPiaoBadge ===');
  console.log('playerIndex:', playerIndex);
  
  const player = gameState.players[playerIndex];
  const playerIds = ['player1', 'my', 'player2'];
  const playerId = playerIds[playerIndex];
  
  console.log('playerId:', playerId);
  console.log('player.piao:', player.piao);
  
  const piaoBadge = document.getElementById(`${playerId}Piao`);
  console.log('piaoBadge element:', piaoBadge);
  console.log('All elements with Piao:', document.querySelectorAll('[id$="Piao"]'));
  
  console.log('=== 界面元素ID列表 ===');
  console.log('玩家1名字:', document.getElementById('player1Name'));
  console.log('玩家1飘分:', document.getElementById('player1Piao'));
  console.log('玩家1倒计时:', document.getElementById('player1Timer'));
  console.log('玩家2名字:', document.getElementById('player2Name'));
  console.log('玩家2飘分:', document.getElementById('player2Piao'));
  console.log('玩家2倒计时:', document.getElementById('player2Timer'));
  console.log('我的名字:', document.getElementById('myName'));
  console.log('我的飘分:', document.getElementById('myPiao'));
  console.log('我的倒计时:', document.getElementById('myTimer'));
  
  if (piaoBadge) {
    if (player.piao > 0) {
      piaoBadge.textContent = `飘${player.piao}分`;
      piaoBadge.classList.remove('hidden');
      
      if (player.piao === 5) {
        piaoBadge.style.background = 'linear-gradient(145deg, #4a90e2, #357abd)';
      } else if (player.piao === 10) {
        piaoBadge.style.background = 'linear-gradient(145deg, #f5a623, #e09000)';
      } else if (player.piao === 20) {
        piaoBadge.style.background = 'linear-gradient(145deg, #ff6b6b, #e55555)';
      }
    } else {
      piaoBadge.textContent = '';
      piaoBadge.classList.remove('hidden');
      piaoBadge.style.background = 'linear-gradient(145deg, #6c757d, #5a6268)';
    }
    console.log('piaoBadge updated, textContent:', piaoBadge.textContent);
    console.log('piaoBadge classes:', piaoBadge.className);
  } else {
    console.error('piaoBadge not found for playerId:', playerId);
    console.log('Trying to find element with querySelector:', document.querySelector(`#${playerId}Piao`));
  }
}

function updatePiaoCountdown() {
  const countdownEl = document.getElementById('piaoCountdown');
  if (countdownEl) {
    countdownEl.textContent = piaoCountdown > 0 ? `${piaoCountdown}秒` : '';
  }
}

function setPiao(piao) {
  console.log('setPiao called with:', piao, 'currentPiaoPlayerIndex:', currentPiaoPlayerIndex);
  
  if (piaoCountdownTimer) {
    clearInterval(piaoCountdownTimer);
    piaoCountdownTimer = null;
  }
  
  const player = gameState.players[currentPiaoPlayerIndex];
  if (!player) {
    console.error('找不到当前玩家');
    return;
  }
  player.piao = piao;
  
  const playerIds = ['player1', 'my', 'player2'];
  const playerId = playerIds[currentPiaoPlayerIndex];
  const piaoPopup = document.getElementById(`${playerId}PiaoPopup`);
  
  updatePlayerPiaoBadge(currentPiaoPlayerIndex);
  
  setTimeout(() => {
    if (piaoPopup) {
      piaoPopup.classList.add('hidden');
    }
    moveToNextPiaoPlayer();
  }, 300);
}

function moveToNextPiaoPlayer() {
  console.log('moveToNextPiaoPlayer - 当前索引:', currentPiaoPlayerIndex, '庄家索引:', gameState.dealerIndex);
  
  currentPiaoPlayerIndex = (currentPiaoPlayerIndex + 1) % 3;
  
  console.log('下一个玩家索引:', currentPiaoPlayerIndex);
  
  if (currentPiaoPlayerIndex === gameState.dealerIndex) {
    console.log('所有玩家已选择飘分，开始发牌');
    startDealingAnimation();
  } else {
    showPlayerPiaoScreen();
  }
}

function startRound() {
  gameState.roundNumber++;
  gameState.deck = shuffleDeck(createDeck());
  gameState.lastDiscardedCard = null;
  gameState.lastDiscardPlayerIndex = -1;
  gameState.selectedCardIndex = -1;
  gameState.isMyTurn = false;
  gameState.waitingForResponse = false;
  
  gameState.playerVoices[0] = Math.random() > 0.5 ? 'male' : 'female';
  gameState.playerVoices[2] = Math.random() > 0.5 ? 'male' : 'female';
  
  const deckStack = document.getElementById('deckStack');
  if (deckStack) {
    deckStack.style.transition = 'none';
    deckStack.style.transform = 'translateY(0)';
  }
  
  const centerArea = document.querySelector('.center-area');
  if (centerArea) {
    centerArea.classList.remove('moved-up');
  }
  
  for (const player of gameState.players) {
    player.hand = [];
    player.melds = [];
    player.discards = [];
    player.piao = 0;
    player.isTing = false;
  }
  
  document.querySelectorAll('.player-piao-badge').forEach(el => {
    el.classList.add('hidden');
  });
  
  updateAvatars();
  document.getElementById('roundNum').textContent = `${gameState.roundNumber}/8`;
  updateDeckStack();
  
  showPiaoScreen();
}

function startDealingAnimation() {
  console.log('开始发牌动画...');
  console.log('牌堆数量:', gameState.deck.length);
  
  document.querySelectorAll('.piao-setting-popup').forEach(el => {
    el.classList.add('hidden');
  });
  
  const overlay = document.getElementById('dealingOverlay');
  const mask = document.getElementById('dealingMask');
  
  if (!overlay || !mask) {
    console.error('找不到发牌遮罩元素');
    finishDealing();
    return;
  }
  
  overlay.style.display = 'flex';
  mask.style.display = 'block';
  
  updateDeckStack();
  
  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;
  
  const targetPositions = {
    0: { x: 60, y: centerY - 73 },
    1: { x: centerX - 17, y: window.innerHeight - 180 },
    2: { x: window.innerWidth - 95, y: centerY - 73 }
  };
  
  const dealerIndex = gameState.dealerIndex;
  const handCounts = [19, 19, 19];
  handCounts[dealerIndex] = 20;
  
  console.log('庄家索引:', dealerIndex, '各玩家手牌数:', handCounts);
  
  let totalDealt = 0;
  const totalCards = 20 + 19 + 19;
  
  const dealNextCard = () => {
    let playerIndex = -1;
    
    for (let i = 0; i < 3; i++) {
      const p = (totalDealt + i) % 3;
      if (gameState.players[p].hand.length < handCounts[p]) {
        playerIndex = p;
        break;
      }
    }
    
    if (playerIndex === -1 || totalDealt >= totalCards) {
      finishDealing();
      return;
    }
    
    const card = gameState.deck.shift();
    if (card) {
      gameState.players[playerIndex].hand.push(card);
      createFlyingCard(centerX, centerY, targetPositions[playerIndex], playerIndex === 1, card);
      updateDeckStack();
    }
    
    totalDealt++;
    
    if (totalDealt < totalCards) {
      setTimeout(dealNextCard, 50);
    } else {
      setTimeout(finishDealing, 200);
    }
  };
  
  setTimeout(dealNextCard, 300);
}

function createFlyingCard(startX, startY, target, reveal, cardData) {
  const card = document.createElement('div');
  card.style.position = 'fixed';
  card.style.left = startX + 'px';
  card.style.top = startY + 'px';
  card.style.width = '35px';
  card.style.height = '147px';
  card.style.borderRadius = '4px';
  card.style.boxShadow = '0 4px 15px rgba(0,0,0,0.5)';
  card.style.zIndex = '9999';
  card.style.pointerEvents = 'none';
  
  if (reveal && cardData) {
    const pinyin = CARD_PINYIN[cardData.character];
    card.style.backgroundImage = `url('images/${pinyin}.png')`;
    card.style.backgroundSize = 'contain';
    card.style.backgroundPosition = 'center';
    card.style.backgroundRepeat = 'no-repeat';
    card.style.backgroundColor = 'transparent';
    card.style.border = 'none';
  } else {
    card.style.backgroundImage = `url('images/back.png')`;
    card.style.backgroundSize = 'contain';
    card.style.backgroundPosition = 'center';
    card.style.backgroundRepeat = 'no-repeat';
  }
  
  document.body.appendChild(card);
  
  setTimeout(() => {
    card.style.transition = 'all 0.2s ease-out';
    card.style.left = target.x + 'px';
    card.style.top = target.y + 'px';
  }, 20);
  
  setTimeout(() => {
    card.remove();
  }, 250);
}

function finishDealing() {
  console.log('完成发牌，整理手牌');
  
  const overlay = document.getElementById('dealingOverlay');
  const mask = document.getElementById('dealingMask');
  
  if (overlay) overlay.style.display = 'none';
  if (mask) mask.style.display = 'none';
  
  const centerArea = document.querySelector('.center-area');
  if (centerArea) {
    centerArea.classList.add('moved-up');
    centerArea.classList.add('dealing-complete');
  }
  
  for (let i = 0; i < gameState.players.length; i++) {
    gameState.players[i].hand = sortHand(gameState.players[i].hand);
    console.log('玩家', i, '手牌数:', gameState.players[i].hand.length);
  }
  
  gameState.currentPlayerIndex = gameState.dealerIndex;
  gameState.lastDrawnCard = null;
  
  renderMyHand();
  
  console.log('=== 发牌完成后的手牌数量 ===');
  for (let i = 0; i < 3; i++) {
    console.log(`玩家${i}(${gameState.players[i].name})手牌数:`, gameState.players[i].hand.length);
    console.log(`玩家${i}(${gameState.players[i].name})手牌:`, gameState.players[i].hand.map(c => c.character).join(''));
  }
  validateCardCounts();
  
  document.getElementById('player1HandCount').textContent = gameState.players[0].hand.length;
  document.getElementById('myHandCount').textContent = gameState.players[1].hand.length;
  document.getElementById('player2HandCount').textContent = gameState.players[2].hand.length;
  
  updateDeckStack();
  
  setTimeout(() => {
    startTurn();
  }, 300);
}

function updateDeckStack() {
  const deckStack = document.getElementById('deckStack');
  const deckCount = gameState.deck.length;
  
  let cardCount = 1;
  if (deckCount >= 60) {
    cardCount = 10;
  } else if (deckCount >= 50) {
    cardCount = 8;
  } else if (deckCount >= 40) {
    cardCount = 7;
  } else if (deckCount >= 30) {
    cardCount = 6;
  } else if (deckCount >= 20) {
    cardCount = 5;
  } else if (deckCount >= 10) {
    cardCount = 4;
  } else if (deckCount >= 5) {
    cardCount = 3;
  } else if (deckCount > 0) {
    cardCount = 2;
  }
  
  let html = '';
  for (let i = 0; i < cardCount; i++) {
    const top = i * 1;
    const left = i * 4;
    const opacity = 0.4 + (i / cardCount) * 0.6;
    const rotate = (Math.random() - 0.5) * 1;
    html += `<div class="deck-card" style="top:${top}px;left:${left}px;opacity:${opacity};transform:rotate(${rotate}deg);"></div>`;
  }
  html += `<span class="deck-count-overlay">${deckCount}</span>`;
  
  deckStack.innerHTML = html;
}

function renderMyHand() {
  const me = gameState.players[1];
  const handEl = document.getElementById('myHand');
  handEl.innerHTML = '';
  
  const sentenceGroups = {};
  for (let i = 0; i < me.hand.length; i++) {
    const card = me.hand[i];
    if (!sentenceGroups[card.sentence]) {
      sentenceGroups[card.sentence] = {};
    }
    if (!sentenceGroups[card.sentence][card.position]) {
      sentenceGroups[card.sentence][card.position] = [];
    }
    sentenceGroups[card.sentence][card.position].push({ card, index: i });
  }
  
  for (let sentence = 1; sentence <= 8; sentence++) {
    if (!sentenceGroups[sentence]) continue;
    
    const groupEl = document.createElement('div');
    groupEl.className = 'sentence-group';
    
    for (let pos = 0; pos <= 2; pos++) {
      if (!sentenceGroups[sentence][pos]) continue;
      
      const cards = sentenceGroups[sentence][pos];
      const stackEl = document.createElement('div');
      stackEl.className = 'card-stack';
      
      const card = cards[0].card;
      const cardEl = createCardImageElement(card);
      
      const isSelected = cards.some(c => c.index === gameState.selectedCardIndex);
      if (isSelected) {
        cardEl.style.transform = 'translateY(-20px)';
        cardEl.style.boxShadow = '0 8px 25px rgba(255,215,0,0.8), 0 0 30px rgba(255,215,0,0.6)';
        cardEl.style.border = '3px solid #ffd700';
        cardEl.style.borderRadius = '6px';
      }
      
      cardEl.onclick = function() { selectCard(cards[0].index); };
      
      function startDrag(clientX, clientY) {
        if (!gameState.isMyTurn) return;
        
        const cardIndex = cards[0].index;
        const cardRect = cardEl.getBoundingClientRect();
        const offsetX = clientX - cardRect.left;
        const offsetY = clientY - cardRect.top;
        
        const dragCard = cardEl.cloneNode(true);
        dragCard.style.position = 'fixed';
        dragCard.style.zIndex = '10000';
        dragCard.style.left = cardRect.left + 'px';
        dragCard.style.top = cardRect.top + 'px';
        dragCard.style.transform = 'none';
        dragCard.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5)';
        dragCard.style.pointerEvents = 'none';
        
        const chuLabel = document.createElement('div');
        chuLabel.textContent = '出';
        chuLabel.style.position = 'absolute';
        chuLabel.style.left = '50%';
        chuLabel.style.top = '50%';
        chuLabel.style.transform = 'translate(-50%, -50%)';
        chuLabel.style.fontSize = '28px';
        chuLabel.style.fontWeight = 'bold';
        chuLabel.style.color = '#fff';
        chuLabel.style.textShadow = '0 0 10px #ff0000, 0 0 20px #ff0000';
        chuLabel.style.zIndex = '10001';
        chuLabel.style.pointerEvents = 'none';
        dragCard.appendChild(chuLabel);
        
        document.body.appendChild(dragCard);
        
        cardEl.style.opacity = '0.3';
        
        return { dragCard, offsetX, offsetY, cardIndex };
      }
      
      function moveDrag(dragCard, clientX, clientY, offsetX, offsetY) {
        dragCard.style.left = (clientX - offsetX) + 'px';
        dragCard.style.top = (clientY - offsetY) + 'px';
      }
      
      function endDrag(dragCard, clientX, clientY) {
        const handRect = handEl.getBoundingClientRect();
        const isOutside = clientY < handRect.top || 
                         clientY > handRect.bottom ||
                         clientX < handRect.left || 
                         clientX > handRect.right;
        
        dragCard.remove();
        cardEl.style.opacity = '';
        
        if (isOutside) {
          gameState.selectedCardIndex = cardIndex;
          discardAction();
        } else {
          renderMyHand();
        }
      }
      
      let dragState = null;
      let cardIndex = null;
      
      cardEl.onmousedown = function(e) {
        e.preventDefault();
        dragState = startDrag(e.clientX, e.clientY);
        cardIndex = dragState.cardIndex;
        
        function onMouseMove(ev) {
          moveDrag(dragState.dragCard, ev.clientX, ev.clientY, dragState.offsetX, dragState.offsetY);
        }
        
        function onMouseUp(ev) {
          document.removeEventListener('mousemove', onMouseMove);
          document.removeEventListener('mouseup', onMouseUp);
          endDrag(dragState.dragCard, ev.clientX, ev.clientY);
          dragState = null;
        }
        
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
      };
      
      cardEl.ontouchstart = function(e) {
        e.preventDefault();
        const touch = e.touches[0];
        dragState = startDrag(touch.clientX, touch.clientY);
        cardIndex = dragState.cardIndex;
      };
      
      cardEl.ontouchmove = function(e) {
        e.preventDefault();
        if (dragState) {
          const touch = e.touches[0];
          moveDrag(dragState.dragCard, touch.clientX, touch.clientY, dragState.offsetX, dragState.offsetY);
        }
      };
      
      cardEl.ontouchend = function(e) {
        e.preventDefault();
        if (dragState) {
          const touch = e.changedTouches[0];
          endDrag(dragState.dragCard, touch.clientX, touch.clientY);
          dragState = null;
        }
      };
      
      cardEl.ontouchcancel = function(e) {
        if (dragState) {
          dragState.dragCard.remove();
          cardEl.style.opacity = '';
          dragState = null;
        }
      };
      
      stackEl.appendChild(cardEl);
      
      if (cards.length > 1) {
        const countEl = document.createElement('div');
        countEl.className = 'card-count';
        countEl.textContent = cards.length;
        stackEl.appendChild(countEl);
      }
      
      groupEl.appendChild(stackEl);
    }
    
    handEl.appendChild(groupEl);
  }
}

function createCardImageElement(card) {
  const div = document.createElement('div');
  const pinyin = CARD_PINYIN[card.character];
  div.style.backgroundImage = `url('images/${pinyin}.png')`;
  div.style.backgroundSize = 'contain';
  div.style.backgroundPosition = 'center';
  div.style.backgroundRepeat = 'no-repeat';
  div.style.width = '40px';
  div.style.height = '168px';
  div.style.cursor = 'pointer';
  div.style.backgroundColor = 'transparent';
  div.style.border = 'none';
  div.style.borderRadius = '4px';
  div.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
  div.dataset.character = card.character;
  return div;
}

function startTurn() {
  console.log('=== 开始回合 ===');
  zimoAnnounced = false;
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const isDealerFirstTurn = gameState.currentPlayerIndex === gameState.dealerIndex && 
                            currentPlayer.hand.length === 20;
  
  console.log('当前玩家:', currentPlayer.name, '类型:', currentPlayer.type);
  console.log('是否庄家首回合:', isDealerFirstTurn);
  console.log('当前玩家手牌数:', currentPlayer.hand.length);
  console.log('牌堆数量:', gameState.deck.length);
  console.log('当前玩家索引:', gameState.currentPlayerIndex);
  console.log('庄家索引:', gameState.dealerIndex);
  console.log('是否是人类玩家:', currentPlayer.type === 'human');
  console.log('是否不是庄家首回合:', !isDealerFirstTurn);
  console.log('牌堆是否不为空:', gameState.deck.length > 0);
  
  gameState.canChi = false;
  gameState.canPeng = false;
  gameState.canZhao = false;
  gameState.canHu = false;
  
  updateCurrentPlayerUI();
  startCountdown();
  
  if (currentPlayer.type === 'human') {
    console.log('>>> 我的回合 <<<');
    gameState.isMyTurn = true;
    
    console.log('摸牌条件检查:');
    console.log('- isDealerFirstTurn:', isDealerFirstTurn);
    console.log('- gameState.deck.length:', gameState.deck.length);
    console.log('- skipDraw:', gameState.skipDraw);
    console.log('- 条件结果:', !gameState.skipDraw && !isDealerFirstTurn && gameState.deck.length > 0);
    
    if (!gameState.skipDraw && !isDealerFirstTurn && gameState.deck.length > 0 && !gameState.isDrawing) {
      console.log('摸牌...');
      console.log('摸牌前手牌数:', currentPlayer.hand.length);
      gameState.isDrawing = true;
      const drawnCard = gameState.deck.pop();
      gameState.lastDrawnCard = drawnCard;
      updateDeckStack();
      
      const tingBadge = document.getElementById('tingBadge');
      const zimoBadge = document.getElementById('zimoBadge');
      tingBadge.classList.add('hidden');
      zimoBadge.classList.add('hidden');
      
      animateDrawCard(1, drawnCard, () => {
        currentPlayer.hand.push(drawnCard);
        currentPlayer.hand = sortHand(currentPlayer.hand);
        renderMyHand();
        gameState.isDrawing = false;
        console.log('摸牌完成，手牌数:', currentPlayer.hand.length);
        
        const tingResult = checkTing(currentPlayer);
        currentPlayer.isTing = tingResult.isTing;
        updateTingBadge();
        
        const huResult = checkHu(currentPlayer);
        if (huResult.canHu && currentPlayer.isTing) {
          console.log('自摸！');
          handleHu(1, 'zimo');
          return;
        }
        
        updateActionButtons();
      });
    } else {
      const reason = gameState.skipDraw ? '碰牌/吃牌后' : (isDealerFirstTurn ? '庄家首回合' : (gameState.isDrawing ? '正在摸牌' : '牌堆为空'));
      console.log('不摸牌，原因:', reason);
      gameState.skipDraw = false;
      gameState.lastDrawnCard = null;
      const tingResult = checkTing(currentPlayer);
      currentPlayer.isTing = tingResult.isTing;
      updateTingBadge();
      updateActionButtons();
    }
  } else {
    console.log('>>> AI回合 <<<');
    gameState.isMyTurn = false;
    setTimeout(() => processAITurn(), 800 + Math.random() * 500);
  }
}

function updateTingBadge() {
  const tingBadge = document.getElementById('tingBadge');
  const zimoBadge = document.getElementById('zimoBadge');
  const me = gameState.players[1];
  
  console.log('updateTingBadge - isTing:', me.isTing);
  console.log('updateTingBadge - tingBadge element:', tingBadge);
  console.log('updateTingBadge - tingBadge has hidden class:', tingBadge.classList.contains('hidden'));
  
  if (me.isTing) {
    tingBadge.classList.remove('hidden');
  } else {
    tingBadge.classList.add('hidden');
  }
  
  console.log('updateTingBadge - after toggle, tingBadge has hidden class:', tingBadge.classList.contains('hidden'));
  
  const huResult = checkHu(me);
  const canZimo = me.isTing && huResult.canHu && gameState.isMyTurn;
  zimoBadge.classList.toggle('hidden', !canZimo);
  
  console.log('updateTingBadge - canZimo:', canZimo, 'huResult.canHu:', huResult.canHu);
  
  if (canZimo) {
    playZimoAnnouncement();
  }
}

let zimoAnnounced = false;

function playZimoAnnouncement() {
  if (zimoAnnounced) return;
  zimoAnnounced = true;
  speakText('自摸');
}

function speakText(text) {
  console.log('speakText called:', text);
  
  if (window.plus && window.plus.speech) {
    console.log('Using 5+ App TTS');
    plus.speech.startSpeak({
      text: text,
      lang: 'zh-CN'
    }, function() {
      console.log('5+ TTS speak success:', text);
    }, function(e) {
      console.log('5+ TTS speak error:', e);
      fallbackSpeak(text);
    });
  } else if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.TextToSpeech) {
    window.Capacitor.Plugins.TextToSpeech.speak({
      text: text,
      lang: 'zh-CN',
      rate: 1.0
    }).then(() => {
      console.log('Native TTS speak success:', text);
    }).catch(e => {
      console.log('Native TTS speak error:', e);
      fallbackSpeak(text);
    });
  } else if ('speechSynthesis' in window) {
    fallbackSpeak(text);
  }
}

function fallbackSpeak(text) {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 1.0;
    speechSynthesis.speak(utterance);
  }
}

function handleZimoClick() {
  const me = gameState.players[1];
  const huResult = checkHu(me);
  if (me.isTing && huResult.canHu && gameState.isMyTurn) {
    handleHu(1, 'zimo');
  }
}

function playDiscardSound(card, playerIndex = 1) {
  console.log('playDiscardSound called, card:', card ? card.character : 'null', 'playerIndex:', playerIndex);
  
  // 确保音频系统已初始化
  initAudio();
  
  try {
    // 播放音效
    playBeep(800, 0.1, 0.3);
    
    // 播放语音
    if (card && card.character) {
      playVoice(card.character, playerIndex);
    }
  } catch (e) {
    console.log('playDiscardSound error:', e);
  }
}

function playVoice(text, playerIndex = 1) {
  console.log('playVoice called - text:', text, 'playerIndex:', playerIndex);
  
  playBeep(600, 0.05, 0.1);
  
  const speakWithNative = () => {
    if (window.plus && window.plus.speech) {
      console.log('Using 5+ App TTS for voice');
      plus.speech.startSpeak({
        text: text,
        lang: 'zh-CN'
      }, function() {
        console.log('5+ TTS voice success:', text);
      }, function(e) {
        console.log('5+ TTS voice error:', e);
        speakWithWeb(text, playerIndex);
      });
    } else if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.TextToSpeech) {
      window.Capacitor.Plugins.TextToSpeech.speak({
        text: text,
        lang: 'zh-CN',
        rate: 0.9
      }).then(() => {
        console.log('Native TTS voice success:', text);
      }).catch(e => {
        console.log('Native TTS voice error:', e);
        speakWithWeb(text, playerIndex);
      });
    } else {
      speakWithWeb(text, playerIndex);
    }
  };
  
  const speakWithWeb = (text, playerIndex) => {
    if (!('speechSynthesis' in window)) {
      console.warn('speechSynthesis not supported');
      return;
    }
    
    try {
      initAudio();
      
      speechSynthesis.cancel();
      
      setTimeout(() => {
        const voices = speechSynthesis.getVoices();
        console.log('Available voices:', voices.length);
        const zhVoices = voices.filter(v => v.lang.includes('zh'));
        console.log('Chinese voices:', zhVoices.length);
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'zh-CN';
        utterance.rate = 0.9;
        utterance.pitch = 0.8;
        utterance.volume = 1.0;
        
        if (zhVoices.length > 0) {
          let selectedVoice;
          const voiceType = gameState.playerVoices[playerIndex] || 'female';
          console.log('Voice type for player', playerIndex, ':', voiceType);
          
          if (voiceType === 'male') {
            selectedVoice = zhVoices.find(v => v.name.includes('Male') || v.name.includes('男')) || zhVoices[0];
          } else {
            selectedVoice = zhVoices.find(v => v.name.includes('Female') || v.name.includes('女')) || zhVoices[0];
          }
          
          if (selectedVoice) {
            utterance.voice = selectedVoice;
            console.log('Selected voice:', selectedVoice.name);
          }
        }
        
        utterance.onstart = () => console.log('Voice started:', text);
        utterance.onerror = (e) => console.error('Voice error:', e);
        
        speechSynthesis.speak(utterance);
        console.log('Voice queued:', text);
      }, 100);
    } catch (e) {
      console.error('playVoice error:', e);
    }
  };
  
  setTimeout(() => {
    speakWithNative();
  }, 100);
}

function startCountdown() {
  stopCountdown();
  gameState.countdown = 120;
  updateCountdownUI();
  
  gameState.countdownTimer = setInterval(() => {
    gameState.countdown--;
    updateCountdownUI();
    
    if (gameState.countdown === 5 && gameState.isMyTurn) {
      speakText('快点吧，我等的花儿都谢了');
    }
    
    if (gameState.countdown <= 0) {
      handleTimeout();
    }
  }, 1000);
}

function stopCountdown() {
  if (gameState.countdownTimer) {
    clearInterval(gameState.countdownTimer);
    gameState.countdownTimer = null;
  }
  gameState.countdown = 0;
  updateCountdownUI();
}

function updateCountdownUI() {
  document.querySelectorAll('.player-timer').forEach(el => {
    el.classList.add('hidden');
    el.classList.remove('warning');
    el.textContent = '';
  });
  
  if (gameState.countdown > 0) {
    let timerEl = null;
    
    if (gameState.waitingForResponse) {
      timerEl = document.getElementById('myTimer');
    } else {
      const timerIds = ['player1Timer', 'myTimer', 'player2Timer'];
      timerEl = document.getElementById(timerIds[gameState.currentPlayerIndex]);
    }
    
    if (timerEl) {
      timerEl.classList.remove('hidden');
      timerEl.textContent = gameState.countdown;
      if (gameState.countdown <= 5) {
        timerEl.classList.add('warning');
      }
    }
  }
}

function handleTimeout() {
  stopCountdown();
  
  if (gameState.waitingForResponse) {
    passAction();
  } else if (gameState.isMyTurn) {
    const me = gameState.players[1];
    
    if (me.hand.length > 0) {
      if (gameState.lastDrawnCard) {
        const lastDrawnIndex = me.hand.findIndex(c => c.id === gameState.lastDrawnCard.id);
        if (lastDrawnIndex !== -1) {
          discardCard(1, lastDrawnIndex);
          return;
        }
      }
      discardCard(1, me.hand.length - 1);
    }
  }
}

function processAITurn() {
  console.log('=== processAITurn ===');
  const player = gameState.players[gameState.currentPlayerIndex];
  const isDealerFirstTurn = gameState.currentPlayerIndex === gameState.dealerIndex && 
                            player.hand.length === 20;
  
  console.log('玩家:', player.name, '手牌数:', player.hand.length, '庄家首回合:', isDealerFirstTurn);
  console.log('skipDraw:', gameState.skipDraw);
  
  if (!gameState.skipDraw && !isDealerFirstTurn && gameState.deck.length > 0) {
    const drawnCard = gameState.deck.pop();
    updateDeckStack();
    
    animateDrawCard(gameState.currentPlayerIndex, drawnCard, () => {
      player.hand.push(drawnCard);
      player.hand = sortHand(player.hand);
      updateUI();
      continueAITurn(player);
    });
  } else {
    gameState.skipDraw = false;
    continueAITurn(player);
  }
}

function continueAITurn(player) {
  const tingResult = checkTing(player);
  player.isTing = tingResult.isTing;
  console.log('听牌:', player.isTing);
  
  const huResult = checkHu(player);
  console.log('胡牌:', huResult.canHu);
  
  if (player.isTing && huResult.canHu) {
    handleHu(gameState.currentPlayerIndex, 'zimo');
    return;
  }
  
  console.log('选择要出的牌...');
  const cardToDiscard = selectAIDiscard(player);
  console.log('选择的牌索引:', cardToDiscard);
  
  discardCard(gameState.currentPlayerIndex, cardToDiscard);
}

function selectAIDiscard(player) {
  const scoredCards = player.hand.map((card, index) => ({
    card,
    index,
    score: evaluateCard(card, player.hand)
  }));
  
  scoredCards.sort((a, b) => a.score - b.score);
  return scoredCards[0].index;
}

function evaluateCard(card, hand) {
  let score = 0;
  
  if (card.isSpecial) score += 100;
  
  const sameCount = hand.filter(c => c.character === card.character).length;
  if (sameCount >= 2) score += 50 * sameCount;
  
  const sentenceCards = hand.filter(c => c.sentence === card.sentence);
  if (sentenceCards.length >= 2) score += 30;
  
  return score;
}

function discardCard(playerIndex, cardIndex) {
  console.log('=== 出牌 ===');
  console.log('玩家索引:', playerIndex, '牌索引:', cardIndex);
  
  const player = gameState.players[playerIndex];
  const card = player.hand[cardIndex];
  
  console.log('出牌:', card.character);
  
  player.hand.splice(cardIndex, 1);
  player.discards.push(card);
  
  gameState.lastDiscardedCard = card;
  gameState.lastDiscardPlayerIndex = playerIndex;
  
  playDiscardSound(card, playerIndex);
  
  animateDiscardCard(playerIndex, card);
  
  if (playerIndex === 1) {
    stopCountdown();
    gameState.isMyTurn = false;
    gameState.selectedCardIndex = -1;
  }
  
  const tingResult = checkTing(player);
  player.isTing = tingResult.isTing;
  
  if (playerIndex === 1) {
    updateTingBadge();
  }
  
  updateUI();
  
  console.log('准备调用checkResponses');
  setTimeout(() => {
    console.log('=== setTimeout回调 ===');
    console.log('调用checkResponses');
    checkResponses();
  }, 400);
}

function animateDiscardCard(playerIndex, card) {
  let startX, startY;
  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;
  
  if (playerIndex === 0) {
    startX = 60;
    startY = centerY - 73;
  } else if (playerIndex === 1) {
    startX = centerX - 17;
    startY = window.innerHeight - 180;
  } else {
    startX = window.innerWidth - 95;
    startY = centerY - 73;
  }
  
  const targetX = centerX - 17;
  const targetY = centerY - 73;
  
  const flyingCard = document.createElement('div');
  flyingCard.style.position = 'fixed';
  flyingCard.style.left = startX + 'px';
  flyingCard.style.top = startY + 'px';
  flyingCard.style.width = '35px';
  flyingCard.style.height = '147px';
  flyingCard.style.borderRadius = '4px';
  flyingCard.style.boxShadow = '0 4px 15px rgba(0,0,0,0.5)';
  flyingCard.style.zIndex = '9999';
  flyingCard.style.pointerEvents = 'none';
  
  if (playerIndex === 1) {
    const pinyin = CARD_PINYIN[card.character];
    flyingCard.style.backgroundImage = `url('images/${pinyin}.png')`;
    flyingCard.style.backgroundSize = 'contain';
    flyingCard.style.backgroundPosition = 'center';
    flyingCard.style.backgroundRepeat = 'no-repeat';
    flyingCard.style.backgroundColor = 'transparent';
    flyingCard.style.border = 'none';
  } else {
    flyingCard.style.backgroundImage = `url('images/mcard.png')`;
    flyingCard.style.backgroundSize = 'contain';
    flyingCard.style.backgroundPosition = 'center';
    flyingCard.style.backgroundRepeat = 'no-repeat';
  }
  
  document.body.appendChild(flyingCard);
  
  setTimeout(() => {
    flyingCard.style.transition = 'all 0.3s ease-out';
    flyingCard.style.left = targetX + 'px';
    flyingCard.style.top = targetY + 'px';
  }, 20);
  
  setTimeout(() => {
    flyingCard.remove();
    showDiscardedCard(playerIndex, card);
  }, 350);
}

function animateDrawCard(playerIndex, card, callback) {
  const deckStack = document.getElementById('deckStack');
  const deckRect = deckStack ? deckStack.getBoundingClientRect() : { left: window.innerWidth / 2, top: window.innerHeight / 2 };
  
  const startX = deckRect.left + deckRect.width / 2 - 17;
  const startY = deckRect.top;
  
  let targetX, targetY;
  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;
  
  if (playerIndex === 0) {
    targetX = 60;
    targetY = centerY - 73;
  } else if (playerIndex === 1) {
    targetX = centerX - 17;
    targetY = window.innerHeight - 180;
  } else {
    targetX = window.innerWidth - 95;
    targetY = centerY - 73;
  }
  
  const flyingCard = document.createElement('div');
  flyingCard.style.position = 'fixed';
  flyingCard.style.left = startX + 'px';
  flyingCard.style.top = startY + 'px';
  flyingCard.style.width = '35px';
  flyingCard.style.height = '147px';
  flyingCard.style.borderRadius = '4px';
  flyingCard.style.boxShadow = '0 4px 15px rgba(0,0,0,0.5)';
  flyingCard.style.zIndex = '9999';
  flyingCard.style.pointerEvents = 'none';
  
  const pinyin = CARD_PINYIN[card.character];
  
  const moLabel = document.createElement('div');
  moLabel.textContent = '摸';
  moLabel.style.position = 'absolute';
  moLabel.style.top = '50%';
  moLabel.style.left = '50%';
  moLabel.style.transform = 'translate(-50%, -50%)';
  moLabel.style.fontSize = '20px';
  moLabel.style.fontWeight = 'bold';
  moLabel.style.color = '#ffd700';
  moLabel.style.textShadow = '0 0 10px rgba(255,215,0,0.8), 0 0 20px rgba(255,0,0,0.6)';
  moLabel.style.background = 'rgba(0,0,0,0.7)';
  moLabel.style.padding = '5px 10px';
  moLabel.style.borderRadius = '8px';
  moLabel.style.border = '2px solid #ffd700';
  moLabel.style.zIndex = '10000';
  
  if (playerIndex === 1) {
    flyingCard.style.backgroundImage = `url('images/${pinyin}.png')`;
    flyingCard.appendChild(moLabel);
  } else {
    flyingCard.style.backgroundImage = `url('images/mcard.png')`;
  }
  flyingCard.style.backgroundSize = 'contain';
  flyingCard.style.backgroundPosition = 'center';
  flyingCard.style.backgroundRepeat = 'no-repeat';
  flyingCard.style.backgroundColor = 'transparent';
  flyingCard.style.border = 'none';
  
  document.body.appendChild(flyingCard);
  
  setTimeout(() => {
    flyingCard.style.transition = 'all 1s ease-out';
    flyingCard.style.left = targetX + 'px';
    flyingCard.style.top = targetY + 'px';
  }, 1000);
  
  setTimeout(() => {
    flyingCard.remove();
    if (callback) callback();
  }, 2050);
}

function showDiscardedCard(playerIndex, card) {
  const playedCardsEl = document.getElementById('playedCards');
  
  if (playedCardsEl) {
    playedCardsEl.innerHTML = '';
    
    const cardEl = document.createElement('div');
    cardEl.className = 'card';
    const pinyin = CARD_PINYIN[card.character];
    cardEl.style.backgroundImage = `url('images/v/${pinyin}.png')`;
    cardEl.style.backgroundSize = 'contain';
    cardEl.style.backgroundPosition = 'center';
    cardEl.style.backgroundRepeat = 'no-repeat';
    cardEl.style.width = '120px';
    cardEl.style.height = '30px';
    cardEl.style.border = 'none';
    cardEl.style.boxShadow = 'none';
    playedCardsEl.appendChild(cardEl);
  }
  
  let discardEl;
  if (playerIndex === 0) {
    discardEl = document.getElementById('player1Discard');
  } else if (playerIndex === 1) {
    discardEl = document.getElementById('myDiscard');
  } else {
    discardEl = document.getElementById('player2Discard');
  }
  
  if (discardEl) {
    const cardEl = createSmallCardElement(card);
    discardEl.appendChild(cardEl);
    
    if (discardEl.children.length > 8) {
      discardEl.removeChild(discardEl.firstChild);
    }
  }
}

function createSmallCardElement(card) {
  const div = document.createElement('div');
  const pinyin = CARD_PINYIN[card.character];
  div.style.backgroundImage = `url('images/s/${pinyin}.png')`;
  div.style.backgroundSize = 'contain';
  div.style.backgroundPosition = 'center';
  div.style.backgroundRepeat = 'no-repeat';
  div.style.width = '20px';
  div.style.height = '84px';
  div.style.cursor = 'default';
  div.dataset.character = card.character;
  return div;
}

function checkResponses() {
  const card = gameState.lastDiscardedCard;
  if (!card) {
    console.log('没有出牌');
    return;
  }
  
  console.log('=== 检查响应 ===');
  console.log('出牌:', card.character, '出牌者索引:', gameState.lastDiscardPlayerIndex);
  
  const responses = [];
  
  for (let i = 0; i < gameState.players.length; i++) {
    if (i === gameState.lastDiscardPlayerIndex) continue;
    
    const player = gameState.players[i];
    const huResult = checkHu(player, card);
    const canHu = player.isTing && huResult.canHu;
    const canZhao = canPlayerZhao(player, card);
    const canPeng = canPlayerPeng(player, card);
    const isNextPlayer = i === (gameState.lastDiscardPlayerIndex + 1) % 3;
    const canChiResult = canPlayerChi(player, card);
    const canChi = isNextPlayer && canChiResult;
    
    console.log('玩家', i, '(', player.name, ') - 胡:', canHu, '招:', canZhao, '碰:', canPeng, '吃:', canChi, '是下家:', isNextPlayer);
    
    responses.push({ playerIndex: i, canHu, canZhao, canPeng, canChi });
  }
  
  const humanResponse = responses.find(r => r.playerIndex === 1);
  console.log('我的响应:', humanResponse);
  console.log('是否有操作:', humanResponse && (humanResponse.canHu || humanResponse.canZhao || humanResponse.canPeng || humanResponse.canChi));
  
  if (humanResponse && (humanResponse.canHu || humanResponse.canZhao || humanResponse.canPeng || humanResponse.canChi)) {
    console.log('>>> 显示操作按钮 <<<');
    gameState.waitingForResponse = true;
    gameState.canHu = humanResponse.canHu;
    gameState.canZhao = humanResponse.canZhao;
    gameState.canPeng = humanResponse.canPeng;
    gameState.canChi = humanResponse.canChi;
    startCountdown();
    updateActionButtons();
    return;
  }
  
  const aiHuResponse = responses.find(r => r.canHu && r.playerIndex !== 1);
  if (aiHuResponse) {
    handleHu(aiHuResponse.playerIndex, 'dianpao');
    return;
  }
  
  const aiZhaoResponse = responses.find(r => r.canZhao && r.playerIndex !== 1);
  if (aiZhaoResponse) {
    performZhao(aiZhaoResponse.playerIndex);
    return;
  }
  
  const aiPengResponse = responses.find(r => r.canPeng && r.playerIndex !== 1);
  if (aiPengResponse && Math.random() > 0.3) {
    performPeng(aiPengResponse.playerIndex);
    return;
  }
  
  console.log('无人响应，进入下一玩家');
  moveToNextPlayer();
}

function canPlayerChi(player, card) {
  const sentenceCards = player.hand.filter(c => c.sentence === card.sentence);
  console.log('吃牌检查 - 牌:', card.character, '句子:', card.sentence, '手牌中同句牌数:', sentenceCards.length, '位置:', card.position);
  
  if (sentenceCards.length < 2) return false;
  
  const positions = new Set(sentenceCards.map(c => c.position));
  console.log('手牌中位置:', ...positions, '出牌位置:', card.position);
  
  if (card.position === 0) return positions.has(1) && positions.has(2);
  if (card.position === 1) return positions.has(0) && positions.has(2);
  if (card.position === 2) return positions.has(0) && positions.has(1);
  
  return false;
}

function canPlayerPeng(player, card) {
  const count = player.hand.filter(c => c.character === card.character).length;
  console.log('碰牌检查 - 玩家:', player.name, '牌:', card.character, '手牌中同字数:', count);
  return count >= 2;
}

function canPlayerZhao(player, card) {
  const count = player.hand.filter(c => c.character === card.character).length;
  console.log('招牌检查 - 玩家:', player.name, '牌:', card.character, '手牌中同字数:', count);
  return count === 3;
}

function checkHu(player, extraCard = null) {
  const hand = extraCard ? [...player.hand, extraCard] : [...player.hand];
  const huCount = calculateHuCount(player.hand, player.melds, extraCard);
  
  const huType = detectHuType(hand, player.melds, huCount);
  
  const timestamp = new Date().toLocaleString();
  console.log('=== 胡牌判断 ===');
  console.log('时间:', timestamp);
  console.log('玩家:', player.name);
  console.log('手牌:', hand.map(c => c.character).join(''));
  console.log('组合牌:', player.melds.map(m => m.cards.map(c => c.character).join('')).join(' | '));
  console.log('总胡数:', huCount);
  console.log('胡牌类型:', huType.name, '(' + huType.type + ')');
  console.log('能否胡牌:', huCount >= 11 && huType.type !== 'none');
  console.log('================');
  
  return {
    canHu: huCount >= 11 && huType.type !== 'none',
    huCount,
    huType
  };
}

function isZhaoUsedInSentence(hand, melds) {
  const zhaoMelds = melds.filter(m => m.type === 'quartet');
  if (zhaoMelds.length === 0) return false;
  
  const allCards = [...hand, ...melds.flatMap(m => m.cards)];
  
  for (const zhaoMeld of zhaoMelds) {
    const zhaoChar = zhaoMeld.cards[0].character;
    const zhaoSentence = zhaoMeld.cards[0].sentence;
    
    const sentenceCards = allCards.filter(c => c.sentence === zhaoSentence);
    const positions = new Set(sentenceCards.map(c => c.position));
    
    if (positions.size === 3) {
      return true;
    }
  }
  
  return false;
}

function detectHuType(hand, melds, huCount) {
  const hasChi = melds.some(m => m.type === 'sequence');
  const hasPeng = melds.some(m => m.type === 'triplet');
  const hasZhao = melds.some(m => m.type === 'quartet');
  
  const effectiveHasZhao = hasZhao && !isZhaoUsedInSentence(hand, melds);
  
  const counts = {};
  for (const card of hand) {
    counts[card.character] = (counts[card.character] || 0) + 1;
  }
  
  const allCards = [...hand, ...melds.flatMap(m => m.cards)];
  const shangCount = allCards.filter(c => c.character === '上').length;
  const fuCount = allCards.filter(c => c.character === '福').length;
  const shangFuCount = shangCount + fuCount;
  const hasShangFu = shangFuCount > 0;
  
  const hasShangDaRen = allCards.some(c => c.sentence === 1);
  const hasFuLuShou = allCards.some(c => c.sentence === 8);
  
  const isKuHu = checkKuHu(hand, melds, effectiveHasZhao);
  const isQingYiSe = checkQingYiSe(allCards);
  const isShiDui = checkShiDui(hand);
  const isHeiYuan = checkHeiYuan(hand, melds, effectiveHasZhao);
  const hongYuanJing = checkHongYuan(hand, melds, effectiveHasZhao);
  const isQingHu = checkQingHu(hand, melds, huCount);
  
  if (isKuHu && huCount === 33) {
    return { type: 'kuChongTaiKa', name: '枯重台卡', multiplier: { dianpao: 12, zimo: 13 } };
  }
  
  if (isKuHu && !hasShangFu && huCount === 22) {
    return { type: 'qingKuTaiKa', name: '清枯台卡', multiplier: { dianpao: 8, zimo: 9 } };
  }
  
  if (isKuHu && !hasShangFu) {
    return { type: 'qingKuHu', name: '清枯胡', multiplier: { dianpao: 6, zimo: 7 } };
  }
  
  if (isKuHu) {
    return { type: 'kuHu', name: '枯胡', multiplier: { dianpao: 5, zimo: 6 } };
  }
  
  if (isShiDui) {
    return { type: 'shiDui', name: '十对', multiplier: { dianpao: 10, zimo: 11 } };
  }
  
  if (hongYuanJing > 0) {
    const baseMultiplier = hongYuanJing + 2;
    return { type: `hongYuan${hongYuanJing}Jing`, name: `红元${hongYuanJing}精`, multiplier: { dianpao: baseMultiplier, zimo: baseMultiplier + 1 } };
  }
  
  if (isHeiYuan) {
    return { type: 'heiYuan', name: '黑元', multiplier: { dianpao: 4, zimo: 5 } };
  }
  
  // 检查清胡条件（除了胡数范围）
  const qingHuConditions = checkQingHuConditions(hand, melds);
  
  // 清卡胡：清胡条件（除了胡数范围）都满足 + 胡数正好11胡
  if (qingHuConditions && huCount === 11) {
    return { type: 'qingKaHu', name: '清卡胡', multiplier: { dianpao: 2, zimo: 3 } };
  }
  
  // 清胡：清胡条件全部满足（包括胡数在11-21之间）
  if (isQingHu) {
    return { type: 'qingHu', name: '清胡', multiplier: { dianpao: 1, zimo: 2 } };
  }
  
  const meetsBasicCondition = checkBasicHuCondition(hand, melds);
  
  if (!meetsBasicCondition) {
    return { type: 'none', name: '无', multiplier: { dianpao: 0, zimo: 0 } };
  }
  
  if (huCount === 11) {
    return { type: 'kaHu', name: '卡胡', multiplier: { dianpao: 1, zimo: 2 } };
  }
  if (huCount >= 12 && huCount <= 21) {
    return { type: 'puTongHu', name: '普通胡', multiplier: { dianpao: 0, zimo: 1 } };
  }
  if (huCount === 22) {
    return { type: 'taiKa', name: '台卡', multiplier: { dianpao: 2, zimo: 3 } };
  }
  if (huCount >= 23 && huCount <= 32) {
    return { type: 'taiHu', name: '台胡', multiplier: { dianpao: 1, zimo: 2 } };
  }
  if (huCount === 33) {
    return { type: 'chongTaiKa', name: '重台卡', multiplier: { dianpao: 7, zimo: 8 } };
  }
  if (huCount >= 34) {
    return { type: 'chongTaiHu', name: '重台胡', multiplier: { dianpao: 6, zimo: 7 } };
  }
  
  return { type: 'none', name: '无', multiplier: { dianpao: 0, zimo: 0 } };
}

function checkBasicHuCondition(hand, melds) {
  const counts = {};
  for (const card of hand) {
    counts[card.character] = (counts[card.character] || 0) + 1;
  }
  
  const usedCardIds = new Set();
  let sentenceCount = 0;
  let kanCount = 0;
  let zhaoCount = 0;
  
  console.log('=== 基本胡牌条件检测 ===');
  console.log('初始手牌:', hand.map(c => c.character).join(''));
  console.log('初始统计:', counts);
  
  for (let sentence = 1; sentence <= 8; sentence++) {
    const sentenceCards = hand.filter(c => c.sentence === sentence && !usedCardIds.has(c.id));
    const positions = new Set(sentenceCards.map(c => c.position));
    
    if (positions.size === 3) {
      sentenceCount++;
      const pos0Card = sentenceCards.find(c => c.position === 0);
      const pos1Card = sentenceCards.find(c => c.position === 1);
      const pos2Card = sentenceCards.find(c => c.position === 2);
      
      if (pos0Card) usedCardIds.add(pos0Card.id);
      if (pos1Card) usedCardIds.add(pos1Card.id);
      if (pos2Card) usedCardIds.add(pos2Card.id);
      
      console.log(`移除句子${sentence}:`, [pos0Card, pos1Card, pos2Card].filter(c => c).map(c => c.character).join(''));
    }
  }
  
  const afterSentence = hand.filter(c => !usedCardIds.has(c.id));
  console.log('移除句子后剩余:', afterSentence.map(c => c.character).join(''));
  
  const afterSentenceCounts = {};
  for (const card of afterSentence) {
    afterSentenceCounts[card.character] = (afterSentenceCounts[card.character] || 0) + 1;
  }
  console.log('移除句子后统计:', afterSentenceCounts);
  
  for (const [char, count] of Object.entries(afterSentenceCounts)) {
    if (count === 3) {
      kanCount++;
      const kanCards = afterSentence.filter(c => c.character === char);
      kanCards.forEach(c => usedCardIds.add(c.id));
      console.log(`移除坎:`, char, count, '张');
    }
  }
  
  const afterKan = hand.filter(c => !usedCardIds.has(c.id));
  console.log('移除坎后剩余:', afterKan.map(c => c.character).join(''));
  
  const afterKanCounts = {};
  for (const card of afterKan) {
    afterKanCounts[card.character] = (afterKanCounts[card.character] || 0) + 1;
  }
  console.log('移除坎后统计:', afterKanCounts);
  
  for (const [char, count] of Object.entries(afterKanCounts)) {
    if (count >= 4) {
      zhaoCount++;
      const zhaoCards = afterKan.filter(c => c.character === char);
      zhaoCards.forEach(c => usedCardIds.add(c.id));
      console.log(`移除招:`, char, count, '张');
    }
  }
  
  const remainingCards = hand.filter(c => !usedCardIds.has(c.id));
  
  console.log('最终剩余:', remainingCards.map(c => c.character).join(''));
  console.log('剩余数量:', remainingCards.length);
  console.log('sentenceCount:', sentenceCount, 'kanCount:', kanCount, 'zhaoCount:', zhaoCount);
  
  if (remainingCards.length !== 2) {
    console.log('不满足: 剩余牌不是2张');
    return false;
  }
  
  const [card1, card2] = remainingCards;
  
  if (card1.character === card2.character) {
    console.log('满足: 是对子');
    return true;
  }
  
  if (card1.sentence === card2.sentence && card1.position !== card2.position) {
    console.log('满足: 是半靠');
    return true;
  }
  
  console.log('不满足: 剩余牌既不是对子也不是半靠');
  return false;
}

function checkKuHu(hand, melds, effectiveHasZhao) {
  const hasChi = melds.some(m => m.type === 'sequence');
  if (hasChi) return false;
  
  const usedChars = new Set();
  for (let sentence = 1; sentence <= 8; sentence++) {
    const sentenceCards = hand.filter(c => c.sentence === sentence && !usedChars.has(c.character));
    const positions = new Set(sentenceCards.map(c => c.position));
    
    if (positions.size === 3) {
      return false;
    }
  }
  
  const counts = {};
  for (const card of hand) {
    counts[card.character] = (counts[card.character] || 0) + 1;
  }
  
  for (const count of Object.values(counts)) {
    if (count === 1) {
      return false;
    }
    if (count >= 4) {
      return false;
    }
  }
  
  let kanCount = 0;
  let duiCount = 0;
  
  for (const count of Object.values(counts)) {
    if (count === 3) {
      kanCount++;
    } else if (count === 2) {
      duiCount++;
    }
  }
  
  for (const meld of melds) {
    if (meld.type === 'triplet') {
      kanCount++;
    } else if (meld.type === 'quartet' && effectiveHasZhao) {
      kanCount++;
    }
  }
  
  return kanCount >= 4 && duiCount === 1;
}

function checkQingYiSe(cards) {
  const colors = new Set();
  for (const card of cards) {
    if (card.position === 0) colors.add('red');
    else if (card.position === 1) colors.add('green');
    else if (card.position === 2) colors.add('black');
  }
  return colors.size === 1;
}

function checkShiDui(hand) {
  const counts = {};
  for (const card of hand) {
    counts[card.character] = (counts[card.character] || 0) + 1;
  }
  
  let duiCount = 0;
  for (const count of Object.values(counts)) {
    if (count === 2) {
      duiCount++;
    } else if (count === 4) {
      duiCount += 2;
    }
  }
  
  return duiCount === 10;
}

function checkHeiYuan(hand, melds, effectiveHasZhao) {
  const hasPeng = melds.some(m => m.type === 'triplet');
  const hasZhao = melds.some(m => m.type === 'quartet');
  
  if (hasPeng || (hasZhao && effectiveHasZhao)) return false;
  
  if (!checkSentencePattern(hand, melds)) return false;
  
  const allCards = [...hand, ...melds.flatMap(m => m.cards)];
  
  const hasShangDaRen = allCards.some(c => c.sentence === 1);
  const hasFuLuShou = allCards.some(c => c.sentence === 8);
  
  if (hasShangDaRen || hasFuLuShou) return false;
  
  const shangCount = allCards.filter(c => c.character === '上').length;
  const fuCount = allCards.filter(c => c.character === '福').length;
  
  return shangCount === 0 && fuCount === 0;
}

function checkSentencePattern(hand, melds) {
  const chiMelds = melds.filter(m => m.type === 'sequence');
  const handCounts = {};
  for (const card of hand) {
    handCounts[card.character] = (handCounts[card.character] || 0) + 1;
  }
  
  let halfPairCount = 0;
  for (let sentence = 1; sentence <= 8; sentence++) {
    const sentenceCards = hand.filter(c => c.sentence === sentence);
    if (sentenceCards.length === 2) {
      if (sentenceCards[0].character !== sentenceCards[1].character) {
        halfPairCount++;
      }
    } else if (sentenceCards.length !== 0 && sentenceCards.length !== 3) {
      return false;
    }
  }
  
  return halfPairCount === 1;
}

function checkHongYuan(hand, melds, effectiveHasZhao) {
  const hasPeng = melds.some(m => m.type === 'triplet');
  const hasZhao = melds.some(m => m.type === 'quartet');
  
  if (hasPeng || (hasZhao && effectiveHasZhao)) return 0;
  
  if (melds.length > 0) {
    const allSequences = melds.every(m => m.type === 'sequence');
    if (!allSequences) return 0;
  }
  
  const usedChars = new Set();
  let handShangDaRenSentence = false;
  let handFuLuShouSentence = false;
  
  for (let sentence = 1; sentence <= 8; sentence++) {
    const sentenceCards = hand.filter(c => c.sentence === sentence && !usedChars.has(c.character));
    const positions = new Set(sentenceCards.map(c => c.position));
    
    if (positions.size === 3) {
      sentenceCards.forEach(c => usedChars.add(c.character));
      
      if (sentence === 1) handShangDaRenSentence = true;
      if (sentence === 8) handFuLuShouSentence = true;
    }
  }
  
  const remainingCards = hand.filter(c => !usedChars.has(c.character));
  
  if (remainingCards.length !== 2) return 0;
  
  const [card1, card2] = remainingCards;
  if (card1.character === card2.character) return 0;
  if (card1.sentence !== card2.sentence) return 0;
  if (card1.position === card2.position) return 0;
  
  let meldShangDaRenSentence = 0;
  let meldFuLuShouSentence = 0;
  
  for (const meld of melds) {
    if (meld.type === 'sequence') {
      const sentence = meld.cards[0].sentence;
      if (sentence === 1) meldShangDaRenSentence++;
      if (sentence === 8) meldFuLuShouSentence++;
    }
  }
  
  let shangDaRenSentenceCount = 0;
  let fuLuShouSentenceCount = 0;
  
  if (handShangDaRenSentence) shangDaRenSentenceCount++;
  if (handFuLuShouSentence) fuLuShouSentenceCount++;
  shangDaRenSentenceCount += meldShangDaRenSentence;
  fuLuShouSentenceCount += meldFuLuShouSentence;
  
  const totalSpecialSentenceCount = shangDaRenSentenceCount + fuLuShouSentenceCount;
  
  if (totalSpecialSentenceCount < 2) return 0;
  
  if (totalSpecialSentenceCount === 2) {
    const halfKaoSentence = remainingCards[0].sentence;
    if (halfKaoSentence !== 1 && halfKaoSentence !== 8) return 0;
  }
  
  const allCards = [...hand, ...melds.flatMap(m => m.cards)];
  const shangCount = allCards.filter(c => c.character === '上').length;
  const fuCount = allCards.filter(c => c.character === '福').length;
  const shangFuCount = shangCount + fuCount;
  
  if (shangFuCount >= 3 && shangFuCount <= 7) {
    return shangFuCount;
  }
  
  return 0;
}

function checkQingHu(hand, melds, huCount){
  const allCards = [...hand, ...melds.flatMap(m => m.cards)];
  
  const shangCount = allCards.filter(c => c.character === '上').length;
  const fuCount = allCards.filter(c => c.character === '福').length;
  
  if (shangCount > 0 || fuCount > 0) return false;
  
  const hasShangDaRenHalfKao = checkHalfKao(hand, melds, 1);
  const hasFuLuShouHalfKao = checkHalfKao(hand, melds, 8);
  
  if (hasShangDaRenHalfKao || hasFuLuShouHalfKao) return false;
  
  if (huCount < 11 || huCount > 21) return false;
  
  // 第6条：检查手牌移除句子和坎后是否只剩两张牌（半靠或对子）
  return checkQingHuRemainingCards(hand);
}

// 检查清胡条件（除了胡数范围）
function checkQingHuConditions(hand, melds) {
  const allCards = [...hand, ...melds.flatMap(m => m.cards)];
  
  // 条件1：不能有"上"字牌
  const shangCount = allCards.filter(c => c.character === '上').length;
  if (shangCount > 0) return false;
  
  // 条件2：不能有"福"字牌
  const fuCount = allCards.filter(c => c.character === '福').length;
  if (fuCount > 0) return false;
  
  // 条件3：不能有"上大人"半靠
  const hasShangDaRenHalfKao = checkHalfKao(hand, melds, 1);
  if (hasShangDaRenHalfKao) return false;
  
  // 条件4：不能有"福禄寿"半靠
  const hasFuLuShouHalfKao = checkHalfKao(hand, melds, 8);
  if (hasFuLuShouHalfKao) return false;
  
  // 条件6：检查手牌移除句子和坎后是否只剩两张牌（半靠或对子）
  return checkQingHuRemainingCards(hand);
}

function checkQingHuRemainingCards(hand) {
  // 复制手牌
  const cards = [...hand];
  
  // 统计每张牌的数量
  const counts = {};
  for (const card of cards) {
    counts[card.character] = (counts[card.character] || 0) + 1;
  }
  
  // 移除句子（三个连续的字）
  for (let sentence = 1; sentence <= 8; sentence++) {
    const sentenceCards = cards.filter(c => c.sentence === sentence);
    if (sentenceCards.length >= 3) {
      // 检查是否有完整的句子（三个不同的位置）
      const positions = new Set(sentenceCards.map(c => c.position));
      if (positions.size === 3) {
        // 移除一个句子
        const removed = new Set();
        for (let i = cards.length - 1; i >= 0; i--) {
          if (cards[i].sentence === sentence && !removed.has(cards[i].position)) {
            removed.add(cards[i].position);
            cards.splice(i, 1);
            if (removed.size === 3) break;
          }
        }
      }
    }
  }
  
  // 移除坎（三张相同的牌）
  for (const char of Object.keys(counts)) {
    if (counts[char] >= 3) {
      // 找到三张相同的牌并移除
      let removed = 0;
      for (let i = cards.length - 1; i >= 0 && removed < 3; i--) {
        if (cards[i].character === char) {
          cards.splice(i, 1);
          removed++;
        }
      }
      counts[char] -= 3;
    }
  }
  
  // 检查是否只剩两张牌
  if (cards.length !== 2) {
    return false;
  }
  
  // 检查这两张牌是否是半靠或对子
  const card1 = cards[0];
  const card2 = cards[1];
  
  // 对子：两张相同的牌
  if (card1.character === card2.character) {
    return true;
  }
  
  // 半靠：同一句子中的两张牌
  if (card1.sentence === card2.sentence) {
    return true;
  }
  
  return false;
}

function checkHalfKao(hand, melds, sentence) {
  const sentenceCards = hand.filter(c => c.sentence === sentence);
  if (sentenceCards.length === 2) {
    return true;
  }
  
  for (const meld of melds) {
    if (meld.type === 'sequence' && meld.cards[0].sentence === sentence) {
      return true;
    }
  }
  
  return false;
}

function calculateHuCount(hand, melds, huCard = null) {
  let hu = 0;
  
  const counts = {};
  for (const card of hand) {
    counts[card.character] = (counts[card.character] || 0) + 1;
  }
  
  if (huCard) {
    counts[huCard.character] = (counts[huCard.character] || 0) + 1;
  }
  
  console.log('=== 胡数计算过程 ===');
  console.log('牌型统计:', counts);
  
  const countedChars = new Set();
  
  for (const [char, count] of Object.entries(counts)) {
    if (char === '上' || char === '福') {
      if (count >= 3) {
        hu += 12;
        console.log(`${char}: ${count}张 -> 12胡`);
        countedChars.add(char);
      } else if (count === 2) {
        hu += 8;
        console.log(`${char}: ${count}张 -> 8胡`);
        countedChars.add(char);
      } else if (count === 1) {
        hu += 4;
        console.log(`${char}: ${count}张 -> 4胡`);
        countedChars.add(char);
      }
    } else {
      if (count >= 3) {
        if (huCard && char === huCard.character && count === 3) {
          hu += 2;
          console.log(`${char}: ${count}张(点炮坎) -> 2胡`);
        } else {
          hu += 3;
          console.log(`${char}: ${count}张 -> 3胡`);
        }
      }
    }
  }
  
  for (let sentence = 1; sentence <= 8; sentence++) {
    const sentenceCards = hand.filter(c => c.sentence === sentence);
    if (huCard && huCard.sentence === sentence) {
      sentenceCards.push(huCard);
    }
    if (sentenceCards.length === 2 && sentenceCards[0].character !== sentenceCards[1].character) {
      const hasShangOrFu = sentenceCards.some(c => c.character === '上' || c.character === '福');
      const shangOrFuCard = sentenceCards.find(c => c.character === '上' || c.character === '福');
      
      if (hasShangOrFu && !countedChars.has(shangOrFuCard.character)) {
        hu += 4;
        console.log(`句${sentence}半靠(${sentenceCards.map(c => c.character).join('')}): 4胡`);
      }
    }
  }
  
  for (const meld of melds) {
    hu += meld.huValue;
    console.log(`组合牌(${meld.type}): ${meld.huValue}胡`);
  }
  
  console.log(`总胡数: ${hu}胡`);
  console.log('==================');
  
  return hu;
}

function performChi(playerIndex) {
  const player = gameState.players[playerIndex];
  const card = gameState.lastDiscardedCard;
  
  console.log(`【${player.name}】吃牌: ${card.character}, 手牌: ${player.hand.length} -> ${player.hand.length - 2}`);
  
  playButtonSound('吃');
  
  const sentenceCards = player.hand.filter(c => c.sentence === card.sentence);
  let chiCards = [card];
  
  if (card.position === 0) {
    chiCards.push(sentenceCards.find(c => c.position === 1));
    chiCards.push(sentenceCards.find(c => c.position === 2));
  } else if (card.position === 1) {
    chiCards.push(sentenceCards.find(c => c.position === 0));
    chiCards.push(sentenceCards.find(c => c.position === 2));
  } else {
    chiCards.push(sentenceCards.find(c => c.position === 0));
    chiCards.push(sentenceCards.find(c => c.position === 1));
  }
  
  for (const c of chiCards) {
    if (c !== card) {
      const idx = player.hand.findIndex(h => h.id === c.id);
      if (idx !== -1) player.hand.splice(idx, 1);
    }
  }
  
  console.log('吃牌后手牌数:', player.hand.length);
  validateCardCounts();
  
  const orderedCards = [];
  const pos0Card = chiCards.find(c => c.position === 0);
  const pos1Card = chiCards.find(c => c.position === 1);
  const pos2Card = chiCards.find(c => c.position === 2);
  
  if (pos0Card) orderedCards.push(pos0Card);
  if (pos1Card) orderedCards.push(pos1Card);
  if (pos2Card) orderedCards.push(pos2Card);
  
  const hasShangOrFu = orderedCards.some(c => c.character === '上' || c.character === '福');
  const huValue = hasShangOrFu ? 4 : 0;
  
  player.melds.push({
    type: 'sequence',
    cards: orderedCards,
    source: 'chi',
    huValue: huValue
  });
  
  player.isTing = false;
  if (playerIndex === 1) {
    const tingBadge = document.getElementById('tingBadge');
    const zimoBadge = document.getElementById('zimoBadge');
    tingBadge.classList.add('hidden');
    zimoBadge.classList.add('hidden');
  }
  
  removeLastDiscard();
  gameState.lastDiscardedCard = null;
  gameState.currentPlayerIndex = playerIndex;
  gameState.waitingForResponse = false;
  gameState.skipDraw = true;
  
  updateUI();
  
  gameState.canChi = false;
  gameState.canPeng = false;
  gameState.canZhao = false;
  gameState.canHu = false;
  
  updateCurrentPlayerUI();
  startCountdown();
  
  if (player.type === 'human') {
    gameState.isMyTurn = true;
    const tingResult = checkTing(player);
    player.isTing = tingResult.isTing;
    updateTingBadge();
  } else {
    gameState.isMyTurn = false;
    setTimeout(() => processAITurn(), 800 + Math.random() * 500);
  }
}

function performPeng(playerIndex) {
  const player = gameState.players[playerIndex];
  const card = gameState.lastDiscardedCard;
  
  if (!card) {
    console.error('【错误】performPeng: lastDiscardedCard为空');
    return;
  }
  
  console.log(`=== 【${player.name}】碰牌 ===`);
  console.log('碰牌前手牌数:', player.hand.length);
  console.log('碰牌:', card.character, 'ID:', card.id);
  console.log('当前melds数量:', player.melds.length);
  
  playButtonSound('碰');
  
  const matchingCards = player.hand.filter(c => c.character === card.character).slice(0, 2);
  console.log('匹配的牌:', matchingCards.map(c => ({ char: c.character, id: c.id })));
  const pengCards = [card, ...matchingCards];
  console.log('碰牌组合:', pengCards.map(c => ({ char: c.character, id: c.id })));
  
  for (const c of matchingCards) {
    const idx = player.hand.findIndex(h => h.id === c.id);
    if (idx !== -1) player.hand.splice(idx, 1);
  }
  
  console.log('碰牌后手牌数:', player.hand.length);
  validateCardCounts();
  
  const isSpecial = card.character === '上' || card.character === '福';
  player.melds.push({
    type: 'triplet',
    cards: pengCards,
    source: 'peng',
    huValue: isSpecial ? 12 : 2
  });
  
  player.isTing = false;
  if (playerIndex === 1) {
    const tingBadge = document.getElementById('tingBadge');
    const zimoBadge = document.getElementById('zimoBadge');
    tingBadge.classList.add('hidden');
    zimoBadge.classList.add('hidden');
  }
  
  removeLastDiscard();
  gameState.lastDiscardedCard = null;
  gameState.currentPlayerIndex = playerIndex;
  gameState.waitingForResponse = false;
  gameState.skipDraw = true;
  
  updateUI();
  
  gameState.canChi = false;
  gameState.canPeng = false;
  gameState.canZhao = false;
  gameState.canHu = false;
  
  updateCurrentPlayerUI();
  startCountdown();
  
  if (player.type === 'human') {
    gameState.isMyTurn = true;
    const tingResult = checkTing(player);
    player.isTing = tingResult.isTing;
    updateTingBadge();
    updateActionButtons();
  } else {
    gameState.isMyTurn = false;
    setTimeout(() => processAITurn(), 800 + Math.random() * 500);
  }
}

function performZhao(playerIndex, char = null) {
  const player = gameState.players[playerIndex];
  
  console.log(`=== 【${player.name}】招牌 ===`);
  console.log('招牌前手牌数:', player.hand.length);
  console.log('招牌:', char || gameState.lastDiscardedCard?.character);
  
  playButtonSound('招');
  
  let zhaoCards;
  if (char) {
    zhaoCards = player.hand.filter(c => c.character === char).slice(0, 4);
    for (const c of zhaoCards) {
      const idx = player.hand.findIndex(h => h.id === c.id);
      if (idx !== -1) player.hand.splice(idx, 1);
    }
  } else {
    const card = gameState.lastDiscardedCard;
    const matchingCards = player.hand.filter(c => c.character === card.character);
    zhaoCards = [card, ...matchingCards];
    
    for (const c of matchingCards) {
      const idx = player.hand.findIndex(h => h.id === c.id);
      if (idx !== -1) player.hand.splice(idx, 1);
    }
    
    removeLastDiscard();
    gameState.lastDiscardedCard = null;
  }
  
  console.log('招牌后手牌数:', player.hand.length);
  validateCardCounts();
  
  const isSpecial = zhaoCards[0].character === '上' || zhaoCards[0].character === '福';
  player.melds.push({
    type: 'quartet',
    cards: zhaoCards,
    source: 'zhao',
    huValue: isSpecial ? 16 : 6
  });
  
  player.isTing = false;
  if (playerIndex === 1) {
    const tingBadge = document.getElementById('tingBadge');
    const zimoBadge = document.getElementById('zimoBadge');
    tingBadge.classList.add('hidden');
    zimoBadge.classList.add('hidden');
  }
  
  gameState.currentPlayerIndex = playerIndex;
  gameState.waitingForResponse = false;
  gameState.skipDraw = true;
  
  updateUI();
  
  if (gameState.deck.length > 0) {
    const drawnCard = gameState.deck.pop();
    updateDeckStack();
    
    animateDrawCard(playerIndex, drawnCard, () => {
      player.hand.push(drawnCard);
      player.hand = sortHand(player.hand);
      gameState.lastDrawnCard = drawnCard;
      updateUI();
      startTurn();
    });
  } else {
    console.log('荒庄，庄家不变，庄家索引:', gameState.dealerIndex);
    showMessage('流局', '牌堆已空，本局结束');
  }
}

function handleHu(playerIndex, method) {
  stopCountdown();
  
  gameState.isMyTurn = false;
  gameState.waitingForResponse = false;
  gameState.selectedCardIndex = -1;
  
  const player = gameState.players[playerIndex];
  const huCard = method === 'dianpao' ? gameState.lastDiscardedCard : null;
  const huResult = checkHu(player, huCard);
  
  console.log('=== 胡牌信息 ===');
  console.log('胡牌类型:', huResult.huType);
  console.log('胡数:', huResult.huCount);
  console.log('胡牌方式:', method);
  
  const multiplier = method === 'zimo' ? huResult.huType.multiplier.zimo : huResult.huType.multiplier.dianpao;
  let score = gameState.baseScore + multiplier * gameState.multiplierBase + player.piao;
  if (method === 'zimo') score *= 2;
  
  for (let i = 0; i < gameState.players.length; i++) {
    if (i !== playerIndex) {
      const payment = method === 'zimo' ? score : (i === gameState.lastDiscardPlayerIndex ? score : 0);
      gameState.players[i].score -= payment;
    }
  }
  player.score += score * (method === 'zimo' ? 2 : 1);
  
  const huTypeName = huResult.huType.name;
  const methodName = method === 'zimo' ? '自摸' : '点炮';
  const dianPaoPlayer = method === 'dianpao' ? gameState.players[gameState.lastDiscardPlayerIndex] : null;
  
  if (playerIndex !== gameState.dealerIndex) {
    gameState.dealerIndex = (gameState.dealerIndex + 1) % 3;
    console.log('庄家轮换，新庄家索引:', gameState.dealerIndex);
  } else {
    console.log('庄家胡牌，庄家不变');
  }
  
  showHuMessage(player, huResult, methodName, huTypeName, score, dianPaoPlayer, method, huCard);
  
  updateUI();
}

function showHuMessage(player, huResult, methodName, huTypeName, score, dianPaoPlayer, method, huCard) {
  const overlay = document.getElementById('dealingOverlay');
  const mask = document.getElementById('dealingMask');
  overlay.style.display = 'flex';
  mask.style.display = 'block';
  
  let displayHand = [...player.hand];
  let displayHuCard = huCard;
  
  if (method === 'zimo' && !huCard && player.hand.length > 0) {
    displayHuCard = player.hand[player.hand.length - 1];
  }
  
  if (huCard && method === 'dianpao') {
    displayHand.push(huCard);
  }
  
  const sortedHand = sortHand(displayHand);
  
  const sentenceGroups = {};
  for (const card of sortedHand) {
    if (!sentenceGroups[card.sentence]) {
      sentenceGroups[card.sentence] = {};
    }
    if (!sentenceGroups[card.sentence][card.position]) {
      sentenceGroups[card.sentence][card.position] = [];
    }
    sentenceGroups[card.sentence][card.position].push(card);
  }
  
  let handHtml = '';
  let maxCardsInSentence = 0;
  for (let sentence = 1; sentence <= 8; sentence++) {
    if (!sentenceGroups[sentence]) continue;
    
    const posCount = Object.keys(sentenceGroups[sentence]).length;
    if (posCount > maxCardsInSentence) maxCardsInSentence = posCount;
    
    handHtml += '<div style="display: flex; flex-direction: column; gap: 2px; position: relative; margin: 0 3px;">';
    
    for (let pos = 0; pos <= 2; pos++) {
      if (!sentenceGroups[sentence][pos]) continue;
      
      const cards = sentenceGroups[sentence][pos];
      const pinyin = CARD_PINYIN[cards[0].character];
      
      const isHuCard = displayHuCard && cards.some(c => c.character === displayHuCard.character);
      const labelHtml = isHuCard ? `<div style="position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); font-size: 16px; font-weight: bold; color: #fff; text-shadow: 0 0 10px #ff0000, 0 0 20px #ff0000; z-index: 10;">${method === 'zimo' ? '自摸' : '炮'}</div>` : '';
      
      handHtml += `
        <div style="position: relative; width: 40px; height: 168px; margin-bottom: -140px;">
          <div style="background-image: url('images/${pinyin}.png'); background-size: contain; background-position: center; background-repeat: no-repeat; width: 40px; height: 168px;"></div>
          ${labelHtml}
          ${cards.length > 1 ? `<div style="position: absolute; top: -5px; right: -5px; width: 18px; height: 18px; background: #ff6b6b; color: #fff; border-radius: 50%; font-size: 11px; font-weight: bold; display: flex; align-items: center; justify-content: center;">${cards.length}</div>` : ''}
        </div>
      `;
    }
    
    handHtml += '</div>';
  }
  
  const handAreaHeight = 168 + (maxCardsInSentence - 1) * 28;
  
  let meldsHtml = '';
  if (player.melds.length > 0) {
    meldsHtml = '<div style="margin-top: 25px;"><div style="font-size: 16px; color: #ffd700; margin-bottom: 12px;">组合牌:</div><div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 4px; background: rgba(0,0,0,0.3); padding: 4px; border-radius: 10px;">';
    
    for (const meld of player.melds) {
      for (const card of meld.cards) {
        const pinyin = CARD_PINYIN[card.character];
        meldsHtml += `<div style="background-image: url('images/s/${pinyin}.png'); background-size: contain; background-position: center; background-repeat: no-repeat; width: 20px; height: 84px;"></div>`;
      }
    }
    
    meldsHtml += '</div></div>';
  }
  
  const html = `
    <div style="text-align: center; padding: 20px;">
      <div style="font-size: 24px; color: #ffd700; margin-bottom: 15px;">${player.name} 胡牌!</div>
      <div style="display: flex; justify-content: center; align-items: center; gap: 14px; font-size: 10px; margin-bottom: 15px;">
        <span style="color: #fff;">${methodName}${dianPaoPlayer ? ` - ${dianPaoPlayer.name}点炮` : ''}</span>
        <span style="color: #4ecdc4;">${huTypeName}</span>
        <span style="color: #ffd700;">胡数: ${huResult.huCount}</span>
        <span style="color: #fff;">得分: +${score}</span>
      </div>
      <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; margin: 15px 0; padding: 10px; background: rgba(0,0,0,0.3); border-radius: 10px; min-height: ${handAreaHeight}px;">
        ${handHtml}
      </div>
      ${meldsHtml}
      <button id="huConfirmBtn" class="btn btn-primary" style="margin-top: 15px; pointer-events: auto; z-index: 3001;">确定</button>
    </div>
  `;
  
  overlay.querySelector('.dealing-text').innerHTML = html;
  
  const confirmBtn = document.getElementById('huConfirmBtn');
  if (confirmBtn) {
    confirmBtn.addEventListener('click', closeHuMessage);
  }
}

function closeHuMessage() {
  const overlay = document.getElementById('dealingOverlay');
  const mask = document.getElementById('dealingMask');
  overlay.style.display = 'none';
  mask.style.display = 'none';
  overlay.querySelector('.dealing-text').innerHTML = '';
  
  stopCountdown();
  
  gameState.isMyTurn = false;
  gameState.waitingForResponse = false;
  gameState.selectedCardIndex = -1;
  gameState.canHu = false;
  gameState.canZhao = false;
  gameState.canPeng = false;
  gameState.canChi = false;
  gameState.isDrawing = false;
  gameState.skipDraw = false;
  
  const container = document.getElementById('actionButtons');
  container.innerHTML = '';
  
  document.getElementById('myHand').innerHTML = '';
  document.getElementById('player1Discard').innerHTML = '';
  document.getElementById('myDiscard').innerHTML = '';
  document.getElementById('player2Discard').innerHTML = '';
  document.getElementById('player1Melds').innerHTML = '';
  document.getElementById('myMelds').innerHTML = '';
  document.getElementById('player2Melds').innerHTML = '';
  document.getElementById('playedCards').innerHTML = '';
  
  document.querySelectorAll('body > div[style*="position: fixed"][style*="z-index: 9999"]').forEach(el => el.remove());
  document.querySelectorAll('body > div[style*="position: fixed"][style*="z-index: 10000"]').forEach(el => el.remove());
  
  const zimoBadge = document.getElementById('zimoBadge');
  if (zimoBadge) zimoBadge.classList.add('hidden');
  
  document.getElementById('player1HandCount').textContent = '0';
  document.getElementById('myHandCount').textContent = '0';
  document.getElementById('player2HandCount').textContent = '0';
  document.getElementById('player1Score').textContent = gameState.players[0].score;
  document.getElementById('myScore').textContent = gameState.players[1].score;
  document.getElementById('player2Score').textContent = gameState.players[2].score;
  
  const tingBadge = document.getElementById('tingBadge');
  tingBadge.classList.add('hidden');
  
  startRound();
}

function removeLastDiscard() {
  const discardPlayer = gameState.players[gameState.lastDiscardPlayerIndex];
  if (discardPlayer && discardPlayer.discards.length > 0) {
    discardPlayer.discards.pop();
  }
}

function moveToNextPlayer() {
  console.log('=== 进入下一玩家 ===');
  gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % 3;
  gameState.lastDiscardedCard = null;
  gameState.waitingForResponse = false;
  gameState.canHu = false;
  gameState.canZhao = false;
  gameState.canPeng = false;
  gameState.canChi = false;
  gameState.skipDraw = false;
  
  console.log('当前玩家索引:', gameState.currentPlayerIndex);
  console.log('玩家类型:', gameState.players[gameState.currentPlayerIndex].type);
  
  if (gameState.deck.length === 0) {
    console.log('荒庄，庄家不变，庄家索引:', gameState.dealerIndex);
    showMessage('流局', '牌堆已空，本局结束');
    return;
  }
  
  startTurn();
}

function hideAllActionButtons() {
  gameState.canPeng = false;
  gameState.canChi = false;
  gameState.canZhao = false;
  gameState.canHu = false;
  gameState.waitingForResponse = false;
  gameState.isMyTurn = false;
  const container = document.getElementById('actionButtons');
  if (container) container.innerHTML = '';
}

function passAction() {
  stopCountdown();
  hideAllActionButtons();
  moveToNextPlayer();
}

function chiAction() {
  if (!gameState.canChi) return;
  stopCountdown();
  hideAllActionButtons();
  performChi(1);
}

function pengAction() {
  if (!gameState.canPeng) return;
  stopCountdown();
  hideAllActionButtons();
  performPeng(1);
}

function zhaoAction() {
  if (!gameState.canZhao) return;
  stopCountdown();
  hideAllActionButtons();
  performZhao(1);
}

function huAction() {
  if (!gameState.canHu) return;
  stopCountdown();
  hideAllActionButtons();
  handleHu(1, 'dianpao');
}

function discardAction() {
  if (!gameState.isMyTurn || gameState.selectedCardIndex < 0) return;
  
  const me = gameState.players[1];
  
  const huResult = checkHu(me);
  if (huResult.canHu) {
    hideAllActionButtons();
    handleHu(1, 'zimo');
    return;
  }
  
  const selectedIndex = gameState.selectedCardIndex;
  gameState.selectedCardIndex = -1;
  hideAllActionButtons();
  
  discardCard(1, selectedIndex);
}

function selectCard(index) {
  if (!gameState.isMyTurn) return;
  
  gameState.selectedCardIndex = index;
  updateMyHand();
}

function updateActionButtons() {
  const container = document.getElementById('actionButtons');
  container.innerHTML = '';
  
  console.log('=== 更新操作按钮 ===');
  console.log('waitingForResponse:', gameState.waitingForResponse);
  console.log('isMyTurn:', gameState.isMyTurn);
  console.log('canChi:', gameState.canChi);
  console.log('canPeng:', gameState.canPeng);
  console.log('canZhao:', gameState.canZhao);
  console.log('canHu:', gameState.canHu);
  
  const me = gameState.players[1];
  const huResult = checkHu(me);
  
  if (gameState.waitingForResponse) {
    console.log('显示响应按钮');
    if (gameState.canChi) {
      createButton(container, '吃', 'btn-primary', chiAction);
    }
    if (gameState.canPeng) {
      createButton(container, '碰', 'btn-primary', pengAction);
    }
    if (gameState.canZhao) {
      createButton(container, '招', 'btn-warning', zhaoAction);
    }
    if (gameState.canHu && me.isTing) {
      createButton(container, '胡', 'btn-danger', huAction);
    }
    createButton(container, '过', 'btn-secondary', passAction);
  } else if (gameState.isMyTurn) {
    console.log('显示我的回合按钮');
    
    const counts = {};
    for (const card of me.hand) {
      counts[card.character] = (counts[card.character] || 0) + 1;
    }
    
    let hasFourOfAKind = false;
    for (const count of Object.values(counts)) {
      if (count >= 4) {
        hasFourOfAKind = true;
        break;
      }
    }
    
    if (hasFourOfAKind) {
      createButton(container, '招', 'btn-warning', () => {
        hideAllActionButtons();
        for (const [char, count] of Object.entries(counts)) {
          if (count >= 4) {
            performZhao(1, char);
            break;
          }
        }
      });
    }
    
    if (gameState.selectedCardIndex >= 0) {
      createButton(container, '出牌', 'btn-primary', discardAction);
    }
  } else {
    console.log('不显示任何按钮');
  }
}

function createButton(container, text, className, onClick) {
  const btn = document.createElement('button');
  btn.className = `btn ${className}`;
  btn.textContent = text;
  btn.onclick = () => {
    if (text !== '出牌') {
      playButtonSound(text);
    }
    onClick();
  };
  container.appendChild(btn);
}

function playButtonSound(text) {
  console.log('playButtonSound called with text:', text);
  
  if (window.plus && window.plus.speech) {
    console.log('Using 5+ App TTS for button');
    plus.speech.startSpeak({
      text: text,
      lang: 'zh-CN'
    }, function() {
      console.log('5+ TTS button sound success:', text);
    }, function(e) {
      console.log('5+ TTS button sound error:', e);
      fallbackButtonSound(text);
    });
  } else if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.TextToSpeech) {
    window.Capacitor.Plugins.TextToSpeech.speak({
      text: text,
      lang: 'zh-CN',
      rate: 0.9
    }).then(() => {
      console.log('Native TTS button sound success:', text);
    }).catch(e => {
      console.log('Native TTS button sound error:', e);
      fallbackButtonSound(text);
    });
  } else if ('speechSynthesis' in window) {
    fallbackButtonSound(text);
  } else {
    console.warn('speechSynthesis not supported');
  }
}

function fallbackButtonSound(text) {
  if ('speechSynthesis' in window) {
    speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.9;
    utterance.pitch = 0.8;
    utterance.volume = 0.6;
    
    utterance.onstart = () => console.log('Button sound started:', text);
    utterance.onerror = (e) => console.error('Button sound error:', e);
    
    speechSynthesis.speak(utterance);
    console.log('Button sound queued:', text);
  }
}

function updateCurrentPlayerUI() {
  const names = document.querySelectorAll('.player-name');
  names.forEach((el, i) => {
    el.classList.toggle('current', i === gameState.currentPlayerIndex);
  });
}

function updateAvatars() {
  const avatarIds = ['player1Avatar', 'myAvatar', 'player2Avatar'];
  
  avatarIds.forEach((id, index) => {
    const avatar = document.getElementById(id);
    if (avatar) {
      const avatarIcon = avatar.querySelector('.avatar-icon');
      const roleBadge = avatar.querySelector('.role-badge');
      
      if (index === gameState.dealerIndex) {
        avatar.className = 'player-avatar landlord';
        if (avatarIcon) avatarIcon.textContent = '👑';
        if (roleBadge) roleBadge.textContent = '庄家';
      } else {
        avatar.className = 'player-avatar farmer';
        if (avatarIcon) avatarIcon.textContent = '👨‍🌾';
        if (roleBadge) roleBadge.textContent = '闲家';
      }
    }
  });
}

function updateUI() {
  console.log('updateUI - 开始');
  updatePlayerArea(0, 'player1');
  updatePlayerArea(1, 'my');
  updatePlayerArea(2, 'player2');
  updateDeckStack();
  console.log('updateUI - 结束');
}

function updatePlayerArea(playerIndex, prefix) {
  console.log('updatePlayerArea - playerIndex:', playerIndex, 'prefix:', prefix);
  const player = gameState.players[playerIndex];
  
  const handCountEl = document.getElementById(`${prefix}HandCount`);
  const scoreEl = document.getElementById(`${prefix}Score`);
  const meldsEl = document.getElementById(`${prefix}Melds`);
  const piaoEl = document.getElementById(`${prefix}Piao`);
  
  if (handCountEl) handCountEl.textContent = player.hand.length;
  if (scoreEl) scoreEl.textContent = player.score;
  if (piaoEl) {
    if (player.piao > 0) {
      piaoEl.textContent = `飘${player.piao}分`;
      piaoEl.classList.remove('hidden');
    } else {
      piaoEl.classList.add('hidden');
    }
  }
  
  if (meldsEl) {
    meldsEl.innerHTML = '';
    const sortedMelds = [...player.melds].sort((a, b) => {
      const minSentenceA = Math.min(...a.cards.map(c => c.sentence));
      const minSentenceB = Math.min(...b.cards.map(c => c.sentence));
      return minSentenceA - minSentenceB;
    });
    
    for (const meld of sortedMelds) {
      const meldDiv = document.createElement('div');
      meldDiv.className = 'meld-group';
      
      const cardsDiv = document.createElement('div');
      cardsDiv.className = 'meld-cards';
      for (const card of meld.cards) {
        cardsDiv.appendChild(createSmallCardElement(card));
      }
      
      meldDiv.appendChild(cardsDiv);
      
      if (playerIndex === 1) {
        const huDiv = document.createElement('div');
        huDiv.className = 'meld-hu';
        huDiv.textContent = meld.huValue;
        meldDiv.appendChild(huDiv);
      }
      
      meldsEl.appendChild(meldDiv);
    }
  }
  
  const discardsEl = document.getElementById(`${prefix}Discards`);
  if (discardsEl) {
    discardsEl.innerHTML = '';
    for (const card of player.discards) {
      discardsEl.appendChild(createSmallCardElement(card));
    }
  }
  
  if (playerIndex === 1) {
    console.log('更新我的手牌区域...');
    updateMyHand();
    
    const tingBadge = document.getElementById('tingBadge');
    const tingResult = checkTing(player);
    tingBadge.classList.toggle('hidden', !tingResult.isTing);
    
    const huBadge = document.getElementById('myHuBadge');
    const huResult = checkHu(player);
    if (huBadge) {
      if (huResult.huCount > 0) {
        huBadge.textContent = `${huResult.huCount}胡`;
        huBadge.classList.remove('hidden');
      } else {
        huBadge.classList.add('hidden');
      }
    }
  }
}

function updateMyHand() {
  renderMyHand();
}

function createCardElement(card, small = false) {
  const div = document.createElement('div');
  div.className = `card ${card.color}${small ? ' small' : ''}${card.isSpecial ? ' special' : ''}`;
  div.textContent = card.character;
  return div;
}

function checkTing(player) {
  const hand = [...player.hand];
  const melds = player.melds;
  const huCount = calculateHuCount(hand, melds);
  
  console.log('==============================');
  console.log(`【${player.name}】听牌检测`);
  console.log('==============================');
  console.log('手牌:', hand.map(c => c.character).join(''));
  console.log('组合牌:', melds.length > 0 ? melds.map(m => m.cards.map(c => c.character).join('')).join(' | ') : '无');
  console.log('胡数:', huCount);
  console.log('手牌数量:', hand.length);
  
  const allCharacters = ['上', '大', '人', '丘', '乙', '己', '化', '三', '千', '七', '十', '土', '尔', '小', '生', '八', '九', '子', '佳', '作', '亡', '福', '禄', '寿'];
  
  let foundTing = false;
  let tingCards = [];
  
  for (const char of allCharacters) {
    const testCard = createCardByCharacter(char);
    if (!testCard) continue;
    
    const testHandWithDraw = [...hand, testCard];
    const huType = determineHuType(testHandWithDraw, melds);
    
    if (huType.type !== 'none') {
      if (['kuHu', 'qingKuHu', 'hongYuan3Jing', 'hongYuan4Jing', 'hongYuan5Jing', 'hongYuan6Jing', 'hongYuan7Jing', 'heiYuan', 'shiDui'].includes(huType.type)) {
        console.log(`  摸"${char}" -> 特殊胡牌: ${huType.name}`);
        tingCards.push(char);
        foundTing = true;
      } else {
        const basicResult = checkBasicHuCondition(testHandWithDraw, melds);
        if (basicResult) {
          console.log(`  摸"${char}" -> 普通胡牌: ${huType.name}`);
          tingCards.push(char);
          foundTing = true;
        }
      }
    }
  }
  
  if (foundTing) {
    console.log(`>>> 【${player.name}】听牌! 听牌: ${tingCards.join(',')} <<<`);
  } else {
    console.log(`>>> 【${player.name}】不听牌 <<<`);
  }
  console.log('==============================');
  
  return { isTing: foundTing, huCount };
}

function createCardByCharacter(char) {
  const cardMap = {
    '上': { character: '上', sentence: 1, position: 0, color: 'red' },
    '大': { character: '大', sentence: 1, position: 1, color: 'green' },
    '人': { character: '人', sentence: 1, position: 2, color: 'black' },
    '丘': { character: '丘', sentence: 2, position: 0, color: 'red' },
    '乙': { character: '乙', sentence: 2, position: 1, color: 'green' },
    '己': { character: '己', sentence: 2, position: 2, color: 'black' },
    '化': { character: '化', sentence: 3, position: 0, color: 'red' },
    '三': { character: '三', sentence: 3, position: 1, color: 'green' },
    '千': { character: '千', sentence: 3, position: 2, color: 'black' },
    '七': { character: '七', sentence: 4, position: 0, color: 'red' },
    '十': { character: '十', sentence: 4, position: 1, color: 'green' },
    '土': { character: '土', sentence: 4, position: 2, color: 'black' },
    '尔': { character: '尔', sentence: 5, position: 0, color: 'red' },
    '小': { character: '小', sentence: 5, position: 1, color: 'green' },
    '生': { character: '生', sentence: 5, position: 2, color: 'black' },
    '八': { character: '八', sentence: 6, position: 0, color: 'red' },
    '九': { character: '九', sentence: 6, position: 1, color: 'green' },
    '子': { character: '子', sentence: 6, position: 2, color: 'black' },
    '佳': { character: '佳', sentence: 7, position: 0, color: 'red' },
    '作': { character: '作', sentence: 7, position: 1, color: 'green' },
    '亡': { character: '亡', sentence: 7, position: 2, color: 'black' },
    '福': { character: '福', sentence: 8, position: 0, color: 'red' },
    '禄': { character: '禄', sentence: 8, position: 1, color: 'green' },
    '寿': { character: '寿', sentence: 8, position: 2, color: 'black' }
  };
  
  return cardMap[char] || null;
}

function calculateExpectedHu(hand, melds) {
  const counts = {};
  for (const card of hand) {
    counts[card.character] = (counts[card.character] || 0) + 1;
  }
  
  const usedChars = new Set();
  let sentenceCount = 0;
  let halfKaoList = [];
  
  for (let sentence = 1; sentence <= 8; sentence++) {
    const sentenceCards = hand.filter(c => c.sentence === sentence && !usedChars.has(c.character));
    const positions = new Set(sentenceCards.map(c => c.position));
    
    if (positions.size === 3) {
      sentenceCount++;
      sentenceCards.forEach(c => usedChars.add(c.character));
    } else if (positions.size === 2) {
      halfKaoList.push(sentenceCards);
      sentenceCards.forEach(c => usedChars.add(c.character));
    }
  }
  
  let duiList = [];
  for (const [char, count] of Object.entries(counts)) {
    if (usedChars.has(char)) continue;
    if (count === 2) {
      const card = hand.find(c => c.character === char);
      duiList.push({ char, card });
    }
  }
  
  const leftoverCount = halfKaoList.length + duiList.length;
  
  if (leftoverCount === 2 && halfKaoList.length === 2) {
    for (const halfKao of halfKaoList) {
      const hasDaRen = halfKao.some(c => c.character === '大' || c.character === '人');
      const hasLuShou = halfKao.some(c => c.character === '禄' || c.character === '寿');
      if (hasDaRen || hasLuShou) {
        return 4;
      }
    }
    return 0;
  }
  
  if (leftoverCount === 2 && duiList.length === 2) {
    const hasShangFu = duiList.some(d => d.char === '上' || d.char === '福');
    if (hasShangFu) {
      return 4;
    }
    return 3;
  }
  
  if (leftoverCount === 2 && halfKaoList.length === 1 && duiList.length === 1) {
    const halfKao = halfKaoList[0];
    const hasDaRen = halfKao.some(c => c.character === '大' || c.character === '人');
    const hasFuLu = halfKao.some(c => c.character === '福' || c.character === '禄');
    if (hasDaRen || hasFuLu) {
      return 4;
    }
    
    const dui = duiList[0];
    if (dui.char === '上' || dui.char === '福') {
      return 4;
    }
    return 3;
  }
  
  if (leftoverCount === 0) {
    for (const [char, count] of Object.entries(counts)) {
      if (count === 1) {
        if (['上', '大', '人', '福', '禄', '寿'].includes(char)) {
          return 4;
        }
      }
    }
  }
  
  return 0;
}

function determineHuType(hand, melds) {
  const allCards = [...hand, ...melds.flatMap(m => m.cards)];
  const huCount = calculateHuCount(hand, melds);
  
  const effectiveHasZhao = isZhaoUsedInSentence(hand, melds) ? false : melds.some(m => m.type === 'quartet');
  
  if (checkShiDui(hand)) {
    return { type: 'shiDui', name: '十对' };
  }
  
  const hongYuanJing = checkHongYuan(hand, melds, effectiveHasZhao);
  if (hongYuanJing > 0) {
    return { type: `hongYuan${hongYuanJing}Jing`, name: `红元${hongYuanJing}精` };
  }
  
  if (checkHeiYuan(hand, melds, effectiveHasZhao)) {
    return { type: 'heiYuan', name: '黑元' };
  }
  
  if (checkKuHu(hand, melds, effectiveHasZhao)) {
    return { type: 'kuHu', name: '枯胡' };
  }
  
  if (checkQingKuHu(hand, melds, effectiveHasZhao)) {
    return { type: 'qingKuHu', name: '清枯胡' };
  }
  
  const basicResult = checkBasicHuCondition(hand, melds);
  if (basicResult) {
    return { type: 'basic', name: '基本胡' };
  }
  
  return { type: 'none', name: '无' };
}

function checkQingKuHu(hand, melds, effectiveHasZhao) {
  const hasChi = melds.some(m => m.type === 'sequence');
  const hasPeng = melds.some(m => m.type === 'triplet');
  const hasZhao = melds.some(m => m.type === 'quartet');
  
  if (hasChi || hasPeng || (hasZhao && effectiveHasZhao)) return false;
  
  const allCards = [...hand, ...melds.flatMap(m => m.cards)];
  const shangCount = allCards.filter(c => c.character === '上').length;
  const fuCount = allCards.filter(c => c.character === '福').length;
  
  if (shangCount > 0 || fuCount > 0) return false;
  
  const hasShangDaRen = allCards.some(c => c.sentence === 1);
  const hasFuLuShou = allCards.some(c => c.sentence === 8);
  
  if (hasShangDaRen || hasFuLuShou) return false;
  
  const counts = {};
  for (const card of hand) {
    counts[card.character] = (counts[card.character] || 0) + 1;
  }
  
  let kanCount = 0;
  let duiCount = 0;
  
  for (const count of Object.values(counts)) {
    if (count >= 3) {
      kanCount++;
    } else if (count === 2) {
      duiCount++;
    }
  }
  
  return kanCount >= 4 && duiCount === 1;
}

function addHistory(playerName, cardChar) {
  const historyList = document.getElementById('historyList');
  if (!historyList) return;
  const item = document.createElement('div');
  item.className = 'history-item';
  item.innerHTML = `<span class="player-name">${playerName}</span>: <span class="card-char">${cardChar}</span>`;
  historyList.insertBefore(item, historyList.firstChild);
}

function showMessage(title, content) {
  document.getElementById('messageTitle').textContent = title;
  document.getElementById('messageContent').textContent = content;
  document.getElementById('messageArea').classList.add('show');
}

function closeMessage() {
  document.getElementById('messageArea').classList.remove('show');
  
  stopCountdown();
  
  gameState.isMyTurn = false;
  gameState.waitingForResponse = false;
  gameState.selectedCardIndex = -1;
  gameState.canHu = false;
  gameState.canZhao = false;
  gameState.canPeng = false;
  gameState.canChi = false;
  
  const container = document.getElementById('actionButtons');
  container.innerHTML = '';
  
  document.getElementById('myHand').innerHTML = '';
  document.getElementById('player1Discard').innerHTML = '';
  document.getElementById('myDiscard').innerHTML = '';
  document.getElementById('player2Discard').innerHTML = '';
  document.getElementById('player1Melds').innerHTML = '';
  document.getElementById('myMelds').innerHTML = '';
  document.getElementById('player2Melds').innerHTML = '';
  document.getElementById('playedCards').innerHTML = '';
  
  document.getElementById('player1HandCount').textContent = '0';
  document.getElementById('myHandCount').textContent = '0';
  document.getElementById('player2HandCount').textContent = '0';
  
  const tingBadge = document.getElementById('tingBadge');
  tingBadge.classList.add('hidden');
  
  if (gameState.roundNumber >= 8) {
    gameState.sessionNumber++;
    gameState.roundNumber = 0;
    for (const player of gameState.players) {
      player.score = 0;
    }
    document.getElementById('sessionNum').textContent = gameState.sessionNumber;
  }
  
  gameState.dealerIndex = (gameState.dealerIndex + 1) % 3;
  startRound();
}

document.addEventListener('DOMContentLoaded', () => {
  gameState.deck = createDeck();
  updateUI();
});
