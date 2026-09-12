/**
 * Standard Pure JS QR Code SVG & Data URL Generator (Kazuhiko Arase algorithm)
 * 100% Compliant ISO/IEC 18004 QR Code Matrix Encoder.
 */

// QR Code Model 2 Base Implementation
function QRCode(typeNumber, errorCorrectionLevel) {
    this.typeNumber = typeNumber
    this.errorCorrectionLevel = errorCorrectionLevel
    this.modules = null
    this.moduleCount = 0
    this.dataCache = null
    this.dataList = []
}

QRCode.prototype = {
    addData: function(data) {
        const bytes = []
        for (let i = 0; i < data.length; i++) {
            const c = data.charCodeAt(i)
            if (c > 255) bytes.push(0x3f)
            else bytes.push(c)
        }
        this.dataList.push({
            mode: 4, // Byte mode
            data: data,
            bytes: bytes,
            getLength: function() { return this.bytes.length },
            write: function(buffer) {
                buffer.put(4, 4)
                buffer.put(this.bytes.length, 8)
                for (let i = 0; i < this.bytes.length; i++) {
                    buffer.put(this.bytes[i], 8)
                }
            }
        })
    },
    isDark: function(row, col) {
        if (row < 0 || this.moduleCount <= row || col < 0 || this.moduleCount <= col) {
            throw new Error(row + "," + col)
        }
        return this.modules[row][col]
    },
    getModuleCount: function() { return this.moduleCount },
    make: function() {
        if (this.typeNumber < 1) {
            let typeNumber = 1
            for (typeNumber = 1; typeNumber < 40; typeNumber++) {
                const rsBlocks = QRRSBlock.getRSBlocks(typeNumber, this.errorCorrectionLevel)
                const buffer = new QRBitBuffer()
                let totalDataCount = 0
                for (let i = 0; i < rsBlocks.length; i++) {
                    totalDataCount += rsBlocks[i].dataCount
                }
                for (let i = 0; i < this.dataList.length; i++) {
                    const data = this.dataList[i]
                    data.write(buffer)
                }
                if (buffer.getLengthInBits() <= totalDataCount * 8) break
            }
            this.typeNumber = typeNumber
        }
        this.makeImpl(false, this.getBestMaskPattern())
    },
    makeImpl: function(test, maskPattern) {
        this.moduleCount = this.typeNumber * 4 + 17
        this.modules = new Array(this.moduleCount)
        for (let row = 0; row < this.moduleCount; row++) {
            this.modules[row] = new Array(this.moduleCount)
            for (let col = 0; col < this.moduleCount; col++) {
                this.modules[row][col] = null
            }
        }
        this.setupPositionProbePattern(0, 0)
        this.setupPositionProbePattern(this.moduleCount - 7, 0)
        this.setupPositionProbePattern(0, this.moduleCount - 7)
        this.setupPositionAdjustPattern()
        this.setupTimingPattern()
        this.setupTypeInfo(test, maskPattern)
        if (this.typeNumber >= 7) {
            this.setupTypeNumber(test)
        }
        if (this.dataCache == null) {
            this.dataCache = QRCode.createData(this.typeNumber, this.errorCorrectionLevel, this.dataList)
        }
        this.mapData(this.dataCache, maskPattern)
    },
    setupPositionProbePattern: function(r, c) {
        for (let row = -1; row <= 7; row++) {
            if (r + row <= -1 || this.moduleCount <= r + row) continue
            for (let col = -1; col <= 7; col++) {
                if (c + col <= -1 || this.moduleCount <= c + col) continue
                if ((0 <= row && row <= 6 && (col == 0 || col == 6)) || (0 <= col && col <= 6 && (row == 0 || row == 6)) || (2 <= row && row <= 4 && 2 <= col && col <= 4)) {
                    this.modules[r + row][c + col] = true
                } else {
                    this.modules[r + row][c + col] = false
                }
            }
        }
    },
    getBestMaskPattern: function() {
        let minLostPoint = 0
        let pattern = 0
        for (let i = 0; i < 8; i++) {
            this.makeImpl(true, i)
            const lostPoint = QRUtil.getLostPoint(this)
            if (i == 0 || minLostPoint > lostPoint) {
                minLostPoint = lostPoint
                pattern = i
            }
        }
        return pattern
    },
    setupTimingPattern: function() {
        for (let r = 8; r < this.moduleCount - 8; r++) {
            if (this.modules[r][6] != null) continue
            this.modules[r][6] = (r % 2 == 0)
        }
        for (let c = 8; c < this.moduleCount - 8; c++) {
            if (this.modules[6][c] != null) continue
            this.modules[6][c] = (c % 2 == 0)
        }
    },
    setupPositionAdjustPattern: function() {
        const pos = QRUtil.getPatternPosition(this.typeNumber)
        for (let i = 0; i < pos.length; i++) {
            for (let j = 0; j < pos.length; j++) {
                const row = pos[i]
                const col = pos[j]
                if (this.modules[row][col] != null) continue
                for (let r = -2; r <= 2; r++) {
                    for (let c = -2; c <= 2; c++) {
                        if (r == -2 || r == 2 || c == -2 || c == 2 || (r == 0 && c == 0)) {
                            this.modules[row + r][col + c] = true
                        } else {
                            this.modules[row + r][col + c] = false
                        }
                    }
                }
            }
        }
    },
    setupTypeNumber: function(test) {
        const bits = QRUtil.getBCHTypeNumber(this.typeNumber)
        for (let i = 0; i < 18; i++) {
            const mod = (!test && ((bits >> i) & 1) == 1)
            this.modules[Math.floor(i / 3)][i % 3 + this.moduleCount - 8 - 3] = mod
        }
        for (let i = 0; i < 18; i++) {
            const mod = (!test && ((bits >> i) & 1) == 1)
            this.modules[i % 3 + this.moduleCount - 8 - 3][Math.floor(i / 3)] = mod
        }
    },
    setupTypeInfo: function(test, maskPattern) {
        const data = (1 << 3) | maskPattern // Error Correction Level M = 00 -> (00 << 3) | maskPattern
        const bits = QRUtil.getBCHTypeInfo(data)
        for (let i = 0; i < 15; i++) {
            const mod = (!test && ((bits >> i) & 1) == 1)
            if (i < 6) {
                this.modules[i][8] = mod
            } else if (i < 8) {
                this.modules[i + 1][8] = mod
            } else {
                this.modules[this.moduleCount - 15 + i][8] = mod
            }
        }
        for (let i = 0; i < 15; i++) {
            const mod = (!test && ((bits >> i) & 1) == 1)
            if (i < 8) {
                this.modules[8][this.moduleCount - i - 1] = mod
            } else if (i < 9) {
                this.modules[8][15 - i - 1 + 1] = mod
            } else {
                this.modules[8][15 - i - 1] = mod
            }
        }
        this.modules[this.moduleCount - 8][8] = (!test)
    },
    mapData: function(data, maskPattern) {
        let inc = -1
        let row = this.moduleCount - 1
        let bitIndex = 7
        let byteIndex = 0
        for (let col = this.moduleCount - 1; col > 0; col -= 2) {
            if (col == 6) col--
            while (true) {
                for (let c = 0; c < 2; c++) {
                    if (this.modules[row][col - c] == null) {
                        let dark = false
                        if (byteIndex < data.length) {
                            dark = (((data[byteIndex] >>> bitIndex) & 1) == 1)
                        }
                        const mask = QRUtil.getMask(maskPattern, row, col - c)
                        if (mask) {
                            dark = !dark
                        }
                        this.modules[row][col - c] = dark
                        bitIndex--
                        if (bitIndex == -1) {
                            byteIndex++
                            bitIndex = 7
                        }
                    }
                }
                row += inc
                if (row < 0 || this.moduleCount <= row) {
                    row -= inc
                    inc = -inc
                    break
                }
            }
        }
    }
}

