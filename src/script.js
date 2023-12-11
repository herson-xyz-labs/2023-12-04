import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'lil-gui'
import vertexShader from './shaders/vertex.glsl'
import fragmentShader from './shaders/fragment.glsl'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * RESOLUTION
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

/**
 * CAMERAS
*/
const primaryCameraSettings = { fov: 45, near: 0.1, far: 500 };
const primaryCameraAspect = window.innerWidth / window.innerHeight;
const primaryCameraPosition = { x: 0, y: 0, z: 10 };
const primaryCameraLookAt = { x: 0, y: 0, z: 0 };

const secondaryCameraSettings = { fov: 90, near: 0.1, far: 500 };
const secondaryCameraAspect = window.innerWidth / window.innerHeight;
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
secondaryScene.background = new THREE.Color('#7f6e6e');

primaryCamera.position.set(primaryCameraPosition.x, primaryCameraPosition.y, primaryCameraPosition.z);
primaryCamera.lookAt(primaryCameraLookAt.x, primaryCameraLookAt.y, primaryCameraLookAt.z);

secondaryCamera.position.set(secondaryTargetPlanePosition.x, secondaryTargetPlanePosition.y + 4, secondaryTargetPlanePosition.z);
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