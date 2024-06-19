import * as THREE from 'three';
import Stats from 'three/addons/libs/stats.module.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

let camera, scene, renderer, stats, loader, guiMorphsFolder;
const clock = new THREE.Clock();
let mixer;
let characterGroup;
let followCamera = true;

const normalSpeed = 250;
const fastSpeed = 400; // Puedes ajustar este valor según lo rápido que desees que sea la carrera
let currentSpeed = normalSpeed;


const params = {
    asset: 'Sad Idle'
};

const assets = [
    'Walking',
    'Walk Backward',
    'Catwalk Walk Forward Turn 90R',
    'Catwalk Walk Forward Turn 90L',
    'Catwalk Walk Stop Twist L',
    'Sad Idle',
    'Fast Run',
    'Double Leg Takedown',
    'Jump',
    'Boxing',
    'Boxing (1)',
    'Boxing (2)',
    'Boxing (3)',
    'Double Leg Takedown - Attacker'
];

const actions = {};
let activeAction;
let previousAction;
let stopAction;
let keyPressed = { w: false, s: false, d: false, a: false, u: false };

init();

function init() {
    
    const container = document.createElement('div');
    document.body.appendChild(container);

    camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 1, 2000);
    camera.position.set(150, 250, 350);

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xa0a0a0);
    scene.fog = new THREE.Fog(0xa0a0a0, 200, 1000);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 5);
    hemiLight.position.set(0, 200, 0);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0x00d0ff, 50);
    dirLight.position.set(0, 200, 100);
    dirLight.castShadow = true;
    dirLight.shadow.camera.top = 180;
    dirLight.shadow.camera.bottom = -100;
    dirLight.shadow.camera.left = -120;
    dirLight.shadow.camera.right = 120;
    scene.add(dirLight);

    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2000, 2000), new THREE.MeshPhongMaterial({ color: 0x999999, depthWrite: false }));
    mesh.rotation.x = -Math.PI / 2;
    mesh.receiveShadow = true;
    scene.add(mesh);

    const grid = new THREE.GridHelper(2000, 20, 0x000000, 0x000000);
    grid.material.opacity = 0.2;
    grid.material.transparent = true;
    scene.add(grid);

    loader = new FBXLoader();
    mixer = new THREE.AnimationMixer(scene);
    loadAssets();

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setAnimationLoop(animate);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 100, 0);
    controls.update();

    window.addEventListener('resize', onWindowResize);

    document.addEventListener('keydown', onDocumentKeyDown);
    document.addEventListener('keyup', onDocumentKeyUp);

    stats = new Stats();
    container.appendChild(stats.dom);

    const gui = new GUI();
    gui.add(params, 'asset', assets);
    guiMorphsFolder = gui.addFolder('Morphs').hide();

    const button = document.createElement('button');
    button.innerText = 'Toggle Camera Follow';
    button.style.position = 'absolute';
    button.style.top = '10px';
    button.style.right = '10px';
    button.addEventListener('click', () => {
        followCamera = !followCamera;
    });
    document.body.appendChild(button);

     // Generar n cubos aleatorios distribuidos por toda la superficie
     const numCubes = 20; // Cambia este valor según la cantidad de cubos que desees generar
     const cubeSize = 70; // Tamaño de los cubos
 
     for (let i = 0; i < numCubes; i++) {
         const cube = new THREE.Mesh(
             new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize),
             new THREE.MeshPhongMaterial({ color: Math.random() * 0xffffff })
         );
 
         const x = Math.random() * 2000 - 1000; // Coordenada x aleatoria en un rango amplio
         const z = Math.random() * 2000 - 1000; // Coordenada z aleatoria en un rango amplio
         const y = cubeSize / 2; // Altura para que los cubos estén al nivel del suelo
 
         cube.position.set(x, y, z);
         scene.add(cube);
     }
    
}

function loadAssets() {
    assets.forEach((asset) => {
        loader.load(`models/fbx/${asset}.fbx`, function (group) {
            if (group.animations && group.animations.length > 0) {
                const action = mixer.clipAction(group.animations[0]);
                actions[asset] = action;

                if (asset === 'Sad Idle') {
                    action.play();
                    activeAction = action;
                }

                group.traverse(function (child) {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });

                if (!characterGroup) {
                    characterGroup = group;
                    scene.add(characterGroup);
                } else {
                    group.visible = false; // Ocultar el grupo adicional
                    characterGroup.add(group);
                }

            } else {
                console.error(`No animations found for asset: ${asset}`);
            }
        });
    });
}

function switchAnimation(toAction, loop = true) {
    if (toAction && toAction !== activeAction) {
        if (activeAction) {
            activeAction.fadeOut(0.5);
        }

        activeAction = toAction;

        activeAction.reset();
        activeAction.fadeIn(0.5);
        activeAction.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce);
        activeAction.play();
    }
}

function onDocumentKeyDown(event) {
    keyPressed[event.key.toLowerCase()] = true;

    switch (event.key.toLowerCase()) {
        case 'w':
            switchAnimation(actions['Walking']);
            break;
        case 's':
            switchAnimation(actions['Walk Backward']);
            break;
        case 'd':
            switchAnimation(actions['Catwalk Walk Forward Turn 90R']);
            break;
        case 'a':
            switchAnimation(actions['Catwalk Walk Forward Turn 90L']);
            break;
        case 'shift':
            currentSpeed = fastSpeed;
            switchAnimation(actions['Fast Run']);
            break;
        case 'u':
            switchAnimation(actions['Double Leg Takedown']);
            break;
        case ' ':
            currentSpeed = normalSpeed - 200;
            switchAnimation(actions['Jump']);
            break;
        case 'i':
            switchAnimation(actions['Boxing']);
            break;
        case 'o':
            switchAnimation(actions['Boxing (1)']);
            break;
        case 'j':
            switchAnimation(actions['Boxing (2)']);
            break;
        case 'k':
            switchAnimation(actions['Boxing (3)']);
            break;
    }
}

function onDocumentKeyUp(event) {
    keyPressed[event.key.toLowerCase()] = false;
	currentSpeed = normalSpeed;

    if (!keyPressed.w && !keyPressed.s && !keyPressed.d && !keyPressed.a) {
        if (!stopAction) {
			
            stopAction = actions['Catwalk Walk Stop Twist L'];
            stopAction.loop = THREE.LoopOnce;
            stopAction.clampWhenFinished = true;
            stopAction.onFinished = function () {
                switchAnimation(actions['Sad Idle']);
                stopAction = null;
            };
        }
        switchAnimation(stopAction, false);
    }

    
}



function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    const delta = clock.getDelta();

    if (mixer) mixer.update(delta);

    if (characterGroup) {
        if (keyPressed.w) {
            characterGroup.translateZ(currentSpeed * delta);
        } else if (keyPressed.s) {
            characterGroup.translateZ(-currentSpeed * delta);
        } else if (keyPressed.d) {
            characterGroup.rotateY(-Math.PI / 4 * delta);
        } else if (keyPressed.a) {
            characterGroup.rotateY(Math.PI / 4 * delta);
        }

        if (followCamera) {
            camera.position.set(
                characterGroup.position.x + 150,
                characterGroup.position.y + 250,
                characterGroup.position.z + 350
            );
            camera.lookAt(characterGroup.position);
        }
    }

    renderer.render(scene, camera);

    stats.update();
}

