import * as THREE from 'three';
import { SIM_G, G_REAL, CELESTIAL_BODIES } from './solarData.js';

export class GravityEngine {
  constructor(bodiesConfig) {
    this.G = SIM_G;
    this.softening = 4.0; // Evita singolarità a distanza zero
    this.mode = 'nbody-real'; // 'nbody-real' (proporzioni reali stabili), 'nbody' (sandbox caotico), 'keplerian'
    this.timeScale = 1.0;
    this.isPaused = false;
    this.substeps = 8; // Step di integrazione per frame per massima precisione

    this.bodies = [];
    this.bodyMap = new Map();
    this.historyLength = 250; // Punti per le scie orbitali dinamiche

    this.initBodies(bodiesConfig);
  }

  initBodies(bodiesConfig) {
    this.bodies = [];
    this.bodyMap.clear();

    const sunCfg = bodiesConfig.find(b => b.id === 'sun');
    const sunRealMass = sunCfg?.realMassKg || 1.9885e30;
    const sunSimMass = sunCfg?.simMass || 8000;

    bodiesConfig.forEach(cfg => {
      // Calcolo raggio e velocità orbitale iniziale
      const dist = cfg.orbitDistance;
      const angle = (Math.PI * 2 * Math.random()); // Distribuzione iniziale realistica
      
      let pos = new THREE.Vector3(0, 0, 0);
      let vel = new THREE.Vector3(0, 0, 0);

      if (dist > 0 && cfg.type !== 'moon') {
        // Orbita attorno al Sole sul piano X-Z con leggera inclinazione Y
        const inclRad = (cfg.orbitalInclinationDeg || 0) * (Math.PI / 180);
        pos.x = dist * Math.cos(angle);
        pos.z = dist * Math.sin(angle);
        pos.y = dist * Math.sin(angle) * Math.sin(inclRad);

        // Velocità tangenziale circolare v = sqrt(G * M_sole / r)
        const speed = Math.sqrt((this.G * sunSimMass) / dist);

        // Direzione perpendicolare nel piano orbitale
        vel.x = -speed * Math.sin(angle);
        vel.z = speed * Math.cos(angle);
        vel.y = speed * Math.cos(angle) * Math.sin(inclRad);
      }

      // Massa simulata proporzionale astronomica reale rispetto al Sole (Sole = 8000)
      const baseRealPropMass = (cfg.id === 'sun')
        ? sunSimMass
        : (cfg.realMassKg / sunRealMass) * sunSimMass;
      const baseSimMass = cfg.simMass;
      const initialSimMass = (this.mode === 'nbody-real') ? baseRealPropMass : baseSimMass;

      const body = {
        id: cfg.id,
        name: cfg.name,
        type: cfg.type,
        parent: cfg.parent || null,
        cfg: cfg,
        simMass: initialSimMass,
        baseSimMass: baseSimMass,
        baseRealPropMass: baseRealPropMass,
        realMassKg: cfg.realMassKg,
        baseRealMassKg: cfg.realMassKg,
        massMultiplier: 1.0,
        position: pos.clone(),
        velocity: vel.clone(),
        acceleration: new THREE.Vector3(0, 0, 0),
        orbitHistory: [],
        keplerAngle: angle,
        keplerDistance: dist,
        axialRotation: 0,
        axialTiltDeg: cfg.axialTiltDeg,
        rotationSpeed: (2 * Math.PI) / (Math.abs(cfg.rotationPeriodHours || 24) * 60) * (cfg.rotationPeriodHours < 0 ? -1 : 1),
        collidedWithSun: false
      };

      this.bodies.push(body);
      this.bodyMap.set(cfg.id, body);
    });

    // Inizializza la Luna rispetto alla Terra
    const earth = this.bodyMap.get('earth');
    const moon = this.bodyMap.get('moon');
    if (earth && moon) {
      const moonDist = moon.cfg.orbitDistance;
      const moonAngle = Math.random() * Math.PI * 2;
      moon.position.copy(earth.position).add(new THREE.Vector3(
        moonDist * Math.cos(moonAngle),
        0.2,
        moonDist * Math.sin(moonAngle)
      ));
      const earthMassForMoon = (this.mode === 'nbody-real') ? 24.0 : earth.simMass;
      const moonSpeed = Math.sqrt((this.G * earthMassForMoon) / moonDist);
      moon.velocity.copy(earth.velocity).add(new THREE.Vector3(
        -moonSpeed * Math.sin(moonAngle),
        0,
        moonSpeed * Math.cos(moonAngle)
      ));
      moon.keplerAngle = moonAngle;
      moon.keplerDistance = moonDist;
    }

    // Calcolo iniziale delle accelerazioni
    this.computeAccelerations();
  }

