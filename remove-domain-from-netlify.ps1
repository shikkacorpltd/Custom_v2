#!/usr/bin/env pwsh
# Script to remove domain from old Netlify site
# Run this script to find and remove schoolxnow.com from the old project

Write-Host "`n╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  NETLIFY DOMAIN REMOVAL TOOL                          ║" -ForegroundColor Cyan
Write-Host "║  Remove schoolxnow.com from old project               ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# Step 1: List all sites
Write-Host "📋 Step 1: Listing all your Netlify sites..." -ForegroundColor Yellow
Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Gray
netlify sites:list

Write-Host "`n"
Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Gray
Write-Host "📌 INSTRUCTIONS:" -ForegroundColor Green
Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Gray
Write-Host ""
Write-Host "1. Look at the list above and identify the OLD site" -ForegroundColor White
Write-Host "   (Look for older sites or ones with schoolxnow.com)" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Copy the SITE ID or SITE NAME of the old site" -ForegroundColor White
Write-Host ""
Write-Host "3. Run one of these commands:" -ForegroundColor White
Write-Host ""
Write-Host "   Option A - Using Dashboard (Recommended):" -ForegroundColor Cyan
Write-Host "   netlify open:admin --site SITE_ID" -ForegroundColor Yellow
Write-Host "   Then: Domain settings -> Remove domain" -ForegroundColor Gray
Write-Host ""
Write-Host "   Option B - Using CLI:" -ForegroundColor Cyan
Write-Host "   netlify unlink" -ForegroundColor Yellow
Write-Host "   netlify link --id OLD_SITE_ID" -ForegroundColor Yellow
Write-Host "   netlify domains:remove schoolxnow.com" -ForegroundColor Yellow
Write-Host "   netlify domains:remove www.schoolxnow.com" -ForegroundColor Yellow
Write-Host ""
Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Gray
Write-Host ""

# Ask user for site ID
Write-Host "Enter the SITE ID of the old site (or press Ctrl+C to exit): " -ForegroundColor Cyan -NoNewline
$siteId = Read-Host

if ($siteId) {
    Write-Host "`n🔗 Opening admin dashboard for site: $siteId" -ForegroundColor Green
    netlify open:admin --site $siteId
    
    Write-Host "`n📋 Next steps in the browser:" -ForegroundColor Yellow
    Write-Host "1. Go to 'Domain settings' tab" -ForegroundColor White
    Write-Host "2. Find 'schoolxnow.com' or 'www.schoolxnow.com'" -ForegroundColor White
    Write-Host "3. Click 'Options' → 'Remove domain'" -ForegroundColor White
    Write-Host "4. Confirm removal" -ForegroundColor White
    Write-Host ""
    
    Write-Host "Would you like to remove the domain via CLI instead? (y/n): " -ForegroundColor Cyan -NoNewline
    $useCli = Read-Host
    
    if ($useCli -eq 'y' -or $useCli -eq 'Y') {
        Write-Host "`n🔧 Removing domain via CLI..." -ForegroundColor Yellow
        
        # Unlink current site
        Write-Host "Unlinking current site..." -ForegroundColor Gray
        netlify unlink
        
        # Link to old site
        Write-Host "Linking to old site: $siteId" -ForegroundColor Gray
        netlify link --id $siteId
        
        # Remove domains
        Write-Host "Removing schoolxnow.com..." -ForegroundColor Gray
        netlify domains:remove schoolxnow.com
        
        Write-Host "Removing www.schoolxnow.com..." -ForegroundColor Gray
        netlify domains:remove www.schoolxnow.com
        
        Write-Host "`n✅ Domain removal complete!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Now run this to add domain to your NEW site:" -ForegroundColor Yellow
        Write-Host "  1. netlify unlink" -ForegroundColor Cyan
        Write-Host "  2. netlify link" -ForegroundColor Cyan
        Write-Host "  3. netlify domains:add schoolxnow.com" -ForegroundColor Cyan
        Write-Host "  4. netlify domains:add www.schoolxnow.com" -ForegroundColor Cyan
    }
}

Write-Host "`n✨ Script complete!" -ForegroundColor Green
