class Physics {
    constructor() {
        this.gravity = -9.8;
        this.friction = 0.985;
        this.bounceDamping = 0.6;
        this.minVelocity = 0.02;
    }
    
    updateBall(ball, obstacles, deltaTime) {
        if (!ball.isMoving) return;
        
        // Aplicar fricção
        vec3.scale(ball.velocity, ball.velocity, this.friction);
        
        // Verificar velocidade mínima
        const speed = vec3.length(ball.velocity);
        if (speed < this.minVelocity) {
            vec3.set(ball.velocity, 0, 0, 0);
            ball.isMoving = false;
            return;
        }
        
        // Atualizar posição
        const displacement = vec3.create();
        vec3.scale(displacement, ball.velocity, deltaTime);
        vec3.add(ball.position, ball.position, displacement);
        
        // Colisões com obstáculos
        this.checkCollisions(ball, obstacles);
        
        // Limites do campo
        this.checkBoundaries(ball);
    }
    
    checkCollisions(ball, obstacles) {
        for (const obstacle of obstacles) {
            if (obstacle.type === 'wall') {
                this.checkWallCollision(ball, obstacle);
            } else if (obstacle.type === 'ramp') {
                this.checkRampCollision(ball, obstacle);
            }
        }
    }
    
    checkWallCollision(ball, wall) {
        const ballRadius = 0.2;
        
        // AABB collision
        const closestX = Math.max(wall.min[0], Math.min(ball.position[0], wall.max[0]));
        const closestY = Math.max(wall.min[1], Math.min(ball.position[1], wall.max[1]));
        const closestZ = Math.max(wall.min[2], Math.min(ball.position[2], wall.max[2]));
        
        const distanceX = ball.position[0] - closestX;
        const distanceY = ball.position[1] - closestY;
        const distanceZ = ball.position[2] - closestZ;
        
        const distanceSquared = distanceX * distanceX + distanceY * distanceY + distanceZ * distanceZ;
        
        if (distanceSquared < ballRadius * ballRadius) {
            // Colisão detectada
            const distance = Math.sqrt(distanceSquared);
            const normal = vec3.fromValues(distanceX, distanceY, distanceZ);
            vec3.normalize(normal, normal);
            
            // Afastar a bola da parede
            const penetration = ballRadius - distance;
            const correction = vec3.create();
            vec3.scale(correction, normal, penetration);
            vec3.add(ball.position, ball.position, correction);
            
            // Refletir velocidade
            const dotProduct = vec3.dot(ball.velocity, normal);
            const reflection = vec3.create();
            vec3.scale(reflection, normal, 2 * dotProduct);
            vec3.subtract(ball.velocity, ball.velocity, reflection);
            vec3.scale(ball.velocity, ball.velocity, this.bounceDamping);
        }
    }
    
    checkRampCollision(ball, ramp) {
        // Verificar se a bola está na área da rampa
        if (ball.position[0] > ramp.min[0] && ball.position[0] < ramp.max[0] &&
            ball.position[2] > ramp.min[2] && ball.position[2] < ramp.max[2]) {
            
            // Calcular altura da rampa nesta posição
            const t = (ball.position[2] - ramp.min[2]) / (ramp.max[2] - ramp.min[2]);
            const rampHeight = ramp.min[1] + t * (ramp.max[1] - ramp.min[1]);
            
            if (ball.position[1] <= rampHeight + 0.2) {
                ball.position[1] = rampHeight + 0.2;
                
                // Adicionar componente de deslize na rampa
                ball.velocity[1] = Math.max(ball.velocity[1], 0);
            }
        }
    }
    
    checkBoundaries(ball) {
        const fieldSize = 25;
        
        // Verificar se caiu fora do campo
        if (Math.abs(ball.position[0]) > fieldSize || 
            Math.abs(ball.position[2]) > fieldSize ||
            ball.position[1] < -5) {
            
            ball.outOfBounds = true;
            vec3.set(ball.velocity, 0, 0, 0);
            ball.isMoving = false;
        }
    }
    
    checkHoleCollision(ball, holePosition, holeRadius) {
        const dx = ball.position[0] - holePosition[0];
        const dz = ball.position[2] - holePosition[2];
        const distance = Math.sqrt(dx * dx + dz * dz);
        
        const speed = vec3.length(ball.velocity);
        
        // Bola precisa estar devagar e próxima do buraco
        if (distance < holeRadius && speed < 2.0) {
            if (distance < holeRadius * 0.5) {
                // Bola caiu no buraco!
                ball.inHole = true;
                vec3.set(ball.velocity, 0, 0, 0);
                ball.isMoving = false;
                
                // Animar bola caindo
                ball.position[1] -= 0.05;
                return true;
            } else {
                // Puxar bola para o centro do buraco
                const pullStrength = 0.1;
                ball.velocity[0] -= dx * pullStrength;
                ball.velocity[2] -= dz * pullStrength;
            }
        }
        
        return false;
    }
}