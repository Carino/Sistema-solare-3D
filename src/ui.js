import { CELESTIAL_BODIES, formatScientific, formatNumber } from './solarData.js';

export class UIManager {
  constructor(gravityEngine, solarScene) {
    this.gravityEngine = gravityEngine;
    this.solarScene = solarScene;
    this.selectedBodyId = 'earth';

    this.createDomStructure();
    this.solarScene.initLabels(document.getElementById('labels-overlay'));
    this.setupListeners();
    this.updateBodySelection('earth');
    this.updateLabelsCountBadge();
    this.startTelemetryLoop();

    // Sincronizzazione automatica se un'etichetta viene nascosta o mostrata
    this.solarScene.onLabelVisibilityChange((bodyId, visible) => {
      this.handleLabelVisibilityChanged(bodyId, visible);
    });
  }

  createDomStructure() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <!-- Overlay per Etichette 3D dei Corpi Celesti -->
      <div id="labels-overlay" class="labels-overlay"></div>

      <div class="hud-container">
        <!-- Barra Superiore -->
        <header class="top-bar">
          <div class="brand">
            <div class="brand-icon">
              <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" fill="none" stroke-width="2">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
              </svg>
            </div>
            <div>
              <h1 class="brand-title">SISTEMA SOLARE 3D</h1>
              <p class="brand-subtitle">Simulatore di Gravità Newtoniana & Dinamica Orbitale</p>
            </div>
          </div>

          <!-- Pulsantiera di selezione rapida pianeti -->
          <nav class="planet-selector-bar" id="planet-chips">
            ${CELESTIAL_BODIES.map(b => `
              <button class="planet-chip ${b.id === 'earth' ? 'active' : ''}" data-id="${b.id}" id="chip-${b.id}">
                <span class="chip-dot" style="background: ${b.color};"></span>
                <span class="chip-name">${b.name}</span>
              </button>
            `).join('')}
          </nav>

          <div class="top-actions">
            <button class="btn-ghost" id="btn-fullscreen" title="Modalità Schermo Intero (Tasto F)">
              <span id="fullscreen-icon">⛶</span>
              <span id="fullscreen-label">Schermo Intero</span>
            </button>
            <button class="btn-ghost active" id="btn-toggle-sidebar" title="Mostra o nascondi il pannello informativo laterale (Tasto I)">
              <span id="sidebar-toggle-icon">✕</span>
              <span id="sidebar-toggle-label">Chiudi Info</span>
            </button>
            <button class="btn-ghost" id="btn-physics-info" title="Spiegazione delle Leggi Fisiche">
              <span>📖 Leggi Fisiche</span>
            </button>
            <button class="btn-danger-outline" id="btn-reset-all" title="Ripristina masse e orbite originali">
              <span>↺ Reset Sistema</span>
            </button>
          </div>
        </header>

        <!-- Pannello Laterale Ispettore & Modifica Massa -->
        <aside class="sidebar-inspector" id="sidebar-inspector">
          <div class="inspector-card">
            <!-- Testata Corpo Celeste con pulsante di chiusura rapida -->
            <div class="body-header">
              <div class="body-title-wrap">
                <span class="body-badge" id="body-type-badge">Pianeta</span>
                <h2 class="body-title" id="body-name">Terra</h2>
              </div>
              <div class="body-header-actions">
                <div class="body-color-ring" id="body-color-ring"></div>
                <button class="btn-close-panel" id="btn-close-sidebar" title="Chiudi pannello informativo per maggiore visibilità (Tasto I)">
                  ✕
                </button>
              </div>
            </div>

            <p class="body-description" id="body-desc">
              Descrizione del pianeta
            </p>

            <!-- CONTROLLO ETICHETTA NOME SINGOLA PER QUESTO CORPO -->
            <div class="single-label-control-box">
              <div class="single-label-info">
                <span class="single-label-icon">🏷️</span>
                <div class="single-label-meta">
                  <span class="single-label-title">Etichetta Nome 3D</span>
                  <span class="single-label-status" id="body-label-status-desc">Visibile nello spazio</span>
                </div>
              </div>
              <button class="btn-single-label active" id="btn-toggle-body-label" title="Mostra o nascondi il nome 3D di questo corpo celeste">
                <span class="btn-dot-status"></span>
                <span id="btn-toggle-body-label-text">Visibile</span>
              </button>
            </div>

            <!-- CONTROLLO MASSA GRAVITAZIONALE (Requisito primario) -->
            <div class="control-box mass-control-section">
              <div class="control-box-header">
                <span class="section-label">⚖️ MODIFICA MASSA GRAVITAZIONALE</span>
                <span class="mass-multiplier-badge" id="mass-multiplier-val">1.00x</span>
              </div>
              
              <div class="slider-wrapper">
                <input type="range" id="mass-slider" min="0.05" max="10.0" step="0.05" value="1.0" class="custom-slider" />
              </div>

              <div class="quick-mass-presets">
                <button class="preset-btn" data-factor="0.2">0.2x</button>
                <button class="preset-btn" data-factor="0.5">0.5x</button>
                <button class="preset-btn active" data-factor="1.0">1.0x (Reale)</button>
                <button class="preset-btn" data-factor="2.0">2.0x</button>
                <button class="preset-btn" data-factor="5.0">5.0x</button>
                <button class="preset-btn" data-factor="10.0">10x</button>
              </div>

              <div class="mass-display-row">
                <div class="data-mini">
                  <span class="data-mini-label">Massa Effettiva:</span>
                  <span class="data-mini-value" id="body-real-mass">5.97 × 10<sup>24</sup> kg</span>
                </div>
                <div class="data-mini">
                  <span class="data-mini-label">Massa Sim:</span>
                  <span class="data-mini-value" id="body-sim-mass">24.0 u</span>
                </div>
              </div>

