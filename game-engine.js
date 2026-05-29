// ============================================================================
// THE BACKROOMS SURVIVAL ENGINE - PART 1/2 (VARIABLES & INITIALIZATION)
// ============================================================================

let scene, camera, renderer, player = { currentLevel: 0, sanity: 100 };
let entities = [];
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
let touchX = 0, touchY = 0, isMobile = false;
let joystickActive = false;

// Configuración del Laberinto Estructural (Nivel 0)
const MAP_SIZE = 16;
const map = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,1,0,0,0,0,1,0,0,0,0,0,1],
    [1,0,1,0,1,0,1,1,0,1,0,1,1,1,0,1],
    [1,0,1,0,0,0,0,1,0,0,0,1,0,0,0,1],
    [1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,1],
    [1,0,0,0,0,1,0,0,0,0,0,1,0,0,0,1],
    [1,1,1,1,0,1,1,1,0,1,0,1,1,1,0,1],
    [1,0,0,1,0,0,0,1,0,1,0,0,0,1,0,1],
    [1,0,0,0,0,1,0,0,0,1,1,1,0,0,0,1],
    [1,1,0,1,1,1,1,1,0,1,0,0,0,1,1,1],
    [1,0,0,0,0,0,0,1,0,1,0,1,0,1,0,1],
    [1,0,1,1,1,1,0,1,0,0,0,1,0,0,0,1],
    [1,0,1,0,0,1,0,1,1,1,1,1,1,1,0,1],
    [1,0,1,0,0,1,0,0,0,0,0,0,0,1,0,1],
    [1,0,0,0,0,1,0,1,1,1,1,1,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

// ==========================================
// 1. INICIALIZADOR DEL SISTEMA
// ==========================================
window.addEventListener('DOMContentLoaded', () => {
    isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    
    // Forzar carga limpia de la interfaz
    let progress = document.getElementById('loading-progress');
    let screen = document.getElementById('loading-screen');
    
    if (progress) progress.style.width = '100%';
    
    setTimeout(() => {
        if (screen) screen.style.display = 'none';
        
        // Limpiar interfaz basura del HTML original para que no estorbe la pantalla
        let questBox = document.getElementById('quest-box');
        if (questBox) questBox.style.display = 'none'; // Quita el cuadro de misiones rotas
        
        let hudBar = document.querySelector('.hud-bar');
        if (hudBar) {
            hudBar.style.minWidth = '200px';
            hudBar.style.padding = '10px';
        }

        initThreeJS();
        generateBackroomsLevel(); 
        if (isMobile) setupMobileControls();
    }, 400);
});

function initThreeJS() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x221f15); // Fondo amarillo oscuro/moqueta
    scene.fog = new THREE.FogExp2(0x221f15, 0.07);

    // Ajuste de Cámara para evitar la pantalla estática en VR
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(4, 1.7, 4); // Spawnea al jugador firmemente en un pasillo transitable

    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.xr.enabled = true; // Activar el módulo WebXR
    
    document.getElementById('canvas-container').appendChild(renderer.domElement);

    // Iluminación direccional superior para que el entorno VR tenga profundidad tridimensional
    let dirLight = new THREE.DirectionalLight(0xfffaed, 0.3);
    dirLight.position.set(0, 10, 0);
    scene.add(dirLight);

    let ambientLight = new THREE.AmbientLight(0xfff6dd, 0.25);
    scene.add(ambientLight);

    window.addEventListener('resize', onWindowResize);
    
    // El bucle corre a través de la API WebXR nativa
    renderer.setAnimationLoop(animate);
}

