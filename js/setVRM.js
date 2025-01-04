//3D場景建立以及載入vrm-------------------------------------------------
//建構場景
const scene = new THREE.Scene();

//建構攝影機(透視投影的攝影機)
const camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 0.1, 50);
camera.position.set(0, 1.3, 3.9);

//建構渲染器
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); //抗鋸齒
renderer.setSize(window.innerWidth / 1.8, window.innerHeight / 1.5);  //VRM 框框的大小
renderer.setClearColor(0xE3EBF1, 1.0);                                //vrm背景的顏色

renderer.setPixelRatio(window.devicePixelRatio);


const vrmOutput = document.getElementById("vrmOutput");
const vrmOutputBox = document.getElementById("vrmOutputBox");
vrmOutput.insertBefore(renderer.domElement, vrmOutputBox);            //把vrm的場景插入到vrmOutput裡面 (vrmOutputBox上面)


//讓vrm可以在3D空間中轉動
const orbitControls = new THREE.OrbitControls(camera, renderer.domElement);
orbitControls.screenSpacePanning = true;
orbitControls.target.set(0, 1, 0);
orbitControls.update();

//平行光
const light = new THREE.DirectionalLight(0xffffff);
light.position.set(1.0, 1.0, 1.0).normalize();
scene.add(light);

//眼球看的方向
let lookAtTarget = new THREE.Object3D();
camera.add(lookAtTarget);

//GLTFLoader為Three.js的    VRM is from '@pixiv/three-vrm'->(控制模型的運作) (three-vrm.js)
const loader = new THREE.GLTFLoader();
loader.crossOrigin = "anonymous";
let currentVrm = undefined;
let vrmManager;


//LOAD MODEL
loader.load(
    // URL of the VRM you want to load
    "./vrm/GirlLongHair.vrm", 

    // called when the resource is loaded
    (gltf) => {

        THREE.VRMUtils.removeUnnecessaryJoints(gltf.scene);

        // generate a VRM instance from gltf
        THREE.VRM.from(gltf).then(async vrm => {
            currentVrm = vrm;

            vrmManager = new VRMManager(vrm);

            //讓vrm剛開始可以轉到正面
            vrmManager.rotation(Bone.Hips).y = Math.PI;

            // vrm load完 手擺放的位置
            // vrmManager.rotation(Bone.RightHand).x = Math.PI / 6;
            // vrmManager.rotation(Bone.LeftHand).x = Math.PI / 6;
            // vrmManager.rotation(Bone.RightUpperArm).z = rad(-75);
            // vrmManager.rotation(Bone.RightLowerArm).z = rad(-10);
            // vrmManager.rotation(Bone.LeftUpperArm).z = rad(75);
            // vrmManager.rotation(Bone.LeftLowerArm).z = rad(10);

            vrmManager.rotation(Bone.RightUpperArm).y = 0;
            vrmManager.rotation(Bone.RightUpperArm).z = -(Math.PI / 2 - 0.35);
            vrmManager.rotation(Bone.RightLowerArm).y = 0;
            vrmManager.rotation(Bone.RightLowerArm).z = -0.15;
            vrmManager.rotation(Bone.LeftUpperArm).y = 0;
            vrmManager.rotation(Bone.LeftUpperArm).z = Math.PI / 2 - 0.35;
            vrmManager.rotation(Bone.LeftLowerArm).y = 0;
            vrmManager.rotation(Bone.LeftLowerArm).z = 0.15;



            vrm.lookAt.target = lookAtTarget;

            // add the loaded vrm to the scene
            scene.add(vrm.scene);

            animate(); //開始偵測
        });
    },
    progress => console.log("Loading... ", 100.0 * (progress.loaded / progress.total), "%"),
    error => console.error(error)
);

//加上網格線
const gridHelper = new THREE.GridHelper(10, 10);
scene.add(gridHelper);

//加上坐標軸
const axesHelper = new THREE.AxesHelper(5);
scene.add(axesHelper);

//建立Three的clock 播放時跑的clock
const clock = new THREE.Clock();


/**
 * animate裡 更新vrm動作 再重新呈現vrm的那個畫面
 */
function animate() {

    const deltaTime = clock.getDelta();

    // tfResults();    //tensorflow偵測結果
    TWEEN.update(); //TWEEN補間動畫更新

    if (currentVrm) {
        currentVrm.update(deltaTime); //更新vrm model動作
        // recordJSON()                  //記錄vrm轉動角度等等資料至JSON -> 在record.js
    }
    requestAnimationFrame(animate);   //藉由animate()不斷遞迴

    renderer.render(scene, camera);   //渲染vrm的那個畫面


}





//不知道怎麼要不要刪掉...231125 > 不能刪掉!!因為如果整個都跑好之後 沒有這裡的話 vrm那邊沒辦法轉動、移動vrm 因為按到的那層會是上面的spinner/loader
//在mediapipeDetector.js 如果mediapipe運作好之後 會加上loaded class 讓.loading進行opacity變0 的動畫 (css)
const loading = document.querySelector('.loading');
//在動畫完成後 讓.loading display none
loading.ontransitionend = () => { 
    loading.style.display = 'none';
    document.getElementById("message").innerHTML = "Loading"
};