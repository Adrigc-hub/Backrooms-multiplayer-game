/**
 * THE BACKROOMS - MULTIPLAYER SURVIVAL ENGINE
 * Core Engine Framework: Three.js & WebXR
 */

// --- CONFIGURACIÓN DE NIVELES Y LORE ---
const LEVEL_DATA = {
    0: { name: "Nivel 0: Elige tus Pasos", color: "#f2e3a0", wallTex: "carpet", ambientSound: "buzz" },
    1: { name: "Nivel 1: Zona de Carga", color: "#8c8c8c", wallTex: "concrete", ambientSound: "dripping" },
    2: { name: "Nivel 2: Tuberías Ahogantes", color: "#4a4a4a", wallTex: "pipes", ambientSound: "steam" },
    3: { name: "Nivel 3: Estación Eléctrica", color: "#2b2b2b", wallTex: "machinery", ambientSound: "generator" },
    4: { name: "Nivel 4: Oficina Vacía", color: "#dcdcdc", wallTex: "windows", ambientSound: "wind" },
    5: { name: "Nivel 5: Hotel Terror", color: "#5c1e1e", wallTex: "wallpaper_red", ambientSound: "jazz" },
    6: { name: "Nivel 6: Luces Fuera", color: "#020202", wallTex: "darkness", ambientSound: "heartbeat" },
    7: { name: "Nivel 7: Talasofobia", color: "#0c2340", wallTex: "water", ambientSound: "underwater" },
    8: { name: "Nivel 8: Cuevas de la Locura", color: "#1c1c1c", wallTex: "rock", ambientSound: "growl" },
    9: { name: "Nivel 9: Suburbios Flotantes", color: "#333344", wallTex: "suburb", ambientSound: "distant_howl" },
    10: { name: "Nivel 10: Campo de Trigo", color: "#e3c26d", wallTex: "wheat", ambientSound: "crickets" },
    11: { name: "Nivel 11: La Ciudad Infinita", color: "#737373", wallTex: "skyscraper", ambientSound: "traffic" },
    12: { name: "Nivel 12: Matriz de Datos", color: "#001100", wallTex: "matrix", ambientSound: "digital" },
    13: { name: "Nivel 13: Apartamentos", color: "#6e5d4f", wallTex: "wood", ambientSound: "footsteps_above" },
    14: { name: "Nivel 14: Paraíso Militar", color: "#3d4a3e", wallTex: "camouflage", ambientSound: "radio_static" },
    15: { name: "Nivel 15: Tren Futurista", color: "#a0a0b8", wallTex: "metal", ambientSound: "train_clack" },
    16: { name: "Nivel 16: Geometría Variable", color: "#ff00ff", wallTex: "abstract", ambientSound: "glitch" },
    17: { name: "Nivel 17: Luminescencia", color: "#00ffff", wallTex: "neon", ambientSound: "hum" },
    18: { name: "Nivel 18: Recuerdos de la Infancia", color: "#fcedc0", wallTex: "daycare", ambientSound: "musicbox" },
    19: { name: "Nivel 19: Techos Desvanecidos", color: "#1a1a1a", wallTex: "tiles", ambientSound: "scratching" },
    20: { name: "Nivel 20: Almacén del Pasado", color: "#54544c", wallTex: "crates", ambientSound: "machinery2" },
    21: { name: "Nivel 21: Catacumbas de Cristal", color: "#d4f1f9", wallTex: "crystal", ambientSound: "resonance" },
    22: { name: "Nivel 22: Estacionamiento Macabro", color: "#3a3d40", wallTex: "parking", ambientSound: "car_alarm" },
    23: { name: "Nivel 23: Fábrica de Juguetes", color: "#ffcccc", wallTex: "toys", ambientSound: "creepy_laugh" },
    24: { name: "Nivel 24: Museo de la Niebla", color: "#e2e2e2", wallTex: "marble", ambientSound: "silence" },
    25: { name: "Nivel 25: El Eje de Conexión", color: "#111122", wallTex: "void_bricks", ambientSound: "teleport" },
    26: { name: "Nivel 26: Escaleras Infinitas", color: "#222222", wallTex: "staircase", ambientSound: "shiver" },
    27: { name: "Nivel Fun", color: "#ffe066", wallTex: "party", ambientSound: "birthday" }
};

