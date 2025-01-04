// 記錄旋轉角度
let armOutRotation = {
    rightUpperY: 0,
    rightUpperZ: 0,
    rightLowerZ: 0,
    rightUpperZo: 0,

    leftUpperY: 0,
    leftUpperZ: 0,
    leftLowerZ: 0,
    leftUpperZo: 0
};

// 由mediapipe.js呼叫
// result為所有偵測資料，mult用來判斷左右邊
// mult等於一代表VRM的右邊、使用者的左邊、程式碼中寫right的部分，反之則為另一邊
function armOutDetection(results, mult) {
    if (results.poseLandmarks != undefined) {

        const leftShoulder = results.poseLandmarks[11];
        const leftElbow = results.poseLandmarks[13];
        //變數需先宣告，如果在下方if才宣告，若未跑進下方if時會出現錯誤(找不到變數)
        let leftWrist;
        let leftMidFin;
        if (results.leftHandLandmarks != undefined) {
            leftWrist = results.leftHandLandmarks[0];
            leftMidFin = results.leftHandLandmarks[9];
        }

        const rightShoulder = results.poseLandmarks[12];
        const rightElbow = results.poseLandmarks[14];
        let rightWrist; //在這邊定義 是為了因為下面有用到rightWrist 如果這裡rightHandLandmarks undefined的話 在裡面宣告的話 會沒進去 沒宣告到  ->下面要用到rightWrist的時候會錯
        let rightMidFin;
        if (results.rightHandLandmarks != undefined) {
            rightWrist = results.rightHandLandmarks[0]; //這邊程式碼wrist的部分是連過去handpose
            rightMidFin = results.rightHandLandmarks[9];
        }


        let shoulderRotation = getRotation(rightShoulder, leftShoulder); //肩膀的轉動角度(兩肩之間的角度)
        let armPart = [
            [rightShoulder, rightElbow, rightWrist, rightMidFin],
            [leftShoulder, leftElbow, leftWrist, leftMidFin]
        ]
        if (mult == -1) { //vrm的左邊 使用者的右邊
            moveArmOut(armPart[0], mult, shoulderRotation)
        } else {
            moveArmOut(armPart[1], mult, shoulderRotation)
        }

    } else { //若沒偵測到手，VRM手初始動作(手平舉姿勢)
        rotateArmOut(0, 0, 0, 0, mult);
    }
}

/**
 * 計算手臂旋轉角度
 * @param {*} arm 該手臂的值 0:肩膀 1:手肘 2:手腕 3:中指 4:大拇指 5:小指 
 * @param {*} mult 加權值  1:vrm右手 -1:vrm左手
 * @param {*} shoulderRotation 兩肩之間的角度
 */
