import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import {
  DragDropContext,
  Droppable,
  Draggable,
} from 'react-beautiful-dnd';
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

const STAGE_HEADER_COLORS = {
  inbound: 'border-t-gray-400',
  negotiation: 'border-t-blue-400',
  contract_sent: 'border-t-amber-400',
  in_production: 'border-t-green-500',
  completed: 'border-t-green-700',
  cancelled: 'border-t-red-400',
};

function formatMoney(n) {
  if (n == null) return '—';
  return '$' + Number(n).toLocaleString('en-US');
}

const EMPTY_FORM = {
  title: '',
  brand_id: '',
  value: '',
  stage: 'inbound',
  posting_deadline: '',
};

function NewDealModal({ brands, onClose, onSave }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await onSave({
        ...form,
        value: form.value ? Number(form.value) : undefined,
        brand_id: form.brand_id || undefined,
        posting_deadline: form.posting_deadline || undefined,
      });
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create deal.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm w-full max-w-md p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">New Deal</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              required
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
            <select
              value={form.brand_id}
              onChange={(e) => set('brand_id', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
            >
              <option value="">— Select brand —</option>
              {(brands ?? []).map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Value ($)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.value}
              onChange={(e) => set('value', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
              placeholder="5000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stage</label>
            <select
              value={form.stage}
              onChange={(e) => set('stage', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
            >
              {STAGES.map((s) => (
                <option key={s.key} value={s.key}>{s.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Posting Deadline</label>
            <input
              type="date"
              value={form.posting_deadline}
              onChange={(e) => set('posting_deadline', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Creating…' : 'Create Deal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DealCard({ deal, index }) {
  const isOverdue =
    deal.posting_deadline && new Date(deal.posting_deadline) < new Date();

  return (
    <Draggable draggableId={String(deal.id)} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`bg-white border border-gray-200 rounded-lg shadow-sm p-3 mb-2 ${
            snapshot.isDragging ? 'shadow-md' : ''
          }`}
        >
          <p className="text-xs text-gray-500 font-medium mb-0.5">
            {deal.brand?.name ?? deal.brand_name ?? 'Unknown brand'}
          </p>
          <Link
            to={`/deals/${deal.id}`}
            className="text-sm font-semibold text-gray-900 hover:text-blue-600 block leading-snug"
          >
            {deal.title}
          </Link>
          <div className="flex items-center justify-between mt-2">
            <span className="text-sm font-medium text-green-600">
              {formatMoney(deal.value)}
            </span>
            {deal.posting_deadline && (
              <span
                className={`text-xs ${
                  isOverdue ? 'text-red-500 font-medium' : 'text-gray-400'
                }`}
              >
                {format(new Date(deal.posting_deadline), 'MMM d')}
              </span>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
}

export default function Pipeline() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);

  const { data: dealsData, isLoading, error } = useQuery({
    queryKey: ['deals'],
    queryFn: () => api.get('/api/deals').then((r) => r.data),
  });

  const { data: brandsData } = useQuery({
    queryKey: ['brands'],
    queryFn: () => api.get('/api/brands').then((r) => r.data),
  });

  const stageMutation = useMutation({
    mutationFn: ({ id, stage }) =>
      api.patch(`/api/deals/${id}/stage`, { stage }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['deals'] }),
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/api/deals', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['deals'] }),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-sm">Failed to load deals.</div>;
  }

  const deals = Array.isArray(dealsData) ? dealsData : [];
  const brands = Array.isArray(brandsData) ? brandsData : [];

  const grouped = STAGES.reduce((acc, s) => {
    acc[s.key] = deals.filter((d) => d.stage === s.key);
    return acc;
  }, {});

  const handleDragEnd = (result) => {
    const { destination, draggableId } = result;
    if (!destination) return;
    const newStage = destination.droppableId;
    const deal = deals.find((d) => String(d.id) === draggableId);
    if (!deal || deal.stage === newStage) return;
    stageMutation.mutate({ id: deal.id, stage: newStage });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Pipeline</h1>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          + New Deal
        </button>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-3 overflow-x-auto pb-4">
          {STAGES.map((stage) => (
            <div
              key={stage.key}
              className={`shrink-0 w-56 bg-gray-50 border border-gray-200 rounded-lg border-t-4 ${STAGE_HEADER_COLORS[stage.key]}`}
            >
              <div className="px-3 py-2 border-b border-gray-200 flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  {stage.label}
                </span>
                <span className="text-xs text-gray-400 font-medium">
                  {grouped[stage.key].length}
                </span>
              </div>
              <Droppable droppableId={stage.key}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`p-2 min-h-24 ${
                      snapshot.isDraggingOver ? 'bg-blue-50' : ''
                    }`}
                  >
                    {grouped[stage.key].map((deal, index) => (
                      <DealCard key={deal.id} deal={deal} index={index} />
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>

      {showModal && (
        <NewDealModal
          brands={brands}
          onClose={() => setShowModal(false)}
          onSave={(data) => createMutation.mutateAsync(data)}
        />
      )}
    </div>
  );
}
