// js/rampaMain.js
import { mat4Identity, mat4Perspective, mat4LookAt, mat4Multiply } from './math.js';

let gl;
let program;
let rampBuffers = {};
let rampVertexCount = 0;

// --------- Shaders: iluminação simples (difusa + ambiente) ---------

const vsSource = `
attribute vec3 aPosition;
attribute vec3 aNormal;

uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProjection;

varying vec3 vNormal;
varying vec3 vWorldPos;

void main() {
    vec4 worldPos = uModel * vec4(aPosition, 1.0);
    vWorldPos = worldPos.xyz;
    vNormal = mat3(uModel) * aNormal;
    gl_Position = uProjection * uView * worldPos;
}
`;

const fsSource = `
precision mediump float;

varying vec3 vNormal;
varying vec3 vWorldPos;

uniform vec3 uLightDir;
uniform vec3 uLightColor;
uniform vec3 uAmbientColor;
uniform vec3 uBaseColor;

void main() {
    vec3 N = normalize(vNormal);
    vec3 L = normalize(-uLightDir);
    vec3 V = normalize(-vWorldPos);

    float diff = max(dot(N, L), 0.0);

    // especular simples só pra dar um brilho leve
    vec3 R = reflect(-L, N);
    float spec = pow(max(dot(R, V), 0.0), 32.0);

    vec3 color = uAmbientColor * uBaseColor +
                 diff * uLightColor * uBaseColor +
                 spec * vec3(1.0);

    gl_FragColor = vec4(color, 1.0);
}
`;

// --------- helpers de matriz (translação, rotação se precisar) ---------

function mat4Translation(tx, ty, tz) {
  return [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    tx, ty, tz, 1
  ];
}

// --------- gera geometria da rampa 3D (wedge) ---------
//
// Vamos criar um bloco inclinado (tipo morro):
//  - base retangular em y = 0, de x = -4..4, z = -2..2
//  - topo é um plano inclinado:
//        à esquerda (x = -4) fica em y = 0,
//        à direita (x =  4) sobe até y = 3.
//
// Isso forma um wedge sólido com faces triangulares e retangulares.

function createRampMesh() {
  const positions = [];
  const normals = [];

  function addTri(p0, p1, p2) {
    // p0, p1, p2: [x,y,z]
    positions.push(...p0, ...p1, ...p2);

    const v1 = [
      p1[0] - p0[0],
      p1[1] - p0[1],
      p1[2] - p0[2],
    ];
    const v2 = [
      p2[0] - p0[0],
      p2[1] - p0[1],
      p2[2] - p0[2],
    ];

    // normal = v1 x v2
    const nx = v1[1] * v2[2] - v1[2] * v2[1];
    const ny = v1[2] * v2[0] - v1[0] * v2[2];
    const nz = v1[0] * v2[1] - v1[1] * v2[0];
    const len = Math.hypot(nx, ny, nz) || 1.0;
    const n = [nx / len, ny / len, nz / len];

    normals.push(...n, ...n, ...n);
  }

  const x0 = -4.0; // começo
  const x1 =  4.0; // final
  const z0 = -2.0;
  const z1 =  2.0;
  const h  =  3.0; // altura da direita

  // Vértices básicos
  const A = [x0, 0.0, z0]; // esquerda-frente baixo
  const B = [x1, 0.0, z0]; // direita-frente baixo
  const C = [x1, 0.0, z1]; // direita-trás baixo
  const D = [x0, 0.0, z1]; // esquerda-trás baixo

  const F = [x1, h, z0];   // direita-frente topo
  const G = [x1, h, z1];   // direita-trás topo

  // Topo inclinado (paralelogramo A-F-G-D)
  addTri(A, F, G);
  addTri(A, G, D);

  // Base (A-B-C-D)
  addTri(A, C, B);
  addTri(A, D, C);

  // Face frontal (triângulo A-B-F)
  addTri(A, B, F);

  // Face traseira (triângulo D-C-G)
  addTri(D, C, G);

  // Lado direito (retângulo B-C-G-F)
  addTri(B, C, G);
  addTri(B, G, F);

  // Lado esquerdo: é só a aresta A-D (topo coincide com base),
  // então não gera área. Se quiser "engrossar" um pouco,
  // poderia inventar uma borda, mas pro morro isso nem aparece muito.

  rampVertexCount = positions.length / 3;

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
  };
}

