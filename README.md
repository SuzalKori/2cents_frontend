# Real-Time Order Book Visualizer

A high-performance, real-time stock order book visualizer built with Next.js, TypeScript, and the Binance WebSocket API.

## Features

- **Live Order Book**: Real-time visualization of BTC/USDT order book with bid/ask spreads
- **Recent Trades**: Stream of the last 50 trades with buy/sell indicators
- **Depth Visualization**: Visual representation of order book depth with background bars
- **High Performance**: Optimized state management using React hooks and memoization
- **Auto-Reconnect**: Automatic reconnection on WebSocket disconnect

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **API**: Binance WebSocket API
- **State Management**: React Hooks (useState, useEffect, useMemo, useCallback)

## Deployment : 
https://2cents-frontend.vercel.app/

## Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd orderbook-visualizer
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Build for Production
```bash
npm run build
npm start
```

## Design Decisions

### State Management
- Used React's built-in hooks instead of external libraries for simplicity and performance
- `Map` data structure for O(1) order book updates
- Memoization with `useMemo` and `React.memo` to prevent unnecessary re-renders

### WebSocket Connection
- Custom `useBinanceSocket` hook encapsulates all WebSocket logic
- Combined stream endpoint for both trades and depth updates
- Automatic reconnection with exponential backoff
- Initial snapshot fetch to establish baseline order book state

### Performance Optimizations
- Limited order book display to top 15 levels per side
- Trade history capped at 50 most recent trades
- Efficient state updates using functional setState
- Memoized calculations for cumulative totals and depth percentages

### UI/UX
- Dark theme optimized for extended viewing
- Color-coded buy (green) and sell (red) indicators
- Flash animation on new trades for immediate visual feedback
- Responsive layout that works on desktop and mobile

## API Documentation

This project uses the following Binance API endpoints:

- **WebSocket Stream**: `wss://stream.binance.com:9443/ws/{symbol}@aggTrade/{symbol}@depth@100ms`
- **REST API (snapshot)**: `https://api.binance.com/api/v3/depth?symbol={SYMBOL}&limit=100`

## You can deploy on

Deploy easily to Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

Or manually:
1. Push code to GitHub
2. Import project in Vercel
3. Deploy

## License


MIT

