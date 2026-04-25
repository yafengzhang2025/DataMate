import sqlite3

con = sqlite3.connect("datamate.db", isolation_level=None)  # autocommit

# Check actual schema
schema = con.execute(
    "SELECT sql FROM sqlite_master WHERE type='table' AND name='t_operator_category'"
).fetchone()
print("Schema:", schema)

# Check exact row count
n = con.execute("SELECT COUNT(*) FROM t_operator_category").fetchone()
print("Count result:", n)

# Try insert with error capture
try:
    con.execute(
        "INSERT INTO t_operator_category(id, name, name_en, value, type, parent_id) "
        "VALUES ('xx1', 'TestName', 'Test', 'testval', 'predefined', '0')"
    )
    print("Insert OK")
except Exception as e:
    print("Insert ERROR:", e)

n2 = con.execute("SELECT COUNT(*) FROM t_operator_category").fetchone()
print("Count after insert:", n2)
con.close()
