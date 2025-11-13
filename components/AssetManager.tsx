
import React from 'react';
import { Asset, Client } from '../types';

interface AssetManagerProps {
  assets: Asset[];
  clients: Client[];
}

export const AssetManager: React.FC<AssetManagerProps> = ({ assets, clients }) => {
  const clientMap = new Map(clients.map(c => [c.id, c.name]));

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Asset Management</h1>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition">
                Add New Asset
            </button>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th scope="col" className="px-6 py-3">Asset Name</th>
                            <th scope="col" className="px-6 py-3">Type</th>
                            <th scope="col" className="px-6 py-3">Client</th>
                            <th scope="col" className="px-6 py-3">Purchase Date</th>
                            <th scope="col" className="px-6 py-3">Warranty End</th>
                        </tr>
                    </thead>
                    <tbody>
                        {assets.map(asset => (
                            <tr key={asset.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                                    {asset.name}
                                </td>
                                <td className="px-6 py-4">{asset.type}</td>
                                <td className="px-6 py-4">{clientMap.get(asset.clientId) || 'Unknown'}</td>
                                <td className="px-6 py-4">{new Date(asset.purchaseDate).toLocaleDateString()}</td>
                                <td className="px-6 py-4">{new Date(asset.warrantyEndDate).toLocaleDateString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );
};
