precision mediump float;

varying vec3 vPosition;
varying vec3 vNormal;
varying vec2 vTexCoord;

uniform vec3 uAmbientLight;
uniform vec3 uDirectionalLightDir;
uniform vec3 uDirectionalLightColor;
uniform vec3 uPointLightPos;
uniform vec3 uPointLightColor;
uniform vec3 uCameraPos;
uniform sampler2D uTexture;
uniform bool uUseTexture;
uniform vec3 uMaterialColor;

void main() {
    vec3 normal = normalize(vNormal);
    
    // Luz ambiente
    vec3 ambient = uAmbientLight;
    
    // Luz direcional
    vec3 lightDir = normalize(-uDirectionalLightDir);
    float diffDir = max(dot(normal, lightDir), 0.0);
    vec3 diffuse = diffDir * uDirectionalLightColor;
    
    // Luz pontual (perto da bandeira)
    vec3 pointLightDir = normalize(uPointLightPos - vPosition);
    float distance = length(uPointLightPos - vPosition);
    float attenuation = 1.0 / (1.0 + 0.09 * distance + 0.032 * distance * distance);
    float diffPoint = max(dot(normal, pointLightDir), 0.0);
    vec3 pointDiffuse = diffPoint * uPointLightColor * attenuation;
    
    // Especular (Phong)
    vec3 viewDir = normalize(uCameraPos - vPosition);
    vec3 reflectDir = reflect(-lightDir, normal);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);
    vec3 specular = spec * uDirectionalLightColor * 0.5;
    
    // Cor final
    vec3 lighting = ambient + diffuse + pointDiffuse + specular;
    
    vec3 objectColor;
    if (uUseTexture) {
        objectColor = texture2D(uTexture, vTexCoord).rgb;
    } else {
        objectColor = uMaterialColor;
    }
    
    vec3 finalColor = lighting * objectColor;
    gl_FragColor = vec4(finalColor, 1.0);
}