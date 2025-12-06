// Variáveis globais
let gl;
let canvas;
let shaderProgram;
let flagShaderProgram;

let camera;
let physics;
let ball;
let flag;
let dog;
let hud;

let sphereBuffers;
let cubeBuffers;
let planeBuffers;
let cylinderBuffers;
let discBuffers; 

canvas = document.getElementById('glCanvas');
gl = canvas.getContext('webgl', { alpha: true }); // importante
let grassTexture;
let woodTexture;

let obstacles = [];
let holePosition = vec3.fromValues(0, 0, 10);
let holeRadius = 0.7;

let lastTime = 0;
let isDragging = false;
let mouseX = 0, mouseY = 0;

// Inicializar
async function init() {
    canvas = document.getElementById('glCanvas');
    gl = canvas.getContext('webgl', { alpha: true }); 
    
    if (!gl) {
        alert('WebGL não suportado!');
        return;
    }
    
    // Carregar shaders
    shaderProgram = await loadShader(gl, 'shaders/phong-vertex.glsl', 'shaders/phong-fragment.glsl');
    flagShaderProgram = await loadShader(gl, 'shaders/flag-vertex.glsl', 'shaders/flag-fragment.glsl');
    
    // Criar objetos do jogo ANTES de criar geometrias
    camera = new Camera();
    physics = new Physics();
    ball = new GolfBall();
    flag = new Flag(holePosition);
    hud = new HUD();
    
    // Criar geometrias (agora ball já existe)
    createGeometries();
    
    // Carregar texturas
    await loadTextures();
    
    // Criar obstáculos
    createObstacles();
    
    // Configurar canvas e eventos de resize
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Eventos
    setupEvents();
    
    // Configurar WebGL
    gl.enable(gl.DEPTH_TEST);
    //gl.enable(gl.CULL_FACE);

    // Fundo transparente: deixa o fundo.png do body aparecer
    gl.clearColor(0.0, 0.0, 0.0, 0.0);

    // Iniciar loop
    requestAnimationFrame(gameLoop);
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
    camera.updateProjection(canvas.width, canvas.height);
}

function createGeometries() {
    // Esfera (bola de golfe)
    const sphere = createSphere(ball.radius, 20, 20);
    sphereBuffers = {
        position: createBuffer(gl, sphere.positions),
        normal: createBuffer(gl, sphere.normals),
        texCoord: createBuffer(gl, sphere.texCoords),
        indices: createIndexBuffer(gl, sphere.indices),
        indexCount: sphere.indices.length
    };
    
    // Cubo (paredes, cachorro)
    const cube = createCube(1);
    cubeBuffers = {
        position: createBuffer(gl, cube.positions),
        normal: createBuffer(gl, cube.normals),
        texCoord: createBuffer(gl, cube.texCoords),
        indices: createIndexBuffer(gl, cube.indices),
        indexCount: cube.indices.length
    };
    
    // Plano (chão)
    const plane = createPlane(90, 90);
    planeBuffers = {
        position: createBuffer(gl, plane.positions),
        normal: createBuffer(gl, plane.normals),
        texCoord: createBuffer(gl, plane.texCoords),
        indices: createIndexBuffer(gl, plane.indices),
        indexCount: plane.indices.length
    };
    
    // Cilindro (poste da bandeira, buraco)
    const cylinder = createCylinder(0.5, 0.5, 1, 20);
    cylinderBuffers = {
        position: createBuffer(gl, cylinder.positions),
        normal: createBuffer(gl, cylinder.normals),
        texCoord: createBuffer(gl, cylinder.texCoords),
        indices: createIndexBuffer(gl, cylinder.indices),
        indexCount: cylinder.indices.length
    };
}

function createBuffer(gl, data) {
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
    return buffer;
}

function createIndexBuffer(gl, data) {
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(data), gl.STATIC_DRAW);
    return buffer;
}

