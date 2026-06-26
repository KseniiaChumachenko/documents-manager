ALTER TABLE `item` RENAME COLUMN `priceInputVATFree` TO `priceSaleVATFree`;--> statement-breakpoint
ALTER TABLE `item` RENAME COLUMN `priceOutputVATFree` TO `priceCostVATFree`;
