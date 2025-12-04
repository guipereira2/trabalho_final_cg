attribute vec3 aPosition;
attribute vec2 aTexCoord;

uniform mat4 uModelMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;
uniform float uTime;

varying vec2 vTexCoord;
varying float vWaveIntensity;

void main() {
    vec3 pos = aPosition;
    
    // Efeito de onda na bandeira
    float wave = sin(uTime * 3.0 + aPosition.y * 2.0) * 0.1 * aPosition.y;
    pos.x += wave;
    
    vWaveIntensity = wave;
    vTexCoord = aTexCoord;
    
    gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * vec4(pos, 1.0);
}