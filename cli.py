import typer
from pathlib import Path
from PIL import Image
from core.ocr_engine import OCREngine

typer_app = typer.Typer()

@typer_app.command()
def ocr(
    input: Path = typer.Argument(..., help="Input image file"),
    engine: str = typer.Option("tesseract", help="OCR engine to use (tesseract/easyocr)"),
    lang: str = typer.Option("auto", help="Language hint (e.g., fa, en, auto)"),
    output: Path = typer.Option(None, help="Optional path to save output text")
):
    """Run OCR on an image and print or save the result."""
    if not input.exists():
        typer.echo(f"File not found: {input}")
        raise typer.Exit(code=1)

    engine_inst = OCREngine(engine_type=engine, lang=lang)
    image = Image.open(input)
    result = engine_inst.recognize(image)

    if output:
        output.write_text(result, encoding="utf-8")
        typer.echo(f"OCR result saved to {output}")
    else:
        typer.echo("--- OCR Result ---")
        typer.echo(result)

if __name__ == "__main__":
    typer_app()