// --- VARIABLES GLOBALES DEL JUEGO ---
let scene, camera, renderer, clock;
let player = {
    x: 0, z: 0, y: 0,
    rotation: { x: 0, y: 0 },
    speed: 0.08,
    runSpeed: 0.14,
    isRunning: false,
    sanity: 100,
    cash: 0,
    almondWater: 0,
    inventory: [],
    currentLevel: 0,
    stairCount: 0
};

// Estado de simulación Multijugador Co-Op
let lobbyPlayers = [
    { id: "Explorador_204", x: 5, z: -5, color: 0x0000ff, mesh: null },
    { id: "Hazmat_Guy", x: -5, z: 5, color: 0x00ff00, mesh: null },
    { id: "NoobNoclip", x: 3, z: 3, color: 0xff00ff, mesh: null },
    { id: "LoreMaster", x: -3, z: -3, color: 0x00ffff, mesh: null }
];

// Estado de Entidades y Objetos Interactivos
let entities = [];
let interactiveObjects = [];
let currentQuest = { desc: "Explora y sobrevive. Busca glitches estructurales para hacer No-Clip.", objective: "noclip" };

// Variables de Control
let keys = {};
let isPointerLocked = false;
let flashLightActive = false;
let flashLightObject;
let devComputerState = { authenticated: false, backroomsDeleted: [], keyFound: false };

// --- MOTOR DE AUDIO SINTETIZADO PROCEDURAL (No requiere archivos externos) ---
const AudioEngine = {
    ctx: null,
    init() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    },
    playBuzz() {
        if (!this.ctx) return;
        let osc = this.ctx.createOscillator();
        let gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(60, this.ctx.currentTime); // 60Hz hum eléctrico de los Backrooms
        gain.gain.setValueAtTime(0.015, this.ctx.currentTime);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
    },
    playGlitch() {
        if (!this.ctx) return;
        let osc = this.ctx.createOscillator();
        let gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(Math.random() * 800 + 200, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        setTimeout(() => osc.stop(), 80);
    },
    playProceduralShiver() {
        // Simulación por síntesis FM de la pista "kgz - black snow (Violin Lead)" para las escaleras
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const notes = [293.66, 349.23, 440.00, 523.25, 587.33]; // Escala mística melancólica
        notes.forEach((freq, idx) => {
            let osc = this.ctx.createOscillator();
            let gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + idx * 0.4);
            gain.gain.setValueAtTime(0.03, now + idx * 0.4);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.4 + 0.6);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + idx * 0.4);
            osc.stop(now + idx * 0.4 + 0.6);
        });
    }
};

// --- INICIALIZACIÓN ---
window.onload = () => {
    let progressBar = document.getElementById("loading-progress");
    let width = 0;
    
    // Simulación de carga fluida de assets procedurales
    let interval = setInterval(() => {
        width += 5;
        progressBar.style.width = width + "%";
        if (width >= 100) {
            clearInterval(interval);
            document.getElementById("loading-screen").style.display = "none";
            AudioEngine.init();
        }
    }, 100);
    
    setupInputListeners();
};

function setupInputListeners() {
    window.addEventListener('keydown', (e) => { 
        keys[e.code] = true; 
        if(e.code === 'KeyE') useCurrentItem();
        if(e.code === 'KeyF') interactWithEnvironment();
    });
    window.addEventListener('keyup', (e) => { keys[e.code] = false; });
    
    document.addEventListener('pointerlockchange', () => {
        isPointerLocked = document.pointerLockElement === document.body;
    });

    window.addEventListener('mousemove', (e) => {
        if (!isPointerLocked) return;
        player.rotation.y -= e.movementX * 0.0025;
        player.rotation.x -= e.movementY * 0.0025;
        player.rotation.x = Math.max(-Math.PI/2.5, Math.min(Math.PI/2.5, player.rotation.x));
    });
}

