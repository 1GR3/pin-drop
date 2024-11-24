import json
import numpy as np

def extend_with_subtle_variations(input_array, repeats, variation_strength=0.01, scaling_range=(0.98, 1.02), shuffle_prob=0.1):
    """
    Extends a 2D array by repeating it with very subtle randomized variations.

    Args:
        input_array (list of lists): 2D array (original sequence).
        repeats (int): Number of times to repeat the sequence.
        variation_strength (float): Strength of the variations (percentage of the value).
        scaling_range (tuple): Range for random scaling factors applied to rows.
        shuffle_prob (float): Probability of shuffling each row.

    Returns:
        list of lists: Extended 2D array with subtle randomized variations.
    """
    original_array = np.array(input_array)
    extended_array = []

    for _ in range(repeats):
        for row in original_array:
            # Apply very slight scaling
            scaling_factor = np.random.uniform(*scaling_range)
            scaled_row = row * scaling_factor

            # Add minimal random noise
            noise = np.random.uniform(-variation_strength, variation_strength, size=row.shape)
            noised_row = np.clip(scaled_row + noise, 0, 1)  # Keep values within [0, 1]

            # Rarely shuffle segments
            if np.random.rand() < shuffle_prob:
                shuffled_row = np.random.permutation(noised_row)
            else:
                shuffled_row = noised_row

            # Round values to 2 decimal places
            rounded_row = np.round(shuffled_row, 2)
            extended_array.append(rounded_row.tolist())

    return extended_array

# Paths to JSON files
input_filename = "../frames-base.json"
output_filename = "../frames.json"

# Load the JSON file
with open(input_filename, "r") as file:
    input_data = json.load(file)

# Ensure the input is a 2D array
if not (isinstance(input_data, list) and all(isinstance(row, list) for row in input_data)):
    raise ValueError("Input JSON must contain a 2D array.")

# Extend the sequence
repeats = 10  # Number of times to repeat the sequence
variation_strength = 0.01  # Extremely subtle variation
scaling_range = (0.98, 1.02)  # Barely noticeable scaling range
shuffle_prob = 0.1  # Very low probability of shuffling rows
extended_sequence = extend_with_subtle_variations(input_data, repeats, variation_strength, scaling_range, shuffle_prob)

# Save the extended sequence to a new JSON file
with open(output_filename, "w") as file:
    json.dump(extended_sequence, file, indent=4)

print(f"Extended sequence saved to {output_filename}.")
