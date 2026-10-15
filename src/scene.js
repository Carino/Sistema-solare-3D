import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as Textures from './textures.js';
import { CELESTIAL_BODIES } from './solarData.js';

export class SolarSystemScene {
  constructor(canvasContainer) {
    this.container = canvasContainer;
    this.selectedBodyId = 'earth';
    this.cameraMode = 'free'; // 'free', 'follow', 'top', 'overview'
    this.showOrbits = true;
    this.showLabels = true;
    this.showTrails = true;

    this.meshes = new Map();
    this.rings = new Map();
    this.clouds = new Map();
    this.orbitLines = new Map();
    this.trailLines = new Map();
    this.labels = new Map();
    this.labelsContainer = null;
    this.bodyLabelVisibility = new Map();
    CELESTIAL_BODIES.forEach(b => this.bodyLabelVisibility.set(b.id, true));
    this._tempVec = new THREE.Vector3();
    this.onLabelVisibilityChangeCallback = null;

    this.initThree();
    this.createStarfield();
    this.createSunGlow();
    this.createBodies();
    this.createStaticOrbitRings();
    this.setupKeyboardState();
    this.setupEvents();
  }

  initThree() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x030611);

    // Renderer con precisione elevata
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      logarithmicDepthBuffer: true
    });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.container.appendChild(this.renderer.domElement);

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      45,
      this.container.clientWidth / this.container.clientHeight,
      0.5,
      15000
    );
    this.camera.position.set(0, 180, 260);

    // OrbitControls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxDistance = 3500;
    this.controls.minDistance = 3;
    this.controls.target.set(0, 0, 0);

    // Luce solare al centro (punto luce omnidirezionale potente)
    this.sunLight = new THREE.PointLight(0xfff7e6, 3.2, 5000, 0.4);
    this.sunLight.position.set(0, 0, 0);
    this.scene.add(this.sunLight);

    // Luce ambiente soffusa per illuminare i lati in ombra nello spazio
    this.ambientLight = new THREE.AmbientLight(0x223355, 0.35);
    this.scene.add(this.ambientLight);

    // Raycaster per click e hover
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.hoveredBodyId = null;

    // Gestione ridimensionamento finestra
    window.addEventListener('resize', () => this.onWindowResize());
  }

  createStarfield() {
    const starCount = 14000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);

    const colorChoices = [
      new THREE.Color(0xffffff),
      new THREE.Color(0xdbe9ff), // Azzurro
      new THREE.Color(0xffeedb), // Giallo tenue
      new THREE.Color(0xffd4b8), // Rossiccio
      new THREE.Color(0x9fc5e8)  // Bluastro
    ];

    for (let i = 0; i < starCount; i++) {
      // Distribuzione su una sfera di grande raggio (3000-6000)
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 2500 + Math.random() * 2500;

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      const chosenColor = colorChoices[Math.floor(Math.random() * colorChoices.length)];
      // Leggera variazione di luminosità
      const brightness = 0.5 + Math.random() * 0.5;
      colors[i * 3] = chosenColor.r * brightness;
      colors[i * 3 + 1] = chosenColor.g * brightness;
      colors[i * 3 + 2] = chosenColor.b * brightness;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 1.8,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true
    });

    const starPoints = new THREE.Points(geometry, material);
    this.scene.add(starPoints);

    // Aggiungi nubi di nebulosa cosmica
    this.createCosmicNebula();
  }

  createCosmicNebula() {
    const nebulaCount = 500;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(nebulaCount * 3);
    const colors = new Float32Array(nebulaCount * 3);

    for (let i = 0; i < nebulaCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI * 0.7;
      const r = 3200 + Math.random() * 800;

      positions[i * 3] = r * Math.cos(phi) * Math.sin(theta);
      positions[i * 3 + 1] = r * Math.sin(phi);
      positions[i * 3 + 2] = r * Math.cos(phi) * Math.cos(theta);

      // Colori viola, ciano e magenta
      const t = Math.random();
      colors[i * 3] = 0.2 + t * 0.3;
      colors[i * 3 + 1] = 0.1 + (1 - t) * 0.4;
      colors[i * 3 + 2] = 0.5 + Math.random() * 0.5;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 45.0,
      vertexColors: true,
      transparent: true,
      opacity: 0.25,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const nebula = new THREE.Points(geometry, mat);
    this.scene.add(nebula);
  }

  createSunGlow() {
    // Corona luminosa del Sole tramite Sprite con Additive Blending
    const glowTex = Textures.createGlowTexture('#ff8811');
    const spriteMat = new THREE.SpriteMaterial({
      map: glowTex,
      color: 0xffcc44,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const glowSprite = new THREE.Sprite(spriteMat);
    glowSprite.scale.set(65, 65, 1.0);
    this.scene.add(glowSprite);
    this.sunGlowSprite = glowSprite;

    // Secondo bagliore esterno più soffuso
    const outerGlowMat = new THREE.SpriteMaterial({
      map: glowTex,
      color: 0xff4400,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const outerGlow = new THREE.Sprite(outerGlowMat);
    outerGlow.scale.set(110, 110, 1.0);
    this.scene.add(outerGlow);
    this.sunOuterGlow = outerGlow;
  }

  createBodies() {
    CELESTIAL_BODIES.forEach(cfg => {
      let texture;
      let mesh;
      const radius = cfg.visualRadius;
      const sphereGeo = new THREE.SphereGeometry(radius, 48, 48);

      if (cfg.id === 'sun') {
        texture = Textures.createSunTexture();
        const mat = new THREE.MeshBasicMaterial({
          map: texture
        });
        mesh = new THREE.Mesh(sphereGeo, mat);
      } else {
        // Texture procedurale specifica
        switch (cfg.id) {
          case 'mercury': texture = Textures.createMercuryTexture(); break;
          case 'venus': texture = Textures.createVenusTexture(); break;
          case 'earth': texture = Textures.createEarthTexture(); break;
          case 'moon': texture = Textures.createMoonTexture(); break;
          case 'mars': texture = Textures.createMarsTexture(); break;
          case 'jupiter': texture = Textures.createJupiterTexture(); break;
          case 'saturn': texture = Textures.createSaturnTexture(); break;
          case 'uranus': texture = Textures.createUranusTexture(); break;
          case 'neptune': texture = Textures.createNeptuneTexture(); break;
          case 'pluto': texture = Textures.createPlutoTexture(); break;
          default: texture = null;
        }

        const mat = new THREE.MeshStandardMaterial({
          map: texture,
          roughness: cfg.id === 'earth' ? 0.6 : 0.85,
          metalness: 0.1,
          color: texture ? 0xffffff : cfg.color
        });
        mesh = new THREE.Mesh(sphereGeo, mat);
      }

      mesh.userData = { id: cfg.id, name: cfg.name, config: cfg };
      
      // Inclinazione assiale
      const tiltRad = (cfg.axialTiltDeg || 0) * (Math.PI / 180);
      mesh.rotation.z = tiltRad;

      this.scene.add(mesh);
      this.meshes.set(cfg.id, mesh);

      // Terra: aggiungi strato atmosferico con nuvole trasparenti rotanti
      if (cfg.id === 'earth') {
        const cloudGeo = new THREE.SphereGeometry(radius * 1.025, 48, 48);
        const cloudTex = Textures.createEarthCloudsTexture();
        const cloudMat = new THREE.MeshStandardMaterial({
          map: cloudTex,
          transparent: true,
          opacity: 0.9,
          blending: THREE.NormalBlending,
          depthWrite: false
        });
        const cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
        cloudMesh.rotation.z = tiltRad;
        this.scene.add(cloudMesh);
        this.clouds.set('earth', cloudMesh);

        // Alone azzurro atmosferico (rim glow)
        const atmosGeo = new THREE.SphereGeometry(radius * 1.07, 32, 32);
        const atmosMat = new THREE.MeshBasicMaterial({
          color: 0x4da6ff,
          transparent: true,
          opacity: 0.16,
          side: THREE.BackSide,
          blending: THREE.AdditiveBlending
        });
        const atmosMesh = new THREE.Mesh(atmosGeo, atmosMat);
        mesh.add(atmosMesh);
      }

      // Saturno: anelli con Cassini Division
      if (cfg.id === 'saturn') {
        const innerR = radius * 1.35;
        const outerR = radius * 2.5;
        const ringGeo = new THREE.RingGeometry(innerR, outerR, 96);

        // Mappa UV corretta per la texture radiale dell'anello
        const pos = ringGeo.attributes.position;
        const uvs = ringGeo.attributes.uv;
        for (let i = 0; i < pos.count; i++) {
          const x = pos.getX(i);
          const y = pos.getY(i);
          const r = Math.sqrt(x * x + y * y);
          const u = (r - innerR) / (outerR - innerR);
          uvs.setXY(i, u, 0.5);
        }
        ringGeo.uvsNeedUpdate = true;

        const ringTex = Textures.createSaturnRingTexture();
        const ringMat = new THREE.MeshStandardMaterial({
          map: ringTex,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.95,
          roughness: 0.8
        });

        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.rotation.x = Math.PI / 2; // Giace sul piano equatoriale
        mesh.add(ringMesh);
        this.rings.set('saturn', ringMesh);
      }

      // Urano: sottile anello inclinato
      if (cfg.id === 'uranus') {
        const innerR = radius * 1.4;
        const outerR = radius * 1.9;
        const ringGeo = new THREE.RingGeometry(innerR, outerR, 64);
        const ringTex = Textures.createUranusRingTexture();
        const ringMat = new THREE.MeshBasicMaterial({
          map: ringTex,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.6
        });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.rotation.x = Math.PI / 2;
        mesh.add(ringMesh);
        this.rings.set('uranus', ringMesh);
      }

      // Inizializza geometria per le scie dinamiche N-Body
      this.createTrailLine(cfg.id, cfg.color);
    });
  }

  createStaticOrbitRings() {
    CELESTIAL_BODIES.forEach(cfg => {
      if (cfg.orbitDistance === 0 || cfg.type === 'moon') return;

      const segments = 128;
      const points = [];
      const inclRad = (cfg.orbitalInclinationDeg || 0) * (Math.PI / 180);

      for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        const x = cfg.orbitDistance * Math.cos(theta);
        const z = cfg.orbitDistance * Math.sin(theta);
        const y = cfg.orbitDistance * Math.sin(theta) * Math.sin(inclRad);
        points.push(new THREE.Vector3(x, y, z));
      }

      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({
        color: new THREE.Color(cfg.color).multiplyScalar(0.4),
        transparent: true,
        opacity: 0.35,
        blending: THREE.AdditiveBlending
      });

      const line = new THREE.LineLoop(geometry, material);
      this.scene.add(line);
      this.orbitLines.set(cfg.id, line);
    });
  }

  createTrailLine(bodyId, colorHex) {
    if (bodyId === 'sun') return;

    const maxPoints = 250;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(maxPoints * 3);
    const colors = new Float32Array(maxPoints * 3);
    const baseColor = new THREE.Color(colorHex);

    for (let i = 0; i < maxPoints; i++) {
      const alpha = Math.pow(i / maxPoints, 2);
      colors[i * 3] = baseColor.r * alpha;
      colors[i * 3 + 1] = baseColor.g * alpha;
      colors[i * 3 + 2] = baseColor.b * alpha;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });

    const line = new THREE.Line(geometry, material);
    line.frustumCulled = false;
    this.scene.add(line);
    this.trailLines.set(bodyId, line);
  }

  updateFromPhysics(gravityEngine) {
    // Aggiorna posizioni e rotazioni 3D da physics engine
    gravityEngine.bodies.forEach(body => {
      const mesh = this.meshes.get(body.id);
      if (!mesh) return;

      mesh.position.copy(body.position);
      // Rotazione assiale propria
      mesh.rotation.y = body.axialRotation;

      // Nuvole per la Terra
      if (body.id === 'earth') {
        const cloudMesh = this.clouds.get('earth');
        if (cloudMesh) {
          cloudMesh.position.copy(body.position);
          cloudMesh.rotation.y = body.axialRotation * 1.15; // Le nuvole scorrono a velocità differente
        }
      }

      // Aggiorna visibilità e scia
      if (body.collidedWithSun) {
        mesh.visible = false;
      } else {
        mesh.visible = true;
      }

      // Aggiorna buffer della scia dinamica
      if (this.showTrails && body.id !== 'sun') {
        const trailLine = this.trailLines.get(body.id);
        if (trailLine && body.orbitHistory.length > 1) {
          const posAttr = trailLine.geometry.attributes.position;
          const hist = body.orbitHistory;
          const count = hist.length;

          for (let i = 0; i < count; i++) {
            const p = hist[i];
            posAttr.setXYZ(i, p.x, p.y, p.z);
          }
          // Riempi i rimanenti con l'ultimo punto
          const last = hist[count - 1];
          for (let i = count; i < 250; i++) {
            posAttr.setXYZ(i, last.x, last.y, last.z);
          }
          posAttr.needsUpdate = true;
          trailLine.visible = true;
        }
      } else {
        const trailLine = this.trailLines.get(body.id);
        if (trailLine) trailLine.visible = false;
      }
    });

    // Visibilità orbite teoriche
    this.orbitLines.forEach(line => {
      line.visible = this.showOrbits;
    });

    // Elabora rotazione e zoom continui da tastiera (Frecce, Shift, + / -)
    this.processKeyboardNavigation();

    // Gestione Camera in base alla modalità selezionata
    this.updateCameraFollow(gravityEngine);

    // Aggiorna posizioni delle etichette con nome nello spazio 3D
    this.updateLabels(gravityEngine);
  }

  updateCameraFollow(gravityEngine) {
    if (this.cameraMode === 'follow') {
      const targetBody = gravityEngine.bodyMap.get(this.selectedBodyId);
      if (targetBody) {
        // Segue morbidamente il pianeta mantenendo l'offset visivo
        const currentTarget = this.controls.target;
        currentTarget.lerp(targetBody.position, 0.08);

        // Mantiene una distanza proporzionata al raggio del pianeta
        const radius = targetBody.cfg.visualRadius;
        const desiredOffset = Math.max(radius * 4.5, 12);
        const camOffset = this.camera.position.clone().sub(currentTarget);
        if (camOffset.length() > desiredOffset * 3 || camOffset.length() < desiredOffset * 0.5) {
          camOffset.setLength(desiredOffset * 1.5);
          this.camera.position.lerp(currentTarget.clone().add(camOffset), 0.05);
        }
      }
    } else if (this.cameraMode === 'overview') {
      this.controls.target.lerp(new THREE.Vector3(0, 0, 0), 0.05);
      this.camera.position.lerp(new THREE.Vector3(0, 220, 320), 0.05);
    } else if (this.cameraMode === 'top') {
      this.controls.target.lerp(new THREE.Vector3(0, 0, 0), 0.05);
      this.camera.position.lerp(new THREE.Vector3(0, 550, 0.1), 0.05);
    }

    this.controls.update();
  }

  focusOnBody(bodyId) {
    this.selectedBodyId = bodyId;
    const mesh = this.meshes.get(bodyId);
    if (!mesh) return;

    const targetPos = mesh.position.clone();
    const cfg = mesh.userData.config;
    const r = cfg ? cfg.visualRadius : 5;
    const viewDistance = Math.max(r * 4.0, 10);

    // Sposta la camera gradualmente vicino al corpo celeste
    const offset = new THREE.Vector3(viewDistance * 0.8, viewDistance * 0.5, viewDistance * 1.2);
    this.camera.position.copy(targetPos.clone().add(offset));
    this.controls.target.copy(targetPos);
  }

  setCameraMode(mode) {
    this.cameraMode = mode;
    if (mode === 'follow') {
      this.focusOnBody(this.selectedBodyId);
    }
  }

  setupKeyboardState() {
    this.keyState = {
      ArrowLeft: false,
      ArrowRight: false,
      ArrowUp: false,
      ArrowDown: false,
      Shift: false,
      ZoomIn: false,
      ZoomOut: false
    };
    this.arrowVerticalMode = 'orbit'; // 'orbit' per inclinare su/giù, 'zoom' per zoomare con freccia su/giù
  }

  setupEvents() {
    this.container.addEventListener('mousemove', (e) => this.onMouseMove(e));
    this.container.addEventListener('click', (e) => this.onClick(e));
    
    // Ascolto tasti per rotazione (Frecce) e Zoom (+ / - / Shift / W / S)
    window.addEventListener('keydown', (e) => this.onKeyDown(e));
    window.addEventListener('keyup', (e) => this.onKeyUp(e));
  }

  onKeyDown(e) {
    // Se l'utente sta interagendo con un input di testo (non presente ma per sicurezza)
    if (e.target && (e.target.tagName === 'INPUT' && e.target.type !== 'range')) {
      return;
    }

    let handled = false;

    if (e.key === 'ArrowLeft') {
      this.keyState.ArrowLeft = true;
      handled = true;
    } else if (e.key === 'ArrowRight') {
      this.keyState.ArrowRight = true;
      handled = true;
    } else if (e.key === 'ArrowUp') {
      this.keyState.ArrowUp = true;
      handled = true;
    } else if (e.key === 'ArrowDown') {
      this.keyState.ArrowDown = true;
      handled = true;
    }

    if (e.key === 'Shift') {
      this.keyState.Shift = true;
    }

    // Tasti rapidi di Zoom
    if (e.key === '+' || e.key === '=' || e.code === 'NumpadAdd' || e.code === 'PageUp' || e.key.toLowerCase() === 'w') {
      this.keyState.ZoomIn = true;
      handled = true;
    } else if (e.key === '-' || e.code === 'NumpadSubtract' || e.code === 'PageDown' || e.key.toLowerCase() === 's') {
      this.keyState.ZoomOut = true;
      handled = true;
    }

    if (handled) {
      e.preventDefault();
    }
  }

  onKeyUp(e) {
    if (e.key === 'ArrowLeft') this.keyState.ArrowLeft = false;
    if (e.key === 'ArrowRight') this.keyState.ArrowRight = false;
    if (e.key === 'ArrowUp') this.keyState.ArrowUp = false;
    if (e.key === 'ArrowDown') this.keyState.ArrowDown = false;
    if (e.key === 'Shift') this.keyState.Shift = false;

    if (e.key === '+' || e.key === '=' || e.code === 'NumpadAdd' || e.code === 'PageUp' || e.key.toLowerCase() === 'w') {
      this.keyState.ZoomIn = false;
    }
    if (e.key === '-' || e.code === 'NumpadSubtract' || e.code === 'PageDown' || e.key.toLowerCase() === 's') {
      this.keyState.ZoomOut = false;
    }
  }

  processKeyboardNavigation() {
    const rotSpeed = 0.035;
    const zoomScale = 1.028;
    let modified = false;

    // Rotazione orizzontale (Yaw / Azimuth)
    if (this.keyState.ArrowLeft) {
      this.controls.rotateLeft(rotSpeed);
      modified = true;
    }
    if (this.keyState.ArrowRight) {
      this.controls.rotateLeft(-rotSpeed);
      modified = true;
    }

    // Frecce Verticali (Su / Giù): inclinazione o zoom con Shift / modalità
    if (this.keyState.ArrowUp) {
      if (this.keyState.Shift || this.arrowVerticalMode === 'zoom') {
        this.controls.dollyIn(zoomScale);
      } else {
        this.controls.rotateUp(-rotSpeed);
      }
      modified = true;
    }
    if (this.keyState.ArrowDown) {
      if (this.keyState.Shift || this.arrowVerticalMode === 'zoom') {
        this.controls.dollyOut(zoomScale);
      } else {
        this.controls.rotateUp(rotSpeed);
      }
      modified = true;
    }

    // Zoom esplicito
    if (this.keyState.ZoomIn) {
      this.controls.dollyIn(zoomScale);
      modified = true;
    }
    if (this.keyState.ZoomOut) {
      this.controls.dollyOut(zoomScale);
      modified = true;
    }

    if (modified) {
      this.controls.update();
    }
  }

  manualRotate(yawDir, pitchDir) {
    const rotSpeed = 0.045;
    if (yawDir !== 0) this.controls.rotateLeft(yawDir * rotSpeed);
    if (pitchDir !== 0) this.controls.rotateUp(pitchDir * rotSpeed);
    this.controls.update();
  }

  manualZoom(zoomFactor) {
    if (zoomFactor > 1) {
      this.controls.dollyIn(zoomFactor);
    } else if (zoomFactor > 0) {
      this.controls.dollyOut(1 / zoomFactor);
    }
    this.controls.update();
  }

  onMouseMove(event) {
    const rect = this.container.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(Array.from(this.meshes.values()));

    if (intersects.length > 0) {
      this.container.style.cursor = 'pointer';
      this.hoveredBodyId = intersects[0].object.userData.id;
    } else {
      this.container.style.cursor = 'default';
      this.hoveredBodyId = null;
    }
  }

  onClick(event) {
    // Ignora se si tratta di un click-drag di rotazione
    const rect = this.container.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(Array.from(this.meshes.values()));

    if (intersects.length > 0) {
      const clickedId = intersects[0].object.userData.id;
      if (this.onSelectCallback) {
        this.onSelectCallback(clickedId);
      }
    }
  }

  onSelect(callback) {
    this.onSelectCallback = callback;
  }

  onWindowResize() {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  // ==========================================
  // GESTIONE ETICHETTE NOMI 3D (GLOBALI E SINGOLI)
  // ==========================================
  initLabels(overlayContainer) {
    this.labelsContainer = overlayContainer;
    this.labelsContainer.innerHTML = '';
    this.labels.clear();

    CELESTIAL_BODIES.forEach(cfg => {
      const el = document.createElement('div');
      el.className = 'planet-3d-label';
      el.id = `label-3d-${cfg.id}`;
      el.dataset.id = cfg.id;
      el.title = `Fai clic per selezionare e agganciare ${cfg.name}`;

      el.innerHTML = `
        <span class="label-dot" style="background-color: ${cfg.color}; box-shadow: 0 0 6px ${cfg.color};"></span>
        <span class="label-name">${cfg.name}</span>
        <button class="label-hide-btn" data-id="${cfg.id}" title="Nascondi etichetta per ${cfg.name}">✕</button>
      `;

      el.addEventListener('click', (e) => {
        const hideBtn = e.target.closest('.label-hide-btn');
        if (hideBtn) {
          e.stopPropagation();
          const targetId = hideBtn.dataset.id;
          this.setBodyLabelVisible(targetId, false);
          return;
        }

        if (this.onSelectCallback) {
          this.onSelectCallback(cfg.id);
        }
      });

      this.labelsContainer.appendChild(el);
      this.labels.set(cfg.id, el);
    });
  }

  setGlobalLabelsVisible(visible) {
    this.showLabels = visible;
    if (!visible) {
      this.labels.forEach(el => {
        el.style.display = 'none';
      });
    }
  }

  setBodyLabelVisible(bodyId, visible) {
    this.bodyLabelVisibility.set(bodyId, visible);
    if (!visible) {
      const el = this.labels.get(bodyId);
      if (el) el.style.display = 'none';
    }
    if (this.onLabelVisibilityChangeCallback) {
      this.onLabelVisibilityChangeCallback(bodyId, visible);
    }
  }

  isBodyLabelVisible(bodyId) {
    return this.bodyLabelVisibility.get(bodyId) !== false;
  }

  toggleBodyLabel(bodyId) {
    const next = !this.isBodyLabelVisible(bodyId);
    this.setBodyLabelVisible(bodyId, next);
    return next;
  }

  setAllBodyLabelsVisible(visible) {
    CELESTIAL_BODIES.forEach(b => {
      this.bodyLabelVisibility.set(b.id, visible);
      if (!visible) {
        const el = this.labels.get(b.id);
        if (el) el.style.display = 'none';
      }
    });
    if (this.onLabelVisibilityChangeCallback) {
      this.onLabelVisibilityChangeCallback('all', visible);
    }
  }

  getActiveLabelsCount() {
    let count = 0;
    CELESTIAL_BODIES.forEach(b => {
      if (this.isBodyLabelVisible(b.id)) count++;
    });
    return count;
  }

  onLabelVisibilityChange(callback) {
    this.onLabelVisibilityChangeCallback = callback;
  }

  updateLabels(gravityEngine) {
    if (!this.labelsContainer || !this.showLabels) {
      if (this.labelsContainer) {
        this.labels.forEach(el => { el.style.display = 'none'; });
      }
      return;
    }

    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    CELESTIAL_BODIES.forEach(cfg => {
      const labelEl = this.labels.get(cfg.id);
      if (!labelEl) return;

      const isIndividuallyVisible = this.isBodyLabelVisible(cfg.id);
      const bodyPhysics = gravityEngine.bodyMap.get(cfg.id);
      const isCollided = bodyPhysics && bodyPhysics.collidedWithSun;

      if (!isIndividuallyVisible || isCollided) {
        labelEl.style.display = 'none';
        return;
      }

      const mesh = this.meshes.get(cfg.id);
      if (!mesh || !mesh.visible) {
        labelEl.style.display = 'none';
        return;
      }

      // Posizione 3D sopra il corpo celeste
      this._tempVec.copy(mesh.position);
      this._tempVec.y += cfg.visualRadius * 1.25 + 2.0;

      // Proietta in coordinate camera normalizzate (-1 a 1)
      this._tempVec.project(this.camera);

      // Se il punto si trova dietro la telecamera
      if (this._tempVec.z > 1 || this._tempVec.z < -1) {
        labelEl.style.display = 'none';
        return;
      }

      // Conversione in pixel dello schermo
      const screenX = (this._tempVec.x * 0.5 + 0.5) * width;
      const screenY = (-(this._tempVec.y * 0.5) + 0.5) * height;

      // Fuori dai bordi visibili con margine
      if (screenX < -100 || screenX > width + 100 || screenY < -60 || screenY > height + 60) {
        labelEl.style.display = 'none';
        return;
      }

      // Adattamento scala e opacità in base alla distanza telecamera
      const camDist = this.camera.position.distanceTo(mesh.position);
      let scale = 1.0;
      let opacity = 1.0;

      if (camDist > 1600) {
        opacity = Math.max(0.35, 1 - (camDist - 1600) / 2400);
        scale = Math.max(0.75, 1 - (camDist - 1600) / 4500);
      }

      labelEl.style.display = 'inline-flex';
      labelEl.style.opacity = opacity.toFixed(2);
      labelEl.style.transform = `translate3d(calc(${screenX.toFixed(1)}px - 50%), calc(${screenY.toFixed(1)}px - 100%), 0) scale(${scale.toFixed(2)})`;

      if (cfg.id === this.selectedBodyId) {
        labelEl.classList.add('active');
      } else {
        labelEl.classList.remove('active');
      }
    });
  }
}
