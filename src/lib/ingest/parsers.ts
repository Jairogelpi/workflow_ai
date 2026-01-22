'use server';

import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';

/**
 * Universal Extraction Engine (Server Side)
 * High-fidelity extraction for the WorkGraph OS.
 */

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
    try {
        // @ts-ignore - The library uses a class-based API in this version
        const parser = new PDFParse({ data: new Uint8Array(buffer) });
        const result = await parser.getText();
        return result.text;
    } catch (error) {
        console.error('Extraction Error (PDF):', error);
        throw new Error('Failed to extract text from PDF');
    }
}

export async function extractTextFromDocx(buffer: Buffer): Promise<string> {
    try {
        const result = await mammoth.extractRawText({ buffer });
        return result.value;
    } catch (error) {
        console.error('Extraction Error (Docx):', error);
        throw new Error('Failed to extract text from Word document');
    }
}

export async function extractTextFromXlsx(buffer: Buffer): Promise<string> {
    try {
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        let text = '';
        workbook.SheetNames.forEach(sheetName => {
            const worksheet = workbook.Sheets[sheetName];
            if (worksheet) {
                text += `\n--- Sheet: ${sheetName} ---\n`;
                text += XLSX.utils.sheet_to_csv(worksheet);
            }
        });
        return text;
    } catch (error) {
        console.error('Extraction Error (Xlsx):', error);
        throw new Error('Failed to extract text from Excel spreadsheet');
    }
}

export async function extractTextFromGeneric(buffer: Buffer): Promise<string> {
    try {
        // Attempt UTF-8 decoding
        const decoder = new TextDecoder('utf-8', { fatal: true });
        return decoder.decode(buffer);
    } catch (error) {
        // Fallback for binary: Hex summary
        const hexPreview = buffer.slice(0, 64).toString('hex').match(/.{1,2}/g)?.join(' ') || '';
        return `[Binary/Unknown Artifact]\n\nHex Preview (first 64 bytes):\n${hexPreview}\n\nThis file is stored as an opaque artifact.`;
    }
}