  // Cambio modalità dinamica: 'nbody-real', 'nbody' o 'keplerian'
  setMode(newMode) {
    if (this.mode === newMode) return;
    this.mode = newMode;
    this.syncBodyMasses();

    if (newMode === 'nbody-real' || newMode === 'nbody') {
      // Se un corpo era colliso o sfuggito a distanza estrema durante perturbazioni, ripristinalo
      this.bodies.forEach(body => {
        if (body.id === 'sun') return;
        if (body.collidedWithSun || body.position.length() > 500) {
          body.collidedWithSun = false;
          const dist = body.keplerDistance || body.cfg.orbitDistance;
          const angle = body.keplerAngle || (Math.PI * 2 * Math.random());
          const inclRad = (body.cfg.orbitalInclinationDeg || 0) * (Math.PI / 180);
          body.position.set(
            dist * Math.cos(angle),
            dist * Math.sin(angle) * Math.sin(inclRad),
            dist * Math.sin(angle)
          );
        }
        this.stabilizeOrbit(body.id);
      });
      this.computeAccelerations();
    }
  }

  // Sincronizza le masse simulate correnti in base alla modalità selezionata
  syncBodyMasses() {
    const isReal = (this.mode === 'nbody-real');
    this.bodies.forEach(body => {
      const base = isReal ? body.baseRealPropMass : body.baseSimMass;
      body.simMass = base * body.massMultiplier;
      body.realMassKg = body.baseRealMassKg * body.massMultiplier;
    });
  }

  // Modifica interattiva della massa di un corpo celeste
  setBodyMassMultiplier(bodyId, multiplier) {
    const body = this.bodyMap.get(bodyId);
    if (!body) return;

    body.massMultiplier = Math.max(0.0001, multiplier);
    const base = (this.mode === 'nbody-real') ? body.baseRealPropMass : body.baseSimMass;
    body.simMass = base * body.massMultiplier;
    body.realMassKg = body.baseRealMassKg * body.massMultiplier;

    // Se siamo in modalità N-Body, ricalcola subito le accelerazioni reciproche
    if (this.mode === 'nbody' || this.mode === 'nbody-real') {
      this.computeAccelerations();
    }
  }

  // Ricalcola la velocità orbitale ideale v = sqrt(GM/r) per stabilizzare l'orbita alla massa corrente
  stabilizeOrbit(bodyId) {
    const body = this.bodyMap.get(bodyId);
    if (!body || body.id === 'sun') return;

    const sun = this.bodyMap.get('sun');
    if (body.type === 'moon') {
      const earth = this.bodyMap.get('earth');
      if (!earth) return;
      const relPos = new THREE.Vector3().subVectors(body.position, earth.position);
      const r = relPos.length();
      if (r < 0.1) return;
      const earthMass = (this.mode === 'nbody-real') ? 24.0 : earth.simMass;
      const idealSpeed = Math.sqrt((this.G * earthMass) / r);
      // Tangenziale nel piano xz
      const tangent = new THREE.Vector3(-relPos.z, 0, relPos.x).normalize();
      body.velocity.copy(earth.velocity).add(tangent.multiplyScalar(idealSpeed));
      return;
    }

    const r = body.position.length();
    if (r < 0.1) return;

    const centralMass = sun ? sun.simMass : 1;
    const idealSpeed = Math.sqrt((this.G * centralMass) / r);

    // Tangenziale nel piano orbitale attuale
    const currentTangent = new THREE.Vector3(-body.position.z, 0, body.position.x).normalize();
    body.velocity.copy(currentTangent.multiplyScalar(idealSpeed));
    body.collidedWithSun = false;
  }

