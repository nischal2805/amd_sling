import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import api from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';

function formatMoney(n) {
  if (n == null) return '—';
  return '$' + Number(n).toLocaleString('en-US');
}

function warmthBadge(score) {
  if (score == null) return <span className="text-gray-400 text-xs">—</span>;
  const s = Number(score);
  let cls = 'bg-gray-100 text-gray-600';
  if (s >= 4) cls = 'bg-green-100 text-green-700';
  else if (s === 3) cls = 'bg-amber-50 text-amber-700';
  else if (s <= 2) cls = 'bg-red-50 text-red-600';
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
      {s}/5
    </span>
  );
}

function BrandDealsRow({ brand }) {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();

  const { data: dealsData, isLoading } = useQuery({
    queryKey: ['brand-deals', brand.id],
    queryFn: () => api.get(`/api/deals?brand_id=${brand.id}`).then((r) => r.data),
    enabled: expanded,
  });

  const deals = Array.isArray(dealsData) ? dealsData : [];

  return (
    <>
      <tr
        className="hover:bg-gray-50 cursor-pointer"
        onClick={() => setExpanded((v) => !v)}
      >
        <td className="px-5 py-3 font-medium text-gray-900 flex items-center gap-2">
          <span className="text-gray-400 text-xs">{expanded ? '▼' : '▶'}</span>
          {brand.name}
        </td>
        <td className="px-5 py-3 text-gray-700 text-center">{brand.total_deals ?? '—'}</td>
        <td className="px-5 py-3 text-green-600 font-medium text-right">{formatMoney(brand.total_revenue)}</td>
        <td className="px-5 py-3 text-center">{warmthBadge(brand.warmth_score)}</td>
        <td className="px-5 py-3 text-gray-500">
          {brand.last_deal_date
            ? format(new Date(brand.last_deal_date), 'MMM d, yyyy')
            : '—'}
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={5} className="px-5 pb-3 bg-gray-50 border-b border-gray-100">
            {isLoading ? (
              <div className="py-4 flex justify-center">
                <LoadingSpinner size="sm" />
              </div>
            ) : deals.length === 0 ? (
              <p className="text-sm text-gray-400 py-3">No deals for this brand.</p>
            ) : (
              <table className="w-full text-sm mt-1">
                <thead>
                  <tr className="text-left text-xs text-gray-400">
                    <th className="py-1 pr-4 font-medium">Title</th>
                    <th className="py-1 pr-4 font-medium">Stage</th>
                    <th className="py-1 pr-4 font-medium text-right">Value</th>
                    <th className="py-1 font-medium">Deadline</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {deals.map((deal) => (
                    <tr
                      key={deal.id}
                      className="hover:bg-white cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/deals/${deal.id}`);
                      }}
                    >
                      <td className="py-2 pr-4 text-blue-600 hover:underline">{deal.title}</td>
                      <td className="py-2 pr-4 text-gray-600 capitalize">
                        {(deal.stage ?? '').replace(/_/g, ' ')}
                      </td>
                      <td className="py-2 pr-4 text-right text-green-600 font-medium">
                        {formatMoney(deal.value)}
                      </td>
                      <td className="py-2 text-gray-500">
                        {deal.posting_deadline
                          ? format(new Date(deal.posting_deadline), 'MMM d, yyyy')
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

export default function Brands() {
  const { data: brandsData, isLoading, error } = useQuery({
    queryKey: ['brands'],
    queryFn: () => api.get('/api/brands').then((r) => r.data),
  });

  const brands = Array.isArray(brandsData) ? brandsData : [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-sm">Failed to load brands.</div>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-gray-900">Brands</h1>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        {brands.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-12">No brands yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                <th className="px-5 py-3 font-medium">Brand Name</th>
                <th className="px-5 py-3 font-medium text-center">Total Deals</th>
                <th className="px-5 py-3 font-medium text-right">Total Revenue</th>
                <th className="px-5 py-3 font-medium text-center">Warmth</th>
                <th className="px-5 py-3 font-medium">Last Deal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {brands.map((brand) => (
                <BrandDealsRow key={brand.id} brand={brand} />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
