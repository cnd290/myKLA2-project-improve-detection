let head = { x: 0, y: 0, z: 0 };


function headDetection(results) {
    /*
        roll:左右晃(z軸)
        yaw: 轉頭(y軸)
        pitch:點頭(x軸)
        左右以螢幕上畫面為準(螢幕畫面右臉=人的左臉)
    */
    
    const resultFaceLandmarks = results.faceLandmarks;

    const { roll, yaw, pitch } = getHeadRotation(resultFaceLandmarks);

    rotateHead(roll, yaw, pitch);

}


function rotateHead(roll, yaw, pitch) {

    //當沒有偵測到，手呈現初始姿勢
    if(roll == 0 && yaw == 0 && pitch == 0){
        vrmManager.rotation(Bone.Neck).x = 0;
        vrmManager.rotation(Bone.Neck).y = 0;
        vrmManager.rotation(Bone.Neck).z = 0;
    }
    else{
        vrmManager.tween(head, {    
            // x: pitch + Math.PI / 2,
            x: pitch,
            y: yaw,
            z: roll
        }, () => updateHeadRotation(head), "head"
        , null, 1
        );
        //{
        //     x: 0,
        //     y: 0,
        //     z: 0
        // }
    }
    
}

//利用計算出來的旋轉角度來擺放虛擬人物的動作
function updateHeadRotation(rotation) {

    const neckNode = vrmManager.rotation(Bone.Neck);
    neckNode.x = rotation.x;
    neckNode.y = rotation.y;
    neckNode.z = rotation.z
}

// FaceMesh
/**
 * 取得頭轉動角度
 * @param {*} face 
 * @returns { roll, yaw, pitch }  roll:晃頭(z軸)  yaw: 轉頭(y軸)  pitch:點頭(x軸)
 */
function getHeadRotation(face) {

    const faceRight = face[0][356]; //mediapipe holistic : face[356];
    const faceLeft = face[0][127];

    const faceTop = face[0][10];
    const faceBottom = face[0][200];

    let roll = 0;
    let yaw = 0;
    let pitch = 0;

    if (!(faceRight && faceLeft && faceTop && faceBottom)) { //若這些點沒偵測到 roll yaw pitch都回傳0
        return { roll, yaw, pitch};
    }


    //利用Math.atan()來讓斜率轉成弧度值
    //faceLeft.x, faceRight.x
    const rollSlope = slope(faceLeft.y, faceRight.y, faceRight.x, faceLeft.x);      //左右搖擺(z) (從後面看兩個face點連線的斜率(左右晃))
    roll = Math.atan(rollSlope);

    //faceLeft.x, faceRight.x
    const yawSlope = slope(faceLeft.z, faceRight.z, faceRight.x, faceLeft.x);       //旋轉(y) (從頭頂上看兩個face點連線的斜率(旋轉頭))
    yaw = Math.atan(yawSlope);
    
    const pitchSlope = slope(faceTop.z, faceBottom.z, faceTop.y, faceBottom.y);     //前後(x) (從側面看兩個face點連線的斜率(前後擺))
    pitch = Math.atan(pitchSlope) * (-1);


    return { roll, yaw, pitch };

}