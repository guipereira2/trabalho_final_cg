class HUD {
    constructor() {
        this.strokes = 0;
        this.par = 3;
        this.bestScore = localStorage.getItem('bestScore') || '-';
        
        this.updateDisplay();
    }
    
    addStroke() {
        this.strokes++;
        this.updateDisplay();
    }
    
    reset() {
        this.strokes = 0;
        this.updateDisplay();
    }
    
    updateDisplay() {
        document.getElementById('strokes').textContent = this.strokes;
        document.getElementById('par').textContent = this.par;
        document.getElementById('best').textContent = this.bestScore;
    }
    
    showGameOver() {
        // Atualizar melhor pontuação
        if (this.bestScore === '-' || this.strokes < parseInt(this.bestScore)) {
            this.bestScore = this.strokes;
            localStorage.setItem('bestScore', this.bestScore);
        }
        
        document.getElementById('final-strokes').textContent = this.strokes;
        document.getElementById('final-par').textContent = this.par;
        document.getElementById('game-over').style.display = 'block';
    }
    
    hideGameOver() {
        document.getElementById('game-over').style.display = 'none';
    }
}