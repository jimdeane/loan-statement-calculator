Import-Csv .\data.csv |
    Where-Object { ($_.PSObject.Properties.Value -join ' ') -match 'julia' } |
    Select-Object Date, @{ Name = 'Amount'; Expression = { -[decimal]$_.Amount } } |
    Export-Csv .\loan.csv -NoTypeInformation
    
