document.addEventListener("DOMContentLoaded", () => {
    const svgNS = "http://www.w3.org/2000/svg";
    const patternGroup = document.getElementById("circle-pattern");
    const totalSegments = 180;

    for (let i = 0; i < totalSegments; i++) {
        // Create a group for each line segment to allow rotation around the center
        const lineGroup = document.createElementNS(svgNS, "g");
        lineGroup.setAttribute("class", `line-group-${i}`);
        lineGroup.setAttribute("transform", `rotate(${i * (360 / totalSegments)})`);

        // Create a dotted line effect using circles
        for (let j = 0; j < 11; j++) {
            const dot = document.createElementNS(svgNS, "circle");
            dot.setAttribute("cx", 0); // Center of rotation
            dot.setAttribute("cy", 50 + j * 5); // Position along line (distance from center)
            dot.setAttribute("r", 1); // Radius of each dot
            lineGroup.appendChild(dot);
        }
        patternGroup.appendChild(lineGroup);
    }
});
