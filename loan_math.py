from __future__ import annotations

from calendar import monthrange
from datetime import date, timedelta
from typing import Any


SOURCE_URL = "https://www.bankofengland.co.uk/boeapps/database/Bank-Rate.asp"
FALLBACK_RATES = [
    {"date": "2023-08-03", "rate": 5.25},
    {"date": "2024-08-01", "rate": 5.00},
    {"date": "2024-11-07", "rate": 4.75},
    {"date": "2025-02-06", "rate": 4.50},
    {"date": "2025-05-08", "rate": 4.25},
    {"date": "2025-08-07", "rate": 4.00},
    {"date": "2025-12-18", "rate": 3.75},
]


def parse_date(value: str) -> date:
    return date.fromisoformat(value)


def anniversary_month(start: date, offset: int) -> date:
    month_index = start.month - 1 + offset
    year = start.year + month_index // 12
    month = month_index % 12 + 1
    return date(year, month, min(start.day, monthrange(year, month)[1]))


def calculate_statement(
    principal: float,
    discount: float,
    start: str,
    end: str,
    timing: str,
    rates: list[dict[str, Any]],
    payments: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    start_date, end_date = parse_date(start), parse_date(end)
    if principal < 0:
        raise ValueError("Principal cannot be negative.")
    if end_date < start_date:
        raise ValueError("End date must be on or after the start date.")
    if timing not in {"advance", "arrears"}:
        raise ValueError("Interest timing must be advance or arrears.")

    normal_rates = sorted(
        ({"date": parse_date(str(item["date"])), "rate": float(item["rate"])} for item in rates),
        key=lambda item: item["date"],
    )
    normal_payments = [
        {"date": parse_date(str(item["date"])), "amount": float(item["amount"])} for item in payments
    ]
    has_csv = bool(normal_payments)
    rows: list[dict[str, Any]] = []
    remaining_principal = float(principal)
    unpaid_interest = 0.0
    previous_payment: float | None = None
    offset = 0

    while True:
        period_start = anniversary_month(start_date, offset)
        if period_start > end_date:
            break
        period_end = min(anniversary_month(start_date, offset + 1) - timedelta(days=1), end_date)
        days = (period_end - period_start).days + 1
        interest = 0.0
        base_rate_sum = 0.0
        day = period_start
        while day <= period_end:
            applicable = [item["rate"] for item in normal_rates if item["date"] <= day]
            bank_rate = applicable[-1] if applicable else 0.0
            base_rate_sum += bank_rate
            interest += remaining_principal * max(0.0, bank_rate + discount) / 100 / 365
            day += timedelta(days=1)

        period_payments = [p for p in normal_payments if period_start <= p["date"] <= period_end]
        actual_payment = sum(p["amount"] for p in period_payments)
        if period_payments:
            if actual_payment < 0:
                raise ValueError(
                    f"Payment total for {period_start:%Y-%m-%d} to {period_end:%Y-%m-%d} "
                    "is negative. Repayments must be positive; invert signed bank-account debits."
                )
            payment = actual_payment
            source = "CSV"
        elif not has_csv:
            payment = interest
            source = "Calculated interest"
        elif previous_payment is not None:
            payment = previous_payment
            source = "Previous month"
        else:
            payment = interest
            source = "Calculated interest (before first CSV)"
        previous_payment = payment

        interest_paid = min(payment, unpaid_interest + interest)
        principal_paid = min(remaining_principal, max(0.0, payment - interest_paid))
        unpaid_interest = max(0.0, unpaid_interest + interest - interest_paid)
        closing_principal = remaining_principal - principal_paid
        rows.append(
            {
                "Period": offset + 1,
                "From": period_start.isoformat(),
                "To": period_end.isoformat(),
                "Due date": (period_start if timing == "advance" else period_end).isoformat(),
                "Days": days,
                "Opening principal": remaining_principal,
                "Average Bank Rate": base_rate_sum / days / 100,
                "Loan rate": (base_rate_sum / days + discount) / 100,
                "Interest charged": interest,
                "Payment": payment,
                "Payment source": source,
                "Interest paid": interest_paid,
                "Principal paid": principal_paid,
                "Unpaid interest": unpaid_interest,
                "Closing principal": closing_principal,
                "Closing balance": closing_principal + unpaid_interest,
            }
        )
        remaining_principal = closing_principal
        if period_end >= end_date:
            break
        offset += 1
    return rows
