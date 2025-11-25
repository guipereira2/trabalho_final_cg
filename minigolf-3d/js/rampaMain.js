// js/rampaMain.js
import { mat4Identity, mat4Perspective, mat4LookAt } from './math.js';

let gl;
let program;

// buffers
let floorBuffers = {};
let rampBuffers = {};
let floorVertexCount = 0;
let rampVertexCount = 0;

// --------- Shaders: iluminação difusa + ambiente (sem brilho especular) ---------

const vsSource = `
attribute vec3 aPosition;
attribute vec3 aNormal;

uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProjection;

varying vec3 vNormal;

void main() {
    vec4 worldPos = uModel * vec4(aPosition, 1.0);
    vNormal = mat3(uModel) * aNormal;
    gl_Position = uProjection * uView * worldPos;
}
`;

const fsSource = `
precision mediump float;

varying vec3 vNormal;

uniform vec3 uLightDir;
uniform vec3 uLightColor;
uniform vec3 uAmbientColor;
uniform vec3 uBaseColor;

void main() {
    vec3 N = normalize(vNormal);
    vec3 L = normalize(-uLightDir);

    // só difuso + ambiente, sem highlight circular
    float diff = max(dot(N, L), 0.0);

    vec3 color = uAmbientColor * uBaseColor +
                 diff * uLightColor * uBaseColor;

    gl_FragColor = vec4(color, 1.0);
}
`;

// --------- helpers ---------

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

function addTri(positions, normals, p0, p1, p2) {
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

  const nx = v1[1] * v2[2] - v1[2] * v2[1];
  const ny = v1[2] * v2[0] - v1[0] * v2[2];
  const nz = v1[0] * v2[1] - v1[1] * v2[0];
  const len = Math.hypot(nx, ny, nz) || 1.0;
  const n = [nx / len, ny / len, nz / len];

  normals.push(...n, ...n, ...n);
}

// --------- Geometria: plataforma plana + rampa morro ---------
//
// Plataforma AGORA é só um plano em y = 0 (sem paredes/laterais)
// Rampa continua sendo um wedge sólido, encostado na plataforma.

function createFloorMesh() {
  const positions = [];
  const normals = [];

  const x0 = -10.0;
  const x1 = 0.0;
  const z0 = -2.0;
  const z1 =  2.0;
  const y  =  -5.0;

  const A = [x0, y, z0];
  const B = [x1, y, z0];
  const C = [x1, y, z1];
  const D = [x0, y, z1];

  const n = [0.0, 1.0, 0.0]; // normal pra cima

  // só o topo (duas triangles), cor contínua
  positions.push(...A, ...B, ...C, ...A, ...C, ...D);
  normals.push(...n, ...n, ...n, ...n, ...n, ...n);

  floorVertexCount = positions.length / 3;
  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
  };
}

function createRampMesh() {
  const positions = [];
  const normals = [];

  const x0 = 0.0;  // início da rampa (encostado no fim da plataforma)
  const x1 =  9.2;  // fim da rampa, lado direito
  const z0 = -2.0;
  const z1 =  2.0;
  const y0 =  -5.0;
  const h  =  0;  // altura máxima na direita

  // base retangular em y = 0
  const A = [x0, y0, z0]; // esquerda-frente baixo
  const B = [x1, y0, z0]; // direita-frente baixo
  const C = [x1, y0, z1]; // direita-trás baixo
  const D = [x0, y0, z1]; // esquerda-trás baixo

  // topo inclinado (somente na direita)
  const F = [x1, h, z0];  // direita-frente topo
  const G = [x1, h, z1];  // direita-trás topo

  // Topo inclinado (A-F-G-D)
  addTri(positions, normals, A, F, G);
  addTri(positions, normals, A, G, D);

  // Base (A-B-C-D)
  addTri(positions, normals, A, C, B);
  addTri(positions, normals, A, D, C);

  // Face frontal (A-B-F)
  addTri(positions, normals, A, B, F);

  // Face traseira (D-C-G)
  addTri(positions, normals, D, C, G);

  // Lado direito (B-C-G-F)
  addTri(positions, normals, B, C, G);
  addTri(positions, normals, B, G, F);

  rampVertexCount = positions.length / 3;
  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
  };
}

// --------- buffers ---------

function initBuffers() {
  const floorMesh = createFloorMesh();
  floorBuffers.position = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, floorBuffers.position);
  gl.bufferData(gl.ARRAY_BUFFER, floorMesh.positions, gl.STATIC_DRAW);

  floorBuffers.normal = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, floorBuffers.normal);
  gl.bufferData(gl.ARRAY_BUFFER, floorMesh.normals, gl.STATIC_DRAW);

  const rampMesh = createRampMesh();
  rampBuffers.position = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, rampBuffers.position);
  gl.bufferData(gl.ARRAY_BUFFER, rampMesh.positions, gl.STATIC_DRAW);

  rampBuffers.normal = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, rampBuffers.normal);
  gl.bufferData(gl.ARRAY_BUFFER, rampMesh.normals, gl.STATIC_DRAW);
}

// --------- main / render ---------

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
  gl.clearColor(0.38, 0.71, 1.0, 1.0); // céu

  requestAnimationFrame(render);
}

function render() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.useProgram(program);

  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const projection = mat4Perspective(45, aspect, 0.1, 100);

  // Câmera mostrando plataforma à esquerda e rampa à direita
  const eye = [0.0, 5.0, 14.0];
  const center = [0.0, 1.0, 0.0];
  const up = [0.0, 1.0, 0.0];

  const view = mat4LookAt(eye, center, up);
  const model = mat4Identity();

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

  const aPosition = gl.getAttribLocation(program, 'aPosition');
  const aNormal = gl.getAttribLocation(program, 'aNormal');

  // ----- desenha plataforma (plano contínuo) -----
  gl.uniform3fv(uBaseColor, new Float32Array([0.18, 0.60, 0.22]));

  gl.bindBuffer(gl.ARRAY_BUFFER, floorBuffers.position);
  gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(aPosition);

  gl.bindBuffer(gl.ARRAY_BUFFER, floorBuffers.normal);
  gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(aNormal);

  gl.drawArrays(gl.TRIANGLES, 0, floorVertexCount);

  // ----- desenha rampa (morro) -----
  gl.uniform3fv(uBaseColor, new Float32Array([0.18, 0.75, 0.25]));

  gl.bindBuffer(gl.ARRAY_BUFFER, rampBuffers.position);
  gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, rampBuffers.normal);
  gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, 0, 0);

  gl.drawArrays(gl.TRIANGLES, 0, rampVertexCount);

  requestAnimationFrame(render);
}

main();
