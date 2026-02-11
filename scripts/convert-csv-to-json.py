
import csv
import json
import re
import os

# Configuration
CSV_FILE = 'prisma/seed-data/Deq04_sorted_university_th.csv'
JSON_OUTPUT = 'prisma/seed-data/university-curriculum.json'
UNIVERSITIES_TS = 'prisma/seed-data/universities.ts'

# Helper to load university codes
def load_university_codes():
    uni_map = {}
    with open(UNIVERSITIES_TS, 'r', encoding='utf-8') as f:
        content = f.read()
        matches = re.findall(r'code:\s*\"([^\"]+)\",\s*th:\s*\"([^\"]+)\"', content)
        for code, th in matches:
            uni_map[th] = code
    return uni_map

# ISCED Broad Field mapping
BROAD_FIELD_MAP = {
    'Education': '01',
    'Arts and humanities': '02',
    'Social sciences, journalism and information': '03',
    'Business, administration and law': '04',
    'Natural sciences, mathematics and statistics': '05',
    'Natural sciences,mathematics and statistics': '05', # Handle typo in CSV if present
    'Information and Communication Technologies (ICTs)': '06',
    'Engineering, manufacturing and construction': '07',
    'Engineering,manufacturing and construction': '07', # Handle typo
    'Agriculture, forestry, fisheries and veterinary': '08',
    'Agriculture, forestry,fisheries and veterinary': '08', # Handle typo
    'Health and welfare': '09',
    'Services': '10',
    'Generic programmes and qualifications': '00',
}

def clean_string(s):
    if not s: return ""
    return s.strip()

def main():
    print(f"Reading university codes from {UNIVERSITIES_TS}...")
    uni_code_map = load_university_codes()
    print(f"Found {len(uni_code_map)} universities in TS file.")

    curriculum_data = {}

    print(f"Parsing CSV {CSV_FILE}...")
    try:
        with open(CSV_FILE, 'r', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f)
            row_count = 0
            
            for row in reader:
                # Try mapping from Master Name first
                master_name = clean_string(row.get('UNIV_MASTER_NAME'))
                standard_name = clean_string(row.get('UNIV_STANDARD_NAME'))
                
                # Try master name match
                uni_code = uni_code_map.get(master_name)
                
                if not uni_code:
                    # If not found, try standard name match
                    uni_code = uni_code_map.get(standard_name)
                
                if not uni_code:
                    # Skip universities not in our system
                    continue

                broad_name = clean_string(row.get('ISCED_BROAD_FIELD_NAME'))
                # Use Detailed Field for finer granularity (Requested by User)
                narrow_name = clean_string(row.get('ISCED_DETAILED_FIELD_NAME'))

                if not broad_name:
                    continue

                if uni_code not in curriculum_data:
                    curriculum_data[uni_code] = {}

                # Map Broad Field Name to Code
                # Try exact match first
                broad_code = BROAD_FIELD_MAP.get(broad_name)
                
                # If not found, try fuzzy match
                if not broad_code:
                    for key, val in BROAD_FIELD_MAP.items():
                        if key.lower() in broad_name.lower() or broad_name.lower() in key.lower():
                            broad_code = val
                            break
                            
                if not broad_code:
                    # print(f"Warning: Could not map broad field '{broad_name}'")
                    continue
                
                if broad_code not in curriculum_data[uni_code]:
                    curriculum_data[uni_code][broad_code] = set()

                if narrow_name:
                    curriculum_data[uni_code][broad_code].add(narrow_name)
                
                row_count += 1
            
            print(f"Processed {row_count} rows.")

    except Exception as e:
        print(f"Error reading CSV: {e}")
        return

    # Convert sets to lists for JSON serialization
    final_output = {}
    for uni_code, broads in curriculum_data.items():
        final_output[uni_code] = {}
        for broad_code, narrows in broads.items():
            final_output[uni_code][broad_code] = sorted(list(narrows))

    print(f"Writing output to {JSON_OUTPUT}...")
    with open(JSON_OUTPUT, 'w', encoding='utf-8') as f:
        json.dump(final_output, f, ensure_ascii=False, indent=2)
    
    print(f"Done! Mapped data for {len(final_output)} universities.")

if __name__ == "__main__":
    main()
