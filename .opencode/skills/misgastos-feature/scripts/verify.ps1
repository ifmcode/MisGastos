<#
.SYNOPSIS
Runs the MisGastos verification gate in order and stops at the first failure.
.DESCRIPTION
Execute from the repository root:
  powershell -NoProfile -File .opencode/skills/misgastos-feature/scripts/verify.ps1
Each step maps to the commands documented in AGENTS.md.
#>
param(
  [switch]$SkipTests
)

$ErrorActionPreference = "Stop"

$steps = @(
  @{ Name = "TypeScript"; Command = "npx tsc --noEmit" },
  @{ Name = "ESLint"; Command = "npx expo lint" },
  @{ Name = "Copy audit"; Command = "npm run check:copy" }
)

if (-not $SkipTests) {
  $steps = $steps[0..1] + @(@{ Name = "Jest"; Command = "npx jest" }) + $steps[2]
}

foreach ($step in $steps) {
  Write-Host "`n==> $($step.Name): $($step.Command)" -ForegroundColor Cyan
  Invoke-Expression $step.Command
  if ($LASTEXITCODE -ne 0) {
    Write-Host "`n$($step.Name) failed with exit code $LASTEXITCODE." -ForegroundColor Red
    exit $LASTEXITCODE
  }
}

Write-Host "`nAll verification steps passed." -ForegroundColor Green
