import React from 'react'

export default function SmartPriceInput({
    value,
    onChange,
    onBlur,
    onFocus,
    onClick,
    onKeyDown,
    placeholder = '0',
    className = '',
    inputClassName = '',
    suffixClassName = '',
    min = '0',
    step = '1',
    required = false,
    disabled = false,
    id,
    name,
    inputRef
}) {
    const strVal = value !== undefined && value !== null ? String(value) : ''
    const num = Number(strVal.replace(',', '.'))
    const showThousandsSuffix = strVal.length > 0 && !isNaN(num) && num > 0 && num < 1000

    const handleChange = (e) => {
        let val = e.target.value
        val = val.replace(',', '.')
        if (/^\d*\.?\d*$/.test(val)) {
            e.target.value = val
            if (onChange) onChange(e)
        }
    }

    const handleFocus = (e) => {
        e.target.select()
        if (onFocus) onFocus(e)
    }

    const handleClick = (e) => {
        e.target.select()
        if (onClick) onClick(e)
    }

    const handleContainerClick = (e) => {
        const inputEl = e.currentTarget.querySelector('input')
        if (inputEl && document.activeElement !== inputEl) {
            inputEl.focus()
            inputEl.select()
        }
    }

    return (
        <div
            onClick={handleContainerClick}
            className={`relative flex items-center cursor-text overflow-hidden ${className}`}
        >
            <input
                ref={inputRef}
                id={id}
                name={name}
                type="text"
                inputMode="numeric"
                required={required}
                disabled={disabled}
                value={strVal}
                onChange={handleChange}
                onBlur={onBlur}
                onFocus={handleFocus}
                onClick={handleClick}
                onKeyDown={onKeyDown}
                placeholder={placeholder}
                style={{
                    width: showThousandsSuffix ? `calc(${strVal.length}ch + 2px)` : '100%',
                    minWidth: '1ch'
                }}
                className={`bg-transparent outline-none border-none p-0 focus:ring-0 appearance-none ${inputClassName}`}
            />
            {showThousandsSuffix && (
                <span className={`select-none pointer-events-none opacity-45 font-mono font-bold shrink-0 ${suffixClassName}`}>
                    .000
                </span>
            )}
        </div>
    )
}
