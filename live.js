document.addEventListener("DOMContentLoaded", async () => {
    const totalSegments = 180; // Number of radial lines
    const dotCount = 11; // Number of dots per line
    const baseRadius = 100; // Minimum distance from center
    const maxAmplitude = 50; // Maximum amplitude for the pulsing effect
    const frameRate = 12; // Frames per second
    const interval = 1000 / frameRate; // Interval between frames (ms)

    let audioContext;
    let analyser;
    let dataArray;
    let frames = []; // Placeholder for audio data frames

    // Initialize microphone and Web Audio API
    const initializeMicrophone = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const source = audioContext.createMediaStreamSource(stream);

            analyser = audioContext.createAnalyser();
            analyser.fftSize = 256; // Adjust this for resolution
            const bufferLength = analyser.frequencyBinCount; // Half of fftSize
            dataArray = new Uint8Array(bufferLength);

            source.connect(analyser);
        } catch (error) {
            console.error("Microphone access denied or not supported", error);
        }
    };

    // Map dataArray to totalSegments
    const mapToSegments = (dataArray, totalSegments) => {
        const mappedData = [];
        const step = dataArray.length / totalSegments;

        for (let i = 0; i < totalSegments; i++) {
            const pos = i * step; // Calculate the exact position in dataArray
            const lower = Math.floor(pos);
            const upper = Math.ceil(pos);
            const weight = pos - lower;

            // Interpolate between the two closest values
            const value =
                (1 - weight) * (dataArray[lower] || 0) + weight * (dataArray[upper] || 0);
            mappedData.push(value / 255); // Normalize to [0, 1]
        }

        return mappedData;
    };

    // Create line groups for the visualizer
    const createLineGroups = () => {
        const svgNS = "http://www.w3.org/2000/svg";
        const patternGroup = document.getElementById("circle-pattern");
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
    };

    // Animate the SVG based on microphone input
    const animateFrame = () => {
        if (!analyser) return;

        analyser.getByteFrequencyData(dataArray); // Get frequency data
        const amplitudes = mapToSegments(dataArray, totalSegments); // Map to totalSegments
        let totalAmplitude = 0; // Variable to calculate average amplitude

        for (let i = 0; i < totalSegments; i++) {
            const lineGroup = document.querySelector(`.line-group-${i}`);
            if (!lineGroup) continue;

            const dots = lineGroup.querySelectorAll("circle");
            const amplitude = amplitudes[i] || 0; // Get amplitude for this segment
            totalAmplitude += amplitude; // Add amplitude to total

            dots.forEach((dot, index) => {
                const basePosition = baseRadius;
                const positionWithPulse =
                    basePosition + amplitude * maxAmplitude * (index / dotCount);
                dot.setAttribute("cy", positionWithPulse);

                // Optional: Add dynamic color effect based on amplitude
                const hue = 200 + amplitude * 160; // Map amplitude to hue range
                const color = `hsl(${hue}, 100%, 50%)`;
                dot.setAttribute("fill", color);
            });
        }

        // Calculate average amplitude
        const averageAmplitude = totalAmplitude / totalSegments;

        // Update the stroke width of #shadow-svg based on average amplitude
        const shadowSvg = document.getElementById("shadow-svg");
        const newStrokeWidth = 1 + averageAmplitude * 20; // Base width + amplitude scaling
        const newOpacity = 0.25 + averageAmplitude * 1.8;

        shadowSvg.setAttribute("stroke-width", newStrokeWidth);
        shadowSvg.setAttribute("opacity", newOpacity);
    };

    // Initialize and start animation
    const startVisualizer = async () => {
        await initializeMicrophone();
        createLineGroups();
        setInterval(animateFrame, interval);
    };

    // Start the visualizer
    startVisualizer();
});
