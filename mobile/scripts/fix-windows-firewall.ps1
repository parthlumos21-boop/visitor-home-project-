[CmdletBinding()]
param(
  [int]$MetroPort = 8082,
  [int]$ApiPort = 5001
)

$ErrorActionPreference = 'Stop'

$principal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
$isAdmin = $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
  throw "Run this script from an Administrator PowerShell window."
}

if (-not (Get-NetFirewallRule -DisplayName "Expo Metro $MetroPort" -ErrorAction SilentlyContinue)) {
  New-NetFirewallRule -DisplayName "Expo Metro $MetroPort" -Direction Inbound -LocalPort $MetroPort -Protocol TCP -Action Allow | Out-Null
}

if (-not (Get-NetFirewallRule -DisplayName "Visitor API $ApiPort" -ErrorAction SilentlyContinue)) {
  New-NetFirewallRule -DisplayName "Visitor API $ApiPort" -Direction Inbound -LocalPort $ApiPort -Protocol TCP -Action Allow | Out-Null
}

Write-Host "Firewall rules ready for Metro $MetroPort and API $ApiPort." -ForegroundColor Green
