// const controls = window;
const mpHolistic = window;
const drawingUtilsHolistic = window;

// Our input frames will come from here.
const canvasElement = document.getElementsByClassName('outputCanvas')[0]; //canvas的畫面是透過video畫面去擷取的 (使用者的偵測區)
const canvasCtx = canvasElement.getContext('2d'); //用來在canvas上畫偵測線
// let firstLoadedFlag = false;
let faceResult;

// We'll add this to our control panel later, but we'll save it here so we can
// call tick() each time the graph runs.
// const fpsControl = new controls.FPS();



function removeElements(landmarks, elements) {
    for (const element of elements) {
        delete landmarks[element];
    }
}

function removeLandmarks(results) {
    if (results.poseLandmarks) {
        removeElements(results.poseLandmarks, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 16, 17, 18, 19, 20, 21, 22]);
    }
}

function connect(ctx, connectors) {
    const canvas = ctx.canvas;
    for (const connector of connectors) {
        const from = connector[0];
        const to = connector[1];
        if (from && to) {
            if (from.visibility && to.visibility &&
                (from.visibility < 0.1 || to.visibility < 0.1)) {
                continue;
            }
            ctx.beginPath();
            ctx.moveTo(from.x * canvas.width, from.y * canvas.height);
            ctx.lineTo(to.x * canvas.width, to.y * canvas.height);
            ctx.stroke();
        }
    }
}




/**
 * onResults 
 * 以mediapipe偵測結果變動vrm model
 */

function onResults(results) {


    // Remove landmarks we don't want to draw.
    removeLandmarks(results);


    // Draw the overlays.
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);



    // Connect elbows to hands. Do this first so that the other graphics will draw
    // on top of these marks.
    canvasCtx.lineWidth = 5;

    if (faceResult && faceResult.faceLandmarks.length != 0) {
        for (const landmarks of faceResult.faceLandmarks) {
            drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_TESSELATION, { color: "#C0C0C070", lineWidth: 1 });
            drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE, { color: "#FF3030" });
            drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_RIGHT_EYEBROW, { color: "#FF3030" });
            drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_LEFT_EYE, { color: "#30FF30" });
            drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_LEFT_EYEBROW, { color: "#30FF30" });
            drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_FACE_OVAL, { color: "#E0E0E0" });
            drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_LIPS, { color: "#E0E0E0" });
            drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_RIGHT_IRIS, { color: "#FF3030" });
            drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_LEFT_IRIS, { color: "#30FF30" });
        }
    }


    if (results.poseLandmarks) {
        if (results.rightHandLandmarks) {
            canvasCtx.strokeStyle = 'white';
            connect(canvasCtx, [
                [
                    results.poseLandmarks[mpHolistic.POSE_LANDMARKS.RIGHT_ELBOW],
                    results.rightHandLandmarks[0]
                ]
            ]);
        }
        if (results.leftHandLandmarks) {
            canvasCtx.strokeStyle = 'white';
            connect(canvasCtx, [
                [
                    results.poseLandmarks[mpHolistic.POSE_LANDMARKS.LEFT_ELBOW],
                    results.leftHandLandmarks[0]
                ]
            ]);
        }
    }

    
    if (results.poseLandmarks != undefined) {

        // Pose 畫上偵測的點跟線
        drawingUtilsHolistic.drawConnectors(canvasCtx, results.poseLandmarks, mpHolistic.POSE_CONNECTIONS, { color: 'white' });

        drawingUtilsHolistic.drawLandmarks(canvasCtx, Object.values(mpHolistic.POSE_LANDMARKS_LEFT)
            .map(index => results.poseLandmarks[index]), { visibilityMin: 0.65, color: 'white', fillColor: 'rgb(255,138,0)' });

        drawingUtilsHolistic.drawLandmarks(canvasCtx, Object.values(mpHolistic.POSE_LANDMARKS_RIGHT)
            .map(index => results.poseLandmarks[index]), { visibilityMin: 0.65, color: 'white', fillColor: 'rgb(0,217,231)' });

        // Hands 畫上偵測的點跟線
        drawingUtilsHolistic.drawConnectors(canvasCtx, results.rightHandLandmarks, mpHolistic.HAND_CONNECTIONS, { color: 'white' });
        drawingUtilsHolistic.drawLandmarks(canvasCtx, results.rightHandLandmarks, {
            color: 'white',
            fillColor: 'rgb(0,217,231)',
            lineWidth: 2,
            radius: (data) => {
                return drawingUtilsHolistic.lerp(data.from.z, -0.15, .1, 10, 1);
            }
        });


        drawingUtilsHolistic.drawConnectors(canvasCtx, results.leftHandLandmarks, mpHolistic.HAND_CONNECTIONS, { color: 'white' });
        drawingUtilsHolistic.drawLandmarks(canvasCtx, results.leftHandLandmarks, {
            color: 'white',
            fillColor: 'rgb(255,138,0)',
            lineWidth: 2,
            radius: (data) => {
                return drawingUtilsHolistic.lerp(data.from.z, -0.15, .1, 10, 1);
            }
        });

        //用來呼叫身體(不包括頭部)各部位偵測的入口
        moveBody(results);



    } else if(results.poseLandmarks == undefined){
        console.log("bodyReset")
        bodyReset();
    }

    canvasCtx.restore();


}




