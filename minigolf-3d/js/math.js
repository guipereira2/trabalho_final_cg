// js/math.js

export function mat4Identity() {
  return [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1
  ];
}

export function mat4Multiply(a, b) {
  const out = new Array(16);
  for (let i = 0; i < 4; i++) {
    const ai0 = a[i];      const ai1 = a[i + 4];
    const ai2 = a[i + 8];  const ai3 = a[i + 12];
    out[i]      = ai0 * b[0]  + ai1 * b[1]  + ai2 * b[2]  + ai3 * b[3];
    out[i + 4]  = ai0 * b[4]  + ai1 * b[5]  + ai2 * b[6]  + ai3 * b[7];
    out[i + 8]  = ai0 * b[8]  + ai1 * b[9]  + ai2 * b[10] + ai3 * b[11];
    out[i + 12] = ai0 * b[12] + ai1 * b[13] + ai2 * b[14] + ai3 * b[15];
  }
  return out;
}

export function mat4Perspective(fovyDeg, aspect, near, far) {
  const fovy = fovyDeg * Math.PI / 180;
  const f = 1.0 / Math.tan(fovy / 2);
  const nf = 1 / (near - far);

  const out = new Array(16).fill(0);
  out[0] = f / aspect;
  out[5] = f;
  out[10] = (far + near) * nf;
  out[11] = -1;
  out[14] = (2 * far * near) * nf;
  return out;
}

export function mat4LookAt(eye, center, up) {
  const [ex, ey, ez] = eye;
  const [cx, cy, cz] = center;
  const [ux, uy, uz] = up;

  let fx = cx - ex;
  let fy = cy - ey;
  let fz = cz - ez;
  const flen = Math.hypot(fx, fy, fz);
  fx /= flen; fy /= flen; fz /= flen;

  let sx = fy * uz - fz * uy;
  let sy = fz * ux - fx * uz;
  let sz = fx * uy - fy * ux;
  const slen = Math.hypot(sx, sy, sz);
  sx /= slen; sy /= slen; sz /= slen;

  const ux2 = sy * fz - sz * fy;
  const uy2 = sz * fx - sx * fz;
  const uz2 = sx * fy - sy * fx;

  const out = mat4Identity();
  out[0] = sx;  out[4] = sy;  out[8]  = sz;
  out[1] = ux2; out[5] = uy2; out[9]  = uz2;
  out[2] = -fx; out[6] = -fy; out[10] = -fz;

  out[12] = -(sx * ex + sy * ey + sz * ez);
  out[13] = -(ux2 * ex + uy2 * ey + uz2 * ez);
  out[14] =  (fx * ex + fy * ey + fz * ez);

  return out;
}

export function mat4Translation(tx, ty, tz) {
  return [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    tx, ty, tz, 1
  ];
}

export function mat4RotationY(angle) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return [
    c, 0, s, 0,
    0, 1, 0, 0,
   -s, 0, c, 0,
    0, 0, 0, 1
  ];
}
