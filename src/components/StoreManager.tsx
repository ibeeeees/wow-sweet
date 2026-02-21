// ============================================================
// SweetReturns — StoreManager: Renders all stores (flat, no sector grouping)
// ============================================================

import React from 'react';
import { useStore } from '../store/useStore';
import Store from './Store';

const MemoizedStore = React.memo(Store);

function StoreManager() {
  const stocks = useStore((s) => s.stocks);

  return (
    <group name="store-manager">
      {stocks.map((stock) => (
        <MemoizedStore key={stock.ticker} stock={stock} />
      ))}
    </group>
  );
}

export default React.memo(StoreManager);
