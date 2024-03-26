import { Page } from "puppeteer";
import { Product, Item } from "../types/resultTypes";

// Define timeout options to be passed to functions
const timeoutOptions = {
  timeout: 10 * 1000,
};

export const getListingCards = async (
  page: Page,
  numberOfCards: number
): Promise<(Item | null)[]> => {
  try {
    // Evaluating a page with a paramater of the number of desired cards to be retrived
    return await page.evaluate((numberOfCards: number) => {
      // Initiate a empty cards array with the type of Item
      const cards: (Item | null)[] = [];

      // Select all card elements on the page
      const cardElements = document.querySelectorAll(
        ".v2-listing-card a.listing-link"
      );

      // Enter a loop for each of the selected cards
      for (let i = 0; i < numberOfCards; i++) {
        // Define a card as a <a> Element
        const card = cardElements[i] as HTMLAnchorElement;

        // Get the product URL
        const url: string | null = card.getAttribute("href");

        // Get the product info container
        const infoContainer = card.parentElement?.querySelector(
          ".v2-listing-card__info"
        );

        if (!infoContainer) {
          cards.push(null); // If info is not found, return null
          continue;
        }

        // Get the product title
        const titleElement = infoContainer.querySelector(
          ".v2-listing-card__title"
        );

        // Get the product price
        const priceElement = infoContainer.querySelector(
          ".n-listing-card__price"
        );

        // Format the name and the price
        const name = titleElement?.textContent?.trim();
        const price = priceElement?.textContent?.trim();

        if (!url || !name || !price) {
          cards.push(null); // If no information, return null
          continue;
        }

        // Push the object containing product info to the array
        cards.push({ link: url, name, price });
      }
      // Return the cards array with product information
      return cards;
    }, numberOfCards);
  } catch (error) {
    console.log("ERROR IN GETTING PRODUCT ELEMENTS!", error);
    return [];
  }
};

export const chooseSelectOptions = async (page: Page) => {
  try {
    // Wait for select elements to be loaded
    try {
      await page.waitForSelector("select[aria-labelledby]", timeoutOptions);
    } catch (error) {
      console.log("No select elements found! Continue...");
    }

    // Enter page evaluate
    await page.evaluate(() => {
      // Helper function for picking a random option
      const pickRandomElement = (
        array: HTMLOptionElement[]
      ): HTMLOptionElement | null => {
        if (array.length === 0) {
          return null; // Return null if the array is empty
        }
        const randomIndex = Math.floor(Math.random() * array.length);
        return array[randomIndex];
      };

      // Select the personalization textarea if it is present
      let personalizationTextArea: HTMLTextAreaElement | null =
        document.querySelector(
          `textarea[aria-labelledby="personalization-field-label"]`
        );

      if (personalizationTextArea) {
        // Fill the personalization textarea if present, and
        // dispatch the change Event
        personalizationTextArea.value = "Nick Sparrow";
        personalizationTextArea.dispatchEvent(
          new Event("change", { bubbles: true })
        );
      }

      // Get all the available select elements
      let selects: Element[] = Array.from(
        document.querySelectorAll("select[aria-labelledby]")
      );

      // Loop over available select elements
      // picking a random option
      for (let select of selects) {
        if (!select.children) continue;

        // Select all available options with a value
        let options: HTMLOptionElement[] = Array.from(select.children).filter(
          (oneOption) => (oneOption as HTMLOptionElement).value !== ""
        ) as HTMLOptionElement[];

        // Call a helper function to pick a random element
        let randomOption = pickRandomElement(options);

        if (!randomOption) return;
        // Set the value of the select to the picked option value
        (select as HTMLSelectElement).value = randomOption.value;
      }

      // Loop over selects to dispatch change events
      for (let select of selects) {
        (select as HTMLSelectElement).dispatchEvent(
          new Event("change", { bubbles: true })
        );
      }
    });
  } catch (error) {
    console.log(error, `ERROR IN GETTING SELECT!`);
  }
};

