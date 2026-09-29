/**
 * ============================================================================
 * BATALHA NAVAL - JAVASCRIPT PURO (VANILLA JS)
 * Jogo completo, funcional e moderno sem dependências externas.
 * ============================================================================
 */

(function () {
  'use strict';

  /* --------------------------------------------------------------------------
     1. CONSTANTES & CONFIGURAÇÕES DOS NAVIOS
     -------------------------------------------------------------------------- */
  const BOARD_SIZE = 10;
  const FLEET_SPEC = [
    { key: 'carrier', name: 'Porta-aviões', size: 5, icon: '✈️' },
    { key: 'battleship', name: 'Encouraçado', size: 4, icon: '🛡️' },
    { key: 'cruiser', name: 'Cruzador', size: 3, icon: '⚔️' },
    { key: 'submarine', name: 'Submarino', size: 3, icon: '⚓' },
    { key: 'destroyer', name: 'Destroyer', size: 2, icon: '🎯' }
  ];
  const TOTAL_SHIP_CELLS = FLEET_SPEC.reduce((sum, s) => sum + s.size, 0); // 17

  /* --------------------------------------------------------------------------
     2. MOTOR DE ÁUDIO SINTETIZADO (WEB AUDIO API)
     Gera efeitos sonoros e ambientação marina sem nenhum arquivo externo.
     -------------------------------------------------------------------------- */
  class SoundEngine {
    constructor() {
      this.ctx = null;
      this.sfxEnabled = true;
      this.musicEnabled = true;
      this.ambientGain = null;
      this.ambientOsc = null;
      this.sonarTimer = null;
    }

    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    playClick() {
      if (!this.sfxEnabled) return;
      this.init();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = this.ctx.currentTime;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, t);
      osc.frequency.exponentialRampToValueAtTime(400, t + 0.05);

      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.05);
    }

    playShot() {
      if (!this.sfxEnabled) return;
      this.init();
      if (!this.ctx) return;

      const t = this.ctx.currentTime;
      // Som de canhão / disparo com queda de frequência e ruído
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, t);
      osc.frequency.exponentialRampToValueAtTime(40, t + 0.25);

      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.28);
    }

    playWater() {
      if (!this.sfxEnabled) return;
      this.init();
      if (!this.ctx) return;

      // Respingo de água (ruído branco filtrado com passa-faixa)
      const bufferSize = this.ctx.sampleRate * 0.35;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(700, this.ctx.currentTime);
      filter.Q.setValueAtTime(3, this.ctx.currentTime);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.35);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start();
    }

    playHit() {
      if (!this.sfxEnabled) return;
      this.init();
      if (!this.ctx) return;

      const t = this.ctx.currentTime;
      // Explosão de impacto (ruído + oscilador grave distorcido)
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(120, t);
      osc.frequency.exponentialRampToValueAtTime(30, t + 0.35);

      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.35);
    }

    playSink() {
      if (!this.sfxEnabled) return;
      this.init();
      if (!this.ctx) return;

      const t = this.ctx.currentTime;
      // Explosão prolongada com estrondo
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(90, t);
      osc.frequency.exponentialRampToValueAtTime(20, t + 0.7);

      gain.gain.setValueAtTime(0.5, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.75);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.75);
    }

    playVictory() {
      if (!this.sfxEnabled) return;
      this.init();
      if (!this.ctx) return;

      // Fanfarra triunfante em escala maior: C4, E4, G4, C5
      const notes = [261.63, 329.63, 392.00, 523.25];
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const t = this.ctx.currentTime + idx * 0.14;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + 0.45);
      });
    }

    playDefeat() {
      if (!this.sfxEnabled) return;
      this.init();
      if (!this.ctx) return;

      // Tom melancólico descendente menor: A3, F3, D3, A2
      const notes = [220.00, 174.61, 146.83, 110.00];
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const t = this.ctx.currentTime + idx * 0.2;

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + 0.55);
      });
    }

    playSonarPing() {
      if (!this.musicEnabled) return;
      this.init();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = this.ctx.currentTime;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1050, t);

      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 1.2);
    }

    startAmbientMusic() {
      if (!this.musicEnabled) return;
      this.stopAmbientMusic();
      this.sonarTimer = setInterval(() => {
        if (this.musicEnabled && Math.random() > 0.3) {
          this.playSonarPing();
        }
      }, 5500);
    }

    stopAmbientMusic() {
      if (this.sonarTimer) {
        clearInterval(this.sonarTimer);
        this.sonarTimer = null;
      }
    }
  }

  const sound = new SoundEngine();

  /* --------------------------------------------------------------------------
     3. GERENCIADOR DE ESTADO & CONFIGURAÇÕES (LOCALSTORAGE)
     -------------------------------------------------------------------------- */
  const AppState = {
    theme: 'theme-normal',
    difficulty: 'normal', // 'easy', 'normal', 'hard'
    sfx: true,
    music: true,
    currentScreen: 'screen-home',

    // Estado da Preparação da Frota
    placementOrientation: 'horizontal', // 'horizontal' | 'vertical'
    selectedShipKey: null,
    playerFleetPlacement: {}, // key -> { key, size, name, orientation, coords: [{r, c}] }

    // Estado da Batalha
    gameActive: false,
    currentTurn: 'player', // 'player' | 'computer'
    playerBoard: null, // 10x10 { hasShip: shipKey, state: 'empty' | 'miss' | 'hit' | 'sunk' }
    enemyBoard: null,  // 10x10
    enemyFleet: {},    // key -> { key, size, name, coords: [{r, c}], hits: 0, sunk: false }
    playerFleet: {},   // key -> { key, size, name, coords: [{r, c}], hits: 0, sunk: false }

    // Estatísticas da Partida
    attacks: 0,
    hits: 0,
    misses: 0,
    startTime: null,
    timerInterval: null,

    // Inteligência Artificial
    aiRemainingCells: [], // lista de [r, c] livres para atirar
    aiTargetStack: [],    // vizinhos prioritários para explorar
    aiCurrentShipHits: [] // acertos no navio atualmente caçado (para difíceis deduzirem a reta)
  };

  function loadSettings() {
    try {
      const savedTheme = localStorage.getItem('bn_theme');
      if (savedTheme) AppState.theme = savedTheme;

      const savedDiff = localStorage.getItem('bn_diff');
      if (savedDiff) AppState.difficulty = savedDiff;

      const savedSfx = localStorage.getItem('bn_sfx');
      if (savedSfx !== null) AppState.sfx = savedSfx === 'true';

      const savedMusic = localStorage.getItem('bn_music');
      if (savedMusic !== null) AppState.music = savedMusic === 'true';
    } catch (e) {
      console.warn('LocalStorage inacessível:', e);
    }

    applySettings();
  }

  function saveSettings() {
    try {
      localStorage.setItem('bn_theme', AppState.theme);
      localStorage.setItem('bn_diff', AppState.difficulty);
      localStorage.setItem('bn_sfx', AppState.sfx.toString());
      localStorage.setItem('bn_music', AppState.music.toString());
    } catch (e) {
      console.warn('Erro ao salvar no LocalStorage:', e);
    }
  }

  function applySettings() {
    // Tema
    document.body.className = AppState.theme;

    // Áudio
    sound.sfxEnabled = AppState.sfx;
    sound.musicEnabled = AppState.music;
    if (AppState.music) {
      sound.startAmbientMusic();
    } else {
      sound.stopAmbientMusic();
    }

    // Atualiza ícones de áudio
    const icon = AppState.sfx ? '🔊' : '🔇';
    const elPlace = document.getElementById('audio-icon-placement');
    const elBattle = document.getElementById('audio-icon-battle');
    if (elPlace) elPlace.textContent = icon;
    if (elBattle) elBattle.textContent = icon;

    // Atualiza display no menu
    const diffNames = { easy: 'Fácil', normal: 'Normal', hard: 'Difícil' };
    const diffDisplay = document.getElementById('home-diff-display');
    if (diffDisplay) diffDisplay.textContent = diffNames[AppState.difficulty] || 'Normal';

    // Atualiza inputs do modal
    const sfxCheckbox = document.getElementById('cfg-sound-effects');
    const musicCheckbox = document.getElementById('cfg-ambient-music');
    if (sfxCheckbox) sfxCheckbox.checked = AppState.sfx;
    if (musicCheckbox) musicCheckbox.checked = AppState.music;

    // Botões de tema
    document.querySelectorAll('.theme-choice-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.theme === AppState.theme);
    });

    // Botões de dificuldade
    document.querySelectorAll('.diff-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.diff === AppState.difficulty);
    });

    updateDiffExplanation();
  }

  function updateDiffExplanation() {
    const explEl = document.getElementById('diff-explanation');
    if (!explEl) return;
    if (AppState.difficulty === 'easy') {
      explEl.innerHTML = '<strong>Modo Fácil:</strong> A IA dispara aleatoriamente pelo tabuleiro em posições não atacadas.';
    } else if (AppState.difficulty === 'hard') {
      explEl.innerHTML = '<strong>Modo Difícil:</strong> A IA utiliza caça por paridade (tabuleiro de xadrez) e deduz a rota do navio (horizontal/vertical) ao acertar 2 vezes consecutivas.';
    } else {
      explEl.innerHTML = '<strong>Modo Normal:</strong> A IA dispara aleatoriamente e, ao acertar um navio, passa a explorar as posições vizinhas adjacentes.';
    }
  }

  /* --------------------------------------------------------------------------
     4. ROTEADOR DE TELAS E MODAIS
     -------------------------------------------------------------------------- */
  function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(scr => scr.classList.remove('active'));
    const target = document.getElementById(screenId);
    if (target) {
      target.classList.add('active');
      AppState.currentScreen = screenId;
    }
    sound.playClick();
  }

  function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('active');
      sound.playClick();
    }
  }

  function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('active');
      sound.playClick();
    }
  }

  function setupModals() {
    // Botões de fechar [data-close]
    document.querySelectorAll('[data-close]').forEach(btn => {
      btn.addEventListener('click', () => {
        closeModal(btn.dataset.close);
      });
    });

    // Fechar ao clicar fora da janela do modal
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          overlay.classList.remove('active');
          sound.playClick();
        }
      });
    });

    // Tecla ESC para fechar modais e R para girar navios
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
      } else if ((e.key === 'r' || e.key === 'R') && AppState.currentScreen === 'screen-placement') {
        togglePlacementOrientation();
      }
    });
  }

  /* --------------------------------------------------------------------------
     5. EFEITO DE BOLHAS NO CENÁRIO DE FUNDO
     -------------------------------------------------------------------------- */
  function initBubbles() {
    const container = document.getElementById('bubbles-container');
    if (!container) return;
    const count = 18;
    for (let i = 0; i < count; i++) {
      const bubble = document.createElement('div');
      bubble.classList.add('bubble');
      const size = Math.floor(Math.random() * 18) + 8;
      bubble.style.width = `${size}px`;
      bubble.style.height = `${size}px`;
      bubble.style.left = `${Math.random() * 100}%`;
      bubble.style.animationDuration = `${Math.random() * 10 + 9}s`;
      bubble.style.animationDelay = `${Math.random() * 8}s`;
      container.appendChild(bubble);
    }
  }

  /* --------------------------------------------------------------------------
     6. SISTEMA DE PREPARAÇÃO DA FROTA
     -------------------------------------------------------------------------- */
  function initPlacementScreen() {
    AppState.playerFleetPlacement = {};
    AppState.selectedShipKey = FLEET_SPEC[0].key;
    AppState.placementOrientation = 'horizontal';

    renderShipDock();
    renderPlacementBoard();
    updatePlacementControls();
  }

  function renderShipDock() {
    const dock = document.getElementById('ships-dock');
    if (!dock) return;
    dock.innerHTML = '';

    FLEET_SPEC.forEach(ship => {
      const isPlaced = !!AppState.playerFleetPlacement[ship.key];
      const isSelected = AppState.selectedShipKey === ship.key;

      const card = document.createElement('div');
      card.className = `ship-dock-card ${isSelected ? 'selected' : ''} ${isPlaced ? 'placed' : ''}`;
      card.dataset.ship = ship.key;

      let segmentsHtml = '';
      for (let i = 0; i < ship.size; i++) {
        segmentsHtml += '<span class="ship-segment-dot"></span>';
      }

      card.innerHTML = `
        <div class="ship-info-left">
          <div class="ship-name">${ship.icon} ${ship.name} (${ship.size})</div>
          <div class="ship-cells-preview">${segmentsHtml}</div>
        </div>
        <div class="ship-status-tag">${isPlaced ? '✓ POSICIONADO' : 'AGUARDANDO'}</div>
      `;

      card.addEventListener('click', () => {
        sound.playClick();
        if (isPlaced) {
          // Se já estava posicionado, remove do tabuleiro para reposicionar
          removeShipFromPlacement(ship.key);
        }
        AppState.selectedShipKey = ship.key;
        renderShipDock();
      });

      dock.appendChild(card);
    });

    const placedCount = Object.keys(AppState.playerFleetPlacement).length;
    const badge = document.getElementById('placed-count-badge');
    if (badge) badge.textContent = `${placedCount} / 5`;
  }

  function renderPlacementBoard() {
    const boardEl = document.getElementById('placement-board');
    if (!boardEl) return;
    boardEl.innerHTML = '';

    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.row = r;
        cell.dataset.col = c;

        // Se tem navio posicionado nessa coordenada
        const shipOnCell = getShipAtPlacement(r, c);
        if (shipOnCell) {
          cell.classList.add('has-ship');
          cell.title = `${shipOnCell.name} (Clique para remover)`;
        }

        cell.addEventListener('mouseenter', () => handlePlacementHover(r, c));
        cell.addEventListener('mouseleave', clearPlacementPreviews);
        cell.addEventListener('click', () => handlePlacementClick(r, c));

        boardEl.appendChild(cell);
      }
    }
  }

  function getShipAtPlacement(r, c) {
    for (const key in AppState.playerFleetPlacement) {
      const ship = AppState.playerFleetPlacement[key];
      if (ship.coords.some(coord => coord.r === r && coord.c === c)) {
        return ship;
      }
    }
    return null;
  }

  function getShipCoords(r, c, size, orientation) {
    const coords = [];
    for (let i = 0; i < size; i++) {
      const row = orientation === 'horizontal' ? r : r + i;
      const col = orientation === 'horizontal' ? c + i : c;
      coords.push({ r: row, c: col });
    }
    return coords;
  }

  function isValidPlacement(coords, currentShipKey) {
    for (const coord of coords) {
      // Fora da grade
      if (coord.r < 0 || coord.r >= BOARD_SIZE || coord.c < 0 || coord.c >= BOARD_SIZE) {
        return false;
      }
      // Sobreposição com outro navio
      for (const key in AppState.playerFleetPlacement) {
        if (key === currentShipKey) continue;
        const otherShip = AppState.playerFleetPlacement[key];
        if (otherShip.coords.some(c => c.r === coord.r && c.c === coord.c)) {
          return false;
        }
      }
    }
    return true;
  }

  function handlePlacementHover(r, c) {
    clearPlacementPreviews();
    const coordTip = document.getElementById('placement-coord-tip');
    const letters = ['A','B','C','D','E','F','G','H','I','J'];
    if (coordTip) coordTip.textContent = `Coordenada: ${letters[c]}${r + 1}`;

    if (!AppState.selectedShipKey) return;
    const shipSpec = FLEET_SPEC.find(s => s.key === AppState.selectedShipKey);
    if (!shipSpec) return;

    const coords = getShipCoords(r, c, shipSpec.size, AppState.placementOrientation);
    const valid = isValidPlacement(coords, AppState.selectedShipKey);

    coords.forEach(coord => {
      if (coord.r >= 0 && coord.r < BOARD_SIZE && coord.c >= 0 && coord.c < BOARD_SIZE) {
        const cell = document.querySelector(`#placement-board .cell[data-row="${coord.r}"][data-col="${coord.c}"]`);
        if (cell) {
          cell.classList.add(valid ? 'preview-valid' : 'preview-invalid');
        }
      }
    });
  }

  function clearPlacementPreviews() {
    document.querySelectorAll('#placement-board .cell').forEach(cell => {
      cell.classList.remove('preview-valid', 'preview-invalid');
    });
  }

  function handlePlacementClick(r, c) {
    // Se clicou em um navio já posicionado e não tem navio pendente selecionado para por em cima
    const existingShip = getShipAtPlacement(r, c);
    if (existingShip && (!AppState.selectedShipKey || AppState.playerFleetPlacement[AppState.selectedShipKey])) {
      sound.playClick();
      removeShipFromPlacement(existingShip.key);
      AppState.selectedShipKey = existingShip.key;
      renderShipDock();
      renderPlacementBoard();
      updatePlacementControls();
      return;
    }

    if (!AppState.selectedShipKey) return;

    const shipSpec = FLEET_SPEC.find(s => s.key === AppState.selectedShipKey);
    if (!shipSpec) return;

    const coords = getShipCoords(r, c, shipSpec.size, AppState.placementOrientation);
    if (isValidPlacement(coords, AppState.selectedShipKey)) {
      // Posiciona o navio
      AppState.playerFleetPlacement[shipSpec.key] = {
        key: shipSpec.key,
        name: shipSpec.name,
        size: shipSpec.size,
        orientation: AppState.placementOrientation,
        coords: coords
      };

      sound.playHit(); // som tático de encaixe

      // Seleciona o próximo navio ainda não colocado
      const nextShip = FLEET_SPEC.find(s => !AppState.playerFleetPlacement[s.key]);
      AppState.selectedShipKey = nextShip ? nextShip.key : null;

      renderShipDock();
      renderPlacementBoard();
      updatePlacementControls();
    } else {
      sound.playClick();
    }
  }

  function removeShipFromPlacement(shipKey) {
    if (AppState.playerFleetPlacement[shipKey]) {
      delete AppState.playerFleetPlacement[shipKey];
      renderShipDock();
      renderPlacementBoard();
      updatePlacementControls();
    }
  }

  function togglePlacementOrientation() {
    AppState.placementOrientation = AppState.placementOrientation === 'horizontal' ? 'vertical' : 'horizontal';
    const badge = document.getElementById('current-orientation-badge');
    if (badge) {
      badge.textContent = AppState.placementOrientation.toUpperCase();
    }
    sound.playClick();
  }

  function clearAllPlacement() {
    AppState.playerFleetPlacement = {};
    AppState.selectedShipKey = FLEET_SPEC[0].key;
    renderShipDock();
    renderPlacementBoard();
    updatePlacementControls();
    sound.playClick();
  }

  function randomizePlayerFleet() {
    AppState.playerFleetPlacement = generateRandomFleet();
    AppState.selectedShipKey = null;
    renderShipDock();
    renderPlacementBoard();
    updatePlacementControls();
    sound.playHit();
  }

  function generateRandomFleet() {
    const fleet = {};

    FLEET_SPEC.forEach(ship => {
      let placed = false;
      let attempts = 0;

      while (!placed && attempts < 500) {
        attempts++;
        const orientation = Math.random() < 0.5 ? 'horizontal' : 'vertical';
        const maxRow = orientation === 'horizontal' ? BOARD_SIZE : BOARD_SIZE - ship.size;
        const maxCol = orientation === 'horizontal' ? BOARD_SIZE - ship.size : BOARD_SIZE;

        const r = Math.floor(Math.random() * maxRow);
        const c = Math.floor(Math.random() * maxCol);
        const coords = getShipCoords(r, c, ship.size, orientation);

        // Valida contra os já inseridos nessa frota
        let collision = false;
        for (const coord of coords) {
          for (const key in fleet) {
            if (fleet[key].coords.some(ex => ex.r === coord.r && ex.c === coord.c)) {
              collision = true;
              break;
            }
          }
          if (collision) break;
        }

        if (!collision) {
          fleet[ship.key] = {
            key: ship.key,
            name: ship.name,
            size: ship.size,
            orientation: orientation,
            coords: coords
          };
          placed = true;
        }
      }
    });

    return fleet;
  }

  function updatePlacementControls() {
    const placedCount = Object.keys(AppState.playerFleetPlacement).length;
    const btnStart = document.getElementById('btn-start-battle');
    if (btnStart) {
      btnStart.disabled = placedCount < 5;
    }
  }

  /* --------------------------------------------------------------------------
     7. SISTEMA DE BATALHA & EXECUÇÃO DO JOGO
     -------------------------------------------------------------------------- */
  function startBattle() {
    if (Object.keys(AppState.playerFleetPlacement).length < 5) return;

    // Inicializa Tabuleiro do Jogador
    AppState.playerBoard = createEmptyMatrix();
    AppState.playerFleet = {};
    for (const key in AppState.playerFleetPlacement) {
      const ship = AppState.playerFleetPlacement[key];
      AppState.playerFleet[key] = {
        key: ship.key,
        name: ship.name,
        size: ship.size,
        coords: ship.coords.map(c => ({ ...c })),
        hits: 0,
        sunk: false
      };
      ship.coords.forEach(coord => {
        AppState.playerBoard[coord.r][coord.c].hasShip = key;
      });
    }

    // Inicializa Tabuleiro da IA
    AppState.enemyBoard = createEmptyMatrix();
    const enemyFleetGenerated = generateRandomFleet();
    AppState.enemyFleet = {};
    for (const key in enemyFleetGenerated) {
      const ship = enemyFleetGenerated[key];
      AppState.enemyFleet[key] = {
        key: ship.key,
        name: ship.name,
        size: ship.size,
        coords: ship.coords.map(c => ({ ...c })),
        hits: 0,
        sunk: false
      };
      ship.coords.forEach(coord => {
        AppState.enemyBoard[coord.r][coord.c].hasShip = key;
      });
    }

    // Inicializa IA
    AppState.aiRemainingCells = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        AppState.aiRemainingCells.push({ r, c });
      }
    }
    AppState.aiTargetStack = [];
    AppState.aiCurrentShipHits = [];

    // Estatísticas e Tempo
    AppState.attacks = 0;
    AppState.hits = 0;
    AppState.misses = 0;
    AppState.gameActive = true;
    AppState.currentTurn = 'player';
    AppState.startTime = Date.now();

    if (AppState.timerInterval) clearInterval(AppState.timerInterval);
    AppState.timerInterval = setInterval(updateTimerDisplay, 1000);

    // Renderiza arena
    renderBattleBoards();
    updateHUD();
    renderFleetLifeBars();
    setHudTurn('player');
    setBattleLog('Radar online. Frota inimiga detectada. Faça seu primeiro disparo!');

    showScreen('screen-battle');
  }

  function createEmptyMatrix() {
    const matrix = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
      const row = [];
      for (let c = 0; c < BOARD_SIZE; c++) {
        row.push({
          hasShip: null,
          state: 'empty' // 'empty', 'water', 'hit', 'sunk'
        });
      }
      matrix.push(row);
    }
    return matrix;
  }

  function renderBattleBoards() {
    // Renderiza tabuleiro do jogador
    const pBoard = document.getElementById('player-board');
    if (pBoard) {
      pBoard.innerHTML = '';
      for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
          const cell = document.createElement('div');
          cell.className = 'cell';
          cell.dataset.row = r;
          cell.dataset.col = c;

          const cellData = AppState.playerBoard[r][c];
          if (cellData.hasShip && cellData.state === 'empty') {
            cell.classList.add('has-ship');
          } else if (cellData.state === 'water') {
            cell.classList.add('cell-water', 'cell-attacked');
          } else if (cellData.state === 'hit') {
            cell.classList.add('cell-hit', 'cell-attacked');
          } else if (cellData.state === 'sunk') {
            cell.classList.add('cell-sunk', 'cell-attacked');
          }

          pBoard.appendChild(cell);
        }
      }
    }

    // Renderiza tabuleiro do inimigo
    const eBoard = document.getElementById('enemy-board');
    if (eBoard) {
      eBoard.innerHTML = '';
      for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
          const cell = document.createElement('div');
          cell.className = 'cell';
          cell.dataset.row = r;
          cell.dataset.col = c;

          const cellData = AppState.enemyBoard[r][c];
          if (cellData.state === 'water') {
            cell.classList.add('cell-water', 'cell-attacked');
          } else if (cellData.state === 'hit') {
            cell.classList.add('cell-hit', 'cell-attacked');
          } else if (cellData.state === 'sunk') {
            cell.classList.add('cell-sunk', 'cell-attacked');
          }

          cell.addEventListener('click', () => handlePlayerAttack(r, c));
          eBoard.appendChild(cell);
        }
      }
    }
  }

  function renderFleetLifeBars() {
    // Mini barras de navios no cabeçalho de cada tabuleiro
    const pContainer = document.getElementById('player-fleet-status');
    const eContainer = document.getElementById('enemy-fleet-status');

    if (pContainer) {
      pContainer.innerHTML = '';
      FLEET_SPEC.forEach(spec => {
        const ship = AppState.playerFleet[spec.key];
        const dot = document.createElement('span');
        dot.className = `ship-life-dot ${ship && ship.sunk ? 'dead' : ''}`;
        dot.title = `${spec.name}: ${ship && ship.sunk ? 'Afundado' : 'Operacional'}`;
        pContainer.appendChild(dot);
      });
    }

    if (eContainer) {
      eContainer.innerHTML = '';
      FLEET_SPEC.forEach(spec => {
        const ship = AppState.enemyFleet[spec.key];
        const dot = document.createElement('span');
        dot.className = `ship-life-dot ${ship && ship.sunk ? 'dead' : ''}`;
        dot.title = `${spec.name}: ${ship && ship.sunk ? 'Afundado' : 'Oculto'}`;
        eContainer.appendChild(dot);
      });
    }
  }

  /* --------------------------------------------------------------------------
     8. ATAQUE DO JOGADOR
     -------------------------------------------------------------------------- */
  function handlePlayerAttack(r, c) {
    if (!AppState.gameActive || AppState.currentTurn !== 'player') return;

    const cellData = AppState.enemyBoard[r][c];
    if (cellData.state !== 'empty') {
      sound.playClick();
      return; // Já foi atacada
    }

    sound.playShot();
    AppState.attacks++;

    const letters = ['A','B','C','D','E','F','G','H','I','J'];
    const coordName = `${letters[c]}${r + 1}`;

    const cellEl = document.querySelector(`#enemy-board .cell[data-row="${r}"][data-col="${c}"]`);

    if (cellData.hasShip) {
      // Acerto!
      cellData.state = 'hit';
      AppState.hits++;
      const hitShip = AppState.enemyFleet[cellData.hasShip];
      hitShip.hits++;

      if (cellEl) cellEl.classList.add('cell-hit', 'cell-attacked');

      // Verifica se afundou
      if (hitShip.hits >= hitShip.size) {
        hitShip.sunk = true;
        markShipSunk(AppState.enemyBoard, hitShip, '#enemy-board');
        sound.playSink();
        showAttackToast('sunk', `🔥 NAVIO DESTRUÍDO: ${hitShip.name.toUpperCase()}!`);
        setBattleLog(`ALVO DESTRUÍDO! O ${hitShip.name} inimigo foi ao fundo em ${coordName}!`);
        triggerScreenShake();
      } else {
        sound.playHit();
        showAttackToast('hit', '💥 ACERTO!');
        setBattleLog(`FOGO CONFIRMADO! Projétil atingiu uma embarcação em ${coordName}!`);
      }

      updateHUD();
      renderFleetLifeBars();

      // Checa vitória
      if (checkGameOver('player')) {
        endGame('victory');
        return;
      }
    } else {
      // Água!
      cellData.state = 'water';
      AppState.misses++;
      if (cellEl) cellEl.classList.add('cell-water', 'cell-attacked');
      sound.playWater();
      showAttackToast('water', '🌊 ÁGUA!');
      setBattleLog(`ÁGUA! Projétil caiu no mar aberto nas coordenadas ${coordName}.`);
      updateHUD();
    }

    // Passa a vez para o Computador
    setHudTurn('computer');
    scheduleComputerTurn();
  }

  function markShipSunk(board, ship, selectorPrefix) {
    ship.coords.forEach(coord => {
      board[coord.r][coord.c].state = 'sunk';
      const cell = document.querySelector(`${selectorPrefix} .cell[data-row="${coord.r}"][data-col="${coord.c}"]`);
      if (cell) {
        cell.classList.remove('cell-hit');
        cell.classList.add('cell-sunk');
      }
    });
  }

  function triggerScreenShake() {
    const wrapper = document.getElementById('screen-battle');
    if (wrapper) {
      wrapper.classList.remove('shake-screen');
      void wrapper.offsetWidth; // trigger reflow
      wrapper.classList.add('shake-screen');
      setTimeout(() => wrapper.classList.remove('shake-screen'), 500);
    }
  }

  /* --------------------------------------------------------------------------
     9. INTELIGÊNCIA ARTIFICIAL (FÁCIL, NORMAL, DIFÍCIL)
     -------------------------------------------------------------------------- */
  function scheduleComputerTurn() {
    AppState.currentTurn = 'computer';
    const banner = document.getElementById('hud-status-banner');
    const statusText = document.getElementById('hud-status-text');

    if (banner) banner.classList.add('thinking');
    if (statusText) statusText.textContent = '🤖 COMPUTADOR ESTÁ PENSANDO...';

    // Delay tático de 650ms a 900ms para simulação de pensamento
    const delay = Math.floor(Math.random() * 250) + 650;
    setTimeout(() => {
      if (AppState.gameActive) {
        executeComputerTurn();
      }
    }, delay);
  }

  function executeComputerTurn() {
    const banner = document.getElementById('hud-status-banner');
    if (banner) banner.classList.remove('thinking');

    // Escolhe coordenada baseada na dificuldade
    const targetCoord = chooseAiCoordinate();
    if (!targetCoord) return;

    // Remove das disponíveis
    AppState.aiRemainingCells = AppState.aiRemainingCells.filter(
      c => !(c.r === targetCoord.r && c.c === targetCoord.c)
    );

    const r = targetCoord.r;
    const c = targetCoord.c;
    const cellData = AppState.playerBoard[r][c];
    const letters = ['A','B','C','D','E','F','G','H','I','J'];
    const coordName = `${letters[c]}${r + 1}`;

    const cellEl = document.querySelector(`#player-board .cell[data-row="${r}"][data-col="${c}"]`);

    sound.playShot();

    if (cellData.hasShip) {
      // IA acertou navio do jogador!
      cellData.state = 'hit';
      const hitShip = AppState.playerFleet[cellData.hasShip];
      hitShip.hits++;

      if (cellEl) cellEl.classList.add('cell-hit', 'cell-attacked');

      // Informa IA sobre o acerto
      onAiScoredHit(targetCoord, hitShip);

      if (hitShip.hits >= hitShip.size) {
        hitShip.sunk = true;
        markShipSunk(AppState.playerBoard, hitShip, '#player-board');
        sound.playSink();
        showAttackToast('sunk', `⚠️ SEU ${hitShip.name.toUpperCase()} FOI AFUNDADO!`);
        setBattleLog(`ALERTA CRÍTICO! O inimigo afundou o seu ${hitShip.name} em ${coordName}!`);
        triggerScreenShake();
        onAiSunkShip(hitShip);
      } else {
        sound.playHit();
        showAttackToast('hit', '💥 INIMIGO ACERTOU SUA FROTA!');
        setBattleLog(`ALERTA! Embarcação aliada foi atingida em ${coordName}!`);
      }

      renderFleetLifeBars();
      updateHUD();

      // Checa derrota do jogador
      if (checkGameOver('computer')) {
        endGame('defeat');
        return;
      }
    } else {
      // IA errou!
      cellData.state = 'water';
      if (cellEl) cellEl.classList.add('cell-water', 'cell-attacked');
      sound.playWater();
      setBattleLog(`O disparo inimigo atingiu o mar em ${coordName}.`);
    }

    // Devolve o turno ao jogador
    setHudTurn('player');
    const statusText = document.getElementById('hud-status-text');
    if (statusText) statusText.textContent = 'Seu turno! Dispare na Frota Inimiga.';
  }

  function chooseAiCoordinate() {
    // NÍVEL FÁCIL: Escolhe puramente aleatório entre as células restantes
    if (AppState.difficulty === 'easy') {
      if (AppState.aiRemainingCells.length === 0) return null;
      const idx = Math.floor(Math.random() * AppState.aiRemainingCells.length);
      return AppState.aiRemainingCells[idx];
    }

    // NÍVEL DIFÍCIL: Se tem alvos prioritários na reta identificada
    if (AppState.difficulty === 'hard') {
      const lineTarget = getHardAiLineTarget();
      if (lineTarget) return lineTarget;
    }

    // NÍVEL NORMAL / DIFÍCIL: Se tem alvos vizinhos na pilha
    while (AppState.aiTargetStack.length > 0) {
      const candidate = AppState.aiTargetStack.pop();
      if (isCellAvailable(candidate.r, candidate.c)) {
        return candidate;
      }
    }

    // NÍVEL DIFÍCIL (CAÇA POR PARIDADE):
    // Como o menor navio tem tamanho 2, todo navio cobre pelo menos uma célula onde (r + c) % 2 === 0!
    if (AppState.difficulty === 'hard') {
      const parityCells = AppState.aiRemainingCells.filter(c => (c.r + c.c) % 2 === 0);
      if (parityCells.length > 0) {
        const idx = Math.floor(Math.random() * parityCells.length);
        return parityCells[idx];
      }
    }

    // Fallback padrão: aleatório entre restantes
    if (AppState.aiRemainingCells.length === 0) return null;
    const idx = Math.floor(Math.random() * AppState.aiRemainingCells.length);
    return AppState.aiRemainingCells[idx];
  }

  function isCellAvailable(r, c) {
    if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE) return false;
    return AppState.playerBoard[r][c].state === 'empty';
  }

  function onAiScoredHit(coord, hitShip) {
    AppState.aiCurrentShipHits.push(coord);

    if (AppState.difficulty === 'easy') return;

    // Adiciona vizinhos ortogonais (Cima, Direita, Baixo, Esquerda)
    const neighbors = [
      { r: coord.r - 1, c: coord.c },
      { r: coord.r + 1, c: coord.c },
      { r: coord.r, c: coord.c - 1 },
      { r: coord.r, c: coord.c + 1 }
    ];

    // Embaralha para que não ataque sempre na mesma direção
    neighbors.sort(() => Math.random() - 0.5);

    neighbors.forEach(n => {
      if (isCellAvailable(n.r, n.c)) {
        AppState.aiTargetStack.push(n);
      }
    });
  }

  function onAiSunkShip(sunkShip) {
    // Quando afunda, limpa os acertos do navio atual
    AppState.aiCurrentShipHits = [];
  }

  function getHardAiLineTarget() {
    if (AppState.aiCurrentShipHits.length >= 2) {
      const hits = AppState.aiCurrentShipHits;
      const isHorizontal = hits[0].r === hits[1].r;
      const isVertical = hits[0].c === hits[1].c;

      if (isHorizontal) {
        const row = hits[0].r;
        const cols = hits.map(h => h.c).sort((a, b) => a - b);
        const minCol = cols[0];
        const maxCol = cols[cols.length - 1];

        // Tenta expandir à esquerda ou à direita
        const leftTarget = { r: row, c: minCol - 1 };
        const rightTarget = { r: row, c: maxCol + 1 };

        if (isCellAvailable(leftTarget.r, leftTarget.c)) return leftTarget;
        if (isCellAvailable(rightTarget.r, rightTarget.c)) return rightTarget;
      } else if (isVertical) {
        const col = hits[0].c;
        const rows = hits.map(h => h.r).sort((a, b) => a - b);
        const minRow = rows[0];
        const maxRow = rows[rows.length - 1];

        // Tenta expandir para cima ou para baixo
        const upTarget = { r: minRow - 1, c: col };
        const downTarget = { r: maxRow + 1, c: col };

        if (isCellAvailable(upTarget.r, upTarget.c)) return upTarget;
        if (isCellAvailable(downTarget.r, downTarget.c)) return downTarget;
      }
    }
    return null;
  }

  /* --------------------------------------------------------------------------
     10. HUD, TOASTS & FEEDBACK VISUAL
     -------------------------------------------------------------------------- */
  function updateHUD() {
    const attacksEl = document.getElementById('stat-attacks');
    const hitsEl = document.getElementById('stat-hits');
    const accEl = document.getElementById('stat-accuracy');
    const playerFleetEl = document.getElementById('stat-player-fleet');
    const enemyFleetEl = document.getElementById('stat-enemy-fleet');

    if (attacksEl) attacksEl.textContent = AppState.attacks;
    if (hitsEl) hitsEl.textContent = AppState.hits;

    const acc = AppState.attacks > 0 ? Math.round((AppState.hits / AppState.attacks) * 100) : 0;
    if (accEl) accEl.textContent = `${acc}%`;

    const playerRemaining = Object.values(AppState.playerFleet).filter(s => !s.sunk).length;
    const enemyRemaining = Object.values(AppState.enemyFleet).filter(s => !s.sunk).length;

    if (playerFleetEl) playerFleetEl.textContent = `${playerRemaining} / 5`;
    if (enemyFleetEl) enemyFleetEl.textContent = `${enemyRemaining} / 5`;
  }

  function setHudTurn(turn) {
    AppState.currentTurn = turn;
    const indicator = document.getElementById('hud-turn-indicator');
    const nameEl = document.getElementById('hud-turn-name');

    if (turn === 'player') {
      if (indicator) indicator.className = 'hud-turn-indicator turn-player';
      if (nameEl) nameEl.textContent = 'VOCÊ';
    } else {
      if (indicator) indicator.className = 'hud-turn-indicator turn-cpu';
      if (nameEl) nameEl.textContent = 'COMPUTADOR';
    }
  }

  function setBattleLog(msg) {
    const logMsg = document.getElementById('battle-log-msg');
    if (logMsg) logMsg.textContent = msg;
  }

  function updateTimerDisplay() {
    if (!AppState.startTime) return;
    const elapsed = Math.floor((Date.now() - AppState.startTime) / 1000);
    const mins = String(Math.floor(elapsed / 60)).padStart(2, '0');
    const secs = String(elapsed % 60).padStart(2, '0');
    const timerEl = document.getElementById('stat-timer');
    if (timerEl) timerEl.textContent = `${mins}:${secs}`;
  }

  let toastTimeout = null;
  function showAttackToast(type, text) {
    const toast = document.getElementById('attack-toast');
    const textEl = document.getElementById('toast-text');
    const iconEl = document.getElementById('toast-icon');
    if (!toast || !textEl || !iconEl) return;

    if (toastTimeout) clearTimeout(toastTimeout);

    toast.className = `attack-toast toast-${type} show`;
    textEl.textContent = text;

    if (type === 'water') {
      iconEl.textContent = '🌊';
    } else if (type === 'hit') {
      iconEl.textContent = '💥';
    } else {
      iconEl.textContent = '🔥';
    }

    toastTimeout = setTimeout(() => {
      toast.classList.remove('show');
    }, 1100);
  }

  /* --------------------------------------------------------------------------
     11. CONDIÇÃO DE VITÓRIA / DERROTA
     -------------------------------------------------------------------------- */
  function checkGameOver(whoAttacked) {
    if (whoAttacked === 'player') {
      const allSunk = Object.values(AppState.enemyFleet).every(s => s.sunk);
      return allSunk;
    } else {
      const allSunk = Object.values(AppState.playerFleet).every(s => s.sunk);
      return allSunk;
    }
  }

  function endGame(result) {
    AppState.gameActive = false;
    if (AppState.timerInterval) clearInterval(AppState.timerInterval);

    const elapsed = Math.floor((Date.now() - AppState.startTime) / 1000);
    const mins = String(Math.floor(elapsed / 60)).padStart(2, '0');
    const secs = String(elapsed % 60).padStart(2, '0');
    const timeStr = `${mins}:${secs}`;

    const acc = AppState.attacks > 0 ? Math.round((AppState.hits / AppState.attacks) * 100) : 0;
    const playerRemaining = Object.values(AppState.playerFleet).filter(s => !s.sunk).length;

    // Preenche estatísticas no modal
    document.getElementById('go-stat-attacks').textContent = AppState.attacks;
    document.getElementById('go-stat-hits').textContent = AppState.hits;
    document.getElementById('go-stat-misses').textContent = AppState.misses;
    document.getElementById('go-stat-accuracy').textContent = `${acc}%`;
    document.getElementById('go-stat-time').textContent = timeStr;
    document.getElementById('go-stat-ships').textContent = `${playerRemaining} / 5`;

    const card = document.getElementById('gameover-card');
    const icon = document.getElementById('gameover-icon');
    const title = document.getElementById('gameover-title');
    const desc = document.getElementById('gameover-desc');

    if (result === 'victory') {
      card.className = 'modal-window modal-gameover-card modal-victory';
      icon.textContent = '🏆';
      title.textContent = 'VITÓRIA!';
      desc.textContent = 'Você destruiu toda a frota inimiga e dominou os mares!';
      sound.playVictory();
    } else {
      card.className = 'modal-window modal-gameover-card modal-defeat';
      icon.textContent = '💀';
      title.textContent = 'DERROTA!';
      desc.textContent = 'Sua frota foi aniquilada pelas forças inimigas.';
      sound.playDefeat();
    }

    openModal('modal-gameover');
  }

  /* --------------------------------------------------------------------------
     12. INICIALIZAÇÃO DE EVENT LISTENERS & INÍCIO DA APLICAÇÃO
     -------------------------------------------------------------------------- */
  function setupEventListeners() {
    // Menu Inicial
    document.getElementById('btn-play').addEventListener('click', () => {
      initPlacementScreen();
      showScreen('screen-placement');
    });

    document.getElementById('btn-how-to-play').addEventListener('click', () => {
      openModal('modal-how-to-play');
    });

    document.getElementById('btn-settings').addEventListener('click', () => {
      openModal('modal-settings');
    });

    document.getElementById('btn-credits').addEventListener('click', () => {
      openModal('modal-credits');
    });

    // Tela de Preparação
    document.getElementById('btn-back-to-home').addEventListener('click', () => {
      showScreen('screen-home');
    });

    document.getElementById('btn-rotate-ship').addEventListener('click', togglePlacementOrientation);
    document.getElementById('btn-randomize-placement').addEventListener('click', randomizePlayerFleet);
    document.getElementById('btn-clear-board').addEventListener('click', clearAllPlacement);
    document.getElementById('btn-start-battle').addEventListener('click', startBattle);

    // Botões de áudio rápidos no topo das telas
    const toggleAudio = () => {
      AppState.sfx = !AppState.sfx;
      AppState.music = AppState.sfx;
      saveSettings();
      applySettings();
      sound.playClick();
    };

    document.getElementById('btn-toggle-audio-placement').addEventListener('click', toggleAudio);
    document.getElementById('btn-toggle-audio-battle').addEventListener('click', toggleAudio);

    // Tela de Batalha
    document.getElementById('btn-restart-battle').addEventListener('click', () => {
      sound.playClick();
      if (confirm('Deseja reiniciar a batalha? A partida atual será perdida.')) {
        startBattle();
      }
    });

    document.getElementById('btn-menu-battle').addEventListener('click', () => {
      sound.playClick();
      if (confirm('Deseja voltar ao menu principal?')) {
        if (AppState.timerInterval) clearInterval(AppState.timerInterval);
        AppState.gameActive = false;
        showScreen('screen-home');
      }
    });

    // Fim de Jogo
    document.getElementById('btn-play-again').addEventListener('click', () => {
      closeModal('modal-gameover');
      initPlacementScreen();
      showScreen('screen-placement');
    });

    document.getElementById('btn-go-home').addEventListener('click', () => {
      closeModal('modal-gameover');
      showScreen('screen-home');
    });

    // Modal Configurações
    document.getElementById('cfg-sound-effects').addEventListener('change', (e) => {
      AppState.sfx = e.target.checked;
      sound.sfxEnabled = AppState.sfx;
      sound.playClick();
    });

    document.getElementById('cfg-ambient-music').addEventListener('change', (e) => {
      AppState.music = e.target.checked;
      sound.musicEnabled = AppState.music;
      if (AppState.music) sound.startAmbientMusic();
      else sound.stopAmbientMusic();
      sound.playClick();
    });

    document.querySelectorAll('.theme-choice-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        AppState.theme = btn.dataset.theme;
        applySettings();
        sound.playClick();
      });
    });

    document.querySelectorAll('.diff-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        AppState.difficulty = btn.dataset.diff;
        applySettings();
        sound.playClick();
      });
    });

    document.getElementById('btn-save-settings').addEventListener('click', () => {
      saveSettings();
      closeModal('modal-settings');
      sound.playClick();
    });

    // Desbloqueio do AudioContext no primeiro toque/clique em qualquer lugar da página
    window.addEventListener('click', () => {
      sound.init();
    }, { once: true });
  }

  // Inicialização Geral
  window.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    setupModals();
    setupEventListeners();
    initBubbles();
  });

})();
