import { createProgram } from "./glutils.js";

export class Renderer {
    constructor(gl) {
        this.gl = gl;

        this.program = createProgram(gl,
            `
            attribute vec3 pos;
            uniform mat4 mvp;
            void main() { gl_Position = mvp * vec4(pos,1.0); }
            `,
            `
            precision mediump float;
            void main() { gl_FragColor = vec4(0.2,0.8,0.3,1.0); }
            `
        );

        this.posLoc = gl.getAttribLocation(this.program, "pos");
        this.mvpLoc = gl.getUniformLocation(this.program, "mvp");

        // Plano simples
        this.planeVBO = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.planeVBO);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            -3,0,-6,
             3,0,-6,
            -3,0, 6,
             3,0, 6
        ]), gl.STATIC_DRAW);

        // Bola (esfera muito simples: 1 ponto)
        this.ballVBO = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.ballVBO);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0,0,0]), gl.STATIC_DRAW);
    }

    getCamera(cameraMode, ballPos) {
        if (cameraMode === "top")
            return [ [1,0,0,0,
                      0,0,1,0,
                      0,-1,0,0,
                      0,10,0,1] ];

        if (cameraMode === "back")
            return [ [1,0,0,0,
                      0,1,0,0,
                      0,0,1,0,
                      ballPos[0],2,ballPos[2]+6,1] ];

        return [ [1,0,0,0,
                  0,1,0,0,
                  0,0,1,0,
                  0,2,8,1] ];
    }

    renderScene(objects, physics, cameraMode) {
        const gl = this.gl;
        gl.clearColor(0.4,0.6,1.0,1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.useProgram(this.program);

        const mvp = new Float32Array([
            1,0,0,0,
            0,1,0,0,
            0,0,1,0,
            0,0,0,1
        ]);
        gl.uniformMatrix4fv(this.mvpLoc, false, mvp);

        // Desenha plano
        gl.bindBuffer(gl.ARRAY_BUFFER, this.planeVBO);
        gl.vertexAttribPointer(this.posLoc, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.posLoc);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        // Desenha bola
        gl.bindBuffer(gl.ARRAY_BUFFER, this.ballVBO);
        gl.vertexAttribPointer(this.posLoc, 3, gl.FLOAT, false, 0, 0);
        gl.uniformMatrix4fv(this.mvpLoc, false, mvp);
        gl.drawArrays(gl.POINTS, 0, 1);
    }
}