              <!-- Effetto Fisico Gravitazionale -->
              <div class="physics-alert-box" id="physics-alert">
                <span class="alert-icon">⚡</span>
                <span class="alert-text" id="physics-alert-text">
                  Modificando la massa, l'attrazione gravitazionale secondo <b>F = G·(M·m)/r²</b> altera immediatamente l'orbita e la velocità orbitale.
                </span>
              </div>

              <div class="orbit-stabilize-row" id="orbit-stabilize-row">
                <button class="btn-primary" id="btn-stabilize-orbit" title="Ricalcola la velocità orbitale per un'orbita circolare stabile alla massa attuale">
                  🎯 Stabilizza Orbita (v = √GM/r)
                </button>
              </div>
            </div>

            <!-- TELEMETRIA FISICA IN TEMPO REALE -->
            <div class="control-box">
              <span class="section-label">📊 TELEMETRIA DINAMICA & FISICA</span>
              
              <div class="telemetry-grid">
                <div class="telemetry-item">
                  <span class="t-label">Velocità Orbitale</span>
                  <span class="t-value" id="t-speed">29.8 km/s</span>
                  <span class="t-sub" id="t-speed-formula">v = √(GM / r)</span>
                </div>

                <div class="telemetry-item">
                  <span class="t-label">Periodo Orbitale (T)</span>
                  <span class="t-value" id="t-period">365.2 giorni</span>
                  <span class="t-sub">3ª Legge di Keplero</span>
                </div>

                <div class="telemetry-item">
                  <span class="t-label">Gravità di Superficie (g)</span>
                  <span class="t-value" id="t-gravity">9.81 m/s²</span>
                  <span class="t-sub" id="t-gravity-earth">1.00 g terrestre</span>
                </div>

                <div class="telemetry-item">
                  <span class="t-label">Forza Gravitazionale (Fg)</span>
                  <span class="t-value" id="t-force">3.54 × 10²² N</span>
                  <span class="t-sub">verso il Sole</span>
                </div>

                <div class="telemetry-item">
                  <span class="t-label">Distanza dal Sole</span>
                  <span class="t-value" id="t-dist-au">1.00 AU</span>
                  <span class="t-sub" id="t-dist-km">149.6M km</span>
                </div>

                <div class="telemetry-item">
                  <span class="t-label">Velocità di Fuga</span>
                  <span class="t-value" id="t-escape">11.2 km/s</span>
                  <span class="t-sub">v_esc = √(2gR)</span>
                </div>
              </div>
            </div>

            <!-- Azione Vista Camera sul Pianeta -->
            <div class="view-planet-actions">
              <button class="btn-accent" id="btn-focus-planet">
                🔭 Aggancia e Segui Corpo
              </button>
            </div>
          </div>
        </aside>

        <!-- Linguetta fluttuante per riaprire la tendina di destra quando è chiusa -->
        <button class="sidebar-tab-trigger hidden" id="btn-open-sidebar" title="Apri Pannello Informazioni (Tasto I)">
          <span class="tab-arrow">◀</span>
          <span class="chip-dot" id="tab-body-dot" style="background: #2a75d3;"></span>
          <span class="tab-label" id="tab-body-name">Terra</span>
        </button>

        <!-- Barra Inferiore Controlli Simulazione -->
        <footer class="bottom-bar">
          <!-- Play / Pause & Time Speed -->
          <div class="sim-speed-controls">
            <button class="btn-icon" id="btn-play-pause" title="Avvia o metti in pausa la simulazione">
              <span id="play-pause-icon">⏸</span>
            </button>
            
            <div class="speed-slider-wrap">
              <span class="speed-label">Velocità Tempo:</span>
              <input type="range" id="time-speed-slider" min="0.1" max="5.0" step="0.1" value="1.0" class="time-slider" />
              <span class="speed-val" id="time-speed-val">1.0x</span>
            </div>
          </div>

          <!-- Selettore Modalità Gravitazionale -->
          <div class="physics-mode-selector">
            <span class="mode-label">Motore Fisico:</span>
            <div class="segmented-control">
              <button class="segment-btn active" id="btn-mode-nbody-real" title="Simulazione numerica Verlet N-Corpi con masse astronomiche proporzionali reali: orbite stabili e perturbazioni gravitazionali realistiche">
                🔭 Newton Reale
              </button>
              <button class="segment-btn" id="btn-mode-nbody" title="Simulazione numerica Verlet N-Corpi con masse grafiche amplificate (Sandbox caotico con forti perturbazioni)">
                🌌 Newton N-Corpi
              </button>
              <button class="segment-btn" id="btn-mode-kepler" title="Dinamica Kepleriana analitica con orbite chiuse e velocità calcolata dalla 3ª legge di Keplero">
                🪐 Dinamica Kepleriana
              </button>
            </div>
          </div>

          <!-- Visual Toggles -->
          <div class="toggles-wrap">
            <label class="toggle-btn" title="Mostra/Nascondi le traiettorie orbitali teoriche">
              <input type="checkbox" id="toggle-orbits" checked />
              <span class="toggle-custom"></span>
              <span class="toggle-text">Orbite</span>
            </label>

            <label class="toggle-btn" title="Mostra/Nascondi le scie dinamiche percorse dai corpi">
              <input type="checkbox" id="toggle-trails" checked />
              <span class="toggle-custom"></span>
              <span class="toggle-text">Scie</span>
            </label>

            <label class="toggle-btn" title="Mostra o nascondi tutte le etichette con i nomi">
              <input type="checkbox" id="toggle-labels-global" checked />
              <span class="toggle-custom"></span>
              <span class="toggle-text">Nomi</span>
            </label>

            <button class="btn-labels-manager" id="btn-labels-manager" title="Gestione selettiva dei nomi per singoli corpi celesti">
              <span class="btn-labels-icon">🏷️</span>
              <span>Singoli</span>
              <span class="labels-count-badge" id="labels-count-badge">11/11</span>
            </button>
          </div>