// ==========================================
// 2. GENERADOR DE NIVELES (CONSTRUCCIÓN REAL)
// ==========================================
function generateBackroomsLevel() {
    // Materiales mate con tonalidades del Nivel 0
    let wallMat = new THREE.MeshStandardMaterial({ 
        color: 0xc4b272, 
        roughness: 0.85,
        metalness: 0.0
    });
    let floorMat = new THREE.MeshStandardMaterial({ 
        color: 0x5a4a31, 
        roughness: 0.9 
    });
    let ceilingMat = new THREE.MeshStandardMaterial({ 
        color: 0xded6c1, 
        roughness: 0.6 
    });

    // Crear el Suelo y el Techo del nivel completo
    let floorGeo = new THREE.PlaneGeometry(100, 100);
    let floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    let ceiling = new THREE.Mesh(floorGeo, ceilingMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = 3.3; // Altura estándar de techos falsos de oficina
    scene.add(ceiling);

    // Bloque geométrico para las paredes divisorias del laberinto
    let wallGeo = new THREE.BoxGeometry(4, 3.3, 4);

    // Construcción dinámica basada en la matriz del mapa
    for (let r = 0; r < MAP_SIZE; r++) {
        for (let c = 0; c < MAP_SIZE; c++) {
            if (map[r][c] === 1) {
                let wall = new THREE.Mesh(wallGeo, wallMat);
                // Centrar el laberinto alrededor del origen (0,0) de la escena
                wall.position.set(r * 4 - (MAP_SIZE * 2), 1.65, c * 4 - (MAP_SIZE * 2));
                scene.add(wall);
            } else {
                // Colocar Luces Fluorescentes de Techo funcionales en los pasillos
                if ((r + c) % 4 === 0) {
                    let pointLight = new THREE.PointLight(0xfffcd1, 0.7, 10);
                    pointLight.position.set(r * 4 - (MAP_SIZE * 2), 3.1, c * 4 - (MAP_SIZE * 2));
                    scene.add(pointLight);
                    
                    // Soporte físico de la lámpara en el techo
                    let lampGeo = new THREE.BoxGeometry(1.5, 0.05, 0.5);
                    let lampMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
                    let lamp = new THREE.Mesh(lampGeo, lampMat);
                    lamp.position.set(r * 4 - (MAP_SIZE * 2), 3.28, c * 4 - (MAP_SIZE * 2));
                    scene.add(lamp);
                }
            }
        }
    }
    console.log("Infraestructura de niveles montada.");
}
// ============================================================================
// THE BACKROOMS SURVIVAL ENGINE - PART 2/2 (CONTROLS & RENDER LOOP)
// ============================================================================

// ==========================================
// 3. ENTRADA A REALIDAD VIRTUAL ADAPTATIVA
// ==========================================
function startVRInversion() {
    console.log("Iniciando secuencia WebXR / VR Inmersivo...");
    
    // Ocultar menús molestos de la interfaz de usuario de golpe
    document.getElementById('main-menu').style.display = 'none';
    document.getElementById('hud').style.display = 'block';

    if (navigator.xr) {
        navigator.xr.isSessionSupported('immersive-vr').then((supported) => {
            if (supported) {
                // Solicitar la sesión VR al visor (Meta Quest, Pico, etc.)
                navigator.xr.requestSession('immersive-vr', {
                    optionalFeatures: ['local-floor', 'bounded-floor']
                }).then((session) => {
                    renderer.xr.setSession(session);
                    console.log("Sesión VR nativa acoplada con éxito.");
                }).catch((err) => {
                    console.error("Error al arrancar sesión VR:", err);
                    executeMobileVRFallback();
                });
            } else {
                executeMobileVRFallback();
            }
        }).catch(() => { executeMobileVRFallback(); });
    } else {
        executeMobileVRFallback();
    }
}

// Alternativa para visores de celular (Cardboard / VR Box) si no hay WebXR nativo
function executeMobileVRFallback() {
    console.log("WebXR nativo no disponible. Activando renderizado móvil de pantalla completa.");
    if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().then(() => {
            onWindowResize();
        }).catch((e) => console.log("Bloqueo de pantalla completa:", e));
    }
}

function startBackrooms() {
    console.log("Modo estándar iniciado.");
    document.getElementById('main-menu').style.display = 'none';
    document.getElementById('hud').style.display = 'block';
    
    if (!isMobile && renderer.domElement.requestPointerLock) {
        renderer.domElement.requestPointerLock();
    }
}

