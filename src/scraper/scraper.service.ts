import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import puppeteer, { Browser } from 'puppeteer';
import * as cheerio from 'cheerio';
import { LottoRepository } from '../lotto/lotto.repository.js';
import { CreateLottoDto } from '../lotto/dto/create-lotto.dto.js';
import { MONTHS } from '../contants/months.constants.js';

@Injectable()
export class ScraperService {
  private readonly logger = new Logger(ScraperService.name);
  constructor(private readonly lottoRepository: LottoRepository) {}

  private parseDrawDate(rawDate: string): Date {
    const parsed = new Date(rawDate);

    if (Number.isNaN(parsed.getTime())) {
      return new Date(NaN);
    }

    const year = parsed.getFullYear();
    const month = parsed.getMonth();
    const day = parsed.getDate();

    // Use noon UTC so the day does not shift when converted back in local time
    return new Date(Date.UTC(year, month, day, 12, 0, 0, 0));
  }

  private parseTableHtml(html: string): CreateLottoDto[] {
    const $ = cheerio.load(html);
    const records: CreateLottoDto[] = [];

    $('table tbody tr').each((_, row) => {
      const cols = $(row).find('td');
      if (cols.length >= 4) {
        const rawGame = $(cols[0]).text().trim();
        const rawCombination = $(cols[1]).text().trim();
        const rawDate = $(cols[2]).text().trim();
        const rawJackpot = $(cols[3]).text().trim();
        const rawWinners = cols.length > 4 ? $(cols[4]).text().trim() : '0';

        const numbers = rawCombination
          .split('-')
          .map((n) => parseInt(n.trim(), 10))
          .filter((n) => !isNaN(n));

        if (numbers.length >= 2 && rawDate) {
          const parsedDate = this.parseDrawDate(rawDate);

          if (!isNaN(parsedDate.getTime())) {
            records.push({
              gameName: rawGame,
              numbers,
              drawDate: parsedDate,
              jackpot: parseFloat(rawJackpot.replace(/,/g, '')) || 0,
              winners: parseInt(rawWinners.replace(/,/g, ''), 10) || 0,
            });
          }
        }
      }
    });

    return records;
  }

