/** Turns PostgREST / RPC errors raised by the SQL functions into friendly copy. */
type PgError = { message?: string; details?: string | null; hint?: string | null; code?: string };

export function orderErrorMessage(error: PgError): string {
  const product = error.details || "An item";
  switch (error.message) {
    case "AUTH_REQUIRED":
      return "Please sign in to place your order.";
    case "INVALID_PHONE":
      return "Please enter a valid 10-digit Indian mobile number.";
    case "INVALID_PINCODE":
      return "Please enter a valid 6-digit PIN code.";
    case "INVALID_ADDRESS":
      return "Please complete your name and delivery address.";
    case "CART_EMPTY":
      return "Your bag is empty.";
    case "CART_TOO_LARGE":
      return "Your bag has too many different items for one order.";
    case "INVALID_QUANTITY":
      return "Each item can be ordered in quantities of 1 to 10.";
    case "INVALID_ITEM":
      return "One of the items in your bag is invalid. Please remove it and try again.";
    case "PRODUCT_UNAVAILABLE":
      return `${product} is no longer available. Please remove it from your bag.`;
    case "SIZE_UNAVAILABLE":
      return `${product} is not available in the selected size.`;
    case "INSUFFICIENT_STOCK": {
      const left = Number(error.hint);
      return left > 0
        ? `Only ${left} left of ${product}. Please reduce the quantity.`
        : `${product} just sold out. Please remove it from your bag.`;
    }
    case "PAYMENT_METHOD_UNAVAILABLE":
      return "Only Cash on Delivery is available right now.";
    case "ORDER_NOT_CANCELLABLE":
      return "This order can no longer be cancelled. Please contact us on WhatsApp.";
    case "ORDER_ALREADY_CANCELLED":
      return "This order is cancelled and cannot be reopened.";
    case "ORDER_ALREADY_DELIVERED":
      return "Delivered orders cannot be cancelled.";
    case "STOCK_WOULD_BE_NEGATIVE":
      return "Stock cannot go below zero.";
    case "PRODUCT_NOT_FOUND":
      return "That product no longer exists.";
    case "FORBIDDEN":
      return "Only boutique admins can do that.";
    default:
      return "Something went wrong. Please try again.";
  }
}
