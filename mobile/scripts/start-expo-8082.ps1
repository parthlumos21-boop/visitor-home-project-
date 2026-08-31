[CmdletBinding()]
param(
    [Parameter(ValueFromRemainingArguments=$true)]
    [string[]]$ExtraArgs
)
$ErrorActionPreference = 'Stop'

$port = 8082

$addresses = @(
  ipconfig |
    Select-String -Pattern 'IPv4 Address|IPv4' |
    ForEach-Object { ($_ -split ':')[-1].Trim() } |
    Where-Object {
      $_ -and
      $_ -notlike '127.*' -and
      $_ -notlike '169.254.*' -and
      $_ -notlike '172.17.*' -and
      $_ -notlike '100.*'
    }
)

$wifiIp = (
  $addresses |
    Where-Object {
      $_ -like '192.168.*' -or
      $_ -like '10.*' -or
      $_ -match '^172\.(1[6-9]|2[0-9]|3[0-1])\.'
    } |
    Select-Object -First 1
)

if (-not $wifiIp) {
  $wifiIp = $addresses | Select-Object -First 1
}

if (-not $wifiIp) {
  $wifiIp = 'localhost'
}

$connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
$processIds = $connections | Select-Object -ExpandProperty OwningProcess -Unique

foreach ($processId in $processIds) {
  if ($processId -and $processId -ne $PID) {
    Write-Host "Stopping process $processId on port $port..."
    Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
  }
}

$env:REACT_NATIVE_PACKAGER_HOSTNAME = $wifiIp
$env:EXPO_PUBLIC_API_URL = "http://$($wifiIp):5001/api"

Write-Host "Expo host: $wifiIp"
Write-Host "Mobile API: $env:EXPO_PUBLIC_API_URL"

try {
  $backendHealth = Invoke-WebRequest -Uri "http://$($wifiIp):5001/" -UseBasicParsing -TimeoutSec 3
  Write-Host "Backend LAN check: $($backendHealth.StatusCode)"
} catch {
  Write-Host "Backend LAN check failed: http://$($wifiIp):5001/"
}

$adb = Get-Command adb -ErrorAction SilentlyContinue
if ($adb) {
  try {
    adb reverse tcp:5001 tcp:5001 | Out-Null
    adb reverse tcp:$port tcp:$port | Out-Null
    adb reverse tcp:8081 tcp:$port | Out-Null
    Write-Host "Android USB API: http://localhost:5001/api"
    Write-Host "Android USB Metro: http://localhost:$port"
  } catch {
    Write-Host "Android USB reverse failed. LAN API will be used."
  }
} else {
  Write-Host "ADB not found. Android device must reach the LAN API above."
}

$firewallRule = Get-NetFirewallRule -LocalPort $port -ErrorAction SilentlyContinue
if (-not $firewallRule) {
    Write-Host ""
    Write-Host "================================================================" -ForegroundColor Yellow
    Write-Host "WARNING: Windows Firewall is likely blocking port $port!" -ForegroundColor Yellow
    Write-Host "If your phone cannot connect (Unable to load script), you MUST" -ForegroundColor Yellow
    Write-Host "run this exact command in an Administrator PowerShell window:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "New-NetFirewallRule -DisplayName `"Expo Server`" -Direction Inbound -LocalPort $port -Protocol TCP -Action Allow" -ForegroundColor Cyan
    Write-Host "================================================================" -ForegroundColor Yellow
    Write-Host ""
} else {
    Write-Host "Firewall check: OK (Port $port allowed)" -ForegroundColor Green
}

npx expo start --port $port --host lan $ExtraArgs
