import { chromium } from 'npm:playwright@^1';

const SIGNIN_URL =
    'https://authorize.kobo.com/se/en/Signin?returnUrl=https%3a%2f%2fwww.kobo.com%2fse%2fen%2faccount%2fwishlist';
const WISHLIST_URL = 'https://www.kobo.com/se/en/account/wishlist';

const LOGIN = Deno.env.get('KOBO_LOGIN');
const PASS = Deno.env.get('KOBO_PASS');

if (!LOGIN || !PASS) {
    console.error('Needs KOBO_LOGIN and KOBO_PW');
    Deno.exit(1);
}

const browser = await chromium.launch();
const page = await browser.newPage();

await page.goto(SIGNIN_URL);
await page.screenshot({path: './lol.png'});
await page.locator('#LogInModel_UserName').fill(LOGIN);
await page.locator('#LogInModel_Password').fill(PASS);

const nav = page.waitForURL(WISHLIST_URL);

await page.getByRole('button', { name: 'Logga in' }).click();

await nav;

console.log(page.getByText('My Wishlist').textContent);

await browser.close();
