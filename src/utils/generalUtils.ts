import { Page } from "puppeteer";

export const randomMouseMove = async (page: Page, numMoves: number) => {
  const sleep = (s: number) => {
    return new Promise((resolve) => setTimeout(resolve, s * 1000));
  };

  for (let i = 0; i < numMoves; i++) {
    // Generate random coordinates within the page viewport
    let pageViewport = page.viewport();
    if (!pageViewport) return;
    const randomX = Math.floor(Math.random() * pageViewport.width);
    const randomY = Math.floor(Math.random() * pageViewport.height);
    // Create a new MouseEvent to move the mouse, simulating human behaviour
    await page.evaluate(
      (x: number, y: number) => {
        const element = document.elementFromPoint(x, y);
        const event = new MouseEvent("mousemove", {
          bubbles: true,
          clientX: x,
          clientY: y,
        });
        element?.dispatchEvent(event);
      },
      randomX,
      randomY
    );

    // Add a short delay to simulate human behaviour
    const delay = Math.floor(Math.random() * 2) + 1; // Random delay, to avoid robot detection
    await sleep(delay);
  }
};

// A helper sleep function
export const sleep = (s: number) => {
  return new Promise((resolve) => setTimeout(resolve, s * 1000));
};