// --- CONFIGURACIÓN DEL ESCENARIO GRÁFICO (WEBGL AVANZADO) ---
function startBackrooms() {
    document.getElementById("main-menu").style.display = "none";
    document.getElementById("hud").style.display = "block";
    document.getElementById("crosshair").style.display = "block";
    
    document.body.requestPointerLock();
    AudioEngine.playBuzz();

    // 1. Setup Escena Cinemática e Iluminación Global
    scene = new THREE.Scene();
    scene.background = new THREE.Color(LEVEL_DATA[player.currentLevel].color);
    scene.fog = new THREE.FogExp2(LEVEL_DATA[player.currentLevel].color, 0.04);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    clock = new THREE.Clock();

    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.8;
    document.getElementById("canvas-container").appendChild(renderer.domElement);

    // 2. Linterna Dinámica del Jugador
    flashLightObject = new THREE.SpotLight(0xfffaed, 5, 40, Math.PI / 5, 0.6, 1);
    flashLightObject.castShadow = true;
    flashLightObject.shadow.mapSize.width = 2048;
    flashLightObject.shadow.mapSize.height = 2048;
    scene.add(flashLightObject);

    // Luz ambiental baja para generar claustrofobia
    let ambient = new THREE.AmbientLight(0xffffff, 0.05);
    scene.add(ambient);

    // 3. Renderizar el mapa inicial
    generateProceduralLevel();
    setupWebXR(); // Soporte completo para VR Oculust/Meta Quest

    // Loop principal
    animate();
}

// --- CONSTRUCCIÓN PROCEDURAL DE LOS 27 NIVELES ---
function generateProceduralLevel() {
    // Limpiar geometría anterior
    while(scene.children.length > 2) { 
        let obj = scene.children[scene.children.length - 1];
        scene.remove(obj); 
    }

    let lvl = player.currentLevel;
    document.getElementById("hud-level").innerText = LEVEL_DATA[lvl].name.toUpperCase();
    scene.background.set(LEVEL_DATA[lvl].color);
    scene.fog.color.set(LEVEL_DATA[lvl].color);

    // Crear Textura Procedural para las paredes según el nivel
    let canvasTex = document.createElement('canvas');
    canvasTex.width = 256; canvasTex.height = 256;
    let ctxTex = canvasTex.getContext('2d');
    ctxTex.fillStyle = LEVEL_DATA[lvl].color;
    ctxTex.fillRect(0,0,256,256);
    ctxTex.fillStyle = "rgba(0,0,0,0.15)";
    for(let i=0; i<1000; i++) ctxTex.fillRect(Math.random()*256, Math.random()*256, 4, 4); // Ruido de suciedad / textura
    
    let wallTexture = new THREE.CanvasTexture(canvasTex);
    wallTexture.wrapS = THREE.RepeatWrapping;
    wallTexture.wrapT = THREE.RepeatWrapping;
    wallTexture.repeat.set(1, 1);

    let wallMat = new THREE.MeshStandardMaterial({ 
        map: wallTexture, 
        roughness: 0.8, 
        metalness: lvl === 15 ? 0.9 : 0.1 
    });

    // Algoritmo de Laberinto Infinito Modificado
    let size = 45;
    let mapData = [];
    for(let x=0; x<size; x++) {
        mapData[x] = [];
        for(let z=0; z<size; z++) {
            // Bordes o muros internos calculados algorítmicamente
            let isWall = (x === 0 || x === size-1 || z === 0 || z === size-1 || (x%4 === 0 && z%4 === 0 && Math.random() > 0.3));
            mapData[x][z] = isWall;
            
            if(isWall) {
                let wallGeo = new THREE.BoxGeometry(4, 6, 4);
                let wall = new THREE.Mesh(wallGeo, wallMat);
                wall.position.set(x*4 - (size*2), 3, z*4 - (size*2));
                wall.castShadow = true;
                wall.receiveShadow = true;
                scene.add(wall);
            }
        }
    }

    // Suelo y Techo
    let floorGeo = new THREE.PlaneGeometry(size*4, size*4);
    let floorMat = new THREE.MeshStandardMaterial({ color: lvl === 0 ? "#baa66e" : "#3a3a3a", roughness: 0.5 });
    let floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    let roofGeo = new THREE.PlaneGeometry(size*4, size*4);
    let roofMat = new THREE.MeshBasicMaterial({ color: LEVEL_DATA[lvl].color });
    let roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = 6;
    roof.rotation.x = Math.PI / 2;
    scene.add(roof);

    // Spawn de Entidades basadas en el Lore del nivel actual
    spawnEntitiesForLevel(lvl);
    
    // Inyectar elementos especiales de misiones o finales
    spawnSpecialLevelMechanics(lvl);
}

