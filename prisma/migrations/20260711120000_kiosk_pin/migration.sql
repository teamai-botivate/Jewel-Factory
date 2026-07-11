-- Kiosk device unlock PIN (per store). Null = kiosk open without a PIN.
ALTER TABLE "stores" ADD COLUMN "kiosk_pin_hash" TEXT;
