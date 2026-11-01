# printReceipt.ps1 - Thermal receipt printer for POS-80C (80mm / 72mm printable width)
[CmdletBinding()]
param (
    [Parameter(Mandatory=$true)]
    [string]$JsonPath,
    [string]$PrinterName = "POS-80C",
    [string]$OutputPreview = "",
    [switch]$NoPrint
)

[System.Reflection.Assembly]::LoadWithPartialName('System.Drawing') | Out-Null
[System.Reflection.Assembly]::LoadWithPartialName('System.Windows.Forms') | Out-Null

if (-not (Test-Path $JsonPath)) {
    Write-Error "JSON file not found: $JsonPath"
    exit 1
}

$rawJson = [System.IO.File]::ReadAllText($JsonPath, [System.Text.Encoding]::UTF8)
$data = $rawJson | ConvertFrom-Json

$sale = $data.sale
$shop = $data.shop

# Fallback shop info
$shopName = if ($shop -and $shop.name) { $shop.name } else { "VĂN PHÒNG PHẨM 302" }
$shopAddress = if ($shop -and $shop.address) { $shop.address } else { "302 Vườn Lài, Phường An Phú Đông, TP.HCM" }
$shopPhone = if ($shop -and $shop.phone) { $shop.phone } else { "0932843329 (Nga)" }

# Helper: format currency
function Format-Vnd([double]$val) {
    return ($val.ToString("#,##0", [System.Globalization.CultureInfo]::GetCultureInfo("vi-VN")) + " đ")
}

# Helper: format date
function Format-ReceiptDate([string]$dateStr) {
    try {
        if (-not $dateStr) { return (Get-Date).ToString("dd/MM/yyyy HH:mm:ss") }
        $d = [DateTime]::Parse($dateStr)
        return $d.ToString("dd/MM/yyyy HH:mm:ss")
    } catch {
        return (Get-Date).ToString("dd/MM/yyyy HH:mm:ss")
    }
}

$receiptCode = if ($sale.code) { $sale.code } else { "HD-" + (Get-Date).ToString("HHmmss") }
$dateFormatted = Format-ReceiptDate ($sale.created_at -or $sale.sale_date)

# Paper dimensions (hundredths of an inch): 283 = ~72mm printable width
[float]$pageWidth = 283.0
[float]$marginLeft = 8.0
[float]$contentWidth = $pageWidth - ($marginLeft * 2.0) # 267.0

# Fonts
$fontFamily = "Segoe UI"
$fShopName = [System.Drawing.Font]::new($fontFamily, 11.0, [System.Drawing.FontStyle]::Bold)
$fShopInfo = [System.Drawing.Font]::new($fontFamily, 8.0, [System.Drawing.FontStyle]::Regular)
$fTitle    = [System.Drawing.Font]::new($fontFamily, 12.0, [System.Drawing.FontStyle]::Bold)
$fSubTitle = [System.Drawing.Font]::new($fontFamily, 8.5, [System.Drawing.FontStyle]::Bold)
$fHeader   = [System.Drawing.Font]::new($fontFamily, 8.0, [System.Drawing.FontStyle]::Bold)
$fBody     = [System.Drawing.Font]::new($fontFamily, 8.5, [System.Drawing.FontStyle]::Regular)
$fBodyBold = [System.Drawing.Font]::new($fontFamily, 8.5, [System.Drawing.FontStyle]::Bold)
$fTotalBig = [System.Drawing.Font]::new($fontFamily, 11.5, [System.Drawing.FontStyle]::Bold)
$fFooter   = [System.Drawing.Font]::new($fontFamily, 8.0, [System.Drawing.FontStyle]::Italic)
$fFooterSub= [System.Drawing.Font]::new($fontFamily, 7.5, [System.Drawing.FontStyle]::Regular)

