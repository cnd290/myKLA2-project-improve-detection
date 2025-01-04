function mouthDetection(results) {
    const mouthRight = results.faceLandmarks[0][78];
    const mouthLeft = results.faceLandmarks[0][308];
    const mouthWidth = distance3d(mouthRight, mouthLeft);   //兩點距離


    const mouthTop = results.faceLandmarks[0][13];
    const mouthBottom = results.faceLandmarks[0][14];
    const mouthHeight = distance3d(mouthTop, mouthBottom);  //兩點距離

    const jaw = results.faceLandmarks[0][200];

    let topToJaw = distanceP(jaw, mouthTop);    //下巴至嘴唇上方距離
    let leftToJaw = distanceP(jaw, mouthLeft);  //下巴至左嘴角距離

    /**
     * 因為進入E嘴型動作的判斷是以 leftToJaw / topToJawjson 比例來看
     * 而之後在player 若使用者此時需要做的動作為E嘴型 
     * 需要以使用者當時的 leftToJaw / topToJawjson 這個值 跟 
     * json檔中紀錄的 leftToJaw / topToJawjson這個值來去做個比對
     * 所以先set這個 leftToJaw / topToJawjson 值 到record.js 那會get這個值 再紀錄進json檔
     * 
     * 而相對的 :
     * 進入A I O嘴型動作的判斷是以 mouthHeight / mouthWidth 比例來看
     * 而之後在player 若使用者此時需要做的動作為A/I/O嘴型 
     * 需要以使用者當時的 mouthHeight / mouthWidth 這個值 跟 
     * json檔中紀錄的 mouthHeight / mouthWidth 這個值來去做個比對
     * 所以先set這個 mouthHeight / mouthWidth 值 到record.js 那會get這個值 再紀錄進json檔
     */
    vrmManager.setEMouthShape(leftToJaw / topToJaw);        
    vrmManager.setMouthRatio(mouthHeight / mouthWidth);
    
    //E嘴型 -> 不露齒微笑
    if (leftToJaw / topToJaw > 1.35) {
        vrmManager.setPreset(Preset.E, 1);  //來設定某嘴型的張開程度
        vrmManager.setPreset(Preset.A, 0);  //A嘴型張開程度為0 (代表這裡不使用A嘴型)
        vrmManager.setPreset(Preset.I, 0);
        vrmManager.setPreset(Preset.O, 0);
        vrmManager.setPreset(Preset.U, 0);

    } else {
        //I嘴型 -> 嘴巴閉上
        if (mouthHeight / mouthWidth < 0.075) {
            vrmManager.setPreset(Preset.E, 0);
            vrmManager.setPreset(Preset.A, 0);
            vrmManager.setPreset(Preset.I, 0.3);
            vrmManager.setPreset(Preset.O, 0);
            vrmManager.setPreset(Preset.U, 0);

        } 
        //A嘴型 -> 嘴巴張開 但張開程度沒有O那麼大
        //vrm嘴巴張開的程度會依我們嘴巴張開的程度來改變
        else if (mouthHeight / mouthWidth >= 0.075 && mouthHeight / mouthWidth < 0.5) {
            vrmManager.setPreset(Preset.E, 0);
            vrmManager.setPreset(Preset.A, mouthHeight / mouthWidth * 1.5);
            vrmManager.setPreset(Preset.I, 0);
            vrmManager.setPreset(Preset.O, 0);
            vrmManager.setPreset(Preset.U, 0);
        } 
        //O嘴型 -> 張大嘴巴
        //張開的程度為固定的 為了不讓vrm的嘴巴破圖
        else if (mouthHeight / mouthWidth >= 0.5) {
            vrmManager.setPreset(Preset.E, 0);
            vrmManager.setPreset(Preset.A, 0);
            vrmManager.setPreset(Preset.I, 0);
            vrmManager.setPreset(Preset.O, 1);
            vrmManager.setPreset(Preset.U, 0);
        }
    }
}