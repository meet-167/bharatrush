import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { sound } from './SoundManager.js';

export class Player {
  constructor(scene) {
    this.scene = scene;
    this.mesh = new THREE.Group();

    // Player position parameters
    this.lanes = [-4, 0, 4]; // Left, Center, Right lanes
    this.currentLane = 1; // Start in Center lane
    this.targetX = this.lanes[this.currentLane];
    this.currentX = 0;
    this.currentY = 0;

    // Movement states
    this.isJumping = false;
    this.jumpTime = 0;
    this.jumpDuration = 0.65; // seconds
    this.jumpHeight = 3.8;

    this.isSliding = false;
    this.slideTime = 0;
    this.slideDuration = 0.65; // seconds

    this.isDead = false;
    this.deathAnimTime = 0;

    // Collision box
    this.box = new THREE.Box3();
    this.boxHelper = null; // for debugging (optional)

    // Build the 3D Character
    this.createPlayerMesh();
    this.scene.add(this.mesh);

    // Bind controls
    this.setupControls();
  }

  createPlayerMesh() {
    // Styling Colors
    const skinMat = new THREE.MeshPhongMaterial({ color: 0xffdbac, flatShading: true }); // Skin tone
    const shirtMat = new THREE.MeshPhongMaterial({ color: 0xff7300, flatShading: true }); // Saffron hoodie
    const pantsMat = new THREE.MeshPhongMaterial({ color: 0x111122, flatShading: true }); // Dark pants
    const shoeMat = new THREE.MeshPhongMaterial({ color: 0xffffff, flatShading: true }); // White sneakers
    const capMat = new THREE.MeshPhongMaterial({ color: 0x00f0ff, flatShading: true }); // Cyan cap
    const capVisorMat = new THREE.MeshPhongMaterial({ color: 0x00a0cc, flatShading: true });
    const hairMat = new THREE.MeshPhongMaterial({ color: 0x221100, flatShading: true });

    // Torso (Hoodie)
    const torsoGeom = new THREE.BoxGeometry(1.2, 1.6, 0.8);
    this.torso = new THREE.Mesh(torsoGeom, shirtMat);
    this.torso.position.y = 2.1;
    this.torso.castShadow = true;
    this.mesh.add(this.torso);

    // Head
    const headGeom = new THREE.BoxGeometry(0.8, 0.8, 0.8);
    this.head = new THREE.Mesh(headGeom, skinMat);
    this.head.position.y = 1.3; // Relative to torso center
    this.head.castShadow = true;
    this.torso.add(this.head);

    // Cap
    const capGeom = new THREE.BoxGeometry(0.85, 0.25, 0.85);
    this.cap = new THREE.Mesh(capGeom, capMat);
    this.cap.position.y = 0.45;
    this.head.add(this.cap);

    const visorGeom = new THREE.BoxGeometry(0.8, 0.05, 0.4);
    this.visor = new THREE.Mesh(visorGeom, capVisorMat);
    this.visor.position.set(0, 0.3, 0.45);
    this.head.add(this.visor);

    // Face elements (Stylized Glasses / Visor)
    const glassesGeom = new THREE.BoxGeometry(0.85, 0.2, 0.1);
    const glassesMat = new THREE.MeshPhongMaterial({ color: 0x111111, shininess: 100 });
    const glasses = new THREE.Mesh(glassesGeom, glassesMat);
    glasses.position.set(0, 0.1, 0.4);
    this.head.add(glasses);

    // Hair (Back of head)
    const hairGeom = new THREE.BoxGeometry(0.82, 0.4, 0.2);
    const hair = new THREE.Mesh(hairGeom, hairMat);
    hair.position.set(0, -0.1, -0.32);
    this.head.add(hair);

    // Legs (Pivot Groups for Running Animation)
    const legGeom = new THREE.BoxGeometry(0.4, 1.0, 0.4);

    this.leftLegPivot = new THREE.Group();
    this.leftLegPivot.position.set(-0.35, -0.8, 0); // Pivot at hip
    this.torso.add(this.leftLegPivot);

    const leftLeg = new THREE.Mesh(legGeom, pantsMat);
    leftLeg.position.y = -0.5; // Offset geometry center
    leftLeg.castShadow = true;
    this.leftLegPivot.add(leftLeg);

    const leftShoeGeom = new THREE.BoxGeometry(0.44, 0.25, 0.65);
    const leftShoe = new THREE.Mesh(leftShoeGeom, shoeMat);
    leftShoe.position.set(0, -1.0, 0.1);
    leftShoe.castShadow = true;
    this.leftLegPivot.add(leftShoe);

    this.rightLegPivot = new THREE.Group();
    this.rightLegPivot.position.set(0.35, -0.8, 0); // Pivot at hip
    this.torso.add(this.rightLegPivot);

    const rightLeg = new THREE.Mesh(legGeom, pantsMat);
    rightLeg.position.y = -0.5;
    rightLeg.castShadow = true;
    this.rightLegPivot.add(rightLeg);

    const rightShoe = new THREE.Mesh(leftShoeGeom, shoeMat);
    rightShoe.position.set(0, -1.0, 0.1);
    rightShoe.castShadow = true;
    this.rightLegPivot.add(rightShoe);

    // Arms
    const armGeom = new THREE.BoxGeometry(0.3, 1.1, 0.3);

    this.leftArmPivot = new THREE.Group();
    this.leftArmPivot.position.set(-0.75, 0.6, 0); // Pivot at shoulder
    this.torso.add(this.leftArmPivot);

    const leftArm = new THREE.Mesh(armGeom, shirtMat);
    leftArm.position.y = -0.55;
    leftArm.castShadow = true;
    this.leftArmPivot.add(leftArm);

    const leftHandGeom = new THREE.BoxGeometry(0.32, 0.2, 0.32);
    const leftHand = new THREE.Mesh(leftHandGeom, skinMat);
    leftHand.position.y = -1.1;
    this.leftArmPivot.add(leftHand);

    this.rightArmPivot = new THREE.Group();
    this.rightArmPivot.position.set(0.75, 0.6, 0); // Pivot at shoulder
    this.torso.add(this.rightArmPivot);

    const rightArm = new THREE.Mesh(armGeom, shirtMat);
    rightArm.position.y = -0.55;
    rightArm.castShadow = true;
    this.rightArmPivot.add(rightArm);

    const rightHand = new THREE.Mesh(leftHandGeom, skinMat);
    rightHand.position.y = -1.1;
    this.rightArmPivot.add(rightHand);

    // Setup initial mesh transforms
    this.mesh.position.set(0, 0, 0);
  }

