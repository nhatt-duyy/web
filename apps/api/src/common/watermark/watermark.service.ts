import { Injectable, BadRequestException } from '@nestjs/common';
import JSZip = require('jszip');

export interface WatermarkMeta {
  key: string;
  licenseId: string;
  email: string;
  productTitle: string;
  productSlug: string;
  orderId: string;
}

@Injectable()
export class WatermarkService {
  /**
   * Thêm file WATERMARK.txt truy vết vào trong gói zip.
   * Không sửa nội dung file gốc → không làm hỏng source code người mua.
   * Trả về buffer zip mới.
   */
  async addWatermark(zipBuffer: Buffer, meta: WatermarkMeta): Promise<Buffer> {
    let zip: JSZip;
    try {
      zip = await JSZip.loadAsync(zipBuffer);
    } catch {
      throw new BadRequestException('File source không phải định dạng zip hợp lệ');
    }

    const content = this.buildContent(meta);
    // ghi đè nếu đã tồn tại (idempotent)
    zip.file('WATERMARK.txt', content);

    return zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
    });
  }

  private buildContent(meta: WatermarkMeta): string {
    return [
      'SOURCEBAN WATERMARK',
      'License     : ' + meta.key,
      'License ID  : ' + meta.licenseId,
      'Product     : ' + meta.productTitle + ' (' + meta.productSlug + ')',
      'Owner       : ' + meta.email,
      'Order       : ' + meta.orderId,
      'Issued      : ' + new Date().toISOString(),
      '',
      'Note        : File này được cấp cho tài khoản trên. Nếu bạn tìm thấy',
      '              file này ở nơi không được phép, vui lòng báo admin@sourceban.com',
      '',
    ].join('\n');
  }
}