async function loadTextures() {
    return new Promise((resolve) => {
        let loaded = 0;
        const total = 2;
        
        const checkLoaded = () => {
            loaded++;
            if (loaded === total) resolve();
        };
        
        // Textura de grama (procedural - grama realista)
        grassTexture = createProceduralTexture(gl, 512, 512, (x, y) => {
            // Criar padrão de grama com várias camadas de ruído
            const scale1 = 0.1;
            const scale2 = 0.05;
            const scale3 = 0.02;
            
            // Ruído usando seno/cosseno (pseudo-ruído)
            const noise1 = Math.sin(x * scale1) * Math.cos(y * scale1);
            const noise2 = Math.sin(x * scale2 + 100) * Math.cos(y * scale2 + 100);
            const noise3 = Math.sin(x * scale3 + 200) * Math.cos(y * scale3 + 200);
            
            // Combinar ruídos
            const combined = (noise1 + noise2 * 0.5 + noise3 * 0.25) / 1.75;
            
            // Adicionar variação aleatória pequena
            const random = (Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1;
            
            // Cores base da grama (verde escuro e claro)
            const baseR = 0.1 + combined * 0.15 + random * 0.05;
            const baseG = 0.4 + combined * 0.25 + random * 0.1;
            const baseB = 0.1 + combined * 0.1 + random * 0.03;
            
            // Adicionar "linhas" de grama cortada
            const stripes = Math.abs(Math.sin(y * 0.3)) * 0.1;
            
            return [
                Math.max(0, Math.min(1, baseR + stripes)),
                Math.max(0, Math.min(1, baseG + stripes)),
                Math.max(0, Math.min(1, baseB + stripes)),
                1
            ];
        });
        checkLoaded();
        
        // Textura de madeira (procedural)
        woodTexture = createProceduralTexture(gl, 256, 256, (x, y) => {
            const stripes = Math.sin(x * 0.1) * 0.1;
            return [0.55 + stripes, 0.35 + stripes, 0.2, 1];
        });
        checkLoaded();
    });
}

function createProceduralTexture(gl, width, height, colorFunc) {
    const texture = gl.createTexture();
    const data = new Uint8Array(width * height * 4);
    
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const i = (y * width + x) * 4;
            const color = colorFunc(x, y);
            data[i] = color[0] * 255;
            data[i + 1] = color[1] * 255;
            data[i + 2] = color[2] * 255;
            data[i + 3] = color[3] * 255;
        }
    }
    
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.generateMipmap(gl.TEXTURE_2D);
    
    return texture;
}

function createObstacles() {
    const fieldSize = 40; // campo 40x40 (antes era 25x25)
    const wallHeight = 3;
    const wallThickness = 1;
    
    // Parede esquerda
    obstacles.push({
        type: 'wall',
        min: vec3.fromValues(-fieldSize, 0, -fieldSize),
        max: vec3.fromValues(-fieldSize + wallThickness, wallHeight, fieldSize)
    });
    
    // Parede direita
    obstacles.push({
        type: 'wall',
        min: vec3.fromValues(fieldSize - wallThickness, 0, -fieldSize),
        max: vec3.fromValues(fieldSize, wallHeight, fieldSize)
    });
    
    // Parede frente
    obstacles.push({
        type: 'wall',
        min: vec3.fromValues(-fieldSize, 0, -fieldSize),
        max: vec3.fromValues(fieldSize, wallHeight, -fieldSize + wallThickness)
    });
    
    // Parede fundo
    obstacles.push({
        type: 'wall',
        min: vec3.fromValues(-fieldSize, 0, fieldSize - wallThickness),
        max: vec3.fromValues(fieldSize, wallHeight, fieldSize)
    });
}

