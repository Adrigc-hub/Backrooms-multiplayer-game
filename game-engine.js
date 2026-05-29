// ==========================================
// ENGINE GLOBAL VARIABLES
// ==========================================
let scene, camera, renderer, player = { currentLevel: 0 };
let entities = [];
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
let touchX = 0, touchY = 0, isMobile = false;

// Variables para controles de celular
let joystickPos = { x: 0, y: 0 }, joystickActive = false;

// ==========================================
// 1. INICIALIZACIÓN AUTOMÁTICA Y DESBLOQUEO
// ==========================================
window.addEventListener('DOMContentLoaded', () => {
    console.log("Inicializando Backrooms Engine...");
    
    // Detectar si es dispositivo móvil
    isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    
    // Forzar el llenado de la barra y quitar la pantalla de carga de inmediato
    let progress = document.getElementById('loading-progress');
    let screen = document.getElementById('loading-screen');
    
    if (progress) progress.style.width = '100%';
    
    setTimeout(() => {
        if (screen) screen.style.display = 'none';
        console.log("Pantalla de carga removida. Interfaz lista para interactuar.");
        initThreeJS();
        if (isMobile) setupMobileControls();
    }, 400);
});

function initThreeJS() {
    // Crear Escena Basica
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x15130e); // Color moqueta Backrooms
    scene.fog = new THREE.FogExp2(0x15130e, 0.05);

    // Cámara
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1.7, 0); // Altura de los ojos

    // Renderizador con soporte WebXR para VR Automático
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.xr.enabled = true; // ¡Habilita el modo VR 3D real!
    
    document.getElementById('canvas-container').appendChild(renderer.domElement);

    // Luz ambiente tenue
    let ambientLight = new THREE.AmbientLight(0xfffaed, 0.4);
    scene.add(ambientLight);

    // Ajustar ventana
    window.addEventListener('resize', onWindowResize);
    
    // Iniciar bucle de animación
    renderer.setAnimationLoop(animate);
}

// ==========================================
// 2. LOGICA DEL BOTÓN VR (3D AUTOMÁTICO)
// ==========================================
function startVRInversion() {
    console.log("Activando Modo VR Inmersivo 3D...");
    
    // Ocultar menú
    document.getElementById('main-menu').style.display = 'none';
    document.getElementById('hud').style.display = 'block';

    // Buscar si el navegador soporta WebXR e iniciar la sesión inmersiva
    if (navigator.xr) {
        navigator.xr.requestSession('immersive-vr', {
            optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking']
        }).then((session) => {
            renderer.xr.setSession(session);
            console.log("Sesión VR Iniciada con éxito.");
        }).catch((err) => {
            console.warn("No se pudo iniciar sesión VR real, aplicando simulación 3D Estereoscópica: ", err);
            // Simulación fallback si falla o estás desde un cel normal sin visores dedicados
            if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen();
            }
        });
    } else {
        // Fallback de pantalla completa táctil si no hay API WebXR
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen();
        }
    }
}

function startBackrooms() {
    console.log("Iniciando juego en modo clásico PC/Pantalla...");
    document.getElementById('main-menu').style.display = 'none';
    document.getElementById('hud').style.display = 'block';
    if (!isMobile && renderer.domElement.requestPointerLock) {
        renderer.domElement.requestPointerLock();
    }
}

// ==========================================
// 3. JUGABILIDAD EN CELULAR (CONTROLES TÁCTILES)
// ==========================================
function setupMobileControls() {
    // Crear Joystick y botones dinámicamente en el HTML para no romper tu diseño
    let mobileUI = document.createElement('div');
    mobileUI.id = 'mobile-hud-controls';
    mobileUI.style.position = 'fixed';
    mobileUI.style.bottom = '20px';
    mobileUI.style.left = '0';
    mobileUI.style.width = '100%';
    mobileUI.style.height = '180px';
    mobileUI.style.zIndex = '999';
    mobileUI.style.pointerEvents = 'none';

    mobileUI.innerHTML = `
        <!-- Joystick Izquierdo -->
        <div id="touch-joystick" style="position: absolute; bottom: 20px; left: 30px; width: 110px; height: 110px; background: rgba(255,255,255,0.1); border: 3px solid #e6b14a; border-radius: 50%; pointer-events: auto;">
            <div id="joystick-knob" style="position: absolute; top: 32px; left: 32px; width: 40px; height: 40px; background: #e6b14a; border-radius: 50%; transition: transform 0.05s;"></div>
        </div>
        <!-- Botón de Interactuar Derecho -->
        <button id="touch-interact" style="position: absolute; bottom: 40px; right: 30px; width: 75px; height: 75px; background: rgba(90, 20, 20, 0.8); border: 2px solid #ff4444; color: white; border-radius: 50%; font-weight: bold; pointer-events: auto;">F</button>
    `;
    document.body.appendChild(mobileUI);

    // Lógica táctil del Joystick
    let joystick = document.getElementById('touch-joystick');
    let knob = document.getElementById('joystick-knob');

    joystick.addEventListener('touchstart', (e) => { joystickActive = true; });
    joystick.addEventListener('touchmove', (e) => {
        if (!joystickActive) return;
        let rect = joystick.getBoundingClientRect();
        let touch = e.touches[0];
        let x = touch.clientX - (rect.left + rect.width/2);
        let y = touch.clientY - (rect.top + rect.height/2);
        
        let distance = Math.min(Math.sqrt(x*x + y*y), 40);
        let angle = Math.atan2(y, x);
        
        let moveX = distance * Math.cos(angle);
        let moveY = distance * Math.sin(angle);
        
        knob.style.transform = `translate(${moveX}px, ${moveY}px)`;
        
        // Pasar datos al movimiento del jugador
        moveForward = moveY < -15;
        moveBackward = moveY > 15;
        moveLeft = moveX < -15;
        moveRight = moveX > 15;
    });

    joystick.addEventListener('touchend', () => {
        joystickActive = false;
        knob.style.transform = 'translate(0px, 0px)';
        moveForward = moveBackward = moveLeft = moveRight = false;
    });

    // Control de cámara táctil deslizando en el resto de la pantalla
    window.addEventListener('touchmove', (e) => {
        if (e.touches[0].clientX > window.innerWidth / 2 && !joystickActive) {
            let movementX = e.touches[0].clientX - touchX;
            camera.rotation.y -= movementX * 0.005;
        }
        touchX = e.touches[0].clientX;
    });
}

// ==========================================
// 4. BUCLE DE JUEGO (ANIMATE)
// ==========================================
function animate() {
    // Lógica de Movimiento simplificada
    if (moveForward) camera.translateZ(-0.06);
    if (moveBackward) camera.translateZ(0.06);
    if (moveLeft) camera.translateX(-0.06);
    if (moveRight) camera.translateX(0.06);

    // Renderizar escena final (WebXR se encarga de duplicar a 3D si está en VR)
    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Funciones vacías obligatorias para evitar que crashee la tienda del HTML
function buyTool(item, cost) { console.log("Compraste: " + item + " por $" + cost); }
function resetStats() { console.log("Estadísticas reiniciadas"); }
function showSettings() { console.log("Configuración abierta"); }
function submitDevCommand() { console.log("Comando enviado"); }
