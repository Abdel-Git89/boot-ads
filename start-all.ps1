# ===================================================
# Boot-Ads — سكريبت التشغيل السريع (Start All)
# ===================================================

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   🚀 تشغيل مشروع Boot-Ads (Telegram Mini App)" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan

$rootDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# 1. فحص ملف .env
if (-not (Test-Path "$rootDir\server\.env")) {
    Write-Host "[!] جاري إنشاء ملف server\.env من النموذج..." -ForegroundColor Yellow
    Copy-Item "$rootDir\server\.env.example" "$rootDir\server\.env"
}

# 2. تشغيل السيرفر الخلفي (Backend) في نافذة منفصلة
Write-Host "[1/2] تشغيل السيرفر الخلفي (Backend) على المنفذ 5000..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$rootDir\server'; Write-Host '--- BACKEND SERVER (Port 5000) ---' -ForegroundColor Green; npm run dev"

# 3. تشغيل الواجهة الأمامية (Frontend) في نافذة منفصلة
Write-Host "[2/2] تشغيل الواجهة الأمامية (Frontend) على المنفذ 3000..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$rootDir\client'; Write-Host '--- FRONTEND CLIENT (Port 3000) ---' -ForegroundColor Cyan; npm run dev"

# 4. فتح المتصفح
Start-Sleep -Seconds 3
Write-Host "`n✅ تم تشغيل المشروع! يتم فتح المتصفح الآن..." -ForegroundColor Green
Start-Process "http://localhost:3000"

