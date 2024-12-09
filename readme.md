# PinDrop - Audio visualisation animation



A dynamic and interactive audio visualization application that captures live audio input, analyzes frequency data, and renders a responsive SVG-based radial animation. The project is ideal for showcasing real-time audio data in a visually appealing way.

## Features

- **Live Audio Input**: Utilizes the Web Audio API to capture real-time microphone input.
- **Frequency Mapping**: Maps audio frequencies (20Hz to 12kHz) to a circular visualization with 180 radial segments.
- **Dynamic Motion**: Each radial segment reacts to audio amplitudes, creating a visually dynamic experience.
- **Reflection Effect**: A subtle shadow element mirrors the main animation and reacts to audio intensity.
- **Threshold Filtering**: Motion is suppressed for frequencies below a certain threshold to avoid noise.
- **State Cycling**: Supports cycling through multiple visualization states (`live1`, `live2`, `live3`) using navigation buttons.

## Technologies Used

- **HTML/CSS/JavaScript**: For building the structure, styling, and interactivity of the visualization.
- **Web Audio API**: For capturing and analyzing live audio data.
- **SVG Animation**: For rendering the circular visualization.

## Getting Started

Follow these instructions to get the project running on your local machine.

### Prerequisites

- A modern web browser (Google Chrome, Firefox, or Safari) with Web Audio API support.
- A microphone connected to your computer.
- A local web server for serving the files (optional for local testing).

### Installation


This project uses [Vite](https://vitejs.dev/) for fast and modern front-end development. Follow these steps to set up and run the project:

### Prerequisites

- **Node.js**: Install [Node.js](https://nodejs.org/) (LTS version recommended).
- **npm**: Comes bundled with Node.js.

### Installation

1. **Install Dependencies**:
   - Navigate to the project directory and run:
     ```bash
     npm install
     ```

2. **Run Development Server**:
   - Start the development server:
     ```bash
     npm run dev
     ```
   - Vite will display a local server URL, typically `http://localhost:5173`. Open this URL in your browser.

3. **Build for Production**:
   - To generate optimized production-ready files:
     ```bash
     npm run build
     ```

4. **Preview Production Build**:
   - To serve the production build locally:
     ```bash
     npm run preview
     ```

### Vite Commands Summary

| Command           | Description                                         |
|-------------------|-----------------------------------------------------|
| `npm run dev`     | Starts the development server with hot reload.      |
| `npm run build`   | Builds the project for production.                  |
| `npm run preview` | Serves the production build locally for testing.    |


