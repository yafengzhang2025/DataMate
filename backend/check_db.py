import sqlite3

con = sqlite3.connect("datamate.db")
tables = con.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()
print("现有表:", [t[0] for t in tables])

for t in ["t_operator", "t_operator_category"]:
    try:
        n = con.execute(f"SELECT COUNT(*) FROM {t}").fetchone()[0]
        print(f"{t}: {n} 行")
        if n > 0:
            row = con.execute(f"SELECT id, name FROM {t} LIMIT 1").fetchone()
            print("  示例:", row)
    except Exception as e:
        print(f"{t}: 错误 - {e}")

con.close()
