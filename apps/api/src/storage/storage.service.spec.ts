import { StorageService } from './storage.service';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Mock the AWS SDK clients
jest.mock('@aws-sdk/client-s3');
jest.mock('@aws-sdk/s3-request-presigner');

describe('StorageService', () => {
  let service: StorageService;
  let mockSend: jest.Mock;
  let mockGetSignedUrl: jest.Mock;

  beforeEach(() => {
    // Reset process.env for R2 variables (we'll set dummy values)
    process.env.R2_BUCKET = 'test-bucket';
    process.env.R2_ENDPOINT = 'https://test.r2.cloudflarestorage.com';
    process.env.R2_ACCESS_KEY_ID = 'test-access-key';
    process.env.R2_SECRET_ACCESS_KEY = 'test-secret-key';

    // Create service instance
    service = new StorageService();

    // Mock the S3Client.send method
    mockSend = jest.fn();
    (S3Client.prototype.send as jest.Mock) = mockSend;

    // Mock getSignedUrl
    mockGetSignedUrl = jest.fn();
    (getSignedUrl as jest.Mock) = mockGetSignedUrl;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getObjectBuffer', () => {
    it('gửi GetObjectCommand và trả Buffer từ body', async () => {
      const bytes = new Uint8Array([1, 2, 3, 4]);
      const fakeBody = { transformToByteArray: jest.fn().mockResolvedValue(bytes) };
      mockSend.mockResolvedValue({ Body: fakeBody });

      const buf = await service.getObjectBuffer('products/p-1/source.zip');

      expect(mockSend).toHaveBeenCalledWith(expect.any(GetObjectCommand));
      expect(buf).toBeInstanceOf(Buffer);
      expect(Array.from(buf)).toEqual([1, 2, 3, 4]);
    });
  });

  describe('putObjectBuffer', () => {
    it('gửi PutObjectCommand với body Buffer', async () => {
      const body = Buffer.from('encrypted');
      await service.putObjectBuffer('products/p-1/source.zip.enc', body);
      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(mockSend).toHaveBeenCalledWith(expect.any(PutObjectCommand));
    });

    it('truyền contentType tuỳ chỉnh', async () => {
      const body = Buffer.from('x');
      await service.putObjectBuffer('k', body, 'application/pdf');
      expect(mockSend).toHaveBeenCalledWith(expect.any(PutObjectCommand));
    });
  });

  describe('getPresignedUploadUrl', () => {
    it('trả presigned PUT URL với expiresIn mặc định', async () => {
      const url = 'https://r2/put?sig=zzz';
      mockGetSignedUrl.mockResolvedValue(url);
      const result = await service.getPresignedUploadUrl('products/p-1/source.zip', 'application/zip');
      expect(result).toBe(url);
      expect(mockGetSignedUrl).toHaveBeenCalledWith(
        expect.any(S3Client),
        expect.any(PutObjectCommand),
        { expiresIn: 300 },
      );
    });

    it('dùng expiresIn tuỳ chỉnh', async () => {
      mockGetSignedUrl.mockResolvedValue('https://r2/put?sig=yyy');
      await service.getPresignedUploadUrl('k', 'application/zip', 60);
      expect(mockGetSignedUrl).toHaveBeenCalledWith(
        expect.any(S3Client),
        expect.any(PutObjectCommand),
        { expiresIn: 60 },
      );
    });
  });

  describe('uploadFile', () => {
    it('should call PutObjectCommand with correct parameters', async () => {
      const key = 'test/file.txt';
      const body = Buffer.from('Hello World');
      const contentType = 'text/plain';

      await service.uploadFile(key, body, contentType);

      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(mockSend).toHaveBeenCalledWith(expect.any(PutObjectCommand));
      // We could also inspect the command arguments if needed
    });
  });

  describe('getSignedUrl', () => {
    it('should return a signed URL string', async () => {
      const key = 'test/file.txt';
      const mockUrl = 'https://test.r2.cloudflarestorage.com/test/file.txt?signature=xxx';
      mockGetSignedUrl.mockResolvedValue(mockUrl);

      const url = await service.getSignedUrl(key);

      expect(url).toBe(mockUrl);
      expect(mockGetSignedUrl).toHaveBeenCalledTimes(1);
      expect(getSignedUrl).toHaveBeenCalledWith(
        expect.any(S3Client),
        expect.any(GetObjectCommand),
        { expiresIn: 300 }, // default expiresIn
      );
    });

    it('should use custom expiresIn when provided', async () => {
      const key = 'test/file.txt';
      const mockUrl = 'https://test.r2.cloudflarestorage.com/test/file.txt?signature=yyy';
      mockGetSignedUrl.mockResolvedValue(mockUrl);

      const url = await service.getSignedUrl(key, 60); // 60 seconds

      expect(url).toBe(mockUrl);
      expect(getSignedUrl).toHaveBeenCalledWith(
        expect.any(S3Client),
        expect.any(GetObjectCommand),
        { expiresIn: 60 },
      );
    });
  });
});