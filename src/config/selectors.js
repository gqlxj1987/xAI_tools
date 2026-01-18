export const selectors = {
  taskCard: '[data-testid="task"]',
  username: '[data-testid="username"]',
  timestamp: '[data-testid="time"]',
  text: '[data-testid="content"]',
  originalLink: 'a[data-testid="original"]'
};

export const requiredSelectors = Object.values(selectors);
