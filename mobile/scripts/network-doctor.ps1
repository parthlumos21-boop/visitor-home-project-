[CmdletBinding()]
param(
  [int]$MetroPort = 8082,
  [int]$ApiPort = 5001,
  [switch]$FixFirewall
)

$ErrorActionPreference = 'Stop'

function Get-LanAddress {
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

  $wifiAddress = $addresses |
    Where-Object {
      ($_.Alias -match 'wi-?fi|wlan|wireless' -or $_.Description -match 'wi-?fi|wlan|wireless') -and
      ($_.IP -like '192.168.*' -or $_.IP -like '10.*' -or $_.IP -match '^172\.(1[6-9]|2[0-9]|3[0-1])\.')
    } |
    Select-Object -First 1

  if ($wifiAddress) {
    return $wifiAddress
  }

  $addresses |
    Where-Object {
      $_.IP -like '192.168.*' -or
      $_.IP -like '10.*' -or
      $_.IP -match '^172\.(1[6-9]|2[0-9]|3[0-1])\.'
    } |
    Select-Object -First 1
}

$lan = Get-LanAddress
if (-not $lan) {
  Write-Host "LAN IP: NOT FOUND" -ForegroundColor Red
  Write-Host "Connect this PC to the same Wi-Fi/LAN as the phone, then retry." -ForegroundColor Yellow
  exit 1
}

Write-Host "LAN IP: $($lan.IP) ($($lan.Alias))" -ForegroundColor Green
Write-Host "Phone test URL: http://$($lan.IP):$MetroPort" -ForegroundColor Cyan
Write-Host "API test URL:   http://$($lan.IP):$ApiPort" -ForegroundColor Cyan

try {
  $vpnAdapters = @(
    Get-NetAdapter -ErrorAction Stop |
      Where-Object {
        $_.Status -eq 'Up' -and
        ($_.Name -match 'vpn|hotspot|shield|tap|tun|wireguard|openvpn|nord|proton|zerotier|tailscale' -or
         $_.InterfaceDescription -match 'vpn|hotspot|shield|tap|tun|wireguard|openvpn|nord|proton|zerotier|tailscale')
      }
  )
} catch {
  $vpnAdapters = @()
  Write-Host "VPN check: skipped because Windows adapter query was denied" -ForegroundColor Yellow
}

if ($vpnAdapters.Count -gt 0) {
  Write-Host "VPN-like adapter is active:" -ForegroundColor Yellow
  $vpnAdapters | ForEach-Object {
    Write-Host "  - $($_.Name) / $($_.InterfaceDescription)" -ForegroundColor Yellow
  }
  Write-Host "Turn off VPN while testing LAN Metro." -ForegroundColor Yellow
} else {
  Write-Host "VPN check: no active VPN-like adapter found" -ForegroundColor Green
}

