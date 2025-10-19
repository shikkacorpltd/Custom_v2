#!/usr/bin/env pwsh
# Script to find and remove domain from old Netlify site

Write-Host "🔍 Finding Netlify sites with schoolxnow.com domain..." -ForegroundColor Cyan
Write-Host ""

# Get list of all sites
Write-Host "Step 1: Listing all your Netlify sites..." -ForegroundColor Yellow
netlify sites:list

Write-Host ""
Write-Host "================================" -ForegroundColor Green
Write-Host "INSTRUCTIONS:" -ForegroundColor Green  
Write-Host "================================" -ForegroundColor Green
Write-Host ""
Write-Host "1. Look at the list above" -ForegroundColor White
Write-Host "2. Find any OLD 'schoolxnow' sites" -ForegroundColor White
Write-Host "3. Copy the Site ID of the OLD site" -ForegroundColor White
Write-Host ""
Write-Host "Then run:" -ForegroundColor Yellow
Write-Host "  netlify switch" -ForegroundColor Cyan
Write-Host "  (Select the old site)" -ForegroundColor Gray
Write-Host ""
Write-Host "  netlify domains:remove schoolxnow.com" -ForegroundColor Cyan
Write-Host "  netlify domains:remove www.schoolxnow.com" -ForegroundColor Cyan
Write-Host ""
Write-Host "  netlify switch" -ForegroundColor Cyan
Write-Host "  (Select your NEW site - the current one)" -ForegroundColor Gray
Write-Host ""
Write-Host "  netlify domains:add schoolxnow.com" -ForegroundColor Cyan
Write-Host ""
Write-Host "================================" -ForegroundColor Green
Write-Host ""

# Offer to open dashboard
$openDashboard = Read-Host "Open Netlify dashboard to find sites? (y/n)"
if ($openDashboard -eq 'y') {
    Write-Host "Opening dashboard..." -ForegroundColor Cyan
    netlify open
    Write-Host ""
    Write-Host "Check each site for 'schoolxnow.com' domain" -ForegroundColor Yellow
    Write-Host "Go to: Site → Domain settings → Look for schoolxnow.com" -ForegroundColor Gray
}