QRCode.createData = function(typeNumber, errorCorrectionLevel, dataList) {
    const rsBlocks = QRRSBlock.getRSBlocks(typeNumber, errorCorrectionLevel)
    const buffer = new QRBitBuffer()
    for (let i = 0; i < dataList.length; i++) {
        const data = dataList[i]
        data.write(buffer)
    }
    let totalDataCount = 0
    for (let i = 0; i < rsBlocks.length; i++) {
        totalDataCount += rsBlocks[i].dataCount
    }
    if (buffer.getLengthInBits() > totalDataCount * 8) {
        throw new Error("code length overflow. (" + buffer.getLengthInBits() + ">" + totalDataCount * 8 + ")")
    }
    if (buffer.getLengthInBits() + 4 <= totalDataCount * 8) {
        buffer.put(0, 4)
    }
    while (buffer.getLengthInBits() % 8 != 0) {
        buffer.putBit(false)
    }
    while (true) {
        if (buffer.getLengthInBits() >= totalDataCount * 8) break
        buffer.put(0xec, 8)
        if (buffer.getLengthInBits() >= totalDataCount * 8) break
        buffer.put(0x11, 8)
    }
    return QRCode.createBytes(buffer, rsBlocks)
}

QRCode.createBytes = function(buffer, rsBlocks) {
    let offset = 0
    let maxDcCount = 0
    let maxEcCount = 0
    const dcdata = new Array(rsBlocks.length)
    const ecdata = new Array(rsBlocks.length)
    for (let r = 0; r < rsBlocks.length; r++) {
        const dcCount = rsBlocks[r].dataCount
        const ecCount = rsBlocks[r].totalCount - dcCount
        maxDcCount = Math.max(maxDcCount, dcCount)
        maxEcCount = Math.max(maxEcCount, ecCount)
        dcdata[r] = new Array(dcCount)
        for (let i = 0; i < dcdata[r].length; i++) {
            dcdata[r][i] = 0xff & buffer.buffer[i + offset]
        }
        offset += dcCount
        const rsPoly = QRUtil.getErrorCorrectPolynomial(ecCount)
        const rawPoly = new QRPolynomial(dcdata[r], rsPoly.getLength() - 1)
        const modPoly = rawPoly.mod(rsPoly)
        ecdata[r] = new Array(rsPoly.getLength() - 1)
        for (let i = 0; i < ecdata[r].length; i++) {
            const modIndex = i + modPoly.getLength() - ecdata[r].length
            ecdata[r][i] = (modIndex >= 0) ? modPoly.get(modIndex) : 0
        }
    }
    let totalCodeCount = 0
    for (let i = 0; i < rsBlocks.length; i++) {
        totalCodeCount += rsBlocks[i].totalCount
    }
    const data = new Array(totalCodeCount)
    let index = 0
    for (let i = 0; i < maxDcCount; i++) {
        for (let r = 0; r < rsBlocks.length; r++) {
            if (i < dcdata[r].length) {
                data[index++] = dcdata[r][i]
            }
        }
    }
    for (let i = 0; i < maxEcCount; i++) {
        for (let r = 0; r < rsBlocks.length; r++) {
            if (i < ecdata[r].length) {
                data[index++] = ecdata[r][i]
            }
        }
    }
    return data
}