$brush = [System.Drawing.Brushes]::Black
$penDash = [System.Drawing.Pen]::new([System.Drawing.Color]::Black, 1.0)
$penDash.DashStyle = [System.Drawing.Drawing2D.DashStyle]::Dash
$penSolid = [System.Drawing.Pen]::new([System.Drawing.Color]::Black, 1.2)

$sfCenter = [System.Drawing.StringFormat]::new()
$sfCenter.Alignment = [System.Drawing.StringAlignment]::Center

$sfRight = [System.Drawing.StringFormat]::new()
$sfRight.Alignment = [System.Drawing.StringAlignment]::Far

$sfLeft = [System.Drawing.StringFormat]::new()
$sfLeft.Alignment = [System.Drawing.StringAlignment]::Near

# Table Columns layout
# Total content width = 267
[float]$colX_Name  = $marginLeft
[float]$colW_Name  = 115.0
[float]$colX_Unit  = $colX_Name + $colW_Name # 123
[float]$colW_Unit  = 28.0
[float]$colX_Qty   = $colX_Unit + $colW_Unit # 151
[float]$colW_Qty   = 24.0
[float]$colX_Price = $colX_Qty + $colW_Qty   # 175
[float]$colW_Price = 42.0
[float]$colX_Total = $colX_Price + $colW_Price # 217
[float]$colW_Total = $contentWidth - ($colX_Total - $marginLeft) # 58.0

