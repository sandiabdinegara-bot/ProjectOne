
import re

sql_file = r'c:\xampp\htdocs\PDAM_app\sicater_db.sql'

def count_customers_by_branch(branch_code):
    count = 0
    with open(sql_file, 'r', encoding='utf-8') as f:
        in_pelanggan_dump = False
        for line in f:
            if 'INSERT INTO `data_pelanggan`(' in line or 'INSERT INTO `data_pelanggan` (' in line:
                in_pelanggan_dump = True
                continue
            
            if in_pelanggan_dump:
                # The format for data_pelanggan is:
                # (id, id_sambungan, id_meter, id_tag, nama, alamat, telepon, kode_tarif, kode_rute, kode_cabang, ...)
                # kode_cabang is the 10th column (index 9)
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
                    
                    if len(parts) >= 10:
                        k_cabang = parts[9].strip("'")
                        if k_cabang == branch_code:
                            count += 1
                
                if ';' in line:
                    if not re.search(r",\s*\(", line):
                        in_pelanggan_dump = False
    return count

if __name__ == "__main__":
    branch_10_count = count_customers_by_branch('10')
    print(f"Jumlah pelanggan dengan kode cabang 10: {branch_10_count}")