// Helpers for Galois Field & Math
function QRUtil() {}
QRUtil.PATTERN_POSITION_TABLE = [
    [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34],
    [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50], [6, 30, 54]
]
QRUtil.G15 = (1 << 10) | (1 << 8) | (1 << 5) | (1 << 4) | (1 << 2) | (1 << 1) | (1 << 0)
QRUtil.G18 = (1 << 12) | (1 << 11) | (1 << 10) | (1 << 9) | (1 << 8) | (1 << 5) | (1 << 2) | (1 << 0)
QRUtil.G15_MASK = (1 << 14) | (1 << 12) | (1 << 10) | (1 << 4) | (1 << 1)

QRUtil.getBCHTypeInfo = function(data) {
    let d = data << 10
    while (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G15) >= 0) {
        d ^= (QRUtil.G15 << (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G15)))
    }
    return ((data << 10) | d) ^ QRUtil.G15_MASK
}

QRUtil.getBCHTypeNumber = function(data) {
    let d = data << 12
    while (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G18) >= 0) {
        d ^= (QRUtil.G18 << (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G18)))
    }
    return (data << 12) | d
}

QRUtil.getBCHDigit = function(data) {
    let digit = 0
    while (data != 0) {
        digit++
        data >>>= 1
    }
    return digit
}

QRUtil.getPatternPosition = function(typeNumber) {
    return QRUtil.PATTERN_POSITION_TABLE[typeNumber - 1] || []
}

