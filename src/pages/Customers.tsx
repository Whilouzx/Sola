import React from 'react';
import { CustomerModule } from '../components/CustomerModule';

const Customers: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <CustomerModule />
      </div>
    </div>
  );
};

export default Customers;
