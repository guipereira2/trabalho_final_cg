// js/models.js

// ---------- Esfera da bolinha ----------

export function generateSphere(radius = 1, latBands = 20, longBands = 20) {
  const positions = [];
  const normals = [];
  const texCoords = [];
  const indices = [];

  for (let lat = 0; lat <= latBands; lat++) {
    const theta = lat * Math.PI / latBands;
    const sinTheta = Math.sin(theta);
    const cosTheta = Math.cos(theta);

    for (let lon = 0; lon <= longBands; lon++) {
      const phi = lon * 2 * Math.PI / longBands;
      const sinPhi = Math.sin(phi);
      const cosPhi = Math.cos(phi);

      const x = cosPhi * sinTheta;
      const y = cosTheta;
      const z = sinPhi * sinTheta;

      positions.push(radius * x, radius * y, radius * z);
      normals.push(x, y, z);
      texCoords.push(lon / longBands, lat / latBands);
    }
  }

  for (let lat = 0; lat < latBands; lat++) {
    for (let lon = 0; lon < longBands; lon++) {
      const first = lat * (longBands + 1) + lon;
      const second = first + longBands + 1;

      indices.push(first, second, first + 1);
      indices.push(second, second + 1, first + 1);
    }
  }

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    texCoords: new Float32Array(texCoords),
    indices: new Uint16Array(indices),
  };
}

// ---------- Constantes do campo ----------

export const COURSE_CONSTANTS = {
  platformStartX: -8.0,
  platformEndX:   -2.0,
  rampStartX:     -2.0,
  rampEndX:        4.0,
  minZ:          -2.0,
  maxZ:           2.0,
  rampHeight:     3.0,
  holeX:          3.4,
  holeZ:          0.0,
  holeRadius:     0.6,
  wallHeight:     1.0,
  wallThickness:  0.5
};

function pushTri(data, p0, p1, p2, n0, n1, n2, uv0, uv1, uv2) {
  data.positions.push(...p0, ...p1, ...p2);
  data.normals.push(...n0, ...n1, ...n2);
  data.texCoords.push(...uv0, ...uv1, ...uv2);
}

// ===== Campo (grama) – plataforma + rampa =====

export function generateCourse() {
  const data = {
    positions: [],
    normals: [],
    texCoords: []
  };

  const {
    platformStartX: x0,
    platformEndX:   x1,
    rampStartX:     rx0,
    rampEndX:       rx1,
    minZ:           z0,
    maxZ:           z1,
    rampHeight:     h
  } = COURSE_CONSTANTS;

  const yFlat = 0.0;
  const nUp = [0, 1, 0];

  // Plataforma plana – UV de 0 a 1
  const A = [x0, yFlat, z0];
  const B = [x1, yFlat, z0];
  const C = [x1, yFlat, z1];
  const D = [x0, yFlat, z1];

  const uvA = [0, 0];
  const uvB = [1, 0];
  const uvC = [1, 1];
  const uvD = [0, 1];

  pushTri(data, A, B, C, nUp, nUp, nUp, uvA, uvB, uvC);
  pushTri(data, A, C, D, nUp, nUp, nUp, uvA, uvC, uvD);

  // Rampa – também mapeada 0..1
  const E = [rx0, yFlat, z0];
  const F = [rx1, yFlat + h, z0];
  const G = [rx1, yFlat + h, z1];
  const H = [rx0, yFlat, z1];

  const v1 = [F[0] - E[0], F[1] - E[1], F[2] - E[2]];
  const v2 = [H[0] - E[0], H[1] - E[1], H[2] - E[2]];
  const nx = v1[1] * v2[2] - v1[2] * v2[1];
  const ny = v1[2] * v2[0] - v1[0] * v2[2];
  const nz = v1[0] * v2[1] - v1[1] * v2[0];
  const len = Math.hypot(nx, ny, nz) || 1.0;
  const nRamp = [nx / len, ny / len, nz / len];

  const uvE = [0, 0];
  const uvF = [1, 0];
  const uvG = [1, 1];
  const uvH = [0, 1];

  pushTri(data, E, F, G, nRamp, nRamp, nRamp, uvE, uvF, uvG);
  pushTri(data, E, G, H, nRamp, nRamp, nRamp, uvE, uvG, uvH);

  return {
    positions:   new Float32Array(data.positions),
    normals:     new Float32Array(data.normals),
    texCoords:   new Float32Array(data.texCoords),
    vertexCount: data.positions.length / 3
  };
}

// ===== Paredes (tijolo) =====

