// js/main.js
import {
  mat4Identity,
  mat4Multiply,
  mat4Perspective,
  mat4LookAt,
  mat4Translation,
  mat4RotationY
} from './math.js';

import {
  generateSphere,
  generateCourse,
  generateWalls,
  generateHole,
  generateFlag,
  COURSE_CONSTANTS
} from './models.js';

import {
  initGameInput,
  updateGame,
  getBallXZ,
  getAimingAngle,
  getPower01,
  gameState,
  BALL_RADIUS
} from './game.js';

let gl;
let program;
let lineProgram;

let sphere;
let sphereBuffers = {};
let course;
let courseBuffers = {};
let walls;
let wallsBuffers = {};
let hole;
let holeBuffers = {};
let flagMesh;
let flagBuffers = {};
let lineBuffer;

const textures = {}; // { ball, grass, brick }

let lastTime = 0;

const strokesSpan = document.getElementById('strokesValue');
const powerFill   = document.getElementById('powerFill');
const msgDiv      = document.getElementById('gameMessage');

// shaders só para a linha de mira
const lineVsSource = `
attribute vec3 aPosition;
uniform mat4 uMVP;
void main() {
    gl_Position = uMVP * vec4(aPosition, 1.0);
}
`;

const lineFsSource = `
precision mediump float;
uniform vec3 uColor;
void main() {
    gl_FragColor = vec4(uColor, 1.0);
}
`;

async function main() {
  const canvas = document.getElementById('glcanvas');
  gl = canvas.getContext('webgl');

  if (!gl) {
    alert('WebGL não suportado');
    return;
  }

  initGameInput();

  const vsSource = await fetch('shaders/vertex.glsl').then(r => r.text());
  const fsSource = await fetch('shaders/fragment.glsl').then(r => r.text());
  const vs = compileShader(gl.VERTEX_SHADER, vsSource);
  const fs = compileShader(gl.FRAGMENT_SHADER, fsSource);
  program = createProgram(vs, fs);

  const lvs = compileShader(gl.VERTEX_SHADER, lineVsSource);
  const lfs = compileShader(gl.FRAGMENT_SHADER, lineFsSource);
  lineProgram = createProgram(lvs, lfs);
  lineBuffer = gl.createBuffer();

  sphere = generateSphere(BALL_RADIUS, 32, 32);
  initSphereBuffers();

  course = generateCourse();
  initCourseBuffers();

  walls = generateWalls();
  initWallsBuffers();

  hole = generateHole();
  initHoleBuffers();

  flagMesh = generateFlag();
  initFlagBuffers();

  await Promise.all([
    loadTexture('ball',  'textures/golfball.png'),
    loadTexture('grass', 'textures/grass.png'),
    loadTexture('brick', 'textures/brick.png')
  ]);

  gl.enable(gl.DEPTH_TEST);
  gl.clearColor(0.45, 0.78, 1.0, 1.0); // céu

  lastTime = performance.now();
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

function initSphereBuffers() {
  sphereBuffers.position = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, sphereBuffers.position);
  gl.bufferData(gl.ARRAY_BUFFER, sphere.positions, gl.STATIC_DRAW);

  sphereBuffers.normal = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, sphereBuffers.normal);
  gl.bufferData(gl.ARRAY_BUFFER, sphere.normals, gl.STATIC_DRAW);

  sphereBuffers.texCoord = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, sphereBuffers.texCoord);
  gl.bufferData(gl.ARRAY_BUFFER, sphere.texCoords, gl.STATIC_DRAW);

  sphereBuffers.indices = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sphereBuffers.indices);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, sphere.indices, gl.STATIC_DRAW);
}

function initCourseBuffers() {
  courseBuffers.position = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, courseBuffers.position);
  gl.bufferData(gl.ARRAY_BUFFER, course.positions, gl.STATIC_DRAW);

  courseBuffers.normal = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, courseBuffers.normal);
  gl.bufferData(gl.ARRAY_BUFFER, course.normals, gl.STATIC_DRAW);

  courseBuffers.texCoord = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, courseBuffers.texCoord);
  gl.bufferData(gl.ARRAY_BUFFER, course.texCoords, gl.STATIC_DRAW);
}

function initWallsBuffers() {
  wallsBuffers.position = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, wallsBuffers.position);
  gl.bufferData(gl.ARRAY_BUFFER, walls.positions, gl.STATIC_DRAW);

  wallsBuffers.normal = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, wallsBuffers.normal);
  gl.bufferData(gl.ARRAY_BUFFER, walls.normals, gl.STATIC_DRAW);

  wallsBuffers.texCoord = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, wallsBuffers.texCoord);
  gl.bufferData(gl.ARRAY_BUFFER, walls.texCoords, gl.STATIC_DRAW);
}

