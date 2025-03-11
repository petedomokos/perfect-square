'use client'
import { useState } from 'react';
import Header from './components/header/page';
import { exampleItems } from './data/pageContent';
import QuadrantsBarChartVisual from './quadrantsBarChartVisual/page';
import { getRehabDataForVisuals, createMockDataForVisuals } from './data/mockData';

export default function Home() {
  const [selectedExample, setSelectedExample] = useState(exampleItems[0].key);
  const data = selectedExample === 'mock-dataset-500' ? createMockDataForVisuals(500) : getRehabDataForVisuals(24);
  
  return (
    <div className="app">
      <Header menuItems={exampleItems} selected={selectedExample} onSelect={setSelectedExample} />
      <main className="main">
      <QuadrantsBarChartVisual data={data}/>
      </main>
    </div>
  );
}
