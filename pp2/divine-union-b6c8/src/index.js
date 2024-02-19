import puppeteer from "@cloudflare/puppeteer";

export default {
	async fetch(request, env) {
		const { searchParams } = new URL(request.url);
		let keyword = searchParams.get("keyword");

		if (keyword) {
			const products = await scrapeAmazon(keyword, env);
			return new Response(JSON.stringify(products), {
				headers: {
					"content-type": "application/json",
				},
			});
		} else {
			return new Response("Please add a ?keyword=yourKeyword parameter");
		}
	},
};

async function scrapeAmazon(keyword, env) {
	const browser = await puppeteer.launch(env.MYBROWSER);
	const page = await browser.newPage();
	await page.goto(`https://www.amazon.com/s?k=${keyword}`);

	const products = await page.evaluate(() => {
		const ratingPattern = /(\d+(\.\d+)?) out of \d+ stars/;
		const results = [];
		const items = document.querySelectorAll("[data-component-type='s-search-result']");
		items.forEach((item) => {
			const name = (item.querySelector('h2')?.innerText || "").trim();
			const description = (item.querySelector("[data-cy='title-recipe']").getElementsByTagName('span')[1]?.innerText || "").trim();
			const textR = item.querySelector('.a-popover-trigger')?.querySelector('span')?.innerText || "";
			const match = textR.match(ratingPattern);
			const rating = match ? match[1] : "No rating found";
			const reviewCount = item.querySelector('.a-size-base.s-underline-text')?.innerText;
			const price = (item.querySelector('.a-price span:last-child')?.innerText?.replace(/\n/g, '') || "not found");
			results.push({ name, description, rating, reviewCount, price });
		});
		return results.slice(0, 4);
	});

	await browser.close();
	return products;
}
