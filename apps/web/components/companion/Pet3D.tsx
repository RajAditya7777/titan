"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { PetState } from "./CompanionProvider";
import type { Reaction } from "./Pet";

interface Pet3DProps {
  state: PetState | "hover";
  lookAngle: number | null;
  gazeAngle?: number | null;
  reaction?: Reaction | null;
  sleeping?: boolean;
  voiceLevel?: number;
  size?: number;
}

/**
 * Milo: 3D animated companion puppy.
 * Hand-crafted with Three.js using stylized rounded voxel/low-poly geometry,
 * dynamic multi-point lighting, and organic procedural animations (tail wag,
 * breathing, head-tilt, blinking, trotting, ear wiggles, and voice reactivity).
 */
export function Pet3D({
  state,
  lookAngle,
  gazeAngle = null,
  reaction = null,
  sleeping = false,
  voiceLevel = 0,
  size = 88,
}: Pet3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameId = useRef<number | null>(null);

  // References for animated 3D parts
  const partsRef = useRef<{
    root: THREE.Group;
    body: THREE.Group;
    head: THREE.Group;
    snout: THREE.Mesh;
    tail: THREE.Group;
    leftEar: THREE.Group;
    rightEar: THREE.Group;
    leftEye: THREE.Group;
    rightEye: THREE.Group;
    leftPupil: THREE.Mesh;
    rightPupil: THREE.Mesh;
    mouth: THREE.Mesh;
    frontLeftLeg: THREE.Group;
    frontRightLeg: THREE.Group;
    backLeftLeg: THREE.Group;
    backRightLeg: THREE.Group;
    shadow: THREE.Mesh;
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
  } | null>(null);

  // Track props inside the animation loop without restarting WebGL context
  const propsRef = useRef({ state, lookAngle, gazeAngle, reaction, sleeping, voiceLevel });
  propsRef.current = { state, lookAngle, gazeAngle, reaction, sleeping, voiceLevel };

  // Reaction timestamp tracker
  const reactionTimerRef = useRef<{ type: Reaction; start: number } | null>(null);
  useEffect(() => {
    if (reaction) {
      reactionTimerRef.current = { type: reaction, start: performance.now() };
    }
  }, [reaction]);

  const [webGlSupported, setWebGlSupported] = useState(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Check WebGL availability
    try {
      const canvasTest = document.createElement("canvas");
      const gl = canvasTest.getContext("webgl") || canvasTest.getContext("experimental-webgl");
      if (!gl) {
        setWebGlSupported(false);
        return;
      }
    } catch {
      setWebGlSupported(false);
      return;
    }

    // --- Scene Setup ---
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
    camera.position.set(0, 1.4, 4.4);
    camera.lookAt(0, 0.35, 0);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
      });
    } catch {
      setWebGlSupported(false);
      return;
    }

    renderer.setSize(size, size);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.replaceChildren(renderer.domElement);

    // --- Color Palette matching user's Husky character ---
    const colors = {
      furBlue: 0x1d447a, // Deep slate-indigo
      furDarkBlue: 0x143159, // Darker shadow blue
      white: 0xf4f7fb, // Soft crisp white
      pink: 0xf87171, // Inner ear warm pink
      blush: 0xf472b6, // Cheerful cheek blush
      eyeBlue: 0x2563eb, // Vibrant cobalt blue iris
      pupilDark: 0x090d16, // Dark pupil & nose
      goldCollar: 0xf59e0b, // Small companion collar tag
    };

    // Shared materials
    const matFurBlue = new THREE.MeshStandardMaterial({
      color: colors.furBlue,
      roughness: 0.55,
      metalness: 0.05,
    });
    const matFurDark = new THREE.MeshStandardMaterial({
      color: colors.furDarkBlue,
      roughness: 0.6,
      metalness: 0.05,
    });
    const matWhite = new THREE.MeshStandardMaterial({
      color: colors.white,
      roughness: 0.5,
      metalness: 0.02,
    });
    const matPink = new THREE.MeshStandardMaterial({
      color: colors.pink,
      roughness: 0.6,
      metalness: 0.02,
    });
    const matBlush = new THREE.MeshBasicMaterial({
      color: colors.blush,
      transparent: true,
      opacity: 0.7,
    });
    const matEyeBlue = new THREE.MeshStandardMaterial({
      color: colors.eyeBlue,
      roughness: 0.2,
      metalness: 0.1,
    });
    const matPupil = new THREE.MeshBasicMaterial({
      color: colors.pupilDark,
    });
    const matSparkle = new THREE.MeshBasicMaterial({
      color: 0xffffff,
    });
    const matNose = new THREE.MeshStandardMaterial({
      color: colors.pupilDark,
      roughness: 0.2,
      metalness: 0.2,
    });
    const matMouth = new THREE.MeshBasicMaterial({
      color: 0x1f2937,
    });
    const matCollar = new THREE.MeshStandardMaterial({
      color: colors.goldCollar,
      roughness: 0.3,
      metalness: 0.4,
    });

    // --- Build Character Tree ---
    const root = new THREE.Group();
    scene.add(root);

    // Drop Shadow on Floor
    const shadowGeo = new THREE.CircleGeometry(0.55, 32);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x05070c,
      transparent: true,
      opacity: 0.28,
    });
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = -0.42;
    root.add(shadow);

    // Body Group
    const body = new THREE.Group();
    body.position.set(0, 0, 0);
    root.add(body);

    // Torso (Main blue body block with soft rounded bevel)
    const torsoGeo = new THREE.BoxGeometry(0.72, 0.65, 0.68);
    const torso = new THREE.Mesh(torsoGeo, matFurBlue);
    torso.position.set(0, 0.05, 0);
    body.add(torso);

    // White Belly / Chest Plate
    const bellyGeo = new THREE.BoxGeometry(0.52, 0.58, 0.15);
    const belly = new THREE.Mesh(bellyGeo, matWhite);
    belly.position.set(0, 0.03, 0.3);
    body.add(belly);

    // Collar with cute medallion
    const collarGeo = new THREE.TorusGeometry(0.38, 0.035, 12, 28);
    const collar = new THREE.Mesh(collarGeo, matCollar);
    collar.rotation.x = Math.PI / 2;
    collar.position.set(0, 0.38, 0.02);
    body.add(collar);

    const medallionGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.02, 16);
    const medallion = new THREE.Mesh(medallionGeo, matCollar);
    medallion.position.set(0, 0.33, 0.38);
    medallion.rotation.x = Math.PI / 2;
    body.add(medallion);

    // --- Head Group ---
    const head = new THREE.Group();
    head.position.set(0, 0.52, 0.04);
    body.add(head);

    // Main Head Cube (Blue top and sides)
    const headGeo = new THREE.BoxGeometry(0.82, 0.72, 0.72);
    const headMesh = new THREE.Mesh(headGeo, matFurBlue);
    head.add(headMesh);

    // White Face Mask Plate
    const maskGeo = new THREE.BoxGeometry(0.68, 0.44, 0.15);
    const mask = new THREE.Mesh(maskGeo, matWhite);
    mask.position.set(0, -0.12, 0.32);
    head.add(mask);

    // White Forehead Stripe (Husky blaze)
    const blazeGeo = new THREE.BoxGeometry(0.18, 0.42, 0.08);
    const blaze = new THREE.Mesh(blazeGeo, matWhite);
    blaze.position.set(0, 0.16, 0.34);
    head.add(blaze);

    // Snout / Muzzle (White protruding box)
    const snoutGeo = new THREE.BoxGeometry(0.34, 0.24, 0.26);
    const snout = new THREE.Mesh(snoutGeo, matWhite);
    snout.position.set(0, -0.14, 0.46);
    head.add(snout);

    // Nose (Shiny dark rounded nose)
    const noseGeo = new THREE.BoxGeometry(0.12, 0.08, 0.08);
    const nose = new THREE.Mesh(noseGeo, matNose);
    nose.position.set(0, 0.06, 0.13);
    snout.add(nose);

    // Mouth (Smiling curved line or dot)
    const mouthGeo = new THREE.BoxGeometry(0.12, 0.03, 0.02);
    const mouth = new THREE.Mesh(mouthGeo, matMouth);
    mouth.position.set(0, -0.05, 0.13);
    snout.add(mouth);

    // Cheeks Blush
    const blushGeo = new THREE.PlaneGeometry(0.11, 0.07);
    const blushL = new THREE.Mesh(blushGeo, matBlush);
    blushL.position.set(-0.25, -0.16, 0.4);
    head.add(blushL);

    const blushR = new THREE.Mesh(blushGeo, matBlush);
    blushR.position.set(0.25, -0.16, 0.4);
    head.add(blushR);

    // Eyes
    function createEye(isLeft: boolean) {
      const eyeGroup = new THREE.Group();
      eyeGroup.position.set(isLeft ? -0.17 : 0.17, -0.02, 0.38);

      // White Sclera
      const scleraGeo = new THREE.BoxGeometry(0.15, 0.17, 0.05);
      const sclera = new THREE.Mesh(scleraGeo, matWhite);
      eyeGroup.add(sclera);

      // Blue Iris
      const irisGeo = new THREE.BoxGeometry(0.11, 0.13, 0.04);
      const iris = new THREE.Mesh(irisGeo, matEyeBlue);
      iris.position.set(0, 0, 0.02);
      eyeGroup.add(iris);

      // Dark Pupil
      const pupilGeo = new THREE.BoxGeometry(0.07, 0.09, 0.03);
      const pupil = new THREE.Mesh(pupilGeo, matPupil);
      pupil.position.set(0, 0, 0.03);
      eyeGroup.add(pupil);

      // Gleam / Sparkle
      const sparkleGeo = new THREE.BoxGeometry(0.035, 0.035, 0.02);
      const sparkle = new THREE.Mesh(sparkleGeo, matSparkle);
      sparkle.position.set(isLeft ? 0.025 : -0.025, 0.025, 0.045);
      eyeGroup.add(sparkle);

      return { group: eyeGroup, pupil };
    }

    const eyeL = createEye(true);
    const eyeR = createEye(false);
    head.add(eyeL.group);
    head.add(eyeR.group);

    // Ears (Pointed triangular ears with pink inner faces)
    function createEar(isLeft: boolean) {
      const earGroup = new THREE.Group();
      earGroup.position.set(isLeft ? -0.28 : 0.28, 0.42, 0.05);

      const earGeo = new THREE.ConeGeometry(0.16, 0.32, 4);
      earGeo.rotateY(Math.PI / 4);
      const earMesh = new THREE.Mesh(earGeo, matFurBlue);
      earMesh.rotation.z = isLeft ? 0.25 : -0.25;
      earGroup.add(earMesh);

      const innerEarGeo = new THREE.PlaneGeometry(0.12, 0.2);
      const innerEar = new THREE.Mesh(innerEarGeo, matPink);
      innerEar.position.set(0, 0, 0.08);
      innerEar.rotation.z = isLeft ? 0.25 : -0.25;
      earGroup.add(innerEar);

      return earGroup;
    }

    const leftEar = createEar(true);
    const rightEar = createEar(false);
    head.add(leftEar);
    head.add(rightEar);

    // Tail (Wagging tail: blue body with fluffy white tip)
    const tail = new THREE.Group();
    tail.position.set(0, 0.02, -0.35);
    body.add(tail);

    const tailBaseGeo = new THREE.CylinderGeometry(0.08, 0.09, 0.32, 8);
    const tailBase = new THREE.Mesh(tailBaseGeo, matFurDark);
    tailBase.position.set(0, 0.16, -0.06);
    tailBase.rotation.x = -0.65;
    tail.add(tailBase);

    const tailTipGeo = new THREE.ConeGeometry(0.09, 0.22, 8);
    const tailTip = new THREE.Mesh(tailTipGeo, matWhite);
    tailTip.position.set(0, 0.35, -0.19);
    tailTip.rotation.x = -0.65;
    tail.add(tailTip);

    // Legs / Paws
    function createLeg(x: number, z: number) {
      const legGroup = new THREE.Group();
      legGroup.position.set(x, -0.26, z);

      // Leg upper (blue)
      const upperGeo = new THREE.BoxGeometry(0.16, 0.24, 0.18);
      const upper = new THREE.Mesh(upperGeo, matFurBlue);
      legGroup.add(upper);

      // Paw (white foot)
      const footGeo = new THREE.BoxGeometry(0.17, 0.12, 0.22);
      const foot = new THREE.Mesh(footGeo, matWhite);
      foot.position.set(0, -0.1, 0.04);
      legGroup.add(foot);

      return legGroup;
    }

    const frontLeftLeg = createLeg(-0.24, 0.22);
    const frontRightLeg = createLeg(0.24, 0.22);
    const backLeftLeg = createLeg(-0.24, -0.2);
    const backRightLeg = createLeg(0.24, -0.2);

    body.add(frontLeftLeg);
    body.add(frontRightLeg);
    body.add(backLeftLeg);
    body.add(backRightLeg);

    // --- Multi-Directional Studio Lighting ---
    // Warm Key Light
    const keyLight = new THREE.DirectionalLight(0xfff8ee, 2.2);
    keyLight.position.set(2.5, 3.5, 3.5);
    scene.add(keyLight);

    // Cool Ambient / Fill Light
    const ambientLight = new THREE.AmbientLight(0xdce7f9, 1.4);
    scene.add(ambientLight);

    // Rim Back Light (gives dog character depth and soft edge glow)
    const rimLight = new THREE.DirectionalLight(0x60a5fa, 1.6);
    rimLight.position.set(-3.0, 2.0, -3.0);
    scene.add(rimLight);

    partsRef.current = {
      root,
      body,
      head,
      snout,
      tail,
      leftEar,
      rightEar,
      leftEye: eyeL.group,
      rightEye: eyeR.group,
      leftPupil: eyeL.pupil,
      rightPupil: eyeR.pupil,
      mouth,
      frontLeftLeg,
      frontRightLeg,
      backLeftLeg,
      backRightLeg,
      shadow,
      renderer,
      scene,
      camera,
    };

    // --- Procedural Animation Loop ---
    let prevTime = performance.now();
    let blinkTimer = 0;
    let isBlinking = false;
    let blinkProgress = 0;

    const animate = (time: number) => {
      animFrameId.current = requestAnimationFrame(animate);

      const delta = (time - prevTime) / 1000;
      prevTime = time;

      const p = partsRef.current;
      if (!p) return;

      const { state: curState, lookAngle: curLook, gazeAngle: curGaze, sleeping: isAsleep, voiceLevel: curVoice } =
        propsRef.current;

      const tSec = time * 0.001;

      // 1. Organic Breathing & Bob
      const breathSpeed = isAsleep ? 1.4 : curState === "speaking" ? 6.0 : curState === "thinking" ? 2.5 : 2.8;
      const breathAmount = isAsleep ? 0.015 : 0.035 + curVoice * 0.06;
      const breathY = Math.sin(tSec * breathSpeed) * breathAmount;
      p.body.position.y = breathY;

      // Subtle breathing scale (squash & stretch)
      p.body.scale.y = 1 + breathY * 0.5;
      p.body.scale.x = 1 - breathY * 0.25;
      p.body.scale.z = 1 - breathY * 0.25;

      // Floor shadow breathing
      p.shadow.scale.set(1 + breathY * 0.8, 1 + breathY * 0.8, 1);

      // 2. Head Rotation & Gaze Angle
      let targetRotY = 0;
      let targetRotX = 0;
      let targetRotZ = 0;

      if (curLook != null) {
        // Look angle provided (pointing at element)
        const rad = (curLook * Math.PI) / 180;
        targetRotY = -Math.cos(rad) * 0.45;
        targetRotX = Math.sin(rad) * 0.3;
      } else if (curGaze != null && !isAsleep) {
        // Following cursor
        const rad = (curGaze * Math.PI) / 180;
        targetRotY = -Math.cos(rad) * 0.35;
        targetRotX = Math.sin(rad) * 0.2;
      }

      // State-specific Head Poses
      if (curState === "thinking") {
        targetRotZ = Math.sin(tSec * 2.2) * 0.18 + 0.12; // Inquisitive head tilt
        targetRotX -= 0.08;
      } else if (curState === "listening") {
        targetRotZ = 0.14; // Perked ear listening pose
        targetRotY += Math.sin(tSec * 4.0) * 0.06;
        targetRotX -= 0.05;
      } else if (curState === "celebrating") {
        targetRotX = -0.15;
      } else if (isAsleep) {
        targetRotX = 0.25; // Droop head down to sleep
      }

      // Smooth Head Lerp
      p.head.rotation.y += (targetRotY - p.head.rotation.y) * 0.12;
      p.head.rotation.x += (targetRotX - p.head.rotation.x) * 0.12;
      p.head.rotation.z += (targetRotZ - p.head.rotation.z) * 0.12;

      // 3. Tail Wagging
      let tailWagSpeed = isAsleep ? 0.8 : curState === "celebrating" || curState === "hover" ? 18.0 : 4.5;
      let tailWagAmp = isAsleep ? 0.06 : curState === "celebrating" ? 0.65 : curState === "hover" ? 0.55 : 0.26;

      if (curState === "error") {
        tailWagSpeed = 0;
        tailWagAmp = 0;
      }

      p.tail.rotation.y = Math.sin(tSec * tailWagSpeed) * tailWagAmp;
      p.tail.rotation.z = Math.cos(tSec * tailWagSpeed) * 0.1;

      // 4. Ear Animations
      if (curState === "listening") {
        p.leftEar.rotation.x = -0.18; // Perked forward
        p.rightEar.rotation.x = -0.18;
      } else if (curState === "thinking") {
        p.leftEar.rotation.z = 0.28;
        p.rightEar.rotation.z = 0.02; // Asymmetric ear curiosity
      } else if (isAsleep) {
        p.leftEar.rotation.x = 0.22; // Flopped back
        p.rightEar.rotation.x = 0.22;
      } else {
        // Gentle ear bounce
        const earWiggle = Math.sin(tSec * 3.5) * 0.04;
        p.leftEar.rotation.z = earWiggle;
        p.rightEar.rotation.z = -earWiggle;
        p.leftEar.rotation.x = 0;
        p.rightEar.rotation.x = 0;
      }

      // 5. Blinking Animation
      blinkTimer += delta;
      if (!isBlinking && blinkTimer > (isAsleep ? 0.5 : 3.5 + Math.random() * 2.5)) {
        isBlinking = true;
        blinkTimer = 0;
        blinkProgress = 0;
      }

      if (isBlinking) {
        blinkProgress += delta * 9.0;
        if (blinkProgress >= Math.PI) {
          isBlinking = false;
          blinkProgress = 0;
        }
      }

      const eyeScaleY = isAsleep ? 0.12 : isBlinking ? Math.max(0.1, Math.abs(Math.cos(blinkProgress))) : 1.0;
      p.leftEye.scale.y = eyeScaleY;
      p.rightEye.scale.y = eyeScaleY;

      // 6. Speaking Mouth Animation
      if (curState === "speaking" || curVoice > 0.08) {
        const mouthOpen = 0.03 + Math.abs(Math.sin(tSec * 14.0)) * 0.08;
        p.mouth.scale.y = 1 + mouthOpen * 8;
        p.mouth.position.y = -0.05 - mouthOpen * 0.4;
      } else {
        p.mouth.scale.y = 1;
        p.mouth.position.y = -0.05;
      }

      // 7. Leg Trotting & Walking (when moving)
      if (curState === "moving") {
        const walkFreq = 12.0;
        const walkAmp = 0.45;
        p.frontLeftLeg.rotation.x = Math.sin(tSec * walkFreq) * walkAmp;
        p.frontRightLeg.rotation.x = -Math.sin(tSec * walkFreq) * walkAmp;
        p.backLeftLeg.rotation.x = -Math.sin(tSec * walkFreq) * walkAmp;
        p.backRightLeg.rotation.x = Math.sin(tSec * walkFreq) * walkAmp;
        p.root.position.y = Math.abs(Math.sin(tSec * walkFreq * 2)) * 0.08;
      } else {
        p.frontLeftLeg.rotation.x = 0;
        p.frontRightLeg.rotation.x = 0;
        p.backLeftLeg.rotation.x = 0;
        p.backRightLeg.rotation.x = 0;
        p.root.position.y = 0;
      }

      // 8. One-off Reactions (spin, hop, giggle, wiggle)
      if (reactionTimerRef.current) {
        const { type, start } = reactionTimerRef.current;
        const elapsed = (time - start) / 1000;

        if ((type as string) === "spin") {
          const spinDuration = 0.85;
          if (elapsed < spinDuration) {
            const prog = elapsed / spinDuration;
            p.root.rotation.y = prog * Math.PI * 2;
            p.root.position.y = Math.sin(prog * Math.PI) * 0.35;
          } else {
            p.root.rotation.y = 0;
            p.root.position.y = 0;
            reactionTimerRef.current = null;
          }
        } else if (type === "hop" || curState === "celebrating") {
          const hopDuration = 0.75;
          if (elapsed < hopDuration) {
            const prog = elapsed / hopDuration;
            p.root.position.y = Math.sin(prog * Math.PI) * 0.45;
          } else {
            p.root.position.y = 0;
            reactionTimerRef.current = null;
          }
        } else if (type === "wiggle") {
          const wiggleDuration = 0.9;
          if (elapsed < wiggleDuration) {
            p.root.rotation.z = Math.sin(elapsed * 24.0) * 0.15;
          } else {
            p.root.rotation.z = 0;
            reactionTimerRef.current = null;
          }
        } else if (type === "giggle") {
          const giggleDuration = 0.8;
          if (elapsed < giggleDuration) {
            p.root.position.y = Math.abs(Math.sin(elapsed * 20.0)) * 0.1;
          } else {
            p.root.position.y = 0;
            reactionTimerRef.current = null;
          }
        }
      }

      renderer.render(scene, camera);
    };

    animFrameId.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameId.current != null) {
        cancelAnimationFrame(animFrameId.current);
      }
      renderer.dispose();
      partsRef.current = null;
    };
  }, [size]);

  if (!webGlSupported) {
    // Graceful fallback to 2D Pet if WebGL is unavailable
    const { Pet: FallbackPet } = require("./Pet");
    return (
      <FallbackPet
        state={state}
        lookAngle={lookAngle}
        gazeAngle={gazeAngle}
        reaction={reaction}
        sleeping={sleeping}
        voiceLevel={voiceLevel}
        size={size}
      />
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        width: size,
        height: size,
        pointerEvents: "none",
        position: "relative",
      }}
      className="flex items-center justify-center select-none"
    />
  );
}