// --------- inicialização WebGL ---------

function main() {
  const canvas = document.getElementById('glcanvas');
  gl = canvas.getContext('webgl');

  if (!gl) {
    alert('WebGL não suportado');
    return;
  }

  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  const vs = compileShader(gl.VERTEX_SHADER, vsSource);
  const fs = compileShader(gl.FRAGMENT_SHADER, fsSource);
  program = createProgram(vs, fs);

  gl.useProgram(program);

  initBuffers();

  gl.enable(gl.DEPTH_TEST);

  requestAnimationFrame(render);
}

function compileShader(type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Erro compilando shader:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(vs, fs) {
  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);

  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.error('Erro linkando programa:', gl.getProgramInfoLog(prog));
    gl.deleteProgram(prog);
    return null;
  }
  return prog;
}

// --------- buffers ---------

function initBuffers() {
  const mesh = createRampMesh();

  rampBuffers.position = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, rampBuffers.position);
  gl.bufferData(gl.ARRAY_BUFFER, mesh.positions, gl.STATIC_DRAW);

  rampBuffers.normal = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, rampBuffers.normal);
  gl.bufferData(gl.ARRAY_BUFFER, mesh.normals, gl.STATIC_DRAW);
}

// --------- render (cena estática, mas com possibilidade de girar se quiser) ---------

function render(timestamp) {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.useProgram(program);

  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const projection = mat4Perspective(45, aspect, 0.1, 100);

  // Câmera num enquadramento parecido com o da bola:
  // um pouco acima e atrás, olhando para o centro da rampa.
  const eye = [0.0, 4.0, 12.0];
  const center = [0.0, 1.0, 0.0];
  const up = [0.0, 1.0, 0.0];

  const view = mat4LookAt(eye, center, up);

  // Se quiser animar, dá pra rotacionar o model; por enquanto deixo identidade.
  let model = mat4Identity();
  // Exemplo (comentar se não quiser girar):
  // const angle = (timestamp * 0.0003) % (2 * Math.PI);
  // const rotY = [
  //   Math.cos(angle), 0, Math.sin(angle), 0,
  //   0,               1, 0,               0,
  //  -Math.sin(angle), 0, Math.cos(angle), 0,
  //   0,               0, 0,               1
  // ];
  // model = rotY;

  const uModel = gl.getUniformLocation(program, 'uModel');
  const uView = gl.getUniformLocation(program, 'uView');
  const uProjection = gl.getUniformLocation(program, 'uProjection');

  gl.uniformMatrix4fv(uModel, false, new Float32Array(model));
  gl.uniformMatrix4fv(uView, false, new Float32Array(view));
  gl.uniformMatrix4fv(uProjection, false, new Float32Array(projection));

  // luz
  const uLightDir = gl.getUniformLocation(program, 'uLightDir');
  const uLightColor = gl.getUniformLocation(program, 'uLightColor');
  const uAmbientColor = gl.getUniformLocation(program, 'uAmbientColor');
  const uBaseColor = gl.getUniformLocation(program, 'uBaseColor');

  gl.uniform3fv(uLightDir, new Float32Array([0.3, 1.0, 0.4]));
  gl.uniform3fv(uLightColor, new Float32Array([1.0, 1.0, 1.0]));
  gl.uniform3fv(uAmbientColor, new Float32Array([0.3, 0.35, 0.4]));

  // cor do morro (um verdinho escuro)
  gl.uniform3fv(uBaseColor, new Float32Array([0.15, 0.55, 0.2]));

  // atributos
  const aPosition = gl.getAttribLocation(program, 'aPosition');
  gl.bindBuffer(gl.ARRAY_BUFFER, rampBuffers.position);
  gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(aPosition);

  const aNormal = gl.getAttribLocation(program, 'aNormal');
  gl.bindBuffer(gl.ARRAY_BUFFER, rampBuffers.normal);
  gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(aNormal);

  gl.drawArrays(gl.TRIANGLES, 0, rampVertexCount);

  // se quiser estático MESMO, pode tirar o requestAnimationFrame;
  // manter não faz mal – só redesenha a mesma coisa.
  requestAnimationFrame(render);
}

main();
