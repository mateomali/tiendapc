ALTER TABLE products
    ADD COLUMN cash_discount_mode VARCHAR(20) NULL AFTER cash_discount_percentage,
    ADD COLUMN cash_price INT NULL AFTER cash_discount_mode;
