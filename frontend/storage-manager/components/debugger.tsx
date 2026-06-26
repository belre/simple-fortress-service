'use client'

import * as React from 'react'

export function ClientPart() {
  // useEffect ではなくレンダリング中に実行
  console.log('[PageA] レンダリングされた');

  React.useEffect(() => {
    console.log('[PageA] useEffect 発火');
  }, []);

  return <div>...</div>;
}