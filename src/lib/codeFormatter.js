/**
 * Format receipt/sale code for display
 * Converts long code to human-readable format
 */

export const formatReceiptCode = (code) => {
    if (!code) return '---'
    
    // If already formatted (HD-xxx-xxxx), return as-is
    if (code.includes('-')) {
        return code
    }
    
    // Convert UUID or long code to formatted version
    // Format: HD-{date}-{sequence}
    // Example: HD-302-000123
    
    // For now, if code doesn't have dashes, add them
    // HD123456789 -> HD-123456-789
    if (code.startsWith('HD') && code.length > 2) {
        const rest = code.substring(2)
        if (rest.length > 4) {
            const part1 = rest.substring(0, rest.length - 6)
            const part2 = rest.substring(rest.length - 6)
            return `HD-${part1}-${part2}`
        }
    }
    
    return code
}

/**
 * Get short code for display (6-8 characters)
 */
export const getShortCode = (code) => {
    if (!code) return '---'
    
    // Remove dashes and get last 8 chars
    const clean = code.replace(/-/g, '')
    return clean.slice(-8).padStart(8, '0')
}

/**
 * Format code for QR code (short version)
 */
export const getQRCode = (code) => {
    if (!code) return '000000'
    
    // Get last 6 digits
    const clean = code.replace(/-/g, '')
    return clean.slice(-6).padStart(6, '0')
}
