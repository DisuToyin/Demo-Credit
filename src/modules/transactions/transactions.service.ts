import { TransactionsRepository } from "@/modules/transactions/transactions.repository";
import type {
  ListTransactionsRequestQuery,
  ListTransactionsResult,
  TransactionResponse,
  WalletTransactionRecord,
} from "@/modules/transactions/transactions.types";
import { WalletsRepository } from "@/modules/wallets/wallets.repository";
import { AppError } from "@/utils/app.error";

export class TransactionsService {
  public constructor(
    private readonly transactionsRepository = new TransactionsRepository(),
    private readonly walletsRepository = new WalletsRepository()
  ) {}

  public async listTransactions(
    userId: string,
    query: ListTransactionsRequestQuery
  ): Promise<ListTransactionsResult> {
    const wallet = await this.walletsRepository.findByUserId(null, userId);

    if (!wallet) {
      throw new AppError("Wallet not found.", 404, "WALLET_NOT_FOUND");
    }

    const offset = (query.page - 1) * query.limit;
    const [transactions, total] = await Promise.all([
      this.transactionsRepository.listByWalletId(null, {
        walletId: wallet.id,
        limit: query.limit,
        offset,
      }),
      this.transactionsRepository.countByWalletId(null, wallet.id),
    ]);

    return {
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        total_pages: Math.ceil(total / query.limit),
      },
      transactions: transactions.map((transaction) =>
        this.toTransactionResponse(transaction)
      ),
    };
  }

  private toTransactionResponse(
    transaction: WalletTransactionRecord
  ): TransactionResponse {
    return {
      id: transaction.id,
      type: transaction.type,
      amount: Number(transaction.amount),
      balance_before: Number(transaction.balance_before),
      balance_after: Number(transaction.balance_after),
      reference: transaction.reference,
      related_transaction_id: transaction.related_transaction_id,
      counterparty_wallet_id: transaction.counterparty_wallet_id,
      status: transaction.status,
      description: transaction.description,
      created_at: transaction.created_at,
    };
  }
}
