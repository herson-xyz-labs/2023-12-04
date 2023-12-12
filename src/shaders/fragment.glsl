precision mediump float;

uniform sampler2D uTexture;
uniform samplerCube specMap;
uniform vec3 cameraPosition;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;

float inverseLerp(float v, float minValue, float maxValue) {
  return (v - minValue) / (maxValue - minValue);
}

float remap(float v, float inMin, float inMax, float outMin, float outMax) {
  float t = inverseLerp(v, inMin, inMax);
  return mix(outMin, outMax, t);
}

// SimonDev, GLSL Shaders From Scratch, https://simondev.teachable.com/courses/1783153
vec3 linearTosRGB(vec3 value ) {
  vec3 lt = vec3(lessThanEqual(value.rgb, vec3(0.0031308)));
  
  vec3 v1 = value * 12.92;
  vec3 v2 = pow(value.xyz, vec3(0.41666)) * 1.055 - vec3(0.055);

	return mix(v2, v1, lt);
}

float ditherPattern(vec2 position) {
    // Generate a simple noise pattern based on screen position
    float noise = fract(sin(dot(position.xy ,vec2(12.9898,78.233))) * 43758.5453);
    return noise;
}

void main() {
    vec4 textureColor  = texture2D(uTexture, fract(vUv * 20.0));
    vec3 limeGreen = vec3(201.0/255.0, 240.0/255.0, 155.0/255.0);

    // Determine if the color is closer to white or black
    float brightness = (textureColor.r + textureColor.g + textureColor.b) / 3.0;
    float ditherNoise = ditherPattern(gl_FragCoord.xy);

    if (brightness > 0.999) {
        // If the color is closer to white
        textureColor = vec4(0.0, 0.0, 0.0, 1.0);
    } else {
        // If the color is closer to black
        textureColor = vec4(limeGreen, 1.0);
    }

    vec3 lighting      = vec3(0.0);
    vec3 normal        = normalize(vNormal);

    vec3 viewDirection = normalize(cameraPosition - vPosition);

    vec3  ambientLight = vec3(limeGreen);                       

    //vec3  skyLight     = vec3(201/255, 252/255, 165/255);
    vec3  skyLight     = vec3(0.1);                
    vec3  groundLight  = vec3(0.1);                   
    float hemiMix      = remap(normal.y, -1.0, 1.0, 0.0, 1.0);  
    vec3  hemiLight    = mix(groundLight, skyLight, hemiMix);   

    vec3  lightDirection = normalize(vec3(1.0, 1.0, 1.0));
    float dp             = max(0.0, dot(normal, lightDirection));

    /*
        Cell Shading
        - Build "steppiness" into the lighting
    */

    dp *= smoothstep(0.5, 0.5001, dp);

    vec3  sunlightColor  = vec3(limeGreen);
    vec3  sunlight       = sunlightColor * dp;

  // Phong Specular
    vec3 r = normalize(reflect(-lightDirection, normal));
    float phongValue = max(dot(r, viewDirection), 0.0);
    phongValue = pow(phongValue, 32.0);

    vec3 specular = vec3(phongValue);

    vec3 iblCoord = normalize(reflect(-viewDirection, normal));
    vec3 iblSample = textureCube(specMap, iblCoord).rgb;

    specular += iblSample * 0.5;

    /*  
        - Take the dot product of the view direction and the normal
    */

    // Fresnel
    float fresnel = 1.0 - max(0.0, dot(viewDirection, normal));
    fresnel = pow(fresnel, 1.4);

    specular *= fresnel;
    
    lighting += ambientLight * 0.05 + hemiLight * 0.05 + sunlight;

    // Apply dithering based on brightness
    // Darker areas will have more noise
    float ditherEffect = mix(0.5, ditherNoise, brightness); // Adjust dithering effect based on brightness

    vec3  color          = (textureColor.rgb - (textureColor.g * 0.9)) + lighting * ditherEffect + specular;   

    //color                = linearTosRGB(color);       // linear to sRGB conversion
    color                = pow(color, vec3(1.0 / 2.2)); // pow(1.0 / 2.2) approximation

    gl_FragColor         = vec4(color, 1.0);
}