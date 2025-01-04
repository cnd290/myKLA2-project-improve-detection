const fingers = ["Thumb", "Index", "Middle", "Ring", "Little"]; //手指名稱
const parts = ["Proximal", "Intermediate", "Distal"]; //手指指節名稱(由下而上)




function fingerDetection(results) {
    /**
     * 0:vrm右手(本人左手)   
     * 1:vrm左手(本人右手) 
     */
    const handSide = ["Left", "Right"];
    const handLandmarks = [results.rightHandLandmarks, results.leftHandLandmarks];

    for (let i = 0; i < handLandmarks.length; i++) {
        if (handLandmarks[i] != undefined) { //該隻手掌未被偵測到
            const wristLandmark = handLandmarks[i][0]; //手腕

            /**
             * 每根手指頭有四個點(由下往上數點)  
             * 由四點間的間距分成三節 "Proximal", "Intermediate", "Distal"            
             */
            const fingerLandmarks = {
                "Thumb": [handLandmarks[i][1], handLandmarks[i][2], handLandmarks[i][3], handLandmarks[i][4]],
                "Index": [handLandmarks[i][5], handLandmarks[i][6], handLandmarks[i][7], handLandmarks[i][8]],
                "Middle": [handLandmarks[i][9], handLandmarks[i][10], handLandmarks[i][11], handLandmarks[i][12]],
                "Ring": [handLandmarks[i][13], handLandmarks[i][14], handLandmarks[i][15], handLandmarks[i][16]],
                "Little": [handLandmarks[i][17], handLandmarks[i][18], handLandmarks[i][19], handLandmarks[i][20]],
            };

            fingers.forEach(finger => {
                //一次移動一根手指
                moveFinger(handSide[i], finger, wristLandmark, fingerLandmarks["Middle"][0], fingerLandmarks[finger]);
            });
        }
    }


}

/**
 * moveFinger 移動vrm手指
 * @param {*} side 左/右邊(vrm為主詞)
 * @param {*} finger 該手指手指名 "Thumb","Index","Middle","Ring","Little"
 * @param {*} wristLandmark 手腕座標位置
 * @param {*} midFinBottomLandmark 中指最底端點的座標位置
 * @param {*} fingerLandmark 該根手指座標
 */
function moveFinger(side, finger, wristLandmark, midFinBottomLandmark, fingerLandmark) {


    const rotations = calcFingerRotation(side, finger, wristLandmark, midFinBottomLandmark, fingerLandmark);

    /*
     * 手指
     * x方向:手指轉動
     * y方向:手指搖動
     * z方向:手指彈起按下
     */

    //Thumb轉動y方向，其他根手指轉動z方向
    const axis = finger === "Thumb" ? "y" : "z";
    for (let i = 0; i < parts.length; i++) {
        const fingerPart = side + finger + parts[i];
        vrmManager.rotation(Bone[fingerPart])[axis] = rotations[i];
    }

    //除了"Middle"跟"Thumb"，其他根手指
    // if (finger !== "Middle" && finger !== "Thumb") {
    //     vrmManager.rotation(Bone[side + finger + "Proximal"]).x = rotations[3];
    // }


}


/**
 * @param {*} side 左/右邊(vrm為主詞)
 * @param {*} finger 該手指手指名 "Thumb", "Index", "Middle", "Ring", "Little"
 * @param {*} wristLandmark 手腕座標位置
 * @param {*} midFinBottomLandmark 中指最底端點的座標位置
 * @param {*} fingerLandmark 該根手指座標 
 * @returns 
 */
function calcFingerRotation(side, finger, wristLandmark, midFinBottomLandmark, fingerLandmark) {
    const mult = side == "Right" ? 1 : -1;


    const midFinBottom = pointToVec(midFinBottomLandmark);

    const wrist = pointToVec(wristLandmark);

    //=============================
    //       Vecs 新增 Element
    // Vecs =  [wrist,(由下往上)手指的第一個點,第二個點,第三個點]
    //=============================
    let vecs = []
    vecs.push(wrist);
    for (let index = 0; index < 4; index++) {
        const fingerPoint = pointToVec(fingerLandmark[index]);
        vecs.push(fingerPoint);
    }


    //================================
    // 計算旋轉角度 (三點組成一角度) 
    // joints -> [角度,角度...]
    // Thumb:[Proximal.y,Intermediate.y,Distal.y] = [(wrist,一,二),(一,二,三),(二,三,四)] 
    // Middle:[Proximal.z,Intermediate.z,Distal.z] = [(wrist,一,二),(一,二,三),(二,三,四)] 
    // 其他手指:[Proximal.z,Intermediate.z,Distal.z,Proximal.x] = [(wrist,一,二),(一,二,三),(二,三,四),(中指底端,手腕,二)] 
    //================================
    let joints = [];

    for (let i = 1; i < vecs.length - 1; i++) {
        const firstPoint = vecs[i - 1];
        const centerPoint = vecs[i];
        const lastPoint = vecs[i + 1];
        joints.push(mult * getAngle(firstPoint, centerPoint, lastPoint) - Math.PI);
    }
    // if (finger !== "Middle" && finger !== "Thumb" && midFinBottom != undefined) {
    //     joints.push(mult * getAngle(midFinBottom, wrist, vecs[2]));
    // }

    const rotations = joints;
    return rotations;
}

/**
 * 還原至預設該手手指動作
 * @param {*} side 左/右 (vrm的左右) 
 */
// function fingerPoseReset(side) {
//     fingers.forEach(finger => {
//         const axis = finger === "Thumb" ? "y" : "z";
//         for (let i = 0; i < parts.length; i++) {
//             const fingerPart = side + finger + parts[i];
//             vrmManager.rotation(Bone[fingerPart])[axis] = 0;
//         }

//         //除了"Middle"跟"Thumb"，其他根手指
//         if (finger !== "Middle" && finger !== "Thumb") {
//             vrmManager.rotation(Bone[side + finger + "Proximal"]).x = 0;
//         }
//     })
// }