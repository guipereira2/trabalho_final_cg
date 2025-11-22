// main.js
import { mat4Identity, mat4Multiply, mat4Perspective, mat4LookAt } from './math.js';
import { generateSphere } from './models.js';

let gl;
let program;
let sphere;
let buffers = {};
let texture;

let angle = 0;

async function main() {
  const canvas = document.getElementById('glcanvas');
  gl = canvas.getContext('webgl');

  if (!gl) {
    alert('WebGL não suportado');
    return;
  }

  // Carrega shaders (você pode também embutir em strings ao invés de fetch)
  const vsSource = await fetch('../shaders/vertex.glsl').then(r => r.text());
  const fsSource = await fetch('../shaders/fragment.glsl').then(r => r.text());

  const vs = compileShader(gl.VERTEX_SHADER, vsSource);
  const fs = compileShader(gl.FRAGMENT_SHADER, fsSource);

  program = createProgram(vs, fs);
  gl.useProgram(program);

  // Gera bolinha
  sphere = generateSphere(1.0, 24, 24);
  initBuffers();
  await loadTexture('../textures/golfball.png');

  gl.enable(gl.DEPTH_TEST);
  gl.clearColor(0.1, 0.2, 0.3, 1.0);

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
  buffers.position = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
  gl.bufferData(gl.ARRAY_BUFFER, sphere.positions, gl.STATIC_DRAW);

  buffers.normal = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normal);
  gl.bufferData(gl.ARRAY_BUFFER, sphere.normals, gl.STATIC_DRAW);

  buffers.texCoord = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.texCoord);
  gl.bufferData(gl.ARRAY_BUFFER, sphere.texCoords, gl.STATIC_DRAW);

  buffers.indices = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, sphere.indices, gl.STATIC_DRAW);
}

function loadTexture(url) {
  return new Promise((resolve) => {
    texture = gl.createTexture();
    const image = new Image();
    image.onload = function () {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,
                    gl.UNSIGNED_BYTE, image);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

      resolve();
    };
    image.src = url;
  });
}

function render(timestamp) {
  angle = (timestamp * 0.0005) % (2 * Math.PI);

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.useProgram(program);

  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const projection = mat4Perspective(45, aspect, 0.1, 100);
  const view = mat4LookAt(
    [Math.sin(angle) * 6, 3, Math.cos(angle) * 6], // posição da câmera girando
    [0, 0, 0],                                     // olha para a origem
    [0, 1, 0]                                      // eixo Y para cima
  );

  let model = mat4Identity(); // depois você aplica translate/rotate para fazer a bola rolar

  const uModel = gl.getUniformLocation(program, 'uModel');
  const uView = gl.getUniformLocation(program, 'uView');
  const uProjection = gl.getUniformLocation(program, 'uProjection');
  gl.uniformMatrix4fv(uModel, false, new Float32Array(model));
  gl.uniformMatrix4fv(uView, false, new Float32Array(view));
  gl.uniformMatrix4fv(uProjection, false, new Float32Array(projection));

  // Luz
  const uLightDirection = gl.getUniformLocation(program, 'uLightDirection');
  const uLightColor = gl.getUniformLocation(program, 'uLightColor');
  const uAmbientColor = gl.getUniformLocation(program, 'uAmbientColor');
  gl.uniform3fv(uLightDirection, new Float32Array([0.5, 1.0, 0.3]));
  gl.uniform3fv(uLightColor, new Float32Array([1.0, 1.0, 1.0]));
  gl.uniform3fv(uAmbientColor, new Float32Array([0.2, 0.2, 0.25]));

  // Atributos
  const aPosition = gl.getAttribLocation(program, 'aPosition');
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
  gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(aPosition);

  const aNormal = gl.getAttribLocation(program, 'aNormal');
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normal);
  gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(aNormal);

  const aTexCoord = gl.getAttribLocation(program, 'aTexCoord');
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.texCoord);
  gl.vertexAttribPointer(aTexCoord, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(aTexCoord);

  // Textura
  const uTexture = gl.getUniformLocation(program, 'uTexture');
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.uniform1i(uTexture, 0);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);
  gl.drawElements(gl.TRIANGLES, sphere.indices.length, gl.UNSIGNED_SHORT, 0);

  requestAnimationFrame(render);
}

main();
