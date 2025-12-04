// Utilidades WebGL

function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Erro ao compilar shader:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    
    return shader;
}

function createProgram(gl, vertexShader, fragmentShader) {
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Erro ao linkar programa:', gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
        return null;
    }
    
    return program;
}

async function loadShader(gl, vertexPath, fragmentPath) {
    const vertexSource = await fetch(vertexPath).then(r => r.text());
    const fragmentSource = await fetch(fragmentPath).then(r => r.text());
    
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
    
    return createProgram(gl, vertexShader, fragmentShader);
}

function createTexture(gl, imagePath, callback) {
    const texture = gl.createTexture();
    const image = new Image();
    
    image.onload = function() {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        
        if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
            gl.generateMipmap(gl.TEXTURE_2D);
        } else {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        }
        
        if (callback) callback();
    };
    
    image.src = imagePath;
    return texture;
}

function isPowerOf2(value) {
    return (value & (value - 1)) === 0;
}

function createSphere(radius, latBands, longBands) {
    const positions = [];
    const normals = [];
    const texCoords = [];
    const indices = [];
    
    for (let lat = 0; lat <= latBands; lat++) {
        const theta = lat * Math.PI / latBands;
        const sinTheta = Math.sin(theta);
        const cosTheta = Math.cos(theta);
        
        for (let long = 0; long <= longBands; long++) {
            const phi = long * 2 * Math.PI / longBands;
            const sinPhi = Math.sin(phi);
            const cosPhi = Math.cos(phi);
            
            const x = cosPhi * sinTheta;
            const y = cosTheta;
            const z = sinPhi * sinTheta;
            
            positions.push(radius * x, radius * y, radius * z);
            normals.push(x, y, z);
            texCoords.push(1 - (long / longBands), 1 - (lat / latBands));
        }
    }
    
    for (let lat = 0; lat < latBands; lat++) {
        for (let long = 0; long < longBands; long++) {
            const first = lat * (longBands + 1) + long;
            const second = first + longBands + 1;
            
            indices.push(first, second, first + 1);
            indices.push(second, second + 1, first + 1);
        }
    }
    
    return { positions, normals, texCoords, indices };
}

function createCube(size) {
    const s = size / 2;
    
    const positions = [
        // Front
        -s, -s, s,  s, -s, s,  s, s, s,  -s, s, s,
        // Back
        -s, -s, -s,  -s, s, -s,  s, s, -s,  s, -s, -s,
        // Top
        -s, s, -s,  -s, s, s,  s, s, s,  s, s, -s,
        // Bottom
        -s, -s, -s,  s, -s, -s,  s, -s, s,  -s, -s, s,
        // Right
        s, -s, -s,  s, s, -s,  s, s, s,  s, -s, s,
        // Left
        -s, -s, -s,  -s, -s, s,  -s, s, s,  -s, s, -s
    ];
    
    const normals = [
        0, 0, 1,  0, 0, 1,  0, 0, 1,  0, 0, 1,
        0, 0, -1,  0, 0, -1,  0, 0, -1,  0, 0, -1,
        0, 1, 0,  0, 1, 0,  0, 1, 0,  0, 1, 0,
        0, -1, 0,  0, -1, 0,  0, -1, 0,  0, -1, 0,
        1, 0, 0,  1, 0, 0,  1, 0, 0,  1, 0, 0,
        -1, 0, 0,  -1, 0, 0,  -1, 0, 0,  -1, 0, 0
    ];
    
    const texCoords = [
        0, 0,  1, 0,  1, 1,  0, 1,
        0, 0,  1, 0,  1, 1,  0, 1,
        0, 0,  1, 0,  1, 1,  0, 1,
        0, 0,  1, 0,  1, 1,  0, 1,
        0, 0,  1, 0,  1, 1,  0, 1,
        0, 0,  1, 0,  1, 1,  0, 1
    ];
    
    const indices = [];
    for (let i = 0; i < 6; i++) {
        const offset = i * 4;
        indices.push(offset, offset + 1, offset + 2);
        indices.push(offset, offset + 2, offset + 3);
    }
    
    return { positions, normals, texCoords, indices };
}

function createPlane(width, height) {
    const w = width / 2;
    const h = height / 2;
    
    const positions = [
        -w, 0, -h,
        w, 0, -h,
        w, 0, h,
        -w, 0, h
    ];
    
    const normals = [
        0, 1, 0,
        0, 1, 0,
        0, 1, 0,
        0, 1, 0
    ];
    
    const texCoords = [
        0, 0,
        5, 0,
        5, 5,
        0, 5
    ];
    
    const indices = [0, 1, 2, 0, 2, 3];
    
    return { positions, normals, texCoords, indices };
}

function createCylinder(radiusTop, radiusBottom, height, radialSegments) {
    const positions = [];
    const normals = [];
    const texCoords = [];
    const indices = [];
    
    const halfHeight = height / 2;
    
    // Top cap
    for (let i = 0; i <= radialSegments; i++) {
        const angle = (i / radialSegments) * Math.PI * 2;
        const x = Math.cos(angle) * radiusTop;
        const z = Math.sin(angle) * radiusTop;
        
        positions.push(x, halfHeight, z);
        normals.push(0, 1, 0);
        texCoords.push(i / radialSegments, 1);
    }
    
    // Bottom cap
    for (let i = 0; i <= radialSegments; i++) {
        const angle = (i / radialSegments) * Math.PI * 2;
        const x = Math.cos(angle) * radiusBottom;
        const z = Math.sin(angle) * radiusBottom;
        
        positions.push(x, -halfHeight, z);
        normals.push(0, -1, 0);
        texCoords.push(i / radialSegments, 0);
    }
    
    // Indices
    for (let i = 0; i < radialSegments; i++) {
        const a = i;
        const b = i + 1;
        const c = i + radialSegments + 1;
        const d = i + radialSegments + 2;
        
        indices.push(a, b, c);
        indices.push(b, d, c);
    }
    
    return { positions, normals, texCoords, indices };
}