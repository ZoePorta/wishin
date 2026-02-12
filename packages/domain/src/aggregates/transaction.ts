// import { ValidationMode } from "../common/validation-mode";
// import { InvalidAttributeError, InvalidTransitionError } from "../errors/domain-errors";

/**
 * Type of transaction.
 */
export enum TransactionType {
  RESERVATION = "RESERVATION",
  PURCHASE = "PURCHASE",
}

/**
 * Status of transaction.
 */
export enum TransactionStatus {
  ACTIVE = "ACTIVE",
  CANCELLED = "CANCELLED",
}

export interface TransactionProps {
  id: string;
  itemId: string;
  userId?: string;
  guestSessionId?: string;
  type: TransactionType;
  status: TransactionStatus;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TransactionCreateProps {
  itemId: string;
  userId?: string;
  guestSessionId?: string;
  type: TransactionType;
  quantity: number;
  createdAt?: Date;
  updatedAt?: Date;
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
  public get type(): TransactionType {
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

  public static create(_props: TransactionCreateProps): Transaction {
    throw new Error("Method not implemented.");
  }

  public static reconstitute(_props: TransactionProps): Transaction {
    throw new Error("Method not implemented.");
  }

  public cancel(): Transaction {
    throw new Error("Method not implemented.");
  }

  public equals(_other: Transaction): boolean {
    throw new Error("Method not implemented.");
  }

  public toProps(): TransactionProps {
    throw new Error("Method not implemented.");
  }
}