# Layout renderer function
$renderReceipt = {
    param([System.Drawing.Graphics]$g, [bool]$measureOnly)
    
    [float]$y = 6.0
    
    # 1. Shop Name
    $szShop = $g.MeasureString($shopName, $fShopName, [int]$contentWidth)
    if (-not $measureOnly) {
        $rectShop = [System.Drawing.RectangleF]::new($marginLeft, $y, $contentWidth, $szShop.Height)
        $g.DrawString($shopName, $fShopName, $brush, $rectShop, $sfCenter)
    }
    $y += $szShop.Height + 1.0
    
    # 2. Shop Address
    $szAddr = $g.MeasureString($shopAddress, $fShopInfo, [int]$contentWidth)
    if (-not $measureOnly) {
        $rectAddr = [System.Drawing.RectangleF]::new($marginLeft, $y, $contentWidth, $szAddr.Height)
        $g.DrawString($shopAddress, $fShopInfo, $brush, $rectAddr, $sfCenter)
    }
    $y += $szAddr.Height + 1.0
    
    # 3. Shop Phone
    $phoneText = "Hotline/Zalo: " + $shopPhone
    $szPhone = $g.MeasureString($phoneText, $fShopInfo, [int]$contentWidth)
    if (-not $measureOnly) {
        $rectPhone = [System.Drawing.RectangleF]::new($marginLeft, $y, $contentWidth, $szPhone.Height)
        $g.DrawString($phoneText, $fShopInfo, $brush, $rectPhone, $sfCenter)
    }
    $y += $szPhone.Height + 4.0
    
    # Divider dash
    if (-not $measureOnly) {
        $g.DrawLine($penDash, $marginLeft, $y, ($marginLeft + $contentWidth), $y)
    }
    $y += 5.0
    
    # 4. Receipt Title
    $szTitle = $g.MeasureString("HÓA ĐƠN BÁN LẺ", $fTitle, [int]$contentWidth)
    if (-not $measureOnly) {
        $rectTitle = [System.Drawing.RectangleF]::new($marginLeft, $y, $contentWidth, $szTitle.Height)
        $g.DrawString("HÓA ĐƠN BÁN LẺ", $fTitle, $brush, $rectTitle, $sfCenter)
    }
    $y += $szTitle.Height + 1.0
    
    # Code & Date
    $codeText = "Số: #" + $receiptCode
    $szCode = $g.MeasureString($codeText, $fSubTitle, [int]$contentWidth)
    if (-not $measureOnly) {
        $rectCode = [System.Drawing.RectangleF]::new($marginLeft, $y, $contentWidth, $szCode.Height)
        $g.DrawString($codeText, $fSubTitle, $brush, $rectCode, $sfCenter)
    }
    $y += $szCode.Height + 1.0
    
    $szDate = $g.MeasureString($dateFormatted, $fShopInfo, [int]$contentWidth)
    if (-not $measureOnly) {
        $rectDate = [System.Drawing.RectangleF]::new($marginLeft, $y, $contentWidth, $szDate.Height)
        $g.DrawString($dateFormatted, $fShopInfo, $brush, $rectDate, $sfCenter)
    }
    $y += $szDate.Height + 6.0
    
    # 5. Table Header Divider Solid
    if (-not $measureOnly) {
        $g.DrawLine($penSolid, $marginLeft, $y, ($marginLeft + $contentWidth), $y)
    }
    $y += 3.0
    
    # Header row
    [float]$headerH = 16.0
    if (-not $measureOnly) {
        $g.DrawString("Sản phẩm", $fHeader, $brush, ([System.Drawing.RectangleF]::new($colX_Name, $y, $colW_Name, $headerH)), $sfLeft)
        $g.DrawString("ĐVT", $fHeader, $brush, ([System.Drawing.RectangleF]::new($colX_Unit, $y, $colW_Unit, $headerH)), $sfCenter)
        $g.DrawString("SL", $fHeader, $brush, ([System.Drawing.RectangleF]::new($colX_Qty, $y, $colW_Qty, $headerH)), $sfCenter)
        $g.DrawString("Đ.Giá", $fHeader, $brush, ([System.Drawing.RectangleF]::new($colX_Price, $y, $colW_Price, $headerH)), $sfRight)
        $g.DrawString("T.Tiền", $fHeader, $brush, ([System.Drawing.RectangleF]::new($colX_Total, $y, $colW_Total, $headerH)), $sfRight)
    }
    $y += $headerH
    if (-not $measureOnly) {
        $g.DrawLine($penSolid, $marginLeft, $y, ($marginLeft + $contentWidth), $y)
    }
    $y += 4.0
    
    # 6. Items
    $totalQty = 0.0
    foreach ($item in $sale.items) {
        $pName = if ($item.product_name) { $item.product_name } elseif ($item.name) { $item.name } else { "Sản phẩm" }
        $pUnit = if ($item.unit) { $item.unit } elseif ($item.dvt) { $item.dvt } else { "Cái" }
        $qty = [double]$item.quantity
        $totalQty += $qty
        $price = [double]$item.price
        $lineTotal = $qty * $price
        
        $pPriceStr = ($price.ToString("#,##0", [System.Globalization.CultureInfo]::GetCultureInfo("vi-VN")))
        $lineTotalStr = ($lineTotal.ToString("#,##0", [System.Globalization.CultureInfo]::GetCultureInfo("vi-VN")))
        
        # Measure name height
        $szName = $g.MeasureString($pName, $fBodyBold, [int]$colW_Name)
        [float]$rowH = [Math]::Max([float]$szName.Height, 16.0)
        
        if (-not $measureOnly) {
            $g.DrawString($pName, $fBodyBold, $brush, ([System.Drawing.RectangleF]::new($colX_Name, $y, $colW_Name, $rowH)), $sfLeft)
            $g.DrawString($pUnit, $fBody, $brush, ([System.Drawing.RectangleF]::new($colX_Unit, $y, $colW_Unit, $rowH)), $sfCenter)
            $g.DrawString($qty.ToString(), $fBodyBold, $brush, ([System.Drawing.RectangleF]::new($colX_Qty, $y, $colW_Qty, $rowH)), $sfCenter)
            $g.DrawString($pPriceStr, $fBody, $brush, ([System.Drawing.RectangleF]::new($colX_Price, $y, $colW_Price, $rowH)), $sfRight)
            $g.DrawString($lineTotalStr, $fBodyBold, $brush, ([System.Drawing.RectangleF]::new($colX_Total, $y, $colW_Total, $rowH)), $sfRight)
        }
        $y += $rowH + 3.0
    }
    
    # 7. Divider Solid
    $y += 2.0
    if (-not $measureOnly) {
        $g.DrawLine($penSolid, $marginLeft, $y, ($marginLeft + $contentWidth), $y)
    }
    $y += 4.0
    
    # 8. Summary: Total Quantity
    [float]$lineH = 16.0
    if (-not $measureOnly) {
        $g.DrawString("Tổng số lượng:", $fBody, $brush, ([System.Drawing.RectangleF]::new($marginLeft, $y, 140.0, $lineH)), $sfLeft)
        $g.DrawString($totalQty.ToString(), $fBodyBold, $brush, ([System.Drawing.RectangleF]::new(($marginLeft + 140.0), $y, ($contentWidth - 140.0), $lineH)), $sfRight)
    }
    $y += $lineH + 1.0
    
    # Grand Total
    $grandTotal = [double]$sale.total_amount
    $grandTotalStr = Format-Vnd $grandTotal
    [float]$grandH = 22.0
    if (-not $measureOnly) {
        $g.DrawString("TỔNG CỘNG:", $fTotalBig, $brush, ([System.Drawing.RectangleF]::new($marginLeft, $y, 110.0, $grandH)), $sfLeft)
        $g.DrawString($grandTotalStr, $fTotalBig, $brush, ([System.Drawing.RectangleF]::new(($marginLeft + 110.0), $y, ($contentWidth - 110.0), $grandH)), $sfRight)
    }
    $y += $grandH + 2.0
    
    # Payment method
    $payMethod = if ($sale.payment_method -eq 'bank' -or $sale.payment_method -eq 'transfer') { 'Chuyển khoản' } else { 'Tiền mặt' }
    if (-not $measureOnly) {
        $g.DrawString("Hình thức thanh toán:", $fBody, $brush, ([System.Drawing.RectangleF]::new($marginLeft, $y, 140.0, $lineH)), $sfLeft)
        $g.DrawString($payMethod, $fBodyBold, $brush, ([System.Drawing.RectangleF]::new(($marginLeft + 140.0), $y, ($contentWidth - 140.0), $lineH)), $sfRight)
    }
    $y += $lineH + 1.0
    
    # Cash details if cash
    if ($payMethod -eq 'Tiền mặt' -and $sale.cash_given -and [double]$sale.cash_given -gt 0) {
        $cashGiven = [double]$sale.cash_given
        $change = [double]$sale.change_amount
        if ($change -lt 0) { $change = 0.0 }
        
        if (-not $measureOnly) {
            $g.DrawString("Tiền khách đưa:", $fBody, $brush, ([System.Drawing.RectangleF]::new($marginLeft, $y, 140.0, $lineH)), $sfLeft)
            $g.DrawString((Format-Vnd $cashGiven), $fBody, $brush, ([System.Drawing.RectangleF]::new(($marginLeft + 140.0), $y, ($contentWidth - 140.0), $lineH)), $sfRight)
        }
        $y += $lineH + 1.0
        
        if (-not $measureOnly) {
            $g.DrawString("Tiền thối lại:", $fBodyBold, $brush, ([System.Drawing.RectangleF]::new($marginLeft, $y, 140.0, $lineH)), $sfLeft)
            $g.DrawString((Format-Vnd $change), $fBodyBold, $brush, ([System.Drawing.RectangleF]::new(($marginLeft + 140.0), $y, ($contentWidth - 140.0), $lineH)), $sfRight)
        }
        $y += $lineH + 1.0
    }
    
    # 9. Footer
    $y += 4.0
    if (-not $measureOnly) {
        $g.DrawLine($penDash, $marginLeft, $y, ($marginLeft + $contentWidth), $y)
    }
    $y += 7.0
    
    $szThank = $g.MeasureString("Cảm ơn quý khách & Hẹn gặp lại!", $fFooter, [int]$contentWidth)
    if (-not $measureOnly) {
        $rectThank = [System.Drawing.RectangleF]::new($marginLeft, $y, $contentWidth, $szThank.Height)
        $g.DrawString("Cảm ơn quý khách & Hẹn gặp lại!", $fFooter, $brush, $rectThank, $sfCenter)
    }
    $y += $szThank.Height + 2.0
    
    $szPw = $g.MeasureString("Powered by PosWebFree", $fFooterSub, [int]$contentWidth)
    if (-not $measureOnly) {
        $rectPw = [System.Drawing.RectangleF]::new($marginLeft, $y, $contentWidth, $szPw.Height)
        $g.DrawString("Powered by PosWebFree", $fFooterSub, $brush, $rectPw, $sfCenter)
    }
    $y += $szPw.Height + 20.0 # bottom padding so cutter leaves a margin
    
    return $y
}

