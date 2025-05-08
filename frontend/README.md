# Alldrama Frontend

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Cấu hình API Domain

Để chuyển đổi từ API local sang domain riêng, hãy thực hiện các bước sau:
```
NEXT_PUBLIC_API_URL=https://alldramaz.com
```

2. Tạo file `.env.production` cho môi trường production:
```
NEXT_PUBLIC_API_URL=https://alldramaz.com
```

3. Build và deploy ứng dụng với biến môi trường đã được cấu hình:
```
npm run build
```

## Visual Testing with LambdaTest SmartUI

This project uses LambdaTest SmartUI for visual regression testing instead of Cypress. LambdaTest provides a cloud-based platform for performing visual tests across multiple browsers and screen sizes.

### Setup LambdaTest

1. Set up the environment variables by running one of the setup scripts:

   **Windows PowerShell:**
   ```
   .\lambdatest\setup.ps1
   ```

   **Windows CMD:**
   ```
   .\lambdatest\setup.bat
   ```

2. Alternatively, manually set the environment variables:

   **Windows PowerShell:**
   ```powershell
   $env:LT_USERNAME="22028120"
   $env:LT_ACCESS_KEY="LT_B3jzQVNMBe2hTSDopm3DziFB9OJ8LeBJxC0JXd0kMP2HHgX"
   $env:PROJECT_TOKEN="2445133#9c8d91f7-ae52-4717-afe1-857c2fa18d37#Web"
   ```

   **Windows CMD:**
   ```cmd
   set LT_USERNAME=22028120
   set LT_ACCESS_KEY=LT_B3jzQVNMBe2hTSDopm3DziFB9OJ8LeBJxC0JXd0kMP2HHgX
   set PROJECT_TOKEN=2445133#9c8d91f7-ae52-4717-afe1-857c2fa18d37#Web
   ```

### Running Visual Tests

To run the visual tests:

```
npm run smartui:run
```

Alternatively, you can run directly with npx:
```
npx @lambdatest/smartui-cli exec node lambdatest/sdkCloud.js
```

### Viewing Test Results

View test results on the [LambdaTest Dashboard](https://automation.lambdatest.com) in the Smart UI section.

### Configuration

The LambdaTest configuration files can be found in the `lambdatest` directory:
- `sdkCloud.js` - Main test script
- `smartui-web.json` - Configuration for browsers and viewports
- `setup.ps1` and `setup.bat` - Setup scripts

For more details, see the [LambdaTest documentation](https://www.lambdatest.com/support/docs/smart-ui-getting-started/).
