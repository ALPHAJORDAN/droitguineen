import os
import time
import pytesseract
from pdf2image import convert_from_path
import psycopg2
import meilisearch
from dotenv import load_dotenv

load_dotenv()

def process_pdfs():
    print("OCR Service Started. Watching for PDFs...")
    pdf_dir = "/pdf"
    text_dir = "/text"

    while True:
        # Placeholder for watching directory and processing
        time.sleep(10)

if __name__ == "__main__":
    process_pdfs()
