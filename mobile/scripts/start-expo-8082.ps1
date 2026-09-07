[CmdletBinding()]
param(
    [Parameter(ValueFromRemainingArguments=$true)]
    [string[]]$ExtraArgs
)
$ErrorActionPreference = 'Stop'

$port = 8082
$useExpoGo = $ExtraArgs -contains '--go'
$useTunnel = $ExtraArgs -contains '--tunnel'

$ExtraArgs = $ExtraArgs | Where-Object { $_ -ne '--tunnel' }

if ($useTunnel) {
  $expoArgs = @('expo', 'start', '--port', $port, '--tunnel')
} else {
  $expoArgs = @('expo', 'start', '--port', $port, '--host', 'lan')
}

$useDevClient = $ExtraArgs -contains '--dev-client'

if ($useDevClient) {
  $ExtraArgs = $ExtraArgs | Where-Object { $_ -ne '--dev-client' }
  $expoArgs += '--dev-client'
} else {
  $expoArgs += '--go'
  # Use one Expo Go QR link for both iOS and Android.
  $expoArgs += '--scheme', 'exp'
}

$expoArgs += $ExtraArgs

try {
  $addresses = @(
    Get-NetIPConfiguration -ErrorAction Stop |
      Where-Object { $_.IPv4Address -and $_.NetAdapter.Status -eq 'Up' } |
      ForEach-Object {
        foreach ($addr in $_.IPv4Address) {
          [PSCustomObject]@{
            IP = $addr.IPAddress
            Alias = $_.InterfaceAlias
            Description = $_.NetAdapter.InterfaceDescription
          }
        }
      }
  )
} catch {
  $addresses = @(
    ipconfig |
      Select-String -Pattern 'IPv4 Address|IPv4' |
      ForEach-Object {
        [PSCustomObject]@{
          IP = ($_ -split ':')[-1].Trim()
          Alias = 'unknown'
          Description = 'ipconfig fallback'
        }
      }
  )
}

$addresses = @(
  $addresses |
    Where-Object {
      $_.IP -and
      $_.IP -notlike '127.*' -and
      $_.IP -notlike '169.254.*' -and
      $_.IP -notlike '172.17.*' -and
      $_.IP -notlike '100.*'
    }
)

$wifiAddress = (
  $addresses |
    Where-Object {
      ($_.Alias -match 'wi-?fi|wlan|wireless' -or $_.Description -match 'wi-?fi|wlan|wireless') -and
      ($_.IP -like '192.168.*' -or $_.IP -like '10.*' -or $_.IP -match '^172\.(1[6-9]|2[0-9]|3[0-1])\.')
    } |
    Select-Object -First 1
)

if ($wifiAddress) {
  $wifiIp = $wifiAddress.IP
} else {
  $wifiIp = (
    $addresses |
      Where-Object {
        $_.IP -like '192.168.*' -or $_.IP -like '10.*' -or $_.IP -match '^172\.(1[6-9]|2[0-9]|3[0-1])\.'
      } |
      Select-Object -ExpandProperty IP -First 1
  )
}

if (-not $wifiIp) {
  $wifiIp = $addresses | Select-Object -ExpandProperty IP -First 1
}

if (-not $wifiIp) {
  $wifiIp = 'localhost'
}

$connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
$processIds = $connections | Select-Object -ExpandProperty OwningProcess -Unique

foreach ($processId in $processIds) {
  if ($processId -and $processId -ne $PID) {
    $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
    if ($process -and $process.ProcessName -match '^(node|npm|npx|expo)$') {
      Write-Host "Stopping process $processId on port $port..."
      Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
    } else {
      Write-Host "Port $port is already used by PID $processId ($($process.ProcessName)). Metro cannot start there." -ForegroundColor Red
      Write-Host "Stop that process first, then run npm.cmd run start:mobile again." -ForegroundColor Yellow
      exit 1
    }
  }
}

if ($useTunnel) {
  Remove-Item Env:REACT_NATIVE_PACKAGER_HOSTNAME -ErrorAction SilentlyContinue
} else {
  $env:REACT_NATIVE_PACKAGER_HOSTNAME = $wifiIp
}
$env:EXPO_PUBLIC_API_URL = "http://$($wifiIp):5001/api"

$envPath = Join-Path $PSScriptRoot '..\.env'
Set-Content -LiteralPath $envPath -Value "EXPO_PUBLIC_API_URL=$env:EXPO_PUBLIC_API_URL"

$gradlePropertiesPath = Join-Path $PSScriptRoot '..\android\gradle.properties'
if (Test-Path -LiteralPath $gradlePropertiesPath) {
  $gradleProperties = Get-Content -LiteralPath $gradlePropertiesPath
  if ($gradleProperties -match '^reactNativeDevServerPort=') {
    $gradleProperties = $gradleProperties -replace '^reactNativeDevServerPort=.*$', "reactNativeDevServerPort=$port"
  } else {
    $gradleProperties += ''
    $gradleProperties += '# Keep Android dev builds aligned with this Expo start script.'
    $gradleProperties += "reactNativeDevServerPort=$port"
  }
  Set-Content -LiteralPath $gradlePropertiesPath -Value $gradleProperties
}

Write-Host "Expo host: $wifiIp"
if ($useTunnel) {
  Write-Host "Expo connection: tunnel"
} else {
  Write-Host "Expo connection: LAN (QR displays without ngrok)"
}
Write-Host "Mobile API: $env:EXPO_PUBLIC_API_URL"
Write-Host "Phone Metro test: http://$($wifiIp):$port"
Write-Host ""

try {
  & (Join-Path $PSScriptRoot 'network-doctor.ps1') -MetroPort $port -ApiPort 5001
  Write-Host ""
} catch {
  Write-Host "Network doctor failed: $($_.Exception.Message)" -ForegroundColor Yellow
  Write-Host ""
}

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

$firewallRule = Get-NetFirewallRule -DisplayName "Expo Server" -ErrorAction SilentlyContinue
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

npx.cmd $expoArgs
