const puppeteer = require("puppeteer-extra");
const pluginStealth = require("puppeteer-extra-plugin-stealth");
const fs = require("fs");

import { Browser, Dialog, Page } from "puppeteer";
import {
  chooseSelectOptions,
  clickButton,
  fillShippingForm,
  getListingCards,
  moveToProduct,
  scrapePageDetails,
  submitForm,
} from "./utils/clientUtils";
import { randomMouseMove, sleep } from "./utils/generalUtils";
import { Item, Product } from "./types/resultTypes";

const scrape = async (
  url: string,
  numberOfCards: number,
  headless: boolean
) => {
  // Init puppeteer with the stealth plugin to enhance robot-detection prevention
  puppeteer.use(pluginStealth());

  // Call the scraping function to extract all required details with the URL as a paramater
  let listingCards: (Item | null)[] = await scrapeWebsite(
    url,
    numberOfCards,
    headless
  );

  // Write the result to a result.json file
  fs.writeFileSync("./result.json", JSON.stringify(listingCards), {
    flag: "a",
  });

  // Inform the user that scraping is completed
  console.log("====== RESULTS WRITTEN ! =======");
};

const scrapeWebsite = async (
  url: string,
  numberOfCards: number,
  headless: boolean
): Promise<(Item | null)[]> => {
  // Launch the browser
  const browser = await puppeteer.launch({
    headless,
    ignoreDefaultArgs: ["--disable-extensions"],
    args: ["--no-sandbox"],
  });

  // Open a new page
  const page = await browser.newPage();

  // Close the page opened by default
  for (const p of await browser.pages()) {
    if (p !== page) {
      await p.close();
    }
  }

  // Set pages viewport
  await page.setViewport({
    width: 1300,
    height: 800,
    deviceScaleFactor: 1,
    hasTouch: false,
    isLandscape: false,
    isMobile: false,
  });

  // Set a UserAgent to mimic real user
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"
  );

  // Move to the given URL
  await page.goto(url);

  // Wait for items to be loaded
  await page.waitForSelector(".v2-listing-card a.listing-link", {
    timeout: 20 * 1000,
  });

  // Call getListingCards function to retrive product data from the entry page
  let listingCards: (Item | null)[] = await getListingCards(
    page,
    numberOfCards
  );

  // For each retrived item, navigate to its page and retrive details
  for (let i = 0; i < listingCards.length; i++) {
    1;
    // Invoking sleep to slow down actions, avoiding robot detection
    await sleep(5);

    // Getting the product link
    let link = listingCards[i]?.link;
    if (link === undefined || link === null) continue;
    // Random mouse movement to simulate human behaviour
    await randomMouseMove(page, 3);
    // Check if current item is the last item
    const isLastItem: boolean = i === listingCards.length - 1;
    // Calling moveToProductAndScrape to navigate to the product page
    // and retrive all relevant details
    let pageDetails = await moveToProductAndScrape(
      browser,
      page,
      link,
      isLastItem
    );

    // Place retrived details in the original object
    if (pageDetails)
      listingCards[i] = { ...listingCards[i], pageDetails: pageDetails };
  }

  browser.close();

  return listingCards;
};

const moveToProductAndScrape = async (
  browser: Browser,
  page: Page,
  src: string,
  lastItem: boolean
): Promise<Product | null> => {
  const selector = `a[href="${src}"]`;

  // Wait for item link to be loaded
  await page.waitForSelector(selector, { timeout: 30 * 1000 });

  // Random mouse movement to simulate human behaviour
  await randomMouseMove(page, 2);

  // Navigate to the product page
  await moveToProduct(page, selector);

  // Retrive the newly opened product page
  const newPage = (await browser.pages()).find((p) => p !== page);

  // Set the new page viewport
  if (newPage) {
    await newPage.setViewport({
      width: 1300,
      height: 800,
      deviceScaleFactor: 1,
      hasTouch: false,
      isLandscape: false,
      isMobile: false,
    });
  }

  if (newPage) {
    // Calling scrapePageDetails to extract all product information
    const details = await scrapePageDetails(newPage);

    // Random mouse movement to simulate human behaviour
    await randomMouseMove(newPage, 3);

    // Calling chooseSelectOptions to make a selection on all
    // <select> elements present on the product page
    // as well as a personalization textbox
    await chooseSelectOptions(newPage);

    // Random mouse movement to simulate human behaviour
    await randomMouseMove(newPage, 2);

    // Call sleep to slow down code execution
    await sleep(2);

    // Submit the Add to Cart form
    await submitForm(newPage, "form[data-buy-box-add-to-cart-form]");

    // Random mouse movement to simulate human behaviour
    await randomMouseMove(newPage, 3);

    // If current item is the last item, initiate checkout
    if (lastItem) {
      await checkout(newPage);
    }

    // Random mouse movement to simulate human behaviour
    await randomMouseMove(newPage, 3);

    await sleep(2);

    // Close the page if the item is not the last one
    if (!lastItem) newPage.close();

    // Return all product details
    return details;
  } else {
    console.error("New page not found.");
    return null;
  }
};

const checkout = async (page: Page) => {
  // Random mouse movement to simulate human behaviour
  await randomMouseMove(page, 3);

  // Wait for the proceed to checkout button to appear
  await page.waitForSelector(".proceed-to-checkout");

  // Click the proceed to checkout button to appear
  await clickButton(page, ".proceed-to-checkout");

  // Wait for the "Continue as a guest" button to appear
  try {
    await Promise.all([
      await page.waitForSelector("#join-neu-continue-as-guest"),
      // Submit the "Continue as a guest" form
      await submitForm(page, "#join-neu-continue-as-guest"),
    ]);
  } catch (error) {
    console.log("Form submit error!");
  }

  // Random mouse movement to simulate human behaviour
  await randomMouseMove(page, 5);

  // Call a helper function to fill the shipping form with data
  await fillShippingForm(page);

  await sleep(3);

  // Random mouse movement to simulate human behaviour
  await randomMouseMove(page, 2);

  // Submit the shipping form
  page.on("dialog", (dialog) => dialog.accept());

  await submitForm(page, "form.wt-validation");
};

scrape("https://www.etsy.com/c/clothing?ref=catnav-374", 1, false);
