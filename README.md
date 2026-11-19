# PCSO Lotto API

A NestJS API for retrieving PCSO lotto draws, syncing results, and analyzing historical draw statistics.

## Features

- Retrieve lotto draws by date
- Scrape PCSO draw results
- Backfill data by day, month, or year
- Analyze number frequency and overdue numbers
- View odd/even, pair, sum, and companion statistics
- Generate random or statistically balanced number combinations
- Store draws in MongoDB
- Schedule automatic daily synchronization

## Supported Lotto Games

- 6/58
- 6/55
- 6/49
- 6/45
- 6/42

URL-encode the slash in a game value as `%2F` when using it in a path parameter.

## Requirements

- Node.js 24 or newer
- MongoDB
- npm
- Chromium/Puppeteer-compatible environment

## Installation

```bash
npm install
```

## Environment Variables

Create a `.env` file in the project root:

```env
MONGODB_URI=mongodb://localhost:27017/pcso-lotto
PCSO_URL=https://example.com/pcso-results
PORT=3000
```

| Variable | Required | Description |
|---|---:|---|
| `MONGODB_URI` | Yes | MongoDB connection URI |
| `PCSO_URL` | Yes | PCSO results page used by the scraper |
| `PORT` | No | HTTP port; defaults to `3000` |

## Running the API

```bash
# Development
npm run start:dev

# Production build
npm run build
npm run start:prod
```

The API is available at `http://localhost:3000` by default.

## Swagger / OpenAPI

The interactive API documentation is available at:

```text
http://localhost:3000/api/docs
```

The OpenAPI JSON document is available at:

```text
http://localhost:3000/api/docs-json
```

Swagger documents all lotto, statistics, and scraper endpoints. Replace `localhost:3000` with the deployed API host when using the production documentation.

## Response Format

Successful API responses use the following envelope:

```json
{
  "status": 200,
  "message": "Success",
  "action_at": "2026-11-19T11:58:51.876Z",
  "data": {}
}
```

## API Endpoints

### Lotto

#### Get draws by date

```http
GET /lotto/draw-date/:date
```

**Parameter**

| Name | Example | Description |
|---|---|---|
| `date` | `2026-11-19` | Draw date in `YYYY-MM-DD` format |

**Example**

```bash
curl "http://localhost:3000/lotto/draw-date/2026-11-19"
```

The winners field is omitted from this response.

### Statistics

All statistics endpoints require one of these game values:

- `6/58`
- `6/55`
- `6/49`
- `6/45`
- `6/42`

#### Number frequency

```http
GET /stats/frequency/:game
```

**Query parameters**

| Name | Type | Default | Description |
|---|---|---:|---|
| `limit` | integer | `10` | Number of hot and cold numbers to return |
| `months` | integer | none | Limit analysis to the most recent number of months |

**Example**

```bash
curl "http://localhost:3000/stats/frequency/6%2F49?limit=10&months=12"
```

#### Overdue numbers

```http
GET /stats/overdue/:game
```

**Query parameters**

| Name | Type | Default |
|---|---|---:|
| `limit` | integer | `10` |

**Example**

```bash
curl "http://localhost:3000/stats/overdue/6%2F58?limit=10"
```

#### Odd/even distribution

```http
GET /stats/odd-even/:game
```

**Query parameters**

| Name | Type | Description |
|---|---|---|
| `from` | ISO date | Start date |
| `to` | ISO date | End date |

**Example**

```bash
curl "http://localhost:3000/stats/odd-even/6%2F45?from=2025-01-01&to=2026-11-19"
```

#### Number pairs

```http
GET /stats/pairs/:game
```

**Query parameters**

| Name | Type | Default | Description |
|---|---|---:|---|
| `limit` | integer | `15` | Number of pairs |
| `from` | ISO date | none | Start date |
| `to` | ISO date | none | End date |

**Example**

```bash
curl "http://localhost:3000/stats/pairs/6%2F42?limit=15"
```

#### Sum distribution

```http
GET /stats/sum-distribution/:game
```

**Query parameters**

| Name | Type | Description |
|---|---|---|
| `from` | ISO date | Start date |
| `to` | ISO date | End date |

**Example**

```bash
curl "http://localhost:3000/stats/sum-distribution/6%2F49"
```

#### Companion numbers

```http
GET /stats/companions/:game/:ball
```

**Parameters**

| Name | Example | Description |
|---|---|---|
| `game` | `6/55` | Lotto game |
| `ball` | `21` | Target number |

**Query parameters**

| Name | Type | Default | Description |
|---|---|---:|---|
| `limit` | integer | `10` | Number of companion numbers |
| `from` | ISO date | none | Start date |
| `to` | ISO date | none | End date |

**Example**

```bash
curl "http://localhost:3000/stats/companions/6%2F55/21?limit=10"
```

#### Generate number combinations

```http
GET /stats/generate/:game
```

**Query parameters**

| Name | Type | Default | Values |
|---|---|---:|---|
| `limit` | integer | `3` | Number of combinations |
| `type` | string | `smart` | `smart` or `random` |

**Examples**

```bash
curl "http://localhost:3000/stats/generate/6%2F58?limit=3"
curl "http://localhost:3000/stats/generate/6%2F58?limit=3&type=random"
curl "http://localhost:3000/stats/generate/6%2F58?limit=3&type=smart"
```

Smart picks use historical frequency, game-specific sum ranges, odd/even distribution, and hot-number balance. Generated combinations are not predictions and do not improve the probability of winning.

### Scraper

#### Trigger daily synchronization

```http
POST /scraper/run
```

**Example**

```bash
curl -X POST "http://localhost:3000/scraper/run"
```

The endpoint starts a PCSO scrape and stores newly discovered or modified draws.

#### Backfill draws

```http
POST /scraper/backfill
```

**Query parameters**

| Name | Required | Example | Description |
|---|---|---|---|
| `year` | Yes | `2026` | Backfill a full year or combine with month/day |
| `month` | Conditional | `january` | Month name |
| `day` | Conditional | `19` | Day of the month |

**Examples**

```bash
# Full year
curl -X POST "http://localhost:3000/scraper/backfill?year=2026"

# Entire month
curl -X POST "http://localhost:3000/scraper/backfill?year=2026&month=january"

# Specific day
curl -X POST "http://localhost:3000/scraper/backfill?year=2026&month=january&day=19"
```

When `day` is supplied, both `month` and `year` are required. When `month` is supplied, `year` is required. Future dates are rejected.

## Validation

The API uses global NestJS validation:

- Unknown query parameters are rejected
- Numeric parameters must be positive integers where applicable
- Invalid games return `400 Bad Request`
- Invalid dates, months, days, and future scraper dates return `400 Bad Request`
- Scraper configuration errors are returned as server errors

## Automated Scraping

The scraper has a scheduled task running daily at 9:45 PM in the Asia/Manila timezone. It scrapes the current Manila date and updates existing draws if their values have changed.

## Testing

```bash
# Unit tests
npm run test

# End-to-end tests
npm run test:e2e

# Coverage
npm run test:cov
```

## Linting and Formatting

```bash
npm run lint
npm run format
```

## Deployment

The project includes a Vercel configuration. Deployment requires:

- `MONGODB_URI`
- `PCSO_URL`
- MongoDB network access from the deployment environment
- A Puppeteer-compatible server runtime
