import numpy as np
from scipy.interpolate import interp1d
import matplotlib.pyplot as plt

def extrapolate_array(original_data, target_length=180):
    original_data = np.array(original_data)
    repetitions = int(np.ceil(target_length / len(original_data)))
    basic_extension = np.tile(original_data, repetitions)[:target_length]
    x_original = np.linspace(0, 1, len(original_data))
    x_target = np.linspace(0, 1, target_length)
    interpolator = interp1d(x_original, original_data, kind='cubic')
    smooth_pattern = interpolator(x_target)
    noise = np.random.normal(0, 0.05, target_length)
    result = 0.7 * smooth_pattern + 0.3 * basic_extension + 0.1 * noise
    result = np.clip(result, 0.0, 1.0)
    return result

# Your original data
original_data = [
        0.41,
        0.77,
        0.85,
        0.85,
        0.08,
        0.0,
        0.0,
        0.04,
        0.05,
        0.02,
        0.33,
        0.22,
        0.01,
        0.02,
        0.68,
        0.92,
        0.75,
        0.22
]

# Get extrapolated values
extrapolated = np.round(extrapolate_array(original_data), 3)

# Create the visualization
plt.figure(figsize=(15, 5))
plt.plot(extrapolated, label='Extrapolated', color='blue')
plt.plot(np.linspace(0, len(extrapolated), len(original_data)), original_data, 'r.', label='Original points')
plt.legend()
plt.title('Extrapolation Results')
plt.grid(True)
plt.show()

# Print the array in a copyable format
print("\nCopyable array format:")
print("[")
for i in range(0, len(extrapolated), 10):
    row = extrapolated[i:i+10]
    print("    " + ", ".join(f"{x:.3f}" for x in row) + ("," if i + 10 < len(extrapolated) else ""))
print("]")

# Also save to a file
np.savetxt('extrapolated_values.txt', extrapolated, fmt='%.3f')
print("\nValues have also been saved to 'extrapolated_values.txt'")