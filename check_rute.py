
import re

sql_file = r'c:\xampp\htdocs\PDAM_app\sicater_db.sql'

def extract_rute_master():
    rutes = set()
    with open(sql_file, 'r', encoding='utf-8') as f:
        in_rute_dump = False
        for line in f:
            if 'INSERT INTO `rute`' in line:
                in_rute_dump = True
                # Extract values from the same line if any
            
            if in_rute_dump:
                # Basic match for ('ID', 'KODE', 'NAME')
                matches = re.findall(r"\(\d+,\s*'([^']+)',", line)
                for m in matches:
                    rutes.add(m)
                
                if ';' in line:
                    if not re.search(r",\s*\(", line): # Check if there's more after the semicolon on the same line (rare)
                        in_rute_dump = False
    return rutes

def extract_pelanggan_rute():
    pelanggan_rutes = {}
    with open(sql_file, 'r', encoding='utf-8') as f:
        in_pelanggan_dump = False
        for line in f:
            if 'INSERT INTO `data_pelanggan`' in line:
                in_pelanggan_dump = True
            
            if in_pelanggan_dump:
                # The format for data_pelanggan is:
                # (id, id_sambungan, id_meter, id_tag, nama, alamat, telepon, kode_tarif, kode_rute, ...)
                # It's the 9th column (index 8)
                matches = re.finditer(r"\((?P<vals>[^)]+)\)", line)
                for match in matches:
                    vals_str = match.group('vals')
                    # Split by comma but respect quotes
                    parts = []
                    current = []
                    in_quote = False
                    for char in vals_str:
                        if char == "'" :
                            in_quote = not in_quote
                            current.append(char)
                        elif char == ',' and not in_quote:
                            parts.append("".join(current).strip())
                            current = []
                        else:
                            current.append(char)
                    parts.append("".join(current).strip())
                    
                    if len(parts) >= 9:
                        pel_id = parts[0]
                        k_rute = parts[8].strip("'")
                        pelanggan_rutes[pel_id] = k_rute
                
                if ';' in line:
                    in_pelanggan_dump = False
    return pelanggan_rutes

def main():
    print("Extracting master rute...")
    master_rutes = extract_rute_master()
    print(f"Found {len(master_rutes)} master rute entries.")
    
    print("Extracting pelanggan rute...")
    pelanggan_rutes = extract_pelanggan_rute()
    print(f"Found {len(pelanggan_rutes)} pelanggan entries.")
    
    missing = []
    for pel_id, k_rute in pelanggan_rutes.items():
        if pel_id.isdigit() and k_rute and k_rute not in master_rutes:
            missing.append((pel_id, k_rute))
    
    if not missing:
        print("All rutes in data_pelanggan are present in rute table.")
    else:
        print(f"Found {len(missing)} inconsistencies:")
        # Show first 20
        for pel_id, k_rute in missing[:20]:
            print(f"Pelanggan ID {pel_id} has kode_rute {k_rute} which is not in rute table.")
        if len(missing) > 20:
            print(f"... and {len(missing) - 20} more.")

    # Also check lengths
    long_rutes = [r for r in master_rutes if len(r) > 8]
    if long_rutes:
        print(f"Warning: {len(long_rutes)} rutes in master table exceed 8 characters.")
        for r in long_rutes[:5]:
            print(f"  - {r}")

    long_pel_rutes = [ (pid, r) for pid, r in pelanggan_rutes.items() if len(r) > 8 and pid.isdigit()]
    if long_pel_rutes:
        print(f"Warning: {len(long_pel_rutes)} rutes in pelanggan table exceed 8 characters.")
        for pid, r in long_pel_rutes[:5]:
            print(f"  - Pel ID {pid}: {r}")
    
    short_pel_rutes = [ (pid, r) for pid, r in pelanggan_rutes.items() if len(r) <= 8 and pid.isdigit()]
    if short_pel_rutes:
        print(f"Info: {len(short_pel_rutes)} rutes in pelanggan table are 8 characters or less.")
        for pid, r in short_pel_rutes:
            print(f"  - Pel ID {pid}: {r}")

if __name__ == "__main__":
    main()
