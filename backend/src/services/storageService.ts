import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

export const storageService = {
  async initialize(): Promise<void> {
    try {
      await fs.mkdir(UPLOAD_DIR, { recursive: true });
      logger.info({ uploadDir: UPLOAD_DIR }, 'Storage directory initialized');
    } catch (error) {
      logger.error({ error }, 'Failed to create upload directory');
      throw error;
    }
  },

  async saveFile(
    buffer: Buffer,
    originalName: string,
    userId: string
  ): Promise<{ fileName: string; storagePath: string; fileSize: number }> {
    const ext = path.extname(originalName).toLowerCase();
    const fileName = `${uuidv4()}${ext}`;
    const userDir = path.join(UPLOAD_DIR, userId);
    const storagePath = path.join(userDir, fileName);

    try {
      // Create user directory if it doesn't exist
      await fs.mkdir(userDir, { recursive: true });

      // Write file
      await fs.writeFile(storagePath, buffer);

      const stats = await fs.stat(storagePath);

      logger.info({ fileName, storagePath, fileSize: stats.size }, 'File saved');

      return {
        fileName,
        storagePath,
        fileSize: stats.size,
      };
    } catch (error) {
      logger.error({ error, originalName }, 'Failed to save file');
      throw new Error('Falha ao salvar arquivo. Por favor, tente novamente.');
    }
  },

  async deleteFile(storagePath: string): Promise<void> {
    try {
      await fs.unlink(storagePath);
      logger.info({ storagePath }, 'File deleted');
    } catch (error) {
      // Log but don't throw - file might already be deleted
      logger.warn({ error, storagePath }, 'Failed to delete file (might not exist)');
    }
  },

  async getFile(storagePath: string): Promise<Buffer> {
    try {
      return await fs.readFile(storagePath);
    } catch (error) {
      logger.error({ error, storagePath }, 'Failed to read file');
      throw new Error('Arquivo não encontrado.');
    }
  },

  async fileExists(storagePath: string): Promise<boolean> {
    try {
      await fs.access(storagePath);
      return true;
    } catch {
      return false;
    }
  },

  getAbsolutePath(storagePath: string): string {
    return path.resolve(storagePath);
  },

  async getUserStorageSize(userId: string): Promise<number> {
    const userDir = path.join(UPLOAD_DIR, userId);

    try {
      const files = await fs.readdir(userDir);
      let totalSize = 0;

      for (const file of files) {
        const filePath = path.join(userDir, file);
        const stats = await fs.stat(filePath);
        totalSize += stats.size;
      }

      return totalSize;
    } catch {
      return 0;
    }
  },

  async cleanupUserFiles(userId: string): Promise<void> {
    const userDir = path.join(UPLOAD_DIR, userId);

    try {
      await fs.rm(userDir, { recursive: true, force: true });
      logger.info({ userId }, 'User files cleaned up');
    } catch (error) {
      logger.warn({ error, userId }, 'Failed to cleanup user files');
    }
  },

  formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  },
};
