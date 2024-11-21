document.addEventListener("DOMContentLoaded", async () => {
    const totalSegments = 180;  // Number of radial lines
    const dotCount = 11;        // Number of dots per line
    const baseRadius = 100;     // Minimum distance from center
    const maxAmplitude = 50;    // Maximum amplitude for the pulsing effect

    // Set up the Web Audio API to capture microphone input
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256; // Size of the FFT, controls frequency resolution
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    // Get microphone access
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        audioContext.resume(); // Ensure audio context is active
    } catch (error) {
        console.error("Microphone access denied or not available.", error);
        return;
    }

    // Function to calculate logarithmic frequency mapping
    function getLogFrequencyIndex(segmentIndex) {
        // Ensure we map the full range of `dataArray` to the segments
        const minLog = Math.log10(1); // Avoid log(0) by starting from 1
        const maxLog = Math.log10(bufferLength);
        const logScale = minLog + (segmentIndex / (totalSegments - 1)) * (maxLog - minLog);
        return Math.min(Math.floor(Math.pow(10, logScale)), bufferLength - 1);
    }

    // Function to animate SVG segments based on audio frequency data
    function animatePulseEffect() {
        analyser.getByteFrequencyData(dataArray); // Get frequency data

        for (let i = 0; i < totalSegments; i++) {
            const lineGroup = document.querySelector(`.line-group-${i}`);
            const dots = lineGroup.querySelectorAll("circle");

            // Map the frequency data logarithmically to a segment's amplitude
            const frequencyIndex = getLogFrequencyIndex(i);
            const rawAmplitude = dataArray[frequencyIndex] || 0; // Get raw amplitude
            const amplitude = rawAmplitude / 255; // Normalize to 0–1 (linear scaling)

            dots.forEach((dot, index) => {
                // Set each dot's position based on audio amplitude
                const basePosition = baseRadius;
                const positionWithPulse =
                    basePosition + amplitude * maxAmplitude * (index / dotCount);
                dot.setAttribute("cy", positionWithPulse.toFixed(2));
            });
        }

        requestAnimationFrame(animatePulseEffect);
    }

    animatePulseEffect(); // Start the animation loop
});