function setupEvents() {
    // Mouse
    canvas.addEventListener('mousedown', (e) => {
        if (e.button === 0 && !ball.isMoving) {
            const rect = canvas.getBoundingClientRect();
            ball.startCharging(e.clientX, e.clientY);
        } else if (e.button === 2) {
            isDragging = true;
            mouseX = e.clientX;
            mouseY = e.clientY;
        }
    });
    
    canvas.addEventListener('mousemove', (e) => {
        if (isDragging && camera.currentMode === 2) {
            const dx = e.clientX - mouseX;
            const dy = e.clientY - mouseY;
            camera.rotateFree(dx, dy);
            mouseX = e.clientX;
            mouseY = e.clientY;
        }
        
        // Atualizar mira estilo estilingue
        if (ball.charging && ball.mouseStartPos) {
            ball.updateCharge(e.clientX, e.clientY);
        }
    });
    
    canvas.addEventListener('mouseup', (e) => {
        console.log('Mouse UP - Botão:', e.button, 'Charging?', ball.charging, 'Power:', ball.power);
        if (e.button === 0) {
            if (ball.shoot()) {
                hud.addStroke();
                console.log('TIRO EXECUTADO!');
            } else {
                console.log('Tiro NÃO executado');
            }
        } else if (e.button === 2) {
            isDragging = false;
        }
    });
    
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    
    // Teclado
    window.addEventListener('keydown', (e) => {
        switch(e.key) {
            case 'ArrowLeft':
                ball.rotateAim(-0.1);
                ball.power = 50; // Define força padrão para teclado
                ball.aimPower = 50;
                break;
            case 'ArrowRight':
                ball.rotateAim(0.1);
                ball.power = 50;
                ball.aimPower = 50;
                break;
            case ' ':
                e.preventDefault();
                if (!ball.isMoving) {
                    // Atirar com força média se usar espaço
                    ball.power = 50;
                    ball.aimPower = 50;
                    ball.charging = true;
                    if (ball.shoot()) {
                        hud.addStroke();
                    }
                } else {
                    ball.reset();
                    hud.addStroke();
                }
                break;
            case 'c':
            case 'C':
                camera.switchMode();
                break;
        }
    });
    
    // Botão de reiniciar
    document.getElementById('restart-btn').addEventListener('click', () => {
        ball.reset();
        hud.reset();
        hud.hideGameOver();
    });
}

function gameLoop(currentTime) {
    const deltaTime = (currentTime - lastTime) / 1000;
    lastTime = currentTime;
    
    update(Math.min(deltaTime, 0.1));
    render();
    
    requestAnimationFrame(gameLoop);
}

function update(deltaTime) {
    // Atualizar objetos
    physics.updateBall(ball, obstacles, deltaTime);
    flag.update(deltaTime);
    
    // Verificar colisão com o buraco
    if (physics.checkHoleCollision(ball, holePosition, holeRadius)) {
        setTimeout(() => {
            hud.showGameOver();
        }, 500);
    }
    
    // Verificar se caiu fora
    if (ball.outOfBounds) {
        ball.reset();
        hud.addStroke();
    }
    
    // Atualizar câmera
    camera.update(ball.position, ball.aimDirection);
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    // Usar shader principal
    gl.useProgram(shaderProgram);
    
    // Configurar uniforms de iluminação
    setupLighting();
    
    // Renderizar cena
    renderGround();
     renderWalls();
    renderHole();
    renderBall();
    renderFlag();
    
    // Renderizar seta de mira
    if (!ball.isMoving && ball.charging && ball.aimPower > 0) {
        renderAimLine();
    }
}

function setupLighting() {
    const ambientLoc = gl.getUniformLocation(shaderProgram, 'uAmbientLight');
    const dirLightDirLoc = gl.getUniformLocation(shaderProgram, 'uDirectionalLightDir');
    const dirLightColorLoc = gl.getUniformLocation(shaderProgram, 'uDirectionalLightColor');
    const pointLightPosLoc = gl.getUniformLocation(shaderProgram, 'uPointLightPos');
    const pointLightColorLoc = gl.getUniformLocation(shaderProgram, 'uPointLightColor');
    const cameraPosLoc = gl.getUniformLocation(shaderProgram, 'uCameraPos');
    
    gl.uniform3f(ambientLoc, 0.3, 0.3, 0.3);
    gl.uniform3f(dirLightDirLoc, -0.5, -1, -0.3);
    gl.uniform3f(dirLightColorLoc, 0.8, 0.8, 0.7);
    gl.uniform3fv(pointLightPosLoc, [holePosition[0], holePosition[1] + 3, holePosition[2]]);
    gl.uniform3f(pointLightColorLoc, 1, 0.9, 0.7);
    gl.uniform3fv(cameraPosLoc, camera.getPosition());
}