  /**
   * Automates the PCSO search form using Puppeteer with resilient selector matching
   */
  async fetchWithBrowser(
    startMonth: string,
    startDay: number,
    endMonth: string,
    endDay: number,
    year: number,
  ): Promise<CreateLottoDto[]> {
    const targetUrl = process.env.PCSO_URL?.trim();
    let browser: Browser | null = null;

    if (!targetUrl) {
      throw new Error('PCSO_URL is not defined in environment variables.');
    }

    try {
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
        ],
      });

      const page = await browser.newPage();

      // Configure viewport and authentic browser headers
      await page.setViewport({ width: 1366, height: 768 });
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
      );

      this.logger.log(`Navigating to ${targetUrl}...`);
      await page.goto(targetUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 60000,
      });

      // 1. Wait for dropdown controls to mount in the DOM
      await page.waitForSelector('select', { timeout: 15000 });

      // 2. Dynamically set all date dropdown values in the browser context
      await page.evaluate(
        (sMonth, sDay, sYear, eMonth, eDay, eYear) => {
          const setSelectValue = (
            partialKeyword: string,
            targetVal: string,
          ) => {
            const select = Array.from(document.querySelectorAll('select')).find(
              (el) =>
                el.name?.toLowerCase().includes(partialKeyword.toLowerCase()) ||
                el.id?.toLowerCase().includes(partialKeyword.toLowerCase()),
            );

            if (select) {
              const option = Array.from(select.options).find(
                (opt) =>
                  opt.value.trim().toLowerCase() === targetVal.toLowerCase() ||
                  opt.text.trim().toLowerCase() === targetVal.toLowerCase(),
              );

              if (option) {
                select.value = option.value;
                select.dispatchEvent(new Event('change', { bubbles: true }));
              }
            }
          };

          // Populate start date
          setSelectValue('startmonth', sMonth);
          setSelectValue('startdate', sDay.toString());
          setSelectValue('startyear', sYear.toString());

          // Populate end date
          setSelectValue('endmonth', eMonth);
          setSelectValue('enddate', eDay.toString());
          setSelectValue('endyear', eYear.toString());
        },
        startMonth,
        startDay,
        year,
        endMonth,
        endDay,
        year,
      );

      // 3. Click the Search/Submit button and wait for the table reload
      await Promise.all([
        page
          .waitForNavigation({ waitUntil: 'networkidle2', timeout: 45000 })
          .catch(() => null),
        page.evaluate(() => {
          const submitBtn = Array.from(
            document.querySelectorAll(
              'input[type="submit"], button, input[type="button"]',
            ),
          ).find((el: any) => {
            const val = (
              el.value ||
              el.name ||
              el.id ||
              el.innerText ||
              ''
            ).toLowerCase();
            return val.includes('search') || val.includes('submit');
          }) as HTMLElement;

          if (submitBtn) {
            submitBtn.click();
          }
        }),
      ]);

      // 4. Extract and parse the rendered DOM
      const html = await page.content();
      return this.parseTableHtml(html);
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  /**
   * Backfill specific month and year
   */
  async runBackfillMonthYear(month: string, year: number) {
    const monthName =
      month.charAt(0).toUpperCase() + month.slice(1).toLowerCase();
    const monthIndex = MONTHS.findIndex(
      (m) => m.toLowerCase() === monthName.toLowerCase(),
    );

    if (monthIndex === -1) {
      throw new Error(`Invalid month: ${month}`);
    }

    const lastDay = new Date(year, monthIndex + 1, 0).getDate();

    this.logger.log(
      `Scraping ${monthName} 1-${lastDay}, ${year} with Puppeteer...`,
    );

    const records = await this.fetchWithBrowser(
      monthName,
      1,
      monthName,
      lastDay,
      year,
    );

    this.logger.log(`Parsed ${records.length} records from table.`);

    if (records.length === 0) {
      return { saved: 0, modified: 0, sample: [] };
    }

    const result = await this.lottoRepository.bulkUpsert(records);

    return {
      saved: result.upserted,
      modified: result.modified,
      sample: records.slice(0, 3),
    };
  }

  /**
   * Backfill Jan 2026 - Present
   */
  async backfill2026() {
    const targetYear = 2026;
    const now = new Date();
    const currentMonthIndex =
      now.getFullYear() === targetYear ? now.getMonth() : 11;
    let total = 0;

    for (let m = 0; m <= currentMonthIndex; m++) {
      const monthName = MONTHS[m];
      const lastDay = new Date(targetYear, m + 1, 0).getDate();

      this.logger.log(`Fetching ${monthName} 1-${lastDay}, ${targetYear}...`);
      try {
        const records = await this.fetchWithBrowser(
          monthName,
          1,
          monthName,
          lastDay,
          targetYear,
        );
        if (records.length > 0) {
          const res = await this.lottoRepository.bulkUpsert(records);
          total += res.upserted + res.modified;
        }
      } catch (err: any) {
        this.logger.error(`Error scraping ${monthName}: ${err.message}`);
      }
    }

    return { totalRecordsProcessed: total };
  }

  /**
   * Automated Daily Cron Job
   * Runs daily at 10:30 PM PST to ensure evening draw results are fully published.
   */
  @Cron('30 22 * * *', { timeZone: 'Asia/Manila' })
  async handleDailyScrape(): Promise<void> {
    this.logger.log('Starting automated daily lotto scrape at 10:30 PM...');
    const now = new Date();
    const month = MONTHS[now.getMonth()];
    const day = now.getDate();
    const year = now.getFullYear();

    try {
      const records = await this.fetchWithBrowser(month, day, month, day, year);

      if (records.length > 0) {
        const result = await this.lottoRepository.bulkUpsert(records);
        this.logger.log(
          `Daily sync complete: ${result.upserted} inserted, ${result.modified} updated.`,
        );
      } else {
        this.logger.warn(`No draws found for ${month} ${day}, ${year}.`);
      }
    } catch (err: any) {
      this.logger.error(`Daily scraper failed: ${err.message}`, err.stack);
    }
  }
}
