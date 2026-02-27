import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import api from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';

const STAGES = [
  { key: 'inbound', label: 'Inbound' },
  { key: 'negotiation', label: 'Negotiation' },
  { key: 'contract_sent', label: 'Contract Sent' },
  { key: 'in_production', label: 'In Production' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

function formatMoney(n) {
  if (n == null) return '—';
  return '$' + Number(n).toLocaleString('en-US');
}

const STATUS_STYLES = {
  pending: 'bg-gray-100 text-gray-600',
  in_progress: 'bg-blue-50 text-blue-700',
  completed: 'bg-green-100 text-green-700',
};

function DeliverableRow({ deliverable, onToggle }) {
  const isDone = deliverable.status === 'completed';
  return (
    <li className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-2">
        <button
          onClick={() => onToggle(deliverable)}
          className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 ${
            isDone
              ? 'bg-green-600 border-green-600 text-white'
              : 'border-gray-300 hover:border-blue-400'
          }`}
        >
          {isDone && (
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>
        <span className={`text-sm ${isDone ? 'line-through text-gray-400' : 'text-gray-800'}`}>
          {deliverable.title ?? deliverable.description ?? 'Deliverable'}
        </span>
      </div>
      <span
        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
          STATUS_STYLES[deliverable.status] ?? 'bg-gray-100 text-gray-600'
        }`}
      >
        {deliverable.status?.replace(/_/g, ' ') ?? 'pending'}
      </span>
    </li>
  );
}

const AI_TABS = [
  { key: 'parse_email', label: 'Parse Email' },
  { key: 'suggest_rate', label: 'Suggest Rate' },
  { key: 'draft_response', label: 'Draft Response' },
];

function AIPanel({ dealId }) {
  const [activeTab, setActiveTab] = useState('parse_email');
  const [emailText, setEmailText] = useState('');
  const [userAction, setUserAction] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleParseEmail = async () => {
    setError('');
    setResult(null);
    setLoading(true);
    try {
      const res = await api.post(`/api/deals/${dealId}/parse-email`, { email_text: emailText });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Request failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestRate = async () => {
    setError('');
    setResult(null);
    setLoading(true);
    try {
      const res = await api.get(`/api/deals/${dealId}/suggest-rate`);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Request failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleDraftResponse = async () => {
    setError('');
    setResult(null);
    setLoading(true);
    try {
      const res = await api.post(`/api/deals/${dealId}/draft-response`, { user_action: userAction });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Request failed.');
    } finally {
      setLoading(false);
    }
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
    setResult(null);
    setError('');
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="border-b border-gray-200 flex">
        {AI_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => switchTab(tab.key)}
            className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px ${
              activeTab === tab.key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-4 space-y-3">
        {activeTab === 'parse_email' && (
          <>
            <p className="text-xs text-gray-500">Paste a brand collaboration email to extract deal details.</p>
            <textarea
              value={emailText}
              onChange={(e) => setEmailText(e.target.value)}
              rows={5}
              placeholder="Paste email content here…"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 resize-y"
            />
            <button
              onClick={handleParseEmail}
              disabled={loading || !emailText.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Parsing…' : 'Parse Email'}
            </button>
          </>
        )}

        {activeTab === 'suggest_rate' && (
          <>
            <p className="text-xs text-gray-500">Get an AI-suggested rate range for this deal based on historical data.</p>
            <button
              onClick={handleSuggestRate}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Loading…' : 'Get Rate Suggestion'}
            </button>
          </>
        )}

        {activeTab === 'draft_response' && (
          <>
            <p className="text-xs text-gray-500">Describe the action you want to take and get a draft email.</p>
            <input
              value={userAction}
              onChange={(e) => setUserAction(e.target.value)}
              placeholder="e.g. Counter-offer at $8,000 with 2-week timeline"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
            />
            <button
              onClick={handleDraftResponse}
              disabled={loading || !userAction.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Drafting…' : 'Draft Response'}
            </button>
          </>
        )}

        {error && <p className="text-sm text-red-500">{error}</p>}

        {result && (
          <div className="mt-2 bg-gray-50 border border-gray-200 rounded-md p-3 text-sm text-gray-800 whitespace-pre-wrap break-words">
            {typeof result === 'string' ? result : JSON.stringify(result, null, 2)}
          </div>
        )}
      </div>
    </div>
  );
}

export default function DealDetail() {
  const { id } = useParams();
  const queryClient = useQueryClient();

  const { data: deal, isLoading, error } = useQuery({
    queryKey: ['deal', id],
    queryFn: () => api.get(`/api/deals/${id}`).then((r) => r.data),
  });

  const stageMutation = useMutation({
    mutationFn: (stage) => api.patch(`/api/deals/${id}/stage`, { stage }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['deal', id] }),
  });

  const deliverableMutation = useMutation({
    mutationFn: ({ deliverableId, status }) =>
      api.patch(`/api/deliverables/${deliverableId}/status`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['deal', id] }),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-sm">Failed to load deal.</div>;
  }

  const deliverables = deal.deliverables ?? [];
  const brandName = deal.brand?.name ?? deal.brand_name ?? '—';

  const toggleDeliverable = (deliverable) => {
    const next = deliverable.status === 'completed' ? 'pending' : 'completed';
    deliverableMutation.mutate({ deliverableId: deliverable.id, status: next });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-gray-500 font-medium">{brandName}</p>
            <h1 className="text-xl font-semibold text-gray-900 mt-0.5">{deal.title}</h1>
            {deal.posting_deadline && (
              <p className="text-sm text-gray-500 mt-1">
                Deadline: {format(new Date(deal.posting_deadline), 'MMM d, yyyy')}
              </p>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-2xl font-semibold text-green-600">{formatMoney(deal.value)}</span>
            <select
              value={deal.stage}
              onChange={(e) => stageMutation.mutate(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
            >
              {STAGES.map((s) => (
                <option key={s.key} value={s.key}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>

        {deal.notes && (
          <p className="mt-4 text-sm text-gray-600 border-t border-gray-100 pt-4">{deal.notes}</p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deliverables */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">
            Deliverables
            <span className="ml-2 text-xs text-gray-400 font-normal">
              {deliverables.filter((d) => d.status === 'completed').length}/{deliverables.length} done
            </span>
          </h2>
          {deliverables.length === 0 ? (
            <p className="text-sm text-gray-400">No deliverables added yet.</p>
          ) : (
            <ul>
              {deliverables.map((d) => (
                <DeliverableRow key={d.id} deliverable={d} onToggle={toggleDeliverable} />
              ))}
            </ul>
          )}
        </div>

        {/* AI Panel */}
        <AIPanel dealId={id} />
      </div>
    </div>
  );
}