          <!-- Telecamere Preset -->
          <div class="camera-presets">
            <button class="cam-btn active" id="cam-free" title="Rotazione libera 3D tramite mouse">Libera</button>
            <button class="cam-btn" id="cam-overview" title="Vista panoramica del sistema solare">Panoramica</button>
            <button class="cam-btn" id="cam-top" title="Vista zenitale perpendicolare all'eclittica">Zenit 2D</button>
            <button class="cam-btn" id="cam-follow" title="Segui il corpo celeste selezionato">Segui</button>
          </div>
        </footer>

        <!-- CONTROLLER DI NAVIGAZIONE FLUTTUANTE: FRECCE & ZOOM -->
        <div class="nav-floating-widget" id="nav-floating-widget">
          <div class="nav-widget-inner">
            <!-- D-Pad Direzionale a Croce -->
            <div class="dpad-container" title="Ruota l'ambiente 3D sugli assi (Tieni premuto o usa le FRECCE della tastiera)">
              <button class="dpad-btn dpad-up" id="dpad-up" title="Ruota Su (Freccia Su)">▲</button>
              <button class="dpad-btn dpad-left" id="dpad-left" title="Ruota a Sinistra (Freccia Sinistra)">◄</button>
              <button class="dpad-btn dpad-center" id="dpad-reset" title="Ripristina Visuale Iniziale">⟲</button>
              <button class="dpad-btn dpad-right" id="dpad-right" title="Ruota a Destra (Freccia Destra)">►</button>
              <button class="dpad-btn dpad-down" id="dpad-down" title="Ruota Giù (Freccia Giù)">▼</button>
            </div>

            <!-- Pulsanti Zoom Rapido -->
            <div class="zoom-controls-col">
              <button class="zoom-btn" id="btn-zoom-in" title="Zoom Avanti (+ o Shift + Freccia Su)">+</button>
              <div class="zoom-label">ZOOM</div>
              <button class="zoom-btn" id="btn-zoom-out" title="Zoom Indietro (- o Shift + Freccia Giù)">−</button>
            </div>

            <!-- Selettore Modalità Frecce Verticali -->
            <div class="arrow-mode-box">
              <span class="arrow-mode-title">Frecce ▲ / ▼</span>
              <button class="arrow-mode-toggle active" id="btn-toggle-arrow-mode" title="Cambia funzione delle frecce su/giù: Ruota oppure Zoom">
                <span id="arrow-mode-label">🔄 Ruota</span>
              </button>
            </div>
          </div>

          <!-- Striscia Promemoria Comandi Tastiera & Mouse -->
          <div class="nav-guide-strip">
            <span class="guide-icon">🎮</span>
            <span class="guide-text">
              <b>Frecce ◄ ▲ ▼ ►</b> ruota &nbsp;|&nbsp; 
              <b>+ / −</b> (o <b>Shift+▲/▼</b>) zoom &nbsp;|&nbsp; 
              <b>Mouse:</b> Trascina per ruotare, Rotellina zoom
            </span>
          </div>
        </div>

        <!-- POPOVER GESTIONE NOMI SINGOLI CORPI CELESTI -->
        <div class="labels-popover hidden" id="labels-popover">
          <div class="popover-header">
            <div class="popover-title-row">
              <span class="popover-icon">🏷️</span>
              <div class="popover-title-wrap">
                <h3 class="popover-title">Nomi Singoli Corpi Celesti</h3>
                <p class="popover-subtitle">Attiva o disattiva il nome per ciascun pianeta nello spazio 3D</p>
              </div>
              <button class="btn-popover-close" id="btn-close-labels-popover" title="Chiudi">✕</button>
            </div>
            <div class="popover-quick-bar">
              <button class="btn-quick-action" id="btn-labels-show-all">✓ Mostra Tutti</button>
              <button class="btn-quick-action btn-quick-ghost" id="btn-labels-hide-all">✕ Nascondi Tutti</button>
            </div>
          </div>

