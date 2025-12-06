class GolfBall {
    constructor() {
        this.position = vec3.fromValues(0, 0.2, -10);
        this.velocity = vec3.create();
        this.initialPosition = vec3.clone(this.position);
        this.isMoving = false;
        this.inHole = false;
        this.outOfBounds = false;
        this.radius = 0.2;
        
        // Direção de mira (sistema de estilingue)
        this.aimAngle = 0;
        this.aimDirection = vec3.fromValues(0, 0, 1);
        this.aimPower = 0; // Distância do arrasto
        
        // Força do tiro
        this.power = 0;
        this.charging = false;
        
        // Posição do mouse para estilingue
        this.mouseStartPos = null;
        this.mouseCurrentPos = null;
    }
    
    reset() {
        vec3.copy(this.position, this.initialPosition);
        vec3.set(this.velocity, 0, 0, 0);
        this.isMoving = false;
        this.inHole = false;
        this.outOfBounds = false;
        this.power = 0;
        this.aimPower = 0;
        this.charging = false;
        this.mouseStartPos = null;
        this.mouseCurrentPos = null;
    }
    
    updateAimFromMouse(mouseX, mouseY, ballScreenPos) {
        if (!this.mouseStartPos) return;
        
        // Calcular vetor do arrasto
        const dx = mouseX - this.mouseStartPos.x;
        const dy = mouseY - this.mouseStartPos.y;
        
        // Calcular ângulo (direção oposta ao arrasto)
        this.aimAngle = Math.atan2(-dx, dy) + Math.PI;

        // Calcular força baseada na distância
        const distance = Math.sqrt(dx * dx + dy * dy);
        this.aimPower = Math.min(distance / 3, 100);
        this.power = this.aimPower;
        
        // Atualizar direção
        this.updateAimDirection();
    }
    
    updateAimDirection() {
    this.aimDirection[0] = Math.sin(this.aimAngle);
    this.aimDirection[1] = 0;
    this.aimDirection[2] = Math.cos(this.aimAngle);
    vec3.normalize(this.aimDirection, this.aimDirection);
}

    rotateAim(delta) {
        this.aimAngle += delta;
        this.updateAimDirection();
    }
    
    startCharging(mouseX, mouseY) {
        if (!this.isMoving) {
            this.charging = true;
            this.power = 0;
            this.aimPower = 0;
            this.mouseStartPos = {x: mouseX, y: mouseY};
        }
    }
    
    updateCharge(mouseX, mouseY) {
        if (this.charging && this.mouseStartPos) {
            const dx = mouseX - this.mouseStartPos.x;
            const dy = mouseY - this.mouseStartPos.y;
            
            const distance = Math.sqrt(dx * dx + dy * dy);
            this.aimPower = Math.min(distance / 3, 100);
            this.power = this.aimPower;
            
            this.aimAngle = Math.atan2(dx, dy) + Math.PI;
            this.updateAimDirection();
            
            document.getElementById('power-fill').style.width = this.power + '%';
        }
    }
    
    shoot() {
        if (this.charging && !this.isMoving) {
            // Garantir que há força mínima
            if (this.power < 5) {
                this.power = 50; // Força padrão se muito fraco
            }
            
            const maxForce = 15;
            const force = (this.power / 100) * maxForce;
            
            vec3.scale(this.velocity, this.aimDirection, force);
            this.isMoving = true;
            this.charging = false;
            this.power = 0;
            this.aimPower = 0;
            this.mouseStartPos = null;
            this.mouseCurrentPos = null;
            
            document.getElementById('power-fill').style.width = '0%';
            
            return true; // Tiro realizado
        }
        this.charging = false;
        this.mouseStartPos = null;
        this.mouseCurrentPos = null;
        return false;
    }
    
    getModelMatrix() {
        const modelMatrix = mat4.create();
        mat4.translate(modelMatrix, modelMatrix, this.position);
        return modelMatrix;
    }
    
    getAimArrowMatrix() {
        const modelMatrix = mat4.create();
        mat4.translate(modelMatrix, modelMatrix, this.position);
        mat4.rotateY(modelMatrix, modelMatrix, -this.aimAngle);
        
        // Tamanho da seta baseado na força
        const arrowLength = 1 + (this.aimPower / 100) * 2;
        
        mat4.translate(modelMatrix, modelMatrix, [0, 0.1, arrowLength * 0.7]);
        mat4.scale(modelMatrix, modelMatrix, [0.2, 0.2, arrowLength]);
        return modelMatrix;
    }
}