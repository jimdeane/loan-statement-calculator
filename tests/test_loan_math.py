import unittest

from loan_math import FALLBACK_RATES, calculate_statement


class LoanMathTests(unittest.TestCase):
    def test_interest_only_default_preserves_principal(self):
        rows = calculate_statement(100000, -1.5, "2023-12-19", "2024-01-18", "arrears", FALLBACK_RATES, [])
        self.assertEqual(len(rows), 1)
        self.assertAlmostEqual(rows[0]["Closing principal"], 100000)
        self.assertAlmostEqual(rows[0]["Unpaid interest"], 0)
        self.assertAlmostEqual(rows[0]["Payment"], rows[0]["Interest charged"])

    def test_payment_clears_interest_then_principal(self):
        rows = calculate_statement(
            100000,
            -1.5,
            "2023-12-19",
            "2024-01-18",
            "arrears",
            FALLBACK_RATES,
            [{"date": "2024-01-01", "amount": 1000}],
        )
        row = rows[0]
        self.assertGreater(row["Principal paid"], 0)
        self.assertAlmostEqual(row["Closing balance"], 100000 + row["Interest charged"] - 1000)

    def test_negative_bank_debit_is_rejected(self):
        with self.assertRaisesRegex(ValueError, "invert signed bank-account debits"):
            calculate_statement(
                100000,
                -1.5,
                "2023-12-19",
                "2024-01-18",
                "arrears",
                FALLBACK_RATES,
                [{"date": "2024-01-01", "amount": -1000}],
            )

    def test_payment_reversal_is_netted_with_repayments(self):
        rows = calculate_statement(
            100000,
            -1.5,
            "2023-12-19",
            "2024-01-18",
            "arrears",
            FALLBACK_RATES,
            [
                {"date": "2024-01-01", "amount": 1000},
                {"date": "2024-01-02", "amount": -250},
            ],
        )
        self.assertEqual(rows[0]["Payment"], 750)

    def test_month_end_anniversary(self):
        rows = calculate_statement(1000, 0, "2024-01-31", "2024-03-30", "advance", FALLBACK_RATES, [])
        self.assertEqual([(row["From"], row["To"]) for row in rows], [
            ("2024-01-31", "2024-02-28"),
            ("2024-02-29", "2024-03-30"),
        ])


if __name__ == "__main__":
    unittest.main()