  // Reset del sistema solare alle condizioni originali stabili
  resetSystem() {
    this.initBodies(CELESTIAL_BODIES);
  }

  computeAccelerations() {
    const n = this.bodies.length;

    // Azzera accelerazioni
    for (let i = 0; i < n; i++) {
      this.bodies[i].acceleration.set(0, 0, 0);
    }

    // Calcolo interazioni N-Corpi (Legge di Gravitazione Universale di Newton)
    // F_ij = G * (m_i * m_j) / (r_ij^2 + e^2)^(3/2) * (r_j - r_i)
    for (let i = 0; i < n; i++) {
      const b1 = this.bodies[i];
      if (b1.collidedWithSun) continue;
      // In modalità nbody-real la Luna è governata gerarchicamente rispetto alla Terra per preservare la scala grafica
      if (this.mode === 'nbody-real' && b1.type === 'moon') continue;

      for (let j = i + 1; j < n; j++) {
        const b2 = this.bodies[j];
        if (b2.collidedWithSun) continue;
        if (this.mode === 'nbody-real' && b2.type === 'moon') continue;

        const dx = b2.position.x - b1.position.x;
        const dy = b2.position.y - b1.position.y;
        const dz = b2.position.z - b1.position.z;

        const distSq = dx * dx + dy * dy + dz * dz + this.softening * this.softening;
        const dist = Math.sqrt(distSq);
        const invDist3 = 1.0 / (dist * distSq);

        // a1 = G * m2 / r^2 in direzione r_j - r_i
        const force1 = this.G * b2.simMass * invDist3;
        b1.acceleration.x += dx * force1;
        b1.acceleration.y += dy * force1;
        b1.acceleration.z += dz * force1;

        // a2 = G * m1 / r^2 in direzione opposta r_i - r_j
        const force2 = this.G * b1.simMass * invDist3;
        b2.acceleration.x -= dx * force2;
        b2.acceleration.y -= dy * force2;
        b2.acceleration.z -= dz * force2;
      }
    }

    // Il Sole è il centro di massa primario: teniamolo ancorato o con lievissimo baricentro
    const sun = this.bodyMap.get('sun');
    if (sun) {
      sun.acceleration.multiplyScalar(0.01);
      sun.velocity.multiplyScalar(0.95);
    }
  }

  // Aggiornamento della simulazione
  update(deltaSeconds) {
    if (this.isPaused) return;

    // Limita il delta per evitare salti numerici instabili in caso di lag
    const dt = Math.min(0.05, deltaSeconds) * this.timeScale;
    if (dt === 0) return;

    // Rotazione assiale propria di ciascun corpo
    this.bodies.forEach(body => {
      body.axialRotation += body.rotationSpeed * dt * 50;
    });

    if (this.mode === 'nbody' || this.mode === 'nbody-real') {
      this.updateNBody(dt);
    } else {
      this.updateKeplerian(dt);
    }

    // Registra la scia delle orbite per visualizzazione 3D
    this.recordOrbitHistory();
  }