          <div class="popover-grid" id="popover-labels-grid">
            ${CELESTIAL_BODIES.map(b => `
              <div class="popover-item-row" data-id="${b.id}" id="popover-row-${b.id}">
                <div class="item-left">
                  <span class="item-dot" style="background: ${b.color}; box-shadow: 0 0 6px ${b.color};"></span>
                  <span class="item-name">${b.name}</span>
                  <span class="item-type-badge">${b.type === 'star' ? 'Stella' : b.type === 'planet' ? 'Pianeta' : b.type === 'moon' ? 'Satellite' : 'Pianeta Nano'}</span>
                </div>
                <label class="switch-toggle" title="Visibilità etichetta per ${b.name}">
                  <input type="checkbox" class="checkbox-body-label" data-id="${b.id}" checked />
                  <span class="switch-track"></span>
                </label>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Modal Informativo Leggi Fisiche -->
        <div class="modal-overlay hidden" id="physics-modal">
          <div class="modal-card">
            <div class="modal-header">
              <h3>📐 Leggi della Fisica Gravitazionale nel Simulatore</h3>
              <button class="btn-close" id="btn-close-modal">✕</button>
            </div>
            <div class="modal-body">
              <div class="formula-card">
                <h4>1. Legge di Gravitazione Universale di Newton</h4>
                <div class="math-formula">F = G · (m₁ · m₂) / r²</div>
                <p>
                  Ogni punto materiale attrae ogni altro con una forza proporzionale al prodotto delle loro masse e inversamente proporzionale al quadrato della loro distanza. Nel simulatore, modificando la massa di qualsiasi pianeta o del Sole, le forze reciproche e le accelerazioni subiscono un cambiamento istantaneo calcolato a ogni frame!
                </p>
              </div>

              <div class="formula-card">
                <h4>2. Velocità Orbitale Circolare</h4>
                <div class="math-formula">v = √(G · M / r)</div>
                <p>
                  Per mantenere un'orbita circolare stabile, la forza centripeta richiesta deve bilanciare esattamente l'attrazione gravitazionale. Se aumenti la massa del Sole, i pianeti necessitano di velocità maggiori per non precipitare verso la stella.
                </p>
              </div>

              <div class="formula-card">
                <h4>3. Terza Legge di Keplero (Formulazione Newtoniana)</h4>
                <div class="math-formula">T² = (4π² / G(M + m)) · a³</div>
                <p>
                  Il quadrato del periodo di rivoluzione è direttamente proporzionale al cubo del semiasse maggiore e inversamente proporzionale alla massa totale del sistema.
                </p>
              </div>

              <div class="formula-card">
                <h4>🎮 Controlli di Rotazione e Zoom (Tastiera & Mouse)</h4>
                <ul>
                  <li><b>Tasti Freccia (◄ ▲ ▼ ►)</b>: Ruota la visuale in tempo reale attorno a tutti gli assi del sistema solare.</li>
                  <li><b>Zoom Tastiera (+ / − oppure W / S)</b>: Avvicina o allontana la telecamera dallo spazio profondo al pianeta.</li>
                  <li><b>Shift + Freccia Su / Giù</b>: Zoom rapido con le sole frecce direzionali!</li>
                  <li><b>D-Pad & Pulsanti Zoom a Schermo</b>: Fai clic o tieni premuto con il mouse sui pulsanti direzionali nell'angolo in basso a sinistra.</li>
                  <li><b>Trascina con Tasto Sinistro del Mouse</b>: Ruota l'ambiente 3D su qualsiasi asse d'inclinazione.</li>
                  <li><b>Rotellina del Mouse</b>: Zoom continuo fluido.</li>
                  <li><b>Trascina con Tasto Destro</b>: Pan / traslazione orizzontale e verticale della telecamera.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  setupListeners() {
    // Click sui chip dei pianeti
    const chipsContainer = document.getElementById('planet-chips');
    chipsContainer.addEventListener('click', (e) => {
      const chip = e.target.closest('.planet-chip');
      if (chip) {
        const id = chip.dataset.id;
        this.selectBody(id);
      }
    });

    // Slider massa
    const massSlider = document.getElementById('mass-slider');
    massSlider.addEventListener('input', (e) => {
      const multiplier = parseFloat(e.target.value);
      this.applyMassMultiplier(multiplier);
    });

    // Preset massa rapida
    const presetButtons = document.querySelectorAll('.preset-btn');
    presetButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const factor = parseFloat(btn.dataset.factor);
        massSlider.value = factor;
        this.applyMassMultiplier(factor);
        presetButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    // Pulsante Stabilizza Orbita
    const btnStabilize = document.getElementById('btn-stabilize-orbit');
    btnStabilize.addEventListener('click', () => {
      this.gravityEngine.stabilizeOrbit(this.selectedBodyId);
      this.showTemporaryToast(`Orbita di ${this.gravityEngine.bodyMap.get(this.selectedBodyId).name} stabilizzata a v = √GM/r`);
    });

    // Pulsante Focus / Segui
    const btnFocus = document.getElementById('btn-focus-planet');
    btnFocus.addEventListener('click', () => {
      this.solarScene.focusOnBody(this.selectedBodyId);
      this.setCameraMode('follow');
    });

    // Play / Pause
    const btnPlayPause = document.getElementById('btn-play-pause');
    const playPauseIcon = document.getElementById('play-pause-icon');
    btnPlayPause.addEventListener('click', () => {
      this.gravityEngine.isPaused = !this.gravityEngine.isPaused;
      playPauseIcon.textContent = this.gravityEngine.isPaused ? '▶' : '⏸';
      btnPlayPause.classList.toggle('paused', this.gravityEngine.isPaused);
    });

    // Velocità simulazione
    const speedSlider = document.getElementById('time-speed-slider');
    const speedVal = document.getElementById('time-speed-val');
    speedSlider.addEventListener('input', (e) => {
      const speed = parseFloat(e.target.value);
      this.gravityEngine.timeScale = speed;
      speedVal.textContent = `${speed.toFixed(1)}x`;
    });

    // Modalità Fisica (3 modalità distinte)
    const btnModeNbodyReal = document.getElementById('btn-mode-nbody-real');
    const btnModeNbody = document.getElementById('btn-mode-nbody');
    const btnModeKepler = document.getElementById('btn-mode-kepler');

    const updateModeButtons = (activeBtn) => {
      [btnModeNbodyReal, btnModeNbody, btnModeKepler].forEach(btn => {
        if (btn) btn.classList.toggle('active', btn === activeBtn);
      });
    };

    if (btnModeNbodyReal) {
      btnModeNbodyReal.addEventListener('click', () => {
        this.gravityEngine.setMode('nbody-real');
        updateModeButtons(btnModeNbodyReal);
        this.showTemporaryToast('🔭 Modalità Newton Reale Attiva: Masse proporzionali reali e orbite stabili');
        this.updateBodySelection(this.selectedBodyId);
      });
    }

    if (btnModeNbody) {
      btnModeNbody.addEventListener('click', () => {
        this.gravityEngine.setMode('nbody');
        updateModeButtons(btnModeNbody);
        this.showTemporaryToast('🌌 Modalità Newton N-Corpi (Sandbox) Attiva: Masse amplificate con perturbazioni caotiche');
        this.updateBodySelection(this.selectedBodyId);
      });
    }

    if (btnModeKepler) {
      btnModeKepler.addEventListener('click', () => {
        this.gravityEngine.setMode('keplerian');
        updateModeButtons(btnModeKepler);
        this.showTemporaryToast('🪐 Modalità Dinamica Kepleriana Attiva: Orbite chiuse analitiche');
        this.updateBodySelection(this.selectedBodyId);
      });
    }

    // Toggle orbite & scie
    const toggleOrbits = document.getElementById('toggle-orbits');
    toggleOrbits.addEventListener('change', (e) => {
      this.solarScene.showOrbits = e.target.checked;
    });
    const toggleTrails = document.getElementById('toggle-trails');
    toggleTrails.addEventListener('change', (e) => {
      this.solarScene.showTrails = e.target.checked;
    });

    // Toggle Globale Etichette Nomi
    const toggleLabelsGlobal = document.getElementById('toggle-labels-global');
    if (toggleLabelsGlobal) {
      toggleLabelsGlobal.addEventListener('change', (e) => {
        this.solarScene.setGlobalLabelsVisible(e.target.checked);
        this.updateLabelsCountBadge();
        this.updateBodyLabelUI();
        this.showTemporaryToast(e.target.checked ? 'Nomi 3D attivati' : 'Nomi 3D disattivati');
      });
    }

    // Toggle Singola Etichetta nel Pannello Ispettore
    const btnToggleBodyLabel = document.getElementById('btn-toggle-body-label');
    if (btnToggleBodyLabel) {
      btnToggleBodyLabel.addEventListener('click', () => {
        const newVis = this.solarScene.toggleBodyLabel(this.selectedBodyId);
        const bodyName = this.gravityEngine.bodyMap.get(this.selectedBodyId)?.name || 'Corpo';
        this.updateBodyLabelUI();
        this.updateLabelsCountBadge();
        const popoverCb = document.querySelector(`.checkbox-body-label[data-id="${this.selectedBodyId}"]`);
        if (popoverCb) popoverCb.checked = newVis;
        this.showTemporaryToast(newVis ? `Etichetta "${bodyName}" visibile` : `Etichetta "${bodyName}" nascosta`);
      });
    }

    // Popover Gestione Nomi Singoli
    const btnLabelsManager = document.getElementById('btn-labels-manager');
    const labelsPopover = document.getElementById('labels-popover');
    const btnCloseLabelsPopover = document.getElementById('btn-close-labels-popover');
    if (btnLabelsManager && labelsPopover) {
      btnLabelsManager.addEventListener('click', (e) => {
        e.stopPropagation();
        labelsPopover.classList.toggle('hidden');
      });
    }
    if (btnCloseLabelsPopover && labelsPopover) {
      btnCloseLabelsPopover.addEventListener('click', () => {
        labelsPopover.classList.add('hidden');
      });
    }

    // Chiudi Popover cliccando all'esterno
    document.addEventListener('click', (e) => {
      if (labelsPopover && !labelsPopover.classList.contains('hidden')) {
        if (!labelsPopover.contains(e.target) && !btnLabelsManager.contains(e.target)) {
          labelsPopover.classList.add('hidden');
        }
      }
    });

    // Toggle delle singole checkbox nel Popover
    const popoverGrid = document.getElementById('popover-labels-grid');
    if (popoverGrid) {
      popoverGrid.addEventListener('change', (e) => {
        const cb = e.target.closest('.checkbox-body-label');
        if (cb) {
          const bodyId = cb.dataset.id;
          const isChecked = cb.checked;
          this.solarScene.setBodyLabelVisible(bodyId, isChecked);
          this.updateLabelsCountBadge();
          if (bodyId === this.selectedBodyId) {
            this.updateBodyLabelUI();
          }
          const bodyName = this.gravityEngine.bodyMap.get(bodyId)?.name || bodyId;
          this.showTemporaryToast(isChecked ? `Nome "${bodyName}" visibile` : `Nome "${bodyName}" nascosto`);
        }
      });
    }

    // Pulsanti Mostra Tutti / Nascondi Tutti nel Popover
    const btnShowAll = document.getElementById('btn-labels-show-all');
    if (btnShowAll) {
      btnShowAll.addEventListener('click', () => {
        this.solarScene.setAllBodyLabelsVisible(true);
        this.solarScene.setGlobalLabelsVisible(true);
        if (toggleLabelsGlobal) toggleLabelsGlobal.checked = true;
        document.querySelectorAll('.checkbox-body-label').forEach(cb => { cb.checked = true; });
        this.updateLabelsCountBadge();
        this.updateBodyLabelUI();
        this.showTemporaryToast('Tutti i nomi sono ora visibili nello spazio 3D');
      });
    }

    const btnHideAll = document.getElementById('btn-labels-hide-all');
    if (btnHideAll) {
      btnHideAll.addEventListener('click', () => {
        this.solarScene.setAllBodyLabelsVisible(false);
        document.querySelectorAll('.checkbox-body-label').forEach(cb => { cb.checked = false; });
        this.updateLabelsCountBadge();
        this.updateBodyLabelUI();
        this.showTemporaryToast('Tutti i nomi sono stati nascosti singolarmente');
      });
    }

    // Telecamere
    const camButtons = {
      'cam-free': 'free',
      'cam-overview': 'overview',
      'cam-top': 'top',
      'cam-follow': 'follow'
    };
    Object.entries(camButtons).forEach(([btnId, mode]) => {
      const btn = document.getElementById(btnId);
      btn.addEventListener('click', () => {
        this.setCameraMode(mode);
      });
    });

    // Reset Sistema
    const btnResetAll = document.getElementById('btn-reset-all');
    btnResetAll.addEventListener('click', () => {
      this.gravityEngine.resetSystem();
      this.solarScene.setAllBodyLabelsVisible(true);
      this.solarScene.setGlobalLabelsVisible(true);
      const tgLabels = document.getElementById('toggle-labels-global');
      if (tgLabels) tgLabels.checked = true;
      document.querySelectorAll('.checkbox-body-label').forEach(cb => { cb.checked = true; });
      this.updateLabelsCountBadge();
      this.updateBodySelection(this.selectedBodyId);
      this.showTemporaryToast('Sistema Solare ripristinato ai parametri originali!');
    });

    // Modale Leggi Fisiche
    const btnInfo = document.getElementById('btn-physics-info');
    const modal = document.getElementById('physics-modal');
    const btnCloseModal = document.getElementById('btn-close-modal');
    btnInfo.addEventListener('click', () => modal.classList.remove('hidden'));
    btnCloseModal.addEventListener('click', () => modal.classList.add('hidden'));
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.add('hidden');
    });

    // Toggle Modalità Frecce Verticali (Ruota vs Zoom)
    const btnToggleArrowMode = document.getElementById('btn-toggle-arrow-mode');
    const arrowModeLabel = document.getElementById('arrow-mode-label');
    btnToggleArrowMode.addEventListener('click', () => {
      if (this.solarScene.arrowVerticalMode === 'orbit') {
        this.solarScene.arrowVerticalMode = 'zoom';
        arrowModeLabel.textContent = '🔍 Zoom';
        btnToggleArrowMode.classList.add('mode-zoom');
        this.showTemporaryToast('Frecce Su/Giù impostate su ZOOM');
      } else {
        this.solarScene.arrowVerticalMode = 'orbit';
        arrowModeLabel.textContent = '🔄 Ruota';
        btnToggleArrowMode.classList.remove('mode-zoom');
        this.showTemporaryToast('Frecce Su/Giù impostate su ROTAZIONE 3D');
      }
    });

    // Controllo Schermo Intero (Fullscreen)
    const btnFullscreen = document.getElementById('btn-fullscreen');
    if (btnFullscreen) {
      btnFullscreen.addEventListener('click', () => {
        this.toggleFullscreen();
      });
    }

    const onFullscreenChange = () => {
      this.updateFullscreenUI();
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', onFullscreenChange);

    // Controlli Chiusura / Apertura Tendina Destra
    const btnCloseSidebar = document.getElementById('btn-close-sidebar');
    if (btnCloseSidebar) {
      btnCloseSidebar.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.toggleSidebar(false);
      });
      btnCloseSidebar.addEventListener('pointerdown', (e) => e.stopPropagation());
    }

    const btnOpenSidebar = document.getElementById('btn-open-sidebar');
    if (btnOpenSidebar) {
      const handleOpen = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.toggleSidebar(true);
      };
      btnOpenSidebar.addEventListener('click', handleOpen);
      btnOpenSidebar.addEventListener('pointerdown', (e) => e.stopPropagation());
    }

    const btnToggleSidebar = document.getElementById('btn-toggle-sidebar');
    if (btnToggleSidebar) {
      btnToggleSidebar.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.toggleSidebar();
      });
    }

    // Scorciatoie da tastiera globali: 'F' per Schermo Intero, 'I' per Tendina Info
    window.addEventListener('keydown', (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;

      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        this.toggleFullscreen();
      } else if (e.key === 'i' || e.key === 'I') {
        e.preventDefault();
        this.toggleSidebar();
      }
    });

    // Helper per pressione prolungata (Mouse Hold & Touch)
    const bindHoldAction = (id, action) => {
      const el = document.getElementById(id);
      if (!el) return;
      let timer = null;
      let interval = null;

      const trigger = () => {
        action();
      };

      const start = (e) => {
        e.preventDefault();
        trigger();
        timer = setTimeout(() => {
          interval = setInterval(trigger, 25);
        }, 150);
      };

      const end = () => {
        clearTimeout(timer);
        clearInterval(interval);
      };

      el.addEventListener('mousedown', start);
      el.addEventListener('mouseup', end);
      el.addEventListener('mouseleave', end);
      el.addEventListener('touchstart', start, { passive: false });
      el.addEventListener('touchend', end);
    };

    // Navigazione D-Pad
    bindHoldAction('dpad-up', () => {
      if (this.solarScene.arrowVerticalMode === 'zoom') {
        this.solarScene.manualZoom(1.035);
      } else {
        this.solarScene.manualRotate(0, -1);
      }
    });

    bindHoldAction('dpad-down', () => {
      if (this.solarScene.arrowVerticalMode === 'zoom') {
        this.solarScene.manualZoom(0.965);
      } else {
        this.solarScene.manualRotate(0, 1);
      }
    });

    bindHoldAction('dpad-left', () => {
      this.solarScene.manualRotate(1, 0);
    });

    bindHoldAction('dpad-right', () => {
      this.solarScene.manualRotate(-1, 0);
    });

    // Reset visuale dal centro D-Pad
    const dpadReset = document.getElementById('dpad-reset');
    if (dpadReset) {
      dpadReset.addEventListener('click', () => {
        this.setCameraMode('overview');
        this.showTemporaryToast('Visuale telecamera ripristinata');
      });
    }

    // Zoom a schermo (+ e -)
    bindHoldAction('btn-zoom-in', () => {
      this.solarScene.manualZoom(1.04);
    });

    bindHoldAction('btn-zoom-out', () => {
      this.solarScene.manualZoom(0.96);
    });

    // Click 3D sui corpi celesti
    this.solarScene.onSelect((clickedId) => {
      this.selectBody(clickedId);
    });
  }

  setCameraMode(mode) {
    this.solarScene.setCameraMode(mode);
    const camButtons = ['cam-free', 'cam-overview', 'cam-top', 'cam-follow'];
    camButtons.forEach(id => {
      const btn = document.getElementById(id);
      if (btn) btn.classList.remove('active');
    });
    const activeBtn = document.getElementById(`cam-${mode}`);
    if (activeBtn) activeBtn.classList.add('active');
  }

  selectBody(bodyId) {
    this.selectedBodyId = bodyId;
    this.updateBodySelection(bodyId);

    // Se la camera è in follow, aggiorna il target
    if (this.solarScene.cameraMode === 'follow') {
      this.solarScene.focusOnBody(bodyId);
    }
  }

  applyMassMultiplier(multiplier) {
    this.gravityEngine.setBodyMassMultiplier(this.selectedBodyId, multiplier);
    document.getElementById('mass-multiplier-val').textContent = `${multiplier.toFixed(2)}x`;

    const body = this.gravityEngine.bodyMap.get(this.selectedBodyId);
    if (body) {
      document.getElementById('body-real-mass').innerHTML = `${formatScientific(body.realMassKg)} kg`;
      const simMassFmt = body.simMass < 0.1 ? body.simMass.toFixed(4) : (body.simMass < 10 ? body.simMass.toFixed(2) : body.simMass.toFixed(1));
      document.getElementById('body-sim-mass').textContent = `${simMassFmt} u`;
    }

    // Aggiorna indicatore preset
    const presetButtons = document.querySelectorAll('.preset-btn');
    presetButtons.forEach(b => {
      const f = parseFloat(b.dataset.factor);
      b.classList.toggle('active', Math.abs(f - multiplier) < 0.04);
    });

    // Testo di avviso dinamico
    const alertText = document.getElementById('physics-alert-text');
    if (this.selectedBodyId === 'sun') {
      if (multiplier > 1.2) {
        alertText.innerHTML = `⚠️ <b>Sole più massiccio:</b> L'attrazione gravitazionale è aumentata del ${Math.round((multiplier - 1) * 100)}%! I pianeti sono risucchiati in orbite più strette e veloci.`;
      } else if (multiplier < 0.8) {
        alertText.innerHTML = `⚠️ <b>Sole meno massiccio:</b> La forza di gravità è ridotta. Se la velocità dei pianeti supera la velocità di fuga, potrebbero sfuggire nello spazio profondo!`;
      } else {
        alertText.innerHTML = `Massa del Sole standard. L'equilibrio orbitale del sistema solare è stabile.`;
      }
    } else {
      if (multiplier > 2.0) {
        alertText.innerHTML = `<b>${body.name} super-massiccio (${multiplier.toFixed(1)}x):</b> Esercita forti perturbazioni gravitazionali sui corpi vicini!`;
      } else {
        alertText.innerHTML = `Modificando la massa, l'attrazione gravitazionale secondo <b>F = G·(M·m)/r²</b> altera immediatamente l'orbita e la velocità orbitale.`;
      }
    }
  }

  updateBodySelection(bodyId) {
    const body = this.gravityEngine.bodyMap.get(bodyId);
    if (!body) return;

    // Aggiorna chip attivi
    document.querySelectorAll('.planet-chip').forEach(c => c.classList.remove('active'));
    const chip = document.getElementById(`chip-${bodyId}`);
    if (chip) chip.classList.add('active');

    // Testata
    const typeNames = {
      star: 'Stella Madre',
      planet: 'Pianeta',
      moon: 'Satellite Naturale',
      dwarf_planet: 'Pianeta Nano'
    };
    document.getElementById('body-type-badge').textContent = typeNames[body.type] || 'Corpo Celeste';
    document.getElementById('body-name').textContent = body.name;
    document.getElementById('body-desc').textContent = body.cfg.description;

    const ring = document.getElementById('body-color-ring');
    ring.style.borderColor = body.cfg.color;
    ring.style.boxShadow = `0 0 16px ${body.cfg.color}88`;

    // Valori massa
    const slider = document.getElementById('mass-slider');
    slider.value = body.massMultiplier;
    document.getElementById('mass-multiplier-val').textContent = `${body.massMultiplier.toFixed(2)}x`;
    document.getElementById('body-real-mass').innerHTML = `${formatScientific(body.realMassKg)} kg`;
    const simMassFmt = body.simMass < 0.1 ? body.simMass.toFixed(4) : (body.simMass < 10 ? body.simMass.toFixed(2) : body.simMass.toFixed(1));
    document.getElementById('body-sim-mass').textContent = `${simMassFmt} u`;

    // Pulsante stabilizza (non visibile per il Sole)
    const rowStabilize = document.getElementById('orbit-stabilize-row');
    if (body.id === 'sun') {
      rowStabilize.style.display = 'none';
    } else {
      rowStabilize.style.display = 'block';
    }

    // Aggiorna preset
    const presetButtons = document.querySelectorAll('.preset-btn');
    presetButtons.forEach(b => {
      const f = parseFloat(b.dataset.factor);
      b.classList.toggle('active', Math.abs(f - body.massMultiplier) < 0.04);
    });

    // Aggiorna lo stato dell'etichetta singola nell'ispettore
    this.updateBodyLabelUI();

    // Aggiorna la linguetta laterale
    const tabName = document.getElementById('tab-body-name');
    if (tabName) tabName.textContent = body.name;
    const tabDot = document.getElementById('tab-body-dot');
    if (tabDot) tabDot.style.background = body.cfg.color;
  }

  updateBodyLabelUI() {
    const isVisible = this.solarScene.isBodyLabelVisible(this.selectedBodyId);
    const btn = document.getElementById('btn-toggle-body-label');
    const text = document.getElementById('btn-toggle-body-label-text');
    const desc = document.getElementById('body-label-status-desc');
    if (!btn || !text || !desc) return;

    if (!this.solarScene.showLabels) {
      btn.className = 'btn-single-label disabled';
      text.textContent = 'Spento (Globale)';
      desc.textContent = 'I nomi sono disattivati da \'Nomi\'';
      btn.disabled = true;
      return;
    }

    btn.disabled = false;
    if (isVisible) {
      btn.className = 'btn-single-label active';
      text.textContent = 'Visibile';
      desc.textContent = 'Visibile nello spazio 3D';
    } else {
      btn.className = 'btn-single-label inactive';
      text.textContent = 'Nascosto';
      desc.textContent = 'Nascosto singolarmente';
    }
  }

  updateLabelsCountBadge() {
    const badge = document.getElementById('labels-count-badge');
    if (!badge) return;
    const active = this.solarScene.getActiveLabelsCount();
    const total = CELESTIAL_BODIES.length;

    if (!this.solarScene.showLabels) {
      badge.textContent = 'Off';
      badge.classList.add('badge-off');
    } else {
      badge.textContent = `${active}/${total}`;
      badge.classList.remove('badge-off');
    }
  }

  handleLabelVisibilityChanged(bodyId, visible) {
    if (bodyId === 'all') {
      document.querySelectorAll('.checkbox-body-label').forEach(cb => { cb.checked = visible; });
    } else {
      const cb = document.querySelector(`.checkbox-body-label[data-id="${bodyId}"]`);
      if (cb) cb.checked = visible;
    }

    if (bodyId === this.selectedBodyId || bodyId === 'all') {
      this.updateBodyLabelUI();
    }
    this.updateLabelsCountBadge();
  }

  startTelemetryLoop() {
    const update = () => {
      this.updateTelemetry();
      requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  }

  updateTelemetry() {
    const tel = this.gravityEngine.getPhysicsTelemetry(this.selectedBodyId);
    if (!tel) return;

    // Velocità
    document.getElementById('t-speed').textContent = `${formatNumber(tel.speedKmS, 2)} km/s`;
    
    // Periodo
    if (tel.body.id === 'sun') {
      document.getElementById('t-period').textContent = 'Centro Sistema';
    } else if (tel.orbitalPeriodDays > 365) {
      document.getElementById('t-period').textContent = `${formatNumber(tel.orbitalPeriodDays / 365.25, 2)} anni`;
    } else {
      document.getElementById('t-period').textContent = `${formatNumber(tel.orbitalPeriodDays, 1)} giorni`;
    }

    // Gravità di superficie
    document.getElementById('t-gravity').textContent = `${formatNumber(tel.surfaceG, 2)} m/s²`;
    const gRatio = tel.surfaceG / 9.80665;
    document.getElementById('t-gravity-earth').textContent = `${formatNumber(gRatio, 2)} g terrestri`;

    // Forza gravitazionale
    if (tel.body.id === 'sun') {
      document.getElementById('t-force').textContent = '—';
    } else {
      document.getElementById('t-force').innerHTML = `${formatScientific(tel.gravitationalForceNewtons)} N`;
    }

    // Distanza
    if (tel.body.id === 'sun') {
      document.getElementById('t-dist-au').textContent = '0.00 AU';
      document.getElementById('t-dist-km').textContent = '0 km';
    } else {
      document.getElementById('t-dist-au').textContent = `${formatNumber(tel.distAU, 2)} AU`;
      document.getElementById('t-dist-km').textContent = `${formatNumber(tel.distKm / 1e6, 1)}M km`;
    }

    // Velocità di fuga
    document.getElementById('t-escape').textContent = `${formatNumber(tel.escapeVelocityKmS, 1)} km/s`;
  }

  showTemporaryToast(message) {
    let toast = document.getElementById('hud-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'hud-toast';
      toast.className = 'hud-toast';
      document.querySelector('.hud-container').appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('visible');
    clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      toast.classList.remove('visible');
    }, 2800);
  }

  // Toggle Schermo Intero
  toggleFullscreen() {
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
      const docEl = document.documentElement;
      if (docEl.requestFullscreen) {
        docEl.requestFullscreen().catch(err => console.warn('Fullscreen error:', err));
      } else if (docEl.webkitRequestFullscreen) {
        docEl.webkitRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(err => console.warn('Exit fullscreen error:', err));
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    }
  }

  updateFullscreenUI() {
    const isFullscreen = !!(document.fullscreenElement || document.webkitFullscreenElement);
    const btn = document.getElementById('btn-fullscreen');
    const icon = document.getElementById('fullscreen-icon');
    const label = document.getElementById('fullscreen-label');
    if (icon) icon.textContent = isFullscreen ? '🗗' : '⛶';
    if (label) label.textContent = isFullscreen ? 'Esci Schermo Intero' : 'Schermo Intero';
    if (btn) btn.classList.toggle('active', isFullscreen);
    this.showTemporaryToast(isFullscreen ? '⛶ Modalità Schermo Intero attiva' : '🗗 Uscito da Schermo Intero');
  }

  // Toggle Apertura / Chiusura Tendina Destra
  toggleSidebar(forceState = null) {
    const sidebar = document.getElementById('sidebar-inspector');
    const openTab = document.getElementById('btn-open-sidebar');
    const toggleBtn = document.getElementById('btn-toggle-sidebar');
    const toggleIcon = document.getElementById('sidebar-toggle-icon');
    const toggleLabel = document.getElementById('sidebar-toggle-label');
    if (!sidebar) return;

    const isCurrentlyCollapsed = sidebar.classList.contains('collapsed');
    const shouldCollapse = (forceState !== null) ? !forceState : !isCurrentlyCollapsed;

    if (shouldCollapse) {
      sidebar.classList.add('collapsed');
      if (openTab) openTab.classList.remove('hidden');
      if (toggleBtn) {
        toggleBtn.classList.remove('active');
        if (toggleIcon) toggleIcon.textContent = '📊';
        if (toggleLabel) toggleLabel.textContent = 'Mostra Info';
      }
      this.showTemporaryToast('Tendina informazioni chiusa (Premi "I" o clicca la linguetta a destra)');
    } else {
      sidebar.classList.remove('collapsed');
      if (openTab) openTab.classList.add('hidden');
      if (toggleBtn) {
        toggleBtn.classList.add('active');
        if (toggleIcon) toggleIcon.textContent = '✕';
        if (toggleLabel) toggleLabel.textContent = 'Chiudi Info';
      }
    }
  }
}
