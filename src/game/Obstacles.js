import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { sound } from './SoundManager.js';

// Types of obstacles
export const OBSTACLE_TYPES = {
  POTHOLE: 'pothole',
  MANHOLE: 'manhole',
  BARRICADE: 'barricade',
  AUTO_RICKSHAW: 'auto',
  BIKE: 'bike',
  RASH_TRUCK: 'rash_truck'
};

// Types of garbage items
export const ITEM_TYPES = {
  BANANA: 'banana',
  BOTTLE: 'bottle',
  PAPER: 'paper'
};

export class ObstaclesManager {
  constructor(scene, cityLevel = 1) {
    this.scene = scene;
    this.cityLevel = cityLevel;
    
    // Arrays for tracking active entities
    this.activeObstacles = [];
    this.activeItems = [];

    // Pools for recycling
    this.pools = {
      obstacles: {},
      items: {}
    };

    // Initialize empty pools for each type
    Object.values(OBSTACLE_TYPES).forEach(type => this.pools.obstacles[type] = []);
    Object.values(ITEM_TYPES).forEach(type => this.pools.items[type] = []);

    // Share materials
    this.createMaterials();
  }

  createMaterials() {
    this.materials = {
      pothole: new THREE.MeshBasicMaterial({ color: 0x07070d }),
      manholeRim: new THREE.MeshStandardMaterial({ color: 0x44444c, roughness: 0.7 }),
      manholeVoid: new THREE.MeshBasicMaterial({ color: 0x000000 }),
      barricadeOrange: new THREE.MeshPhongMaterial({ color: 0xff4500 }),
      barricadeWhite: new THREE.MeshPhongMaterial({ color: 0xffffff }),
      autoGreen: new THREE.MeshPhongMaterial({ color: 0x007f3f, flatShading: true }),
      autoYellow: new THREE.MeshPhongMaterial({ color: 0xffd700, flatShading: true }),
      wheel: new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 }),
      headlight: new THREE.MeshBasicMaterial({ color: 0xfffae0 }),
      headlightFlash: new THREE.MeshBasicMaterial({ color: 0xff0000 }),
      riderHelmet: new THREE.MeshPhongMaterial({ color: 0x00ffff }),
      riderBody: new THREE.MeshPhongMaterial({ color: 0x3b3bff }),
      truckRed: new THREE.MeshPhongMaterial({ color: 0xcc1111 }),
      truckCargo: new THREE.MeshPhongMaterial({ color: 0x777788 }),
      banana: new THREE.MeshPhongMaterial({ color: 0xffdd33, flatShading: true }),
      bottle: new THREE.MeshPhongMaterial({ color: 0x33aaff, transparent: true, opacity: 0.8 }),
      paper: new THREE.MeshPhongMaterial({ color: 0xeeeeee }),
      taillight: new THREE.MeshBasicMaterial({ color: 0xff0000 }),
      taillightFlash: new THREE.MeshBasicMaterial({ color: 0xffaa00 }) // orange indicators flashing
    };
  }

  // Create localized ads bumper sticker texture for rickshaws
  createRickshawAdTexture(cityLevel) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    const bgColors = ['#ffcc00', '#ffffff', '#ffeb3b', '#ff9800'];
    const bgColor = bgColors[Math.floor(Math.random() * bgColors.length)];
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 6;
    ctx.strokeRect(6, 6, canvas.width - 12, canvas.height - 12);
    
    ctx.strokeStyle = '#d32f2f';
    ctx.lineWidth = 2;
    ctx.strokeRect(12, 12, canvas.width - 24, canvas.height - 24);

    const slogans = {
      1: ["जय महाराष्ट्र", "वडा पाव - १० रु.", "घाई असेल तर विमानाने जा!", "माझा भारत महान", "पुढील स्टेशन दादर"],
      2: ["बुरी नज़र वाले तेरा मुंह काला", "हंस मत पगली प्यार हो जाएगा", "देख मगर प्यार से", "दूरी बनाए रखें", "हॉर्न प्लीज"],
      3: ["१ ते ४ विश्रांती वेळ", "हॉर्न वाजवू नका!", "मीटरप्रमाणेच चालेल!", "जाऊ दे ना भाऊ!", "पुणेरी मिसळ"],
      4: ["ಕನ್ನಡ ಕಲಿಯಿರಿ", "ನಮ್ಮ ಬೆಂಗಳೂರು", "ಸ್ಮೈಲ್ ಪ್ಲೀಸ್", "ವೇಗಕ್ಕಿಂತ ಸುರಕ್ಷತೆ ಮುಖ್ಯ", "ಹೋಗಿ ಬನ್ನಿ"]
    };

    const citySlogans = slogans[cityLevel] || slogans[1];
    const text = citySlogans[Math.floor(Math.random() * citySlogans.length)];

    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    let fontSize = 23;
    if (cityLevel === 4) fontSize = 19;
    ctx.font = `bold ${fontSize}px "Outfit", Arial, sans-serif`;
    
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = 3;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    ctx.fillText(text, canvas.width / 2, 48);

    // Hazard warning stripes at the bottom
    const stripeHeight = 24;
    const stripeY = canvas.height - stripeHeight;
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(0, stripeY, canvas.height - stripeHeight, stripeHeight);

    ctx.fillStyle = '#000000';
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    const stripeWidth = 16;
    for (let x = -stripeWidth; x < canvas.width + stripeWidth; x += stripeWidth * 2) {
      ctx.beginPath();
      ctx.moveTo(x, stripeY);
      ctx.lineTo(x + stripeWidth, stripeY);
      ctx.lineTo(x + stripeWidth * 2, canvas.height);
      ctx.lineTo(x + stripeWidth, canvas.height);
      ctx.closePath();
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  // Spawns a new obstacle, pulling from pool if available
  spawnObstacle(type, lane, zPos, speed) {
    let obstacle;
    const pool = this.pools.obstacles[type];

    if (pool.length > 0) {
      obstacle = pool.pop();
      obstacle.active = true;
    } else {
      obstacle = this.createObstacleMesh(type);
    }

    // Lane positioning
    const xPos = [-4, 0, 4][lane];
    obstacle.mesh.position.set(xPos, 0, zPos);
    obstacle.lane = lane;
    obstacle.type = type;
    obstacle.speed = speed; // speed relative to road
    obstacle.active = true;
    
    // AI lane changing triggers
    obstacle.hasLandedChanged = false;
    obstacle.laneChanging = false;
    obstacle.laneChangeTimer = 0;
    obstacle.startLane = lane;
    obstacle.targetLane = lane;

    // Reset headlight and taillight materials
    if (type === OBSTACLE_TYPES.RASH_TRUCK && obstacle.headlights) {
      obstacle.headlights.forEach(hl => hl.material = this.materials.headlight);
    }
    if (type === OBSTACLE_TYPES.RASH_TRUCK && obstacle.taillights) {
      obstacle.taillights.forEach(tl => tl.material = this.materials.taillight);
    }

    // Set bounding box sizes
    obstacle.width = 1.6;
    obstacle.height = 1.0;
    obstacle.depth = 1.6;

    if (type === OBSTACLE_TYPES.BARRICADE) {
      obstacle.width = 3.2;
      obstacle.height = 1.6;
      obstacle.depth = 0.6;
    } else if (type === OBSTACLE_TYPES.POTHOLE || type === OBSTACLE_TYPES.MANHOLE) {
      obstacle.width = 2.0;
      obstacle.height = 0.1; // Flat, check collisions on foot level
      obstacle.depth = 2.0;
    } else if (type === OBSTACLE_TYPES.AUTO_RICKSHAW) {
      obstacle.width = 1.6;
      obstacle.height = 2.0;
      obstacle.depth = 2.6;
    } else if (type === OBSTACLE_TYPES.RASH_TRUCK) {
      obstacle.width = 2.2;
      obstacle.height = 3.2;
      obstacle.depth = 5.0;
    } else if (type === OBSTACLE_TYPES.BIKE) {
      obstacle.width = 0.8;
      obstacle.height = 1.8;
      obstacle.depth = 2.0;
    }

    obstacle.box = new THREE.Box3();
    
    this.scene.add(obstacle.mesh);
    this.activeObstacles.push(obstacle);
  }

  // Spawns a collectable garbage item
  spawnItem(type, lane, zPos) {
    let item;
    const pool = this.pools.items[type];

    if (pool.length > 0) {
      item = pool.pop();
    } else {
      item = this.createItemMesh(type);
    }

    const xPos = [-4, 0, 4][lane];
    // Float garbage item slightly above ground
    item.mesh.position.set(xPos, 0.6, zPos);
    item.mesh.rotation.set(Math.random() * 0.5, Math.random() * Math.PI, 0);
    item.lane = lane;
    item.type = type;
    item.active = true;
    item.box = new THREE.Box3();

    this.scene.add(item.mesh);
    this.activeItems.push(item);
  }

  // Create physical meshes for obstacles
  createObstacleMesh(type) {
    const meshGroup = new THREE.Group();
    const data = { mesh: meshGroup };

    if (type === OBSTACLE_TYPES.POTHOLE) {
      // Flat circle decal on the road
      const geom = new THREE.CylinderGeometry(1.0, 1.0, 0.05, 12);
      const dec = new THREE.Mesh(geom, this.materials.pothole);
      dec.position.y = 0.025; // lay on road surface
      meshGroup.add(dec);
    } 
    else if (type === OBSTACLE_TYPES.MANHOLE) {
      // Flat circular hole with concrete rim
      const rimGeom = new THREE.CylinderGeometry(1.0, 1.05, 0.12, 12);
      const rim = new THREE.Mesh(rimGeom, this.materials.manholeRim);
      rim.position.y = 0.06;
      meshGroup.add(rim);

      const voidGeom = new THREE.CylinderGeometry(0.8, 0.8, 0.14, 12);
      const v = new THREE.Mesh(voidGeom, this.materials.manholeVoid);
      v.position.y = 0.07;
      meshGroup.add(v);
    } 
    else if (type === OBSTACLE_TYPES.BARRICADE) {
      // Saffron/Orange and White Police Barricade
      const standGeom = new THREE.CylinderGeometry(0.1, 0.1, 1.6, 6);
      
      const leftStand = new THREE.Mesh(standGeom, this.materials.barricadeOrange);
      leftStand.position.set(-1.4, 0.8, 0);
      meshGroup.add(leftStand);

      const rightStand = new THREE.Mesh(standGeom, this.materials.barricadeOrange);
      rightStand.position.set(1.4, 0.8, 0);
      meshGroup.add(rightStand);

      // Support feet
      const feetGeom = new THREE.BoxGeometry(0.3, 0.1, 0.8);
      const leftFoot = new THREE.Mesh(feetGeom, this.materials.barricadeOrange);
      leftFoot.position.set(-1.4, 0.05, 0);
      meshGroup.add(leftFoot);

      const rightFoot = new THREE.Mesh(feetGeom, this.materials.barricadeOrange);
      rightFoot.position.set(1.4, 0.05, 0);
      meshGroup.add(rightFoot);

      // Main cross boards (two horizontal striped panels)
      const boardGeom = new THREE.BoxGeometry(3.0, 0.4, 0.15);
      const board1 = new THREE.Mesh(boardGeom, this.materials.barricadeOrange);
      board1.position.set(0, 1.3, 0);
      meshGroup.add(board1);

      const board2 = new THREE.Mesh(boardGeom, this.materials.barricadeOrange);
      board2.position.set(0, 0.6, 0);
      meshGroup.add(board2);

      // Add white stripe boxes on the board
      const stripeGeom = new THREE.BoxGeometry(0.25, 0.42, 0.17);
      for (let x = -1.2; x <= 1.2; x += 0.6) {
        const stripeA = new THREE.Mesh(stripeGeom, this.materials.barricadeWhite);
        stripeA.position.set(x, 1.3, 0);
        stripeA.rotation.y = 0.01;
        meshGroup.add(stripeA);

        const stripeB = new THREE.Mesh(stripeGeom, this.materials.barricadeWhite);
        stripeB.position.set(x + 0.3, 0.6, 0);
        stripeB.rotation.y = 0.01;
        meshGroup.add(stripeB);
      }
    } 
    else if (type === OBSTACLE_TYPES.AUTO_RICKSHAW) {
      // Indian Auto Rickshaw
      // Green bottom body
      const bodyGeom = new THREE.BoxGeometry(1.3, 0.9, 2.2);
      const body = new THREE.Mesh(bodyGeom, this.materials.autoGreen);
      body.position.y = 0.85;
      meshGroup.add(body);

      // Yellow top roof
      const roofGeom = new THREE.BoxGeometry(1.2, 0.7, 1.8);
      const roof = new THREE.Mesh(roofGeom, this.materials.autoYellow);
      roof.position.set(0, 1.6, -0.2); // shifted slightly back
      meshGroup.add(roof);

      // Glass frame pillars
      const pillarGeom = new THREE.BoxGeometry(0.08, 0.7, 0.08);
      const frontPillarL = new THREE.Mesh(pillarGeom, this.materials.manholeRim);
      frontPillarL.position.set(-0.55, 1.6, 0.7);
      meshGroup.add(frontPillarL);

      const frontPillarR = new THREE.Mesh(pillarGeom, this.materials.manholeRim);
      frontPillarR.position.set(0.55, 1.6, 0.7);
      meshGroup.add(frontPillarR);

      // Windows opening glass (using translucent glass material)
      const windShieldGeom = new THREE.BoxGeometry(1.1, 0.65, 0.04);
      const windshield = new THREE.Mesh(windShieldGeom, new THREE.MeshPhongMaterial({ color: 0x90caf9, transparent: true, opacity: 0.6 }));
      windshield.position.set(0, 1.6, 0.72);
      meshGroup.add(windshield);

      // Three Wheels
      const wheelGeom = new THREE.CylinderGeometry(0.35, 0.35, 0.3, 8);
      
      const frontWheel = new THREE.Mesh(wheelGeom, this.materials.wheel);
      frontWheel.rotation.z = Math.PI / 2;
      frontWheel.position.set(0, 0.35, 0.85);
      meshGroup.add(frontWheel);

      const rearWheelL = new THREE.Mesh(wheelGeom, this.materials.wheel);
      rearWheelL.rotation.z = Math.PI / 2;
      rearWheelL.position.set(-0.65, 0.35, -0.6);
      meshGroup.add(rearWheelL);

      const rearWheelR = new THREE.Mesh(wheelGeom, this.materials.wheel);
      rearWheelR.rotation.z = Math.PI / 2;
      rearWheelR.position.set(0.65, 0.35, -0.6);
      meshGroup.add(rearWheelR);

      // Headlight (front)
      const lightGeom = new THREE.SphereGeometry(0.15, 6, 6);
      const light = new THREE.Mesh(lightGeom, this.materials.headlight);
      light.position.set(0, 0.7, 1.12);
      meshGroup.add(light);

      // Mudguard
      const guardGeom = new THREE.BoxGeometry(0.35, 0.4, 0.6);
      const guard = new THREE.Mesh(guardGeom, this.materials.manholeRim);
      guard.position.set(0, 0.55, 0.85);
      meshGroup.add(guard);

      // Dynamic ad plate on the back panel
      const adTexture = this.createRickshawAdTexture(this.cityLevel);
      const adGeom = new THREE.BoxGeometry(0.85, 0.42, 0.02);
      const adMat = new THREE.MeshBasicMaterial({ map: adTexture });
      const adPlate = new THREE.Mesh(adGeom, adMat);
      adPlate.name = "rickshawAd";
      adPlate.position.set(0, 0.85, -1.11); // back of body box (depth 2.2 / 2 = 1.1)
      meshGroup.add(adPlate);

      // Red Taillights
      const tailLightGeom = new THREE.BoxGeometry(0.12, 0.12, 0.05);
      const tlL = new THREE.Mesh(tailLightGeom, this.materials.taillight);
      tlL.position.set(-0.48, 0.62, -1.11);
      meshGroup.add(tlL);

      const tlR = new THREE.Mesh(tailLightGeom, this.materials.taillight);
      tlR.position.set(0.48, 0.62, -1.11);
      meshGroup.add(tlR);

      // Rotate 180 degrees so it faces forward (away from camera)
      meshGroup.rotation.y = Math.PI;
    } 
    else if (type === OBSTACLE_TYPES.BIKE) {
      // Scooter / Motorbike with Rider
      const frameGeom = new THREE.BoxGeometry(0.35, 0.8, 1.6);
      const bikeColorMat = new THREE.MeshPhongMaterial({ color: 0xff0055, flatShading: true });
      const frame = new THREE.Mesh(frameGeom, bikeColorMat);
      frame.position.y = 0.7;
      meshGroup.add(frame);

      // Two wheels
      const wheelGeom = new THREE.CylinderGeometry(0.35, 0.35, 0.25, 8);
      const frontW = new THREE.Mesh(wheelGeom, this.materials.wheel);
      frontW.rotation.z = Math.PI / 2;
      frontW.position.set(0, 0.35, 0.7);
      meshGroup.add(frontW);

      const backW = new THREE.Mesh(wheelGeom, this.materials.wheel);
      backW.rotation.z = Math.PI / 2;
      backW.position.set(0, 0.35, -0.7);
      meshGroup.add(backW);

      // Handlebars
      const barGeom = new THREE.CylinderGeometry(0.06, 0.06, 0.8, 4);
      const bar = new THREE.Mesh(barGeom, this.materials.manholeRim);
      bar.rotation.z = Math.PI / 2;
      bar.position.set(0, 1.25, 0.45);
      meshGroup.add(bar);

      // Rider body
      const riderBodyGeom = new THREE.BoxGeometry(0.6, 0.9, 0.5);
      const body = new THREE.Mesh(riderBodyGeom, this.materials.riderBody);
      body.position.set(0, 1.3, -0.1);
      meshGroup.add(body);

      // Helmet (head)
      const helmetGeom = new THREE.SphereGeometry(0.28, 8, 8);
      const helmet = new THREE.Mesh(helmetGeom, this.materials.riderHelmet);
      helmet.position.set(0, 1.85, -0.08);
      meshGroup.add(helmet);

      // Light
      const lightGeom = new THREE.SphereGeometry(0.12, 6, 6);
      const light = new THREE.Mesh(lightGeom, this.materials.headlight);
      light.position.set(0, 1.1, 0.8);
      meshGroup.add(light);

      // Red Taillight
      const tailLightGeom = new THREE.BoxGeometry(0.1, 0.1, 0.05);
      const tl = new THREE.Mesh(tailLightGeom, this.materials.taillight);
      tl.position.set(0, 0.7, -0.81);
      meshGroup.add(tl);

      // Rotate 180 degrees so it faces forward (away from camera)
      meshGroup.rotation.y = Math.PI;
    } 
    else if (type === OBSTACLE_TYPES.RASH_TRUCK) {
      // Large Indian Cargo Truck (AI Rash Driver)
      // Chassis
      const chassisGeom = new THREE.BoxGeometry(1.9, 0.5, 4.6);
      const chassis = new THREE.Mesh(chassisGeom, this.materials.wheel);
      chassis.position.y = 0.6;
      meshGroup.add(chassis);

      // Cab front (Red cabin)
      const cabGeom = new THREE.BoxGeometry(1.8, 1.8, 1.5);
      const cab = new THREE.Mesh(cabGeom, this.materials.truckRed);
      cab.position.set(0, 1.75, 1.45); // placed in front
      cab.castShadow = true;
      meshGroup.add(cab);

      // Windshield
      const windGeom = new THREE.BoxGeometry(1.6, 0.7, 0.1);
      const wind = new THREE.Mesh(windGeom, new THREE.MeshPhongMaterial({ color: 0xe3f2fd, transparent: true, opacity: 0.7 }));
      wind.position.set(0, 2.0, 2.2);
      meshGroup.add(wind);

      // Cargo Container (Grey/Metal back box)
      const cargoGeom = new THREE.BoxGeometry(1.95, 2.3, 3.1);
      const cargo = new THREE.Mesh(cargoGeom, this.materials.truckCargo);
      cargo.position.set(0, 2.0, -0.75); // placed at back
      cargo.castShadow = true;
      meshGroup.add(cargo);

      // Large Wheels (6 wheels)
      const wheelGeom = new THREE.CylinderGeometry(0.5, 0.5, 0.45, 8);
      const wheelPositions = [
        [-0.95, 0.5, 1.3], [0.95, 0.5, 1.3],   // front
        [-0.95, 0.5, -0.6], [0.95, 0.5, -0.6], // middle
        [-0.95, 0.5, -1.8], [0.95, 0.5, -1.8]  // rear
      ];

      wheelPositions.forEach((pos) => {
        const w = new THREE.Mesh(wheelGeom, this.materials.wheel);
        w.rotation.z = Math.PI / 2;
        w.position.set(pos[0], pos[1], pos[2]);
        w.castShadow = true;
        meshGroup.add(w);
      });

      // Headlights (flash yellow or red)
      const hlGeom = new THREE.SphereGeometry(0.18, 6, 6);
      
      const hlL = new THREE.Mesh(hlGeom, this.materials.headlight);
      hlL.position.set(-0.65, 1.1, 2.22);
      meshGroup.add(hlL);

      const hlR = new THREE.Mesh(hlGeom, this.materials.headlight);
      hlR.position.set(0.65, 1.1, 2.22);
      meshGroup.add(hlR);

      // Red Taillights on the back of the cargo container (local z = -2.3)
      const tlGeom = new THREE.BoxGeometry(0.2, 0.2, 0.05);
      const truckTlL = new THREE.Mesh(tlGeom, this.materials.taillight);
      truckTlL.position.set(-0.7, 0.6, -2.31);
      meshGroup.add(truckTlL);

      const truckTlR = new THREE.Mesh(tlGeom, this.materials.taillight);
      truckTlR.position.set(0.7, 0.6, -2.31);
      meshGroup.add(truckTlR);

      data.headlights = [hlL, hlR]; // store reference
      data.taillights = [truckTlL, truckTlR]; // store references for flashing!

      // Rotate 180 degrees so it faces forward (away from camera)
      meshGroup.rotation.y = Math.PI;
    }

    return data;
  }

  // Create physical meshes for collectable garbage items
  createItemMesh(type) {
    const meshGroup = new THREE.Group();
    const data = { mesh: meshGroup };

    if (type === ITEM_TYPES.BANANA) {
      // Banana peel: curved yellow shape
      const centerGeom = new THREE.SphereGeometry(0.2, 5, 5);
      const center = new THREE.Mesh(centerGeom, this.materials.banana);
      meshGroup.add(center);

      // Adding 3 peel skin flaps
      const flapGeom = new THREE.BoxGeometry(0.1, 0.05, 0.45);
      for (let i = 0; i < 3; i++) {
        const flap = new THREE.Mesh(flapGeom, this.materials.banana);
        flap.rotation.y = (i * Math.PI * 2) / 3;
        flap.position.set(Math.sin(flap.rotation.y)*0.18, -0.05, Math.cos(flap.rotation.y)*0.18);
        flap.rotation.x = 0.35; // curved down
        meshGroup.add(flap);
      }
    } 
    else if (type === ITEM_TYPES.BOTTLE) {
      // Blue transparent plastic soda bottle
      const cylGeom = new THREE.CylinderGeometry(0.14, 0.14, 0.45, 6);
      const cyl = new THREE.Mesh(cylGeom, this.materials.bottle);
      meshGroup.add(cyl);

      const neckGeom = new THREE.CylinderGeometry(0.06, 0.1, 0.15, 6);
      const neck = new THREE.Mesh(neckGeom, this.materials.bottle);
      neck.position.y = 0.3;
      meshGroup.add(neck);

      const capGeom = new THREE.CylinderGeometry(0.07, 0.07, 0.05, 6);
      const cap = new THREE.Mesh(capGeom, this.materials.wheel); // black cap
      cap.position.y = 0.4;
      meshGroup.add(cap);
    } 
    else if (type === ITEM_TYPES.PAPER) {
      // Crumpled white paper ball/sheet
      const geom = new THREE.DodecahedronGeometry(0.2, 1);
      const paper = new THREE.Mesh(geom, this.materials.paper);
      meshGroup.add(paper);
    }

    // Set item bounding size
    data.width = 0.8;
    data.height = 0.8;
    data.depth = 0.8;

    return data;
  }

  update(dt, speedMultiplier) {
    const gameSpeed = 35 * speedMultiplier; // road speed

    // Update Obstacles
    for (let i = this.activeObstacles.length - 1; i >= 0; i--) {
      const obs = this.activeObstacles[i];
      
      // Calculate movement: road speed + obstacle's speed relative to road
      // (Moving vehicles drive toward the player, i.e., moving in +Z direction relative to road)
      const finalSpeed = gameSpeed + obs.speed;
      obs.mesh.position.z += finalSpeed * dt;

      // 1. AI Rash Driving Lane Change Logic
      if (obs.type === OBSTACLE_TYPES.RASH_TRUCK && !obs.isDead) {
        // Trigger lane change when getting close to the player (e.g. Z is between -45 and -25)
        if (obs.mesh.position.z >= -45 && obs.mesh.position.z <= -20 && !obs.hasLandedChanged && !obs.laneChanging) {
          obs.laneChanging = true;
          obs.startLane = obs.lane;
          
          // Pick adjacent lane to swerve into
          if (obs.lane === 1) {
            obs.targetLane = Math.random() > 0.5 ? 0 : 2; // swerve left or right from center
          } else {
            obs.targetLane = 1; // swerve into center lane from sides
          }

          // Make taillights flash orange to alert player!
          if (obs.taillights) {
            obs.taillights.forEach(tl => tl.material = this.materials.taillightFlash);
          }
        }

        // Interpolate the lane change
        if (obs.laneChanging) {
          obs.laneChangeTimer += dt * 3.2; // complete lane change in ~0.3s
          if (obs.laneChangeTimer >= 1.0) {
            obs.laneChanging = false;
            obs.hasLandedChanged = true;
            obs.lane = obs.targetLane;
            obs.mesh.position.x = [-4, 0, 4][obs.targetLane];
          } else {
            const startX = [-4, 0, 4][obs.startLane];
            const targetX = [-4, 0, 4][obs.targetLane];
            // Lerp
            obs.mesh.position.x = startX + (targetX - startX) * obs.laneChangeTimer;
          }
        }
      }

      // 2. Animate wheels on moving vehicles
      if (obs.type === OBSTACLE_TYPES.AUTO_RICKSHAW || obs.type === OBSTACLE_TYPES.BIKE || obs.type === OBSTACLE_TYPES.RASH_TRUCK) {
        obs.mesh.children.forEach(child => {
          // Identify wheels by cylinder geometry or mesh material
          if (child.material === this.materials.wheel && child.geometry.type === 'CylinderGeometry') {
            child.rotation.x += finalSpeed * dt * 0.8; // spin wheels forward (plus sign due to 180-deg Y-rotation)
          }
        });
      }

      // Update bounding box
      obs.box.min.set(obs.mesh.position.x - obs.width/2, obs.mesh.position.y, obs.mesh.position.z - obs.depth/2);
      obs.box.max.set(obs.mesh.position.x + obs.width/2, obs.mesh.position.y + obs.height, obs.mesh.position.z + obs.depth/2);

      // 3. Recycle off-screen obstacles
      if (obs.mesh.position.z > 15) {
        this.recycleObstacle(obs, i);
      }
    }

    // Update Items (Garbage)
    for (let i = this.activeItems.length - 1; i >= 0; i--) {
      const item = this.activeItems[i];
      item.mesh.position.z += gameSpeed * dt;

      // Animate: Spin & Bob
      item.mesh.rotation.y += 2.0 * dt;
      item.mesh.position.y = 0.6 + Math.sin(Date.now() * 0.005) * 0.15;

      // Update box
      item.box.min.set(item.mesh.position.x - item.width/2, item.mesh.position.y - item.height/2, item.mesh.position.z - item.depth/2);
      item.box.max.set(item.mesh.position.x + item.width/2, item.mesh.position.y + item.height/2, item.mesh.position.z + item.depth/2);

      // Recycle off-screen items
      if (item.mesh.position.z > 15) {
        this.recycleItem(item, i);
      }
    }
  }

  recycleObstacle(obs, index) {
    obs.active = false;
    this.scene.remove(obs.mesh);
    this.activeObstacles.splice(index, 1);
    this.pools.obstacles[obs.type].push(obs);
  }

  recycleItem(item, index) {
    item.active = false;
    this.scene.remove(item.mesh);
    this.activeItems.splice(index, 1);
    this.pools.items[item.type].push(item);
  }

  collectItem(index) {
    const item = this.activeItems[index];
    
    // Play sound and trigger particles / score
    sound.playScore();

    // Recycle immediately
    this.recycleItem(item, index);
  }

  clearAll() {
    // Clean active obstacles
    this.activeObstacles.forEach(obs => {
      this.scene.remove(obs.mesh);
    });
    this.activeObstacles = [];

    // Clean active items
    this.activeItems.forEach(item => {
      this.scene.remove(item.mesh);
    });
    this.activeItems = [];
  }

  destroy() {
    this.clearAll();

    // Clean pools
    Object.keys(this.pools.obstacles).forEach(type => {
      this.pools.obstacles[type].forEach(obs => {
        obs.mesh.traverse(child => {
          if (child.isMesh) child.geometry.dispose();
        });
      });
      this.pools.obstacles[type] = [];
    });

    Object.keys(this.pools.items).forEach(type => {
      this.pools.items[type].forEach(item => {
        item.mesh.traverse(child => {
          if (child.isMesh) child.geometry.dispose();
        });
      });
      this.pools.items[type] = [];
    });
  }
}
