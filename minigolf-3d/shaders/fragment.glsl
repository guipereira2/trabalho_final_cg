precision mediump float;

varying vec2 vTexCoord;
varying vec3 vColor;

uniform sampler2D uTexture;

void main() {
    vec4 texColor = texture2D(uTexture, vTexCoord);
    gl_FragColor = vec4(texColor.rgb * vColor, texColor.a);
}
