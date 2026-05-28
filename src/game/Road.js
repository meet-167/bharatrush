import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

const SHOP_NAMES = {
  1: ["CHAI TAPRI", "VADA PAV", "MUMBAI SPICE", "KIRANA SHOP", "AUTO SHACK"],
  2: ["DELHI DHABA", "SAMOSA HUB", "BIRYANI BAZAR", "SAREE KENDRA", "PUNJAB SWEETS"],
  3: ["PUNE BAKERY", "MISAL HOUSE", "CRAFT TAP", "PUNE KIRANA", "FRUIT CART"],
  4: ["TECH PARK", "CAFFEINE HUB", "DOSA CORNER", "IT CELL", "SILICON STORE"]
};

const SHOP_COLORS = ["#ff5500", "#ffaa00", "#00ff66", "#00f0ff", "#ff0077"];

export class Road {
  constructor(scene, cityLevel) {
    this.scene = scene;
    this.cityLevel = cityLevel; // 1: Mumbai, 2: Delhi, 3: Pune, 4: Bangalore

    this.segmentLength = 35; // length of each road segment along Z axis
    this.numSegments = 6; // total segments in pool
    this.roadWidth = 12; // 3 lanes (each 4 units wide)
    
    this.segments = [];
    this.speed = 0;

    // Pre-create materials to share across chunks (keeps memory low & draw calls fast)
    this.createMaterials();

    // Spawn initial segments
    for (let i = 0; i < this.numSegments; i++) {
      const zPos = -i * this.segmentLength;
      const segment = this.createSegment(zPos);
      this.segments.push(segment);
      this.scene.add(segment);
    }
  }

  createMaterials() {
    this.materials = {
      road: new THREE.MeshStandardMaterial({ color: 0x181822, roughness: 0.8 }),
      divider: new THREE.MeshBasicMaterial({ color: 0xffffff }),
      curbBlack: new THREE.MeshPhongMaterial({ color: 0x111111 }),
      curbWhite: new THREE.MeshPhongMaterial({ color: 0xcccccc }),
      sidewalk: new THREE.MeshStandardMaterial({ color: 0x3a3a44, roughness: 0.9 }),
      buildingGlass: new THREE.MeshPhongMaterial({ color: 0x0a1a3a, shininess: 80, transparent: true, opacity: 0.85 }),
      pole: new THREE.MeshPhongMaterial({ color: 0x33333b }),
      lampGlow: new THREE.MeshBasicMaterial({ color: 0xfff0b0 }),
      coneLight: new THREE.MeshBasicMaterial({
        color: 0xfff5cc,
        transparent: true,
        opacity: 0.15,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide
      }),
      // Procedural garbage materials
      banana: new THREE.MeshPhongMaterial({ color: 0xffdd33 }),
      bottle: new THREE.MeshPhongMaterial({ color: 0x33aaff, transparent: true, opacity: 0.7 }),
      paper: new THREE.MeshPhongMaterial({ color: 0xdddddd }),

      // Cyber Indian Roadside Props Materials
      wood: new THREE.MeshPhongMaterial({ color: 0x8b5a2b, flatShading: true }),
      metal: new THREE.MeshPhongMaterial({ color: 0x777788, flatShading: true }),
      glass: new THREE.MeshPhongMaterial({ color: 0x90caf9, transparent: true, opacity: 0.5 }),
      gasBlue: new THREE.MeshPhongMaterial({ color: 0x0088cc, flatShading: true }),
      vegGreen: new THREE.MeshPhongMaterial({ color: 0x2e7d32, flatShading: true }),
      vegRed: new THREE.MeshPhongMaterial({ color: 0xc62828, flatShading: true }),
      vegYellow: new THREE.MeshPhongMaterial({ color: 0xf9a825, flatShading: true }),
      canopyRed: new THREE.MeshPhongMaterial({ color: 0xb71c1c, flatShading: true }),
      scooterBlue: new THREE.MeshPhongMaterial({ color: 0x0d47a1, flatShading: true }),
      scooterSeat: new THREE.MeshPhongMaterial({ color: 0x212121, flatShading: true }),
      autoParkedGreen: new THREE.MeshPhongMaterial({ color: 0x007f3f, flatShading: true }),
      autoParkedYellow: new THREE.MeshPhongMaterial({ color: 0xffd700, flatShading: true })
    };
  }