export function generateWalls() {
  const data = {
    positions: [],
    normals: [],
    texCoords: []
  };

  const {
    platformStartX: x0,
    rampEndX:       x1,
    minZ:           z0,
    maxZ:           z1,
    wallHeight:     hWall,
    wallThickness:  tWall
  } = COURSE_CONSTANTS;

  function addWallBlock(xStart, xEnd, zInner, zOuter) {
    const y0 = 0.0;
    const y1 = hWall;

    const A = [xStart, y0, zInner];
    const B = [xEnd,   y0, zInner];
    const C = [xEnd,   y0, zOuter];
    const D = [xStart, y0, zOuter];

    const E = [xStart, y1, zInner];
    const F = [xEnd,   y1, zInner];
    const G = [xEnd,   y1, zOuter];
    const H = [xStart, y1, zOuter];

    const uv00 = [0, 0];
    const uv10 = [1, 0];
    const uv11 = [1, 1];
    const uv01 = [0, 1];

    const nTop = [0, 1, 0];
    pushTri(data, E, F, G, nTop, nTop, nTop, uv00, uv10, uv11);
    pushTri(data, E, G, H, nTop, nTop, nTop, uv00, uv11, uv01);

    const nBottom = [0, -1, 0];
    pushTri(data, A, C, B, nBottom, nBottom, nBottom, uv00, uv11, uv10);
    pushTri(data, A, D, C, nBottom, nBottom, nBottom, uv00, uv01, uv11);

    const nFront = zInner > zOuter ? [0, 0, -1] : [0, 0, 1];
    pushTri(data, A, B, F, nFront, nFront, nFront, uv00, uv10, uv11);
    pushTri(data, A, F, E, nFront, nFront, nFront, uv00, uv11, uv01);

    const nBack = zInner > zOuter ? [0, 0, 1] : [0, 0, -1];
    pushTri(data, D, C, G, nBack, nBack, nBack, uv00, uv10, uv11);
    pushTri(data, D, G, H, nBack, nBack, nBack, uv00, uv11, uv01);

    const nRight = [1, 0, 0];
    pushTri(data, B, C, G, nRight, nRight, nRight, uv00, uv10, uv11);
    pushTri(data, B, G, F, nRight, nRight, nRight, uv00, uv11, uv01);

    const nLeft = [-1, 0, 0];
    pushTri(data, A, D, H, nLeft, nLeft, nLeft, uv00, uv10, uv11);
    pushTri(data, A, H, E, nLeft, nLeft, nLeft, uv00, uv11, uv01);
  }

  // parede esquerda
  addWallBlock(x0, x1, z0, z0 - tWall);
  // parede direita
  addWallBlock(x0, x1, z1, z1 + tWall);

  return {
    positions:   new Float32Array(data.positions),
    normals:     new Float32Array(data.normals),
    texCoords:   new Float32Array(data.texCoords),
    vertexCount: data.positions.length / 3
  };
}

// ===== Buraco (disco escuro) =====

export function generateHole(segments = 32) {
  const data = {
    positions: [],
    normals: [],
    texCoords: []
  };

  const { holeX, holeZ, holeRadius, rampHeight } = COURSE_CONSTANTS;

  const y = rampHeight + 0.01;
  const center = [holeX, y, holeZ];
  const nUp = [0, 1, 0];

  for (let i = 0; i < segments; i++) {
    const a0 = (i / segments) * Math.PI * 2;
    const a1 = ((i + 1) / segments) * Math.PI * 2;

    const p1 = [holeX + Math.cos(a0) * holeRadius, y, holeZ + Math.sin(a0) * holeRadius];
    const p2 = [holeX + Math.cos(a1) * holeRadius, y, holeZ + Math.sin(a1) * holeRadius];

    const uvC = [0.5, 0.5];
    const uv1 = [0.5 + 0.5 * Math.cos(a0), 0.5 + 0.5 * Math.sin(a0)];
    const uv2 = [0.5 + 0.5 * Math.cos(a1), 0.5 + 0.5 * Math.sin(a1)];

    pushTri(data, center, p1, p2, nUp, nUp, nUp, uvC, uv1, uv2);
  }

  return {
    positions:   new Float32Array(data.positions),
    normals:     new Float32Array(data.normals),
    texCoords:   new Float32Array(data.texCoords),
    vertexCount: data.positions.length / 3
  };
}

// ===== Flag (mastro + bandeira) =====

export function generateFlag() {
  const positions = [];
  const normals = [];
  const texCoords = [];

  const { holeX, holeZ, rampHeight } = COURSE_CONSTANTS;

  const poleY0 = rampHeight + 0.0;
  const poleY1 = rampHeight + 3.0;
  const poleRadius = 0.05;

  const px = holeX;
  const pz = holeZ;

  const P0 = [px, poleY0, pz];
  const P1 = [px, poleY1, pz];
  const P2 = [px + poleRadius, poleY1, pz];
  const P3 = [px + poleRadius, poleY0, pz];

  const nPole = [0, 0, -1];
  const uv0 = [0, 0];
  const uv1 = [0, 1];
  const uv2 = [1, 1];
  const uv3 = [1, 0];

  // frente mastro
  pushTri( {positions, normals, texCoords}, P0, P1, P2, nPole, nPole, nPole, uv0, uv1, uv2 );
  pushTri( {positions, normals, texCoords}, P0, P2, P3, nPole, nPole, nPole, uv0, uv2, uv3 );

  // bandeira
  const flagW = 1.2;
  const flagH = 0.8;
  const F0 = [px + poleRadius, poleY1, pz];
  const F1 = [px + poleRadius + flagW, poleY1, pz];
  const F2 = [px + poleRadius + flagW, poleY1 - flagH, pz];

  const nFlag = [0, 0, -1];
  const uvf0 = [0, 0];
  const uvf1 = [1, 0];
  const uvf2 = [1, 1];

  positions.push(...F0, ...F1, ...F2);
  normals.push(...nFlag, ...nFlag, ...nFlag);
  texCoords.push(...uvf0, ...uvf1, ...uvf2);

  return {
    positions:   new Float32Array(positions),
    normals:     new Float32Array(normals),
    texCoords:   new Float32Array(texCoords),
    vertexCount: positions.length / 3
  };
}
