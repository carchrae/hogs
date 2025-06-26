class HogInvaders {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.bullets = [];
        this.hogs = [];
        this.children = [];
        this.obstacles = [];
        this.score = 0;
        this.childrenRemaining = 5;
        this.spotlightAngle = 0;
        
        this.setupSounds();

        this.init();
        this.setupLights();
        this.createPlayer();
        this.createChildren();
        this.createObstacles();
        this.createGroundGrid();
        this.createHogs();
        this.setupControls();
        

        this.animate();
    }
    
    init() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0xC0C0C0);
        document.getElementById('gameContainer').appendChild(this.renderer.domElement);
        
        this.camera.position.z = 10;
        this.camera.position.y = -5;
        this.camera.lookAt(0, 0, 0);
        
        // Add dynamic fog effect
        this.scene.fog = new THREE.FogExp2(0xC0C0C0, 0.08);
        this.fogDensity = 0.08;
        this.fogTime = 0;
        
        window.addEventListener('resize', () => this.onWindowResize(), false);
    }
    
    setupLights() {
        // Very dim ambient light
        const ambientLight = new THREE.AmbientLight(0x202020, 0.1);
        this.scene.add(ambientLight);
        
        // Minimal directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.1);
        directionalLight.position.set(0, 10, 5);
        this.scene.add(directionalLight);
        
        // Extremely bright swinging spotlight
        this.spotlight = new THREE.SpotLight(0xffffff, 15);
        this.spotlight.position.set(0, 8, 2);
        this.spotlight.angle = Math.PI / 4;
        this.spotlight.penumbra = 0.3;
        this.spotlight.decay = 2;
        this.spotlight.distance = 15;
        this.spotlight.castShadow = true;
        
        // Target for the spotlight
        this.spotlightTarget = new THREE.Object3D();
        this.spotlightTarget.position.set(0, 2, 0);
        this.scene.add(this.spotlightTarget);
        this.spotlight.target = this.spotlightTarget;
        
        this.scene.add(this.spotlight);
        
        // Bright light specifically for children
        this.childrenLight = new THREE.DirectionalLight(0xffffff, 3);
        this.childrenLight.position.set(0, 5, 5);
        this.childrenLight.target.position.set(0, -3.5, 0);
        this.scene.add(this.childrenLight);
        this.scene.add(this.childrenLight.target);
    }
    
    setupSounds() {
        // Use short pig death sounds from the sounds folder
        this.deathSounds = [
            'sounds/pig_hit1.mp3',
            'sounds/pig_hit2.mp3',
            'sounds/hit-1.wav',
            'sounds/hit-2.wav',
            'sounds/hit-3.wav',
            'sounds/belch.wav'
        ];
        
        // Preload all death sounds
        this.squealSounds = [];
        this.deathSounds.forEach(soundPath => {
            const audio = new Audio(soundPath);
            audio.volume = 0.8;
            audio.preload = 'auto';
            this.squealSounds.push(audio);
        });
    }
    
    
    playRandomSqueal() {
        const randomIndex = Math.floor(Math.random() * this.squealSounds.length);
        const audio = this.squealSounds[randomIndex];
        
        try {
            // Reset audio to beginning and play
            audio.currentTime = 0;
            audio.play().catch(e => {
                // Ignore errors if audio can't play (browser restrictions)
                console.log('Audio play failed:', e);
            });
        } catch (e) {
            console.log('Audio setup failed:', e);
        }
    }
    
    createPlayer() {
        this.player = this.createRuralMan();
        this.player.position.set(0, -4, 0);
        this.scene.add(this.player);
    }
    
    createRuralMan() {
        const group = new THREE.Group();
        
        // Head
        const headGeometry = new THREE.SphereGeometry(0.2, 8, 8);
        const headMaterial = new THREE.MeshLambertMaterial({ color: 0xFFDBB0 });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 0.6;
        group.add(head);
        
        // Hat
        const hatGeometry = new THREE.CylinderGeometry(0.25, 0.25, 0.1, 8);
        const hatMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const hat = new THREE.Mesh(hatGeometry, hatMaterial);
        hat.position.y = 0.75;
        group.add(hat);
        
        // Hat brim
        const brimGeometry = new THREE.CylinderGeometry(0.35, 0.35, 0.02, 8);
        const brimMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
        const brim = new THREE.Mesh(brimGeometry, brimMaterial);
        brim.position.y = 0.7;
        group.add(brim);
        
        // Body (torso)
        const bodyGeometry = new THREE.CylinderGeometry(0.15, 0.2, 0.5, 8);
        const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x4169E1 });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.15;
        group.add(body);
        
        // Arms
        const armGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.3, 6);
        const armMaterial = new THREE.MeshLambertMaterial({ color: 0xFFDBB0 });
        
        const leftArm = new THREE.Mesh(armGeometry, armMaterial);
        leftArm.position.set(-0.25, 0.25, 0);
        leftArm.rotation.z = Math.PI / 4;
        group.add(leftArm);
        
        const rightArm = new THREE.Mesh(armGeometry, armMaterial);
        rightArm.position.set(0.25, 0.25, 0);
        rightArm.rotation.z = -Math.PI / 4;
        group.add(rightArm);
        
        // Legs
        const legGeometry = new THREE.CylinderGeometry(0.06, 0.06, 0.4, 6);
        const legMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        
        const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
        leftLeg.position.set(-0.1, -0.3, 0);
        group.add(leftLeg);
        
        const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
        rightLeg.position.set(0.1, -0.3, 0);
        group.add(rightLeg);
        
        // Shotgun
        const shotgunBarrelGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.8, 8);
        const shotgunMaterial = new THREE.MeshLambertMaterial({ color: 0x2F4F4F });
        const shotgunBarrel = new THREE.Mesh(shotgunBarrelGeometry, shotgunMaterial);
        shotgunBarrel.position.set(0.15, 0.3, 0.4);
        shotgunBarrel.rotation.x = -Math.PI / 6;
        group.add(shotgunBarrel);
        
        // Shotgun stock
        const stockGeometry = new THREE.BoxGeometry(0.08, 0.15, 0.3);
        const stockMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const stock = new THREE.Mesh(stockGeometry, stockMaterial);
        stock.position.set(0.1, 0.15, -0.1);
        stock.rotation.x = -Math.PI / 6;
        group.add(stock);
        
        // Beard
        const beardGeometry = new THREE.SphereGeometry(0.08, 6, 6);
        const beardMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
        const beard = new THREE.Mesh(beardGeometry, beardMaterial);
        beard.position.set(0, 0.5, 0.15);
        beard.scale.y = 1.5;
        group.add(beard);
        
        // Eyes
        const eyeGeometry = new THREE.SphereGeometry(0.02, 6, 6);
        const eyeMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
        
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.07, 0.62, 0.18);
        group.add(leftEye);
        
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.07, 0.62, 0.18);
        group.add(rightEye);
        
        return group;
    }
    
    createChildren() {
        const positions = [
            { x: -2, y: -3.5 },
            { x: -1, y: -3.5 },
            { x: 0, y: -3.5 },
            { x: 1, y: -3.5 },
            { x: 2, y: -3.5 }
        ];
        
        positions.forEach((pos, index) => {
            const child = this.createChild();
            child.position.set(pos.x, pos.y, 0);
            child.userData = { 
                id: index,
                originalX: pos.x,
                originalY: pos.y,
                runSpeed: 0.02 + Math.random() * 0.03,
                bobPhase: Math.random() * Math.PI * 2,
                animationOffset: Math.random() * Math.PI * 2,
                changeDirectionTimer: Math.random() * 2,
                targetX: pos.x,
                targetY: pos.y,
                panicLevel: 0,
                fleeDirection: { x: 0, y: 0 },
                lastSafeDirection: { x: 0, y: -1 }
            };
            this.children.push(child);
            this.scene.add(child);
        });
    }
    
    createChild() {
        const group = new THREE.Group();
        
        // Head
        const headGeometry = new THREE.SphereGeometry(0.15, 8, 8);
        const headMaterial = new THREE.MeshLambertMaterial({ color: 0xFFDBB0 });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 0.25;
        group.add(head);
        
        // Body
        const bodyGeometry = new THREE.CylinderGeometry(0.08, 0.12, 0.3, 8);
        const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x4169E1 });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0;
        group.add(body);
        
        // Arms
        const armGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.15, 6);
        const armMaterial = new THREE.MeshLambertMaterial({ color: 0xFFDBB0 });
        
        const leftArm = new THREE.Mesh(armGeometry, armMaterial);
        leftArm.position.set(-0.12, 0.05, 0);
        leftArm.rotation.z = Math.PI / 6;
        group.add(leftArm);
        
        const rightArm = new THREE.Mesh(armGeometry, armMaterial);
        rightArm.position.set(0.12, 0.05, 0);
        rightArm.rotation.z = -Math.PI / 6;
        group.add(rightArm);
        
        // Legs
        const legGeometry = new THREE.CylinderGeometry(0.04, 0.04, 0.2, 6);
        const legMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        
        const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
        leftLeg.position.set(-0.06, -0.25, 0);
        group.add(leftLeg);
        
        const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
        rightLeg.position.set(0.06, -0.25, 0);
        group.add(rightLeg);
        
        // Eyes
        const eyeGeometry = new THREE.SphereGeometry(0.02, 6, 6);
        const eyeMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
        
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.05, 0.28, 0.12);
        group.add(leftEye);
        
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.05, 0.28, 0.12);
        group.add(rightEye);
        
        // Hair
        const hairGeometry = new THREE.SphereGeometry(0.16, 8, 6);
        const hairMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const hair = new THREE.Mesh(hairGeometry, hairMaterial);
        hair.position.y = 0.35;
        hair.scale.y = 0.6;
        group.add(hair);
        
        return group;
    }
    
    createBonePile(position) {
        const group = new THREE.Group();
        
        // Create various bone shapes
        const boneColor = 0xF5F5DC; // Bone white
        
        // Long bones
        for (let i = 0; i < 4; i++) {
            const boneGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.2, 6);
            const boneMaterial = new THREE.MeshLambertMaterial({ color: boneColor });
            const bone = new THREE.Mesh(boneGeometry, boneMaterial);
            
            bone.position.set(
                (Math.random() - 0.5) * 0.3,
                0.05 + Math.random() * 0.1,
                (Math.random() - 0.5) * 0.3
            );
            bone.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
            
            group.add(bone);
        }
        
        // Skull
        const skullGeometry = new THREE.SphereGeometry(0.08, 8, 8);
        const skullMaterial = new THREE.MeshLambertMaterial({ color: boneColor });
        const skull = new THREE.Mesh(skullGeometry, skullMaterial);
        skull.position.set(
            (Math.random() - 0.5) * 0.2,
            0.08,
            (Math.random() - 0.5) * 0.2
        );
        skull.scale.set(1, 0.8, 1.2);
        group.add(skull);
        
        // Rib cage pieces
        for (let i = 0; i < 3; i++) {
            const ribGeometry = new THREE.TorusGeometry(0.06, 0.01, 4, 8);
            const ribMaterial = new THREE.MeshLambertMaterial({ color: boneColor });
            const rib = new THREE.Mesh(ribGeometry, ribMaterial);
            
            rib.position.set(
                (Math.random() - 0.5) * 0.25,
                0.03 + i * 0.02,
                (Math.random() - 0.5) * 0.25
            );
            rib.rotation.x = Math.PI / 2 + (Math.random() - 0.5) * 0.5;
            rib.rotation.y = Math.random() * Math.PI;
            rib.scale.multiplyScalar(0.5 + Math.random() * 0.5);
            
            group.add(rib);
        }
        
        // Small bone fragments
        for (let i = 0; i < 6; i++) {
            const fragmentGeometry = new THREE.BoxGeometry(0.03, 0.01, 0.08);
            const fragmentMaterial = new THREE.MeshLambertMaterial({ color: boneColor });
            const fragment = new THREE.Mesh(fragmentGeometry, fragmentMaterial);
            
            fragment.position.set(
                (Math.random() - 0.5) * 0.4,
                0.01,
                (Math.random() - 0.5) * 0.4
            );
            fragment.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
            
            group.add(fragment);
        }
        
        group.position.copy(position);
        return group;
    }
    
    createObstacles() {
        // Place obstacles randomly around the battlefield
        this.createBushes();
        this.createTrees();
        this.createOldCars();
        this.createBoxes();
    }
    
    createBushes() {
        const bushCount = 8;
        for (let i = 0; i < bushCount; i++) {
            const bush = this.createBush();
            this.placeObstacleRandomly(bush);
            this.obstacles.push(bush);
            this.scene.add(bush);
        }
    }
    
    createBush() {
        const group = new THREE.Group();
        
        // Main bush body - large green sphere
        const bushGeometry = new THREE.SphereGeometry(0.4, 8, 6);
        const bushMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
        const bush = new THREE.Mesh(bushGeometry, bushMaterial);
        bush.position.y = 0.2;
        bush.scale.set(1, 0.6, 1); // Flatten slightly
        group.add(bush);
        
        // Add smaller bushes for irregular shape
        for (let i = 0; i < 3; i++) {
            const smallBushGeometry = new THREE.SphereGeometry(0.2, 6, 4);
            const smallBush = new THREE.Mesh(smallBushGeometry, bushMaterial);
            smallBush.position.set(
                (Math.random() - 0.5) * 0.6,
                0.1 + Math.random() * 0.2,
                (Math.random() - 0.5) * 0.6
            );
            group.add(smallBush);
        }
        
        group.userData = { type: 'bush', radius: 0.5 };
        return group;
    }
    
    createTrees() {
        const treeCount = 4;
        for (let i = 0; i < treeCount; i++) {
            const tree = this.createTree();
            this.placeObstacleRandomly(tree);
            this.obstacles.push(tree);
            this.scene.add(tree);
        }
    }
    
    createTree() {
        const group = new THREE.Group();
        
        // Tree trunk - positioned to sit on ground and point upward
        const trunkGeometry = new THREE.CylinderGeometry(0.1, 0.15, 1.5, 8);
        const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.y = 0.75;
        group.add(trunk);
        
        // Tree crown - positioned at the top end of the rotated trunk
        const crownGeometry = new THREE.SphereGeometry(0.6, 8, 6);
        const crownMaterial = new THREE.MeshLambertMaterial({ color: 0x32CD32 });
        const crown = new THREE.Mesh(crownGeometry, crownMaterial);
        crown.position.y = 1.3;
        crown.scale.set(1, 0.8, 1);
        group.add(crown);
        
        // Additional crown layers for fuller tree
        const crown2 = new THREE.Mesh(crownGeometry, crownMaterial);
        crown2.position.set(0.2, 1.1, 0.1);
        crown2.scale.set(0.7, 0.6, 0.7);
        group.add(crown2);
        
        group.userData = { type: 'tree', radius: 0.8 };
        return group;
    }
    
    createOldCars() {
        const carCount = 3;
        for (let i = 0; i < carCount; i++) {
            const car = this.createOldCar();
            this.placeObstacleRandomly(car);
            this.obstacles.push(car);
            this.scene.add(car);
        }
    }
    
    createOldCar() {
        const group = new THREE.Group();
        
        // Main car body
        const bodyGeometry = new THREE.BoxGeometry(2, 0.8, 1);
        const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x8B0000 }); // Dark red
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.4;
        group.add(body);
        
        // Car roof
        const roofGeometry = new THREE.BoxGeometry(1.2, 0.6, 0.9);
        const roofMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
        const roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.y = 0.9;
        group.add(roof);
        
        // Wheels
        const wheelGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.1, 8);
        const wheelMaterial = new THREE.MeshLambertMaterial({ color: 0x2F4F4F });
        
        const wheelPositions = [
            [-0.7, 0.2, -0.6],
            [-0.7, 0.2, 0.6],
            [0.7, 0.2, -0.6],
            [0.7, 0.2, 0.6]
        ];
        
        wheelPositions.forEach(pos => {
            const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
            wheel.position.set(pos[0], pos[1], pos[2]);
            wheel.rotation.z = Math.PI / 2;
            group.add(wheel);
        });
        
        // Add rust/damage details
        const rustGeometry = new THREE.BoxGeometry(0.3, 0.1, 0.1);
        const rustMaterial = new THREE.MeshLambertMaterial({ color: 0xA0522D });
        const rust = new THREE.Mesh(rustGeometry, rustMaterial);
        rust.position.set(0.5, 0.3, 0.5);
        group.add(rust);
        
        group.userData = { type: 'car', radius: 1.2 };
        return group;
    }
    
    createBoxes() {
        const boxCount = 6;
        for (let i = 0; i < boxCount; i++) {
            const box = this.createBox();
            this.placeObstacleRandomly(box);
            this.obstacles.push(box);
            this.scene.add(box);
        }
    }
    
    createBox() {
        const group = new THREE.Group();
        
        // Main crate
        const boxGeometry = new THREE.BoxGeometry(0.6, 0.6, 0.6);
        const boxMaterial = new THREE.MeshLambertMaterial({ color: 0xD2691E });
        const box = new THREE.Mesh(boxGeometry, boxMaterial);
        box.position.y = 0.3;
        group.add(box);
        
        // Wood planks detail
        const plankGeometry = new THREE.BoxGeometry(0.65, 0.05, 0.65);
        const plankMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        
        for (let i = 0; i < 3; i++) {
            const plank = new THREE.Mesh(plankGeometry, plankMaterial);
            plank.position.y = 0.1 + i * 0.2;
            group.add(plank);
        }
        
        // Sometimes stack boxes
        if (Math.random() > 0.5) {
            const topBox = new THREE.Mesh(boxGeometry, boxMaterial);
            topBox.position.y = 0.9;
            topBox.rotation.y = Math.PI / 4; // Rotate slightly
            group.add(topBox);
            
            group.userData = { type: 'boxes', radius: 0.4 };
        } else {
            group.userData = { type: 'box', radius: 0.4 };
        }
        
        return group;
    }
    
    placeObstacleRandomly(obstacle) {
        const maxAttempts = 50;
        let placed = false;
        
        for (let attempt = 0; attempt < maxAttempts && !placed; attempt++) {
            // Random position in battlefield area
            const x = (Math.random() - 0.5) * 18; // -9 to 9
            const y = Math.random() * 5 + 0.5; // 0.5 to 5.5
            const z = 0; // (Math.random() - 0.5) * 12; // -6 to 6
            
            // Check if position is clear
            let tooClose = false;
            
            // Check distance from children starting positions
            const childPositions = [
                { x: -2, y: -3.5 }, { x: -1, y: -3.5 }, { x: 0, y: -3.5 },
                { x: 1, y: -3.5 }, { x: 2, y: -3.5 }
            ];
            
            for (const childPos of childPositions) {
                const distance = Math.sqrt((x - childPos.x) ** 2 + (y - childPos.y) ** 2);
                if (distance < 2) {
                    tooClose = true;
                    break;
                }
            }
            
            // Check distance from player starting position
            if (!tooClose) {
                const playerDistance = Math.sqrt(x ** 2 + (y + 4) ** 2);
                if (playerDistance < 2) {
                    tooClose = true;
                }
            }
            
            // Check distance from other obstacles
            if (!tooClose) {
                for (const otherObstacle of this.obstacles) {
                    const distance = Math.sqrt(
                        (x - otherObstacle.position.x) ** 2 + 
                        (y - otherObstacle.position.y) ** 2 + 
                        (z - otherObstacle.position.z) ** 2
                    );
                    if (distance < 2.5) {
                        tooClose = true;
                        break;
                    }
                }
            }
            
            if (!tooClose) {
                obstacle.position.set(x, y, z);
                // Random rotation for variety
                obstacle.rotation.y = Math.random() * Math.PI * 2;
                placed = true;
            }
        }
        
        // If we couldn't place it randomly, place it in a safe fallback position
        if (!placed) {
            obstacle.position.set(
                (Math.random() - 0.5) * 8,
                2,
                (Math.random() - 0.5) * 6
            );
        }
    }
    
    createGroundGrid() {
        const gridSize = 20;
        const gridStep = 1;
        const gridGeometry = new THREE.BufferGeometry();
        const gridMaterial = new THREE.LineBasicMaterial({ 
            color: 0xFFFFFF, 
            opacity: 0.8, 
            transparent: true 
        });
        
        const points = [];
        const halfSize = gridSize / 2;
        
        // Create horizontal lines
        for (let i = -halfSize; i <= halfSize; i += gridStep) {
            points.push(-halfSize, i, 0);
            points.push(halfSize, i, 0);
        }
        
        // Create vertical lines
        for (let i = -halfSize; i <= halfSize; i += gridStep) {
            points.push(i, -halfSize, 0);
            points.push(i, halfSize, 0);
        }
        
        gridGeometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
        const grid = new THREE.LineSegments(gridGeometry, gridMaterial);
        grid.position.z = -0.01; // Slightly below ground level
        this.scene.add(grid);
    }
    
    createHogs() {
        // Create different types of hog groups
        this.createHogSwarm();
        this.createStraglerHogs();
        this.createEliteHogs();
    }
    
    createHogSwarm() {
        // Main swarm - irregular formation
        const swarmSize = 25;
        const centerY = 4;
        const spreadX = 8;
        const spreadY = 3;
        
        for (let i = 0; i < swarmSize; i++) {
            const hog = this.createHog();
            
            // Cluster around center with some randomness
            const angle = (i / swarmSize) * Math.PI * 2 + Math.random() * 0.5;
            const radius = 2 + Math.random() * 3;
            
            hog.position.x = Math.cos(angle) * radius + (Math.random() - 0.5) * 2;
            hog.position.y = centerY + Math.sin(angle) * radius * 0.5 + (Math.random() - 0.5) * spreadY;
            hog.position.z = (Math.random() - 0.5) * 2;
            
            hog.userData = {
                originalX: hog.position.x,
                originalY: hog.position.y,
                movementType: 'swarm',
                speed: 0.015 + Math.random() * 0.02,
                direction: Math.random() > 0.5 ? 1 : -1,
                animationOffset: Math.random() * Math.PI * 2,
                walkPhase: Math.random() * Math.PI * 2,
                wanderAngle: Math.random() * Math.PI * 2,
                aggressiveness: Math.random(),
                targetChild: null
            };
            
            this.hogs.push(hog);
            this.scene.add(hog);
        }
    }
    
    createStraglerHogs() {
        // Individual hogs coming from different directions
        const straglers = 12;
        
        for (let i = 0; i < straglers; i++) {
            const hog = this.createHog();
            
            // Start from edges
            const side = Math.floor(Math.random() * 3); // 0=left, 1=right, 2=top
            switch(side) {
                case 0: // Left side
                    hog.position.x = -8 - Math.random() * 3;
                    hog.position.y = 2 + Math.random() * 4;
                    break;
                case 1: // Right side
                    hog.position.x = 8 + Math.random() * 3;
                    hog.position.y = 2 + Math.random() * 4;
                    break;
                case 2: // Top
                    hog.position.x = (Math.random() - 0.5) * 12;
                    hog.position.y = 7 + Math.random() * 2;
                    break;
            }
            hog.position.z = (Math.random() - 0.5) * 3;
            
            hog.userData = {
                originalX: hog.position.x,
                originalY: hog.position.y,
                movementType: 'stragler',
                speed: 0.01 + Math.random() * 0.015,
                direction: Math.random() > 0.5 ? 1 : -1,
                animationOffset: Math.random() * Math.PI * 2,
                walkPhase: Math.random() * Math.PI * 2,
                wanderAngle: Math.random() * Math.PI * 2,
                aggressiveness: 0.3 + Math.random() * 0.7,
                targetChild: null,
                arrivalDelay: Math.random() * 5 // Stagger arrival times
            };
            
            this.hogs.push(hog);
            this.scene.add(hog);
        }
    }
    
    createEliteHogs() {
        // Larger, faster, more aggressive hogs
        const elites = 8;
        
        for (let i = 0; i < elites; i++) {
            const hog = this.createHog();
            
            // Make them bigger and darker
            hog.scale.multiplyScalar(1.3);
            hog.children.forEach(child => {
                if (child.material) {
                    child.material = child.material.clone();
                    child.material.color.multiplyScalar(0.7); // Darker
                }
            });
            
            hog.position.x = (Math.random() - 0.5) * 10;
            hog.position.y = 6 + Math.random() * 2;
            hog.position.z = (Math.random() - 0.5) * 2;
            
            hog.userData = {
                originalX: hog.position.x,
                originalY: hog.position.y,
                movementType: 'elite',
                speed: 0.025 + Math.random() * 0.02,
                direction: Math.random() > 0.5 ? 1 : -1,
                animationOffset: Math.random() * Math.PI * 2,
                walkPhase: Math.random() * Math.PI * 2,
                wanderAngle: Math.random() * Math.PI * 2,
                aggressiveness: 0.8 + Math.random() * 0.2,
                targetChild: null,
                isElite: true,
                zigzagPhase: Math.random() * Math.PI * 2
            };
            
            this.hogs.push(hog);
            this.scene.add(hog);
        }
    }
    
    createHog() {
        const group = new THREE.Group();
        
        // Main body - create rounded pig body using sphere
        const bodyGeometry = new THREE.SphereGeometry(0.25, 12, 8);
        const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0xD2B48C });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.scale.set(1.6, 0.8, 1); // Stretch to make pig-like proportions (length, height, width)
        body.position.y = 0;
        group.add(body);
        
        // Head - more elongated snout area
        const headGeometry = new THREE.SphereGeometry(0.2, 12, 8);
        const headMaterial = new THREE.MeshLambertMaterial({ color: 0xDEB887 });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.set(0.45, 0.05, 0); // Position at front of cylindrical body
        head.scale.set(1.3, 0.8, 0.9); // Elongated for snout
        group.add(head);
        
        // Snout - more realistic pig snout
        const snoutGeometry = new THREE.CylinderGeometry(0.12, 0.08, 0.15, 8);
        const snoutMaterial = new THREE.MeshLambertMaterial({ color: 0xF4A460 });
        const snout = new THREE.Mesh(snoutGeometry, snoutMaterial);
        snout.position.set(0.6, -0.05, 0);
        snout.rotation.z = Math.PI / 2; // Rotate to point forward
        group.add(snout);
        
        // Nostrils
        const nostrilGeometry = new THREE.SphereGeometry(0.02, 6, 6);
        const nostrilMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
        
        const leftNostril = new THREE.Mesh(nostrilGeometry, nostrilMaterial);
        leftNostril.position.set(0.67, -0.05, -0.04);
        group.add(leftNostril);
        
        const rightNostril = new THREE.Mesh(nostrilGeometry, nostrilMaterial);
        rightNostril.position.set(0.67, -0.05, 0.04);
        group.add(rightNostril);
        
        // Ears - more realistic pig ears
        const earGeometry = new THREE.ConeGeometry(0.12, 0.25, 6);
        const earMaterial = new THREE.MeshLambertMaterial({ color: 0xCD853F });
        
        const leftEar = new THREE.Mesh(earGeometry, earMaterial);
        leftEar.position.set(0.35, 0.25, -0.18);
        leftEar.rotation.set(0.3, -0.5, 0);
        leftEar.scale.set(0.8, 1, 1.2);
        group.add(leftEar);
        
        const rightEar = new THREE.Mesh(earGeometry, earMaterial);
        rightEar.position.set(0.35, 0.25, 0.18);
        rightEar.rotation.set(0.3, 0.5, 0);
        rightEar.scale.set(0.8, 1, 1.2);
        group.add(rightEar);
        
        // Eyes - more menacing
        const eyeGeometry = new THREE.SphereGeometry(0.06, 8, 8);
        const eyeMaterial = new THREE.MeshLambertMaterial({ color: 0xff4444 });
        
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(0.5, 0.08, -0.12);
        group.add(leftEye);
        
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.5, 0.08, 0.12);
        group.add(rightEye);
        
        // Eye pupils
        const pupilGeometry = new THREE.SphereGeometry(0.03, 6, 6);
        const pupilMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
        
        const leftPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
        leftPupil.position.set(0.55, 0.08, -0.12);
        group.add(leftPupil);
        
        const rightPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
        rightPupil.position.set(0.55, 0.08, 0.12);
        group.add(rightPupil);
        
        // Legs
        const legGeometry = new THREE.CylinderGeometry(0.05, 0.07, 0.2, 6);
        const legMaterial = new THREE.MeshLambertMaterial({ color: 0xBC8F8F });
        
        const positions = [
            [0.15, -0.4, -0.2],  // Front left
            [0.15, -0.4, 0.2],   // Front right
            [-0.15, -0.4, -0.2], // Back left
            [-0.15, -0.4, 0.2]   // Back right
        ];
        
        positions.forEach((pos, index) => {
            const leg = new THREE.Mesh(legGeometry, legMaterial);
            leg.position.set(pos[0], pos[1], pos[2]);
            leg.userData = { legIndex: index }; // Mark which leg this is
            group.add(leg);
        });
        
        // Curly pig tail
        const tailGroup = new THREE.Group();
        tailGroup.userData = { isTail: true }; // Mark as tail group
        
        // Create curved tail using multiple segments
        const tailSegments = 8;
        const tailRadius = 0.08;
        const tailHeight = 0.3;
        
        for (let i = 0; i < tailSegments; i++) {
            const segmentGeometry = new THREE.SphereGeometry(0.02, 6, 6);
            const segmentMaterial = new THREE.MeshLambertMaterial({ color: 0xD2B48C });
            const segment = new THREE.Mesh(segmentGeometry, segmentMaterial);
            
            // Create spiral curve
            const angle = (i / tailSegments) * Math.PI * 3; // 1.5 full turns
            const spiralRadius = tailRadius * (1 - i / tailSegments * 0.3); // Taper toward tip
            const height = (i / tailSegments) * tailHeight;
            
            segment.position.set(
                Math.cos(angle) * spiralRadius,
                height * 0.5,
                Math.sin(angle) * spiralRadius
            );
            
            // Scale down segments toward the tip
            const scale = 1 - (i / tailSegments) * 0.5;
            segment.scale.multiplyScalar(scale);
            
            tailGroup.add(segment);
        }
        
        // Position the entire tail group at back of cylindrical body
        tailGroup.position.set(-0.45, 0.1, 0);
        tailGroup.rotation.set(-0.2, -Math.PI/2, 0.1); // Rotate for new body orientation
        group.add(tailGroup);
        
        // Add some menacing tusks
        const tuskGeometry = new THREE.ConeGeometry(0.02, 0.1, 4);
        const tuskMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFAF0 });
        
        const leftTusk = new THREE.Mesh(tuskGeometry, tuskMaterial);
        leftTusk.position.set(0.65, -0.1, -0.08);
        leftTusk.rotation.set(0.3, -0.2, 0);
        group.add(leftTusk);
        
        const rightTusk = new THREE.Mesh(tuskGeometry, tuskMaterial);
        rightTusk.position.set(0.65, -0.1, 0.08);
        rightTusk.rotation.set(0.3, 0.2, 0);
        group.add(rightTusk);
        
        return group;
    }
    
    setupControls() {
        this.keys = {};
        
        document.addEventListener('keydown', (event) => {
            this.keys[event.code] = true;
            
            if (event.code === 'Space') {
                event.preventDefault();
                this.shoot();
            }
        });
        
        document.addEventListener('keyup', (event) => {
            this.keys[event.code] = false;
        });
    }
    
    shoot() {
        // Check for nearby hogs for melee attack
        const meleeRange = 1.5;
        let meleeTarget = null;
        
        for (const hog of this.hogs) {
            const dx = this.player.position.x - hog.position.x;
            const dy = this.player.position.y - hog.position.y;
            const dz = this.player.position.z - hog.position.z;
            const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
            
            if (distance <= meleeRange) {
                meleeTarget = hog;
                break;
            }
        }
        
        if (meleeTarget) {
            this.meleeAttack(meleeTarget);
        } else {
            // Regular shooting
            const bulletGeometry = new THREE.SphereGeometry(0.05, 8, 8);
            const bulletMaterial = new THREE.MeshLambertMaterial({ color: 0xffff00 });
            const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);
            
            bullet.position.copy(this.player.position);
            bullet.position.y += 0.5;
            
            this.bullets.push(bullet);
            this.scene.add(bullet);
        }
    }
    
    meleeAttack(hog) {
        // Kill the hog instantly with melee
        this.killHog(hog);
        
        // Create melee effect
        this.createMeleeEffect(hog.position);
    }
    
    createMeleeEffect(position) {
        // Create a brief flash effect for melee attack
        const flashGeometry = new THREE.SphereGeometry(0.8, 8, 8);
        const flashMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xff4444, 
            transparent: true, 
            opacity: 0.8 
        });
        const flash = new THREE.Mesh(flashGeometry, flashMaterial);
        flash.position.copy(position);
        this.scene.add(flash);
        
        // Remove flash after short duration
        setTimeout(() => {
            this.scene.remove(flash);
        }, 150);
    }
    
    killHog(hog) {
        // Remove hog from scene and arrays
        this.scene.remove(hog);
        const index = this.hogs.indexOf(hog);
        if (index > -1) {
            this.hogs.splice(index, 1);
        }
        
        // Play death sound and update score
        this.playRandomSqueal();
        this.score += 10;
        document.getElementById('score').textContent = this.score;
        
        // Create death effect (bone pile)
        this.createDeathEffect(hog.position);
    }
    
    updatePlayer() {
        const moveSpeed = 0.15;
        const boundaries = { x: 10, y: 5 };
        
        // Horizontal movement
        if (this.keys['ArrowLeft'] && this.player.position.x > -boundaries.x) {
            this.player.position.x -= moveSpeed;
        }
        if (this.keys['ArrowRight'] && this.player.position.x < boundaries.x) {
            this.player.position.x += moveSpeed;
        }
        
        // Vertical movement
        if (this.keys['ArrowUp'] && this.player.position.y < -2) {
            this.player.position.y += moveSpeed;
        }
        if (this.keys['ArrowDown'] && this.player.position.y > -boundaries.y) {
            this.player.position.y -= moveSpeed;
        }
        
        // Alternative movement with WASD
        if (this.keys['KeyA'] && this.player.position.x > -boundaries.x) {
            this.player.position.x -= moveSpeed;
        }
        if (this.keys['KeyD'] && this.player.position.x < boundaries.x) {
            this.player.position.x += moveSpeed;
        }
        if (this.keys['KeyW'] && this.player.position.y < -2) {
            this.player.position.y += moveSpeed;
        }
        if (this.keys['KeyS'] && this.player.position.y > -boundaries.y) {
            this.player.position.y -= moveSpeed;
        }
        
        // Rotate player to face the direction of movement
        if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
            this.player.rotation.y = Math.PI / 8;
        } else if (this.keys['ArrowRight'] || this.keys['KeyD']) {
            this.player.rotation.y = -Math.PI / 8;
        } else {
            this.player.rotation.y = 0;
        }
    }
    
    animatePlayer(time) {
        // Breathing animation
        const breathingSpeed = 3;
        const breathingAmount = 0.02;
        this.player.position.y += Math.sin(time * breathingSpeed) * breathingAmount;
        
        // Subtle idle sway
        const swaySpeed = 1.5;
        const swayAmount = 0.01;
        this.player.rotation.z = Math.sin(time * swaySpeed) * swayAmount;
        
        // Head bobbing (animate the head if it exists)
        if (this.player.children.length > 0) {
            const head = this.player.children[0]; // First child should be head
            if (head) {
                head.rotation.y = Math.sin(time * 2) * 0.05; // Look around slightly
                head.position.y += Math.sin(time * 4) * 0.01; // Small head bob
            }
        }
        
        // Arm movement animation
        if (this.player.children.length > 4) {
            const leftArm = this.player.children[3]; // Left arm
            const rightArm = this.player.children[4]; // Right arm
            
            if (leftArm && rightArm) {
                // Subtle arm sway
                leftArm.rotation.z = Math.PI / 4 + Math.sin(time * 1.8) * 0.1;
                rightArm.rotation.z = -Math.PI / 4 - Math.sin(time * 1.8) * 0.1;
                
                // Breathing affects arms
                leftArm.rotation.x = Math.sin(time * 3) * 0.05;
                rightArm.rotation.x = Math.sin(time * 3) * 0.05;
            }
        }
        
        // Shotgun bobbing (if shotgun exists)
        if (this.player.children.length > 8) {
            const shotgunBarrel = this.player.children[7]; // Shotgun barrel
            const shotgunStock = this.player.children[8]; // Shotgun stock
            
            if (shotgunBarrel) {
                shotgunBarrel.rotation.x += Math.sin(time * 3) * 0.01;
                shotgunBarrel.position.y += Math.sin(time * 3) * 0.005;
            }
            
            if (shotgunStock) {
                shotgunStock.rotation.x += Math.sin(time * 3) * 0.01;
                shotgunStock.position.y += Math.sin(time * 3) * 0.005;
            }
        }
        
        // Walking animation when moving
        if (this.keys['ArrowLeft'] || this.keys['ArrowRight'] || this.keys['ArrowUp'] || this.keys['ArrowDown'] ||
            this.keys['KeyA'] || this.keys['KeyD'] || this.keys['KeyW'] || this.keys['KeyS']) {
            
            const walkSpeed = 15;
            const walkCycle = time * walkSpeed;
            
            // Enhanced walking bobbing
            this.player.position.y += Math.sin(walkCycle) * 0.05;
            
            // Walking body rotation
            this.player.rotation.z += Math.sin(walkCycle) * 0.03;
            
            // Leg movement during walking
            if (this.player.children.length > 6) {
                const leftLeg = this.player.children[5]; // Left leg
                const rightLeg = this.player.children[6]; // Right leg
                
                if (leftLeg && rightLeg) {
                    leftLeg.rotation.x = Math.sin(walkCycle) * 0.3;
                    rightLeg.rotation.x = -Math.sin(walkCycle) * 0.3;
                }
            }
            
            // More pronounced arm swing when walking
            if (this.player.children.length > 4) {
                const leftArm = this.player.children[3];
                const rightArm = this.player.children[4];
                
                if (leftArm && rightArm) {
                    leftArm.rotation.z = Math.PI / 4 + Math.sin(walkCycle) * 0.2;
                    rightArm.rotation.z = -Math.PI / 4 - Math.sin(walkCycle) * 0.2;
                }
            }
        }
    }
    
    updateBullets() {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            bullet.position.y += 0.2;
            
            if (bullet.position.y > 6) {
                this.scene.remove(bullet);
                this.bullets.splice(i, 1);
            }
        }
    }
    
    updateHogs() {
        const time = Date.now() * 0.001;
        
        this.hogs.forEach(hog => {
            const userData = hog.userData;
            
            // Skip if stragler hasn't arrived yet
            if (userData.movementType === 'stragler' && userData.arrivalDelay > 0) {
                userData.arrivalDelay -= 0.016;
                return;
            }
            
            // Different movement patterns based on type
            switch(userData.movementType) {
                case 'swarm':
                    this.updateSwarmHog(hog, time);
                    break;
                case 'stragler':
                    this.updateStraglerHog(hog, time);
                    break;
                case 'elite':
                    this.updateEliteHog(hog, time);
                    break;
            }
            
            // Common animation for all hogs
            this.animateHog(hog, time);
        });
    }
    
    updateSwarmHog(hog, time) {
        const userData = hog.userData;
        
        // Swarm behavior - move toward children with some wandering
        if (!userData.targetChild && this.children.length > 0) {
            userData.targetChild = this.children[Math.floor(Math.random() * this.children.length)];
        }
        
        if (userData.targetChild) {
            const dx = userData.targetChild.position.x - hog.position.x;
            const dy = userData.targetChild.position.y - hog.position.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0.1) {
                // Calculate desired facing direction (head points in +X direction)
                const targetAngle = Math.atan2(dy, dx);
                
                // Gradually turn toward target
                let angleDiff = targetAngle - hog.rotation.y;
                // Normalize angle difference to [-π, π]
                while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
                while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
                
                // Turn gradually around Y-axis (keep belly down)
                const turnSpeed = 0.05;
                hog.rotation.y += angleDiff * turnSpeed;
                
                // Move forward in facing direction (head points in +X direction)
                const forward = userData.speed;
                hog.position.x += Math.cos(hog.rotation.y) * forward;
                hog.position.y += Math.sin(hog.rotation.y) * forward;
                
                // Add wandering by slightly adjusting rotation
                userData.wanderAngle += (Math.random() - 0.5) * 0.1;
                hog.rotation.y += userData.wanderAngle * 0.02;
            }
        } else {
            // Default: face downward and move forward
            const targetAngle = 0; // Facing down
            let angleDiff = targetAngle - hog.rotation.y;
            while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
            while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
            
            hog.rotation.y += angleDiff * 0.02;
            hog.position.y -= userData.speed;
        }
        
        // Add some flocking behavior - avoid crowding
        this.hogs.forEach(otherHog => {
            if (otherHog !== hog) {
                const dx = hog.position.x - otherHog.position.x;
                const dy = hog.position.y - otherHog.position.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 0.8 && distance > 0) {
                    // Turn away from crowding rather than sliding sideways
                    const avoidAngle = Math.atan2(dy, dx);
                    let angleDiff = avoidAngle - hog.rotation.y;
                    while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
                    while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
                    
                    hog.rotation.y += angleDiff * 0.02;
                }
            }
        });
    }
    
    updateStraglerHog(hog, time) {
        const userData = hog.userData;
        
        // Individual pathfinding toward children
        if (!userData.targetChild && this.children.length > 0) {
            userData.targetChild = this.children[Math.floor(Math.random() * this.children.length)];
        }
        
        if (userData.targetChild) {
            const dx = userData.targetChild.position.x - hog.position.x;
            const dy = userData.targetChild.position.y - hog.position.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0.1) {
                // Calculate desired facing direction (head points in +X direction)
                const targetAngle = Math.atan2(dy, dx);
                
                // Turn toward target
                let angleDiff = targetAngle - hog.rotation.y;
                while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
                while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
                
                const turnSpeed = 0.08; // Faster turning for straglers
                hog.rotation.y += angleDiff * turnSpeed;
                
                // Move forward in facing direction (head points in +X direction)
                hog.position.x += Math.cos(hog.rotation.y) * userData.speed;
                hog.position.y += Math.sin(hog.rotation.y) * userData.speed;
            }
        }
        
        // Add some random wandering by adjusting rotation
        userData.wanderAngle += (Math.random() - 0.5) * 0.05;
        hog.rotation.y += userData.wanderAngle * 0.01;
    }
    
    updateEliteHog(hog, time) {
        const userData = hog.userData;
        
        // Elite hogs are more aggressive and faster
        if (!userData.targetChild && this.children.length > 0) {
            // Target closest child
            let closestChild = null;
            let closestDistance = Infinity;
            
            this.children.forEach(child => {
                const distance = hog.position.distanceTo(child.position);
                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestChild = child;
                }
            });
            
            userData.targetChild = closestChild;
        }
        
        if (userData.targetChild) {
            const dx = userData.targetChild.position.x - hog.position.x;
            const dy = userData.targetChild.position.y - hog.position.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0.1) {
                // Calculate desired facing direction (head points in +X direction)
                const targetAngle = Math.atan2(dy, dx);
                
                // Add zigzag by modifying target angle
                userData.zigzagPhase += 0.1;
                const zigzagAngle = targetAngle + Math.sin(userData.zigzagPhase) * 0.3;
                
                // Turn toward zigzag direction
                let angleDiff = zigzagAngle - hog.rotation.y;
                while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
                while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
                
                const turnSpeed = 0.1; // Very fast turning for elites
                hog.rotation.y += angleDiff * turnSpeed;
                
                // Move forward in facing direction (head points in +X direction)
                hog.position.x += Math.cos(hog.rotation.y) * userData.speed;
                hog.position.y += Math.sin(hog.rotation.y) * userData.speed;
            }
        }
        
        // Charge behavior when close to children
        if (userData.targetChild) {
            const distance = hog.position.distanceTo(userData.targetChild.position);
            if (distance < 3) {
                userData.speed = Math.min(userData.speed * 1.01, 0.08); // Speed up when close
            }
        }
    }
    
    animateHog(hog, time) {
        const userData = hog.userData;
        
        // Walking animation
        const walkSpeed = 10;
        const walkCycle = time * walkSpeed + userData.walkPhase;
        
        // Subtle body bobbing while walking
        const bobAmount = userData.isElite ? 0.03 : 0.02;
        hog.position.y += Math.sin(walkCycle * 2) * bobAmount;
        
        // Minimal body rotation for walking (keep belly down)
        hog.rotation.z = Math.sin(walkCycle) * 0.03;
        
        // Enhanced leg animation - find and animate all legs
        hog.children.forEach(child => {
            if (child.userData && child.userData.legIndex !== undefined) {
                const legIndex = child.userData.legIndex;
                
                // Create proper walking gait - front legs opposite to back legs
                const isBackLeg = legIndex >= 2;
                const legPair = legIndex % 2; // 0 = left, 1 = right
                
                // Diagonal gait: front-left with back-right, front-right with back-left
                let legPhase = walkCycle + legPair * Math.PI;
                if (isBackLeg) {
                    legPhase += Math.PI; // Back legs opposite phase to front legs
                }
                
                // More pronounced leg movement
                child.rotation.x = Math.sin(legPhase) * 0.8;
                
                // Add slight forward/backward leg movement
                const baseZ = child.userData.baseZ || child.position.z;
                if (!child.userData.baseZ) child.userData.baseZ = baseZ;
                child.position.z = baseZ + Math.sin(legPhase) * 0.15;
                
                // Slight up/down movement for realistic stepping
                const baseY = child.userData.baseY || child.position.y;
                if (!child.userData.baseY) child.userData.baseY = baseY;
                child.position.y = baseY + Math.abs(Math.sin(legPhase)) * 0.08;
            }
        });
        
        // Subtle tail wagging
        hog.children.forEach(child => {
            if (child.userData && child.userData.isTail) {
                // Gentle tail wagging
                child.rotation.z = Math.sin(time * 4 + userData.animationOffset) * 0.2;
                child.rotation.y = Math.sin(time * 3 + userData.animationOffset) * 0.15;
                child.rotation.x = Math.sin(time * 2 + userData.animationOffset) * 0.05;
                
                // Subtle bounce to individual segments
                child.children.forEach((segment, index) => {
                    const segmentPhase = time * 6 + userData.animationOffset + index * 0.3;
                    const baseY = segment.userData.baseY || segment.position.y;
                    if (!segment.userData.baseY) segment.userData.baseY = baseY;
                    segment.position.y = baseY + Math.sin(segmentPhase) * 0.005;
                });
            }
        });
    }
    
    checkCollisions() {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            
            for (let j = this.hogs.length - 1; j >= 0; j--) {
                const hog = this.hogs[j];
                // Better hitbox detection for elongated pig body
                const dx = bullet.position.x - hog.position.x;
                const dy = bullet.position.y - hog.position.y;
                const dz = bullet.position.z - hog.position.z;
                
                // Pig body is cylindrical, roughly 0.8 long x 0.5 wide x 0.5 high
                // Create an elliptical hitbox that matches the pig's actual shape
                const hitboxWidth = 0.9;   // X-axis (length of pig)
                const hitboxHeight = 0.4;  // Y-axis (height of pig)
                const hitboxDepth = 0.4;   // Z-axis (width of pig)
                
                // Elliptical collision detection
                const normalizedDistance = (dx * dx) / (hitboxWidth * hitboxWidth) + 
                                         (dy * dy) / (hitboxHeight * hitboxHeight) + 
                                         (dz * dz) / (hitboxDepth * hitboxDepth);
                
                if (normalizedDistance < 1) {
                    this.scene.remove(bullet);
                    this.bullets.splice(i, 1);
                    this.killHog(hog);
                    break;
                }
            }
        }
        
        // Check if hogs reached the children
        for (let i = this.hogs.length - 1; i >= 0; i--) {
            const hog = this.hogs[i];
            
            for (let j = this.children.length - 1; j >= 0; j--) {
                const child = this.children[j];
                const distance = hog.position.distanceTo(child.position);
                
                if (distance < 0.6) {
                    // Create bone pile where child died
                    const bonePile = this.createBonePile(child.position);
                    this.scene.add(bonePile);
                    
                    // Remove child
                    this.scene.remove(child);
                    this.children.splice(j, 1);
                    this.childrenRemaining--;
                    document.getElementById('children').textContent = this.childrenRemaining;
                    
                    // Remove the hog too (it's busy eating)
                    this.scene.remove(hog);
                    this.hogs.splice(i, 1);
                    
                    // Play a different sound for eating children
                    this.playRandomSqueal();
                    
                    break;
                }
            }
        }
        
        // Check if all children are eaten
        if (this.children.length === 0) {
            this.showGameOver('All Children Eaten!', 'The hogs have won! Score: ' + this.score);
        }
        
        // Remove hogs that get too close to player (they give up and leave)
        for (let i = this.hogs.length - 1; i >= 0; i--) {
            const hog = this.hogs[i];
            if (hog.position.y < -4.8) {
                this.scene.remove(hog);
                this.hogs.splice(i, 1);
            }
        }
        
        // Check win condition
        if (this.hogs.length === 0) {
            this.showGameOver('You Win!', 'Score: ' + this.score);
        }
    }
    
    showGameOver(title, message) {
        document.getElementById('popupTitle').textContent = title;
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('gameOverPopup').style.display = 'block';
    }
    
    updateChildren() {
        const time = Date.now() * 0.001;
        const screenBounds = { x: 8, y: 6, minY: -5 };
        
        this.children.forEach(child => {
            const userData = child.userData;
            
            // Calculate panic level based on nearby hogs
            userData.panicLevel = this.calculateChildPanicLevel(child);
            
            // Find nearest hog threat
            const nearestHog = this.findNearestHog(child);
            
            // Update movement target based on threats
            userData.changeDirectionTimer -= 0.016;
            
            if (nearestHog && nearestHog.distance < 4) {
                // Flee from nearest hog
                const fleeX = child.position.x - nearestHog.hog.position.x;
                const fleeY = child.position.y - nearestHog.hog.position.y;
                const fleeDistance = Math.sqrt(fleeX * fleeX + fleeY * fleeY);
                
                if (fleeDistance > 0) {
                    userData.fleeDirection.x = fleeX / fleeDistance;
                    userData.fleeDirection.y = fleeY / fleeDistance;
                    userData.lastSafeDirection.x = userData.fleeDirection.x;
                    userData.lastSafeDirection.y = userData.fleeDirection.y;
                }
                
                // Set flee target
                userData.targetX = child.position.x + userData.fleeDirection.x * 3;
                userData.targetY = child.position.y + userData.fleeDirection.y * 2;
                
            } else if (userData.changeDirectionTimer <= 0 || userData.panicLevel > 0.3) {
                // Random panic movement or change direction
                const angle = Math.random() * Math.PI * 2;
                const distance = 1 + Math.random() * 3;
                
                userData.targetX = child.position.x + Math.cos(angle) * distance;
                userData.targetY = child.position.y + Math.sin(angle) * distance;
                userData.changeDirectionTimer = 0.5 + Math.random() * 1.5;
            }
            
            // Clamp targets to screen bounds
            userData.targetX = Math.max(-screenBounds.x, Math.min(screenBounds.x, userData.targetX));
            userData.targetY = Math.max(screenBounds.minY, Math.min(screenBounds.y, userData.targetY));
            
            // Move toward target
            const dx = userData.targetX - child.position.x;
            const dy = userData.targetY - child.position.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0.1) {
                const moveSpeed = userData.runSpeed * (1 + userData.panicLevel);
                child.position.x += (dx / distance) * moveSpeed;
                child.position.y += (dy / distance) * moveSpeed;
                
                // Smooth face movement direction
                const targetRotation = Math.atan2(dx, dy);
                child.rotation.y += (targetRotation - child.rotation.y) * 0.1 + Math.sin(time * 3) * userData.panicLevel * 0.1;
            }
            
            // Keep children in bounds
            child.position.x = Math.max(-screenBounds.x, Math.min(screenBounds.x, child.position.x));
            child.position.y = Math.max(screenBounds.minY, Math.min(screenBounds.y, child.position.y));
            
            // Smooth Z movement for 3D panic
            const targetZ = Math.sin(time * 0.5 + userData.animationOffset) * userData.panicLevel * 0.8;
            child.position.z += (targetZ - child.position.z) * 0.1;
            child.position.z = Math.max(-1.5, Math.min(1.5, child.position.z));
            
            // Smooth bobbing motion while running
            const bobAmount = 0.08 + userData.panicLevel * 0.1;
            const bobSpeed = 8 + userData.panicLevel * 4;
            child.position.y += Math.sin(time * bobSpeed + userData.bobPhase) * bobAmount;
            
            // Enhanced panic animations
            this.animateChild(child, time, userData.panicLevel);
        });
    }
    
    calculateChildPanicLevel(child) {
        let panicLevel = 0;
        const maxPanicDistance = 5;
        
        this.hogs.forEach(hog => {
            const distance = child.position.distanceTo(hog.position);
            if (distance < maxPanicDistance) {
                const threatLevel = (maxPanicDistance - distance) / maxPanicDistance;
                panicLevel = Math.max(panicLevel, threatLevel);
            }
        });
        
        return Math.min(panicLevel, 1);
    }
    
    findNearestHog(child) {
        let nearestHog = null;
        let nearestDistance = Infinity;
        
        this.hogs.forEach(hog => {
            const distance = child.position.distanceTo(hog.position);
            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestHog = hog;
            }
        });
        
        return nearestHog ? { hog: nearestHog, distance: nearestDistance } : null;
    }
    
    animateChild(child, time, panicLevel) {
        const userData = child.userData;
        
        // Smooth panic rotation
        child.rotation.x = Math.sin(time * (3 + panicLevel * 3) + userData.animationOffset) * 0.05 * (1 + panicLevel);
        
        // More dramatic arm swinging for panic
        if (child.children.length > 6) {
            const leftArm = child.children[3];
            const rightArm = child.children[4];
            
            if (leftArm && rightArm) {
                const armSwing = time * (12 + panicLevel * 8) + userData.animationOffset;
                const armIntensity = 0.6 + panicLevel * 0.4;
                
                leftArm.rotation.z = Math.PI / 6 + Math.sin(armSwing) * armIntensity;
                rightArm.rotation.z = -Math.PI / 6 - Math.sin(armSwing) * armIntensity;
                leftArm.rotation.x = Math.sin(armSwing * 1.3) * 0.3 * (1 + panicLevel);
                rightArm.rotation.x = -Math.sin(armSwing * 1.3) * 0.3 * (1 + panicLevel);
            }
        }
        
        // Leg movement for running (faster when panicked)
        if (child.children.length > 8) {
            const leftLeg = child.children[5];
            const rightLeg = child.children[6];
            
            if (leftLeg && rightLeg) {
                const legSwing = time * (10 + panicLevel * 8) + userData.animationOffset;
                leftLeg.rotation.x = Math.sin(legSwing) * 0.5;
                rightLeg.rotation.x = -Math.sin(legSwing) * 0.5;
            }
        }
        
        // Head movement - looking around frantically
        if (child.children.length > 0) {
            const head = child.children[0];
            if (head) {
                const headSpeed = 8 + panicLevel * 12;
                head.rotation.y = Math.sin(time * headSpeed + userData.animationOffset) * 0.4 * (1 + panicLevel);
                head.rotation.x = Math.sin(time * (headSpeed * 0.7) + userData.animationOffset) * 0.2;
            }
        }
    }
    
    updateSpotlight() {
        // Swing the spotlight back and forth
        this.spotlightAngle += 0.02;
        const swingRange = 6;
        const targetX = Math.sin(this.spotlightAngle) * swingRange;
        this.spotlightTarget.position.x = targetX;
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        const time = Date.now() * 0.001;
        
        this.updatePlayer();
        this.animatePlayer(time);
        this.updateBullets();
        this.updateHogs();
        this.updateChildren();
        this.updateSpotlight();
        this.updateFog(time);
        this.checkCollisions();
        
        this.renderer.render(this.scene, this.camera);
    }
    
    updateFog(time) {
        // Create rolling fog effect like smoke machine
        this.fogTime += 0.02;
        const waveEffect = Math.sin(this.fogTime) * 0.03 + Math.cos(this.fogTime * 1.3) * 0.02;
        const pulseFog = this.fogDensity + waveEffect;
        this.scene.fog.density = Math.max(0.05, pulseFog);
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

// Start the game when the page loads
window.addEventListener('load', () => {
    new HogInvaders();
});