const puppeteer = require('puppeteer');

async function scrapeData(url, titleSelector, contentSelector) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });

    const titles = await page.$$eval(titleSelector, els => els.map(el => el.innerText.trim()));
    const contents = await page.$$eval(contentSelector, els => els.map(el => el.innerHTML));

    const data = titles.map((title, index) => ({
        title: title,
        content: contents[index] ? contents[index].replace(/<[^>]*>/g, '') : ''
    }));

    await browser.close();

    return data;
}

module.exports = { scrapeData };
