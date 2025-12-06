class Flag {
    constructor(position) {
        this.position = position;
        this.time = 0;
    }
    
    update(deltaTime) {
        this.time += deltaTime;
    }

    getPoleMatrix() {
        const modelMatrix = mat4.create();
        
        // Mastro sai do buraco
        mat4.translate(modelMatrix, modelMatrix, this.position);
        mat4.translate(modelMatrix, modelMatrix, [0, 1.5, 0]); // altura média
        mat4.scale(modelMatrix, modelMatrix, [0.04, 1.5, 0.04]); // fininho
        
        return modelMatrix;
    }

    getFlagMatrix() {
        const modelMatrix = mat4.create();
        
        // Bandeira no topo do mastro
        mat4.translate(modelMatrix, modelMatrix, this.position);
        mat4.translate(modelMatrix, modelMatrix, [0, 2.8, 0]); // topo
        
        // Pequeno offset para o lado + leve ondulação
        const wave = Math.sin(this.time * 2) * 0.05;
        mat4.translate(modelMatrix, modelMatrix, [0.35 + wave, 0, 0]);
        
        // Bandeira triangular/retangular simples
        mat4.scale(modelMatrix, modelMatrix, [0.6, 0.3, 0.05]);
        
        return modelMatrix;
    }
}


// Criar cachorro (mascote/caddie)
class Dog {
    constructor(position) {
        this.position = position;
        this.time = 0;
        this.animationSpeed = 1;
    }
    
    update(deltaTime) {
        this.time += deltaTime * this.animationSpeed;
        
        // Animação simples de balançar o rabo
        this.tailWag = Math.sin(this.time * 5) * 0.3;
    }
    
    // Corpo do cachorro
    getBodyMatrix() {
        const modelMatrix = mat4.create();
        mat4.translate(modelMatrix, modelMatrix, this.position);
        mat4.scale(modelMatrix, modelMatrix, [0.6, 0.4, 1]);
        return modelMatrix;
    }
    
    // Cabeça
    getHeadMatrix() {
        const modelMatrix = mat4.create();
        mat4.translate(modelMatrix, modelMatrix, this.position);
        mat4.translate(modelMatrix, modelMatrix, [0, 0.3, 0.7]);
        mat4.scale(modelMatrix, modelMatrix, [0.4, 0.4, 0.5]);
        return modelMatrix;
    }
    
    // Orelha esquerda
    getLeftEarMatrix() {
        const modelMatrix = mat4.create();
        mat4.translate(modelMatrix, modelMatrix, this.position);
        mat4.translate(modelMatrix, modelMatrix, [-0.25, 0.55, 0.7]);
        mat4.rotateZ(modelMatrix, modelMatrix, 0.3);
        mat4.scale(modelMatrix, modelMatrix, [0.15, 0.3, 0.1]);
        return modelMatrix;
    }
    
    // Orelha direita
    getRightEarMatrix() {
        const modelMatrix = mat4.create();
        mat4.translate(modelMatrix, modelMatrix, this.position);
        mat4.translate(modelMatrix, modelMatrix, [0.25, 0.55, 0.7]);
        mat4.rotateZ(modelMatrix, modelMatrix, -0.3);
        mat4.scale(modelMatrix, modelMatrix, [0.15, 0.3, 0.1]);
        return modelMatrix;
    }
    
    // Focinho
    getSnoutMatrix() {
        const modelMatrix = mat4.create();
        mat4.translate(modelMatrix, modelMatrix, this.position);
        mat4.translate(modelMatrix, modelMatrix, [0, 0.2, 1]);
        mat4.scale(modelMatrix, modelMatrix, [0.25, 0.2, 0.3]);
        return modelMatrix;
    }
    
    // Nariz
    getNoseMatrix() {
        const modelMatrix = mat4.create();
        mat4.translate(modelMatrix, modelMatrix, this.position);
        mat4.translate(modelMatrix, modelMatrix, [0, 0.25, 1.15]);
        mat4.scale(modelMatrix, modelMatrix, [0.1, 0.1, 0.1]);
        return modelMatrix;
    }
    
    // Perna frontal esquerda
    getFrontLeftLegMatrix() {
        const modelMatrix = mat4.create();
        mat4.translate(modelMatrix, modelMatrix, this.position);
        mat4.translate(modelMatrix, modelMatrix, [-0.25, -0.4, 0.4]);
        mat4.scale(modelMatrix, modelMatrix, [0.15, 0.4, 0.15]);
        return modelMatrix;
    }
    
    // Perna frontal direita
    getFrontRightLegMatrix() {
        const modelMatrix = mat4.create();
        mat4.translate(modelMatrix, modelMatrix, this.position);
        mat4.translate(modelMatrix, modelMatrix, [0.25, -0.4, 0.4]);
        mat4.scale(modelMatrix, modelMatrix, [0.15, 0.4, 0.15]);
        return modelMatrix;
    }
    
    // Perna traseira esquerda
    getBackLeftLegMatrix() {
        const modelMatrix = mat4.create();
        mat4.translate(modelMatrix, modelMatrix, this.position);
        mat4.translate(modelMatrix, modelMatrix, [-0.25, -0.4, -0.4]);
        mat4.scale(modelMatrix, modelMatrix, [0.15, 0.4, 0.15]);
        return modelMatrix;
    }
    
    // Perna traseira direita
    getBackRightLegMatrix() {
        const modelMatrix = mat4.create();
        mat4.translate(modelMatrix, modelMatrix, this.position);
        mat4.translate(modelMatrix, modelMatrix, [0.25, -0.4, -0.4]);
        mat4.scale(modelMatrix, modelMatrix, [0.15, 0.4, 0.15]);
        return modelMatrix;
    }
    
    // Rabo (com animação)
    getTailMatrix() {
        const modelMatrix = mat4.create();
        mat4.translate(modelMatrix, modelMatrix, this.position);
        mat4.translate(modelMatrix, modelMatrix, [0, 0.1, -0.7]);
        mat4.rotateX(modelMatrix, modelMatrix, -0.5 + this.tailWag);
        mat4.translate(modelMatrix, modelMatrix, [0, 0.2, 0]);
        mat4.scale(modelMatrix, modelMatrix, [0.1, 0.4, 0.1]);
        return modelMatrix;
    }
}