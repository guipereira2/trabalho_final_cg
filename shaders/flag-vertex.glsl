attribute vec3 aPosition;
attribute vec3 aNormal;

uniform mat4 uModelMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;
uniform float uTime;

varying vec3 vNormal;

void main() {
    vec3 pos = aPosition;

    // deslocamento em onda só na ponta da bandeira (eixo x)
    float factor = clamp((pos.x + 0.5), 0.0, 1.0);  // 0 na base, 1 na ponta
    float wave = sin(uTime * 3.0 + pos.y * 5.0) * 0.1 * factor;
    pos.z += wave;  // balança para frente/atrás

    vNormal = aNormal;
    gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * vec4(pos, 1.0);
}
