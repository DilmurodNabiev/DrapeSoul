import asyncio
import logging

from aiogram import Bot, Dispatcher, F
from aiogram.filters import CommandStart
from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup, Message, WebAppInfo

from bot.config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def get_shop_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="🛍 Open Shop",
                    web_app=WebAppInfo(url=settings.WEBAPP_URL),
                )
            ]
        ]
    )


async def cmd_start(message: Message):
    welcome = (
        f"✨ Welcome to <b>{settings.APP_NAME}</b>!\n\n"
        "Discover premium fashion curated for you.\n"
        "Tap the button below to open our shop."
    )
    await message.answer(welcome, reply_markup=get_shop_keyboard(), parse_mode="HTML")


async def main():
    if not settings.BOT_TOKEN:
        logger.error("BOT_TOKEN is not set. Exiting.")
        return

    bot = Bot(token=settings.BOT_TOKEN)
    dp = Dispatcher()

    dp.message.register(cmd_start, CommandStart())

    @dp.message(F.text)
    async def fallback(message: Message):
        await message.answer(
            "Use /start to open the shop.",
            reply_markup=get_shop_keyboard(),
        )

    logger.info("Telegram bot started for %s", settings.APP_NAME)
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())
