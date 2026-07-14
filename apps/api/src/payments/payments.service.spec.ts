import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payments.service';
import { ConfigService } from '@nestjs/config';
import { OrdersService } from '../orders/orders.service';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let configService: Partial<ConfigService>;
  let ordersService: Partial<OrdersService>;

  beforeEach(async () => {
    configService = {
      get: jest.fn((key: string) => {
        // Return mock values for required keys
        const mockConfig: Record<string, string> = {
          PAYOS_CLIENT_ID: 'test_client_id',
          PAYOS_API_KEY: 'test_api_key',
          PAYOS_CHECKSUM_KEY: 'test_checksum_key',
          WEB_URL: 'http://localhost:3000',
        };
        return mockConfig[key] || null;
      }),
    };
    ordersService = {
      setProviderRef: jest.fn(),
      findByProviderRef: jest.fn(),
      confirmPayment: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: ConfigService, useValue: configService },
        { provide: OrdersService, useValue: ordersService },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});