function initHoleBuffers() {
  holeBuffers.position = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, holeBuffers.position);
  gl.bufferData(gl.ARRAY_BUFFER, hole.positions, gl.STATIC_DRAW);

  holeBuffers.normal = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, holeBuffers.normal);
  gl.bufferData(gl.ARRAY_BUFFER, hole.normals, gl.STATIC_DRAW);

  holeBuffers.texCoord = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, holeBuffers.texCoord);
  gl.bufferData(gl.ARRAY_BUFFER, hole.texCoords, gl.STATIC_DRAW);
}

function initFlagBuffers() {
  flagBuffers.position = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, flagBuffers.position);
  gl.bufferData(gl.ARRAY_BUFFER, flagMesh.positions, gl.STATIC_DRAW);

  flagBuffers.normal = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, flagBuffers.normal);
  gl.bufferData(gl.ARRAY_BUFFER, flagMesh.normals, gl.STATIC_DRAW);

  flagBuffers.texCoord = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, flagBuffers.texCoord);
  gl.bufferData(gl.ARRAY_BUFFER, flagMesh.texCoords, gl.STATIC_DRAW);
}

// ---- AQUI está o conserto importante: sem REPEAT, funciona com qualquer tamanho de textura ----
function loadTexture(key, url) {
  return new Promise((resolve) => {
    const tex = gl.createTexture();
    const img = new Image();
    img.onload = function () {
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,
        gl.UNSIGNED_BYTE, img);

      // configuração segura para qualquer tamanho de imagem
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

      textures[key] = tex;
      resolve();
    };
    img.src = url;
  });
}

// altura da bola sobre o campo
function getBallYFromCourse(x) {
  const { rampStartX, rampEndX, rampHeight } = COURSE_CONSTANTS;
  const flatY = BALL_RADIUS;

  if (x <= rampStartX) return flatY;
  if (x >= rampEndX)   return flatY + rampHeight;

  const t = (x - rampStartX) / (rampEndX - rampStartX);
  const yRamp = BALL_RADIUS + t * rampHeight;
  return yRamp;
}

// --------- Render loop ---------