function moveArmOut(arm, mult, shoulderRotation) {

    // if (arm[0].visibility >= 0.65 && arm[1].visibility >= 0.65 && arm[2]) { //當visibility >= 0.65 時在webcam的畫面上才會出現偵測點及線(有偵測到)

        // pointToVec = new THREE.Vector3 -> 都是將偵測點的資料轉為Vector3的形式，差別為pointToVec只須給部位就會將該部位的XYZ變成Vector3的形式，反之則需要給三個值才可轉成Vector3的形式
        // getAngle 需要以Vector3形式才可計算
        // XZ平面上，求上手臂Y的轉動角度
        let shoulderVecY = pointToVec(arm[0]) // 肩膀點
        let elbowVecY = new THREE.Vector3(arm[1].x, arm[0].y, arm[1].z) // 手肘X，肩膀Y，手肘Z
        let otherVecY = new THREE.Vector3(arm[0].x + (10 * mult), arm[0].y, arm[0].z) //肩膀X左右延伸，肩膀Y，肩膀Z
        let upperY = getAngle(elbowVecY, shoulderVecY, otherVecY) * mult // 三點求角度

        let upperZo = (getRotation(arm[1], arm[0]) - shoulderRotation); //openvtuber的寫法


        // XY平面上，求上手臂Z的轉動角度
        let shoulderVecZ = pointToVec(arm[0]) // 肩膀點
        let elbowVecZ = new THREE.Vector3(arm[1].x, arm[1].y, arm[0].z) // 手肘X，手肘Y，肩膀Z
        let otherVecZ = new THREE.Vector3(arm[0].x + (10 * mult), arm[0].y, arm[0].z) // 肩膀X左右延伸，肩膀Y，肩膀Z
        let upperZ = getAngle(elbowVecZ, shoulderVecZ, otherVecZ) * mult // 三點求角度

        if (arm[0].y < arm[1].y) { // 手肘低(高)於肩膀  
            upperZ *= -1
        }


   

        //rightLowerZ openvtuber的寫法  -> https://github.com/voidedWarranties
        let lowerZ = getRotation(arm[2], arm[1]) + shoulderRotation; //*mult 230712
  
        if(mult == -1 && arm[1].x > arm[2].x && (arm[1].y - arm[2].y < 0.25 && arm[1].y - arm[2].y > -0.03)){
            lowerZ = rad(10) //下手臂會一直擺動 所以在那個區間讓下手臂固定
        }

        upperY *= 0.1 //230712
        upperZ *= 0.6 

        

        //230712
        let shoulderPoint = pointToVec(arm[0]) //pointToVec -> 把型態轉成Vector3 用getAngle() 一定要是Vector3的型態
        let elbowPoint = pointToVec(arm[1])
        let wristPoint = pointToVec(arm[2])
        //肩膀 手肘 手腕夾的夾角 (左手或右手)
        let armAngle = getAngle(shoulderPoint, elbowPoint, wristPoint)
        if (mult == -1 && armAngle > 1.9 && arm[2].y > arm[1].y) { //手自然垂放在腿旁邊情況 讓上手臂可以安分並正確的放好
            upperZ = rad(70);
        }




        rotateArmOut(upperY, upperZ, lowerZ, upperZo, mult)
    // } else {
    //     //若沒偵測到手
    //     // return[0,0,0,0];
    //     rotateArmOut(0, 0, 0, 0, mult)
    // }
}

function rotateArmOut(upperY, upperZ, lowerZ, upperZo, mult) {
    //更新armOutRotation中的值
    if (mult == 1) {
        vrmManager.tween(armOutRotation, {
                rightUpperY: upperY,
                rightUpperZ: upperZ,
                rightLowerZ: lowerZ,
                rightUpperZo: upperZo
            }, () => updateArmRotation(armOutRotation, "right"), "rightArmOut"
            // , {
            //     rightUpperY: 0,
            //     rightUpperZ: rad(-75),
            //     rightLowerZ: rad(-85),
            //     rightUpperZo: upperZo,
            // }
        );
    } else if (mult == -1) {
        vrmManager.tween(armOutRotation, {
                leftUpperY: upperY,
                leftUpperZ: upperZ,
                leftLowerZ: lowerZ,
                leftUpperZo: upperZo

            }, () => updateArmRotation(armOutRotation, "left"), "leftArmOut"
            // , {
            //     leftUpperY: 0,
            //     leftUpperZ: rad(75),
            //     leftLowerZ: rad(85),
            //     leftUpperZo: upperZo
            // }
        );
    }


}

/**
 * 更新上下手臂轉動角度
 * @param {*} rotation 手臂轉動角度
 * @param {*} side 左右邊
 */
function updateArmRotation(rotation, side) {
    // console.log("out")
    if (side == "right") {
        const rightUpper = vrmManager.rotation(Bone.RightUpperArm);
        rightUpper.y = rotation.rightUpperY;
        rightUpper.z = rotation.rightUpperZ;
        vrmManager.rotation(Bone.RightLowerArm).z = rotation.rightLowerZ - rotation.rightUpperZo; //rightUpperZ
    } else if (side == "left") {
        const leftUpper = vrmManager.rotation(Bone.LeftUpperArm);
        leftUpper.y = rotation.leftUpperY;
        leftUpper.z = rotation.leftUpperZ;
        vrmManager.rotation(Bone.LeftLowerArm).z = rotation.leftLowerZ - rotation.leftUpperZo;
    }



}









