const PRINTER_SETTINGS_KEY = 'pos_printer_settings'

export const PRINT_PAPER_SIZES = {
    MM58: '58mm',
    MM80: '80mm',
    A4: 'a4',
}

export const DEFAULT_PRINTER_SETTINGS = {
    paperSize: PRINT_PAPER_SIZES.MM80,
    fontSize: 11,
    showFooterNote: true,
}

export function getPrinterSettings() {
    try {
        const raw = localStorage.getItem(PRINTER_SETTINGS_KEY)
        if (!raw) return DEFAULT_PRINTER_SETTINGS
        const parsed = JSON.parse(raw)
        const paperSize = Object.values(PRINT_PAPER_SIZES).includes(parsed?.paperSize)
            ? parsed.paperSize
            : DEFAULT_PRINTER_SETTINGS.paperSize
        const fontSize = Number.isFinite(Number(parsed?.fontSize))
            ? Math.max(9, Math.min(14, Number(parsed.fontSize)))
            : DEFAULT_PRINTER_SETTINGS.fontSize
        const showFooterNote = typeof parsed?.showFooterNote === 'boolean'
            ? parsed.showFooterNote
            : DEFAULT_PRINTER_SETTINGS.showFooterNote
        return { paperSize, fontSize, showFooterNote }
    } catch {
        return DEFAULT_PRINTER_SETTINGS
    }
}

export function savePrinterSettings(settings) {
    const normalized = {
        ...DEFAULT_PRINTER_SETTINGS,
        ...settings,
    }
    localStorage.setItem(PRINTER_SETTINGS_KEY, JSON.stringify(normalized))
    return normalized
}

