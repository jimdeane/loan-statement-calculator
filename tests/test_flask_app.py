import tempfile
import unittest
from pathlib import Path

import app as application
from loan_math import FALLBACK_RATES


class FlaskAppTests(unittest.TestCase):
    def setUp(self):
        self.temp_directory = tempfile.TemporaryDirectory()
        application.SETTINGS_FILE = Path(self.temp_directory.name) / "settings.json"
        application.settings = None
        application.app.config.update(TESTING=True, SECRET_KEY="test-secret")
        self.client = application.app.test_client()

    def tearDown(self):
        self.temp_directory.cleanup()

    def create_login(self):
        return self.client.post(
            "/setup",
            data={"display_name": "Jim", "username": "friend", "password": "correct horse battery"},
            follow_redirects=True,
        )

    def statement_payload(self):
        return {
            "principal": 100000,
            "discount": -1.5,
            "start": "2023-12-19",
            "end": "2024-01-18",
            "timing": "arrears",
            "rates": FALLBACK_RATES,
            "payments": [],
        }

    def test_first_visit_creates_login_and_opens_calculator(self):
        self.assertEqual(self.client.get("/").headers["Location"], "/setup")
        response = self.create_login()
        self.assertEqual(response.status_code, 200)
        self.assertIn(b"Loan Statement Calculator", response.data)
        self.assertTrue(application.SETTINGS_FILE.exists())

    def test_calculation_and_excel_export_require_login(self):
        self.assertEqual(self.client.post("/api/calculate", json=self.statement_payload()).status_code, 302)
        self.create_login()
        calculated = self.client.post("/api/calculate", json=self.statement_payload())
        self.assertEqual(calculated.status_code, 200)
        self.assertEqual(len(calculated.get_json()["rows"]), 1)
        exported = self.client.post("/export", json=self.statement_payload())
        self.assertEqual(exported.status_code, 200)
        self.assertEqual(exported.mimetype, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
        self.assertTrue(exported.data.startswith(b"PK"))


if __name__ == "__main__":
    unittest.main()
