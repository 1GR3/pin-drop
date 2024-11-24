import numpy as np
import librosa
import json

def process_audio_to_array(
    input_wave_file, 
    low_cut_freq, 
    high_cut_freq, 
    start_time, 
    end_time, 
    num_frequency_bins, 
    output_json_file
):
    """
    Processes a WAV audio file into a 2D array structure based on frequency ranges.

    Args:
        input_wave_file (str): Path to the input WAV file.
        low_cut_freq (float): Low-cut frequency (Hz).
        high_cut_freq (float): High-cut frequency (Hz).
        start_time (float): Start time for processing (seconds).
        end_time (float): End time for processing (seconds).
        num_frequency_bins (int): Number of frequency bins in the output array.
        output_json_file (str): Path to the output JSON file.

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
    stft = np.abs(librosa.stft(y_cropped, n_fft=2048, hop_length=512))
    freqs = librosa.fft_frequencies(sr=sr)

    # Apply frequency range filtering
    valid_indices = np.where((freqs >= low_cut_freq) & (freqs <= high_cut_freq))[0]
    stft_filtered = stft[valid_indices, :]

    # Map to desired frequency bins
    freq_bin_edges = np.linspace(0, stft_filtered.shape[0], num_frequency_bins + 1, dtype=int)
    frequency_bins = [
        stft_filtered[freq_bin_edges[i]:freq_bin_edges[i + 1], :].mean(axis=0)
        for i in range(len(freq_bin_edges) - 1)
    ]

    # Normalize and round data
    max_value = np.max(frequency_bins)
    normalized_bins = (frequency_bins / max_value).tolist()
    rounded_bins = [[round(val, 2) for val in row] for row in normalized_bins]

    # Transpose to create the 2D array
    output_array = np.array(rounded_bins).T.tolist()

    # Save to JSON
    with open(output_json_file, "w") as file:
        json.dump(output_array, file, indent=4)

    print(f"Processed audio saved as JSON to {output_json_file}")


# Example Usage
input_wave_file = "../audio.wav"       # Path to your WAV file
low_cut_freq = 2000                  # Low-cut frequency in Hz
high_cut_freq = 16000               # High-cut frequency in Hz
start_time = 0                     # Start time in seconds
end_time = 10                      # End time in seconds
num_frequency_bins = 180           # Number of frequency bins
output_json_file = "../frames.json"   # Path to save the JSON output

process_audio_to_array(
    input_wave_file,
    low_cut_freq,
    high_cut_freq,
    start_time,
    end_time,
    num_frequency_bins,
    output_json_file
)