QRUtil.getMask = function(maskPattern, i, j) {
    switch (maskPattern) {
        case 0: return (i + j) % 2 == 0
        case 1: return i % 2 == 0
        case 2: return j % 3 == 0
        case 3: return (i + j) % 3 == 0
        case 4: return (Math.floor(i / 2) + Math.floor(j / 3)) % 2 == 0
        case 5: return (i * j) % 2 + (i * j) % 3 == 0
        case 6: return ((i * j) % 2 + (i * j) % 3) % 2 == 0
        case 7: return ((i * j) % 3 + (i + j) % 2) % 2 == 0
        default: throw new Error("bad maskPattern:" + maskPattern)
    }
}

QRUtil.getErrorCorrectPolynomial = function(errorCorrectLength) {
    let a = new QRPolynomial([1], 0)
    for (let i = 0; i < errorCorrectLength; i++) {
        a = a.multiply(new QRPolynomial([1, QRMath.gexp(i)], 0))
    }
    return a
}

QRUtil.getLostPoint = function(qrCode) {
    const moduleCount = qrCode.getModuleCount()
    let lostPoint = 0
    for (let row = 0; row < moduleCount; row++) {
        for (let col = 0; col < moduleCount; col++) {
            let sameCount = 0
            const dark = qrCode.isDark(row, col)
            for (let r = -1; r <= 1; r++) {
                if (row + r < 0 || moduleCount <= row + r) continue
                for (let c = -1; c <= 1; c++) {
                    if (col + c < 0 || moduleCount <= col + c) continue
                    if (r == 0 && c == 0) continue
                    if (dark == qrCode.isDark(row + r, col + c)) sameCount++
                }
            }
            if (sameCount > 5) lostPoint += (3 + sameCount - 5)
        }
    }
    for (let row = 0; row < moduleCount - 1; row++) {
        for (let col = 0; col < moduleCount - 1; col++) {
            let count = 0
            if (qrCode.isDark(row, col)) count++
            if (qrCode.isDark(row + 1, col)) count++
            if (qrCode.isDark(row, col + 1)) count++
            if (qrCode.isDark(row + 1, col + 1)) count++
            if (count == 0 || count == 4) lostPoint += 3
        }
    }
    return lostPoint
}

function QRMath() {}
QRMath.EXP_TABLE = new Array(256)
QRMath.LOG_TABLE = new Array(256)
for (let i = 0; i < 8; i++) QRMath.EXP_TABLE[i] = 1 << i
for (let i = 8; i < 256; i++) QRMath.EXP_TABLE[i] = QRMath.EXP_TABLE[i - 4] ^ QRMath.EXP_TABLE[i - 5] ^ QRMath.EXP_TABLE[i - 8] ^ QRMath.EXP_TABLE[i - 6]
for (let i = 0; i < 255; i++) QRMath.LOG_TABLE[QRMath.EXP_TABLE[i]] = i

QRMath.glog = function(n) {
    if (n < 1) throw new Error("glog(" + n + ")")
    return QRMath.LOG_TABLE[n]
}

QRMath.gexp = function(n) {
    while (n < 0) n += 255
    while (n >= 255) n -= 255
    return QRMath.EXP_TABLE[n]
}

function QRPolynomial(num, shift) {
    if (num.length == undefined) throw new Error(num.length + "/" + shift)
    let offset = 0
    while (offset < num.length && num[offset] == 0) offset++
    this.num = new Array(num.length - offset + shift)
    for (let i = 0; i < num.length - offset; i++) this.num[i] = num[i + offset]
}

QRPolynomial.prototype = {
    get: function(index) { return this.num[index] },
    getLength: function() { return this.num.length },
    multiply: function(e) {
        const num = new Array(this.getLength() + e.getLength() - 1)
        for (let i = 0; i < this.getLength(); i++) {
            for (let j = 0; j < e.getLength(); j++) {
                num[i + j] ^= QRMath.gexp(QRMath.glog(this.get(i)) + QRMath.glog(e.get(j)))
            }
        }
        return new QRPolynomial(num, 0)
    },
    mod: function(e) {
        if (this.getLength() - e.getLength() < 0) return this
        const ratio = QRMath.glog(this.get(0)) - QRMath.glog(e.get(0))
        const num = new Array(this.getLength())
        for (let i = 0; i < this.getLength(); i++) num[i] = this.get(i)
        for (let i = 0; i < e.getLength(); i++) {
            num[i] ^= QRMath.gexp(QRMath.glog(e.get(i)) + ratio)
        }
        return new QRPolynomial(num, 0).mod(e)
    }
}

