//用來存每一幀的旋轉角度
let armInRotation = {
    rightUpperY: 0,
    rightUpperZ: 0,
    rightLowerX: 0,
    rightLowerY: 0,
    rightLowerZ: 0,

    leftUpperY: 0,
    leftUpperZ: 0,
    leftLowerY: 0,
    leftLowerZ: 0,
};

// result為偵測點的位置，mult用來判斷左右邊
// mult等於一代表VRM的右邊、使用者的左邊、程式碼中寫right的部分，反之則為另一邊
function armInDetection(results, mult) {
    if (results.poseLandmarks != undefined) {

        const leftShoulder = results.poseLandmarks[11];
        const leftElbow = results.poseLandmarks[13];


        //變數需先宣告，如果在下方if才宣告，若未跑進下方if時會出現錯誤(找不到變數)
        let leftWrist;
        let leftMidFin;
        let leftThumb;
        let leftLittleFin;
        if (results.leftHandLandmarks != undefined) {
            leftWrist = results.leftHandLandmarks[0];
            leftMidFin = results.leftHandLandmarks[9]
            leftThumb = results.leftHandLandmarks[2];
            leftLittleFin = results.leftHandLandmarks[17];
        }

        const rightShoulder = results.poseLandmarks[12];
        const rightElbow = results.poseLandmarks[14];
        let rightWrist; //在這邊定義 是為了因為下面有用到rightWrist 如果這裡rightHandLandmarks undefined的話 在裡面宣告的話 會沒進去 沒宣告到  ->下面要用到rightWrist的時候會錯
        let rightMidFin;
        let rightThumb;
        let rightLittleFin;
        if (results.rightHandLandmarks != undefined) {
            rightWrist = results.rightHandLandmarks[0];
            rightMidFin = results.rightHandLandmarks[9];
            rightThumb = results.rightHandLandmarks[2];
            rightLittleFin = results.rightHandLandmarks[17];
        }

        let armPart = [
            [rightShoulder, rightElbow, rightWrist, rightMidFin, rightThumb, rightLittleFin],
            [leftShoulder, leftElbow, leftWrist, leftMidFin, leftThumb, leftLittleFin]
        ]

        if (armPart[0][0] && armPart[1][0]) { 
            if (mult == -1) { //vrm的左邊 使用者的右邊
                moveArmIn(armPart[0], mult)
            } else if (mult == 1) { //vrm的右邊 使用者的左邊 上面抓到的偵測點都是使用者方向的(leftShoulder -> 使用者的左邊肩膀)
                moveArmIn(armPart[1], mult)
            }
        }
    }
}

/**
 * 計算手臂旋轉角度
 * @param {*} arm 該手臂的值 0:肩膀 1:手肘 2:手腕 3:中指 4:大拇指 5:小指 
 * @param {*} mult 加權值  1:vrm右手 -1:vrm左手
 */
