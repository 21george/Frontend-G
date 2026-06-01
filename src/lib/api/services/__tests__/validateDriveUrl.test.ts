import { describe, it, expect } from 'vitest';
import { validateDriveUrl } from '../workout-plans';

describe('validateDriveUrl', () => {
  describe('valid URLs', () => {
    it('accepts Google Drive file URLs', () => {
      expect(validateDriveUrl('https://drive.google.com/file/d/abc123/view')).toBeNull();
    });

    it('accepts Google Docs spreadsheets', () => {
      expect(validateDriveUrl('https://docs.google.com/spreadsheets/d/xyz/export')).toBeNull();
    });

    it('accepts Google Drive usercontent', () => {
      expect(validateDriveUrl('https://drive.googleusercontent.com/export?id=123')).toBeNull();
    });
  });

  describe('invalid URLs', () => {
    it('rejects non-URLs', () => {
      expect(validateDriveUrl('not-a-url')).toContain('valid URL');
      expect(validateDriveUrl('')).toContain('valid URL');
      expect(validateDriveUrl('://missing-scheme')).toContain('valid URL');
    });

    it('rejects non-HTTPS schemes', () => {
      expect(validateDriveUrl('http://drive.google.com/file/d/abc')).toContain('HTTPS');
      expect(validateDriveUrl('ftp://drive.google.com/file')).toContain('HTTPS');
    });

    it('rejects disallowed hostnames', () => {
      expect(validateDriveUrl('https://evil.com/fake-drive')).toContain('Google Drive');
      expect(validateDriveUrl('https://drive.google.com.evil.com/steal')).toContain('Google Drive');
      expect(validateDriveUrl('https://notgoogle.com/drive')).toContain('Google Drive');
    });

    it('rejects raw IP addresses', () => {
      expect(validateDriveUrl('https://8.8.8.8/steal')).toContain('IP address');
    });

    it('rejects private IP addresses', () => {
      expect(validateDriveUrl('https://127.0.0.1/steal')).toContain('Private');
      expect(validateDriveUrl('https://10.0.0.1/steal')).toContain('Private');
      expect(validateDriveUrl('https://172.16.5.5/steal')).toContain('Private');
      expect(validateDriveUrl('https://172.20.0.1/steal')).toContain('Private');
      expect(validateDriveUrl('https://192.168.1.1/steal')).toContain('Private');
      expect(validateDriveUrl('https://192.168.0.100/steal')).toContain('Private');
      expect(validateDriveUrl('https://169.254.1.1/steal')).toContain('Private');
    });
  });
});
