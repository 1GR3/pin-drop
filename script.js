document.addEventListener("DOMContentLoaded", async () => {
    const totalSegments = 180; // Number of radial lines
    const dotCount = 11; // Number of dots per line
    const baseRadius = 100; // Minimum distance from center
    const maxAmplitude = 50; // Maximum amplitude for the pulsing effect
    const frameRate = 12; // Frames per second
    const interval = 1000 / frameRate; // Interval between frames (ms)

    const states = ["company", "homepage", "partner", "platform", "solutions"];
    let currentStateIndex = 0;
    let frames = []; // Placeholder for loaded frames
    let currentFrame = 0;

    // Load frames for the current state
    const loadFrames = async (state) => {
        try {
            const response = await fetch(`${state}.json`); // Load the JSON file for the state
            frames = await response.json();
            console.log(`Frames loaded for state: ${state}`, frames);
        } catch (error) {
            console.error(`Error loading frames for state: ${state}`, error);
        }
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

    // Animate the SVG based on the current frame
    const animateFrame = () => {
        if (!frames.length) return; // Exit if frames are not yet loaded

        const amplitudes = frames[currentFrame];
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
        const newOpacity = .25 + averageAmplitude * 1.8;

        shadowSvg.setAttribute("stroke-width", newStrokeWidth);
        shadowSvg.setAttribute("opacity", newOpacity);

        // Move to the next frame
        currentFrame = (currentFrame + 1) % frames.length;
    };

    // Update the container and load the JSON file for the current state
    const updateState = async () => {
        const container = document.querySelector(".container");
        const state = states[currentStateIndex];
        container.setAttribute("id", state); // Update the container ID
        currentFrame = 0; // Reset the frame index
        await loadFrames(state); // Load frames for the new state
        createLineGroups(); // Recreate line groups if needed
    };

    // Event listeners for navigation buttons
    document.getElementById("next-btn").addEventListener("click", async () => {
        currentStateIndex = (currentStateIndex + 1) % states.length;
        await updateState();
    });

    document.getElementById("prev-btn").addEventListener("click", async () => {
        currentStateIndex =
            (currentStateIndex - 1 + states.length) % states.length;
        await updateState();
    });

    // Initialize
    await loadFrames(states[currentStateIndex]);
    createLineGroups();
    setInterval(animateFrame, interval);
});
