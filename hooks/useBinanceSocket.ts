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
  const wsTradeRef = useRef<WebSocket | null>(null);
  const wsDepthRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const connectionAttemptsRef = useRef(0);

  const connect = useCallback(() => {
    connectionAttemptsRef.current += 1;
    console.log(`Connection attempt #${connectionAttemptsRef.current}`);

    try {
      // Close existing connections
      if (wsTradeRef.current) {
        wsTradeRef.current.close();
      }
      if (wsDepthRef.current) {
        wsDepthRef.current.close();
      }

      // Try the alternative endpoint without port specification
      const tradeUrl = `wss://stream.binance.com/ws/${symbol}@aggTrade`;
      const depthUrl = `wss://stream.binance.com/ws/${symbol}@depth@100ms`;

      console.log('Connecting to:', tradeUrl);
      console.log('Connecting to:', depthUrl);

      const wsTrade = new WebSocket(tradeUrl);
      const wsDepth = new WebSocket(depthUrl);

      let tradeConnected = false;
      let depthConnected = false;

      const updateConnectionStatus = () => {
        const isConnected = tradeConnected && depthConnected;
        setConnected(isConnected);
        console.log(`Connection status - Trade: ${tradeConnected}, Depth: ${depthConnected}`);
      };

      wsTrade.onopen = () => {
        console.log('✓ Trade WebSocket connected');
        tradeConnected = true;
        updateConnectionStatus();
      };

      wsDepth.onopen = () => {
        console.log('✓ Depth WebSocket connected');
        depthConnected = true;
        updateConnectionStatus();
        
        // Fetch initial order book snapshot
        console.log('Fetching initial order book snapshot...');
        fetch(`https://api.binance.com/api/v3/depth?symbol=${symbol.toUpperCase()}&limit=100`)
          .then(res => {
            if (!res.ok) {
              throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            }
            return res.json();
          })
          .then(data => {
            console.log('✓ Order book snapshot received');
            const bids = new Map<string, string>(
              (data.bids as [string, string][]).map(([p, q]) => [p, q])
            );
            const asks = new Map<string, string>(
              (data.asks as [string, string][]).map(([p, q]) => [p, q])
            );

            setOrderBook({
              bids,
              asks,
              lastUpdateId: data.lastUpdateId,
            });
          })
          .catch(err => {
            console.error('✗ Failed to fetch initial order book:', err.message);
          });
      };

      wsTrade.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

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
        } catch (error) {
          console.error('Error parsing trade message:', error);
        }
      };

      wsDepth.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.e === 'depthUpdate') {
            setOrderBook(prev => {
              const newBids = new Map(prev.bids);
              const newAsks = new Map(prev.asks);

              data.b.forEach(([price, quantity]: [string, string]) => {
                if (parseFloat(quantity) === 0) {
                  newBids.delete(price);
                } else {
                  newBids.set(price, quantity);
                }
              });

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
        } catch (error) {
          console.error('Error parsing depth message:', error);
        }
      };

      wsTrade.onerror = (error) => {
        console.error('✗ Trade WebSocket error:', error);
        tradeConnected = false;
        updateConnectionStatus();
      };

      wsDepth.onerror = (error) => {
        console.error('✗ Depth WebSocket error:', error);
        depthConnected = false;
        updateConnectionStatus();
      };

      wsTrade.onclose = (event) => {
        console.log(`✗ Trade WebSocket closed. Code: ${event.code}, Reason: ${event.reason || 'none'}`);
        tradeConnected = false;
        updateConnectionStatus();
        
        // Retry connection
        if (connectionAttemptsRef.current < 5) {
          console.log('Retrying in 5 seconds...');
          reconnectTimeoutRef.current = setTimeout(connect, 5000);
        } else {
          console.error('Max connection attempts reached. Please check your network/firewall settings.');
        }
      };

      wsDepth.onclose = (event) => {
        console.log(`✗ Depth WebSocket closed. Code: ${event.code}, Reason: ${event.reason || 'none'}`);
        depthConnected = false;
        updateConnectionStatus();
      };

      wsTradeRef.current = wsTrade;
      wsDepthRef.current = wsDepth;

    } catch (error) {
      console.error('Connection error:', error);
      setConnected(false);
      
      if (connectionAttemptsRef.current < 5) {
        reconnectTimeoutRef.current = setTimeout(connect, 5000);
      }
    }
  }, [symbol]);

  useEffect(() => {
    connectionAttemptsRef.current = 0;
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsTradeRef.current) {
        wsTradeRef.current.close();
      }
      if (wsDepthRef.current) {
        wsDepthRef.current.close();
      }
    };
  }, [connect]);

  return { trades, orderBook, connected };
};
