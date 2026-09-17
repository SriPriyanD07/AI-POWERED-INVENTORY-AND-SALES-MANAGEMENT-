-- =============================================================================
-- SMARTRETAIL DBMS MINI-PROJECT (DA2)
-- SCRIPT: 04_basic_queries.sql
-- DESCRIPTION: Basic SQL Queries demonstrating SELECT, WHERE, ORDER BY,
--              DISTINCT, LIKE, IN, BETWEEN, IS NULL, UPDATE, and DELETE.
-- =============================================================================

SET PAGESIZE 50;
SET LINESIZE 120;
COLUMN product_name FORMAT A35;
COLUMN supplier_name FORMAT A30;
COLUMN email FORMAT A30;
COLUMN full_name FORMAT A25;
COLUMN receipt_number FORMAT A15;

PROMPT =========================================================================;
PROMPT EXECUTING 04_basic_queries.sql — Basic SQL Query Demonstrations
PROMPT =========================================================================;

-- -----------------------------------------------------------------------------
-- 1. SELECT, WHERE, ORDER BY
-- Description: Retrieve active products priced above 100 in descending price order.
-- -----------------------------------------------------------------------------
PROMPT === Query 1: Active products with standard unit price > 100 ===
SELECT product_id, sku, product_name, unit_of_measure, standard_unit_price
FROM Product
WHERE standard_unit_price > 100.00
  AND is_active = 'TRUE'
ORDER BY standard_unit_price DESC;

-- -----------------------------------------------------------------------------
-- 2. DISTINCT
-- Description: Retrieve distinct units of measure used across the catalog.
-- -----------------------------------------------------------------------------
PROMPT === Query 2: Distinct Units of Measure ===
SELECT DISTINCT unit_of_measure
FROM Product
ORDER BY unit_of_measure;

-- -----------------------------------------------------------------------------
-- 3. LIKE (Pattern Matching)
-- Description: Find suppliers whose email contains 'agro' or company name begins with 'H'.
-- -----------------------------------------------------------------------------
PROMPT === Query 3: Suppliers matching pattern (LIKE) ===
SELECT supplier_id, supplier_name, contact_person, email, city, rating
FROM Supplier
WHERE supplier_name LIKE 'H%' OR email LIKE '%agro%'
ORDER BY rating DESC;

-- -----------------------------------------------------------------------------
-- 4. IN Operator
-- Description: Retrieve employees assigned to Cashier or Manager roles.
-- -----------------------------------------------------------------------------
PROMPT === Query 4: Employees in specific roles (IN) ===
SELECT employee_id, full_name, role, email, hire_date
FROM Employee
WHERE role IN ('CASHIER', 'MANAGER')
ORDER BY role, full_name;

-- -----------------------------------------------------------------------------
-- 5. BETWEEN Operator
-- Description: Find products whose price falls between 40 and 200 inclusive.
-- -----------------------------------------------------------------------------
PROMPT === Query 5: Products priced between 40 and 200 (BETWEEN) ===
SELECT product_id, sku, product_name, standard_unit_price
FROM Product
WHERE standard_unit_price BETWEEN 40.00 AND 200.00
ORDER BY standard_unit_price ASC;

-- -----------------------------------------------------------------------------
-- 6. IS NULL / IS NOT NULL
-- Description: Find sales where customer_id IS NULL (walk-in guest transactions).
-- -----------------------------------------------------------------------------
PROMPT === Query 6: Guest walk-in sales (customer_id IS NULL) ===
SELECT transaction_id, receipt_number, cashier_id, transaction_date, total_amount, status
FROM SalesTransaction
WHERE customer_id IS NULL;

PROMPT === Query 6b: Root categories with no parent (parent_category_id IS NULL) ===
SELECT category_id, category_name
FROM ProductCategory
WHERE parent_category_id IS NULL
ORDER BY category_id;

-- -----------------------------------------------------------------------------
-- 7. DML: UPDATE Demonstration
-- Description: Safely update customer loyalty points and rating of a supplier.
-- -----------------------------------------------------------------------------
PROMPT === DML 7: Update supplier rating for Supplier 1 ===
SELECT supplier_id, supplier_name, rating FROM Supplier WHERE supplier_id = 1;

UPDATE Supplier
SET rating = 4.85
WHERE supplier_id = 1;

SELECT supplier_id, supplier_name, rating AS updated_rating FROM Supplier WHERE supplier_id = 1;
COMMIT;

-- -----------------------------------------------------------------------------
-- 8. DML: INSERT & DELETE Demonstration (Safe Sample Row)
-- Description: Insert a temporary test customer, verify, then safely delete.
-- -----------------------------------------------------------------------------
PROMPT === DML 8: Insert and safe delete of a temporary test customer ===
INSERT INTO Customer (customer_id, first_name, last_name, email, loyalty_points, membership_type, registered_date)
VALUES (999, 'Test', 'Temporary', 'temp.test@smartretail.com', 10, 'REGULAR', SYSDATE);

SELECT customer_id, first_name, last_name, email FROM Customer WHERE customer_id = 999;

DELETE FROM Customer WHERE customer_id = 999;

SELECT COUNT(*) AS count_after_delete FROM Customer WHERE customer_id = 999;
COMMIT;

PROMPT 04_basic_queries.sql completed successfully.
