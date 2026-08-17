import { BadRequestError } from "../../../errors/BadRequestError";

const CANCELLABLE_STATUS = "WAITING_PAYMENT";

export function validateCancellationStatus(status: string | undefined) {
  if (status !== CANCELLABLE_STATUS) {
    throw new BadRequestError("Order cannot be cancelled in its current status");
  }
}

export function validateConfirmationStatus(status?: string) {
  if (status !== "SHIPPED") {
    throw new BadRequestError("Only shipped orders can be confirmed");
  }
}
