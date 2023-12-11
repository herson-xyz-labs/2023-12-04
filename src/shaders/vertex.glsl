uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat4 modelMatrix;

attribute vec3 position;
attribute vec2 uv;
attribute vec3 normal;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;

void main() {

    vec4 modelPosition = modelMatrix * vec4(position, 1.0);

    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectionPosition = projectionMatrix * viewPosition;

    gl_Position = projectionPosition;

    vUv = uv;
    // We're transforming the normal from local space to world space
    // We pass 0.0 as the w component to indicate that we're dealing with a direction
    vNormal = (modelMatrix * vec4(normal, 0.0)).xyz;
    // We're transforming the position from local space to world space
    // We pass 1.0 as the w component to indicate that we're dealing with a position
    vPosition = (modelMatrix * vec4(position, 1.0)).xyz; 
}