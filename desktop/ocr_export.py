from docx import Document
from fpdf import FPDF
from ebooklib import epub
import subprocess
import os


def save_as_docx(text: str, output_path: str):
    doc = Document()
    for line in text.splitlines():
        doc.add_paragraph(line)
    doc.save(output_path)


def save_as_pdf(text: str, output_path: str):
    pdf = FPDF()
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.set_font("Arial", size=12)
    for line in text.splitlines():
        pdf.multi_cell(0, 10, txt=line)
    pdf.output(output_path)


def save_as_epub(text: str, output_path: str, title: str = "OCR Output", author: str = "OmniOCR"):
    book = epub.EpubBook()
    book.set_title(title)
    book.add_author(author)

    chapter = epub.EpubHtml(title='OCR Text', file_name='chapter1.xhtml', lang='en')
    chapter.content = '<h1>OCR Output</h1><p>' + text.replace('\n', '<br/>') + '</p>'
    book.add_item(chapter)
    book.toc = (epub.Link('chapter1.xhtml', 'OCR Output', 'intro'),)
    book.add_item(epub.EpubNcx())
    book.add_item(epub.EpubNav())
    book.spine = ['nav', chapter]

    epub.write_epub(output_path, book)


def save_as_mobi_or_azw3(text: str, base_output_path: str, title="OCR Output", author="OmniOCR", fmt="mobi"):
    tmp_epub = base_output_path + ".epub"
    save_as_epub(text, tmp_epub, title, author)

    output_file = base_output_path + f".{fmt}"
    try:
        subprocess.run(["ebook-convert", tmp_epub, output_file], check=True)
    finally:
        if os.path.exists(tmp_epub):
            os.remove(tmp_epub)
    return output_file
