precision mediump float;

varying vec2 vTexCoord;
varying float vWaveIntensity;

uniform sampler2D uTexture;

void main() {
    vec4 texColor = texture2D(uTexture, vTexCoord);
    
    // Adiciona um leve efeito de sombra nas ondas
    vec3 color = texColor.rgb * (1.0 + vWaveIntensity * 0.3);
    
    gl_FragColor = vec4(color, texColor.a);
}