import json
import numpy as np

def normalize_and_upscale_amplitudes(input_file, output_file, 
                                     mean_threshold=0.5, 
                                     downscale_factor=0.8,
                                     upscale_factor=1.75,
                                     upscale_range=(0.05, 0.45)):
    """
    Normalizes and upscales amplitudes in a JSON file containing 2D amplitude frames.

    Args:
        input_file (str): Path to the input JSON file.
        output_file (str): Path to save the processed JSON file.
        mean_threshold (float): Threshold for the mean amplitude of a frame.
        downscale_factor (float): Factor to reduce amplitudes if mean exceeds the threshold.
        upscale_factor (float): Factor to increase amplitudes in the specified range.
        upscale_range (tuple): (min, max) range for values to upscale.
    """
    try:
        # Load the JSON file
        with open(input_file, "r") as f:
            data = json.load(f)

        # Convert to NumPy array for easier processing
        frames = np.array(data)

        for frame_index, frame in enumerate(frames):
            # Calculate the mean amplitude of the frame
            mean_amplitude = np.mean(frame)
            
            # If the mean exceeds the threshold, downscale the frame
            if mean_amplitude > mean_threshold:
                frames[frame_index] *= downscale_factor

            # Apply upscaling for amplitudes within the specified range
            frames[frame_index] = np.where(
                (frames[frame_index] > upscale_range[0]) & (frames[frame_index] < upscale_range[1]),
                frames[frame_index] * upscale_factor,
                frames[frame_index]
            )

        # Ensure values are clipped between 0 and 1 after scaling
        frames = np.clip(frames, 0, 1)

        # Round all values to 2 decimals
        frames = np.round(frames, 2)

        # Save the processed data back to JSON
        with open(output_file, "w") as f:
            json.dump(frames.tolist(), f, indent=4)

        print(f"Processed amplitudes saved to {output_file}")

    except Exception as e:
        print(f"Error processing file: {e}")

# Example usage
input_json = "../platform.json"   # Path to your input JSON file
output_json = "../platform.json"  # Path to save the processed JSON file

normalize_and_upscale_amplitudes(
    input_json, 
    output_json, 
    mean_threshold=0.95, 
    downscale_factor=1.0, 
    upscale_factor=2.5, 
    upscale_range=(0.05, 0.25)
)
