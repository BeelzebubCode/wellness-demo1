-- CreateTable
CREATE TABLE "cancellation_reason" (
    "cancellation_reason_id" SERIAL NOT NULL,
    "cancellation_reason_code" VARCHAR(20) NOT NULL,
    "cancellation_reason_name_th" VARCHAR(100) NOT NULL,
    "cancellation_reason_name_en" VARCHAR(100),
    "cancellation_reason_description" TEXT,
    CONSTRAINT "cancellation_reason_pkey" PRIMARY KEY ("cancellation_reason_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cancellation_reason_cancellation_reason_code_key" ON "cancellation_reason" ("cancellation_reason_code");

-- Step 1: Insert base cancellation reasons (we need at least OTHER for migration)
INSERT INTO
    "cancellation_reason" (
        "cancellation_reason_code",
        "cancellation_reason_name_th",
        "cancellation_reason_name_en",
        "cancellation_reason_description"
    )
VALUES (
        'RESCHEDULE',
        'เปลี่ยนวัน/เวลาไม่สะดวก',
        'Schedule Change',
        'ต้องการเปลี่ยนแปลงวันหรือเวลานัดหมาย'
    ),
    (
        'FEELING_BETTER',
        'อาการดีขึ้น',
        'Feeling Better',
        'อาการดีขึ้นและไม่จำเป็นต้องรับคำปรึกษาแล้ว'
    ),
    (
        'EMERGENCY',
        'มีเหตุฉุกเฉิน',
        'Emergency',
        'เกิดเหตุฉุกเฉินที่ไม่สามารถมาตามนัดได้'
    ),
    (
        'WRONG_BOOKING',
        'จองผิด',
        'Wrong Booking',
        'จองนัดหมายผิดพลาด'
    ),
    (
        'LOCATION_ISSUE',
        'ไม่สะดวกเรื่องสถานที่/การเดินทาง',
        'Location/Travel Issue',
        'ไม่สะดวกในการเดินทางมาตามสถานที่นัดหมาย'
    ),
    (
        'OTHER',
        'อื่น ๆ',
        'Other',
        'เหตุผลอื่นๆ ที่ไม่อยู่ในหมวดหมู่ที่กำหนด'
    );

-- Step 2: Add nullable cancellation_reason_id column first
ALTER TABLE "booking_cancellation"
ADD COLUMN "cancellation_reason_id" INTEGER;

-- Step 3: Add booking_cancellation_note column
ALTER TABLE "booking_cancellation"
ADD COLUMN "booking_cancellation_note" TEXT;

-- Step 4: Migrate existing data - set all to OTHER and move text to note
UPDATE "booking_cancellation"
SET
    "cancellation_reason_id" = (
        SELECT "cancellation_reason_id"
        FROM "cancellation_reason"
        WHERE
            "cancellation_reason_code" = 'OTHER'
    ),
    "booking_cancellation_note" = "booking_cancellation_reason";

-- Step 5: Make cancellation_reason_id NOT NULL
ALTER TABLE "booking_cancellation"
ALTER COLUMN "cancellation_reason_id"
SET NOT NULL;

-- Step 6: Drop old text reason column
ALTER TABLE "booking_cancellation"
DROP COLUMN "booking_cancellation_reason";

-- CreateIndex
CREATE INDEX "booking_cancellation_cancellation_reason_id_idx" ON "booking_cancellation" ("cancellation_reason_id");

-- AddForeignKey
ALTER TABLE "booking_cancellation"
ADD CONSTRAINT "booking_cancellation_cancellation_reason_id_fkey" FOREIGN KEY ("cancellation_reason_id") REFERENCES "cancellation_reason" ("cancellation_reason_id") ON DELETE RESTRICT ON UPDATE CASCADE;