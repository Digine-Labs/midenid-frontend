import { Word } from '@miden-sdk/miden-sdk';

/**
 * Decodes a numeric value back to its character representation.
 * 1-26: a-z, 27-36: 0-9
 * Returns null for invalid values.
 */
export function decodeChar(encoded: number): string | null {
    switch (encoded) {
        case 1: return 'a';
        case 2: return 'b';
        case 3: return 'c';
        case 4: return 'd';
        case 5: return 'e';
        case 6: return 'f';
        case 7: return 'g';
        case 8: return 'h';
        case 9: return 'i';
        case 10: return 'j';
        case 11: return 'k';
        case 12: return 'l';
        case 13: return 'm';
        case 14: return 'n';
        case 15: return 'o';
        case 16: return 'p';
        case 17: return 'q';
        case 18: return 'r';
        case 19: return 's';
        case 20: return 't';
        case 21: return 'u';
        case 22: return 'v';
        case 23: return 'w';
        case 24: return 'x';
        case 25: return 'y';
        case 26: return 'z';
        case 27: return '0';
        case 28: return '1';
        case 29: return '2';
        case 30: return '3';
        case 31: return '4';
        case 32: return '5';
        case 33: return '6';
        case 34: return '7';
        case 35: return '8';
        case 36: return '9';
        default: return null;
    }
}

/**
 * Decodes a Word back into a domain name.
 *
 * Reverses the encoding process from encodeDomain().
 *
 * @param encodedDomain - Encoded domain Word
 * @returns Decoded domain name string
 * @throws Error if an invalid character code is encountered
 */
export function decodeDomain(encodedDomain: Word): string {
    const felts = encodedDomain.toFelts();

    // Extract length from the 4th felt
    const length = Number(felts[3].asInt());

    // Extract the three data felts
    const felt1 = felts[0].asInt();
    const felt2 = felts[1].asInt();
    const felt3 = felts[2].asInt();

    const decodedChars: string[] = [];

    // Decode characters from each felt (7 characters per felt, 8 bits each)
    for (let i = 0; i < length; i++) {
        let charCode: number;

        if (i < 7) {
            // First 7 characters from felt3
            charCode = Number((felt3 >> BigInt(i * 8)) & 0xFFn);
        } else if (i < 14) {
            // Next 7 characters from felt2
            charCode = Number((felt2 >> BigInt((i - 7) * 8)) & 0xFFn);
        } else {
            // Remaining characters from felt1
            charCode = Number((felt1 >> BigInt((i - 14) * 8)) & 0xFFn);
        }

        const chr = decodeChar(charCode);
        if (chr === null) {
            throw new Error(`Invalid character code ${charCode} at position ${i}`);
        }
        decodedChars.push(chr);
    }

    return decodedChars.join('');
}

/**
 * Decodes a domain name from a Word stored in slot 4 (ID -> Name mapping).
 *
 * Format: Word[length, chars_1-7, chars_8-14, chars_15-20]
 */
export function decodeDomainFromWordOld(word: Word): string {
    const felts = word.toFelts();

    // Length is in the last felt (reversed storage)
    const length = Number(felts[3].asInt());

    if (length === 0) {
        return '';
    }

    const bytes: number[] = [];

    // Decode 3 character chunks (7 chars each)
    for (let i = 0; i < 3; i++) {
        const feltValue = felts[2 - i].asInt();

        for (let j = 0; j < 7; j++) {
            if (bytes.length >= length) break;

            const byte = Number((feltValue >> BigInt(j * 8)) & 0xFFn);
            if (byte !== 0) {
                bytes.push(byte);
            }
        }

        if (bytes.length >= length) break;
    }

    return new TextDecoder().decode(new Uint8Array(bytes));
}
