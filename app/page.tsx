'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import OrderBookComponent from '@/components/OrderBook';
import RecentTrades from '@/components/RecentTrades';
import { useBinanceSocket } from '@/hooks/useBinanceSocket';

export default function Home() {
  const [symbol, setSymbol] = useState('btcusdt');
  const { trades, orderBook, connected } = useBinanceSocket(symbol);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Real-Time Order Book Visualizer</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  connected ? 'bg-green-500' : 'bg-red-500'
                }`}
              />
              <span className="text-sm text-gray-400">
                {connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <div className="text-sm text-gray-400">
              Trading Pair: {symbol.toUpperCase()}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <OrderBookComponent orderBook={orderBook} />
          </div>
          <div>
            <RecentTrades trades={trades} />
          </div>
        </div>
      </div>
    </div>
  );
}