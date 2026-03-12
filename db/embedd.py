import psycopg2
from sentence_transformers import SentenceTransformer
import torch

# 1. Force CPU usage
device = "cpu"
model = SentenceTransformer('all-MiniLM-L6-v2', device=device)

# 2. Database Connection
conn = psycopg2.connect(
    host="localhost",
    database="library_db",
    user="admin",
    password="securepassword"
)
cur = conn.cursor()

# 3. Fetch books that need embeddings
# Note: We fetch book_id and title
cur.execute("SELECT book_id, title FROM books WHERE embedding IS NULL")
books = cur.fetchall()

print(f"Found {len(books)} books to process on CPU...")

for book_id, title in books:
    # 4. Generate Embedding (Using just title as requested)
    embedding = model.encode(title).tolist()
    
    # 5. Update Database
    cur.execute(
        "UPDATE books SET embedding = %s WHERE book_id = %s",
        (embedding, book_id)
    )
    conn.commit()
    print(f"Processed: {title}")

cur.close()
conn.close()
print("Success!")