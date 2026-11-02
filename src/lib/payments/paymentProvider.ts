/**
 * Payment Provider Abstraction Layer
 * Requirement 4.5: Payment through a payment abstraction layer with a MOCK provider.
 * Do not store card details.
 */

export interface PaymentOrderRequest {
  orderNumber: string;
  amountHkd: number;
  currency: string;
  customerEmail: string;
  customerName: string;
}

export interface PaymentResult {
  success: boolean;
  transactionRef: string;
  provider: string;
  paidAt: string;
  error?: string;
}

export interface IPaymentProvider {
  processPayment(request: PaymentOrderRequest): Promise<PaymentResult>;
}

export class MockPaymentProvider implements IPaymentProvider {
  async processPayment(request: PaymentOrderRequest): Promise<PaymentResult> {
    // Generate secure mock transaction reference
    const txnId = `TXN_MOCK_HK_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    // Simulate instant safe authorization
    return {
      success: true,
      transactionRef: txnId,
      provider: "MOCK_PAYMENT_GATEWAY_HK",
      paidAt: new Date().toISOString(),
    };
  }
}

// Global singleton instance of PaymentProvider
export const paymentProvider: IPaymentProvider = new MockPaymentProvider();
