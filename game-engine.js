// Asegurar que la pantalla de carga se oculte al iniciar
window.addEventListener('DOMContentLoaded', () => {
    let progress = document.getElementById('loading-progress');
    let screen = document.getElementById('loading-screen');
    
    if (progress) progress.style.width = '100%';
    
    // Desvanecer pantalla de carga tras un breve instante
    setTimeout(() => {
        if (screen) screen.style.display = 'none';
    }, 500);
});
// --- SOPORTE INMERSIVO VR Y PANTALLA COMPLETA ---
function startVRInversion() {
    // Activa la pantalla completa para dispositivos móviles/visores antes de inicializar WebXR
    if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().then(() => {
            startBackrooms();
        }).catch(err => {
            console.log("Error al entrar en pantalla completa: ", err);
            startBackrooms(); // Inicializa de todos modos si falla
        });
    } else {
        startBackrooms();
    }
}

// --- CONSTRUCCIÓN REALISTA DE ENTIDADES (BASADO EN TUS FOTOS) ---
function spawnEntitiesForLevel(lvl) {
    entities = [];
    
    // Nivel Especial de Kitty (Si es Nivel 0 con baja probabilidad, o un mapa avanzado)
    if (lvl === 0 && Math.random() > 0.6) {
        createRealisticEntity("Kitty", 0, 0);
        return;
    }

    // Spawn por defecto basado en el peligro del nivel
    if (lvl === 27 || lvl === 4) { // Level Fun o zonas de oficinas
        createRealisticEntity("Partygoer", (Math.random() - 0.5) * 30, (Math.random() - 0.5) * 30);
    }
    
    // Siempre hay una Bacteria acechando en los niveles iniciales
    createRealisticEntity("Bacteria", (Math.random() - 0.5) * 40, (Math.random() - 0.5) * 40);
}

function createRealisticEntity(type, posX, posZ) {
    let entityGroup = new THREE.Group();
    
    if (type === "Bacteria") {
        // Modelo basado en "1000047237.jpg" (Cuerpo distorsionado hecho de alambres/tendones negros)
        let mat = new THREE.MeshBasicMaterial({ color: 0x111111 });
        
        // Espina dorsal chueca
        let spineGeo = new THREE.CylinderGeometry(0.08, 0.08, 3.5, 6);
        let spine = new THREE.Mesh(spineGeo, mat);
        spine.position.y = 2.2;
        spine.rotation.z = 0.2; // Inclinado tétrico
        entityGroup.add(spine);

        // Extremidades asimétricas y delgadas (Patas de palo largas)
        for(let i = 0; i < 3; i++) {
            let legGeo = new THREE.CylinderGeometry(0.04, 0.02, 2.5, 4);
            let leg = new THREE.Mesh(legGeo, mat);
            leg.position.set((i - 1) * 0.4, 1.25, (Math.random() - 0.5) * 0.5);
            leg.rotation.x = (Math.random() - 0.5) * 0.5;
            entityGroup.add(leg);
        }
        
        // Cabeza amorfa superior
        let headGeo = new THREE.SphereGeometry(0.25, 6, 6);
        let head = new THREE.Mesh(headGeo, mat);
        head.position.set(0.1, 4.0, 0);
        entityGroup.add(head);

        entityGroup.name = "Bacteria (Entidad de Alambre)";

    } else if (type === "Kitty") {
        // Modelo basado en "1000047238.jpg" (Silueta gigantesca, completamente negra y plana de brazos largos)
        let mat = new THREE.MeshBasicMaterial({ color: 0x050505, transparent: true, opacity: 0.98 });
        
        // Cuerpo ultra alargado
        let bodyGeo = new THREE.CylinderGeometry(0.2, 0.15, 5.0, 6);
        let body = new THREE.Mesh(bodyGeo, mat);
        body.position.y = 3.5;
        entityGroup.add(body);

        // Brazos infinitos cayendo a los lados
        let armLeftGeo = new THREE.CylinderGeometry(0.05, 0.03, 4.0, 4);
        let armLeft = new THREE.Mesh(armLeftGeo, mat);
        armLeft.position.set(-0.4, 3.5, 0);
        armLeft.rotation.z = 0.05;
        entityGroup.add(armLeft);

        let armRight = armLeft.clone();
        armRight.position.x = 0.4;
        armRight.rotation.z = -0.05;
        entityGroup.add(armRight);

        // Cabeza ovalada sin rostro
        let headGeo = new THREE.SphereGeometry(0.35, 8, 8);
        let head = new THREE.Mesh(headGeo, mat);
        head.position.y = 6.2;
        entityGroup.add(head);

        entityGroup.name = "Kitty (Entidad 99)";

    } else if (type === "Partygoer") {
        // Modelo basado en "1000047239.jpg" (Cuerpo cilíndrico amarillo, cabeza lisa y sonrisa pintada)
        let bodyMat = new THREE.MeshStandardMaterial({ color: 0xddbc33, roughness: 0.9 });
        
        // Cuerpo de "botarga" o plástico inflado
        let bodyGeo = new THREE.CylinderGeometry(0.4, 0.5, 2.2, 12);
        let body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 1.1;
        entityGroup.add(body);

        // Cabeza cilíndrica redondeada
        let headGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.9, 12);
        let head = new THREE.Mesh(headGeo, bodyMat);
        head.position.y = 2.4;
        entityGroup.add(head);

        // Renderizar la icónica sonrisa roja de forma procedural mediante una sub-pieza texturizada
        let faceCanvas = document.createElement('canvas');
        faceCanvas.width = 128; faceCanvas.height = 128;
        let faceCtx = faceCanvas.getContext('2d');
        faceCtx.fillStyle = '#ddbc33'; faceCtx.fillRect(0,0,128,128);
        // Ojos pintados de rojo sangre
        faceCtx.fillStyle = '#990000';
        faceCtx.fillRect(35, 70, 12, 12); faceCtx.fillRect(81, 70, 12, 12);
        // Sonrisa `=)`
        faceCtx.strokeStyle = '#990000'; faceCtx.lineWidth = 6;
        faceCtx.beginPath(); faceCtx.arc(64, 45, 25, 0, Math.PI, true); faceCtx.stroke();

        let faceTex = new THREE.CanvasTexture(faceCanvas);
        let faceMat = new THREE.MeshBasicMaterial({ map: faceTex });
        let faceMesh = new THREE.Mesh(new THREE.SphereGeometry(0.36, 12, 12), faceMat);
        faceMesh.position.set(0, 2.5, 0.05);
        entityGroup.add(faceMesh);

        entityGroup.name = "Partygoer (=))";
    }

    // Configurar posición inicial en el laberinto
    entityGroup.position.set(posX, 0, posZ);
    scene.add(entityGroup);

    // Guardar velocidad y tracking en la IA global
    entities.push({ 
        mesh: entityGroup, 
        name: entityGroup.name, 
        speed: type === "Kitty" ? 0.015 : 0.05 + (player.currentLevel * 0.003) 
    });
}
// Añade esto en game-engine.js para conectar el botón del HTML
function startVRInversion() {
    console.log("Inicializando modo inmersivo...");
    
    // Forzar pantalla completa si el dispositivo lo soporta
    if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().then(() => {
            startBackrooms();
        }).catch(err => {
            console.warn("Pantalla completa rechazada, iniciando normal:", err);
            startBackrooms();
        });
    } else {
        startBackrooms();
    }
}

