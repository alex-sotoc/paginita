// ==============================================================================
// 1. CONFIGURACIÓN DEL CANVAS Y CENTRO DE PANTALLA
// ==============================================================================
const canvas = document.getElementById('lienzo3D');
const ctx = canvas.getContext('2d');
const CENTRO_X = canvas.width / 2;
const CENTRO_Y = canvas.height / 2;

// ==============================================================================
// 2. DEFINICIÓN DE LAS 3 PRIMITIVAS GEOMÉTRICAS (OPCIONES A, B y C)
// ==============================================================================

// Opción A: Pirámide de base cuadrada (5 vértices, 8 aristas)
const piramide = {
    vertices: [
        {x:  0, y:  80, z:   0}, // V0: Cúspide
        {x: -70, y: -70, z: -70}, // V1: Base Trasera Izq
        {x:  70, y: -70, z: -70}, // V2: Base Trasera Der
        {x:  70, y: -70, z:  70}, // V3: Base Frontal Der
        {x: -70, y: -70, z:  70}  // V4: Base Frontal Izq
    ],
    aristas: [
        [1, 2], [2, 3], [3, 4], [4, 1], // Base
        [0, 1], [0, 2], [0, 3], [0, 4]  // Cúspide
    ]
};

// Opción B: Prisma triangular (6 vértices, 9 aristas)
const prisma = {
    vertices: [
        {x:   0, y:  80, z: -60}, // V0: Superior A
        {x: -70, y: -60, z: -60}, // V1: Inferior Izq A
        {x:  70, y: -60, z: -60}, // V2: Inferior Der A
        {x:   0, y:  80, z:  60}, // V3: Superior B
        {x: -70, y: -60, z:  60}, // V4: Inferior Izq B
        {x:  70, y: -60, z:  60}  // V5: Inferior Der B
    ],
    aristas: [
        // Triángulo frontal
        [0, 1], [1, 2], [2, 0],
        // Triángulo trasero
        [3, 4], [4, 5], [5, 3],
        // Conexiones longitudinales
        [0, 3], [1, 4], [2, 5]
    ]
};

// Opción C: Octaedro (6 vértices, 12 aristas)
const octaedro = {
    vertices: [
        {x:   0, y:  90, z:   0}, // V0: Superior
        {x:   0, y: -90, z:   0}, // V1: Inferior
        {x: -70, y:   0, z:   0}, // V2: Izquierda
        {x:  70, y:   0, z:   0}, // V3: Derecha
        {x:   0, y:   0, z: -70}, // V4: Trasera
        {x:   0, y:   0, z:  70}  // V5: Frontal
    ],
    aristas: [
        // Conexiones cúspide superior
        [0, 2], [0, 3], [0, 4], [0, 5],
        // Conexiones cúspide inferior
        [1, 2], [1, 3], [1, 4], [1, 5],
        // Cinturón central
        [2, 4], [4, 3], [3, 5], [5, 2]
    ]
};

// ==============================================================================
// 3. TEMA 3.3: PIPELINE DE TRANSFORMACIONES TRIDIMENSIONALES
// ==============================================================================
function transformarVertice3D(v, params) {
    let { tx, ty, tz, sx, sy, sz, rx, ry, rz, shxy, shxz } = params;

    let radX = rx * Math.PI / 180;
    let radY = ry * Math.PI / 180;
    let radZ = rz * Math.PI / 180;

    // Escalamiento (S)
    let x1 = v.x * sx;
    let y1 = v.y * sy;
    let z1 = v.z * sz;

    // Sesgado / Shear (Sh)
    let x2 = x1 + (shxy * y1) + (shxz * z1);
    let y2 = y1;
    let z2 = z1;

    // Rotación X (Pitch)
    let x3 = x2;
    let y3 = y2 * Math.cos(radX) - z2 * Math.sin(radX);
    let z3 = y2 * Math.sin(radX) + z2 * Math.cos(radX);

    // Rotación Y (Yaw)
    let x4 = x3 * Math.cos(radY) + z3 * Math.sin(radY);
    let y4 = y3;
    let z4 = -x3 * Math.sin(radY) + z3 * Math.cos(radY);

    // Rotación Z (Roll)
    let x5 = x4 * Math.cos(radZ) - y4 * Math.sin(radZ);
    let y5 = x4 * Math.sin(radZ) + y4 * Math.cos(radZ);
    let z5 = z4;

    // Traslación (T)
    let xFinal = x5 + tx;
    let yFinal = y5 + ty;
    let zFinal = z5 + tz;

    return { x: xFinal, y: yFinal, z: zFinal };
}

