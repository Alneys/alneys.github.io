#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Delete all opencode sessions older than 72 hours.
.DESCRIPTION
    Uses `opencode session list -n 200 --format json` to fetch recent sessions,
    filters those whose `updated` timestamp is older than 72 hours,
    and deletes them via `opencode session delete`.
    Loops until all qualifying sessions are removed.

    Default mode is dry-run (preview only). Pass -Yes to confirm actual deletion.
.PARAMETER Yes
    Confirm deletion. Without this flag, the script runs in dry-run mode (no deletions).
.PARAMETER CutoffHours
    Number of hours to use as the cutoff threshold (default: 72).
.PARAMETER BatchSize
    Number of sessions to fetch per request (default: 200, max: 200).
.EXAMPLE
    .\clean-old-sessions.ps1
    Preview sessions older than 72 hours (dry-run).

    .\clean-old-sessions.ps1 -Yes
    Actually delete all sessions older than 72 hours.

    .\clean-old-sessions.ps1 -CutoffHours 48
    Preview sessions older than 48 hours.

    .\clean-old-sessions.ps1 -Yes -CutoffHours 24
    Delete all sessions older than 24 hours.

    .\clean-old-sessions.ps1 -BatchSize 50
    Fetch 50 sessions per request (smaller batches, dry-run).

    .\clean-old-sessions.ps1 -Yes -BatchSize 50
    Delete with smaller batch size.
#>

param(
    [Alias('y')]
    [switch]$Yes,
    [Alias('h')]
    [int]$CutoffHours = 72,
    [Alias('n')]
    [int]$BatchSize = 200
)

$ErrorActionPreference = 'Stop'

# opencode outputs UTF-8; save console encoding and switch to UTF-8
$origEncoding = [Console]::OutputEncoding
[Console]::OutputEncoding = [Text.Encoding]::UTF8

# cutoff in milliseconds
$cutoffAgeMs = $CutoffHours * 60 * 60 * 1000
$nowMs = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
$cutoffTimestamp = $nowMs - $cutoffAgeMs

Write-Host "Current time (UTC):  $(Get-Date -Date $([DateTimeOffset]::FromUnixTimeMilliseconds($nowMs).UtcDateTime) -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Host "Cutoff time  (UTC):  $(Get-Date -Date $([DateTimeOffset]::FromUnixTimeMilliseconds($cutoffTimestamp).UtcDateTime) -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Host "Cutoff threshold:    $CutoffHours hours"
Write-Host "Batch size:          $BatchSize sessions per request"
Write-Host "Mode:                $(if ($Yes) { 'LIVE (deletions will be performed)' } else { 'DRY RUN (no deletions will be performed)' })"
Write-Host ""

try {
    if (-not $Yes) {
        Write-Host "========== DRY RUN =========="
        Write-Host ""

        $jsonText = & opencode session list -n $BatchSize --format json 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Failed to list sessions: $jsonText"
            return
        }

        $sessions = $jsonText | ConvertFrom-Json
        if ($null -eq $sessions -or $sessions.Count -eq 0) {
            Write-Host "No sessions found."
            return
        }

        $oldSessions = $sessions | Where-Object { $_.updated -lt $cutoffTimestamp }

        if ($null -eq $oldSessions -or $oldSessions.Count -eq 0) {
            Write-Host "No sessions older than $CutoffHours hours found."
            Write-Host ""
            Write-Host "========== DRY RUN COMPLETE =========="
            return
        }

        $batchLabel = if ($BatchSize -eq 200) { " (batch limit)" } else { "" }
        Write-Host "Found $($oldSessions.Count) session(s) that WOULD be deleted (batch size: $BatchSize$batchLabel):"

        # Sort oldest first for display
        $sorted = $oldSessions | Sort-Object updated
        foreach ($session in $sorted) {
            $updatedDate = [DateTimeOffset]::FromUnixTimeMilliseconds($session.updated).UtcDateTime
            $ageHours = [Math]::Round(($nowMs - $session.updated) / (60 * 60 * 1000), 1)
            Write-Host "  Would delete: $($session.id)"
            Write-Host "    Title : $($session.title)"
            Write-Host "    Updated: $updatedDate UTC (~${ageHours}h ago)"
            Write-Host "    Project: $($session.directory)"
            Write-Host ""
        }

        # Warn if there may be more beyond this batch
        if ($sessions.Count -ge $BatchSize) {
            Write-Host "  [!] The list is at the batch limit. There may be more sessions"
            Write-Host "      beyond this batch. Run the script with -Yes to delete all of them."
            Write-Host ""
        }

        Write-Host "========== DRY RUN COMPLETE ($($oldSessions.Count) sessions would be deleted) =========="
        return
    }

    # ---- LIVE MODE ----

    $totalDeleted = 0

    while ($true) {
        Write-Host "Fetching up to $BatchSize sessions..."

        $jsonText = & opencode session list -n $BatchSize --format json 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Failed to list sessions: $jsonText"
            return
        }

        $sessions = $jsonText | ConvertFrom-Json
        if ($null -eq $sessions -or $sessions.Count -eq 0) {
            Write-Host "No sessions found. Done."
            break
        }

        $oldSessions = $sessions | Where-Object { $_.updated -lt $cutoffTimestamp }

        if ($null -eq $oldSessions -or $oldSessions.Count -eq 0) {
            Write-Host "No sessions older than $CutoffHours hours found. Done."
            break
        }

        Write-Host "Found $($oldSessions.Count) session(s) to delete (batch size: $BatchSize)."

        foreach ($session in $oldSessions) {
            $updatedDate = [DateTimeOffset]::FromUnixTimeMilliseconds($session.updated).UtcDateTime
            $ageHours = [Math]::Round(($nowMs - $session.updated) / (60 * 60 * 1000), 1)
            Write-Host "  Deleting: $($session.id) ($($session.title)) - last updated $updatedDate UTC (~${ageHours}h ago)"

            $result = & opencode session delete $session.id 2>&1
            if ($LASTEXITCODE -ne 0) {
                Write-Warning "  Failed to delete $($session.id): $result"
            } else {
                $totalDeleted++
            }
        }

        Write-Host ""
    }

    Write-Host ""
    Write-Host "Done. Total sessions deleted: $totalDeleted"
} finally {
    [Console]::OutputEncoding = $origEncoding
}

Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
