import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'lil-gui'
import vertexShader from './shaders/vertex.glsl'
import fragmentShader from './shaders/fragment.glsl'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'

// Vertex Shader
const textVertexShader = `
    varying vec3 vPosition;

    void main() {
        vPosition = position;
        
        // Apply a sine wave distortion along the X-axis
        // The amplitude and frequency can be adjusted as needed
        float amplitude = 0.5; // Adjust the amplitude of the wave
        float frequency = 5.0; // Adjust the frequency of the wave

        // Calculate the distorted X position
        float distortedX = position.x + amplitude * sin(position.z * frequency);
        float distortedY = position.y + amplitude * sin(position.z * frequency);

        // Set the new position
        vec3 newPosition = vec3(distortedX, distortedY, position.z);
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
    }
`;

// Fragment Shader
const textFragmentShader = `
    uniform vec3 color;
    varying vec3 vPosition;

    void main() {
        // Simple color assignment
        gl_FragColor = vec4(color, 1.0);
    }
`;

/**
 * RESOLUTION
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}
const modelPosition = [0, -15, 0];

/**
 * CAMERAS
*/
const primaryCameraSettings = { fov: 45, near: 0.1, far: 500 };
const primaryCameraAspect = window.innerWidth / window.innerHeight;
const primaryCameraPosition = { x: 0, y: 0, z: 10 };
const primaryCameraLookAt = { x: 0, y: 0, z: 0 };

const secondaryCameraSettings = { fov: 45, near: 0.1, far: 500 };
const secondaryCameraAspect = 4 / 6;
const secondaryCameraPosition = { x: 0, y: 50, z: 220 };
const secondaryCameraLookAt = { x: 10, y: 5, z: -10 };

const primaryCamera = new THREE.PerspectiveCamera(primaryCameraSettings.fov, primaryCameraAspect, primaryCameraSettings.near, primaryCameraSettings.far);
const secondaryCamera = new THREE.PerspectiveCamera(secondaryCameraSettings.fov, secondaryCameraAspect, secondaryCameraSettings.near, secondaryCameraSettings.far);

/**
 * RENDER TARGETS
 */
const secondaryTargetPlaneSize = { width: 4, height: 6 };
const secondaryRenderTargetWidth = secondaryTargetPlaneSize.width * 512;
const secondaryRenderTargetHeight = secondaryTargetPlaneSize.height * 512;

const secondaryTargetPlanePosition = { x: 0, y: -1, z: 0 };

const secondaryRenderTarget = new THREE.WebGLRenderTarget(secondaryRenderTargetWidth, secondaryRenderTargetHeight);

/**
 * SCENES
 */

const primaryScene = new THREE.Scene();
const secondaryScene = new THREE.Scene();

primaryScene.background = new THREE.Color('#C9FCA5');
secondaryScene.background = new THREE.Color('#C9FCA5');

primaryCamera.position.set(primaryCameraPosition.x, primaryCameraPosition.y, primaryCameraPosition.z);
primaryCamera.lookAt(primaryCameraLookAt.x, primaryCameraLookAt.y, primaryCameraLookAt.z);

secondaryCamera.position.set(secondaryCameraPosition.x, secondaryCameraPosition.y, secondaryCameraPosition.z);
secondaryCamera.lookAt(secondaryCameraLookAt.x, secondaryCameraLookAt.y, secondaryCameraLookAt.z);

primaryScene.add(primaryCamera);
secondaryScene.add(secondaryCamera);

/**
 * Display Offscreen Render in Primary Scene
 */
const secondaryTargetMaterial = new THREE.MeshBasicMaterial({
    map: secondaryRenderTarget.texture
});

const secondaryTargetPlaneGeometry = new THREE.PlaneGeometry(secondaryTargetPlaneSize.width , secondaryTargetPlaneSize.height);
const secondaryTargetPlane = new THREE.Mesh(secondaryTargetPlaneGeometry, secondaryTargetMaterial);
secondaryTargetPlane.position.set(secondaryTargetPlanePosition.x, secondaryTargetPlanePosition.y, secondaryTargetPlanePosition.z);
primaryScene.add(secondaryTargetPlane);

/**
 * CANVAS
 */
const canvas = document.querySelector('canvas.webgl')

/**
 * RENDERER
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * CONTROLS
 */
const controls = new OrbitControls(primaryCamera, canvas)
controls.enableDamping = true

/////////////////////////////////////////////////////////////////////////////////////
// Load 3D Model
/////////////////////////////////////////////////////////////////////////////////////

/**
 * Textures
 */
const textureLoader = new THREE.TextureLoader()
const linesTexture = textureLoader.load('./textures/lines.png')

// Material
const material = new THREE.RawShaderMaterial({
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    uniforms: 
    {
        uTexture: { value: linesTexture },
        specMap: { value: secondaryScene.background }
    }
})

const loader = new GLTFLoader();
loader.setPath( './models/' );
loader.load( 'cyberpunk_samurai_s.glb', function ( model ) 
    {
        model.scene.traverse( function ( model ) 
            {
                model.material = material;
                model.position.set(modelPosition[0], modelPosition[1], modelPosition[2]);
                model.rotation.set(0, -0.2, 0);
            }
        );

        console.log(model);

        //primaryScene.add( model.scene );
        secondaryScene.add( model.scene );

    }
);

// Load the font
const fontLoader = new FontLoader();

fontLoader.load('./fonts/helvetiker_regular.typeface.json', function (font) {
    // Create text geometry
    const textGeometry = new TextGeometry('ENIGMA', {
        font: font,
        size: 0.5,
        height: 0.1,
    });

    // Custom Shader Material
    const customMaterial = new THREE.ShaderMaterial({
        vertexShader: textVertexShader,
        fragmentShader: textFragmentShader,
        uniforms: {
            color: { value: new THREE.Color(0x84a5bc) }
        }
    });    

    // Create a mesh with basic material
    const textMaterial = new THREE.MeshBasicMaterial({ color: 0x84a5bc });
    const textMesh = new THREE.Mesh(textGeometry, textMaterial);

    // Create an outline using EdgesGeometry
    const edges = new THREE.EdgesGeometry(textGeometry);
    const line = new THREE.LineSegments(edges, customMaterial);

    line.position.set(0, 3, 0);
    textMesh.position.set(0, 3, 0);

    // Add the text to the scene
    //primaryScene.add(line);
    primaryScene.add(textMesh);

});

/////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////

/**
 * ANIMATION LOOP
 */
const clock = new THREE.Clock()

const tick = () =>
{

    const elapsedTime = clock.getElapsedTime()

    // Update controls
    controls.update()

    // Then render your main scene, using the offscreen render as a texture if needed
    renderer.setRenderTarget(null); // Render to the canvas

    // Render
    renderer.render(primaryScene, primaryCamera)

    renderer.setRenderTarget(secondaryRenderTarget); // Render to the offscreen texture
    renderer.render(secondaryScene, secondaryCamera);

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update primary and secondary camera aspects and projection matrices
    primaryCamera.aspect = sizes.width / sizes.height;
    primaryCamera.updateProjectionMatrix();

    secondaryCamera.aspect = sizes.width / sizes.height;
    secondaryCamera.updateProjectionMatrix();

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

tick()