export const scrapePageDetails = async (page: any): Promise<Product | null> => {
  try {
    // Wait for relevant selectors to get the details
    await page.waitForSelector(".wt-text-body-01", timeoutOptions);
    await page.waitForSelector(".wt-text-title-larger", timeoutOptions);
    await page.waitForSelector(
      ".listing-page-image-carousel-component .carousel-image",
      timeoutOptions
    );

    // Define a product object
    const product: Product = {
      name: null,
      price: null,
      description: null,
      availableSizes: null,
      images: [],
    };

    // Pick and retrive the products name
    product.name = await page.evaluate(() => {
      const nameSelector = document.querySelector(".wt-text-body-01");
      return nameSelector ? (nameSelector as HTMLElement).innerText : null;
    });

    // Pick and retrive the products price
    product.price = await page.evaluate(() => {
      const priceSelector = document.querySelector(".wt-text-title-larger");
      return priceSelector
        ? (priceSelector as HTMLElement).innerText

            .replace("Price", "")
            .replace(/\n/g, "")
        : null;
    });

    // Pick and retrive the products description
    product.description = await page.evaluate(() => {
      const descriptionSelector = document.querySelector(
        "p[data-product-details-description-text-content]"
      );
      return descriptionSelector
        ? (descriptionSelector as HTMLElement).innerText.replace(/\n/g, "")
        : null;
    });

    // Pick and retrive the products available sizes
    // using a helper function
    product.availableSizes = await getSelectElementOptions(page, "Size");

    // Extract all image URL's from the product page
    let images: string[] | null = await page.evaluate(() => {
      // Pick all image elements
      let images = document.querySelectorAll(
        ".listing-page-image-carousel-component .carousel-image"
      );
      if (!images) return null;
      let finalImages: string[] = [];

      // Extract image src attribute
      for (let i = 0; i < images.length; i++) {
        finalImages.push(images[i].getAttribute("src") || "");
      }
      return finalImages;
    });

    // Set the product image array of source URL's
    product.images = images;

    return product;
  } catch (error) {
    console.log("ERROR IN SCRAPING PAGE DETAILS!", error);
    return null;
  }
};

// Helper function to retrive available sizes of products
const getSelectElementOptions = async (
  page: Page,
  labelText: string
): Promise<string[] | null | undefined> => {
  try {
    // Evaluating the page to pick all the available sizes
    const sizes = await page.evaluate((): string[] | null => {
      // Selecting avaliable options
      let options: NodeListOf<HTMLOptionElement> | undefined = document
        .querySelector('[aria-labelledby="label-variation-selector-0"]')
        ?.querySelectorAll("option");

      if (!options) return null;
      // Mapping the option elements to retrive their values
      // and filtering the ones that have a defined value
      return Array.from(options)
        .map((option) => {
          if (option.value) return option.text;
          else return null;
        })
        .filter(
          (option): option is string => option !== null && option !== undefined
        );
    }, labelText);

    return sizes;
  } catch (error) {
    console.log("ERROR IN GETTING SELECT OPTIONS", error);
    return null;
  }
};

// Helper function to move to the product page
export const moveToProduct = async (page: Page, selector: string) => {
  try {
    // Start a Promise.all with a click on the link and waiting for
    // a navigation event
    await Promise.all([
      await page.evaluate((selector: string) => {
        const element: HTMLLinkElement | null =
          document.querySelector(selector);
        if (element) element.click();
      }, selector),

      await page.waitForNavigation(timeoutOptions),
    ]);
  } catch (error: any) {
    if (error.message.includes("Navigation timeout"))
      console.log("Supposed navigation error! Selector:", selector);
    else console.log(error, "ERROR IN NAVIGATING TO PRODUCT!");
  }
};

// Helper function for submitting a form
export const submitForm = async (page: Page, selector: string) => {
  try {
    // Start a Promise.all with a form submit and
    // waiting for navigation
    return Promise.all([
      await page.evaluate((selector: string) => {
        let form: HTMLFormElement | null = document.querySelector(selector);

        if (form) form.submit();
      }, selector),
      await page.waitForNavigation({ timeout: 60 * 1000 }),
    ]);
  } catch (error) {
    console.log(error, "SUBMIT ERROR");
  }
};

// Helper function for filling the shipping form
export const fillShippingForm = async (page: Page) => {
  try {
    // Awaiting all relavant selectors to appear
    await page.waitForSelector(
      'input[data-selector="email-address-field"]',
      timeoutOptions
    );
    await page.waitForSelector(
      'input[data-selector="email-address-confirmation-field"]',
      timeoutOptions
    );
    await page.waitForSelector('input[data-field="name"]', timeoutOptions);
    await page.waitForSelector(
      'input[data-field="first_line"]',
      timeoutOptions
    );
    await page.waitForSelector('input[data-field="city"]', timeoutOptions);
    await page.waitForSelector(
      'select[data-field="country_id"]',
      timeoutOptions
    );

    // Filling all relavant fields with data
    await page.type(
      'input[data-selector="email-address-field"]',
      "jack.sparrow29182@gmail.com"
    );
    await page.type(
      'input[data-selector="email-address-confirmation-field"]',
      "jack.sparrow29182@gmail.com"
    );
    await page.type('input[data-field="name"]', "Jack Sparrow");
    await page.type('input[data-field="first_line"]', "Novosadska 98");
    await page.type('input[data-field="city"]', "Novi Sad");
  } catch (error) {
    console.log("ERROR IN FILLING THE SHIPPING FORM!", error);
  }
};

// Helper function for clicking a button which takes a selector string
// as a parameter
export const clickButton = async (page: Page, selector: string) => {
  try {
    await page.evaluate((selector) => {
      let button: HTMLButtonElement | null = document.querySelector(selector);
      if (button) button.click();
    }, selector);
  } catch (error) {
    console.log(`ERROR IN CLICKING THE BUTTON! Selector: ${selector}.`, error);
  }
};
