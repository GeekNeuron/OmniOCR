def export_srt(self):
        path, _ = QFileDialog.getSaveFileName(self, "Save SRT", "", "SubRip Subtitle (*.srt)")
        if path:
            lines = self.output_text.toPlainText().splitlines()
            with open(path, 'w', encoding='utf-8') as f:
                for i, line in enumerate(lines):
                    f.write(f"{i+1}\n00:00:{i:02},000 --> 00:00:{i+2:02},000\n{line}\n\n")

    def export_epub(self):
        path, _ = QFileDialog.getSaveFileName(self, "Save EPUB", "", "EPUB Files (*.epub)")
        if path:
            title = self.epub_title_input.toPlainText()
            author = self.epub_author_input.toPlainText()
            save_as_epub(self.output_text.toPlainText(), path, title, author)

    def export_mobi(self):
        path, _ = QFileDialog.getSaveFileName(self, "Save MOBI", "", "MOBI Files (*.mobi)")
        if path:
            title = self.epub_title_input.toPlainText()
            author = self.epub_author_input.toPlainText()
            save_as_mobi_or_azw3(self.output_text.toPlainText(), path, title, author, fmt="mobi")

    def export_azw3(self):
        path, _ = QFileDialog.getSaveFileName(self, "Save AZW3", "", "AZW3 Files (*.azw3)")
        if path:
            title = self.epub_title_input.toPlainText()
            author = self.epub_author_input.toPlainText()
            save_as_mobi_or_azw3(self.output_text.toPlainText(), path, title, author, fmt="azw3")


if name == "main":
    app = QApplication(sys.argv)
    window = OCRApp()
    window.show()
    sys.exit(app.exec())
