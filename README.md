# Zo House Events Calendar

An interactive web application for Zo House community events, member management, and location-based services.

## Features

- Interactive Mapbox-powered map with 3D buildings
- Real-time event calendar integration via iCal feeds
- Member management with Supabase backend
- Wallet integration for Web3 functionality
- **Custom Token Reward System** - Send ERC-20 tokens as quest rewards
- Responsive design for mobile and desktop
- Progressive Web App (PWA) capabilities

## Custom Token Reward System

The application now supports sending custom ERC-20 tokens as rewards instead of AVAX. This allows you to:

- Send your own branded tokens (e.g., ZOHM, GAME tokens) as quest completion rewards
- Configure token amounts, symbols, and decimals
- Maintain separate token and gas fee balances
- Track all token reward transactions

### Setup Instructions

1. **Deploy Custom Token**: Deploy your ERC-20 token contract to Avalanche Fuji testnet
2. **Configure Environment**: Update `.env.local` with your token contract details:
   ```bash
   CUSTOM_TOKEN_ADDRESS=0xYourTokenContractAddress
   CUSTOM_TOKEN_SYMBOL=ZOHM
   CUSTOM_TOKEN_DECIMALS=18
   CUSTOM_TOKEN_REWARD_AMOUNT=100
   REWARD_WALLET_PRIVATE_KEY=your_private_key_here
   ```
3. **Fund Reward Wallet**: Ensure your reward wallet has:
   - Custom tokens for rewards
   - AVAX for gas fees
4. **Test System**: Use the test script to verify setup:
   ```bash
   node scripts/test-custom-token-reward.js
   ```

### API Endpoints

- `GET /api/send-token-reward` - Check reward wallet status and token balance
- `POST /api/send-token-reward` - Send custom token reward for quest completion

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

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Space Grotesk](https://fonts.google.com/specimen/Space+Grotesk), a modern font family.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
