document.addEventListener("DOMContentLoaded", async () => {
    const totalSegments = 180;  // Number of radial lines
    const dotCount = 11;        // Number of dots per line
    const baseRadius = 100;      // Minimum distance from center
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

    // Function to animate SVG segments based on audio frequency data
    function animatePulseEffect() {
        analyser.getByteFrequencyData(dataArray); // Get frequency data

        // Log data for debugging to see if dataArray has values
        console.log(dataArray);

        for (let i = 0; i < totalSegments; i++) {
            const lineGroup = document.querySelector(`.line-group-${i}`);
            const dots = lineGroup.querySelectorAll("circle");

            // Map the frequency data to a segment's pulse amplitude
            const frequencyIndex = Math.floor((i / totalSegments) * bufferLength);
            const amplitude = dataArray[frequencyIndex] / 128; // Normalize and scale (0 to ~2)

            dots.forEach((dot, index) => {
                // Set each dot's position based on audio amplitude
                const basePosition = baseRadius;
                const positionWithPulse = basePosition + amplitude * maxAmplitude * (index / dotCount);
                dot.setAttribute("cy", positionWithPulse);
            });
        }

        requestAnimationFrame(animatePulseEffect);
    }

    animatePulseEffect(); // Start the animation loop
});
