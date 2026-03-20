-- Rename PK column from borrow_window_policy_id to consultant_borrow_policy_id
ALTER TABLE "consultant_borrow_policy"
RENAME COLUMN "borrow_window_policy_id" TO "consultant_borrow_policy_id";