function moveArmIn(arm, mult) {
    
    // if (arm[0].visibility >= 0.65 && arm[1].visibility >= 0.65 && arm[2]) { //當visibility >= 0.65 時在webcam的畫面上才會出現偵測點及線(有偵測到)

    // XZ平面上，求上手臂Y的轉動角度
    // getAngle 需要以Vector3形式才可計算
    // pointToVec = new THREE.Vector3 -> 都是將偵測點的資料轉為Vector3的形式，差別為pointToVec只須給部位就會將該部位的XYZ變成Vector3的形式，反之則需要給三個值才可轉成Vector3的形式
    let shoulderVecY = pointToVec(arm[0]); //肩膀的XYZ
    let elbowVecY = new THREE.Vector3(arm[1].x, arm[0].y, arm[1].z); //elbow的x，shoulder的y，elbow的z
    let upperExtendY = new THREE.Vector3(arm[0].x + (10 * mult), arm[0].y, arm[0].z); //shoulder的x左右延伸，shoulder的yz
    // getAngle為利用三點求角度的function
    let upperY = (getAngle(elbowVecY, shoulderVecY, upperExtendY) - Math.PI / 8) * mult; //上手臂y轉動的角度

    // XY平面上，求上手臂Z的轉動角度
    let shoulderVecZ = pointToVec(arm[0]) //肩膀點
    let elbowVecZ = new THREE.Vector3(arm[1].x, arm[1].y, arm[0].z) //elbow的xy，shoulder的z
    let upperExtendZ = new THREE.Vector3(arm[0].x + (10 * mult), arm[0].y, arm[0].z) //shoulder的x左右延伸、shoulder的yz
    let upperZ = getAngle(elbowVecZ, shoulderVecZ, upperExtendZ) * mult; //上手臂z轉動的角度

    if (arm[0].y < arm[1].y) { //手肘低於肩膀
        upperZ *= -1
    }

    


    // XZ平面上，求下手臂Y的轉動角度
    let lowerElbowVecY = pointToVec(arm[1]); //手肘點
    let wristVecY = new THREE.Vector3(arm[2].x, arm[1].y, arm[2].z); //手腕的x，手肘的y，手腕的z
    let lowerExtendY = new THREE.Vector3(arm[1].x + (10 * mult), arm[1].y, arm[1].z); //elbow的x左右延伸，elbow的yz
    let lowerY = getAngle(wristVecY, lowerElbowVecY, lowerExtendY) * mult; //下手臂的y轉動角度

    // XY平面上，求下手臂Z的轉動角度
    let wristVecZ = new THREE.Vector3(arm[2].x, arm[2].y, arm[1].z); //手腕的xy，手肘的z
    let lowerExtendZ = new THREE.Vector3(arm[1].x + (10 * mult), arm[1].y, arm[1].z); //elbow的x左右延伸，elbow的yz
    let lowerZ = getAngle(wristVecZ, lowerElbowVecY, lowerExtendZ) * mult; //下手臂的z轉動角度

    let lowerX = 0;

    lowerZ -= Math.PI * mult;

    if ((arm[2].y < arm[1].y) * mult) { // 手腕高於手肘
        lowerZ *= -1;
    }






    //230713
    let shoulderPoint = pointToVec(arm[0]) //pointToVec -> 把型態轉成Vector3 用getAngle() 一定要是Vector3的型態
    let elbowPoint = pointToVec(arm[1])
    let wristPoint = pointToVec(arm[2])
    //肩膀 手肘 手腕夾的夾角 (左手或右手)
    let armAngle = getAngle(shoulderPoint, elbowPoint, wristPoint)
 
    

    
    //240227
    //手放在胸前(我們的右手) (upperY乘1.3為了讓手臂往內一點) 
    if (mult == -1 && arm[0].x - 0.6 < arm[2].x && arm[1].y > arm[0].y && arm[2].y + 0.1 < arm[1].y) {
        upperY *= 1.3
        upperZ *= 0.75

    } 
    //手放在肚子前(我們的右手) (upperY乘0.2為了讓手臂敞開一點) (新版webcam -> x現在越往我們的右邊越小)
    else if (mult == -1 && arm[0].x - 0.3 < arm[2].x && arm[1].y - 0.01 < arm[2].y) {
        // console.log(arm[1].y - arm[2].y)

        if(armAngle > 1.44 && arm[1].y - arm[2].y < -0.16 ){
            upperY *= 0.1
            upperZ *= 0.85
            lowerZ = 0
            lowerY = 0
        }
        else if(armAngle > 1 && arm[1].y - arm[2].y < -0.12){
            upperY *= 0.1
            upperZ *= 0.48
        }
        else{
            upperY *= 0.3
            upperZ *= 0.78
        }
    } 


    //手放在胸前(我們的左手) (upperY乘1.4為了讓手臂往內一點) 
    if (mult == 1 && arm[0].x + 0.6 > arm[2].x && arm[1].y > arm[0].y && arm[2].y + 0.1 < arm[1].y) {
        upperY *= 1.4
        upperZ *= 0.8

    }
    //手放在肚子前(我們的左手) (upperY乘0.2為了讓手臂敞開一點) 
    else if (mult == 1 && arm[0].x - 0.01 > arm[2].x && arm[1].y < arm[2].y) {

        if(armAngle > 2.5){
            upperY *= 0.1
            upperZ *= 0.85
            lowerZ = 0
            lowerY = 0
        }
        else if(armAngle > 1.6){
            upperY *= 0.1
            upperZ *= 0.38
        }
        else{
            upperY *= 0.45
            upperZ *= 0.68
        }
        
    } 
    else if (mult == 1 && arm[1].y < arm[2].y) { //特殊情況
        // console.log(armAngle)

        if(armAngle > 1.6){
            upperY *= 0.1
            upperZ *= 0.85
            lowerZ = 0
            lowerY = 0
        }
    }



    //左右手 高舉手的時候 下手臂讓他伸直 
    if (armAngle > 1.25 && ((arm[0].y - arm[1].y) > 0.19)) {
        lowerZ = 0;
        lowerY = 0;
    }


   

    //(新版webcam -> x現在越往我們的右邊越小)
    //手臂不重疊在身體上(我們左手(mult = 1) : 手腕x > 肩膀x，我們右手 (mult = -1) : 肩膀x > 手腕x) 且 手腕高於手肘 
    //讓我們做揮手動作時 vrm手掌可以成功朝前 手掌方向不會往身體方向偏
    if (arm[0].x < arm[2].x && mult == 1 && arm[1].y > arm[2].y) { 
        upperY *= 0.1 //* mult 讓手臂敞開一點
        //230712
        upperZ *= 0.55 // 手臂抬高一點

    }
    if (arm[0].x > arm[2].x && mult == -1 && arm[1].y > arm[2].y) { 
        upperY *= 0.1 //* mult 
        //230712
        upperZ *= 0.55

    }


    //更新armInRotation中的值
    if (mult == 1) { //vrm的右手動畫
        vrmManager.tween(armInRotation, {
                rightUpperY: upperY,
                rightUpperZ: upperZ
            }, () => updateUpperArmRotation(armInRotation, "right"), "rightUpperArm"
            // , {
            //     rightUpperY: 0,
            //     rightUpperZ: rad(-75)
            // }
        );
    } else if (mult == -1) { //vrm的左手動畫
        vrmManager.tween(armInRotation, {
                leftUpperY: upperY,
                leftUpperZ: upperZ
            }, () => updateUpperArmRotation(armInRotation, "left"), "leftUpperArm"
            // , {
            //     leftUpperY: 0,
            //     leftUpperZ: rad(75)
            // }
        );
    }



    //更新armInRotation中的值
    if (mult == 1) { //vrm下右手臂動畫
        vrmManager.tween(armInRotation, {
                rightLowerX: lowerX,
                rightLowerZ: lowerZ,
                rightLowerY: lowerY
            }, () => updateLowerArmRotation(armInRotation, "right"), "rightLowerArm"
            // , {
            //     rightLowerZ: rad(-85),
            //     rightLowerY: 0
            // }
        );
    } else if (mult == -1) { //vrm下左手臂動畫
        vrmManager.tween(armInRotation, {
                leftLowerZ: lowerZ,
                leftLowerY: lowerY
            }, () => updateLowerArmRotation(armInRotation, "left"), "leftLowerArm"
            // , {
            //     leftLowerZ: rad(85),
            //     leftLowerY: 0
            // }
        );
    }

    // } else {
    //     //若沒偵測到手
    //     if (mult == 1) {            //VRM右手初始動作(手平舉姿勢)
    //         vrmManager.rotation(Bone.RightUpperArm).y = 0;
    //         vrmManager.rotation(Bone.RightUpperArm).z = rad(-75);
    //         vrmManager.rotation(Bone.RightLowerArm).y = 0;
    //         vrmManager.rotation(Bone.RightLowerArm).z = 0;
    //         vrmManager.rotation(Bone.RightHand).z = 0;
    //     } else if (mult == -1) {    //VRM左手初始動作(手平舉姿勢)
    //         vrmManager.rotation(Bone.LeftUpperArm).y = 0;
    //         vrmManager.rotation(Bone.LeftUpperArm).z = rad(75);
    //         vrmManager.rotation(Bone.LeftLowerArm).y = 0;
    //         vrmManager.rotation(Bone.LeftLowerArm).z = 0;
    //         vrmManager.rotation(Bone.LeftHand).z = 0;
    //     }
    // }
}


