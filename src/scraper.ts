import chromium from '@sparticuz/chromium';
import { Browser, Page } from 'puppeteer-core';

interface CarListing {
    titulo: string;
    simbolo: string;
    precio: string;
}

async function getPuppeteerAndOptions() {
    const isLocal = !process.env.VERCEL;
    let puppeteer;
    let launchOptions: any;

    if (isLocal) {
        puppeteer = require('puppeteer');
        launchOptions = {
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        };
    } else {
        puppeteer = require('puppeteer-core');
        launchOptions = {
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath(),
            headless: chromium.headless,
        };
    }

    return { puppeteer, launchOptions };
}

export async function scrapeMercadoLibre(producto: string): Promise<CarListing[]> {
    if (!producto || typeof producto !== 'string') {
        throw new Error('Producto debe ser una cadena de texto válida');
    }

    const { puppeteer, launchOptions } = await getPuppeteerAndOptions();
    let browser: Browser | null = null;

    try {
        browser = await puppeteer.launch(launchOptions);
        const page: Page = await browser!.newPage();
        const BASE_URL = 'https://autos.mercadolibre.com.ar';
        const query = producto.trim().replace(/\s+/g, '-');
        const url = `${BASE_URL}/${query}`;

        const response = await page.goto(url, {
            waitUntil: 'networkidle2',
            timeout: 30000,
        });

        if (!response?.ok()) {
            throw new Error(`Error al cargar la página: ${response?.status()}`);
        }

        await page.waitForSelector('.ui-search-layout__item', { timeout: 10000 });

        const preciosNoPesos = await page.evaluate(() => {
            const items = Array.from(document.querySelectorAll('.ui-search-layout__item'));
            const preciosFiltrados: CarListing[] = [];

            items.forEach(item => {
                const precioElem = item.querySelector('.andes-money-amount__fraction');
                const simboloElem = item.querySelector('.andes-money-amount__currency-symbol');
                const tituloElem = item.querySelector('.ui-search-item__title');

                if (precioElem && simboloElem) {
                    const simbolo = simboloElem.textContent || '';
                    const precio = precioElem.textContent || '';
                    const titulo = tituloElem ? tituloElem.textContent || 'Sin título' : 'Sin título';

                    if (simbolo.includes('U$S') || simbolo.includes('USD') || simbolo.includes('US') ||
                        simbolo.includes('€') || simbolo.includes('£')) {
                        preciosFiltrados.push({ titulo, simbolo, precio });
                    }
                }
            });

            return preciosFiltrados;
        });

        return preciosNoPesos;
    } finally {
        if (browser) await browser.close();
    }
}