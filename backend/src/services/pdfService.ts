import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import fs from 'fs/promises';
import path from 'path';
import { logger } from '../utils/logger';

export const pdfService = {
  async extractText(filePath: string): Promise<string> {
    const ext = path.extname(filePath).toLowerCase();

    try {
      const buffer = await fs.readFile(filePath);

      if (ext === '.pdf') {
        logger.info({ filePath }, 'Extracting text from PDF');
        const data = await pdfParse(buffer);
        return this.cleanText(data.text);
      }

      if (ext === '.docx') {
        logger.info({ filePath }, 'Extracting text from DOCX');
        const result = await mammoth.extractRawText({ buffer });
        return this.cleanText(result.value);
      }

      if (ext === '.doc') {
        throw new Error('Formato .doc não é suportado. Por favor, converta para .docx');
      }

      throw new Error(`Formato não suportado: ${ext}. Use PDF ou DOCX.`);
    } catch (error) {
      logger.error({ error, filePath }, 'Error extracting text from file');
      throw error;
    }
  },

  async getPageCount(filePath: string): Promise<number> {
    const ext = path.extname(filePath).toLowerCase();

    try {
      if (ext === '.pdf') {
        const buffer = await fs.readFile(filePath);
        const data = await pdfParse(buffer);
        return data.numpages;
      }

      // DOCX doesn't have a concept of pages, estimate based on content
      const text = await this.extractText(filePath);
      // Average ~3000 characters per page
      return Math.max(1, Math.ceil(text.length / 3000));
    } catch (error) {
      logger.error({ error, filePath }, 'Error getting page count');
      return 1;
    }
  },

  cleanText(text: string): string {
    return text
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      // Fix common OCR issues
      .replace(/\|/g, 'l')
      // Remove control characters
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      // Normalize line breaks
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      // Reduce multiple line breaks
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  },

  async getFileInfo(filePath: string): Promise<{
    size: number;
    pages: number;
    textLength: number;
  }> {
    const stats = await fs.stat(filePath);
    const pages = await this.getPageCount(filePath);
    const text = await this.extractText(filePath);

    return {
      size: stats.size,
      pages,
      textLength: text.length,
    };
  },

  isValidFormat(filename: string): boolean {
    const ext = path.extname(filename).toLowerCase();
    return ['.pdf', '.docx'].includes(ext);
  },

  getFileExtension(filename: string): string {
    return path.extname(filename).toLowerCase();
  },
};
