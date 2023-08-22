
const foreignCharMap = createForeignCharMap();
const foreignCharRegex = createForeignCharRegex();

export function toPascalCase(text: string): string {
    text = text.substring(0, 1).toUpperCase() + text.substring(1);
    for (let i: number = 1; i < text.length - 1; i++) {
        if (text.charAt(i) === " ") {
            text = text.substring(0, i+1) + text.charAt(i+1).toUpperCase() + text.substring(i+2);
        }
    }
    return text;
}

export function replaceForeignChars(text: string): string {
    return text.replace(foreignCharRegex, char => foreignCharMap.get(char)!);
}

function createForeignCharMap(): Map<string, string> {
    const charMap: Map<string, string> = new Map();

    charMap.set("õ", "o");
    charMap.set("ä", "a");
    charMap.set("ö", "o");
    charMap.set("ü", "u");
    charMap.set("š", "s");
    charMap.set("ž", "z");

    for (const charPair of charMap) {
        charMap.set(charPair[0].toUpperCase(), charPair[1].toUpperCase());
    }

    return charMap;
}

function createForeignCharRegex(): RegExp {
    const keyString = Array.from(foreignCharMap.keys()).join("");
    return new RegExp(`[${keyString}]`, "g")
}
