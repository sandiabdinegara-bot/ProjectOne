
import os

def generate_sql():
    # RW Generation
    # 155 Desa, 10 RW per Desa
    rw_lines = []
    rw_count = 0
    num_desa = 155
    rw_per_desa = 10
    
    for d_id in range(1, num_desa + 1):
        kec_id = (d_id - 1) // 5 + 1
        for r in range(1, rw_per_desa + 1):
            rw_count += 1
            kode_rw = f"{r:02d}"
            rw_val = f"{r:02d}"
            rw_lines.append(f"({rw_count}, {d_id}, {kec_id}, '{kode_rw}', '{rw_val}')")
            
    rw_sql = "INSERT INTO `zone_rw` (`id`, `id_desa`, `id_kecamatan`, `kode_rw`, `rw`) VALUES\n" + ",\n".join(rw_lines) + ";"
    
    # RT Generation
    # 1550 RW, 10 RT per RW
    rt_lines = []
    rt_count = 0
    rt_per_rw = 10
    
    # Split RT into multiple inserts to avoid extremely long strings
    rt_sqls = []
    chunk_size = 1000
    
    for rw_id in range(1, rw_count + 1):
        d_id = (rw_id - 1) // 10 + 1
        kec_id = (d_id - 1) // 5 + 1
        for rt in range(1, rt_per_rw + 1):
            rt_count += 1
            kode_rt = f"{rt:02d}"
            rt_val = f"{rt:02d}"
            rt_lines.append(f"({rt_count}, {rw_id}, {d_id}, {kec_id}, '{kode_rt}', '{rt_val}')")
            
            if len(rt_lines) >= chunk_size:
                rt_sqls.append("INSERT INTO `zone_rt` (`id`, `id_rw`, `id_desa`, `id_kecamatan`, `kode_rt`, `rt`) VALUES\n" + ",\n".join(rt_lines) + ";")
                rt_lines = []
                
    if rt_lines:
        rt_sqls.append("INSERT INTO `zone_rt` (`id`, `id_rw`, `id_desa`, `id_kecamatan`, `kode_rt`, `rt`) VALUES\n" + ",\n".join(rt_lines) + ";")
        
    rt_sql_final = "\n\n".join(rt_sqls)
    
    with open("rw_data.sql", "w") as f:
        f.write(rw_sql)
    with open("rt_data.sql", "w") as f:
        f.write(rt_sql_final)

if __name__ == "__main__":
    generate_sql()
