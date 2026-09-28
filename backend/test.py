import psycopg2
pwds = ['12345', 'postgres', 'root', 'admin', 'password', '1234', '123', 'admin123', 'unlimited', '123@123@']
for p in pwds:
    try:
        conn = psycopg2.connect(dbname='postgres', user='postgres', password=p, host='localhost')
        print(f"Success with: {p}")
        conn.close()
        break
    except:
        pass
