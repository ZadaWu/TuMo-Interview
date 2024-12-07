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

export class Payment {
    private static KEYS = {
        AUTHORIZATION: (transactionId: string) => `payment:auth:${transactionId}`,
        PAYMENT: (transactionId: string) => `payment:${transactionId}`,
        FAILURE: (orderId: string) => `payment:failure:${orderId}`
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
            UPDATE payment_transactions 
            SET 
                status = :status,
                captured_amount = :capturedAmount,
                captured_at = :capturedAt,
                updated_at = :updatedAt
            WHERE transaction_id = :transactionId
        `, {
            replacements: {
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
}
