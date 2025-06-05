import pyodbc
from tabulate import tabulate

server = 'brg.database.windows.net'
database = 'Helen5'
username = 'helenai'
password = '2321EB86-96E8-4040-A6DA-B87F354E5E83'
driver = '{ODBC Driver 17 for SQL Server}'

try:
    conn = pyodbc.connect(
        f'DRIVER={driver};SERVER={server};DATABASE={database};UID={username};PWD={password}')
    cursor = conn.cursor()
    print("Connection successful!\n")

    # Fetch all rows from the table
    cursor.execute("SELECT * FROM helenai.Question")
    rows = cursor.fetchall()

    # Fetch column names
    columns = [column[0] for column in cursor.description]

    if not rows:
        print("Table 'helenai.Question' is empty.")
    else:
        print("Contents of 'helenai.Question':\n")
        print(tabulate(rows, headers=columns, tablefmt="grid"))

    conn.close()

except Exception as e:
    print("Connection failed:", e)
