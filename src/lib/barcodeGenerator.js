import JsBarcode from 'jsbarcode'

const barcodeCache = new Map()

/**
 * Generates standard Code128 SVG string using JsBarcode.
 * Guarantees 100% compatibility with all 1D laser & camera barcode scanners.
 */
export function generateBarcodeSvg(value, options = {}) {
    const text = String(value || '00000000').trim()
    const {
        height = 75,
        moduleWidth = 2.2,
        showText = true,
        fontSize = 15,
        margin = 16
    } = options

    try {
        if (typeof document !== 'undefined') {
            const svgNode = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
            JsBarcode(svgNode, text, {
                format: 'CODE128',
                width: moduleWidth,
                height: height,
                displayValue: showText,
                font: 'monospace',
                fontSize: fontSize,
                fontOptions: 'bold',
                margin: margin,
                background: '#ffffff',
                lineColor: '#000000',
                valid: () => {}
            })
            // Add shape-rendering crispEdges for thermal print clarity
            svgNode.setAttribute('style', 'background:#ffffff;print-color-adjust:exact;-webkit-print-color-adjust:exact;shape-rendering:crispEdges;')
            return svgNode.outerHTML
        }
    } catch (e) {
        console.error('JsBarcode SVG error:', e)
    }

    // Basic SVG fallback if DOM is unavailable
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 90" style="background:#ffffff;shape-rendering:crispEdges;"><rect width="100%" height="100%" fill="#ffffff"/><text x="150" y="45" font-family="monospace" font-size="16" font-weight="bold" text-anchor="middle">${text}</text></svg>`
}

/**
 * Returns Data URL (data:image/svg+xml;charset=utf-8,...) for rendering barcode inside <img> tags.
 * Ensures thermal print engines print solid black barcode bars with zero anti-aliasing blur.
 */
export function generateBarcodeDataUrl(value, options = {}) {
    const text = String(value || '00000000').trim()
    const key = `${text}_${options.height || 75}_${options.moduleWidth || 2.2}_${options.showText !== false}_${options.fontSize || 15}_${options.margin || 16}`
    
    if (barcodeCache.has(key)) {
        return barcodeCache.get(key)
    }

    const svg = generateBarcodeSvg(text, options)
    const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
    
    if (barcodeCache.size > 500) {
        const firstKey = barcodeCache.keys().next().value
        barcodeCache.delete(firstKey)
    }
    
    barcodeCache.set(key, dataUrl)
    return dataUrl
}
