// Util
///////

// Math


/**
 * 角度轉弧度
 * @param {*} deg 角度
 * @returns 弧度結果
 */
function rad(deg) {
    return deg * (Math.PI / 180);
}

/**
 * 弧度轉角度
 * @param {*} rad 弧度
 * @returns 角度結果
 */
function deg(rad) {
    return rad * (180 / Math.PI);
}

/**
 * 兩點斜率轉角度
 */
function getRotation(p1, p2) {
    // return Math.atan2(p2.y - p1.y, p2.x - p1.x);
    return Math.atan2(p2.y - p1.y, p1.x - p2.x);

}

/**
 * 兩點距離(2d-XY平面) 
 */
function distanceP(p1, p2) {
    const horiz = p2.x - p1.x;
    const vert = p2.y - p1.y;
    return Math.sqrt((horiz * horiz) + (vert * vert));
}

/**
 * 兩點距離(3d) 
 */
function distance3d(p1, p2) {
    const horiz = p2.x - p1.x;
    const vert = p2.y - p1.y;
    const depth = p2.z - p1.z;

    return Math.sqrt((horiz * horiz) + (vert * vert) + (depth * depth));
}


/**
 * 取得min-max間亂數
 * @param {*} min 最小值
 * @param {*} max 最大值(不包含)
 * @returns 
 */
function random(min, max) {
    return Math.random() * (max - min) + min;
}

/**
 * 取得斜率  faceLeft.y 小, faceRight.y大, faceLeft.x小, faceRight.x(原本比較大)
 */
function slope(p2y, p1y, p2x, p1x) {
    return (p2y - p1y) / (p2x - p1x);
}

/**
 * 取得斜率  new face mesh 越往右邊x值變得越小
 */
function slopeForNewFaceMesh(p2y, p1y, p2x, p1x) {
    return (p2y - p1y) / (p2x - p1x);
}

/**
 * 偵測點 轉成 Vector形式
 */
function pointToVec(p) {
    return new THREE.Vector3(p.x, p.y, p.z);
}

/**
 * 取得三點夾角角度
 * @param {*} vertex 中間點
 * @returns 
 */
function getAngle(a1, vertex, a2) { //一定要是Vector3的型態

    const v1 = a1.clone().sub(vertex).normalize();
    const v2 = a2.clone().sub(vertex).normalize();

    return Math.acos(v1.dot(v2));
}