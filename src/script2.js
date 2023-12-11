import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'lil-gui'
import vertexShader from './shaders/vertex.glsl'
import fragmentShader from './shaders/fragment.glsl'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * Base
 */
// Debug
const gui = new dat.GUI()
const modelPosition = [0, -15, 0];

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

const lime = '#C9FCA5';
scene.background = new THREE.Color(lime);

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
        specMap: { value: scene.background }
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
                model.rotation.set(0, -0.1, 0);
            }
        );

        console.log(model);

        scene.add( model.scene );

    }
);

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(90, sizes.width / sizes.height, 0.1, 500)
camera.position.set(modelPosition[0], modelPosition[1] + 50, modelPosition[2] + 125)
camera.lookAt(modelPosition[0], modelPosition[1] + 50, modelPosition[2] + 125);
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * Animate
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
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()