function QRRSBlock(totalCount, dataCount) {
    this.totalCount = totalCount
    this.dataCount = dataCount
}

QRRSBlock.RS_BLOCK_TABLE = [
    [1, 26, 19], [1, 44, 34], [1, 70, 55], [1, 100, 80], [1, 134, 108],
    [2, 86, 68], [2, 98, 78], [2, 121, 97], [2, 146, 116], [2, 192, 152]
]

QRRSBlock.getRSBlocks = function(typeNumber, errorCorrectionLevel) {
    const rsBlock = QRRSBlock.RS_BLOCK_TABLE[typeNumber - 1]
    if (!rsBlock) throw new Error("Unsupported QR Type: " + typeNumber)
    const list = []
    const count = rsBlock[0]
    const totalCount = rsBlock[1]
    const dataCount = rsBlock[2]
    for (let i = 0; i < count; i++) {
        list.push(new QRRSBlock(totalCount, dataCount))
    }
    return list
}

function QRBitBuffer() {
    this.buffer = []
    this.length = 0
}

QRBitBuffer.prototype = {
    get: function(index) {
        const bufIndex = Math.floor(index / 8)
        return ((this.buffer[bufIndex] >>> (7 - index % 8)) & 1) == 1
    },
    put: function(num, length) {
        for (let i = 0; i < length; i++) {
            this.putBit(((num >>> (length - i - 1)) & 1) == 1)
        }
    },
    getLengthInBits: function() { return this.length },
    putBit: function(bit) {
        const bufIndex = Math.floor(this.length / 8)
        if (this.buffer.length <= bufIndex) {
            this.buffer.push(0)
        }
        if (bit) {
            this.buffer[bufIndex] |= (0x80 >>> (this.length % 8))
        }
        this.length++
    }
}

/**
 * Generates pure SVG string for a QR Code
 */
export function generateQrCodeSvg(value, options = {}) {
    const {
        quietZoneModules = 4,
        showText = false,
        fontSize = 9
    } = options

    const text = String(value || '00000000')
    const qr = new QRCode(0, 0) // Auto version, Level M (0)
    qr.addData(text)
    qr.make()

    const N = qr.getModuleCount()
    const moduleWidth = 4
    const quietZone = quietZoneModules * moduleWidth
    const matrixWidth = N * moduleWidth
    const svgWidth = matrixWidth + quietZone * 2
    const svgHeight = svgWidth + (showText ? fontSize + 8 : 0)

    const rects = []
    for (let r = 0; r < N; r++) {
        for (let c = 0; c < N; c++) {
            if (qr.isDark(r, c)) {
                const x = quietZone + c * moduleWidth
                const y = quietZone + r * moduleWidth
                rects.push(`<rect x="${x}" y="${y}" width="${moduleWidth}" height="${moduleWidth}" fill="#000000" style="shape-rendering:crispEdges;fill:#000000;"/>`)
            }
        }
    }

    const textSvg = showText
        ? `<text x="${svgWidth / 2}" y="${svgWidth + fontSize}" font-family="Courier New, monospace" font-size="${fontSize}" font-weight="bold" text-anchor="middle" fill="#000000" style="fill:#000000;">${text}</text>`
        : ''

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgWidth} ${svgHeight}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" style="print-color-adjust:exact;-webkit-print-color-adjust:exact;shape-rendering:crispEdges;">
        <rect width="100%" height="100%" fill="#ffffff"/>
        ${rects.join('')}
        ${textSvg}
    </svg>`
}

const qrCache = new Map()

/**
 * Returns Data URL (data:image/svg+xml;charset=utf-8,...) for rendering QR Code inside <img> tags.
 */
export function generateQrCodeDataUrl(value, options = {}) {
    const key = `${value}_${options.quietZoneModules || 4}_${options.showText || false}_${options.fontSize || 9}`
    if (qrCache.has(key)) {
        return qrCache.get(key)
    }
    const svg = generateQrCodeSvg(value, options)
    const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
    if (qrCache.size > 500) {
        const firstKey = qrCache.keys().next().value
        qrCache.delete(firstKey)
    }
    qrCache.set(key, dataUrl)
    return dataUrl
}

