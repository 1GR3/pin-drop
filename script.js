document.addEventListener("DOMContentLoaded", async () => {
    const totalSegments = 180; // Number of radial lines
    const dotCount = 11; // Number of dots per line
    const baseRadius = 100; // Minimum distance from center
    const maxAmplitude = 50; // Maximum amplitude for the pulsing effect
    const frameRate = 12; // Frames per second
    const interval = 1000 / frameRate; // Interval between frames (ms)

    let frames = []; // Placeholder for loaded frames
    let currentFrame = 0;

    // Load frames from a JSON file
    const loadFrames = async () => {
        try {
            const response = await fetch("frames.json");
            frames = await response.json();
            console.log("Frames loaded:", frames);
        } catch (error) {
            console.error("Error loading frames:", error);
        }
    };

    // Create line groups for the visualizer
    const createLineGroups = () => {
        const svgNS = "http://www.w3.org/2000/svg";
        const patternGroup = document.getElementById("circle-pattern");

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

    // Animate the SVG based on the current frame
    const animateFrame = () => {
        if (!frames.length) return; // Exit if frames are not yet loaded

        const amplitudes = frames[currentFrame];

        for (let i = 0; i < totalSegments; i++) {
            const lineGroup = document.querySelector(`.line-group-${i}`);
            if (!lineGroup) continue;

            const dots = lineGroup.querySelectorAll("circle");
            const amplitude = amplitudes[i] || 0; // Get amplitude for this segment

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

        // Move to the next frame
        currentFrame = (currentFrame + 1) % frames.length;
    };

    // Initialize
    await loadFrames();
    createLineGroups();
    setInterval(animateFrame, interval);
});
