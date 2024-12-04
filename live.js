document.addEventListener("DOMContentLoaded", async () => {
    const totalSegments = 180; // Number of radial lines
    const dotCount = 11; // Number of dots per line
    const baseRadius = 100; // Minimum distance from center
    const maxAmplitude = 50; // Maximum amplitude for the pulsing effect
    const minFreq = 20; // Minimum frequency (Hz)
    const maxFreq = 12000; // Maximum frequency (Hz)
    const motionThreshold = 0.05; // Threshold below which motion is suppressed

    // Set up the Web Audio API to capture microphone input
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256; // Size of the FFT, controls frequency resolution
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    // Calculate frequency range for each segment
    const nyquist = audioContext.sampleRate / 2;
    const frequencyBins = Array.from({ length: bufferLength }, (_, i) => (i / bufferLength) * nyquist);
    const segmentFrequencies = Array.from(
        { length: totalSegments },
        (_, i) => minFreq + (i / (totalSegments - 1)) * (maxFreq - minFreq)
    );

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

    // Function to find the closest frequency bin for a given frequency
    const findClosestFrequencyBin = (targetFreq) => {
        let closestIndex = 0;
        let closestDiff = Infinity;
        for (let i = 0; i < frequencyBins.length; i++) {
            const diff = Math.abs(frequencyBins[i] - targetFreq);
            if (diff < closestDiff) {
                closestDiff = diff;
                closestIndex = i;
            }
        }
        return closestIndex;
    };

    // Map the segment frequencies to corresponding frequency bins
    const segmentFrequencyBins = segmentFrequencies.map((freq) => findClosestFrequencyBin(freq));
    console.log("Segment Frequency Bins:", segmentFrequencyBins); // Debugging mapping

    // Function to animate SVG segments based on audio frequency data
    function animatePulseEffect() {
        analyser.getByteFrequencyData(dataArray); // Get frequency data

        let totalAmplitude = 0;

        for (let i = 0; i < totalSegments; i++) {
            const lineGroup = document.querySelector(`.line-group-${i}`);
            if (!lineGroup) {
                console.warn(`Line group .line-group-${i} not found.`);
                continue;
            }

            const dots = lineGroup.querySelectorAll("circle");

            // Get amplitude for the current segment's frequency range
            const frequencyIndex = segmentFrequencyBins[i];
            const amplitude = dataArray[frequencyIndex] / 128; // Normalize and scale (0 to ~2)

            // Ignore amplitudes below the threshold
            const effectiveAmplitude = amplitude > motionThreshold ? amplitude : 0;

            totalAmplitude += effectiveAmplitude;

            dots.forEach((dot, index) => {
                // Set each dot's position based on effective amplitude
                const basePosition = baseRadius;
                const positionWithPulse = basePosition + effectiveAmplitude * maxAmplitude * (index / dotCount);
                dot.setAttribute("cy", positionWithPulse);
            });
        }

        // Calculate the average amplitude for the shadow effect
        const averageAmplitude = totalAmplitude / totalSegments;

        // Update the shadow attributes dynamically if above threshold
        const shadowSvg = document.getElementById("shadow-svg");
        if (shadowSvg && averageAmplitude > motionThreshold) {
            const newStrokeWidth = 1 + averageAmplitude * 5; // Base width + amplitude scaling
            const newOpacity = 0.2 + averageAmplitude * .4; // Adjust opacity
            // const newYPosition = 170 + averageAmplitude * 30; // Dynamic Y-offset

            shadowSvg.setAttribute("stroke-width", newStrokeWidth);
            shadowSvg.setAttribute("opacity", newOpacity);
            // shadowSvg.setAttribute("cy", newYPosition); // Move shadow up/down based on amplitude
        } else if (shadowSvg) {
            // Reset shadow to default state if below threshold
            shadowSvg.setAttribute("stroke-width", 1);
            shadowSvg.setAttribute("opacity", 0.25);
            // shadowSvg.setAttribute("cy", 170);
        }

        requestAnimationFrame(animatePulseEffect);
    }

    // Initialize SVG line groups
    const createLineGroups = () => {
        const svgNS = "http://www.w3.org/2000/svg";
        const patternGroup = document.getElementById("circle-pattern");

        if (!patternGroup) {
            console.error("SVG element with ID 'circle-pattern' not found.");
            return;
        }

        patternGroup.innerHTML = ""; // Clear any existing line groups

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

        console.log("SVG elements created successfully.");
    };

    createLineGroups(); // Initialize SVG structure
    animatePulseEffect(); // Start the animation loop
});