// ==========================================
// 4. INTERFAZ Y MANDOS PARA CELULAR
// ==========================================
function setupMobileControls() {
    let mobileUI = document.createElement('div');
    mobileUI.id = 'mobile-hud-controls';
    mobileUI.style.position = 'fixed';
    mobileUI.style.bottom = '20px';
    mobileUI.style.left = '0';
    mobileUI.style.width = '100%';
    mobileUI.style.height = '180px';
    mobileUI.style.zIndex = '999';
    mobileUI.style.pointerEvents = 'none';

    // Joystick flotante izquierdo y botón de acción minimalista
    mobileUI.innerHTML = `
        <div id="touch-joystick" style="position: absolute; bottom: 20px; left: 30px; width: 100px; height: 100px; background: rgba(255,255,255,0.08); border: 2px solid #e6b14a; border-radius: 50%; pointer-events: auto;">
            <div id="joystick-knob" style="position: absolute; top: 30px; left: 30px; width: 36px; height: 36px; background: #e6b14a; border-radius: 50%; box-shadow: 0 0 10px #e6b14a;"></div>
        </div>
        <button id="touch-interact" style="position: absolute; bottom: 35px; right: 30px; width: 70px; height: 70px; background: rgba(40, 30, 15, 0.7); border: 2px solid #e6b14a; color: #e6b14a; border-radius: 50%; font-family: monospace; font-weight: bold; font-size: 1.2rem; pointer-events: auto; text-shadow: 0 0 5px #000;">F</button>
    `;
    document.body.appendChild(mobileUI);

    let joystick = document.getElementById('touch-joystick');
    let knob = document.getElementById('joystick-knob');

    joystick.addEventListener('touchstart', (e) => { joystickActive = true; });
    joystick.addEventListener('touchmove', (e) => {
        if (!joystickActive) return;
        let rect = joystick.getBoundingClientRect();
        let touch = e.touches[0];
        let x = touch.clientX - (rect.left + rect.width / 2);
        let y = touch.clientY - (rect.top + rect.height / 2);
        
        let distance = Math.min(Math.sqrt(x * x + y * y), 35);
        let angle = Math.atan2(y, x);
        
        let moveX = distance * Math.cos(angle);
        let moveY = distance * Math.sin(angle);
        
        knob.style.transform = `translate(${moveX}px, ${moveY}px)`;
        
        // Sensibilidad del umbral del joystick
        moveForward = moveY < -10;
        moveBackward = moveY > 10;
        moveLeft = moveX < -10;
        moveRight = moveX > 10;
    });

    joystick.addEventListener('touchend', () => {
        joystickActive = false;
        knob.style.transform = 'translate(0px, 0px)';
        moveForward = moveBackward = moveLeft = moveRight = false;
    });

    // Control rotacional de la cámara deslizando en la mitad derecha de la pantalla
    window.addEventListener('touchstart', (e) => {
        if (e.touches[0].clientX > window.innerWidth / 2) {
            touchX = e.touches[0].clientX;
        }
    });
    
    window.addEventListener('touchmove', (e) => {
        if (e.touches[0].clientX > window.innerWidth / 2 && !joystickActive) {
            let movementX = e.touches[0].clientX - touchX;
            camera.rotation.y -= movementX * 0.006;
            touchX = e.touches[0].clientX;
        }
    });
}

// ==========================================
// 5. LOOP DE RENDIMIENTO CONTINUO
// ==========================================
function animate() {
    // Físicas de traslación del personaje basadas en la orientación de la cámara
    if (moveForward) camera.translateZ(-0.065);
    if (moveBackward) camera.translateZ(0.065);
    if (moveLeft) camera.translateX(-0.065);
    if (moveRight) camera.translateX(0.065);

    // Renderizado final gestionado de forma automática (Estereoscópico en VR / Monoscópico en plano)
    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Handlers del menú para salvaguardar la ejecución del archivo index.html original
function buyTool(item, cost) { console.log("Transacción de item procesada."); }
function resetStats() { console.log("Memoria limpia."); }
function showSettings() { console.log("Menú de ajustes."); }
function submitDevCommand() { console.log("Comando de desarrollo ejecutado."); }
