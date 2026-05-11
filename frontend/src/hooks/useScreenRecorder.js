import { useState, useRef, useCallback } from 'react';

/**
 * useScreenRecorder Hook
 * Manages display capture and media recording for security evidence collection.
 */
export const useScreenRecorder = () => {
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef(null);
    const chunksRef = useRef([]);
    const streamRef = useRef(null);

    const startRecording = useCallback(async () => {
        try {
            // Priority: Capture the current tab/window
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: { frameRate: { ideal: 30 } },
                audio: true // Optional: Capture system audio (AI Assistant voice)
            });

            streamRef.current = stream;
            chunksRef.current = [];

            const recorder = new MediaRecorder(stream, {
                mimeType: 'video/webm;codecs=vp9'
            });

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            recorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'video/webm' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `HexaShield_Evidence_${Date.now()}.webm`;
                a.click();
                URL.revokeObjectURL(url);
                
                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());
                setIsRecording(false);
            };

            mediaRecorderRef.current = recorder;
            recorder.start();
            setIsRecording(true);
            
            return true;
        } catch (err) {
            console.error("Recording failed to start", err);
            return false;
        }
    }, []);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
    }, []);

    return { startRecording, stopRecording, isRecording };
};