  // Integratore simplettico Velocity-Verlet (Leapfrog)
  updateNBody(dt) {
    const subDt = dt / this.substeps;
    const sun = this.bodyMap.get('sun');
    const sunRadius = sun ? sun.cfg.visualRadius * 0.8 : 10;

    for (let step = 0; step < this.substeps; step++) {
      // 1. Aggiorna posizioni: r(t + dt) = r(t) + v(t)*dt + 0.5*a(t)*dt^2
      for (let i = 0; i < this.bodies.length; i++) {
        const b = this.bodies[i];
        if (b.collidedWithSun) continue;
        if (this.mode === 'nbody-real' && b.type === 'moon') continue;

        b.position.x += b.velocity.x * subDt + 0.5 * b.acceleration.x * subDt * subDt;
        b.position.y += b.velocity.y * subDt + 0.5 * b.acceleration.y * subDt * subDt;
        b.position.z += b.velocity.z * subDt + 0.5 * b.acceleration.z * subDt * subDt;

        // Controllo caduta nel Sole
        if (b.id !== 'sun' && sun) {
          const distToSun = b.position.distanceTo(sun.position);
          if (distToSun < sunRadius) {
            b.collidedWithSun = true;
          }
        }
      }

      // Salva accelerazioni correnti a(t)
      const oldAcc = this.bodies.map(b => b.acceleration.clone());

      // 2. Ricalcola nuove accelerazioni a(t + dt) basate sulle nuove posizioni
      this.computeAccelerations();

      // 3. Aggiorna velocità: v(t + dt) = v(t) + 0.5*(a(t) + a(t + dt))*dt
      for (let i = 0; i < this.bodies.length; i++) {
        const b = this.bodies[i];
        if (b.collidedWithSun) continue;
        if (this.mode === 'nbody-real' && b.type === 'moon') continue;

        b.velocity.x += 0.5 * (oldAcc[i].x + b.acceleration.x) * subDt;
        b.velocity.y += 0.5 * (oldAcc[i].y + b.acceleration.y) * subDt;
        b.velocity.z += 0.5 * (oldAcc[i].z + b.acceleration.z) * subDt;
      }
    }

    // In modalità nbody-real, la Luna orbita in modo gerarchico e stabile attorno alla Terra in movimento
    if (this.mode === 'nbody-real') {
      const earth = this.bodyMap.get('earth');
      const moon = this.bodyMap.get('moon');
      if (earth && moon && !moon.collidedWithSun) {
        const moonDist = moon.keplerDistance || moon.cfg.orbitDistance || 9.0;
        const omegaMoon = Math.sqrt((this.G * 24.0) / Math.pow(moonDist, 3));
        moon.keplerAngle = (moon.keplerAngle || 0) + omegaMoon * dt * 0.15;
        const prevPos = moon.position.clone();
        moon.position.set(
          earth.position.x + moonDist * Math.cos(moon.keplerAngle),
          earth.position.y + 0.2 * Math.sin(moon.keplerAngle),
          earth.position.z + moonDist * Math.sin(moon.keplerAngle)
        );
        if (dt > 0) {
          moon.velocity.subVectors(moon.position, prevPos).divideScalar(dt);
        }
      }
    }
  }

  // Modalità Kepleriana parametrica con velocità legata alla Legge di Gravitazione Universale
  updateKeplerian(dt) {
    const sun = this.bodyMap.get('sun');
    const sunMass = sun ? sun.simMass : 8000;
    const earth = this.bodyMap.get('earth');

    this.bodies.forEach(body => {
      if (body.id === 'sun') {
        body.position.set(0, 0, 0);
        return;
      }

      if (body.type === 'moon') {
        if (!earth) return;
        // Velocità angolare legata alla massa della Terra secondo la legge di Keplero/Newton
        // omega = sqrt(G * M_terra / r^3)
        const omegaMoon = Math.sqrt((this.G * earth.simMass) / Math.pow(body.keplerDistance, 3));
        body.keplerAngle += omegaMoon * dt * 0.15;
        body.position.set(
          earth.position.x + body.keplerDistance * Math.cos(body.keplerAngle),
          earth.position.y + 0.2 * Math.sin(body.keplerAngle),
          earth.position.z + body.keplerDistance * Math.sin(body.keplerAngle)
        );
        return;
      }

      // 3ª Legge di Keplero dinamica con gravità di Newton:
      // omega = sqrt(G * (M_sole + M_pianeta) / r^3)
      const totalMass = sunMass + body.simMass;
      const omega = Math.sqrt((this.G * totalMass) / Math.pow(body.keplerDistance, 3));
      body.keplerAngle += omega * dt * 0.1;

      const inclRad = (body.cfg.orbitalInclinationDeg || 0) * (Math.PI / 180);
      body.position.x = body.keplerDistance * Math.cos(body.keplerAngle);
      body.position.z = body.keplerDistance * Math.sin(body.keplerAngle);
      body.position.y = body.keplerDistance * Math.sin(body.keplerAngle) * Math.sin(inclRad);

      // Calcola vettore velocità tangenziale istantanea
      const linSpeed = omega * body.keplerDistance;
      body.velocity.set(
        -linSpeed * Math.sin(body.keplerAngle),
        linSpeed * Math.cos(body.keplerAngle) * Math.sin(inclRad),
        linSpeed * Math.cos(body.keplerAngle)
      );
    });
  }

