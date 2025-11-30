attribute vec3 aPosition;
attribute vec3 aNormal;
attribute vec2 aTexCoord;

uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProjection;

uniform vec3 uLightDirection;
uniform vec3 uLightColor;
uniform vec3 uAmbientColor;

varying vec2 vTexCoord;
varying vec3 vLighting;

void main() {
    vec4 worldPos = uModel * vec4(aPosition, 1.0);
    gl_Position = uProjection * uView * worldPos;

    vec3 normal = normalize(mat3(uModel) * aNormal);
    float diff = max(dot(normal, -normalize(uLightDirection)), 0.0);

    vLighting = uAmbientColor + uLightColor * diff;
    vTexCoord = aTexCoord;
}
