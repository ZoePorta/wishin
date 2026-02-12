// import { ValidationMode } from "../common/validation-mode";
// import { InvalidAttributeError, InvalidTransitionError } from "../errors/domain-errors";

/**
 * Status of transaction.
 */
export enum TransactionStatus {
  RESERVED = "RESERVED",
  PURCHASED = "PURCHASED",
  CANCELLED = "CANCELLED",
}

export interface TransactionProps {
  id: string;
  itemId: string;
  userId?: string;
  guestSessionId?: string;
  status: TransactionStatus;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TransactionCreateReservationProps {
  itemId: string;
  userId: string;
  quantity: number;
}

export interface TransactionCreatePurchaseProps {
  itemId: string;
  userId?: string;
  guestSessionId?: string;
  quantity: number;
}

export class Transaction {
  public get id(): string {
    throw new Error("Method not implemented.");
  }
  public get itemId(): string {
    throw new Error("Method not implemented.");
  }
  public get userId(): string | undefined {
    throw new Error("Method not implemented.");
  }
  public get guestSessionId(): string | undefined {
    throw new Error("Method not implemented.");
  }
  public get status(): TransactionStatus {
    throw new Error("Method not implemented.");
  }
  public get quantity(): number {
    throw new Error("Method not implemented.");
  }
  public get createdAt(): Date {
    throw new Error("Method not implemented.");
  }
  public get updatedAt(): Date {
    throw new Error("Method not implemented.");
  }

  private constructor() {}

  public static createReservation(
    _props: TransactionCreateReservationProps,
  ): Transaction {
    throw new Error("Method not implemented.");
  }

  public static createPurchase(
    _props: TransactionCreatePurchaseProps,
  ): Transaction {
    throw new Error("Method not implemented.");
  }

  public static reconstitute(_props: TransactionProps): Transaction {
    throw new Error("Method not implemented.");
  }

  public cancel(): Transaction {
    throw new Error("Method not implemented.");
  }

  public confirmPurchase(): Transaction {
    throw new Error("Method not implemented.");
  }

  public equals(_other: Transaction): boolean {
    throw new Error("Method not implemented.");
  }

  public toProps(): TransactionProps {
    throw new Error("Method not implemented.");
  }
}
