import unittest

from inventory import InventoryManagementSystem


class InventoryManagementSystemTests(unittest.TestCase):
    def setUp(self) -> None:
        self.inventory = InventoryManagementSystem()

    def test_add_and_get_stock(self) -> None:
        self.inventory.add_product("Laptop", 5)
        self.assertEqual(self.inventory.get_stock("Laptop"), 5)

    def test_restock_product(self) -> None:
        self.inventory.add_product("Mouse", 2)
        self.inventory.restock_product("Mouse", 3)
        self.assertEqual(self.inventory.get_stock("Mouse"), 5)

    def test_sell_product_updates_stock(self) -> None:
        self.inventory.add_product("Keyboard", 4)
        self.inventory.sell_product("Keyboard", 1)
        self.assertEqual(self.inventory.get_stock("Keyboard"), 3)

    def test_sell_product_raises_on_insufficient_stock(self) -> None:
        self.inventory.add_product("Headset", 1)
        with self.assertRaises(ValueError):
            self.inventory.sell_product("Headset", 2)

    def test_negative_quantity_is_rejected(self) -> None:
        with self.assertRaises(ValueError):
            self.inventory.add_product("Phone", -1)

    def test_remove_product(self) -> None:
        self.inventory.add_product("Cable", 10)
        self.inventory.remove_product("Cable")
        with self.assertRaises(KeyError):
            self.inventory.get_stock("Cable")


if __name__ == "__main__":
    unittest.main()
