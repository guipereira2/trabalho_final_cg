class Camera {
    constructor() {
        this.position = vec3.fromValues(0, 15, 20);
        this.target = vec3.fromValues(0, 0, 0);
        this.up = vec3.fromValues(0, 1, 0);
        this.viewMatrix = mat4.create();
        this.projectionMatrix = mat4.create();
        
        this.currentMode = 0; // 0: aérea, 1: atrás da bola, 2: livre
        this.freeRotationX = 0.3;
        this.freeRotationY = 0;
        
        this.updateViewMatrix();
    }
    
    updateViewMatrix() {
        mat4.lookAt(this.viewMatrix, this.position, this.target, this.up);
    }
    
    setAerialView(ballPos) {
        this.position = vec3.fromValues(ballPos[0], 15, ballPos[2] + 20);
        this.target = vec3.clone(ballPos);
        this.updateViewMatrix();
    }
    
    setBehindBallView(ballPos, aimDirection) {
        const offset = vec3.create();
        vec3.scale(offset, aimDirection, -5);
        offset[1] = 3;
        
        vec3.add(this.position, ballPos, offset);
        this.target = vec3.clone(ballPos);
        this.target[1] += 0.5;
        this.updateViewMatrix();
    }
    
    setFreeView(ballPos) {
    const radius = 15;

    // Calcula posição com base nos ângulos livres
    this.position[0] = ballPos[0] + radius * Math.cos(this.freeRotationY) * Math.cos(this.freeRotationX);
    this.position[1] = ballPos[1] + radius * Math.sin(this.freeRotationX);
    this.position[2] = ballPos[2] + radius * Math.sin(this.freeRotationY) * Math.cos(this.freeRotationX);

    // Impede a câmera de entrar no chão (y muito baixo)
    const minY = 1.0; // altura mínima da câmera
    if (this.position[1] < minY) {
        this.position[1] = minY;
    }

    this.target = vec3.clone(ballPos);
    this.updateViewMatrix();
}

    
    switchMode() {
        this.currentMode = (this.currentMode + 1) % 3;
        
        const modes = ['Aérea', 'Atrás da Bola', 'Livre'];
        document.getElementById('camera-mode').textContent = modes[this.currentMode];
    }
    
    rotateFree(dx, dy) {
    // Atualiza ângulos com base no movimento do mouse
    this.freeRotationY += dx * 0.005;   // gira em torno da bola (horizontal)
    this.freeRotationX += dy * 0.005;   // sobe/desce

    // Limita o ângulo vertical para não passar por baixo nem virar demais
    const minPitch = -Math.PI / 3;  // -60°
    const maxPitch =  Math.PI / 3;  //  60°
    this.freeRotationX = Math.max(minPitch, Math.min(maxPitch, this.freeRotationX));
}

    updateProjection(width, height) {
        const aspect = width / height;
        mat4.perspective(this.projectionMatrix, Math.PI / 4, aspect, 0.1, 1000);
    }
    
    update(ballPos, aimDirection) {
    switch (this.currentMode) {
        case 0:
            this.setAerialView(ballPos);
            break;
        case 1:
            this.setBehindBallView(ballPos, aimDirection);
            break;
        case 2:
            this.setFreeView(ballPos);
            break;
    }
}
    
    getPosition() {
        return this.position;
    }
}