export const toTitleCase = (value: string): string =>
    value
        .toLowerCase()
        .replace(/(^|\s)\S/g, (char) => char.toUpperCase());