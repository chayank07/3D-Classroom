// src/utils/faceMath.js

export const calculateHeadPose = (landmarks) => {
    const nose = landmarks.getNose()[3]; 
    const leftEar = landmarks.getJawOutline()[0]; 
    const rightEar = landmarks.getJawOutline()[16]; 
    
    // Calculate horizontal distances
    const distToLeft = Math.abs(nose.x - leftEar.x);
    const distToRight = Math.abs(nose.x - rightEar.x);
    
    // Calculate Ratio
    // 1.0 = Center
    // < 1.0 = Looking Left
    // > 1.0 = Looking Right
    const ratio = distToLeft / (distToRight + 0.001); 
    
    let yaw = 0;
    
    // --- STABILIZED SENSITIVITY ---
    // We widened the "Center" zone (0.4 to 3.0) to prevent flickering.
    // You now have to turn your head significantly to trigger "Distracted".
    
    // LOOKING LEFT
    if (ratio < 0.35) { 
        yaw = 1.2; // Hard Left (Distracted)
    } else if (ratio < 0.55) {
        yaw = 0.5; // Soft Left (Still Focused)
    } 
    
    // LOOKING RIGHT
    else if (ratio > 3.0) {
        yaw = -1.2; // Hard Right (Distracted)
    } else if (ratio > 1.8) {
        yaw = -0.5; // Soft Right (Still Focused)
    } 
    
    // CENTER (Focused)
    else {
        yaw = 0; 
    }
    
    // Status Logic
    // Only flag as "Distracted" if the turn is drastic (yaw > 1.0)
    let status = 'Focused';
    if (Math.abs(yaw) > 1.0) {
        status = 'Distracted';
    }

    return { yaw, status };
};