const holistic = new Holistic({
    locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`;
    }
});
holistic.setOptions({
    modelComplexity: 1
});


//mediapipe偵測
holistic.onResults(onResults);








//這以上 (holistic 部分) 主要是為了身體部位的偵測
//=======================================================================================================================
//這以下 (new face mesh 部分) 主要是為了臉部/頭的偵測





//es6的方法 甚至不用下載vision_bundle.mjs下來---------------------
// //等同於 import { FaceLandmarker, FilesetResolver, DrawingUtils } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3";
// import vision from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3";
// const { FaceLandmarker, FilesetResolver, DrawingUtils } = vision;
//---------------------------------------------------------------
const { FaceLandmarker, FilesetResolver, DrawingUtils } = vision;

// const loaderSpinner = document.getElementById("loader");
const face = document.getElementById("face");

let faceLandmarker;
let runningMode = "VIDEO";
const videoWidth = 240; //原本480

// Before we can use HandLandmarker class we must wait for it to finish
// loading. Machine Learning models can be large and take a moment to
// get everything needed to run.
async function createFaceLandmarker() {
    const filesetResolver = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm");
    faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
            modelComplexity: 1,
            delegate: "GPU" //註解掉脖子轉動才不會卡(???)
        },
        outputFaceBlendshapes: true,
        runningMode,
        numFaces: 1
    });
    //faceLandmarker loaded好了


    // If webcam supported, add event listener to button for when user
    // wants to activate it.
    if (hasGetUserMedia()) {
        // enableWebcamButton = document.getElementById("webcamButton");
        // enableWebcamButton.addEventListener("click", enableCam);
        if (faceLandmarker) {
            enableCam();
        }
    } else {
        console.warn("getUserMedia() is not supported by your browser");
    }
}
createFaceLandmarker();

// Check if webcam access is supported.
function hasGetUserMedia() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}


//=================================================================
const video = document.getElementById("webcam");
//最上方有這兩行
// const canvasElement = document.getElementById("outputCanvas");
// const canvasCtx = canvasElement.getContext("2d");


// Enable the live webcam view and start detection.
function enableCam() {
    const constraints = {
        video: true
    };

    // Activate the webcam stream.
    navigator.mediaDevices.getUserMedia(constraints).then(async(stream) => {


        // The loadeddata event is fired when the frame at the current playback position of the media has finished loading; often the first frame.
        // video.addEventListener("loadeddata", predictWebcam);
        video.srcObject = stream;

        await holistic.send({ image: video }); //需要先跑第一次 之後要一直不斷跑

        predictWebcam();


        // Add a class to hide the spinner.
        document.body.classList.add('loaded');
        face.style.display = "block";

    });
}

let lastVideoTime = -1;
const drawingUtils = new DrawingUtils(canvasCtx);
async function predictWebcam() {


    const radio = video.videoHeight / video.videoWidth;
    video.style.width = videoWidth + "px";
    video.style.height = videoWidth * radio + "px";

    // new
    canvasElement.style.width = videoWidth + "px";
    canvasElement.style.height = videoWidth * radio + "px";

    canvasElement.width = video.videoWidth;
    canvasElement.height = video.videoHeight;



    let startTimeMs = performance.now();
    if (lastVideoTime !== video.currentTime) {
        lastVideoTime = video.currentTime;
        faceResult = faceLandmarker.detectForVideo(video, startTimeMs);
    }

    if (faceResult.faceLandmarks.length != 0) {
        //把畫臉的線、點移到上面 onResults()裡面了
        // console.log(results.faceLandmarks[0][10]) //然後發現x值在這往右是變小 但好像對脖子跟嘴型的偵測比較沒影響(? 可能還是需要改一些地方 像是head的斜率 可能會從負的變正的之類的 
        // for (const landmarks of results.faceLandmarks) {
        //     drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_TESSELATION, { color: "#C0C0C070", lineWidth: 1 });
        //     drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE, { color: "#FF3030" });
        //     drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_RIGHT_EYEBROW, { color: "#FF3030" });
        //     drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_LEFT_EYE, { color: "#30FF30" });
        //     drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_LEFT_EYEBROW, { color: "#30FF30" });
        //     drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_FACE_OVAL, { color: "#E0E0E0" });
        //     drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_LIPS, { color: "#E0E0E0" });
        //     drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_RIGHT_IRIS, { color: "#FF3030" });
        //     drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_LEFT_IRIS, { color: "#30FF30" });
        // }

        //用來呼叫頭部偵測的入口
        moveHead(faceResult);


    } else {
        faceReset();
    }


    holistic.send({ image: video });

    // Call this function again to keep predicting when the browser is ready.
    window.requestAnimationFrame(predictWebcam);

}
















//------------------------------------------------------------------------偵測

function moveBody(results) {


    let mult = 1; //vrm的右邊 使用者的左邊
    //呼叫arm偵測的function
    const rightShoulder = results.poseLandmarks[12];
    const rightElbow = results.poseLandmarks[14];
    let rightWrist; //在這邊定義 是為了因為下面有用到rightWrist 如果這裡rightHandLandmarks undefined的話 rightWrist在裡面宣告的話 會沒進去 沒宣告到  ->下面要用到rightWrist的時候會錯
    let rightMidFin;

    const leftShoulder = results.poseLandmarks[11];
    const leftElbow = results.poseLandmarks[13];
    let leftWrist;
    let leftMidFin;

    {
        if (results.leftHandLandmarks != undefined) { //舉我們的左手會進來這裡
            // vrmManager.rotation(Bone.RightLowerArm).y = 0;
            // vrmManager.rotation(Bone.RightLowerArm).z = 0;

            leftWrist = results.leftHandLandmarks[0]; //這邊程式碼wrist的部分是連過去handpose
            leftMidFin = results.leftHandLandmarks[9];
            let shoulderPointL = pointToVec(leftShoulder) //pointToVec -> 把型態轉成Vector3 用getAngle() 一定要是Vector3的型態
            let elbowPointL = pointToVec(leftElbow)
            let wristPointL = pointToVec(leftWrist)
                //肩膀 手肘 手腕夾的夾角
            let armAngleL = getAngle(shoulderPointL, elbowPointL, wristPointL);
            //vrm的左邊 使用者的右邊 => 使用者左邊 VRM右邊
            mult = 1;

            //判斷什麼時候進armOutDetection 或 armInDetection (呼叫arm偵測的function)
            if (leftWrist.x - 0.1 > leftShoulder.x && armAngleL > 0.8 && leftElbow.y > leftShoulder.y){
                // console.log("out body OUT")
                armOutDetection(results, mult);
            } 
            else {
                armInDetection(results, mult);
            }

        } else {
            bodyReset();
        }
    } {
        if (results.rightHandLandmarks != undefined) { //舉我們的右手會進來這裡
            rightWrist = results.rightHandLandmarks[0]; //這邊程式碼wrist的部分是連過去handpose
            rightMidFin = results.rightHandLandmarks[9]
            let shoulderPointR = pointToVec(rightShoulder) //pointToVec -> 把型態轉成Vector3 用getAngle() 一定要是Vector3的型態
            let elbowPointR = pointToVec(rightElbow)
            let wristPointR = pointToVec(rightWrist)
            //肩膀 手肘 手腕夾的夾角
            let armAngleR = getAngle(shoulderPointR, elbowPointR, wristPointR)
            //vrm的左邊 使用者的右邊
            mult = -1;

            //判斷什麼時候進armOutDetection 或 armInDetection (呼叫arm偵測的function)
            if (rightShoulder.x > rightWrist.x + 0.1 && armAngleR > 0.6 && rightElbow.y > rightShoulder.y){
                // console.log("out body")
                armOutDetection(results, mult);
            } 
            else {
                armInDetection(results, mult);
            }
        } else {
            bodyReset();
        }
    }


    //呼叫finger偵測的function
    fingerDetection(results);



   
}



function moveHead(results) {
    //呼叫head偵測的function
    headDetection(results);

    //呼叫mouth偵測的function
    mouthDetection(results);

    if (parseInt(clock.elapsedTime % 3) == 0) {
        //自動進行眨眼
        const preset = Math.sin(clock.elapsedTime * Math.PI * 2); //0 睜開眼睛~1閉上眼睛
        vrmManager.setPreset(Preset.BlinkR, preset);
        vrmManager.setPreset(Preset.BlinkL, preset);
    }
    vrmManager.setLookAtTarget(0, 0);
}



/**
 * vrm動作重置function(身體) 
 */
function bodyReset() {

    vrmManager.rotation(Bone.Spine).x = 0;
    vrmManager.rotation(Bone.Spine).y = 0;
    vrmManager.rotation(Bone.Spine).z = 0;

    vrmManager.rotation(Bone.RightUpperArm).y = 0;
    vrmManager.rotation(Bone.RightUpperArm).z = -(Math.PI / 2 - 0.35);
    vrmManager.rotation(Bone.RightLowerArm).y = 0;
    vrmManager.rotation(Bone.RightLowerArm).z = -0.15;
    vrmManager.rotation(Bone.LeftUpperArm).y = 0;
    vrmManager.rotation(Bone.LeftUpperArm).z = Math.PI / 2 - 0.35;
    vrmManager.rotation(Bone.LeftLowerArm).y = 0;
    vrmManager.rotation(Bone.LeftLowerArm).z = 0.15;

    vrmManager.rotation(Bone.RightHand).z = -0.1;
    vrmManager.rotation(Bone.LeftHand).z = 0.1;
    vrmManager.rotation(Bone.RightThumbProximal).y = 0;
    vrmManager.rotation(Bone.RightThumbIntermediate).y = 0;
    vrmManager.rotation(Bone.RightThumbDistal).y = 0;
    vrmManager.rotation(Bone.RightIndexProximal).x = 0;
    vrmManager.rotation(Bone.RightIndexProximal).z = 0;
    vrmManager.rotation(Bone.RightIndexIntermediate).z = 0;
    vrmManager.rotation(Bone.RightIndexDistal).z = 0;
    vrmManager.rotation(Bone.RightMiddleProximal).z = 0;
    vrmManager.rotation(Bone.RightMiddleIntermediate).z = 0;
    vrmManager.rotation(Bone.RightMiddleDistal).z = 0;
    vrmManager.rotation(Bone.RightRingProximal).x = 0;
    vrmManager.rotation(Bone.RightRingProximal).z = 0;
    vrmManager.rotation(Bone.RightRingIntermediate).z = 0;
    vrmManager.rotation(Bone.RightRingDistal).z = 0;
    vrmManager.rotation(Bone.RightLittleProximal).x = 0;
    vrmManager.rotation(Bone.RightLittleProximal).z = 0;
    vrmManager.rotation(Bone.RightLittleIntermediate).z = 0;
    vrmManager.rotation(Bone.RightLittleDistal).z = 0;
    vrmManager.rotation(Bone.LeftThumbProximal).y = 0;
    vrmManager.rotation(Bone.LeftThumbIntermediate).y = 0;
    vrmManager.rotation(Bone.LeftThumbDistal).y = 0;
    vrmManager.rotation(Bone.LeftIndexProximal).x = 0;
    vrmManager.rotation(Bone.LeftIndexProximal).z = 0;
    vrmManager.rotation(Bone.LeftIndexIntermediate).z = 0;
    vrmManager.rotation(Bone.LeftIndexDistal).z = 0;
    vrmManager.rotation(Bone.LeftMiddleProximal).z = 0;
    vrmManager.rotation(Bone.LeftMiddleIntermediate).z = 0;
    vrmManager.rotation(Bone.LeftMiddleDistal).z = 0;
    vrmManager.rotation(Bone.LeftRingProximal).x = 0;
    vrmManager.rotation(Bone.LeftRingProximal).z = 0;
    vrmManager.rotation(Bone.LeftRingIntermediate).z = 0;
    vrmManager.rotation(Bone.LeftRingDistal).z = 0;
    vrmManager.rotation(Bone.LeftLittleProximal).x = 0;
    vrmManager.rotation(Bone.LeftLittleProximal).z = 0;
    vrmManager.rotation(Bone.LeftLittleIntermediate).z = 0;
    vrmManager.rotation(Bone.LeftLittleDistal).z = 0;
    vrmManager.rotation(Bone.RightUpperLeg).x = 0;
    vrmManager.rotation(Bone.RightUpperLeg).z = 0;
    vrmManager.rotation(Bone.RightLowerLeg).x = 0;
    vrmManager.rotation(Bone.LeftUpperLeg).x = 0;
    vrmManager.rotation(Bone.LeftUpperLeg).z = 0;
    vrmManager.rotation(Bone.LeftLowerLeg).x = 0;


    // 屁股位置還原到預設位置(需還原才能讓下方左右foot與toes方便與地面比較)
    vrmManager.position(Bone.Hips).y = 0.934829533;
}

function faceReset() {
    vrmManager.setPreset(Preset.BlinkR, 0);
    vrmManager.setPreset(Preset.BlinkL, 0);
    vrmManager.setLookAtTarget(0, 0);

    vrmManager.vrm.blendShapeProxy._blendShapeGroups.I.weight = 0.3
    vrmManager.vrm.blendShapeProxy._blendShapeGroups.A.weight = 0
    vrmManager.vrm.blendShapeProxy._blendShapeGroups.E.weight = 0
    vrmManager.vrm.blendShapeProxy._blendShapeGroups.O.weight = 0

    vrmManager.rotation(Bone.Neck).x = 0;
    vrmManager.rotation(Bone.Neck).y = 0;
    vrmManager.rotation(Bone.Neck).z = 0;
}