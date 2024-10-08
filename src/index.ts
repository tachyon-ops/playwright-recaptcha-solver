import { Page } from 'playwright-core';
import axios from 'axios';

const rnd = (max, min) => Math.floor(Math.random() * (max - min)) + min;

export async function solveCaptcha(page: Page) {
    const anchorIframe = page.frameLocator('iframe[src*="api2/anchor"]');
    const reCaptchaIframe = page.frameLocator('iframe[src*="api2/bframe"]');

    await anchorIframe.locator('#recaptcha-anchor').click({ delay: rnd(150, 30) });
    await reCaptchaIframe.locator('#recaptcha-audio-button').click({ delay: rnd(150, 30) });

    const audioLink = reCaptchaIframe.locator('#audio-source');

    while (true) {
        const audioCaptcha = await page.waitForResponse(await audioLink.getAttribute('src'));
        try {
            const { data } = await axios.post('https://api.wit.ai/speech?v=2021092', await audioCaptcha.body(), {
                headers: {
                    Authorization: 'Bearer JVHWCNWJLWLGN6MFALYLHAPKUFHMNTAC',
                    'Content-Type': 'audio/mpeg3',
                },
            });

            const audioTranscript = data.match('"text": "(.*)",')[1].trim();

            await reCaptchaIframe.locator('#audio-response').type(audioTranscript, { delay: rnd(75, 30) });

            await reCaptchaIframe.locator('#recaptcha-verify-button').click({ delay: rnd(150, 30) });

            await anchorIframe.locator('#recaptcha-anchor[aria-checked="true"]').waitFor();

            return page.evaluate(() => document.getElementById('g-recaptcha-response')['value']);
        } catch (e) {
            console.error(e);
            await reCaptchaIframe.locator('#recaptcha-reload-button').click({ delay: rnd(150, 30) });
        }
    }
}
