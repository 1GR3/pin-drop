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
    hop_length=512,                 
    normalization=True,             
    normalization_type="per_bin",   
    sigma=2,                        
    log_frequency=False,            
    scaling_factor=5                
):
    y, sr = librosa.load(input_wave_file, sr=None, mono=True)
    duration = librosa.get_duration(y=y, sr=sr)

    if start_time >= duration or end_time > duration:
        raise ValueError("Start or end time is outside the duration of the audio file.")
    
    start_sample = int(start_time * sr)
    end_sample = int(end_time * sr)
    y_cropped = y[start_sample:end_sample]

    stft = np.abs(librosa.stft(y_cropped, n_fft=2048, hop_length=hop_length))
    freqs = librosa.fft_frequencies(sr=sr)

    valid_indices = np.where((freqs >= low_cut_freq) & (freqs <= high_cut_freq))[0]
    stft_filtered = stft[valid_indices, :]

    if log_frequency:
        freq_bin_edges = np.logspace(np.log10(1), np.log10(stft_filtered.shape[0]), num=num_frequency_bins + 1, dtype=int)
    else:
        freq_bin_edges = np.linspace(0, stft_filtered.shape[0], num_frequency_bins + 1, dtype=int)

    frequency_bins = [
        np.mean(stft_filtered[freq_bin_edges[i]:freq_bin_edges[i + 1], :], axis=0)
        for i in range(len(freq_bin_edges) - 1)
    ]

    frequency_bins = np.array(frequency_bins).T
    smoothed_bins = np.array([
        gaussian_filter1d(frame, sigma=sigma) for frame in frequency_bins
    ]).T

    if normalization:
        if normalization_type == "global":
            max_value = np.max(smoothed_bins)
            smoothed_bins = smoothed_bins / (max_value + 1e-3)
        elif normalization_type == "per_bin":
            max_per_bin = np.max(smoothed_bins, axis=1, keepdims=True)
            smoothed_bins = smoothed_bins / (max_per_bin + 1e-8)

    smoothed_bins = np.clip(smoothed_bins, 0, 1)
    smoothed_bins *= scaling_factor
    smoothed_bins = np.clip(smoothed_bins, 0, 1)

    # Convert to Python-native float and round to 2 decimals
    output_array = [
        [round(float(val), 2) for val in row] for row in smoothed_bins.T
    ]

    with open(output_json_file, "w") as file:
        json.dump(output_array, file, indent=4)

    print(f"Processed audio saved as JSON to {output_json_file}")

    plt.figure(figsize=(12, 6))
    plt.imshow(np.array(output_array).T, aspect='auto', origin='lower', cmap='magma')
    plt.colorbar(label="Amplitude")
    plt.xlabel("Time Frames")
    plt.ylabel("Frequency Bins")
    plt.title("Processed Audio Data")
    plt.show()

# Parameters
input_wave_file = "../audio.wav"       # Path to your WAV file
low_cut_freq = 20 #880                     # Low-cut frequency in Hz
high_cut_freq = 22900                 # High-cut frequency in Hz
start_time = 40.89                # Start time in seconds
end_time = 41.34                 # End time in seconds
num_frequency_bins = 180              # Number of frequency bins
output_json_file = "../frames.json"   # Path to save the JSON output

# Configurable parameters
hop_length = 812                      # Smaller hop length for overlapping windows
normalization = True                  # Normalize frequency bins
normalization_type = "per_bin"         # Global normalization
sigma = 0.25                             # Standard deviation for Gaussian smoothing across bins
log_frequency = False                 # Use logarithmic frequency mapping
scaling_factor = 1.25                # Scale normalized values to enhance amplitudes

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
