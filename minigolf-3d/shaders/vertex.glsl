attribute vec3 aPosition;
attribute vec3 aNormal;
attribute vec2 aTexCoord;

uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProjection;

uniform vec3 uLightDirection; // luz direcional simples
uniform vec3 uLightColor;
uniform vec3 uAmbientColor;

varying vec2 vTexCoord;
varying vec3 vColor;

void main() {
    vec4 worldPos = uModel * vec4(aPosition, 1.0);
    gl_Position = uProjection * uView * worldPos;

    // normal em espaço de mundo (sem escala não-uniforme)
    vec3 normal = normalize(mat3(uModel) * aNormal);
    float diff = max(dot(normal, -normalize(uLightDirection)), 0.0);

    vec3 lighting = uAmbientColor + uLightColor * diff;

    vTexCoord = aTexCoord;
    vColor = lighting;
}
