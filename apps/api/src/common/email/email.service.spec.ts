import { Test, TestingModule } from '@nestjs/testing';
import { EmailService } from './email.service';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

describe('EmailService', () => {
  let service: EmailService;
  let sendMail: jest.Mock;
  let config: { get: jest.Mock };

  beforeEach(async () => {
    sendMail = jest.fn().mockResolvedValue({ messageId: '1' });
    jest.spyOn(nodemailer, 'createTransport').mockReturnValue({
      sendMail,
    } as any);
    config = { get: jest.fn((k: string) => (k === 'GMAIL_USER' ? 'u@x.com' : 'pass')) };
    const module: TestingModule = await Test.createTestingModule({
      providers: [EmailService, { provide: ConfigService, useValue: config }],
    }).compile();
    service = module.get<EmailService>(EmailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('sendResetPasswordEmail gửi link chứa token', async () => {
    await service.sendResetPasswordEmail('a@b.c', 'tok123');
    expect(sendMail).toHaveBeenCalled();
    const html = sendMail.mock.calls[0][0].html as string;
    expect(html).toContain('tok123');
    expect(sendMail.mock.calls[0][0].to).toBe('a@b.c');
  });

  it('sendVerificationEmail gửi link xác thực', async () => {
    await service.sendVerificationEmail('a@b.c', 'vtoken');
    expect(sendMail.mock.calls[0][0].html).toContain('vtoken');
  });

  it('sendOrderConfirmation format VND + danh sách items', async () => {
    await service.sendOrderConfirmation('a@b.c', {
      id: 'o1',
      total: 100000,
      items: [{ product: { title: 'P' }, qty: 2, price: 50000 }],
    });
    const html = sendMail.mock.calls[0][0].html as string;
    expect(html).toContain('100.000');
    expect(html).toContain('P');
    expect(sendMail.mock.calls[0][0].subject).toContain('o1');
  });

  it('sendTicketReplyEmail escape HTML trong reply', async () => {
    await service.sendTicketReplyEmail('a@b.c', { subject: 'S', reply: '<script>x</script>' });
    const html = sendMail.mock.calls[0][0].html as string;
    expect(html).toContain('&lt;script&gt;');
    expect(html).not.toContain('<script>x');
  });

  it('sendPaymentSuccess liệt kê source kèm link tải', async () => {
    await service.sendPaymentSuccess('a@b.c', {
      id: 'o1',
      licenses: [{ product: { title: 'Source A' } }],
    });
    const html = sendMail.mock.calls[0][0].html as string;
    expect(html).toContain('Source A');
    expect(html).toContain('/dashboard/orders/o1');
  });

  it('sendCustomRequestNotify gửi thông tin báo giá', async () => {
    await service.sendCustomRequestNotify('admin@x.com', {
      title: 'T',
      type: 'WEB_APP',
      budget: 1000,
      contactName: 'A',
      contactEmail: 'a@b.c',
    });
    expect(sendMail.mock.calls[0][0].to).toBe('admin@x.com');
  });

  it('sendProjectUpdateEmail + sendMilestonePaidEmail không throw', async () => {
    await expect(
      service.sendProjectUpdateEmail('a@b.c', { title: 'P', status: 'IN_PROGRESS' }),
    ).resolves.toBeUndefined();
    await expect(
      service.sendMilestonePaidEmail('a@b.c', { projectTitle: 'P', milestoneName: 'M', amount: 500 }),
    ).resolves.toBeUndefined();
  });
});