/**
 * 更新vrm上手臂的轉動角度【手在身體內】
 * @param {*} rotation 轉動角度
 * @param {*} side 左右邊
 */
function updateUpperArmRotation(rotation, side) {
    if (side == "right") {
        const rightUpper = vrmManager.rotation(Bone.RightUpperArm);
        rightUpper.y = rotation.rightUpperY;
        rightUpper.z = rotation.rightUpperZ;
    } else if (side == "left") {
        const leftUpper = vrmManager.rotation(Bone.LeftUpperArm);
        leftUpper.y = rotation.leftUpperY;
        leftUpper.z = rotation.leftUpperZ;
    }
}

/**
 * 更新vrm下手臂的轉動角度【手在身體內】
 * @param {*} rotation 轉動角度
 * @param {*} side 左右邊
 */
function updateLowerArmRotation(rotation, side) {
    if (side == "right") {

        if (rotation.rightLowerX != 0) {
            vrmManager.rotation(Bone.RightLowerArm).x = rotation.rightLowerX;
        }
        vrmManager.rotation(Bone.RightLowerArm).z = rotation.rightLowerZ;
        vrmManager.rotation(Bone.RightLowerArm).y = rotation.rightLowerY;

    } else if (side == "left") {
        vrmManager.rotation(Bone.LeftLowerArm).z = rotation.leftLowerZ;
        vrmManager.rotation(Bone.LeftLowerArm).y = rotation.leftLowerY;
    }

}



