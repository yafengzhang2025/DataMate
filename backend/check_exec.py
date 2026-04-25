import sqlite3

con = sqlite3.connect("datamate.db")

rows = con.execute("SELECT id, workflow_id, status, started_at, finished_at FROM t_workflow_execution").fetchall()
print(f"执行记录总数: {len(rows)}")
for r in rows:
    print(r)

wfs = con.execute("SELECT id, name FROM t_workflow").fetchall()
print(f"\n工作流总数: {len(wfs)}")
for w in wfs:
    print(w)

# Also test the API endpoint
import urllib.request, json
try:
    for wf_id, wf_name in wfs:
        url = f"http://localhost:8000/api/v1/workflows/{wf_id}/executions"
        req = urllib.request.urlopen(url, timeout=3)
        data = json.loads(req.read())
        print(f"\n{wf_name}: API返回 {data['data']['total']} 条执行记录")
except Exception as e:
    print(f"\nAPI调用失败: {e}")

con.close()