  setupControls() {
    // Keyboard listener
    const handleKeyDown = (e) => {
      if (this.isDead) return;

      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          this.switchLane(-1);
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          this.switchLane(1);
          break;
        case 'ArrowUp':
        case 'w':
        case 'W':
          this.jump();
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          this.slide();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    this._keydownListener = handleKeyDown;

    // Mobile Swipes
    let touchStartX = 0;
    let touchStartY = 0;

    const handleTouchStart = (e) => {
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
    };

    const handleTouchEnd = (e) => {
      if (this.isDead) return;
      
      const touchEndX = e.changedTouches[0].screenX;
      const touchEndY = e.changedTouches[0].screenY;

      const diffX = touchEndX - touchStartX;
      const diffY = touchEndY - touchStartY;

      // Threshold to recognize swipe (in pixels)
      const threshold = 40;

      if (Math.abs(diffX) > Math.abs(diffY)) {
        // Horizontal swipe
        if (diffX > threshold) {
          this.switchLane(1); // Right
        } else if (diffX < -threshold) {
          this.switchLane(-1); // Left
        }
      } else {
        // Vertical swipe
        if (diffY < -threshold) {
          this.jump(); // Up
        } else if (diffY > threshold) {
          this.slide(); // Down
        }
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    this._touchStartListener = handleTouchStart;
    this._touchEndListener = handleTouchEnd;

    // Mobile Overlay Touch Buttons (pointerdown handles both mouse clicks and touch events)
    const bindPress = (id, action) => {
      const el = document.getElementById(id);
      if (!el) return;
      const handler = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!this.isDead) action();
      };
      el.addEventListener('pointerdown', handler);
      if (!this._touchBtnHandlers) this._touchBtnHandlers = [];
      this._touchBtnHandlers.push({ el, handler });
    };

    bindPress('touch-btn-left', () => this.switchLane(-1));
    bindPress('touch-btn-right', () => this.switchLane(1));
    bindPress('touch-btn-jump', () => this.jump());
    bindPress('touch-btn-slide', () => this.slide());
  }

  destroy() {
    if (this._keydownListener) window.removeEventListener('keydown', this._keydownListener);
    if (this._touchStartListener) window.removeEventListener('touchstart', this._touchStartListener);
    if (this._touchEndListener) window.removeEventListener('touchend', this._touchEndListener);
    
    // Clean up mobile buttons pointerdown listeners
    if (this._touchBtnHandlers) {
      this._touchBtnHandlers.forEach(({ el, handler }) => {
        if (el) el.removeEventListener('pointerdown', handler);
      });
      this._touchBtnHandlers = null;
    }
    
    // Dispose child geometries and materials to avoid memory leaks
    this.mesh.traverse((child) => {
      if (child.isMesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
    this.scene.remove(this.mesh);
  }

  switchLane(dir) {
    let nextLane = this.currentLane + dir;
    if (nextLane >= 0 && nextLane < this.lanes.length) {
      this.currentLane = nextLane;
      this.targetX = this.lanes[this.currentLane];
    }
  }

  jump() {
    if (this.isJumping) return;
    this.isJumping = true;
    this.jumpTime = 0;
    
    // Cancel slide if jumping
    if (this.isSliding) {
      this.isSliding = false;
      this.torso.scale.set(1, 1, 1);
      this.torso.position.y = 2.1;
    }
    
    sound.playJump();
  }

  slide() {
    if (this.isSliding) return;
    this.isSliding = true;
    this.slideTime = 0;

    // Cancel jump (gravity pulling player down immediately if slide is pressed mid-air)
    if (this.isJumping) {
      this.isJumping = false;
      this.currentY = 0;
    }

    sound.playSlide();
  }

  die(reason) {
    if (this.isDead) return;
    this.isDead = true;
    this.deathAnimTime = 0;
    sound.playCrash();
  }

  update(dt, gameSpeed) {
    // 1. Interpolate Lane Switch (X Position)
    // Quick and responsive lane movement: lerp over dt
    const laneSpeed = 15; // lane transition speed
    this.currentX += (this.targetX - this.currentX) * laneSpeed * dt;
    // Snap close values
    if (Math.abs(this.targetX - this.currentX) < 0.05) {
      this.currentX = this.targetX;
    }

    // 2. Jump Physics (Y Position)
    if (this.isJumping) {
      this.jumpTime += dt;
      const progress = this.jumpTime / this.jumpDuration;

      if (progress >= 1.0) {
        this.isJumping = false;
        this.currentY = 0;
      } else {
        // Parabole curve: h * sin(pi * progress)
        this.currentY = Math.sin(Math.PI * progress) * this.jumpHeight;
      }
    }

    // 3. Slide Physics
    if (this.isSliding) {
      this.slideTime += dt;
      const progress = this.slideTime / this.slideDuration;

      if (progress >= 1.0) {
        this.isSliding = false;
        // Restore scale
        this.torso.scale.set(1, 1, 1);
        this.torso.position.y = 2.1;
      } else {
        // Scale player torso vertically, and adjust position so shoes stay on ground
        // Squish character to 50% height
        this.torso.scale.set(1, 0.45, 1.3); // Squished torso, slightly wider
        this.torso.position.y = 1.3; // Lower torso center
      }
    }

    // 4. Update Mesh Position
    if (this.isDead) {
      this.deathAnimTime += dt;
      // Fall backwards animation
      if (this.deathAnimTime < 0.8) {
        this.mesh.rotation.x -= 3 * dt; // Fall backward
        this.mesh.position.y += (1 - this.deathAnimTime) * 8 * dt; // Pop up slightly
        this.mesh.position.z -= 5 * dt; // fly backward
      }
    } else {
      this.mesh.position.set(this.currentX, this.currentY, 0);
      this.animateCharacter(dt, gameSpeed);
    }

    // 5. Update Bounding Box
    // Compute box based on visual size
    // Base size: Width = 1.2, Height = 2.9 (torso 1.6 + legs 1.0 + head 0.8 - offsets)
    let w = 1.0;
    let h = this.isSliding ? 1.0 : 2.7;
    let d = 0.8;
    
    // Shift box min/max based on player position
    this.box.min.set(this.currentX - w/2, this.currentY, -d/2);
    this.box.max.set(this.currentX + w/2, this.currentY + h, d/2);
  }

  animateCharacter(dt, gameSpeed) {
    if (this.isJumping) {
      // Jump Pose: lift arms up, tuck legs back
      this.leftLegPivot.rotation.x = -0.5;
      this.rightLegPivot.rotation.x = -0.5;
      this.leftArmPivot.rotation.x = -Math.PI + 0.5;
      this.rightArmPivot.rotation.x = -Math.PI + 0.5;
      this.head.rotation.x = -0.2;
    } else if (this.isSliding) {
      // Slide Pose: lean head back, arms backward
      this.leftLegPivot.rotation.x = -1.2;
      this.rightLegPivot.rotation.x = -1.2;
      this.leftArmPivot.rotation.x = 0.8;
      this.rightArmPivot.rotation.x = 0.8;
      this.head.rotation.x = 0.3;
    } else {
      // Running animation loop
      // Swing frequency depends on game speed
      const freq = gameSpeed * 0.45;
      const swing = Math.sin(Date.now() * 0.001 * freq * Math.PI * 2);
      
      this.leftLegPivot.rotation.x = swing * 0.9;
      this.rightLegPivot.rotation.x = -swing * 0.9;
      
      this.leftArmPivot.rotation.x = -swing * 0.9;
      this.rightArmPivot.rotation.x = swing * 0.9;

      this.head.rotation.y = Math.sin(Date.now() * 0.002) * 0.08;
      this.head.rotation.x = 0.05 + Math.sin(Date.now() * 0.01) * 0.03; // breathing tilt
      
      // Slight vertical bobbing based on run cycle
      this.torso.position.y = 2.1 + Math.abs(swing) * 0.12;
    }
  }
}
