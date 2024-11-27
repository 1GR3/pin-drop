import numpy as np
import librosa
import json
import matplotlib.pyplot as plt
from scipy.ndimage import gaussian_filter1d

def process_audio_to_array(
    input_wave_file, 
    low_cut_freq, 
    high_cut_freq, 
    start_time, 
    end_time, 
    num_frequency_bins, 
    output_json_file,
    hop_length=512,                 # Overlapping windows (smaller hop_length = more overlap)
    normalization=True,             # Normalize frequency bins
    normalization_type="per_bin",   # 'per_bin' or 'global' normalization
    sigma=2,                        # Gaussian smoothing sigma (applied across frequency range)
    log_frequency=False,            # Use logarithmic frequency binning
    scaling_factor=5                # Scale normalized values for enhanced amplitudes
):
    """
    Processes a WAV audio file into a 2D array structure with configurable parameters.

    Args:
        input_wave_file (str): Path to the input WAV file.
        low_cut_freq (float): Low-cut frequency (Hz).
        high_cut_freq (float): High-cut frequency (Hz).
        start_time (float): Start time for processing (seconds).
        end_time (float): End time for processing (seconds).
        num_frequency_bins (int): Number of frequency bins in the output array.
        output_json_file (str): Path to the output JSON file.
        hop_length (int): Number of samples between STFT windows.
        normalization (bool): Whether to normalize frequency bins.
        normalization_type (str): Type of normalization ('per_bin' or 'global').
        sigma (float): Standard deviation for Gaussian smoothing (applied across frequency bins).
        log_frequency (bool): Use logarithmic frequency binning.
        scaling_factor (float): Multiply normalized values to enhance amplitudes.

    Returns:
        None
    """
    # Load the audio file
    y, sr = librosa.load(input_wave_file, sr=None, mono=True)
    duration = librosa.get_duration(y=y, sr=sr)

    # Ensure the start and end times are within the file's duration
    if start_time >= duration or end_time > duration:
        raise ValueError("Start or end time is outside the duration of the audio file.")
    
    # Crop the audio signal based on start and end times
    start_sample = int(start_time * sr)
    end_sample = int(end_time * sr)
    y_cropped = y[start_sample:end_sample]

    # Generate the Short-Time Fourier Transform (STFT)
    stft = np.abs(librosa.stft(y_cropped, n_fft=2048, hop_length=hop_length))
    freqs = librosa.fft_frequencies(sr=sr)

    # Apply frequency range filtering
    valid_indices = np.where((freqs >= low_cut_freq) & (freqs <= high_cut_freq))[0]
    stft_filtered = stft[valid_indices, :]

    # Map to desired frequency bins
    if log_frequency:
        # Logarithmic frequency binning
        freq_bin_edges = np.logspace(np.log10(1), np.log10(stft_filtered.shape[0]), num=num_frequency_bins + 1, dtype=int)
    else:
        # Linear frequency binning
        freq_bin_edges = np.linspace(0, stft_filtered.shape[0], num_frequency_bins + 1, dtype=int)

    frequency_bins = [
        np.mean(stft_filtered[freq_bin_edges[i]:freq_bin_edges[i + 1], :], axis=0)
        for i in range(len(freq_bin_edges) - 1)
    ]

    # Smooth within individual frames (across frequency bins)
    frequency_bins = np.array(frequency_bins).T  # Transpose to operate on individual frames
    smoothed_bins = np.array([
        gaussian_filter1d(frame, sigma=sigma) for frame in frequency_bins
    ]).T  # Transpose back to original format

    # Normalize values
    if normalization:
        if normalization_type == "global":
            max_value = np.max(smoothed_bins)
            smoothed_bins = smoothed_bins / (max_value + 1e-3)  # Avoid division by zero
        elif normalization_type == "per_bin":
            max_per_bin = np.max(smoothed_bins, axis=1, keepdims=True)
            smoothed_bins = smoothed_bins / (max_per_bin + 1e-8)

    # Clip and scale
    smoothed_bins = np.clip(smoothed_bins, 0, 1)
    smoothed_bins *= scaling_factor
    smoothed_bins = np.clip(smoothed_bins, 0, 1)  # Re-clip after scaling

    # Scale and round
    scaled_bins = [[round(val, 2) for val in row] for row in smoothed_bins]

    # Transpose to create the 2D array
    output_array = np.array(scaled_bins).T.tolist()

    # Save to JSON
    with open(output_json_file, "w") as file:
        json.dump(output_array, file, indent=4)

    print(f"Processed audio saved as JSON to {output_json_file}")

    # Visualization for analysis
    plt.figure(figsize=(12, 6))
    plt.imshow(np.array(output_array).T, aspect='auto', origin='lower', cmap='magma')
    plt.colorbar(label="Amplitude")
    plt.xlabel("Time Frames")
    plt.ylabel("Frequency Bins")
    plt.title("Processed Audio Data")
    plt.show()


# Parameters
input_wave_file = "../audio.wav"       # Path to your WAV file
low_cut_freq = 1200                     # Low-cut frequency in Hz
high_cut_freq = 22900                 # High-cut frequency in Hz
start_time = 56.40                   # Start time in seconds
end_time = 58.85
                     # End time in seconds
num_frequency_bins = 180              # Number of frequency bins
output_json_file = "../frames.json"   # Path to save the JSON output

# Configurable parameters
hop_length = 512                      # Smaller hop length for overlapping windows
normalization = True                  # Normalize frequency bins
normalization_type = "per_bin"         # Global normalization
sigma = 1.5                             # Standard deviation for Gaussian smoothing across bins
log_frequency = False                 # Use logarithmic frequency mapping
scaling_factor = 1.81                # Scale normalized values to enhance amplitudes

# Process the audio
process_audio_to_array(
    input_wave_file,
    low_cut_freq,
    high_cut_freq,
    start_time,
    end_time,
    num_frequency_bins,
    output_json_file,
    hop_length=hop_length,
    normalization=normalization,
    normalization_type=normalization_type,
    sigma=sigma,
    log_frequency=log_frequency,
    scaling_factor=scaling_factor
)