function renderGround() {
    const modelMatrix = mat4.create();
    mat4.translate(modelMatrix, modelMatrix, [0, -0.01, 0]); // Bem próximo de y=0
    drawMesh(planeBuffers, modelMatrix, grassTexture, true);
}

function renderWalls() {
    obstacles.forEach(obstacle => {
        if (obstacle.type === 'wall') {
            const modelMatrix = mat4.create();
            const center = vec3.create();
            vec3.add(center, obstacle.min, obstacle.max);
            vec3.scale(center, center, 0.5);
            
            const size = vec3.create();
            vec3.subtract(size, obstacle.max, obstacle.min);
            
            mat4.translate(modelMatrix, modelMatrix, center);
            mat4.scale(modelMatrix, modelMatrix, size);
            
            drawMesh(cubeBuffers, modelMatrix, woodTexture, true);
        }
    });
}

function renderRamp() {
    obstacles.forEach(obstacle => {
        if (obstacle.type === 'ramp') {
            const modelMatrix = mat4.create();
            const center = vec3.create();
            vec3.add(center, obstacle.min, obstacle.max);
            vec3.scale(center, center, 0.5);
            
            const size = vec3.create();
            vec3.subtract(size, obstacle.max, obstacle.min);
            
            mat4.translate(modelMatrix, modelMatrix, center);
            mat4.rotateX(modelMatrix, modelMatrix, -0.3);
            mat4.scale(modelMatrix, modelMatrix, size);
            
            drawMesh(cubeBuffers, modelMatrix, grassTexture, true);
        }
    });
}


function renderHole() {
    const holeDepth = 0.5;

    // Copinho escuro (cilindro afundado)
    let modelMatrix = mat4.create();
    mat4.translate(modelMatrix, modelMatrix, [
        holePosition[0],
        -holeDepth * 3,   // centro abaixo da grama
        holePosition[2]
    ]);
    mat4.scale(modelMatrix, modelMatrix, [
        holeRadius * 0.9,
        holeDepth,
        holeRadius * 0.9
    ]);
    drawMesh(cylinderBuffers, modelMatrix, null, false, [0.05, 0.04, 0.04]);

    // Borda do copo (anel claro no nível da grama)
    modelMatrix = mat4.create();
    mat4.translate(modelMatrix, modelMatrix, [
        holePosition[0],
        0.01,               // colado na grama
        holePosition[2]
    ]);
    mat4.scale(modelMatrix, modelMatrix, [
        holeRadius * 1.02,
        0.03,
        holeRadius * 1.02
    ]);
    // cor clara (plástico/metal)
    drawMesh(cylinderBuffers, modelMatrix, null, false, [0.9, 0.9, 0.9]);
}




function renderBall() {
    const modelMatrix = ball.getModelMatrix();
    drawMesh(sphereBuffers, modelMatrix, null, false, [1, 1, 1]);
}

function renderFlag() {
    // Poste
    let modelMatrix = flag.getPoleMatrix();
    drawMesh(cylinderBuffers, modelMatrix, null, false, [0.9, 0.9, 0.9]);
    
    // Bandeira
    modelMatrix = flag.getFlagMatrix();
    drawMesh(cubeBuffers, modelMatrix, null, false, [1, 0.2, 0.2]);
}

function renderDog() {
    // Corpo
    drawMesh(cubeBuffers, dog.getBodyMatrix(), null, false, [0.6, 0.4, 0.2]);
    
    // Cabeça
    drawMesh(cubeBuffers, dog.getHeadMatrix(), null, false, [0.6, 0.4, 0.2]);
    
    // Orelhas
    drawMesh(cubeBuffers, dog.getLeftEarMatrix(), null, false, [0.5, 0.3, 0.15]);
    drawMesh(cubeBuffers, dog.getRightEarMatrix(), null, false, [0.5, 0.3, 0.15]);
    
    // Focinho
    drawMesh(cubeBuffers, dog.getSnoutMatrix(), null, false, [0.7, 0.5, 0.3]);
    
    // Nariz
    drawMesh(sphereBuffers, dog.getNoseMatrix(), null, false, [0.1, 0.1, 0.1]);
    
    // Pernas
    drawMesh(cubeBuffers, dog.getFrontLeftLegMatrix(), null, false, [0.5, 0.3, 0.15]);
    drawMesh(cubeBuffers, dog.getFrontRightLegMatrix(), null, false, [0.5, 0.3, 0.15]);
    drawMesh(cubeBuffers, dog.getBackLeftLegMatrix(), null, false, [0.5, 0.3, 0.15]);
    drawMesh(cubeBuffers, dog.getBackRightLegMatrix(), null, false, [0.5, 0.3, 0.15]);
    
    // Rabo
    drawMesh(cubeBuffers, dog.getTailMatrix(), null, false, [0.4, 0.2, 0.1]);
}

