// js/rampaMain.js
import { mat4Identity, mat4Perspective, mat4LookAt, mat4Multiply } from './math.js';

let gl;
let program;
let buffers = {};

const vsSource = `
attribute vec3 aPosition;
attribute vec3 aColor;

uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProjection;

varying vec3 vColor;

void main() {
    gl_Position = uProjection * uView * uModel * vec4(aPosition, 1.0);
    vColor = aColor;
}
`;

const fsSource = `
precision mediump float;

varying vec3 vColor;

void main() {
    gl_FragColor = vec4(vColor, 1.0);
}
`;

// ---------- Helpers de matriz (translação / rotação) ----------

function mat4Translation(tx, ty, tz) {
  return [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    tx, ty, tz, 1
  ];
}

function mat4RotateX(rad) {
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  return [
    1, 0, 0, 0,
    0,  c, s, 0,
    0, -s, c, 0,
    0, 0, 0, 1
  ];
}

// ---------- Inicialização ----------

function main() {
  const canvas = document.getElementById('glcanvas');
  // alpha:true pra deixar o fundo do canvas “sem cenário”, só a cor da página
  gl = canvas.getContext('webgl', { alpha: true });

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
  // fundo transparente (vai aparecer o background do <body>)
  gl.clearColor(0.0, 0.0, 0.0, 0.0);

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


function initBuffers() {
  const positions = new Float32Array([
    -3, 0, -4,
     3, 0, -4,
     3, 0,  4,
    -3, 0, -4,
     3, 0,  4,
    -3, 0,  4,
  ]);

  buffers.position = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

  buffers.color = gl.createBuffer();
  buffers.vertexCount = 6;
}

function setColorForObject(r, g, b) {
  const colors = new Float32Array([
    r, g, b,
    r, g, b,
    r, g, b,
    r, g, b,
    r, g, b,
    r, g, b,
  ]);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
  gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);
}

// ---------- render ----------

function render() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.useProgram(program);

  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const projection = mat4Perspective(45, aspect, 0.1, 100);

  // câmera fixa, olhando da base para o topo, tipo a foto
  const eye = [0, 4.0, 10.0];  // posição da câmera
  const center = [0, 0.5, 0];  // ponto que ela olha
  const up = [0, 1, 0];

  const view = mat4LookAt(eye, center, up);

  const uModel = gl.getUniformLocation(program, 'uModel');
  const uView = gl.getUniformLocation(program, 'uView');
  const uProjection = gl.getUniformLocation(program, 'uProjection');

  gl.uniformMatrix4fv(uView, false, new Float32Array(view));
  gl.uniformMatrix4fv(uProjection, false, new Float32Array(projection));

  const aPosition = gl.getAttribLocation(program, 'aPosition');
  const aColor = gl.getAttribLocation(program, 'aColor');

  // posição 
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
  gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(aPosition);

  // Habilita atributo de cor
  gl.enableVertexAttribArray(aColor);

  // --- parte plana --
  // um retângulo mais curto, deslocado pra perto da câmera
  setColorForObject(0.1, 0.7, 0.25); // verde campo

  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
  gl.vertexAttribPointer(aColor, 3, gl.FLOAT, false, 0, 0);

  let model = mat4Identity();
  // chão mais próximo da câmera
  model = mat4Multiply(mat4Translation(0, 0, 2.5), model);
  gl.uniformMatrix4fv(uModel, false, new Float32Array(model));
  gl.drawArrays(gl.TRIANGLES, 0, buffers.vertexCount);

  // --- plano inclinado em direção ao topo ---
  setColorForObject(0.1, 0.65, 0.2); 

  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
  gl.vertexAttribPointer(aColor, 3, gl.FLOAT, false, 0, 0);

  const rotRamp = mat4RotateX(-Math.PI / 6.0);     // inclinação ~30°
  const transRamp = mat4Translation(0, 0.4, -0.5); // sobe um pouco e puxa pro fundo
  const modelRamp = mat4Multiply(transRamp, rotRamp);

  gl.uniformMatrix4fv(uModel, false, new Float32Array(modelRamp));
  gl.drawArrays(gl.TRIANGLES, 0, buffers.vertexCount);


  requestAnimationFrame(render);
}

main();
