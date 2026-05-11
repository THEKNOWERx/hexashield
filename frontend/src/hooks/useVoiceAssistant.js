import { useState, useCallback, useEffect } from 'react';

/**
 * useVoiceAssistant Hook
 * Provides high-level control over the Web Speech API for professional briefings.
 */
export const useVoiceAssistant = () => {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [voices, setVoices] = useState([]);

    useEffect(() => {
        const loadVoices = () => {
            const availableVoices = window.speechSynthesis.getVoices();
            setVoices(availableVoices);
        };
        loadVoices();
        window.speechSynthesis.onvoiceschanged = loadVoices;
    }, []);

    const stop = useCallback(() => {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
    }, []);

    const speak = useCallback((text) => {
        if (!text) return;
        
        // Stop any current speech
        stop();

        const utterance = new SpeechSynthesisUtterance(text);
        
        // Strategy: Select a professional, deep, and clear voice
        // We prefer 'Google US English' or 'Microsoft David' or any premium English voice
        const preferredVoice = voices.find(v => v.name.includes('Google US English') || v.name.includes('Natural')) 
                             || voices.find(v => v.lang.startsWith('en')) 
                             || voices[0];

        if (preferredVoice) utterance.voice = preferredVoice;

        utterance.pitch = 1.0;
        utterance.rate = 0.95; // Slightly slower for professional clarity
        utterance.volume = 1.0;

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        window.speechSynthesis.speak(utterance);
    }, [voices, stop]);

    return { speak, stop, isSpeaking };
};
