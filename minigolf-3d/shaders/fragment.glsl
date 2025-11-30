precision mediump float;

varying vec2 vTexCoord;
varying vec3 vLighting;

uniform sampler2D uTexture;
uniform vec3 uSolidColor;
uniform int uHasTexture;

void main() {
    vec3 baseColor;

    if (uHasTexture == 1) {
        vec4 texColor = texture2D(uTexture, vTexCoord);
        baseColor = texColor.rgb;
    } else {
        baseColor = uSolidColor;
    }

    vec3 color = baseColor * vLighting;
    gl_FragColor = vec4(color, 1.0);
}
