param(
  [string]$PgHost = "127.0.0.1",
  [int]$PgPort = 5432,
  [string]$PgUser = "postgres",
  [string]$PgDatabase = "posweb",
  [string]$PgPassword = "postgres",
  [string]$BackupDir = "D:\posweb-free\backups\postgres",
  [int]$RetentionDays = 14
)

$ErrorActionPreference = "Stop"

if (!(Test-Path $BackupDir)) {
  New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
}

$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$fileName = "posweb_pg_$timestamp.dump"
$outFile = Join-Path $BackupDir $fileName

$pgDump = "C:\PostgreSQL\16\bin\pg_dump.exe"
if (!(Test-Path $pgDump)) {
  throw "pg_dump not found at $pgDump"
}

$env:PGPASSWORD = $PgPassword
& $pgDump -h $PgHost -p $PgPort -U $PgUser -d $PgDatabase -F c -f $outFile
if ($LASTEXITCODE -ne 0) {
  throw "pg_dump failed with exit code $LASTEXITCODE"
}

Get-ChildItem -Path $BackupDir -Filter "*.dump" |
  Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-$RetentionDays) } |
  Remove-Item -Force

Write-Output "Backup created: $outFile"
