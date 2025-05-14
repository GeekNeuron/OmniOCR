from PySide6.QtWidgets import QApplication, QMainWindow, QPushButton, QLabel, QVBoxLayout, QWidget, QFileDialog, QTextEdit
from PySide6.QtCore import QFile, QTextStream
from core.ocr_engine import OCREngine
from PIL import Image
import sys

class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("OmniOCR Desktop")

        self.button = QPushButton("Select Image")
        self.text_output = QTextEdit()
        self.label = QLabel("Result:")

        layout = QVBoxLayout()
        layout.addWidget(self.button)
        layout.addWidget(self.label)
        layout.addWidget(self.text_output)

        container = QWidget()
        container.setLayout(layout)
        self.setCentralWidget(container)

        self.button.clicked.connect(self.select_image)
        self.ocr_engine = OCREngine()

        self.load_style("desktop/styles/material.qss")

    def load_style(self, path):
        file = QFile(path)
        if file.open(QFile.ReadOnly | QFile.Text):
            stream = QTextStream(file)
            self.setStyleSheet(stream.readAll())

    def select_image(self):
        path, _ = QFileDialog.getOpenFileName(self, "Open Image", "", "Images (*.png *.jpg *.jpeg *.bmp)")
        if path:
            image = Image.open(path)
            text = self.ocr_engine.recognize(image)
            self.text_output.setText(text)

if __name__ == '__main__':
    app = QApplication(sys.argv)
    win = MainWindow()
    win.show()
    sys.exit(app.exec())
