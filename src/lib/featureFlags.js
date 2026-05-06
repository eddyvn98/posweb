export const FEATURE_KEYS = {
    SUPPLIER_DEBT: 'supplier_debt_management'
}

export function parseFeatureFlags(rawFlags) {
    if (!rawFlags) return {}
    if (typeof rawFlags === 'object') return rawFlags
    try {
        const parsed = JSON.parse(rawFlags)
        return parsed && typeof parsed === 'object' ? parsed : {}
    } catch {
        return {}
    }
}

export function hasFeatureEnabled(rawFlags, featureKey, defaultValue = false) {
    const flags = parseFeatureFlags(rawFlags)
    if (typeof flags[featureKey] === 'boolean') return flags[featureKey]
    return defaultValue
}