$profile = $null
if ($lan.Alias -ne 'unknown') {
  $profile = Get-NetConnectionProfile -InterfaceAlias $lan.Alias -ErrorAction SilentlyContinue
}
if ($profile) {
  Write-Host "Network profile: $($profile.NetworkCategory)"
  if ($profile.NetworkCategory -ne 'Private') {
    Write-Host "Set this network to Private, otherwise Windows may block the phone." -ForegroundColor Yellow
    Write-Host "Admin PowerShell: Set-NetConnectionProfile -InterfaceAlias `"$($lan.Alias)`" -NetworkCategory Private" -ForegroundColor Cyan
  }
}

function Test-FirewallRuleForPort {
  param(
    [int]$Port,
    [string[]]$Names
  )

  $rules = @(
    foreach ($ruleName in $Names) {
      Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue
    }
  )

  foreach ($rule in $rules) {
    $portFilter = Get-NetFirewallPortFilter -AssociatedNetFirewallRule $rule -ErrorAction SilentlyContinue
    if ($portFilter -and $portFilter.LocalPort -contains "$Port") {
      return $true
    }
  }

  return $false
}

$metroRuleNames = @("Expo Server", "Expo Metro $MetroPort")
$apiRuleNames = @("Visitor API $ApiPort")
$hasMetroFirewallRule = Test-FirewallRuleForPort -Port $MetroPort -Names $metroRuleNames
$hasApiFirewallRule = Test-FirewallRuleForPort -Port $ApiPort -Names $apiRuleNames

if ($FixFirewall -and -not $hasMetroFirewallRule) {
  try {
    New-NetFirewallRule -DisplayName "Expo Metro $MetroPort" -Direction Inbound -LocalPort $MetroPort -Protocol TCP -Action Allow | Out-Null
    $hasMetroFirewallRule = $true
  } catch {
    Write-Host "Firewall fix failed for Metro: run this terminal as Administrator." -ForegroundColor Yellow
  }
}

if ($FixFirewall -and -not $hasApiFirewallRule) {
  try {
    New-NetFirewallRule -DisplayName "Visitor API $ApiPort" -Direction Inbound -LocalPort $ApiPort -Protocol TCP -Action Allow | Out-Null
    $hasApiFirewallRule = $true
  } catch {
    Write-Host "Firewall fix failed for API: run this terminal as Administrator." -ForegroundColor Yellow
  }
}

if ($hasMetroFirewallRule) {
  Write-Host "Firewall check: rule exists for Metro" -ForegroundColor Green
} else {
  Write-Host "Firewall check: no Metro rule found for port $MetroPort" -ForegroundColor Yellow
  Write-Host "Admin PowerShell: New-NetFirewallRule -DisplayName `"Expo Metro $MetroPort`" -Direction Inbound -LocalPort $MetroPort -Protocol TCP -Action Allow" -ForegroundColor Cyan
}

if ($hasApiFirewallRule) {
  Write-Host "Firewall check: rule exists for API" -ForegroundColor Green
} else {
  Write-Host "Firewall check: no API rule found for port $ApiPort" -ForegroundColor Yellow
  Write-Host "Admin PowerShell: New-NetFirewallRule -DisplayName `"Visitor API $ApiPort`" -Direction Inbound -LocalPort $ApiPort -Protocol TCP -Action Allow" -ForegroundColor Cyan
}

$metroListener = Get-NetTCPConnection -LocalPort $MetroPort -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
if ($metroListener) {
  Write-Host "Metro port: listening on $MetroPort" -ForegroundColor Green
} else {
  Write-Host "Metro port: not listening yet. Start the Expo server after this check." -ForegroundColor Yellow
}

$apiListener = Get-NetTCPConnection -LocalPort $ApiPort -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
if ($apiListener) {
  Write-Host "API port: listening on $ApiPort" -ForegroundColor Green
} else {
  Write-Host "API port: not listening yet. Start the backend if the app loads but API calls time out." -ForegroundColor Yellow
}

$adb = Get-Command adb -ErrorAction SilentlyContinue
if ($adb) {
  Write-Host "ADB: found" -ForegroundColor Green
  $adbDevices = @(adb devices | Select-String -Pattern 'device$')
  if ($adbDevices.Count -eq 0) {
    Write-Host "ADB device: none connected/authorized. USB mode will not work until the phone is connected and USB debugging is accepted." -ForegroundColor Yellow
  } else {
    Write-Host "ADB device: connected" -ForegroundColor Green
  }

  if ($adbDevices.Count -gt 0) {
    try {
    adb reverse tcp:$ApiPort tcp:$ApiPort | Out-Null
    adb reverse tcp:$MetroPort tcp:$MetroPort | Out-Null
    adb reverse tcp:8081 tcp:$MetroPort | Out-Null
    Write-Host "ADB reverse: OK for $ApiPort, $MetroPort, and 8081->$MetroPort" -ForegroundColor Green
    } catch {
      Write-Host "ADB reverse failed. Enable USB debugging, accept the phone prompt, then retry." -ForegroundColor Yellow
    }
  }
} else {
  Write-Host "ADB: not found. USB mode will not work; phone must reach LAN URL above." -ForegroundColor Yellow
}
