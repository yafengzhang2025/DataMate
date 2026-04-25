import sqlite3
import pathlib

con = sqlite3.connect("datamate.db")
con.row_factory = sqlite3.Row

# Test a single insert
try:
    con.execute("""
        INSERT OR IGNORE INTO t_operator_category(id, name, name_en, value, type, parent_id)
        VALUES ('test-id', '测试', 'Test', 'test', 'predefined', '0')
    """)
    con.commit()
    n = con.execute("SELECT COUNT(*) FROM t_operator_category").fetchone()[0]
    print(f"分类测试插入后: {n} 行")
    con.execute("DELETE FROM t_operator_category WHERE id='test-id'")
    con.commit()
except Exception as e:
    print(f"错误: {e}")

# Now run the full SQL file, splitting on semicolons to skip the trigger/pragma issues
sql_path = pathlib.Path("../script/sqlite-init.sql")
sql_text = sql_path.read_text(encoding="utf-8")

# Execute via executescript (handles multi-statement)
try:
    con.executescript(sql_text)
    con.commit()
    print("executescript 完成")
except Exception as e:
    print(f"executescript 错误: {e}")

n_op = con.execute("SELECT COUNT(*) FROM t_operator").fetchone()[0]
n_cat = con.execute("SELECT COUNT(*) FROM t_operator_category").fetchone()[0]
print(f"算子: {n_op}, 分类: {n_cat}")
con.close()
