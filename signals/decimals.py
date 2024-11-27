import json

def reduce_decimals_in_json(input_file, decimals=2):
    """
    Reads a JSON file, reduces the number of decimals in its numeric values, 
    and overwrites the original file.
    
    Args:
        input_file (str): Path to the JSON file to process.
        decimals (int): Number of decimal places to round to (default is 2).
    """
    try:
        # Load the JSON data
        with open(input_file, 'r') as file:
            data = json.load(file)
        
        # Process the data: round all numeric values
        rounded_data = [
            [round(value, decimals) for value in row] for row in data
        ]
        
        # Overwrite the original file with rounded data
        with open(input_file, 'w') as file:
            json.dump(rounded_data, file, indent=4)
        
        print(f"Successfully reduced decimals to {decimals} in {input_file}.")
    
    except FileNotFoundError:
        print(f"Error: File not found: {input_file}")
    except json.JSONDecodeError:
        print(f"Error: Failed to parse JSON in {input_file}")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")

# Example Usage
# Replace 'your_file.json' with the path to your JSON file
input_file = "../partner.json"
reduce_decimals_in_json(input_file, decimals=2)
