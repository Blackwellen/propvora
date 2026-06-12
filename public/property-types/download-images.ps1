# Run this script once to download property type images from Pexels.
# Usage: cd public/property-types && powershell -ExecutionPolicy Bypass -File download-images.ps1

$imgs = @{
  "hmo.jpg"         = "https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?w=800&h=520&fit=crop"
  "btl.jpg"         = "https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?w=800&h=520&fit=crop"
  "sa.jpg"          = "https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg?w=800&h=520&fit=crop"
  "r2r.jpg"         = "https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg?w=800&h=520&fit=crop"
  "student.jpg"     = "https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?w=800&h=520&fit=crop"
  "co-living.jpg"   = "https://images.pexels.com/photos/439227/pexels-photo-439227.jpeg?w=800&h=520&fit=crop"
  "holiday.jpg"     = "https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg?w=800&h=520&fit=crop"
  "social.jpg"      = "https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?w=800&h=520&fit=crop"
  "supported.jpg"   = "https://images.pexels.com/photos/4778667/pexels-photo-4778667.jpeg?w=800&h=520&fit=crop"
  "commercial.jpg"  = "https://images.pexels.com/photos/380768/pexels-photo-380768.jpeg?w=800&h=520&fit=crop"
  "mixed.jpg"       = "https://images.pexels.com/photos/2102587/pexels-photo-2102587.jpeg?w=800&h=520&fit=crop"
  "development.jpg" = "https://images.pexels.com/photos/585389/pexels-photo-585389.jpeg?w=800&h=520&fit=crop"
  "bts.jpg"         = "https://images.pexels.com/photos/1396132/pexels-photo-1396132.jpeg?w=800&h=520&fit=crop"
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

foreach ($kv in $imgs.GetEnumerator()) {
  $dest = Join-Path $scriptDir $kv.Key
  if (Test-Path $dest) {
    Write-Host "$($kv.Key): already exists — skipping"
    continue
  }
  try {
    Invoke-WebRequest -Uri $kv.Value -OutFile $dest -UseBasicParsing -TimeoutSec 30
    $size = (Get-Item $dest).Length
    Write-Host "$($kv.Key): downloaded OK ($size bytes)"
  } catch {
    Write-Host "$($kv.Key): FAILED — $($_.Exception.Message)"
  }
}

Write-Host "Done."
