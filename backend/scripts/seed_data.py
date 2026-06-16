"""Seed sample categories and products for development."""
import asyncio
from decimal import Decimal

from sqlalchemy import select

from app.db.session import AsyncSessionLocal
from app.models.category import Category
from app.models.product import Product, ProductSizeStock
from app.utils.slug import slugify


async def seed():
    async with AsyncSessionLocal() as db:
        existing = await db.execute(select(Category).limit(1))
        if existing.scalar_one_or_none():
            print("Data already seeded, skipping.")
            return

        categories = [
            Category(name="Outerwear", slug="outerwear", sort_order=1),
            Category(name="Dresses", slug="dresses", sort_order=2),
            Category(name="Accessories", slug="accessories", sort_order=3),
        ]
        db.add_all(categories)
        await db.flush()

        products = [
            Product(
                name="Silk Evening Gown",
                slug=slugify("Silk Evening Gown"),
                description="Elegant silk gown with flowing silhouette.",
                price=Decimal("289.00"),
                compare_at_price=Decimal("349.00"),
                category_id=categories[1].id,
                is_featured=True,
                is_new_arrival=True,
                size_stocks=[
                    ProductSizeStock(size="S", stock=5),
                    ProductSizeStock(size="M", stock=8),
                    ProductSizeStock(size="L", stock=3),
                ],
            ),
            Product(
                name="Cashmere Overcoat",
                slug=slugify("Cashmere Overcoat"),
                description="Premium cashmere overcoat for timeless style.",
                price=Decimal("459.00"),
                category_id=categories[0].id,
                is_best_seller=True,
                is_featured=True,
                size_stocks=[
                    ProductSizeStock(size="M", stock=4),
                    ProductSizeStock(size="L", stock=6),
                    ProductSizeStock(size="XL", stock=2),
                ],
            ),
            Product(
                name="Leather Crossbody Bag",
                slug=slugify("Leather Crossbody Bag"),
                description="Handcrafted Italian leather crossbody.",
                price=Decimal("189.00"),
                category_id=categories[2].id,
                is_new_arrival=True,
                size_stocks=[ProductSizeStock(size="OS", stock=12)],
            ),
        ]
        db.add_all(products)
        await db.commit()
        print("Seed data created successfully.")


if __name__ == "__main__":
    asyncio.run(seed())
