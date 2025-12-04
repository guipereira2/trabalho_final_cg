export function createGolfBall(gl, subdivisions = 32) {
    const positions = [];
    const normals = [];
    const uvs = [];
    const indices = [];

    for (let lat = 0; lat <= subdivisions; lat++) {
        const theta = lat * Math.PI / subdivisions;
        const sinTheta = Math.sin(theta);
        const cosTheta = Math.cos(theta);

        for (let lon = 0; lon <= subdivisions; lon++) {
            const phi = lon * 2 * Math.PI / subdivisions;
            const sinPhi = Math.sin(phi);
            const cosPhi = Math.cos(phi);

            // Base sphere vertex
            let x = sinTheta * cosPhi;
            let y = cosTheta;
            let z = sinTheta * sinPhi;

            // ----- DIMPLING -----
            // Dimples using a periodic noise-like function
            const dimpleStrength = 0.03;
            const freq = 18.0;

            const pattern = Math.sin(x * freq) * Math.sin(y * freq) * Math.sin(z * freq);
            const displacement = dimpleStrength * pattern;

            x += displacement * x;
            y += displacement * y;
            z += displacement * z;

            positions.push(x, y, z);
            normals.push(x, y, z); // sphere normals
            uvs.push(lon / subdivisions, lat / subdivisions);
        }
    }

    // ---- INDICES ----
    for (let lat = 0; lat < subdivisions; lat++) {
        for (let lon = 0; lon < subdivisions; lon++) {
            const a = lat * (subdivisions + 1) + lon;
            const b = a + subdivisions + 1;

            indices.push(a, b, a + 1);
            indices.push(b, b + 1, a + 1);
        }
    }

    return {
        positions: createBuffer(gl, positions),
        normals: createBuffer(gl, normals),
        uvs: createBuffer(gl, uvs),
        indices: createIndexBuffer(gl, indices),
        count: indices.length
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
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(data), gl.STATIC_DRAW);
    return buffer;
}
