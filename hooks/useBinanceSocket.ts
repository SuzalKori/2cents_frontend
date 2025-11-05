import { useState, useEffect, useCallback, useRef } from 'react';

export interface Trade {
  id: string;
  price: string;
  quantity: string;
  time: number;
  isBuyerMaker: boolean;
}

export interface OrderBook {
  bids: Map<string, string>;
  asks: Map<string, string>;
  lastUpdateId: number;
}

export const useBinanceSocket = (symbol: string = 'btcusdt') => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [orderBook, setOrderBook] = useState<OrderBook>({
    bids: new Map(),
    asks: new Map(),
    lastUpdateId: 0,
  });
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  const connect = useCallback(() => {
    try {
      // Combined stream for trades and depth updates
      const ws = new WebSocket(
        'wss://data-stream.binance.vision/stream?streams=btcusdt@aggTrade/btcusdt@depth'
      );

      ws.onopen = () => {
        console.log('WebSocket connected');
        setConnected(true);
        
        // Fetch initial order book snapshot
        fetch(`https://api.binance.com/api/v3/depth?symbol=${symbol.toUpperCase()}&limit=100`)
          .then(res => res.json())
          .then(data => {
            const bids: Map<string, string> = new Map<string, string>(
  (data.bids as [string, string][]).map(([p, q]) => [p, q])
);
const asks: Map<string, string> = new Map<string, string>(
  (data.asks as [string, string][]).map(([p, q]) => [p, q])
);

setOrderBook({
  bids,
  asks,
  lastUpdateId: data.lastUpdateId,
});

          })
          .catch(err => console.error('Failed to fetch initial order book:', err));
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        // Handle aggregate trade updates
        if (data.e === 'aggTrade') {
          const trade: Trade = {
            id: data.a.toString(),
            price: data.p,
            quantity: data.q,
            time: data.T,
            isBuyerMaker: data.m,
          };
          setTrades(prev => [trade, ...prev.slice(0, 49)]);
        }

        // Handle depth updates
        if (data.e === 'depthUpdate') {
          setOrderBook(prev => {
            const newBids = new Map(prev.bids);
            const newAsks = new Map(prev.asks);

            // Update bids
            data.b.forEach(([price, quantity]: [string, string]) => {
              if (parseFloat(quantity) === 0) {
                newBids.delete(price);
              } else {
                newBids.set(price, quantity);
              }
            });

            // Update asks
            data.a.forEach(([price, quantity]: [string, string]) => {
              if (parseFloat(quantity) === 0) {
                newAsks.delete(price);
              } else {
                newAsks.set(price, quantity);
              }
            });

            return {
              bids: newBids,
              asks: newAsks,
              lastUpdateId: data.u,
            };
          });
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setConnected(false);
        // Attempt reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(connect, 3000);
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Connection error:', error);
      reconnectTimeoutRef.current = setTimeout(connect, 3000);
    }
  }, [symbol]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  return { trades, orderBook, connected };

};