  recordOrbitHistory() {
    this.bodies.forEach(b => {
      if (b.id === 'sun') return;
      b.orbitHistory.push(b.position.clone());
      if (b.orbitHistory.length > this.historyLength) {
        b.orbitHistory.shift();
      }
    });
  }

  // Calcola telemetria fisica reale per l'interfaccia utente
  getPhysicsTelemetry(bodyId) {
    const body = this.bodyMap.get(bodyId);
    if (!body) return null;

    const sun = this.bodyMap.get('sun');
    const realMass = body.realMassKg;
    const realRadius = body.cfg.realRadiusKm;

    // Accelerazione di gravità alla superficie g = G * M / R^2
    const radiusMeters = realRadius * 1000;
    const surfaceG = (G_REAL * realMass) / (radiusMeters * radiusMeters);

    // Velocità orbitale corrente simulata scalata a km/s
    const speedSim = body.velocity.length();
    // Scala per visualizzare valori astronomici verosimili (Terra ~ 29.8 km/s)
    const earthBody = this.bodyMap.get('earth');
    const earthSpeed = earthBody ? earthBody.velocity.length() : 1;
    const speedKmS = earthSpeed > 0 ? (speedSim / earthSpeed) * 29.78 : speedSim;

    // Distanza corrente dal Sole (in AU e km scalati)
    const distSim = body.position.length();
    const earthDist = earthBody ? earthBody.position.length() : 78;
    const distAU = earthDist > 0 ? (distSim / earthDist) : (body.cfg.orbitDistance / 78);
    const distKm = distAU * 149597870;

    // Forza gravitazionale reciproca con il Sole F = G * M1 * M2 / r^2 (Newton)
    const sunRealMass = sun ? sun.realMassKg : 1.989e30;
    const distMeters = Math.max(1e6, distKm * 1000);
    const gravitationalForceNewtons = (G_REAL * sunRealMass * realMass) / (distMeters * distMeters);

    // Periodo orbitale teorico con la 3ª legge di Keplero: T = 2*pi * sqrt(r^3 / (G * M_sole))
    const orbitalPeriodDays = (body.cfg.orbitalPeriodDays > 0)
      ? body.cfg.orbitalPeriodDays / Math.sqrt(Math.max(0.001, (sun ? sun.massMultiplier : 1)))
      : 0;

    // Velocità di fuga v_esc = sqrt(2 * g * R)
    const escapeVelocityKmS = Math.sqrt(2 * surfaceG * radiusMeters) / 1000;

    return {
      body,
      realMass,
      realRadius,
      surfaceG,
      speedKmS,
      distAU,
      distKm,
      gravitationalForceNewtons,
      orbitalPeriodDays,
      escapeVelocityKmS,
      massMultiplier: body.massMultiplier,
      simMass: body.simMass,
      isCollided: body.collidedWithSun
    };
  }
}