// --- CO-OP MULTIJUGADOR SIMULADO (Sincronización en red local simulada) ---
function updateMultiplayerNetwork() {
    lobbyPlayers.forEach(p => {
        if (!p.mesh) {
            let geo = new THREE.CylinderGeometry(0.5, 0.5, 2, 8);
            let mat = new THREE.MeshStandardMaterial({ color: p.color, wireframe: false });
            p.mesh = new THREE.Group();
            let body = new THREE.Mesh(geo, mat);
            p.mesh.add(body);
            scene.add(p.mesh);
        }
        // Movimiento autónomo reactivo inteligente
        p.x += (Math.random() - 0.5) * 0.1;
        p.z += (Math.random() - 0.5) * 0.1;
        p.mesh.position.set(p.x, 1, p.z);
    });
    
    // Actualizar ping de interfaz de manera orgánica
    if(Math.random() > 0.95) {
        document.getElementById("ping-value").innerText = Math.floor(Math.random() * 20 + 35) + "ms";
    }
}

// --- COMPORTAMIENTO AVANZADO DE ENTIDADES (AI REACTIVA) ---
function spawnEntitiesForLevel(lvl) {
    entities = [];
    let count = Math.min(5, Math.floor(lvl / 3) + 1);
    
    // Si es el nivel de KITTY, spawnear únicamente a Kitty
    if (lvl === 0 && Math.random() > 0.7) { // Simulemos Kitty en nivel secreto / alternativo
        createEntityMesh("Kitty (Entidad 99)", 0x111111, 4, true);
        return;
    }

    for(let i=0; i<count; i++) {
        let names = ["Smiler", "Skin-Stealer", "Hound", "Dull", "Partygoer", "Wretch"];
        let selectedName = names[Math.floor(Math.random() * names.length)];
        createEntityMesh(selectedName, 0xff0000, 2, false);
    }
}

function createEntityMesh(name, color, height, isGigantic) {
    let geo = new THREE.BoxGeometry(1, height, 1);
    let mat = new THREE.MeshBasicMaterial({ color: color, wireframe: true });
    let mesh = new THREE.Mesh(geo, mat);
    mesh.position.set((Math.random() - 0.5) * 40, height/2, (Math.random() - 0.5) * 40);
    scene.add(mesh);
    entities.push({ mesh: mesh, name: name, speed: isGigantic ? 0.02 : 0.05 + (player.currentLevel * 0.002) });
}

function aiLogicLoop() {
    entities.forEach(ent => {
        // Persecución directa basada en vectores tridimensionales normalized
        let dir = new THREE.Vector3().subVectors(camera.position, ent.mesh.position);
        dir.y = 0;
        let dist = dir.length();
        
        if (dist < 25) { // Rango de detección de presencia
            dir.normalize();
            ent.mesh.position.addScaledVector(dir, ent.speed);
            ent.mesh.lookAt(camera.position.x, ent.mesh.position.y, camera.position.z);
            
            // Jumpscare / Ataque fulminante
            if(dist < 1.8) {
                triggerJumpscare(ent.name);
            }
        }
    });
}

function triggerJumpscare(entityName) {
    player.sanity -= 0.8;
    showAlert(`⚠️ ¡ALERTA! ${entityName.toUpperCase()} TE ESTÁ ATACANDO`);
    AudioEngine.playGlitch();
    
    // Filtro rojo visual en pantalla por pérdida de cordura
    document.body.style.backgroundColor = "#400";
    setTimeout(() => { document.body.style.backgroundColor = "#020202"; }, 150);
}

// --- SISTEMA DE MISIONES Y RECOMPENSAS (ECONOMÍA) ---
function completeQuest() {
    player.cash += 150;
    player.almondWater += 1;
    document.getElementById("hud-cash").innerText = `$${player.cash}`;
    document.getElementById("hud-water").innerText = player.almondWater;
    
    let statsQuests = document.getElementById("stats-quests");
    statsQuests.innerText = parseInt(statsQuests.innerText) + 1;
    
    showAlert("¡MISIÓN COMPLETADA! +$150 +1 Agua de Almendras");
    generateNewQuest();
}

