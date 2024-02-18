const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors')
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: '*'
}));




app.get('/search/:keyword', async (req, res) => {
  const keyword = req.params.keyword;
  const products = await scrapeAmazon(keyword);
  res.json(products);
});
async function scrapeAmazon(keyword) {
  const browser = await puppeteer.launch(

  );
  const page = await browser.newPage();
  
  await page.goto(`https://www.amazon.com/s?k=${keyword}`);
  
  const products = await page.evaluate(() => {
    const ratingPattern = /(\d+(\.\d+)?) out of \d+ stars/;
    const results = [];
    const items = document.querySelectorAll("[data-component-type='s-search-result']");
    items.forEach(item => {
      const name = (item.querySelector('h2')?.innerText || "").trim();

      const description = (item.querySelector("[data-cy='title-recipe']").getElementsByTagName('span')[1]?.innerText || "").trim();

      const textR = item.querySelector('.a-popover-trigger')?.querySelector('span')?.innerText || ""
      const match = textR.match(ratingPattern);
      const rating = match ? match[1] : "No rating found";
      
      const reviewCount = item.querySelector('.a-size-base.s-underline-text')?.innerText
      const price = (item.querySelector('.a-price span:last-child')?.innerText?.replace(/\n/g, '') || "not found")
      results.push({ name, description, rating, reviewCount, price });
    });
    return results.slice(0, 4);
  });
  
  await browser.close();
  return products;
}


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