// ==============================================================================
// 4. TEMA 3.1: PROYECCIÓN PERSPECTIVA (3D A PANTALLA 2D)
// ==============================================================================
function proyectar3Da2D(v3d) {
    const distanciaCamara = 500;
    
    let zAjustado = v3d.z + distanciaCamara;
    if (zAjustado < 1) zAjustado = 1;

    let factorProyeccion = distanciaCamara / zAjustado;

    let x2d = CENTRO_X + (v3d.x * factorProyeccion);
    let y2d = CENTRO_Y - (v3d.y * factorProyeccion);

    return { x: x2d, y: y2d };
}

// ==============================================================================
// 5. BUCLE DE RENDERIZADO Y CONTROL DE ANIMACIÓN
// ==============================================================================
let autoRotando = false;
let idAnimacion = null;

function renderizar() {
    const seleccion = document.getElementById('selectorFigura').value;
    let modeloActual = piramide;
    if (seleccion === 'prisma') modeloActual = prisma;
    if (seleccion === 'octaedro') modeloActual = octaedro;

    const params = {
        tx: parseFloat(document.getElementById('tx').value),
        ty: parseFloat(document.getElementById('ty').value),
        tz: parseFloat(document.getElementById('tz').value),
        sx: parseFloat(document.getElementById('sx').value),
        sy: parseFloat(document.getElementById('sy').value),
        sz: parseFloat(document.getElementById('sz').value),
        rx: parseFloat(document.getElementById('rx').value),
        ry: parseFloat(document.getElementById('ry').value),
        rz: parseFloat(document.getElementById('rz').value),
        shxy: parseFloat(document.getElementById('shxy').value),
        shxz: parseFloat(document.getElementById('shxz').value)
    };

    document.getElementById('valTx').innerText = params.tx;
    document.getElementById('valTy').innerText = params.ty;
    document.getElementById('valTz').innerText = params.tz;
    document.getElementById('valSx').innerText = params.sx.toFixed(1);
    document.getElementById('valSy').innerText = params.sy.toFixed(1);
    document.getElementById('valSz').innerText = params.sz.toFixed(1);
    document.getElementById('valRx').innerText = params.rx + '°';
    document.getElementById('valRy').innerText = params.ry + '°';
    document.getElementById('valRz').innerText = params.rz + '°';
    document.getElementById('valShXY').innerText = params.shxy.toFixed(1);
    document.getElementById('valShXZ').innerText = params.shxz.toFixed(1);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Ejes de guía
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(CENTRO_X, 0); ctx.lineTo(CENTRO_X, canvas.height);
    ctx.moveTo(0, CENTRO_Y); ctx.lineTo(canvas.width, CENTRO_Y);
    ctx.stroke();

    let verticesTransformados = modeloActual.vertices.map(v => transformarVertice3D(v, params));
    let vertices2D = verticesTransformados.map(proyectar3Da2D);

    // Estilo personalizado (Parte 3): Aristas Violetas
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 2.5;
    for (let arista of modeloActual.aristas) {
        let p1 = vertices2D[arista[0]];
        let p2 = vertices2D[arista[1]];
        if (p1 && p2) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
        }
    }

    // Estilo personalizado (Parte 3): Vértices Cyan
    ctx.fillStyle = '#38bdf8';
    for (let p of vertices2D) {
        if (p) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

// Control de Animación Continua (Reto)
function bucleAnimacion() {
    if (autoRotando) {
        let ryInput = document.getElementById('ry');
        let valorActual = parseFloat(ryInput.value);
        let nuevoValor = (valorActual + 1) % 180;
        ryInput.value = nuevoValor;
        renderizar();
        idAnimacion = requestAnimationFrame(bucleAnimacion);
    }
}

document.getElementById('btnAutoRotar').addEventListener('click', () => {
    autoRotando = !autoRotando;
    const btn = document.getElementById('btnAutoRotar');
    if (autoRotando) {
        btn.innerText = "Detener Auto-Rotación";
        btn.style.backgroundColor = "#f43f5e";
        bucleAnimacion();
    } else {
        btn.innerText = "Iniciar Auto-Rotación (Yaw)";
        btn.style.backgroundColor = "#38bdf8";
        cancelAnimationFrame(idAnimacion);
    }
});

document.getElementById('selectorFigura').addEventListener('change', renderizar);
document.querySelectorAll('input[type=range]').forEach(input => {
    input.addEventListener('input', renderizar);
});

renderizar();