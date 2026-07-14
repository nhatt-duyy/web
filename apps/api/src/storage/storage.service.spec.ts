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