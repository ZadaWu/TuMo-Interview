import cacheManager from '../util/cacheManager';
import sequelize from '../util/sequelize';

interface AuthorizationData {
    orderId: string;
    transactionId: string;
    cardLast4: string;
    cardBrand: string;
    status: string;
}

interface PaymentUpdateData {
    orderId: string;
    status: string;
    capturedAmount: number;
    capturedAt: Date;
}

interface FailureRecord {
    orderId: string;
    reason?: string;
    responseCode?: string;
    failedAt: Date;
}

interface RefundRecord {
    orderId: string;
    transactionId: string;
    amount: number;
    refundedAt: Date;
}

export class Payment {
    private static KEYS = {
        AUTHORIZATION: (transactionId: string) => `payment:auth:${transactionId}`,
        PAYMENT: (transactionId: string) => `payment:${transactionId}`,
        FAILURE: (orderId: string) => `payment:failure:${orderId}`,
        REFUND: (orderId: string) => `payment:refund:${orderId}`
    };

    async saveAuthorization(data: AuthorizationData): Promise<void> {
        const key = Payment.KEYS.AUTHORIZATION(data.transactionId);
        await cacheManager.set(key, {
            ...data,
            createdAt: new Date().toISOString()
        }, 60 * 60 * 24 * 7); // 7天过期

        // Save to database
        await sequelize.query(`
            INSERT INTO payment_transactions (
                order_id,
                transaction_id,
                status,
                card_last4,
                card_brand,
                created_at
            ) VALUES (
                :orderId,
                :transactionId, 
                :status,
                :cardLast4,
                :cardBrand,
                :createdAt
            )`, {
            replacements: {
                orderId: data.orderId,
                transactionId: data.transactionId,
                status: data.status,
                cardLast4: data.cardLast4,
                cardBrand: data.cardBrand,
                createdAt: new Date()
            }
        });
    }

    async updatePayment(transactionId: string, data: PaymentUpdateData): Promise<void> {
        const key = Payment.KEYS.PAYMENT(transactionId);
        await cacheManager.set(key, {
            ...data,
            capturedAt: data.capturedAt.toISOString(),
            updatedAt: new Date().toISOString()
        }, 60 * 60 * 24 * 30); // 30天过期

        // Update database
        await sequelize.query(`
            INSERT INTO payment_transactions (
                order_id,
                transaction_id,
                status,
                captured_amount,
                captured_at,
                updated_at
            ) VALUES (
                :orderId,
                :transactionId,
                :status,
                :capturedAmount, 
                :capturedAt,
                :updatedAt
            )
            ON DUPLICATE KEY UPDATE
                status = VALUES(status),
                captured_amount = VALUES(captured_amount),
                captured_at = VALUES(captured_at),
                updated_at = VALUES(updated_at)
        `, {
            replacements: {
                orderId: data.orderId,
                status: data.status,
                capturedAmount: data.capturedAmount,
                capturedAt: data.capturedAt,
                updatedAt: new Date(),
                transactionId: transactionId
            }
        });
    }

    async saveFailureRecord(data: FailureRecord): Promise<void> {
        const key = Payment.KEYS.FAILURE(data.orderId);
        await cacheManager.set(key, {
            ...data,
            failedAt: data.failedAt.toISOString()
        }, 60 * 60 * 24 * 7); // 7天过期

        // Update database
        await sequelize.query(`
            UPDATE payment_transactions 
            SET 
                status = 'FAILED',
                failure_reason = :reason,
                response_code = :responseCode,
                updated_at = :failedAt
            WHERE order_id = :orderId
        `, {
            replacements: {
                reason: data.reason,
                responseCode: data.responseCode,
                failedAt: data.failedAt,
                orderId: data.orderId
            }
        });
    }

    async saveRefundRecord(data: RefundRecord): Promise<void> {
        const key = Payment.KEYS.REFUND(data.orderId);
        await cacheManager.set(key, {
            ...data,
            refundedAt: data.refundedAt.toISOString()
        }, 60 * 60 * 24 * 30); // 30天过期

        // Update database
        await sequelize.query(`
            UPDATE payment_transactions 
            SET 
                status = 'REFUNDED',
                captured_amount = captured_amount - :amount,
                updated_at = :refundedAt
            WHERE order_id = :orderId AND transaction_id = :transactionId
        `, {
            replacements: {
                amount: data.amount,
                refundedAt: data.refundedAt,
                orderId: data.orderId,
                transactionId: data.transactionId
            }
        });
    }
}