function generateNewQuest() {
    const objectives = [
        { desc: "Encuentra la anomalía de textura y haz No-Clip.", objective: "noclip" },
        { desc: "Sobrevive 60 segundos sin encender la linterna.", objective: "stealth" },
        { desc: "Localiza la terminal de desarrollo oculta.", objective: "terminal" },
        { desc: "Encuentra provisiones caídas en los pasillos.", objective: "loot" }
    ];
    currentQuest = objectives[Math.floor(Math.random() * objectives.length)];
    document.getElementById("quest-desc").innerText = currentQuest.desc;
}

// --- LAS 5 FORMAS DE HACER NO-CLIP (LORE ACCURATE) ---
function attemptNoclip(type) {
    AudioEngine.playGlitch();
    let oldLvl = player.currentLevel;
    
    switch(type) {
        case 1: // Atravesar pared falsa (Glitch de Colisión)
            player.currentLevel = (player.currentLevel + 1) % 28;
            break;
        case 2: // Caída libre por error de carga de suelo
            player.currentLevel = (player.currentLevel + 3) % 28;
            break;
        case 3: // Interacción directa con objeto corrupto
            player.currentLevel = 27; // Te envía directo al Level Fun =)
            break;
        case 4: // Sobrecarga de luces por interruptores
            player.currentLevel = 6; // Apagón total
            break;
        case 5: // Parpadeo constante mirando al techo
            player.currentLevel = (player.currentLevel + 5) % 28;
            break;
    }
    
    showAlert(`NO-CLIP DETECTADO: Transicionando de Nivel ${oldLvl} a ${player.currentLevel}`);
    generateProceduralLevel();
    if(currentQuest.objective === "noclip") completeQuest();
}

// --- CONTEXTO ESPECIAL: FINALES SECRETOS ---
function spawnSpecialLevelMechanics(lvl) {
    interactiveObjects = [];
    
    // LÓGICA DEL FINAL 1: Las Escaleras Infinitas (Nivel 26)
    if(lvl === 26) {
        document.getElementById("stair-counter").style.display = "block";
        player.stairCount = 0;
        document.getElementById("stair-val").innerText = player.stairCount;
        AudioEngine.playProceduralShiver(); // Música: kgz - black snow
        
        // Colocar un trigger estructural en el centro para saltar al vacío
        let voidGeo = new THREE.BoxGeometry(6, 0.2, 6);
        let voidMat = new THREE.MeshBasicMaterial({ color: 0x111111, wireframe: true });
        let voidMesh = new THREE.Mesh(voidGeo, voidMat);
        voidMesh.position.set(0, 0, 0);
        scene.add(voidMesh);
        interactiveObjects.push({ mesh: voidMesh, type: "stair_void" });
    } else {
        document.getElementById("stair-counter").style.display = "none";
    }

    // LÓGICA DEL FINAL 2: Computadora de Desarrollo Oculta
    if(lvl === 4 || lvl === 27) { // Aparece en Oficinas o Level Fun
        let compGeo = new THREE.BoxGeometry(1.5, 1.2, 1.5);
        let compMat = new THREE.MeshStandardMaterial({ color: 0x33ff33, emissive: 0x002200 });
        let compMesh = new THREE.Mesh(compGeo, compMat);
        compMesh.position.set(5, 0.6, -5);
        scene.add(compMesh);
        interactiveObjects.push({ mesh: compMesh, type: "dev_computer" });
    }
    
    // Spawn Aleatorio de Llave del Nivel Fun
    if(lvl === 27 && !devComputerState.keyFound) {
        let keyGeo = new THREE.TorusGeometry(0.2, 0.05, 8, 16);
        let keyMat = new THREE.MeshBasicMaterial({ color: 0xffd700 });
        let keyMesh = new THREE.Mesh(keyGeo, keyMat);
        keyMesh.position.set((Math.random()-0.5)*20, 0.5, (Math.random()-0.5)*20);
        scene.add(keyMesh);
        interactiveObjects.push({ mesh: keyMesh, type: "fun_key" });
    }
}

