import * as THREE from 'three';
import { Player } from './Player.js';
import { Road } from './Road.js';
import { ObstaclesManager, OBSTACLE_TYPES, ITEM_TYPES } from './Obstacles.js';

export class GameEngine {
  constructor(canvasId, callbacks) {
    this.canvas = document.getElementById(canvasId);
    this.callbacks = callbacks; // onScoreUpdate, onCoinsUpdate, onGameOver, onLevelClear

    this.cityLevel = 1; // Default Mumbai
    this.gameSpeedMultiplier = 1.0;
    this.isPlaying = false;
    this.isCrashed = false; // Initialize crash state
    this.score = 0;
    this.coins = 0;
    this.distanceTraveled = 0;
    this.targetScore = 500;

    // Timing parameters for obstacle spawning
    this.spawnTimer = 0;
    this.spawnInterval = 1.8; // spawn every X seconds (decreases as speed increases)
    
    // Clock for delta times (custom performance.now representation)
    this.lastTime = performance.now();

    // 1. Initialise Core Three.js
    this.setupScene();

    // 2. Setup Resize Handler
    this.resizeHandler = this.onWindowResize.bind(this);
    window.addEventListener('resize', this.resizeHandler);
    this.onWindowResize(); // Force initial layout sizing pass
  }

  setupScene() {
    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: "high-performance"
    });
    this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // cap at 2 for 60+ FPS
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.BasicShadowMap; // cheap shadows

    // Scene
    this.scene = new THREE.Scene();

    // Camera (placed behind and slightly above the player, looking forward)
    this.camera = new THREE.PerspectiveCamera(
      60,
      this.canvas.clientWidth / this.canvas.clientHeight,
      0.1,
      200
    );
    this.updateCameraForAspect();

    // Common Lights
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(this.ambientLight);

    this.dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    this.dirLight.position.set(5, 15, 5);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 1024;
    this.dirLight.shadow.mapSize.height = 1024;
    this.dirLight.shadow.camera.near = 0.5;
    this.dirLight.shadow.camera.far = 40;
    this.dirLight.shadow.camera.left = -8;
    this.dirLight.shadow.camera.right = 8;
    this.dirLight.shadow.camera.top = 10;
    this.dirLight.shadow.camera.bottom = -10;
    this.scene.add(this.dirLight);
  }

  // Load level parameters (Lighting, Colors, Particle effects)
  initLevel(levelNum) {
    this.cityLevel = levelNum;
    this.score = 0;
    this.coins = 0;
    this.distanceTraveled = 0;
    this.gameSpeedMultiplier = 0.85 + (levelNum * 0.15); // Level 4 is faster
    this.isCrashed = false; // Reset crash state

    // Target Scores to clear levels
    const targets = { 1: 500, 2: 800, 3: 1200, 4: 1500 };
    this.targetScore = targets[levelNum] || 500;

    // Clean up old instances if they exist
    this.cleanupGameplay();

    // 1. Theme Configuration
    this.configureLevelTheme(levelNum);

    // 2. Instantiate Gameplay Components
    this.road = new Road(this.scene, this.cityLevel);
    this.player = new Player(this.scene);
    this.obstaclesManager = new ObstaclesManager(this.scene, this.cityLevel);

    // Trigger UI resets
    if (this.callbacks.onScoreUpdate) this.callbacks.onScoreUpdate(this.score, this.targetScore);
    if (this.callbacks.onCoinsUpdate) this.callbacks.onCoinsUpdate(this.coins);
  }

  configureLevelTheme(level) {
    // Clear old particle systems / rain
    if (this.rainSystem) {
      this.scene.remove(this.rainSystem);
      this.rainSystem = null;
    }

    if (level === 1) {
      // MUMBAI: Neon Monsoon Night
      this.scene.background = new THREE.Color(0x060614);
      this.scene.fog = new THREE.FogExp2(0x060614, 0.008);
      this.ambientLight.color.setHex(0x3a3aff);
      this.ambientLight.intensity = 0.45;

      this.dirLight.color.setHex(0xffaa77); // warm street glow
      this.dirLight.position.set(-5, 12, -5);

      // Create Rain Particles (highly stylized)
      this.createRainEffect();
    } 
    else if (level === 2) {
      // DELHI: Sunset Dust Storm
      this.scene.background = new THREE.Color(0x7c5d43);
      this.scene.fog = new THREE.FogExp2(0x7c5d43, 0.016); // Thicker dusty fog
      this.ambientLight.color.setHex(0xff8844); // Orange dust
      this.ambientLight.intensity = 0.5;

      this.dirLight.color.setHex(0xffddaa);
      this.dirLight.position.set(10, 10, 5);
    } 
    else if (level === 3) {
      // PUNE: Morning Potholes & Fog
      this.scene.background = new THREE.Color(0xcbc3e3); // Lavender morning
      this.scene.fog = new THREE.FogExp2(0xcbc3e3, 0.022); // Dense white/purple mist
      this.ambientLight.color.setHex(0xffffff);
      this.ambientLight.intensity = 0.6;

      this.dirLight.color.setHex(0xffebad); // Pale morning sun
      this.dirLight.position.set(5, 15, -2);
    } 
    else {
      // BANGALORE: Tech Dusk (High traffic)
      this.scene.background = new THREE.Color(0x0c1328);
      this.scene.fog = new THREE.FogExp2(0x0c1328, 0.012);
      this.ambientLight.color.setHex(0x90a4ae);
      this.ambientLight.intensity = 0.35;

      this.dirLight.color.setHex(0x00f0ff); // Cool cyan cyber glow
      this.dirLight.position.set(-5, 15, 10);
    }
  }

  createRainEffect() {
    const rainCount = 180;
    const rainGeom = new THREE.BufferGeometry();
    const positions = new Float32Array(rainCount * 3);
    const velocities = [];

    for (let i = 0; i < rainCount; i++) {
      // Scatter in front of camera
      positions[i * 3] = (Math.random() - 0.5) * 20; // X
      positions[i * 3 + 1] = Math.random() * 15; // Y
      positions[i * 3 + 2] = -Math.random() * 50; // Z
      velocities.push(15 + Math.random() * 10); // fall speed
    }

    rainGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    // Simple line material for rain droplets
    const rainMat = new THREE.LineBasicMaterial({
      color: 0x88ccff,
      transparent: true,
      opacity: 0.5
    });

    this.rainSystem = new THREE.Points(rainGeom, rainMat);
    this.rainSystem.userData = { velocities };
    this.scene.add(this.rainSystem);
  }

  updateRain(dt) {
    if (!this.rainSystem) return;
    const posAttr = this.rainSystem.geometry.attributes.position;
    const positions = posAttr.array;
    const velocities = this.rainSystem.userData.velocities;

    for (let i = 0; i < velocities.length; i++) {
      positions[i * 3 + 1] -= velocities[i] * dt; // Fall down
      
      // Let wind blow rain backward
      positions[i * 3 + 2] += (35 * this.gameSpeedMultiplier) * dt; 

      // Reset when falling below ground or scrolling behind player
      if (positions[i * 3 + 1] < 0 || positions[i * 3 + 2] > 10) {
        positions[i * 3] = (Math.random() - 0.5) * 20;
        positions[i * 3 + 1] = 12 + Math.random() * 5;
        positions[i * 3 + 2] = -40 - Math.random() * 30;
      }
    }
    posAttr.needsUpdate = true;
  }

  start() {
    this.isPlaying = true;
    this.lastTime = performance.now(); // Reset clock
    this.animate();
  }

  pause() {
    this.isPlaying = false;
  }

  resume() {
    this.isPlaying = true;
    this.lastTime = performance.now(); // Reset clock
    this.animate();
  }

  cleanupGameplay() {
    if (this.road) this.road.destroy();
    if (this.player) this.player.destroy();
    if (this.obstaclesManager) this.obstaclesManager.destroy();

    this.road = null;
    this.player = null;
    this.obstaclesManager = null;
  }

  destroy() {
    this.pause();
    this.cleanupGameplay();
    
    if (this.rainSystem) this.scene.remove(this.rainSystem);

    window.removeEventListener('resize', this.resizeHandler);
    this.renderer.dispose();
  }

  onWindowResize() {
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    this.renderer.setSize(width, height);
    this.camera.aspect = width / height;
    this.updateCameraForAspect();
  }

  updateCameraForAspect() {
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    const aspect = width / height;

    if (aspect < 1.0) {
      // Portrait mode: Raise camera and push it further back, widen FOV slightly
      this.camera.fov = 68;
      this.camera.position.set(0, 6.2, 9.2);
    } else {
      // Landscape mode: standard camera positioning
      this.camera.fov = 60;
      this.camera.position.set(0, 5.0, 7.5);
    }
    this.camera.lookAt(new THREE.Vector3(0, 1.5, -12));
    this.camera.updateProjectionMatrix();
  }

  // Generate pattern-based clean layouts (winnable combination of obstacles)
  handleSpawning(dt) {
    this.spawnTimer += dt;
    
    // Speed dynamic scaling of intervals
    const currentInterval = Math.max(0.9, this.spawnInterval / this.gameSpeedMultiplier);

    if (this.spawnTimer >= currentInterval) {
      this.spawnTimer = 0;

      // Select a spawning pattern
      const pattern = Math.floor(Math.random() * 6);
      const spawnZ = -140; // spawn distance

      // Obstacle speed relative to road (moves towards player)
      const bikeSpeed = -10; // moves forward on street (less relative speed)
      const autoSpeed = -5;
      const truckSpeed = -15; // rash driver driving fast

      switch (pattern) {
        case 0:
          // Pattern 0: Pothole center, barricade left, paper right
          this.obstaclesManager.spawnObstacle(OBSTACLE_TYPES.POTHOLE, 1, spawnZ, 0);
          this.obstaclesManager.spawnObstacle(OBSTACLE_TYPES.BARRICADE, 0, spawnZ, 0);
          this.obstaclesManager.spawnItem(ITEM_TYPES.PAPER, 2, spawnZ - 5);
          break;

        case 1:
          // Pattern 1: Auto rickshaw right, banana peel center, left open
          this.obstaclesManager.spawnObstacle(OBSTACLE_TYPES.AUTO_RICKSHAW, 2, spawnZ, autoSpeed);
          this.obstaclesManager.spawnItem(ITEM_TYPES.BANANA, 1, spawnZ - 4);
          this.obstaclesManager.spawnItem(ITEM_TYPES.BOTTLE, 1, spawnZ - 10);
          break;

        case 2:
          // Pattern 2: Rash Driving Truck Center, barricade right, garbage left
          this.obstaclesManager.spawnObstacle(OBSTACLE_TYPES.RASH_TRUCK, 1, spawnZ, truckSpeed);
          this.obstaclesManager.spawnObstacle(OBSTACLE_TYPES.POTHOLE, 2, spawnZ, 0);
          this.obstaclesManager.spawnItem(ITEM_TYPES.PAPER, 0, spawnZ - 8);
          break;

        case 3:
          // Pattern 3: Motorbike left, open manhole center, garbage right
          this.obstaclesManager.spawnObstacle(OBSTACLE_TYPES.BIKE, 0, spawnZ, bikeSpeed);
          this.obstaclesManager.spawnObstacle(OBSTACLE_TYPES.MANHOLE, 1, spawnZ, 0);
          this.obstaclesManager.spawnItem(ITEM_TYPES.BOTTLE, 2, spawnZ - 5);
          break;

        case 4:
          // Pattern 4: Collectables combo in center lane, sides blocked
          this.obstaclesManager.spawnObstacle(OBSTACLE_TYPES.BARRICADE, 0, spawnZ, 0);
          this.obstaclesManager.spawnObstacle(OBSTACLE_TYPES.BARRICADE, 2, spawnZ, 0);
          this.obstaclesManager.spawnItem(ITEM_TYPES.BANANA, 1, spawnZ);
          this.obstaclesManager.spawnItem(ITEM_TYPES.BOTTLE, 1, spawnZ - 6);
          this.obstaclesManager.spawnItem(ITEM_TYPES.PAPER, 1, spawnZ - 12);
          break;

        case 5:
          // Pattern 5: Auto left, bike right, center pothole
          this.obstaclesManager.spawnObstacle(OBSTACLE_TYPES.AUTO_RICKSHAW, 0, spawnZ, autoSpeed);
          this.obstaclesManager.spawnObstacle(OBSTACLE_TYPES.BIKE, 2, spawnZ, bikeSpeed);
          this.obstaclesManager.spawnObstacle(OBSTACLE_TYPES.POTHOLE, 1, spawnZ, 0);
          break;
      }
    }
  }

  // Fast bounding-box collisions
  checkCollisions() {
    if (!this.player || this.player.isDead) return;

    const pBox = this.player.box;
    const pY = this.player.currentY;

    // 1. Collision with Obstacles
    const obstacles = this.obstaclesManager.activeObstacles;
    for (let i = 0; i < obstacles.length; i++) {
      const obs = obstacles[i];
      
      if (pBox.intersectsBox(obs.box)) {
        // Narrow phase checks for jumpable/slidable cases:
        if (obs.type === OBSTACLE_TYPES.POTHOLE || obs.type === OBSTACLE_TYPES.MANHOLE) {
          // Player is jumping, clear!
          if (pY >= 0.7) {
            continue;
          } else {
            this.handlePlayerCrash(`You fell into an open ${obs.type}!`);
            return;
          }
        } 
        else if (obs.type === OBSTACLE_TYPES.BARRICADE) {
          // Barricade is a high barrier. Jump clears it if player is high enough.
          // Bounding height is 1.6
          if (pY >= 1.45) {
            continue;
          } else {
            this.handlePlayerCrash("You crashed into a street barricade!");
            return;
          }
        } 
        else {
          // Vehicles (Auto, Bike, Truck) - general collision is instant crash
          // If player slides, they still hit the side of vehicle.
          // If player jumps, they cannot jump over high truck or auto rickshaws safely.
          if (obs.type === OBSTACLE_TYPES.RASH_TRUCK) {
            this.handlePlayerCrash("You got ran over by a rash driving truck!");
          } else if (obs.type === OBSTACLE_TYPES.AUTO_RICKSHAW) {
            this.handlePlayerCrash("You collided with an auto-rickshaw!");
          } else {
            this.handlePlayerCrash("You collided with a scooter rider!");
          }
          return;
        }
      }
    }

    // 2. Collision with Collectable items (Garbage)
    const items = this.obstaclesManager.activeItems;
    for (let i = items.length - 1; i >= 0; i--) {
      const item = items[i];
      if (pBox.intersectsBox(item.box)) {
        // Collect
        this.obstaclesManager.collectItem(i);
        this.coins += 1;
        this.score += 50; // 50 points per garbage cleaned
        
        if (this.callbacks.onCoinsUpdate) this.callbacks.onCoinsUpdate(this.coins);
        if (this.callbacks.onScoreUpdate) this.callbacks.onScoreUpdate(this.score, this.targetScore);

        // Check level completion target
        if (this.score >= this.targetScore) {
          this.handleLevelClear();
          return;
        }
      }
    }
  }

  handlePlayerCrash(reason) {
    this.isCrashed = true;
    this.player.die();
    
    if (this.callbacks.onGameOver) {
      setTimeout(() => {
        this.isPlaying = false; // Stop the animation loop now
        this.callbacks.onGameOver(this.score, this.coins, reason);
      }, 900); // delay popup until death animation completes
    }
  }

  handleLevelClear() {
    this.isPlaying = false;
    if (this.callbacks.onLevelClear) {
      setTimeout(() => {
        this.callbacks.onLevelClear(this.score, this.coins);
      }, 500);
    }
  }

  animate() {
    if (!this.isPlaying) return;

    requestAnimationFrame(this.animate.bind(this));

    const now = performance.now();
    const dt = Math.min((now - this.lastTime) / 1000, 0.1); // cap dt to avoid physics glitches on lag
    this.lastTime = now;

    if (this.isCrashed) {
      // Just run death animation and render frame
      this.player.update(dt, 0);
      this.renderer.render(this.scene, this.camera);
      return;
    }

    // 1. Update Game Distance & Score (gradually accumulate score by surviving)
    this.distanceTraveled += 35 * this.gameSpeedMultiplier * dt;
    this.score += Math.round(dt * 15);
    
    if (this.callbacks.onScoreUpdate) {
      this.callbacks.onScoreUpdate(this.score, this.targetScore);
    }

    // 2. Update Weather (Rain particles for Level 1)
    if (this.cityLevel === 1) {
      this.updateRain(dt);
    }

    // 3. Update Road segments movement
    this.road.update(dt, 35 * this.gameSpeedMultiplier);

    // 4. Update Obstacles and Spawning
    this.handleSpawning(dt);
    this.obstaclesManager.update(dt, this.gameSpeedMultiplier);

    // 5. Update Player states
    this.player.update(dt, 35 * this.gameSpeedMultiplier);

    // 6. Check Collisions
    this.checkCollisions();

    // 7. Render Frame
    this.renderer.render(this.scene, this.camera);
  }
}
