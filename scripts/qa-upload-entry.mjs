import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = process.env.QA_UPLOAD_PREVIEW || 'http://127.0.0.1:8098/';
const browser = await chromium.launch();
const checked = [];
const uploadUrl = (query = '') => new URL(`${query}#/material/subir`, base).href;

try {
  for (const width of [1440, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 850 } });
    const contributionRequests = [];
    page.on('request', request => {
      if (request.url().includes('/material-contributions')) contributionRequests.push(request.url());
    });

    await page.goto(new URL('?qa=1&static=1#/material', base).href, { waitUntil: 'networkidle' });
    await page.getByRole('link', { name: 'Subir material' }).click();
    await page.getByRole('link', { name: 'Abrir formulario en ceicucn.cl' }).waitFor();
    assert.equal(await page.locator('form[data-form="upload-material"]').count(), 0);
    assert.equal(await page.locator('a[href="https://ceicucn.cl/#/material/subir"]').getAttribute('target'), '_blank');
    assert.ok((await page.evaluate(() => document.documentElement.scrollWidth)) <= width);
    assert.deepEqual(contributionRequests, []);
    checked.push(`static preview ${width}px`);

    await page.goto(uploadUrl('?qa=1'), { waitUntil: 'networkidle' });
    await page.getByRole('link', { name: 'Abrir formulario en ceicucn.cl' }).waitFor();
    assert.equal(await page.locator('form[data-form="upload-material"]').count(), 0);
    checked.push(`direct local reload ${width}px`);

    const apiPage = await browser.newPage({ viewport: { width, height: 850 } });
    await apiPage.route('**/api/bootstrap', route => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, data: {} })
    }));
    await apiPage.goto(uploadUrl('?qa=1'), { waitUntil: 'networkidle' });
    await apiPage.locator('form[data-form="upload-material"] button[type="submit"]:not([disabled])').waitFor({ timeout: 5000 });
    assert.equal(await apiPage.locator('a[href="https://ceicucn.cl/#/material/subir"]').count(), 0);
    checked.push(`API-backed form ${width}px`);
    assert.deepEqual(contributionRequests, []);
    await apiPage.close();
    await page.close();
  }
  console.log(JSON.stringify({ ok: true, checked }));
} finally {
  await browser.close();
}
