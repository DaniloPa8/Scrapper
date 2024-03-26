Puppeteer Web Scraping Project

# Description

This project utilizes Puppeteer, a Node library, to perform web scraping tasks on a Etsy website. It extracts data from a target website, such as product details, and performs actions like navigation, form submission, and clicking buttons to simulate user behavior. The goal is to retrive product details of the first 10 listed products, simulating adding them to a cart and also simulate a checkout process.

# Project Setup Instructions

To set up the project locally, follow these steps:

Clone the repository:
git clone https://github.com/yourusername/puppeteer-web-scraping.git

Install the npm packages:
npm install

To run the project, run the command:
npm run start

The entry url is to the clothes section, as that section consistently has a Size selector, which
is one of the required project paramaters.

# Assumptions Made During Development

During the development process, the following assumptions were made:

The target website structure remains consistent for the scraping to function correctly.
User interaction with the website, such as clicking buttons and filling forms, is necessary to access desired data while avoiding robot detection.

# Challenges Faced and How They Were Overcome

Throughout the development process, the following challenges were encountered and addressed:

Handling Dynamic Content: Some web pages have dynamically loaded content which required waiting for elements to become available before scraping.
Solution: Implemented functions to wait for specific selectors to appear using Puppeteer's waitForSelector method.

Emulating Human Behavior: To avoid detection by the website anti-robot measures, it was necessary to simulate human behavior such as mouse movements and random delays which slowed the code executuion, thus mimicking human behaviour on a website.
Solution: Integrated functions to perform random mouse movements and added sleep delays between actions.

Navigating Complex Page Structures: Navigating through multi-page structures and extracting relevant data required careful handling.
Solution: Created functions to navigate between pages, retrieve product details, and interact with elements such as buttons and forms.

# Additional Features or Improvements

In addition to the core scraping functionality, the following features were implemented:
Random Mouse Movements: Simulated human-like mouse movements to mimic natural browsing behavior.
Dynamic Form Filling: Automated filling of shipping forms with randomized data for checkout simulations.
Headless Browser Stealth Mode: Enabled stealth mode to prevent detection by websites and bypass anti-bot measures.

# Final word

This README provides an overview of the project, setup instructions, assumptions made during development, challenges faced, and additional features implemented. Adjustments can be made as necessary based on specific project requirements and enhancements.
