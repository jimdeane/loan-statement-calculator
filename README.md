# Loan Statement Calculator

A small private Flask application for discussing one loan with another person. It calculates a monthly statement using Bank of England Bank Rate history, accepts an optional payment CSV, and exports the result to Excel.

There is no Node.js build, cloud database, migration, or admin system.

## Run on Windows

Install Python 3.11 or newer from [python.org](https://www.python.org/downloads/) and select **Add Python to PATH** during installation.

Then right-click `run_local.ps1` and choose **Run with PowerShell**, or run this in PowerShell:

```powershell
cd D:\Dropbox\windowsdesktop\loan-statement-calculator
.\run_local.ps1
```

The script creates an isolated Python environment, installs the required packages, opens the browser, and starts the application at:

```text
http://127.0.0.1:5000
```

The first visit asks you to create one shared username and password. Later visits show the login page. The login configuration is stored only in `instance/settings.json`; this file is excluded from Git.

Stop the application by pressing `Ctrl+C` in the PowerShell window.

## Payment CSV

The optional CSV must contain `date` and `amount` columns:

```csv
date,amount
2024-01-19,312.50
2024-02-19,312.50
```

Dates may be `YYYY-MM-DD` or `DD/MM/YYYY`.

Repayments must be positive amounts. If the source is a bank-account export where
outgoing payments are negative, invert the sign when creating the payment CSV.
Keep returned or reversed payments negative so they net against repayments in the
same statement period.

## Sharing

The local server is intentionally available only on your own computer. Exporting the Excel statement is the simplest way to send a specific statement to your friend.

If you want your friend to use the calculator through an internet link, deploy it behind HTTPS using a proper Flask host. Do not expose Flask's built-in local server directly to the internet. The application supports a standard WSGI entry point named `app:app`.

## Manual commands

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe app.py
```

Run the automated checks with:

```powershell
.\.venv\Scripts\python.exe -m unittest discover -s tests -v
```
