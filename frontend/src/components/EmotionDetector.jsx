import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import { calculateHeadPose } from '../utils/faceMath'; 

const EMOTION_THRESHOLD = 0.5; // Lowered slightly to make it more sensitive

const EmotionDetector = ({ socket }) => {
    const videoRef = useRef(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const intervalRef = useRef(null);
    const [detectedText, setDetectedText] = useState('Initializing...');
    
    // Prevent double-init
    const isInitializing = useRef(false);

    useEffect(() => {
        const loadModels = async () => {
            if (isInitializing.current) return;
            isInitializing.current = true;

            const MODEL_URL = '/models';
            try {
                console.log("1. Starting Model Load...");
                
                // Load models if not already loaded
                if (!faceapi.nets.tinyFaceDetector.params) {
                    await Promise.all([
                        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
                        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL)
                    ]);
                }

                console.log('2. ✅ Face-API Models Ready');
                setDetectedText('Models Ready. Starting Camera...');
                startVideo();
            } catch (err) {
                console.error('❌ Failed to load models:', err);
                setDetectedText('Model Load Error');
            }
        };
        loadModels();

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    const startVideo = () => {
        console.log("3. Requesting Camera Access...");
        navigator.mediaDevices.getUserMedia({ video: true, audio: false })
            .then((stream) => {
                console.log("4. Camera Access GRANTED");
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    // Force play in case autoPlay fails
                    videoRef.current.play().catch(e => console.error("Play error:", e));
                }
            })
            .catch((err) => {
                console.error('❌ Failed to get webcam:', err);
                setDetectedText('Camera Error: Allow Access');
            });
    };

    // This function starts the AI Loop
    const startDetectionLoop = () => {
        // If loop already running, don't start another
        if (intervalRef.current) return;

        console.log("5. Starting Detection Loop...");
        setIsLoaded(true);
        setDetectedText('Detecting...');
        
        intervalRef.current = setInterval(async () => {
            if (!videoRef.current) return;

            // Check if video is actually ready
            if (videoRef.current.readyState !== 4) {
                console.warn("Video not ready yet...");
                return;
            }

            try {
                // Using TinyFaceDetector for speed
                const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 });
                
                const detections = await faceapi
                    .detectAllFaces(videoRef.current, options)
                    .withFaceLandmarks()
                    .withFaceExpressions();

                // DEBUG LOG: Remove this after it works
                // console.log(`Faces found: ${detections.length}`); 

                let newMood = 'neutral';
                let headYaw = 0; 
                let attentionStatus = 'Focused';

                if (detections && detections.length > 0) {
                    const data = detections[0];
                    
                    // Emotion Logic
                    const expressions = data.expressions;
                    const dominantEmotion = Object.keys(expressions).reduce((a, b) =>
                        expressions[a] > expressions[b] ? a : b
                    );
                    
                    if (expressions[dominantEmotion] > EMOTION_THRESHOLD) {
                        newMood = dominantEmotion;
                    }

                    // Attention Logic
                    const pose = calculateHeadPose(data.landmarks);
                    headYaw = pose.yaw;
                    attentionStatus = pose.status;

                    // Update UI text
                    setDetectedText(`${newMood.toUpperCase()} | ${attentionStatus}`);
                } else {
                    setDetectedText('No Face Found');
                    attentionStatus = 'Distracted'; 
                }

                // Send to Server
                if (socket && socket.connected) {
                    socket.emit('playerUpdateStatus', { 
                        mood: newMood,
                        headYaw: headYaw,
                        attention: attentionStatus 
                    });
                }

            } catch (err) {
                console.error("Detection Error:", err);
            }
        }, 1000); // Check every 1 second
    };

    return (
        <div className="emotion-detector-container" style={{ position: 'relative', width: '320px', height: '240px' }}>
            <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                width="320"
                height="240"
                onPlay={startDetectionLoop} // Trigger loop when video starts
                onLoadedMetadata={startDetectionLoop} // BACKUP TRIGGER: In case onPlay is missed
                style={{
                    borderRadius: '8px',
                    objectFit: 'cover',
                    border: '2px solid #fff',
                    transform: 'scaleX(-1)', 
                }}
            />
            
            <p style={{
                position: 'absolute', bottom: '10px', left: '10px', color: 'white',
                backgroundColor: 'rgba(0,0,0,0.5)', padding: '4px 8px', borderRadius: '4px',
                margin: 0, textTransform: 'capitalize', fontFamily: 'sans-serif',
                fontSize: '14px', fontWeight: 'bold', zIndex: 10
            }}>
                {detectedText}
            </p>

            {!isLoaded && (
                <div style={{ position: 'absolute', top: 0, left: 0, padding: '10px', color: 'yellow', fontWeight: 'bold' }}>
                    {detectedText}
                </div>
            )}
        </div>
    );
};

export default EmotionDetector;