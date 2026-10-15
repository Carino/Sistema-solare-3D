import './style.css';
import * as THREE from 'three';
import { CELESTIAL_BODIES } from './solarData.js';
import { GravityEngine } from './physics.js';
import { SolarSystemScene } from './scene.js';
import { UIManager } from './ui.js';

// Avvio dell'applicazione
function init() {
  const canvasContainer = document.getElementById('canvas-container');
  if (!canvasContainer) {
    console.error('Container WebGL non trovato');
    return;
  }

  // Inizializza il motore fisico di gravitazione universale
  const gravityEngine = new GravityEngine(CELESTIAL_BODIES);

  // Inizializza la scena 3D Three.js
  const solarScene = new SolarSystemScene(canvasContainer);

  // Inizializza l'HUD e il gestore dell'interfaccia utente
  const uiManager = new UIManager(gravityEngine, solarScene);

  // Clock ad alta precisione per l'animazione fisica
  const clock = new THREE.Clock();

  // Ciclo principale di rendering e simulazione fisica
  function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();

    // 1. Risolvi le equazioni di moto della gravitazione universale
    gravityEngine.update(delta);

    // 2. Sincronizza posizioni, rotazioni e scie nella scena 3D
    solarScene.updateFromPhysics(gravityEngine);

    // 3. Renderizza il frame
    solarScene.render();
  }

  animate();

  console.log('Sistema Solare 3D avviato con successo.');
}

window.addEventListener('DOMContentLoaded', init);
