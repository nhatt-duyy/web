import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { WatermarkService } from './watermark.service';
import JSZip = require('jszip');

describe('WatermarkService', () => {
  let service: WatermarkService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WatermarkService],
    }).compile();
    service = module.get<WatermarkService>(WatermarkService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  const meta = {
    key: 'LIC-abc-1234',
    licenseId: 'lic1',
    email: 'buyer@x.com',
    productTitle: 'Awesome Source',
    productSlug: 'awesome-source',
    orderId: 'ord1',
  };

  it('inject WATERMARK.txt chứa license key + email', async () => {
    const zip = new JSZip();
    zip.file('src/index.js', 'console.log(1)');
    const buf = await zip.generateAsync({ type: 'nodebuffer' });

    const out = await service.addWatermark(buf, meta);
    const rezip = await JSZip.loadAsync(out);
    const content = await rezip.file('WATERMARK.txt')!.async('string');
    expect(content).toContain('LIC-abc-1234');
    expect(content).toContain('buyer@x.com');
    expect(content).toContain('Awesome Source');
    // Không làm hỏng file gốc
    expect(await rezip.file('src/index.js')!.async('string')).toBe('console.log(1)');
  });

  it('ghi đè nếu WATERMARK.txt đã tồn tại (idempotent)', async () => {
    const zip = new JSZip();
    zip.file('WATERMARK.txt', 'OLD');
    const buf = await zip.generateAsync({ type: 'nodebuffer' });
    const out = await service.addWatermark(buf, meta);
    const rezip = await JSZip.loadAsync(out);
    const content = await rezip.file('WATERMARK.txt')!.async('string');
    expect(content).toContain('LIC-abc-1234');
    expect(content).not.toContain('OLD');
  });

  it('throw BadRequest nếu input không phải zip', async () => {
    await expect(service.addWatermark(Buffer.from('not a zip'), meta)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('buildContent tạo đúng format truy vết', () => {
    const content: string = (service as any).buildContent(meta);
    expect(content.split('\n')).toEqual([
      'SOURCEBAN WATERMARK',
      'License     : LIC-abc-1234',
      'License ID  : lic1',
      'Product     : Awesome Source (awesome-source)',
      'Owner       : buyer@x.com',
      'Order       : ord1',
      expect.stringContaining('Issued      : '),
      '',
      expect.stringContaining('Note        : '),
      '              file này ở nơi không được phép, vui lòng báo admin@sourceban.com',
      '',
    ]);
  });
});