  // Neon text sign dynamic texture
  createNeonSignTexture(text, color) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    // Fill black background
    ctx.fillStyle = '#0a0a14';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Glowing border
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);

    // Shadow setup for neon glow effect
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;

    // Draw secondary border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(6, 6, canvas.width - 12, canvas.height - 12);

    // Text details
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 22px "Outfit", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    return texture;
  }

  // Create localized poster textures for buildings (political, movie, commercial)
  createPosterTexture(cityLevel, type) {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 192; // 2:3 aspect ratio
    const ctx = canvas.getContext('2d');

    // Random background colors
    const bgColors = {
      political: ['#ff9933', '#e0f7fa', '#ffe0b2', '#e8f5e9'],
      movie: ['#ffebee', '#f3e5f5', '#efebe9', '#eceff1', '#ffe082'],
      commercial: ['#e3f2fd', '#fffde7', '#f1f8e9', '#fff3e0']
    };

    const colors = bgColors[type] || bgColors.commercial;
    const bgColor = colors[Math.floor(Math.random() * colors.length)];
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Border
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);

    if (type === 'political') {
      // Saffron top, Green bottom bands
      ctx.fillStyle = '#ff9933';
      ctx.fillRect(4, 4, canvas.width - 8, 30);
      ctx.fillStyle = '#138808';
      ctx.fillRect(4, canvas.height - 34, canvas.width - 8, 30);

      // Politician silhouette
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2 - 10, 24, 0, Math.PI * 2);
      ctx.fillStyle = '#78909c';
      ctx.fill();
      
      ctx.beginPath();
      ctx.ellipse(canvas.width / 2, canvas.height / 2 + 25, 28, 18, 0, 0, Math.PI, true);
      ctx.fillStyle = '#546e7a';
      ctx.fill();

      ctx.fillStyle = '#000000';
      ctx.textAlign = 'center';

      const slogans = {
        1: ["भावी आमदार", "महोत्सव २०२६"],
        2: ["युवा नेता", "चुनाव चिह्न"],
        3: ["आमदार चषक", "पुणे विकास"],
        4: ["ನಮ್ಮ ನಾಯಕ", "ಯುವ ಮೋರ್ಚಾ"]
      };

      const citySlogans = slogans[cityLevel] || slogans[1];
      ctx.font = 'bold 12px "Outfit", Arial, sans-serif';
      ctx.fillText(citySlogans[0], canvas.width / 2, canvas.height / 2 + 42);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px "Outfit", Arial, sans-serif';
      ctx.fillText(citySlogans[1], canvas.width / 2, 22);
      ctx.fillText("VOTE", canvas.width / 2, canvas.height - 15);
    } 
    else if (type === 'movie') {
      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, '#ff4081');
      grad.addColorStop(1, '#3f51b5');
      ctx.fillStyle = grad;
      ctx.fillRect(4, 4, canvas.width - 8, canvas.height - 8);

      ctx.fillStyle = 'rgba(255, 235, 59, 0.4)';
      ctx.beginPath();
      ctx.arc(canvas.width / 2, 70, 38, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';

      const movieNames = {
        1: ["लय भारी", "सैराट", "सिनेमा"],
        2: ["शोले", "दंगल", "सिंघम"],
        3: ["पुणेरी", "नखरा", "चित्रपट"],
        4: ["ಕೆ ಜಿ ಎಫ್", "ಕಾಂತಾರ", "ಸಿನಿಮಾ"]
      };

      const list = movieNames[cityLevel] || movieNames[1];
      ctx.font = '900 16px "Outfit", Arial, sans-serif';
      ctx.fillText(list[0], canvas.width / 2, 68);
      ctx.font = '900 13px "Outfit", Arial, sans-serif';
      ctx.fillText(list[1], canvas.width / 2, 92);

      ctx.fillStyle = '#ffeb3b';
      ctx.font = '13px Arial';
      ctx.fillText("★★★★★", canvas.width / 2, canvas.height - 25);
    } 
    else {
      ctx.fillStyle = '#ffeb3b';
      ctx.fillRect(4, 4, canvas.width - 8, 40);

      ctx.fillStyle = '#000000';
      ctx.textAlign = 'center';

      const ads = {
        1: ["गरमा गरम", "वडा पाव", "फक्त ₹१०"],
        2: ["मसाला चाय", "दिल्ली स्पेशल", "समोसा"],
        3: ["सुप्रसिद्ध", "पुणेरी मिसळ", "झणझणीत"],
        4: ["ಬಿಸಿ ಕಾಫಿ", "ಬೆಂಗಳೂರು", "ರುಚಿಕರ"]
      };

      const list = ads[cityLevel] || ads[1];
      ctx.font = 'bold 12px "Outfit", Arial, sans-serif';
      ctx.fillText(list[0], canvas.width / 2, 28);
      ctx.fillText(list[1], canvas.width / 2, 90);
      ctx.font = 'bold 11px "Outfit", Arial, sans-serif';
      ctx.fillText(list[2], canvas.width / 2, 130);

      ctx.fillStyle = '#d32f2f';
      ctx.fillRect(15, canvas.height - 35, canvas.width - 30, 20);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px "Outfit", Arial, sans-serif';
      ctx.fillText("BUY NOW", canvas.width / 2, canvas.height - 22);
    }

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
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
    ctx.fillRect(0, stripeY, canvas.width, stripeHeight);

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

  createSegment(zPos) {
    const segment = new THREE.Group();
    segment.position.z = zPos;

    // 1. Road base
    const roadGeom = new THREE.BoxGeometry(this.roadWidth, 0.4, this.segmentLength);
    const roadMesh = new THREE.Mesh(roadGeom, this.materials.road);
    roadMesh.position.y = -0.2;
    roadMesh.receiveShadow = true;
    segment.add(roadMesh);

    // 2. Road Lane Dividers (two dotted lines separating the 3 lanes)
    const laneWidth = this.roadWidth / 3; // 4 units
    const dividerGeom = new THREE.BoxGeometry(0.12, 0.05, 4);

    for (let l = 1; l <= 2; l++) {
      const xPos = -this.roadWidth / 2 + l * laneWidth;
      // Spawn dotted markers
      for (let zOffset = -this.segmentLength / 2 + 2; zOffset < this.segmentLength / 2; zOffset += 8) {
        const marker = new THREE.Mesh(dividerGeom, this.materials.divider);
        marker.position.set(xPos, 0.02, zOffset);
        segment.add(marker);
      }
    }

    // 3. Sidewalks (Left and Right)
    const walkWidth = 4;
    const walkHeight = 0.5;
    const sidewalkGeom = new THREE.BoxGeometry(walkWidth, walkHeight, this.segmentLength);
    
    // Left Sidewalk
    const leftWalk = new THREE.Mesh(sidewalkGeom, this.materials.sidewalk);
    leftWalk.position.set(-this.roadWidth / 2 - walkWidth / 2, walkHeight / 2 - 0.2, 0);
    leftWalk.receiveShadow = true;
    segment.add(leftWalk);

    // Right Sidewalk
    const rightWalk = new THREE.Mesh(sidewalkGeom, this.materials.sidewalk);
    rightWalk.position.set(this.roadWidth / 2 + walkWidth / 2, walkHeight / 2 - 0.2, 0);
    rightWalk.receiveShadow = true;
    segment.add(rightWalk);

    // 4. Zebra Painted Curb Stones (Bordering the road)
    const curbLength = 2.5;
    const curbGeom = new THREE.BoxGeometry(0.3, 0.3, curbLength);
    const numCurbs = Math.ceil(this.segmentLength / curbLength);

    for (let side = -1; side <= 1; side += 2) {
      const xCurb = side * (this.roadWidth / 2 + 0.15);
      for (let c = 0; c < numCurbs; c++) {
        const zCurb = -this.segmentLength / 2 + (c * curbLength) + curbLength / 2;
        const mat = (c % 2 === 0) ? this.materials.curbBlack : this.materials.curbWhite;
        const curb = new THREE.Mesh(curbGeom, mat);
        curb.position.set(xCurb, walkHeight - 0.2, zCurb);
        curb.receiveShadow = true;
        segment.add(curb);
      }
    }

    // 5. Buildings Facades (procedural per level)
    this.addBuildingsToSegment(segment);

    // 6. Add Street Props (lamp post, signboards)
    this.addPropsToSegment(segment);

    return segment;
  }

  addBuildingsToSegment(segment) {
    const buildWidth = 5;
    const zOffset = 0;

    // Spawn 1 building on left, 1 building on right
    for (let side = -1; side <= 1; side += 2) {
      const xPos = side * (this.roadWidth / 2 + 6.5); // sidewalk + building clearance
      const buildingGroup = new THREE.Group();
      buildingGroup.position.set(xPos, 0, zOffset);

      // Random Height & Color for variety
      const buildHeight = 10 + Math.random() * 12;
      const seedColor = this.getBuildingColor();
      const buildingMat = new THREE.MeshPhongMaterial({ color: seedColor, flatShading: true });

      // Core Box Structure
      const coreGeom = new THREE.BoxGeometry(buildWidth, buildHeight, this.segmentLength - 2);
      const core = new THREE.Mesh(coreGeom, buildingMat);
      core.position.y = buildHeight / 2;
      core.castShadow = true;
      core.receiveShadow = true;
      buildingGroup.add(core);

      // Distinct architecture details based on city levels
      if (this.cityLevel === 1) {
        // MUMBAI: Chawl-inspired with overlapping corrugated corrugated panels or balconies
        const numFloors = Math.floor(buildHeight / 3);
        const balconyGeom = new THREE.BoxGeometry(buildWidth - 0.5, 0.15, 1.8);
        const balconyMat = new THREE.MeshPhongMaterial({ color: 0x8b5a2b });
        for (let f = 1; f < numFloors; f++) {
          const balcony = new THREE.Mesh(balconyGeom, balconyMat);
          balcony.position.set(-side * 0.4, f * 3, 0);
          buildingGroup.add(balcony);

          // Add a blue tarp sheet (very Mumbai!)
          if (f === numFloors - 1 && Math.random() > 0.4) {
            const tarpGeom = new THREE.BoxGeometry(buildWidth + 0.1, 0.8, 2.0);
            const tarpMat = new THREE.MeshPhongMaterial({ color: 0x0033cc });
            const tarp = new THREE.Mesh(tarpGeom, tarpMat);
            tarp.position.set(0, f * 3 + 1, 0);
            buildingGroup.add(tarp);
          }
        }
      } else if (this.cityLevel === 2) {
        // DELHI: Traditional Havelis style with red sandstone arches & rounded structures
        const archGeom = new THREE.CylinderGeometry(0.8, 0.8, 1.2, 8);
        const archMat = new THREE.MeshPhongMaterial({ color: 0x8B3E2F });
        
        // Spawn small ornamental arches on front face
        const numRows = Math.floor(buildHeight / 4);
        for (let r = 1; r < numRows; r++) {
          for (let z = -6; z <= 6; z += 6) {
            const arch = new THREE.Mesh(archGeom, archMat);
            arch.rotation.x = Math.PI / 2;
            arch.position.set(-side * (buildWidth / 2 + 0.1), r * 4, z);
            buildingGroup.add(arch);
          }
        }
      } else if (this.cityLevel === 3) {
        // PUNE: Slanted terracotta tiled roof
        const roofGeom = new THREE.ConeGeometry(3.5, 2.5, 4);
        const roofMat = new THREE.MeshPhongMaterial({ color: 0xbf360c });
        const roof = new THREE.Mesh(roofGeom, roofMat);
        roof.rotation.y = Math.PI / 4;
        roof.position.set(0, buildHeight + 1.25, 0);
        buildingGroup.add(roof);
      } else if (this.cityLevel === 4) {
        // BANGALORE: Modern tech center glass panels & stripes
        const glassStripGeom = new THREE.BoxGeometry(0.1, buildHeight - 2, 4);
        const stripe = new THREE.Mesh(glassStripGeom, this.materials.buildingGlass);
        stripe.position.set(-side * (buildWidth / 2 + 0.05), buildHeight / 2, 0);
        buildingGroup.add(stripe);

        // Neon vertical lights
        const neonGeom = new THREE.BoxGeometry(0.08, buildHeight, 0.1);
        const neonMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
        const neonBar = new THREE.Mesh(neonGeom, neonMat);
        neonBar.position.set(-side * (buildWidth / 2 + 0.08), buildHeight / 2, 3);
        buildingGroup.add(neonBar);
      }

      segment.add(buildingGroup);

      // Spawn flat posters on building wall at eye level (added to segment to avoid scale.y distortion)
      const numPosters = 1 + Math.floor(Math.random() * 2);
      const posterGeom = new THREE.PlaneGeometry(1.6, 2.4);
      const posterTypes = ['political', 'movie', 'commercial'];

      for (let p = 0; p < numPosters; p++) {
        const zPos = (Math.random() - 0.5) * (this.segmentLength - 10);
        const yPos = 1.2 + Math.random() * 2.0;

        const type = posterTypes[Math.floor(Math.random() * posterTypes.length)];
        const posterTex = this.createPosterTexture(this.cityLevel, type);
        const posterMat = new THREE.MeshBasicMaterial({
          map: posterTex,
          side: THREE.DoubleSide,
          transparent: true
        });

        const poster = new THREE.Mesh(posterGeom, posterMat);
        poster.name = "poster";
        
        // Wall face is at side * 10
        const xPos = side * 9.97;
        poster.position.set(xPos, yPos, zPos);
        
        // Rotate to face the road
        poster.rotation.y = (side < 0) ? Math.PI / 2 : -Math.PI / 2;
        
        segment.add(poster);
      }
    }
  }

  getBuildingColor() {
    // Return palette matching the city
    if (this.cityLevel === 1) {
      // Mumbai: Pale yellow, blue, turquoise, colonial pink
      const colors = [0xdfcfb7, 0x5a8fb2, 0xc19b88, 0x546e7a];
      return colors[Math.floor(Math.random() * colors.length)];
    } else if (this.cityLevel === 2) {
      // Delhi: Red sandstone, yellow clay, beige
      const colors = [0xa75d4d, 0x8b3e2f, 0xc2a679, 0x8c6d58];
      return colors[Math.floor(Math.random() * colors.length)];
    } else if (this.cityLevel === 3) {
      // Pune: Cream, pastel peach, light green, traditional woods
      const colors = [0xefebe9, 0xffccbc, 0xc8e6c9, 0xbcaaa4];
      return colors[Math.floor(Math.random() * colors.length)];
    } else {
      // Bangalore: Steel blue, dark grey, cyan glass, white
      const colors = [0x263238, 0x37474f, 0x0d47a1, 0xe0e0e0];
      return colors[Math.floor(Math.random() * colors.length)];
    }
  }

  // Roadside stall helper creators
  createChaiStall() {
    const stall = new THREE.Group();
    
    // Wooden Table
    const tableGeom = new THREE.BoxGeometry(1.5, 0.8, 1.0);
    const table = new THREE.Mesh(tableGeom, this.materials.wood);
    table.position.y = 0.4;
    table.castShadow = true;
    stall.add(table);

    // Kettle on table
    const kettleGeom = new THREE.CylinderGeometry(0.15, 0.15, 0.3, 6);
    const kettle = new THREE.Mesh(kettleGeom, this.materials.metal);
    kettle.position.set(-0.3, 0.95, 0.1);
    kettle.castShadow = true;
    stall.add(kettle);

    // Kettle Spout
    const spoutGeom = new THREE.CylinderGeometry(0.03, 0.03, 0.12, 4);
    const spout = new THREE.Mesh(spoutGeom, this.materials.metal);
    spout.rotation.z = -Math.PI / 4;
    spout.position.set(-0.16, 1.0, 0.1);
    stall.add(spout);

    // Kettle Handle
    const handleGeom = new THREE.BoxGeometry(0.04, 0.15, 0.25);
    const handle = new THREE.Mesh(handleGeom, this.materials.pole);
    handle.position.set(-0.3, 1.15, 0.1);
    stall.add(handle);

    // Gas cylinder beside table
    const gasGeom = new THREE.CylinderGeometry(0.2, 0.2, 0.55, 6);
    const gas = new THREE.Mesh(gasGeom, this.materials.gasBlue);
    gas.position.set(0.6, 0.275, -0.15);
    gas.castShadow = true;
    stall.add(gas);

    const gasVal = new THREE.CylinderGeometry(0.08, 0.08, 0.08, 4);
    const valve = new THREE.Mesh(gasVal, this.materials.pole);
    valve.position.set(0.6, 0.59, -0.15);
    stall.add(valve);

    // Chai glasses tray
    const trayGeom = new THREE.BoxGeometry(0.4, 0.06, 0.4);
    const tray = new THREE.Mesh(trayGeom, this.materials.metal);
    tray.position.set(0.2, 0.83, 0.1);
    stall.add(tray);

    const glassGeom = new THREE.CylinderGeometry(0.04, 0.03, 0.12, 4);
    const glassPositions = [
      [0.1, 0.92, 0.0], [0.3, 0.92, 0.0],
      [0.1, 0.92, 0.2], [0.3, 0.92, 0.2]
    ];
    glassPositions.forEach(pos => {
      const g = new THREE.Mesh(glassGeom, this.materials.buildingGlass);
      g.position.set(pos[0], pos[1], pos[2]);
      stall.add(g);
    });

    return stall;
  }

  createVegetableCart() {
    const cart = new THREE.Group();

    // Flat bed
    const bedGeom = new THREE.BoxGeometry(1.3, 0.12, 1.8);
    const bed = new THREE.Mesh(bedGeom, this.materials.wood);
    bed.position.y = 0.46;
    bed.castShadow = true;
    cart.add(bed);

    // Handlebar frame
    const frameGeom = new THREE.BoxGeometry(1.26, 0.08, 0.08);
    const f1 = new THREE.Mesh(frameGeom, this.materials.wood);
    f1.position.set(0, 0.52, 0.85);
    cart.add(f1);

    const f2 = new THREE.Mesh(frameGeom, this.materials.wood);
    f2.position.set(0, 0.52, -0.85);
    cart.add(f2);

    // Four small wooden spoked wheels
    const wheelGeom = new THREE.CylinderGeometry(0.22, 0.22, 0.08, 6);
    const wheelPos = [
      [-0.7, 0.22, 0.6], [0.7, 0.22, 0.6],
      [-0.7, 0.22, -0.6], [0.7, 0.22, -0.6]
    ];
    wheelPos.forEach(pos => {
      const w = new THREE.Mesh(wheelGeom, this.materials.curbBlack);
      w.rotation.z = Math.PI / 2;
      w.position.set(pos[0], pos[1], pos[2]);
      w.castShadow = true;
      cart.add(w);
    });

    // Crate boxes of vegetables
    const crateGeom = new THREE.BoxGeometry(0.48, 0.25, 0.52);
    
    const tomatoCrate = new THREE.Mesh(crateGeom, this.materials.vegRed);
    tomatoCrate.position.set(-0.32, 0.62, 0.35);
    cart.add(tomatoCrate);

    const spinachCrate = new THREE.Mesh(crateGeom, this.materials.vegGreen);
    spinachCrate.position.set(0.32, 0.62, 0.35);
    cart.add(spinachCrate);

    const potatoCrate = new THREE.Mesh(crateGeom, this.materials.vegYellow);
    potatoCrate.position.set(-0.32, 0.62, -0.35);
    cart.add(potatoCrate);

    const onionCrate = new THREE.Mesh(crateGeom, this.materials.wood);
    onionCrate.position.set(0.32, 0.62, -0.35);
    cart.add(onionCrate);

    return cart;
  }

  createFoodCart() {
    const cart = new THREE.Group();

    // Base metal cabinet
    const cabGeom = new THREE.BoxGeometry(1.2, 0.9, 1.8);
    const cabinet = new THREE.Mesh(cabGeom, this.materials.metal);
    cabinet.position.y = 0.55;
    cabinet.castShadow = true;
    cart.add(cabinet);

    // Two big side cart wheels
    const wheelGeom = new THREE.CylinderGeometry(0.38, 0.38, 0.08, 8);
    
    const w1 = new THREE.Mesh(wheelGeom, this.materials.curbBlack);
    w1.rotation.z = Math.PI / 2;
    w1.position.set(-0.64, 0.38, 0);
    w1.castShadow = true;
    cart.add(w1);

    const w2 = new THREE.Mesh(wheelGeom, this.materials.curbBlack);
    w2.rotation.z = Math.PI / 2;
    w2.position.set(0.64, 0.38, 0);
    w2.castShadow = true;
    cart.add(w2);

    // 4 Support rods for canopy
    const rodGeom = new THREE.CylinderGeometry(0.04, 0.04, 1.2, 4);
    const rodPos = [
      [-0.56, 1.5, 0.8], [0.56, 1.5, 0.8],
      [-0.56, 1.5, -0.8], [0.56, 1.5, -0.8]
    ];
    rodPos.forEach(pos => {
      const rod = new THREE.Mesh(rodGeom, this.materials.pole);
      rod.position.set(pos[0], pos[1], pos[2]);
      cart.add(rod);
    });

    // Canopy
    const canopyGeom = new THREE.BoxGeometry(1.4, 0.08, 2.0);
    const canopy = new THREE.Mesh(canopyGeom, this.materials.canopyRed);
    canopy.position.set(0, 2.1, 0);
    canopy.rotation.x = 0.08;
    canopy.castShadow = true;
    cart.add(canopy);

    // Large wok/pan (Tawa) on counter
    const wokGeom = new THREE.CylinderGeometry(0.3, 0.35, 0.06, 8);
    const wok = new THREE.Mesh(wokGeom, this.materials.pole);
    wok.position.set(0, 1.03, 0.4);
    cart.add(wok);

    // Glass counter cover
    const glassGeom = new THREE.BoxGeometry(1.0, 0.4, 0.7);
    const cover = new THREE.Mesh(glassGeom, this.materials.glass);
    cover.position.set(0, 1.2, -0.4);
    cart.add(cover);

    return cart;
  }

  createParkedScooter() {
    const scooter = new THREE.Group();

    // Main colored chassis
    const bodyGeom = new THREE.BoxGeometry(0.26, 0.5, 1.2);
    const body = new THREE.Mesh(bodyGeom, this.materials.scooterBlue);
    body.position.y = 0.45;
    body.castShadow = true;
    scooter.add(body);

    // Shield front panel
    const shieldGeom = new THREE.BoxGeometry(0.28, 0.7, 0.15);
    const shield = new THREE.Mesh(shieldGeom, this.materials.scooterBlue);
    shield.position.set(0, 0.65, 0.45);
    shield.castShadow = true;
    scooter.add(shield);

    // Front mudguard
    const guardGeom = new THREE.BoxGeometry(0.22, 0.25, 0.3);
    const guard = new THREE.Mesh(guardGeom, this.materials.scooterBlue);
    guard.position.set(0, 0.25, 0.55);
    scooter.add(guard);

    // Wheels
    const wheelGeom = new THREE.CylinderGeometry(0.22, 0.22, 0.12, 6);
    
    const frontWheel = new THREE.Mesh(wheelGeom, this.materials.curbBlack);
    frontWheel.rotation.z = Math.PI / 2;
    frontWheel.position.set(0, 0.22, 0.5);
    scooter.add(frontWheel);

    const backWheel = new THREE.Mesh(wheelGeom, this.materials.curbBlack);
    backWheel.rotation.z = Math.PI / 2;
    backWheel.position.set(0, 0.22, -0.42);
    scooter.add(backWheel);

    // Seat
    const seatGeom = new THREE.BoxGeometry(0.24, 0.08, 0.65);
    const seat = new THREE.Mesh(seatGeom, this.materials.scooterSeat);
    seat.position.set(0, 0.74, -0.15);
    scooter.add(seat);

    // Handlebars
    const barGeom = new THREE.CylinderGeometry(0.04, 0.04, 0.6, 4);
    const bar = new THREE.Mesh(barGeom, this.materials.pole);
    bar.rotation.z = Math.PI / 2;
    bar.position.set(0, 0.96, 0.4);
    scooter.add(bar);

    // Headlight
    const lightGeom = new THREE.SphereGeometry(0.08, 6, 6);
    const light = new THREE.Mesh(lightGeom, this.materials.lampGlow);
    light.position.set(0, 0.96, 0.48);
    scooter.add(light);

    // Tilt and pivot to look parked on side stand
    scooter.rotation.z = -0.12;
    scooter.rotation.y = Math.PI / 2.5;
    scooter.position.y = 0.05;

    return scooter;
  }

  createParkedAuto() {
    const auto = new THREE.Group();

    // Simplified Auto rickshaw for roadside filler
    const bodyGeom = new THREE.BoxGeometry(1.1, 0.8, 1.8);
    const body = new THREE.Mesh(bodyGeom, this.materials.autoParkedGreen);
    body.position.y = 0.75;
    body.castShadow = true;
    auto.add(body);

    const roofGeom = new THREE.BoxGeometry(1.0, 0.6, 1.5);
    const roof = new THREE.Mesh(roofGeom, this.materials.autoParkedYellow);
    roof.position.set(0, 1.45, -0.15);
    roof.castShadow = true;
    auto.add(roof);

    const wheelGeom = new THREE.CylinderGeometry(0.3, 0.3, 0.25, 6);
    
    const fWheel = new THREE.Mesh(wheelGeom, this.materials.curbBlack);
    fWheel.rotation.z = Math.PI / 2;
    fWheel.position.set(0, 0.3, 0.7);
    auto.add(fWheel);

    const bWheelL = new THREE.Mesh(wheelGeom, this.materials.curbBlack);
    bWheelL.rotation.z = Math.PI / 2;
    bWheelL.position.set(-0.54, 0.3, -0.5);
    auto.add(bWheelL);

    const bWheelR = new THREE.Mesh(wheelGeom, this.materials.curbBlack);
    bWheelR.rotation.z = Math.PI / 2;
    bWheelR.position.set(0.54, 0.3, -0.5);
    auto.add(bWheelR);

    // Dynamic ad plate on the back panel
    const adTexture = this.createRickshawAdTexture(this.cityLevel);
    const adGeom = new THREE.BoxGeometry(0.75, 0.38, 0.02);
    const adMat = new THREE.MeshBasicMaterial({ map: adTexture });
    const adPlate = new THREE.Mesh(adGeom, adMat);
    adPlate.name = "rickshawAd";
    adPlate.position.set(0, 0.75, -0.91); // back of body box (depth 1.8 / 2 = 0.9)
    auto.add(adPlate);

    auto.rotation.y = -Math.PI / 6;

    return auto;
  }

  addPropsToSegment(segment) {
    const side = (Math.random() > 0.5) ? 1 : -1; // pick one side for shop signs
    const xPos = side * (this.roadWidth / 2 + 1.5); // sidewalk center

    // 1. Neon shop signboards on the sidewalk
    const signGroup = new THREE.Group();
    signGroup.position.set(xPos, 4.5, 0);

    // Signboard backing
    const boardGeom = new THREE.BoxGeometry(0.3, 1.2, 3.2);
    const boardBackMat = new THREE.MeshPhongMaterial({ color: 0x22222b });
    const boardBack = new THREE.Mesh(boardGeom, boardBackMat);
    signGroup.add(boardBack);

    // Support pole
    const supportGeom = new THREE.CylinderGeometry(0.08, 0.08, 3.5);
    const support = new THREE.Mesh(supportGeom, this.materials.pole);
    support.position.set(0, -1.75, 0);
    signGroup.add(support);

    // Dynamically draw Indian shop text
    const names = SHOP_NAMES[this.cityLevel] || SHOP_NAMES[1];
    const name = names[Math.floor(Math.random() * names.length)];
    const color = SHOP_COLORS[Math.floor(Math.random() * SHOP_COLORS.length)];
    const neonTexture = this.createNeonSignTexture(name, color);

    const screenGeom = new THREE.BoxGeometry(0.32, 1.0, 3.0);
    const screenMat = new THREE.MeshBasicMaterial({ map: neonTexture });
    const screen = new THREE.Mesh(screenGeom, screenMat);
    screen.name = "neonSign";
    signGroup.add(screen);

    segment.add(signGroup);

    // 2. Volumetric Streetlamp (only on opposite side or alternate chunks)
    const lampSide = -side;
    const xlamp = lampSide * (this.roadWidth / 2 + 3.8); // sidewalk edge

    const lampGroup = new THREE.Group();
    lampGroup.position.set(xlamp, 0, -8);

    const poleGeom = new THREE.CylinderGeometry(0.12, 0.18, 7.5, 6);
    const lampPole = new THREE.Mesh(poleGeom, this.materials.pole);
    lampPole.position.y = 3.75;
    lampGroup.add(lampPole);

    // Arm leaning over road
    const armGeom = new THREE.BoxGeometry(1.6, 0.15, 0.15);
    const arm = new THREE.Mesh(armGeom, this.materials.pole);
    arm.position.set(-lampSide * 0.7, 7.4, 0);
    lampGroup.add(arm);

    // Light fixture box
    const fixtureGeom = new THREE.BoxGeometry(0.6, 0.3, 0.6);
    const fixture = new THREE.Mesh(fixtureGeom, this.materials.pole);
    fixture.position.set(-lampSide * 1.4, 7.25, 0);
    lampGroup.add(fixture);

    // Glowing bulb bulb
    const bulbGeom = new THREE.SphereGeometry(0.2, 6, 6);
    const bulb = new THREE.Mesh(bulbGeom, this.materials.lampGlow);
    bulb.position.set(-lampSide * 1.4, 7.05, 0);
    lampGroup.add(bulb);

    // Light cone (Volumetric light effect)
    const coneGeom = new THREE.CylinderGeometry(0.2, 3.8, 7.0, 16, 1, true);
    const cone = new THREE.Mesh(coneGeom, this.materials.coneLight);
    cone.position.set(-lampSide * 1.4, 3.55, 0);
    // Open cylinders render with top at Y center, tilt bottom down
    lampGroup.add(cone);

    segment.add(lampGroup);

    // 3. Roadside Stalls (Chai tapri, Sabzi Cart, or Street Food Cart)
    // Placed at Z = 8 on the sign side sidewalk
    const xStall = side * (this.roadWidth / 2 + 1.8);
    const stallType = Math.floor(Math.random() * 3);
    let stallMesh;
    if (stallType === 0) {
      stallMesh = this.createChaiStall();
    } else if (stallType === 1) {
      stallMesh = this.createVegetableCart();
    } else {
      stallMesh = this.createFoodCart();
    }
    stallMesh.position.set(xStall, 0, 8);
    // Orient stall to face the street
    stallMesh.rotation.y = (side > 0) ? -Math.PI / 2 : Math.PI / 2;
    segment.add(stallMesh);

    // 4. Parked Vehicles (Scooters or Parked Autos)
    // Placed at Z = -3 on the streetlight side sidewalk
    const xVehicle = lampSide * (this.roadWidth / 2 + 1.6);
    const vehicleType = Math.floor(Math.random() * 2);
    let vehicleMesh;
    if (vehicleType === 0) {
      vehicleMesh = this.createParkedScooter();
    } else {
      vehicleMesh = this.createParkedAuto();
    }
    vehicleMesh.position.set(xVehicle, 0, -3);
    // Angle them parked facing street directions
    vehicleMesh.rotation.y += (lampSide > 0) ? Math.PI : 0;
    segment.add(vehicleMesh);
  }

  update(dt, speed) {
    this.speed = speed;

    // Move all active segments toward Z+
    for (let i = 0; i < this.segments.length; i++) {
      const segment = this.segments[i];
      segment.position.z += speed * dt;

      // Recycle segment when it moves past the camera
      if (segment.position.z > 35) {
        // Find the lowest Z in our segment array to place it behind the furthest segment
        let minZ = 0;
        for (let j = 0; j < this.segments.length; j++) {
          if (this.segments[j].position.z < minZ) {
            minZ = this.segments[j].position.z;
          }
        }
        
        // Reposition segment
        segment.position.z = minZ - this.segmentLength;

        // Scramble visual properties to prevent repetitive visual pattern
        this.scrambleSegmentVisuals(segment);
      }
    }
  }

  scrambleSegmentVisuals(segment) {
    // Traverse building elements and modify heights & colors slightly
    segment.traverse((child) => {
      if (child.name === "buildingGroup") {
        // Slightly vary height scale
        const s = 0.85 + Math.random() * 0.3;
        child.scale.y = s;
      }
      
      // Update neon shop signboards
      if (child.name === "neonSign" && child.material && child.material.map) {
        const names = SHOP_NAMES[this.cityLevel] || SHOP_NAMES[1];
        const name = names[Math.floor(Math.random() * names.length)];
        const color = SHOP_COLORS[Math.floor(Math.random() * SHOP_COLORS.length)];
        
        child.material.map.dispose();
        child.material.map = this.createNeonSignTexture(name, color);
        child.material.needsUpdate = true;
      }

      // Update posters on the walls
      if (child.name === "poster" && child.material && child.material.map) {
        const posterTypes = ['political', 'movie', 'commercial'];
        const type = posterTypes[Math.floor(Math.random() * posterTypes.length)];
        
        child.material.map.dispose();
        child.material.map = this.createPosterTexture(this.cityLevel, type);
        child.material.needsUpdate = true;
      }

      // Update ads behind parked rickshaws
      if (child.name === "rickshawAd" && child.material && child.material.map) {
        child.material.map.dispose();
        child.material.map = this.createRickshawAdTexture(this.cityLevel);
        child.material.needsUpdate = true;
      }
    });
  }

  destroy() {
    this.segments.forEach((seg) => {
      seg.traverse((child) => {
        if (child.isMesh) {
          child.geometry.dispose();
          if (child.material.map) child.material.map.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
      this.scene.remove(seg);
    });
    this.segments = [];
  }
}