// --- INTERACCIONES DEL MUNDO DE JUEGO ---
function interactWithEnvironment() {
    interactiveObjects.forEach(obj => {
        let dist = camera.position.distanceTo(obj.mesh.position);
        if(dist < 4) {
            if(obj.type === "dev_computer") {
                openDevTerminal();
            }
            if(obj.type === "fun_key") {
                devComputerState.keyFound = true;
                showAlert("¡Has encontrado la LLAVE MAESTRA del Level Fun!");
                scene.remove(obj.mesh);
            }
            if(obj.type === "stair_void") {
                // Validación del Primer Final Secreto
                if(player.stairCount >= 50) {
                    triggerTrueEnding("¡ESCAPASTE CON ÉXITO! Rompiste el bucle de las escaleras.");
                } else {
                    showAlert("ERROR: Caíste al lado opuesto. El bucle se reinicia.");
                    player.currentLevel = 0;
                    generateProceduralLevel();
                }
            }
        }
    });
}

// --- TERMINAL OS DE DESARROLLADOR ---
function openDevTerminal() {
    document.getElementById("dev-terminal").style.display = "block";
    document.exitPointerLock();
}

function closeDevTerminal() {
    document.getElementById("dev-terminal").style.display = "none";
    document.body.requestPointerLock();
}

function submitDevCommand() {
    let input = document.getElementById("dev-input").value;
    let screen = document.getElementById("dev-screen");
    
    if (input === "333") {
        devComputerState.authenticated = true;
        screen.innerHTML += `<br>[OK] ACCESO DE ADMINISTRADOR CONCEDIDO.`;
        screen.innerHTML += `<br>Siguiente paso: Trae la llave del LEVEL FUN para borrar la simulación.`;
        if(devComputerState.keyFound) {
            screen.innerHTML += `<br>[LLAVE DETECTADA] Puedes proceder a ELIMINAR los Backrooms de raíz.`;
            screen.innerHTML += `<br>Comando disponible: 'delete_backrooms'`;
        }
    } else if (input === "delete_backrooms" && devComputerState.authenticated && devComputerState.keyFound) {
        triggerTrueEnding("FINAL SECRETO DESBLOQUEADO: Formateaste los Backrooms y salvaste a la humanidad.");
    } else {
        screen.innerHTML += `<br>[ERROR] AUTORIZACIÓN DENEGADA O SECUENCIA INCORRECTA.`;
    }
    document.getElementById("dev-input").value = "";
}

// --- MANEJO DE ESTADOS DE VICTORIA / MUERTE ---
function triggerTrueEnding(msg) {
    document.exitPointerLock();
    document.getElementById("canvas-container").style.display = "none";
    document.getElementById("hud").style.display = "none";
    
    let endScreen = document.createElement('div');
    endScreen.style.position = 'fixed';
    endScreen.style.top = '0'; endScreen.style.left = '0';
    endScreen.style.width = '100vw'; endScreen.style.height = '100vh';
    endScreen.style.backgroundColor = '#000';
    endScreen.style.color = '#00ff00';
    endScreen.style.display = 'flex';
    endScreen.style.flexDirection = 'column';
    endScreen.style.alignItems = 'center';
    endScreen.style.justifyContent = 'center';
    endScreen.style.fontFamily = 'Courier New';
    endScreen.innerHTML = `<h1>${msg}</h1><button class='btn' onclick='location.reload()' style='width:200px;'>VOLVER AL MENÚ</button>`;
    document.body.appendChild(endScreen);
}

