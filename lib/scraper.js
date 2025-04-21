const chromium = require('@sparticuz/chromium');

async function getPuppeteerAndOptions() {
    const isLocal = !process.env.VERCEL;
    let puppeteer;
    let launchOptions;

    if (isLocal) {
        puppeteer = require('puppeteer'); // Puppeteer completo local
        launchOptions = {
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        };
    } else {
        puppeteer = require('puppeteer-core'); // En serverless
        launchOptions = {
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath(), // Solo se llama si NO estás en local
            headless: chromium.headless,
        };
    }

    return { puppeteer, launchOptions };
}

async function scrapeMercadoLibre(producto) {
    if (!producto || typeof producto !== 'string') {
        throw new Error('Producto debe ser una cadena de texto válida');
    }

    const { puppeteer, launchOptions } = await getPuppeteerAndOptions();

    const browser = await puppeteer.launch(launchOptions);

    try {
        const page = await browser.newPage();
        const BASE_URL = 'https://autos.mercadolibre.com.ar';
        const query = producto.trim().replace(/\s+/g, '-');
        const url = `${BASE_URL}/${query}`;

        const response = await page.goto(url, {
            waitUntil: 'networkidle2',
            timeout: 30000,
        });

        if (!response.ok()) {
            throw new Error(`Error al cargar la página: ${response.status()}`);
        }

        await page.waitForSelector('.ui-search-layout__item', { timeout: 10000 });

        const preciosNoPesos = await page.evaluate(() => {
            const items = Array.from(document.querySelectorAll('.ui-search-layout__item'));
            const preciosFiltrados = [];

            items.forEach(item => {
                const precioElem = item.querySelector('.andes-money-amount__fraction');
                const simboloElem = item.querySelector('.andes-money-amount__currency-symbol');
                const tituloElem = item.querySelector('.ui-search-item__title');

                if (precioElem && simboloElem) {
                    const simbolo = simboloElem.innerText;
                    const precio = precioElem.innerText;
                    const titulo = tituloElem ? tituloElem.innerText : 'Sin título';
                    const objetoDatosAnuncio = {titulo, simbolo, precio};

                    if (simbolo.includes('U$S') || simbolo.includes('USD') || simbolo.includes('US') ||
                        simbolo.includes('€') || simbolo.includes('£')) {
                        preciosFiltrados.push(objetoDatosAnuncio);
                    }
                }
            });

            return preciosFiltrados;
        });

        return preciosNoPesos;
    } finally {
        await browser.close();
    }
}

module.exports = { scrapeMercadoLibre };