const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

const PS_SCRIPT = path.join(__dirname, '..', 'scripts', 'printReceipt.ps1');
const DEFAULT_PRINTER = process.env.PRINTER_NAME || 'POS-80C';

/**
 * Print a receipt using the Windows thermal printer script
 * @param {Object} data - { sale, shop, printerName }
 * @returns {Promise<{success: boolean, message: string, output?: string}>}
 */
function printReceipt(data) {
    return new Promise((resolve, reject) => {
        const { sale, shop, printerName = DEFAULT_PRINTER } = data || {};

        if (!sale) {
            return reject(new Error('Dữ liệu đơn hàng (sale) không hợp lệ.'));
        }

        const tempDir = path.join(os.tmpdir(), 'pos_receipts');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        const tempFile = path.join(tempDir, `receipt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.json`);
        
        try {
            fs.writeFileSync(tempFile, JSON.stringify({ sale, shop }), 'utf8');
        } catch (err) {
            return reject(new Error(`Không thể tạo file tạm in bill: ${err.message}`));
        }

        const args = [
            '-NoProfile',
            '-ExecutionPolicy', 'Bypass',
            '-File', PS_SCRIPT,
            '-JsonPath', tempFile,
            '-PrinterName', printerName
        ];

        execFile('powershell.exe', args, { windowsHide: true, timeout: 15000 }, (error, stdout, stderr) => {
            // Clean up temp file
            try {
                if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
            } catch (e) {
                // Ignore cleanup error
            }

            if (error) {
                console.error('[PrintService Error]', error, stderr);
                return reject(new Error(stderr?.trim() || error.message || 'Lỗi khi gửi lệnh in tới máy in'));
            }

            console.log('[PrintService Success]', stdout.trim());
            resolve({
                success: true,
                message: `Đã gửi lệnh in tới máy in ${printerName}`,
                output: stdout.trim()
            });
        });
    });
}

/**
 * Get available printers on the server
 */
function getInstalledPrinters() {
    return new Promise((resolve, reject) => {
        const psCommand = 'Get-Printer | Select-Object Name, PortName, PrinterStatus | ConvertTo-Json -Compress';
        execFile('powershell.exe', ['-NoProfile', '-Command', psCommand], { windowsHide: true, timeout: 5000 }, (error, stdout, stderr) => {
            if (error) {
                return reject(error);
            }
            try {
                let printers = JSON.parse(stdout.trim());
                if (!Array.isArray(printers)) printers = [printers];
                resolve(printers);
            } catch (e) {
                resolve([]);
            }
        });
    });
}

module.exports = {
    printReceipt,
    getInstalledPrinters,
    DEFAULT_PRINTER
};