function renderAimArrow() {
    const modelMatrix = ball.getAimArrowMatrix();
    drawMesh(cubeBuffers, modelMatrix, null, false, [1, 1, 0]);
}

function renderAimLine() {
    // Linha pontilhada mostrando trajetória
    const segments = 5;
    const segmentLength = 1 + (ball.aimPower / 100) * 3;
    
    for (let i = 0; i < segments; i++) {
        const modelMatrix = mat4.create();
        mat4.translate(modelMatrix, modelMatrix, ball.position);
        mat4.rotateY(modelMatrix, modelMatrix, ball.aimAngle);

        mat4.translate(modelMatrix, modelMatrix, [0, 0.05, segmentLength * (i + 0.5)]);
        mat4.scale(modelMatrix, modelMatrix, [0.1, 0.1, segmentLength * 0.3]);
        
        // Cor: amarelo para verde baseado na distância
        const t = i / segments;
        const color = [1 - t * 0.5, 1, 0];
        
        drawMesh(cubeBuffers, modelMatrix, null, false, color);
    }
}

function drawMesh(buffers, modelMatrix, texture, useTexture, color = [1, 1, 1]) {
    // Matrizes
    const viewMatrix = camera.viewMatrix;
    const projectionMatrix = camera.projectionMatrix;
    const normalMatrix = mat4.create();
    mat4.invert(normalMatrix, modelMatrix);
    mat4.transpose(normalMatrix, normalMatrix);
    
    // Uniforms
    const modelLoc = gl.getUniformLocation(shaderProgram, 'uModelMatrix');
    const viewLoc = gl.getUniformLocation(shaderProgram, 'uViewMatrix');
    const projLoc = gl.getUniformLocation(shaderProgram, 'uProjectionMatrix');
    const normalLoc = gl.getUniformLocation(shaderProgram, 'uNormalMatrix');
    const useTexLoc = gl.getUniformLocation(shaderProgram, 'uUseTexture');
    const colorLoc = gl.getUniformLocation(shaderProgram, 'uMaterialColor');
    
    gl.uniformMatrix4fv(modelLoc, false, modelMatrix);
    gl.uniformMatrix4fv(viewLoc, false, viewMatrix);
    gl.uniformMatrix4fv(projLoc, false, projectionMatrix);
    gl.uniformMatrix4fv(normalLoc, false, normalMatrix);
    gl.uniform1i(useTexLoc, useTexture ? 1 : 0);
    gl.uniform3fv(colorLoc, color);
    
    // Textura
    if (useTexture && texture) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(gl.getUniformLocation(shaderProgram, 'uTexture'), 0);
    }
    
    // Attributes
    const posLoc = gl.getAttribLocation(shaderProgram, 'aPosition');
    const normalAttrLoc = gl.getAttribLocation(shaderProgram, 'aNormal');
    const texCoordLoc = gl.getAttribLocation(shaderProgram, 'aTexCoord');
    
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normal);
    gl.enableVertexAttribArray(normalAttrLoc);
    gl.vertexAttribPointer(normalAttrLoc, 3, gl.FLOAT, false, 0, 0);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.texCoord);
    gl.enableVertexAttribArray(texCoordLoc);
    gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, 0, 0);
    
    // Desenhar
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);
    gl.drawElements(gl.TRIANGLES, buffers.indexCount, gl.UNSIGNED_SHORT, 0);
}

// Iniciar quando a página carregar
window.addEventListener('load', init);