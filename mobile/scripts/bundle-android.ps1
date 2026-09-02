[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
$entryFile = Join-Path $projectRoot 'index.js'
$bundleOutput = Join-Path $projectRoot 'android\app\src\main\assets\index.android.bundle'
$assetsDest = Join-Path $projectRoot 'android\app\src\main\res'

New-Item -ItemType Directory -Force -Path (Split-Path $bundleOutput) | Out-Null

npx.cmd expo export:embed `
  --platform android `
  --dev false `
  --entry-file $entryFile `
  --bundle-output $bundleOutput `
  --assets-dest $assetsDest

if (-not (Test-Path -LiteralPath $bundleOutput)) {
  throw "Android JS bundle was not created at $bundleOutput"
}

Write-Host "Android JS bundle ready: $bundleOutput"
