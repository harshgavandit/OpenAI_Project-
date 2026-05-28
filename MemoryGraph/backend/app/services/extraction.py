import os
from pathlib import Path

from dotenv import load_dotenv

# Optional dependencies - provide graceful fallbacks for test/runtime environments
try:
    import PyPDF2
except Exception:
    PyPDF2 = None

try:
    from openai import OpenAI
except Exception:
    OpenAI = None

try:
    from PIL import Image
    from PIL.ExifTags import TAGS
except Exception:
    Image = None
    TAGS = {}

try:
    import pytesseract
except Exception:
    pytesseract = None

load_dotenv()

class ExtractionService:
    def __init__(self):
        api_key = os.getenv("OPENAI_API_KEY")
        self.client = OpenAI(api_key=api_key) if (api_key and OpenAI) else None
        self.transcription_model = os.getenv("OPENAI_TRANSCRIPTION_MODEL", "whisper-1")

    def extract_text(self, file_path: str) -> str:
        ext = os.path.splitext(file_path)[1].lower()
        
        if ext in {".txt", ".md", ".csv"}:
            with open(file_path, "r", encoding="utf-8") as f:
                return f.read()
        
        elif ext == ".pdf":
            if not PyPDF2:
                return ""
            text = ""
            try:
                with open(file_path, "rb") as f:
                    pdf = PyPDF2.PdfReader(f)
                    for page in pdf.pages:
                        text += (getattr(page, 'extract_text', lambda: '')() or "") + "\n"
            except Exception:
                return ""
            return text

        elif ext in {".png", ".jpg", ".jpeg", ".webp", ".bmp", ".tiff"}:
            return self.extract_image_text(file_path)

        elif ext in {".mp3", ".mp4", ".mpeg", ".mpga", ".m4a", ".wav", ".webm"}:
            return self.extract_audio_text(file_path)
            
        return ""

    def extract_image_text(self, file_path: str) -> str:
        try:
            return pytesseract.image_to_string(Image.open(file_path)).strip()
        except Exception:
            return ""

    def extract_audio_text(self, file_path: str) -> str:
        if not self.client:
            return ""

        try:
            with open(file_path, "rb") as audio_file:
                transcription = self.client.audio.transcriptions.create(
                    model=self.transcription_model,
                    file=audio_file,
                )
            return getattr(transcription, "text", "") or ""
        except Exception:
            return ""

    def extract_image_metadata(self, file_path: str) -> dict:
        ext = Path(file_path).suffix.lower()
        if ext not in {".png", ".jpg", ".jpeg", ".webp", ".bmp", ".tiff"}:
            return {}

        try:
            image = Image.open(file_path)
            metadata = {
                "width": image.width,
                "height": image.height,
                "format": image.format,
            }
            exif = image.getexif()
            if exif:
                readable_exif = {}
                for key, value in exif.items():
                    tag = TAGS.get(key, str(key))
                    if isinstance(value, bytes):
                        continue
                    readable_exif[tag] = str(value)
                metadata["exif"] = readable_exif
            return metadata
        except Exception:
            return {}
