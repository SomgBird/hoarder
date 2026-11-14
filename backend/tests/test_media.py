from io import BytesIO
from pathlib import Path
from tempfile import TemporaryDirectory
import unittest
from unittest.mock import patch

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.testclient import TestClient
from PIL import Image

from app.routers import media


class MediaApiTests(unittest.TestCase):
    def setUp(self):
        self.directory = TemporaryDirectory()
        self.root = Path(self.directory.name) / "media"
        self.root.mkdir()
        self.media_patch = patch("app.routers.media.MEDIA_DIR", self.root)
        self.media_patch.start()
        app = FastAPI()
        app.include_router(media.router)
        app.mount("/media", StaticFiles(directory=self.root))
        self.client = TestClient(app)

    def tearDown(self):
        self.client.close()
        self.media_patch.stop()
        self.directory.cleanup()

    def image(self, relative, *, ico=False):
        destination = self.root / relative
        destination.parent.mkdir(parents=True, exist_ok=True)
        image = Image.new("RGBA", (64, 64), "red")
        if ico:
            image.save(destination, format="ICO", sizes=[(16, 16), (32, 32), (64, 64)])
        else:
            image.save(destination, format="PNG")
        return destination.read_bytes()

    def test_empty_media_folder(self):
        response = self.client.get("/media/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), [])

    def test_lists_images_in_all_subfolders_and_serves_the_original_files(self):
        contents = {
            "root.png": self.image("root.png"),
            "covers/Обложка #1?.PNG": self.image("covers/Обложка #1?.PNG"),
            "icons/nested/icon.ico": self.image("icons/nested/icon.ico", ico=True),
        }
        response = self.client.get("/media/")
        self.assertEqual(response.status_code, 200, response.text)
        files = response.json()
        self.assertEqual([file["relative_path"] for file in files], sorted(contents, key=str.casefold))
        for file in files:
            self.assertEqual(file["name"], Path(file["relative_path"]).name)
            self.assertEqual(file["size_bytes"], len(contents[file["relative_path"]]))
            original = self.client.get(file["path"])
            self.assertEqual(original.status_code, 200)
            self.assertEqual(original.content, contents[file["relative_path"]])
            if file["path"].endswith(".ico"):
                with Image.open(BytesIO(original.content)) as image:
                    self.assertEqual(image.ico.sizes(), {(16, 16), (32, 32), (64, 64)})
        self.assertIn("%23", files[0]["path"])
        self.assertIn("%3F", files[0]["path"])

    def test_ignores_non_images_hidden_files_and_symlinks(self):
        self.image("visible.png")
        self.image(".hidden.png")
        self.image(".hidden/private.png")
        (self.root / "notes.txt").write_text("notes")
        (self.root / "upload.tmp").write_bytes(b"unfinished upload")
        (self.root / "directory.png").mkdir()
        outside = Path(self.directory.name) / "outside.png"
        outside.write_bytes(b"outside")
        (self.root / "outside-link.png").symlink_to(outside)
        (self.root / "inside-link.png").symlink_to(self.root / "visible.png")
        self.assertEqual([file["relative_path"] for file in self.client.get("/media/").json()], ["visible.png"])


if __name__ == "__main__":
    unittest.main()
