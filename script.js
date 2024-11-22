document.addEventListener("DOMContentLoaded", async () => {
    const totalSegments = 180;  // Number of radial lines
    const dotCount = 11;        // Number of dots per line
    const baseRadius = 100;     // Minimum distance from center
    const maxAmplitude = 50;    // Maximum amplitude for the pulsing effect

    // References to sliders
    const lowCutoffSlider = document.getElementById("lowCutoff");
    const highCutoffSlider = document.getElementById("highCutoff");

    // Set up the Web Audio API to capture microphone input
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256; // Size of the FFT, controls frequency resolution
    const bufferLength = analyser.frequencyBinCount; // Typically 128 for fftSize 256
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

    // Map slider values to actual frequencies
    const getFrequencyFromIndex = (index, sampleRate = 44100) => {
        const nyquist = sampleRate / 2; // Nyquist frequency
        return (index / bufferLength) * nyquist; // Map index to frequency
    };

    // Create line groups for the visualizer
    const createLineGroups = () => {
        const svgNS = "http://www.w3.org/2000/svg";
        const patternGroup = document.getElementById("circle-pattern");

        // Clear any existing graphics
        while (patternGroup.firstChild) {
            patternGroup.removeChild(patternGroup.firstChild);
        }

        for (let i = 0; i < totalSegments; i++) {
            const lineGroup = document.createElementNS(svgNS, "g");
            lineGroup.setAttribute("class", `line-group-${i}`);
            lineGroup.setAttribute("transform", `rotate(${i * (360 / totalSegments)})`);

            for (let j = 0; j < dotCount; j++) {
                const dot = document.createElementNS(svgNS, "circle");
                dot.setAttribute("cx", 0);
                dot.setAttribute("cy", baseRadius + j * 5);
                dot.setAttribute("r", 1);
                lineGroup.appendChild(dot);
            }

            patternGroup.appendChild(lineGroup);
        }
    };

    // Function to map and redistribute amplitudes
    const getRedistributedAmplitudes = () => {
        const lowCutoffIndex = parseInt(lowCutoffSlider.value, 10);
        const highCutoffIndex = parseInt(highCutoffSlider.value, 10);

        const lowCutoffFreq = getFrequencyFromIndex(lowCutoffIndex);
        const highCutoffFreq = getFrequencyFromIndex(highCutoffIndex);

        // Log the cutoff frequencies for debugging
        console.log(`Low Cutoff Frequency: ${lowCutoffFreq.toFixed(2)} Hz, High Cutoff Frequency: ${highCutoffFreq.toFixed(2)} Hz`);

        const filteredAmplitudes = [];
        for (let i = lowCutoffIndex; i <= highCutoffIndex; i++) {
            filteredAmplitudes.push(dataArray[i] / 128); // Normalize amplitudes
        }

        const redistributedAmplitudes = [];
        const step = filteredAmplitudes.length / totalSegments;

        for (let i = 0; i < totalSegments; i++) {
            const start = Math.floor(i * step);
            const end = Math.floor((i + 1) * step);
            const segmentAmplitude = filteredAmplitudes
                .slice(start, end)
                .reduce((acc, amp) => acc + amp, 0) / (end - start || 1); // Average amplitude
            redistributedAmplitudes.push(segmentAmplitude);
        }

        return redistributedAmplitudes;
    };

    // Function to animate SVG segments based on audio frequency data
    function animatePulseEffect() {
        analyser.getByteFrequencyData(dataArray); // Get frequency data

        const amplitudes = getRedistributedAmplitudes();

        for (let i = 0; i < totalSegments; i++) {
            const lineGroup = document.querySelector(`.line-group-${i}`);
            if (!lineGroup) continue;

            const dots = lineGroup.querySelectorAll("circle");
            const amplitude = amplitudes[i] || 0;

            dots.forEach((dot, index) => {
                const basePosition = baseRadius;
                const positionWithPulse =
                    basePosition + amplitude * maxAmplitude * (index / dotCount);
                dot.setAttribute("cy", positionWithPulse);

                // Dynamic color based on amplitude
                const hue = 200 + amplitude * 160; // Map amplitude to color range
                const color = `hsl(${hue}, 100%, 50%)`; // Dynamic hue shift
                dot.setAttribute("fill", color);
            });
        }

        requestAnimationFrame(animatePulseEffect);
    }

    // Initialize the visualizer
    createLineGroups();
    animatePulseEffect();
});