function render(now) {
  const dt = (now - lastTime) / 1000;
  lastTime = now;

  updateGame(dt);
  strokesSpan.textContent = gameState.strokes.toString();
  powerFill.style.width = `${(getPower01() * 100).toFixed(1)}%`;

  if (gameState.finished) {
    msgDiv.textContent = `Buraco concluído em ${gameState.strokes} tacada(s)!`;
  } else {
    msgDiv.textContent = '';
  }

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const projection = mat4Perspective(45, aspect, 0.1, 100);

  const [bx, bz] = getBallXZ();
  const by = getBallYFromCourse(bx);

  // câmera um pouco atrás e acima da bola,
  // olhando para o topo da rampa → sensação de estar jogando
  const eye = [bx - 7, by + 6, bz + 12];
  const center = [bx + 1, by + 0.4, bz];
  const up = [0, 1, 0];

  const view = mat4LookAt(eye, center, up);

  // ===== Programa principal =====
  gl.useProgram(program);

  const uModel = gl.getUniformLocation(program, 'uModel');
  const uView = gl.getUniformLocation(program, 'uView');
  const uProjection = gl.getUniformLocation(program, 'uProjection');
  gl.uniformMatrix4fv(uView, false, new Float32Array(view));
  gl.uniformMatrix4fv(uProjection, false, new Float32Array(projection));

  const uLightDirection = gl.getUniformLocation(program, 'uLightDirection');
  const uLightColor = gl.getUniformLocation(program, 'uLightColor');
  const uAmbientColor = gl.getUniformLocation(program, 'uAmbientColor');
  gl.uniform3fv(uLightDirection, new Float32Array([0.3, 1.0, 0.4]));
  gl.uniform3fv(uLightColor, new Float32Array([1.0, 1.0, 1.0]));
  gl.uniform3fv(uAmbientColor, new Float32Array([0.4, 0.45, 0.5])); // mais luz ambiente, menos “túnel preto”

  const uHasTexture = gl.getUniformLocation(program, 'uHasTexture');
  const uSolidColor = gl.getUniformLocation(program, 'uSolidColor');

  const aPosition = gl.getAttribLocation(program, 'aPosition');
  const aNormal = gl.getAttribLocation(program, 'aNormal');
  const aTexCoord = gl.getAttribLocation(program, 'aTexCoord');
  const uTexture = gl.getUniformLocation(program, 'uTexture');

  // ---- Campo (grama) ----
  gl.uniform1i(uHasTexture, 1);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, textures.grass);
  gl.uniform1i(uTexture, 0);
  gl.uniform3fv(uSolidColor, new Float32Array([1, 1, 1]));

  gl.bindBuffer(gl.ARRAY_BUFFER, courseBuffers.position);
  gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(aPosition);

  gl.bindBuffer(gl.ARRAY_BUFFER, courseBuffers.normal);
  gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(aNormal);

  gl.bindBuffer(gl.ARRAY_BUFFER, courseBuffers.texCoord);
  gl.vertexAttribPointer(aTexCoord, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(aTexCoord);

  gl.uniformMatrix4fv(uModel, false, new Float32Array(mat4Identity()));
  gl.drawArrays(gl.TRIANGLES, 0, course.vertexCount);

  // ---- Paredes (tijolos) ----
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, textures.brick);
  gl.uniform1i(uTexture, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, wallsBuffers.position);
  gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, wallsBuffers.normal);
  gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, wallsBuffers.texCoord);
  gl.vertexAttribPointer(aTexCoord, 2, gl.FLOAT, false, 0, 0);

  gl.uniformMatrix4fv(uModel, false, new Float32Array(mat4Identity()));
  gl.drawArrays(gl.TRIANGLES, 0, walls.vertexCount);

  // ---- Buraco (preto) ----
  gl.uniform1i(uHasTexture, 0);
  gl.uniform3fv(uSolidColor, new Float32Array([0.03, 0.03, 0.03]));

  gl.bindBuffer(gl.ARRAY_BUFFER, holeBuffers.position);
  gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, holeBuffers.normal);
  gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, holeBuffers.texCoord);
  gl.vertexAttribPointer(aTexCoord, 2, gl.FLOAT, false, 0, 0);

  gl.uniformMatrix4fv(uModel, false, new Float32Array(mat4Identity()));
  gl.drawArrays(gl.TRIANGLES, 0, hole.vertexCount);

  // ---- Flag ----
  gl.uniform1i(uHasTexture, 0);
  gl.uniform3fv(uSolidColor, new Float32Array([0.82, 0.82, 0.87]));

  gl.bindBuffer(gl.ARRAY_BUFFER, flagBuffers.position);
  gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, flagBuffers.normal);
  gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, flagBuffers.texCoord);
  gl.vertexAttribPointer(aTexCoord, 2, gl.FLOAT, false, 0, 0);

  gl.uniformMatrix4fv(uModel, false, new Float32Array(mat4Identity()));
  gl.drawArrays(gl.TRIANGLES, 0, flagMesh.vertexCount);

  // ---- Bola ----
  gl.uniform1i(uHasTexture, 1);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, textures.ball);
  gl.uniform1i(uTexture, 0);
  gl.uniform3fv(uSolidColor, new Float32Array([1, 1, 1]));

  gl.bindBuffer(gl.ARRAY_BUFFER, sphereBuffers.position);
  gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, sphereBuffers.normal);
  gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, sphereBuffers.texCoord);
  gl.vertexAttribPointer(aTexCoord, 2, gl.FLOAT, false, 0, 0);

  const aim = getAimingAngle();
  const rot = mat4RotationY(-aim);
  const trans = mat4Translation(bx, by, bz);
  const modelBall = mat4Multiply(trans, rot);
  gl.uniformMatrix4fv(uModel, false, new Float32Array(modelBall));

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sphereBuffers.indices);
  gl.drawElements(gl.TRIANGLES, sphere.indices.length, gl.UNSIGNED_SHORT, 0);

  // ---- Linha de mira ----
  renderAimLine(projection, view, bx, by, bz, aim);

  requestAnimationFrame(render);
}

function renderAimLine(projection, view, bx, by, bz, aim) {
  if (gameState.finished) return;

  const len = 4.0;
  const dx = Math.cos(aim) * len;
  const dz = Math.sin(aim) * len;
  const yLine = by + BALL_RADIUS * 0.15;

  const vertices = new Float32Array([
    bx,      yLine, bz,
    bx + dx, yLine, bz + dz
  ]);

  gl.useProgram(lineProgram);

  const uMVP = gl.getUniformLocation(lineProgram, 'uMVP');
  const uColor = gl.getUniformLocation(lineProgram, 'uColor');

  const m = mat4Identity();
  const vp = mat4Multiply(view, m);
  const mvp = mat4Multiply(projection, vp);

  gl.uniformMatrix4fv(uMVP, false, new Float32Array(mvp));
  gl.uniform3fv(uColor, new Float32Array([1.0, 1.0, 1.0]));

  gl.bindBuffer(gl.ARRAY_BUFFER, lineBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW);

  const aPos = gl.getAttribLocation(lineProgram, 'aPosition');
  gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(aPos);

  gl.lineWidth(2.0);
  gl.drawArrays(gl.LINES, 0, 2);
}

main();
