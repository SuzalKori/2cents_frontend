import React, { useMemo } from 'react';
import { OrderBook } from '@/hooks/useBinanceSocket';

interface Props {
  orderBook: OrderBook;
}

const OrderBookComponent: React.FC<Props> = React.memo(({ orderBook }) => {
  const processedData = useMemo(() => {
    // Convert and sort bids (descending)
    const bidsArray = Array.from(orderBook.bids.entries())
      .map(([price, quantity]) => ({
        price: parseFloat(price),
        quantity: parseFloat(quantity),
      }))
      .sort((a, b) => b.price - a.price)
      .slice(0, 15);

    // Convert and sort asks (ascending)
    const asksArray = Array.from(orderBook.asks.entries())
      .map(([price, quantity]) => ({
        price: parseFloat(price),
        quantity: parseFloat(quantity),
      }))
      .sort((a, b) => a.price - b.price)
      .slice(0, 15);

    // Calculate cumulative totals
    let bidTotal = 0;
    const bidsWithTotal = bidsArray.map(level => {
      bidTotal += level.quantity;
      return { ...level, total: bidTotal };
    });

    let askTotal = 0;
    const asksWithTotal = asksArray.map(level => {
      askTotal += level.quantity;
      return { ...level, total: askTotal };
    });

    const maxBidTotal = bidsWithTotal[bidsWithTotal.length - 1]?.total || 1;
    const maxAskTotal = asksWithTotal[asksWithTotal.length - 1]?.total || 1;

    const spread = asksArray[0] && bidsArray[0] 
      ? (asksArray[0].price - bidsArray[0].price).toFixed(2)
      : '0.00';

    return { bidsWithTotal, asksWithTotal, maxBidTotal, maxAskTotal, spread };
  }, [orderBook]);

  return (
    <div className="bg-gray-900 rounded-lg p-4">
      <h2 className="text-xl font-bold text-white mb-4">Order Book</h2>
      
      <div className="grid grid-cols-2 gap-4">
        {/* Bids */}
        <div>
          <div className="grid grid-cols-3 gap-2 text-xs font-semibold text-gray-400 mb-2 px-2">
            <div>Price (USDT)</div>
            <div className="text-right">Amount (BTC)</div>
            <div className="text-right">Total</div>
          </div>
          <div className="space-y-0.5">
            {processedData.bidsWithTotal.map((level) => (
              <div key={level.price} className="relative">
                <div
                  className="absolute inset-0 bg-green-500 opacity-20"
                  style={{ width: `${(level.total / processedData.maxBidTotal) * 100}%` }}
                />
                <div className="relative grid grid-cols-3 gap-2 text-xs py-1 px-2">
                  <div className="text-green-400 font-mono">{level.price.toFixed(2)}</div>
                  <div className="text-gray-300 text-right font-mono">{level.quantity.toFixed(5)}</div>
                  <div className="text-gray-400 text-right font-mono">{level.total.toFixed(5)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Asks */}
        <div>
          <div className="grid grid-cols-3 gap-2 text-xs font-semibold text-gray-400 mb-2 px-2">
            <div>Price (USDT)</div>
            <div className="text-right">Amount (BTC)</div>
            <div className="text-right">Total</div>
          </div>
          <div className="space-y-0.5">
            {processedData.asksWithTotal.map((level) => (
              <div key={level.price} className="relative">
                <div
                  className="absolute inset-0 bg-red-500 opacity-20"
                  style={{ width: `${(level.total / processedData.maxAskTotal) * 100}%` }}
                />
                <div className="relative grid grid-cols-3 gap-2 text-xs py-1 px-2">
                  <div className="text-red-400 font-mono">{level.price.toFixed(2)}</div>
                  <div className="text-gray-300 text-right font-mono">{level.quantity.toFixed(5)}</div>
                  <div className="text-gray-400 text-right font-mono">{level.total.toFixed(5)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 text-center">
        <div className="text-sm text-gray-400">Spread</div>
        <div className="text-lg font-bold text-yellow-400">{processedData.spread} USDT</div>
      </div>
    </div>
  );
});

OrderBookComponent.displayName = 'OrderBookComponent';

export default OrderBookComponent;