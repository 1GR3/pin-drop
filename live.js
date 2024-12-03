document.addEventListener("DOMContentLoaded", async () => {
    const totalSegments = 180; // Number of radial lines
    const dotCount = 11; // Number of dots per line
    const baseRadius = 100; // Minimum distance from center
    const maxAmplitude = 50; // Maximum amplitude for the pulsing effect
    const frameRate = 12; // Frames per second
    const interval = 1000 / frameRate; // Interval between frames (ms)

    const minFreq = 20; // Minimum frequency (Hz)
    const maxFreq = 12000; // Maximum frequency (Hz)

    let audioContext;
    let analyser;
    let dataArray;
    let frequencyBins;



    const initializeMicrophone = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            console.log("Media Stream:", stream);

            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const source = audioContext.createMediaStreamSource(stream);

            analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            analyser.smoothingTimeConstant = 0.8; // Adjust smoothing to affect reactivity
            const bufferLength = analyser.frequencyBinCount;
            dataArray = new Uint8Array(bufferLength);

            const nyquist = audioContext.sampleRate / 2;
            frequencyBins = Array.from({ length: bufferLength }, (_, i) =>
                (i / bufferLength) * nyquist
            );

            source.connect(analyser);
            console.log("AudioContext state:", audioContext.state);

            if (audioContext.state === "suspended") {
                await audioContext.resume();
                console.log("AudioContext resumed.");
            }
        } catch (error) {
            micStatus.textContent = "Microphone access denied.";
            console.error("Microphone access denied or not supported", error);
        }
    };

    const mapToSegments = (dataArray, totalSegments) => {
        const mappedData = [];
        const segmentFrequencies = Array.from(
            { length: totalSegments },
            (_, i) =>
                minFreq + (i / (totalSegments - 1)) * (maxFreq - minFreq) / .75
        );

        for (let i = 0; i < totalSegments; i++) {
            const targetFreq = segmentFrequencies[i];
            const closestIndex = frequencyBins.findIndex((f) => f >= targetFreq);

            const amplitude = closestIndex !== -1 ? dataArray[closestIndex] : 0;
            mappedData.push(amplitude / 255);
        }

        console.log(`Mapped Data:`, mappedData);
        return mappedData;
    };

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

    let lastAmplitudes = Array(totalSegments).fill(0); // Store the previous frame's amplitudes

    const animateFrame = () => {
        if (!analyser) return;

        analyser.getByteFrequencyData(dataArray);
        const currentAmplitudes = mapToSegments(dataArray, totalSegments);

        let totalAmplitude = 0;

        const decayFactor = 0.8; // Faster decay
        for (let i = 0; i < totalSegments; i++) {
            const amplitude = Math.max(
                currentAmplitudes[i],
                lastAmplitudes[i] * decayFactor
            );

            lastAmplitudes[i] = amplitude; // Store decayed amplitude

            const lineGroup = document.querySelector(`.line-group-${i}`);
            if (!lineGroup) continue;

            const dots = lineGroup.querySelectorAll("circle");
            totalAmplitude += amplitude;

            dots.forEach((dot, index) => {
                const basePosition = baseRadius;
                const positionWithPulse =
                    basePosition + amplitude * maxAmplitude * (index / dotCount);
                dot.setAttribute("cy", positionWithPulse);

                const hue = 200 + amplitude * 160;
                const color = `hsl(${hue}, 100%, 50%)`;
                dot.setAttribute("fill", color);
            });
        }

        // Average amplitude calculation with decay
        const nonZeroAmplitudes = lastAmplitudes.filter((amp) => amp > 0.01);
        const averageAmplitude =
            nonZeroAmplitudes.length > 0
                ? nonZeroAmplitudes.reduce((sum, amp) => sum + amp, 0) /
                nonZeroAmplitudes.length
                : 0;

        const shadowSvg = document.getElementById("shadow-svg");
        if (shadowSvg) {
            const newStrokeWidth = 1 + averageAmplitude * 20;
            const newOpacity = 0.25 + averageAmplitude * 1.8;

            shadowSvg.setAttribute("stroke-width", newStrokeWidth);
            shadowSvg.setAttribute("opacity", newOpacity);
        }
    };

    const startVisualizer = async () => {
        await initializeMicrophone();
        createLineGroups();
        setInterval(animateFrame, interval);
    };

    startVisualizer();
});
