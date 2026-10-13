/**
 * Sends the sign-in code. In test mode (OTP_DEV_MODE=true) nothing is sent and
 * the code is shown on the verify screen instead.
 *
 * A real SMS provider (for example MSG91 or Twilio) is wired in here before the
 * pilot; until then production sign-in refuses to send rather than failing silently.
 */
export function isOtpDevMode(): boolean {
  return process.env.OTP_DEV_MODE === "true";
}

export async function sendSignInCode(phone: string, code: string): Promise<void> {
  if (isOtpDevMode()) return;
  void phone;
  void code;
  throw new Error("No SMS provider is configured. Set OTP_DEV_MODE=true for testing.");
}
