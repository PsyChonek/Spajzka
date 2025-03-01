const ingredients = new Map();
document.querySelectorAll("div.layout-row").forEach(row => {
    const nameElement = row.querySelector("a.text-subtitle");
    const amountElement = row.querySelector("div.text-subtitle.layout-align-end-center");

    if (nameElement && amountElement) {
        const ingredientName = nameElement.textContent.trim();
        const ingredientAmount = amountElement.textContent.trim();
        const ingredientLink = "https://www.kaloricketabulky.cz" + nameElement.getAttribute("href");
        

        if (!ingredients.has(ingredientName)) {
            ingredients.set(ingredientName, { amount: ingredientAmount, link: ingredientLink });
            console.log(`Ingredient Found: ${ingredientName} - ${ingredientAmount} - ${ingredientLink}`);
        }
    }
});

console.log("Extracted Ingredients:", Array.from(ingredients, ([name, { amount, link }]) => ({ name, amount, link })));
