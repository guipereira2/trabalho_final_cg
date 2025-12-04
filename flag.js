export function createFlag(gl, width = 1, height = 0.6, subdiv = 20) {
    const positions = [];
    const normals = [];
    const uvs = [];
    const indices = [];

    for (let y = 0; y <= subdiv; y++) {
        for (let x = 0; x <= subdiv; x++) {
            const px = (x / subdiv) * width;
            const py = (y / subdiv) * height;

            positions.push(px, py, 0);
            normals.push(0, 0, 1);
            uvs.push(x / subdiv, y / subdiv);
        }
    }

    for (let y = 0; y < subdiv; y++) {
        for (let x = 0; x < subdiv; x++) {
            const a = y * (subdiv + 1) + x;
            const b = a + subdiv + 1;

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
