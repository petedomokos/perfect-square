'use client'
import { useState } from 'react';
import Header from './components/header/page';
import { exampleItems } from './data/pageContent';

export default function Home() {
  const [selectedExample, setSelectedExample] = useState(exampleItems[0].key);
  
  return (
    <div className="app">
      <Header menuItems={exampleItems} selected={selectedExample} onSelect={setSelectedExample} />
      <main className="main">
        Main Content
      </main>
    </div>
  );
}
