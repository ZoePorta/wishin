import type { Transaction } from "../aggregates/transaction";

/**
 * Service specifically for notifying users when their reservations are cancelled due to pruning.
 */
export interface PruningNotificationService {
  /**
   * Notifies users associated with the given cancelled transactions.
   *
   * @param cancelledTransactions - The list of transactions that were cancelled.
   * @returns A Promise that resolves when the notifications have been queued/sent.
   */
  notifyReservationCancelledByPruning(
    cancelledTransactions: Transaction[],
  ): Promise<void>;
}