# --- Pass 1: Measure total height ---
$dummyBmp = [System.Drawing.Bitmap]::new(1, 1)
$dummyG = [System.Drawing.Graphics]::FromImage($dummyBmp)
$totalHeight = & $renderReceipt $dummyG $true
$dummyG.Dispose()
$dummyBmp.Dispose()

$finalHeight = [int][Math]::Ceiling($totalHeight)
Write-Output "Measured receipt height: $finalHeight hundredths of an inch (~$([Math]::Round($finalHeight * 0.254, 1)) mm)"

# --- If preview requested, render to PNG ---
if ($OutputPreview) {
    # Render at 203 DPI (typical thermal) -> scale factor ~2.03
    $scale = 2.03
    $pxW = [int]($pageWidth * $scale)
    $pxH = [int]($finalHeight * $scale)
    $bmp = [System.Drawing.Bitmap]::new($pxW, $pxH)
    $bmp.SetResolution(203, 203)
    $gBmp = [System.Drawing.Graphics]::FromImage($bmp)
    $gBmp.Clear([System.Drawing.Color]::White)
    $gBmp.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
    $gBmp.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    [void]$gBmp.ScaleTransform($scale, $scale)
    
    [void](& $renderReceipt $gBmp $false)
    
    $gBmp.Dispose()
    $bmp.Save($OutputPreview, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Output "Preview saved to: $OutputPreview"
}

# --- Pass 2: Print to POS-80C ---
if (-not $NoPrint) {
    $doc = [System.Drawing.Printing.PrintDocument]::new()
    $doc.PrinterSettings.PrinterName = $PrinterName
    
    if (-not $doc.PrinterSettings.IsValid) {
        Write-Error "Printer '$PrinterName' is not valid or not installed."
        exit 1
    }
    
    # Set paper size dynamically to exact height
    $paperSize = [System.Drawing.Printing.PaperSize]::new("CustomReceipt", [int]$pageWidth, $finalHeight)
    $doc.DefaultPageSettings.PaperSize = $paperSize
    $doc.DefaultPageSettings.Margins = [System.Drawing.Printing.Margins]::new(0, 0, 0, 0)
    
    # Silent printing without modal dialog
    $doc.PrintController = [System.Drawing.Printing.StandardPrintController]::new()
    
    # PrintPage event handler
    $printPageHandler = [System.Drawing.Printing.PrintPageEventHandler]{
        param($sender, $e)
        $e.Graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::SingleBitPerPixelGridFit
        $e.Graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::None
        [void](& $renderReceipt $e.Graphics $false)
        $e.HasMorePages = $false
    }
    
    $doc.add_PrintPage($printPageHandler)
    
    Write-Output "Submitting print job to '$PrinterName'..."
    $doc.Print()
    $doc.Dispose()
    Write-Output "Print job submitted successfully."
}
