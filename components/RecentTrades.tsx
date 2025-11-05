import React, { useState, useEffect } from 'react';
import { Trade } from '@/hooks/useBinanceSocket';

interface Props {
  trades: Trade[];
}

const RecentTrades: React.FC<Props> = React.memo(({ trades }) => {
  const [flashingTrade, setFlashingTrade] = useState<string | null>(null);

  useEffect(() => {
    if (trades.length > 0) {
      const latestTrade = trades[0];
      setFlashingTrade(latestTrade.id);
      const timeout = setTimeout(() => setFlashingTrade(null), 300);
      return () => clearTimeout(timeout);
    }
  }, [trades]);

  return (
    <div className="bg-gray-900 rounded-lg p-4">
      <h2 className="text-xl font-bold text-white mb-4">Recent Trades</h2>
      
      <div className="grid grid-cols-3 gap-2 text-xs font-semibold text-gray-400 mb-2 px-2">
        <div>Price (USDT)</div>
        <div className="text-right">Amount (BTC)</div>
        <div className="text-right">Time</div>
      </div>

      <div className="space-y-0.5 max-h-96 overflow-y-auto">
        {trades.map((trade) => (
          <div
            key={trade.id}
            className={`grid grid-cols-3 gap-2 text-xs py-1 px-2 rounded transition-colors ${
              flashingTrade === trade.id
                ? trade.isBuyerMaker
                  ? 'bg-red-500 bg-opacity-30'
                  : 'bg-green-500 bg-opacity-30'
                : ''
            }`}
          >
            <div
              className={`font-mono ${
                trade.isBuyerMaker ? 'text-red-400' : 'text-green-400'
              }`}
            >
              {parseFloat(trade.price).toFixed(2)}
            </div>
            <div className="text-gray-300 text-right font-mono">
              {parseFloat(trade.quantity).toFixed(5)}
            </div>
            <div className="text-gray-400 text-right font-mono">
              {new Date(trade.time).toLocaleTimeString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

RecentTrades.displayName = 'RecentTrades';

export default RecentTrades;