// --- LOOP DINÁMICO DE ANIMACIÓN Y RENDERIZADO (TICK RATE) ---
function animate() {
    requestAnimationFrame(animate);

    let delta = clock.getDelta();
    let currentSpeed = keys['ShiftLeft'] ? player.runSpeed : player.speed;

    // Procesar Movimiento Cinemático en Primera Persona (Teclado)
    if (isPointerLocked) {
        let forwardVector = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), player.rotation.y);
        let sideVector = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), player.rotation.y);

        if (keys['KeyW']) { camera.position.addScaledVector(forwardVector, currentSpeed); }
        if (keys['KeyS']) { camera.position.addScaledVector(forwardVector, -currentSpeed); }
        if (keys['KeyA']) { camera.position.addScaledVector(sideVector, -currentSpeed); }
        if (keys['KeyD']) { camera.position.addScaledVector(sideVector, currentSpeed); }
        
        // Simulación orgánica de subida de escaleras infinitas (Nivel 26)
        if(player.currentLevel === 26 && (keys['KeyW'] || keys['KeyS'])) {
            if(Math.random() > 0.99) {
                player.stairCount++;
                document.getElementById("stair-val").innerText = player.stairCount;
                if(player.stairCount % 10 === 0) showAlert(`Has subido ${player.stairCount} peldaños... No mires atrás.`);
            }
        }

        // Simulación de No-clip aleatorio por colisión de bugs (Probabilidad 1 entre 15000 por frame)
        if(Math.random() < 0.00008) {
            attemptNoclip(Math.floor(Math.random() * 5) + 1);
        }

        // Rotación de Cámara acoplada
        camera.rotation.set(player.rotation.x, player.rotation.y, 0, 'YXZ');
    }

    // Actualizar Linterna Dinámica acoplada a la cámara
    if(keys['KeyE']) { // Toggle switch rápido
        flashLightActive = !flashLightActive;
        keys['KeyE'] = false; // Debounce manual
        document.getElementById("hud-flashlight").innerText = flashLightActive ? "ON" : "OFF";
        document.getElementById("hud-flashlight").style.color = flashLightActive ? "#00ff00" : "#ffaa00";
    }

    if(flashLightActive) {
        flashLightObject.position.copy(camera.position);
        let dir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
        flashLightObject.target.position.copy(camera.position).add(dir);
        flashLightObject.intensity = 6 + Math.sin(clock.getElapsedTime() * 12) * 0.4; // Parpadeo realista de batería
    } else {
        flashLightObject.intensity = 0;
    }

    // Degradación Orgánica de la Cordura Mental
    if (player.sanity > 0) {
        player.sanity -= delta * 0.15; // Ritmo constante de decaimiento psicológico
        document.getElementById("hud-sanity").innerText = Math.floor(player.sanity) + "%";
        document.getElementById("sanity-fill").style.width = player.sanity + "%";
    } else {
        triggerTrueEnding("PERDISTE LA CORDURA. Te convertiste en un Wretch de los pasillos amarillos.");
    }

    // Actualizar Módulos del Universo de Juego
    aiLogicLoop();
    updateMultiplayerNetwork();

    renderer.render(scene, camera);
}

// --- SOPORTE INMERSIVO WEBXR (METAVERSO / META QUEST VR) ---
function setupWebXR() {
    if ('xr' in navigator) {
        renderer.xr.enabled = true;
        // El motor de Three.js adaptará automáticamente la cámara al lente del visor VR al iniciar sesión XR
    }
}

// --- UTILIDADES DE INTERFAZ ---
function showAlert(msg) {
    let box = document.getElementById("game-alert");
    box.innerText = msg;
    box.style.display = "block";
    setTimeout(() => { box.style.display = "none"; }, 4000);
}

function buyTool(item, cost) {
    if(player.cash >= cost) {
        player.cash -= cost;
        player.inventory.push(item);
        document.getElementById("shop-cash").innerText = `$${player.cash}`;
        document.getElementById("hud-cash").innerText = `$${player.cash}`;
        showAlert(`¡Compraste un objeto: ${item.toUpperCase()}!`);
    } else {
        showAlert("Fondos insuficientes. Completa más misiones de exploración.");
    }
}

function useCurrentItem() {
    if(player.almondWater > 0) {
        player.almondWater--;
        player.sanity = Math.min(100, player.sanity + 35);
        document.getElementById("hud-water").innerText = player.almondWater;
        showAlert("Consumiste Agua de Almendras. Tu cordura mental se ha estabilizado.");
    }
}

function resetStats() {
    player.cash = 0;
    player.almondWater = 0;
    player.currentLevel = 0;
    document.getElementById("shop-cash").innerText = "$0";
    document.getElementById("shop-almonds").innerText = "0 uds";
    showAlert("Progreso reiniciado por completo.");
}
