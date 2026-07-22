'use client';

import { useEffect, useMemo, useState } from 'react';
import { addDays, addWeeks, addMonths, format, parseISO, isBefore, isSameDay } from 'date-fns';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Frequency = 'weekly' | 'biweekly' | 'monthly';
type CycleStatus = 'upcoming' | 'due' | 'received' | 'missed';
type MemberStatus = 'pending' | 'paid' | 'late' | 'defaulted';

interface Member {
  id: string;
  name: string;
  note?: string;
}

interface CycleMemberEntry {
  memberId: string;
  status: MemberStatus;
  note?: string;
}

interface Cycle {
  index: number;
  date: string; // ISO date
  recipientId: string;
  expectedPot: number;
  status: CycleStatus;
  entries: CycleMemberEntry[];
}

interface Group {
  id: string;
  name: string;
  contributionAmount: number;
  frequency: Frequency;
  members: Member[];
  startDate: string; // ISO date
  rotationOrder: string[]; // member ids
  leaderName?: string;
  notes?: string;
  variableAmounts: boolean;
  memberAmounts: Record<string, number>;
  cycles: Cycle[];
  createdAt: string;
}

interface GroupListEntry {
  id: string;
  name: string;
}

// ---------------------------------------------------------------------------
// Constants / storage keys
// ---------------------------------------------------------------------------

const LIST_KEY = 'ajo-tracker-group-list';
const GROUP_KEY_PREFIX = 'ajo-tracker-group-';
const ACK_KEY = 'ajo-tracker-disclaimer-ack';
const NGN = '₦';

const FREQUENCY_LABEL: Record<Frequency, string> = {
  weekly: 'Weekly',
  biweekly: 'Bi-weekly',
  monthly: 'Monthly',
};

const CURRENCIES = ['NGN', 'USD', 'GBP', 'EUR'] as const;
type CurrencyCode = (typeof CURRENCIES)[number];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function uid(prefix = 'id'): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function nextDate(date: Date, frequency: Frequency): Date {
  if (frequency === 'weekly') return addWeeks(date, 1);
  if (frequency === 'biweekly') return addWeeks(date, 2);
  return addMonths(date, 1);
}

function generateCycles(
  startDate: string,
  order: string[],
  frequency: Frequency,
  contributionAmount: number,
  variableAmounts: boolean,
  memberAmounts: Record<string, number>,
  existing?: Cycle[]
): Cycle[] {
  if (order.length === 0) return [];
  let current = parseISO(startDate);
  const cycles: Cycle[] = [];

  order.forEach((recipientId, i) => {
    const pot = variableAmounts
      ? order.reduce((sum, memberId) => sum + (memberAmounts[memberId] ?? contributionAmount), 0)
      : contributionAmount * order.length;

    const priorCycle = existing?.[i];
    const entries: CycleMemberEntry[] = order.map((memberId) => {
      const priorEntry = priorCycle?.entries.find((e) => e.memberId === memberId);
      return {
        memberId,
        status: priorEntry?.status ?? 'pending',
        note: priorEntry?.note,
      };
    });

    cycles.push({
      index: i + 1,
      date: current.toISOString(),
      recipientId,
      expectedPot: pot,
      status: priorCycle?.status ?? 'upcoming',
      entries,
    });

    current = nextDate(current, frequency);
  });

  return cycles;
}

function computeCycleStatus(cycle: Cycle, today: Date): CycleStatus {
  if (cycle.status === 'received') return 'received';
  const cycleDate = parseISO(cycle.date);
  const paidAll = cycle.entries.every((e) => e.status === 'paid');
  if (paidAll) return 'received';
  if (isBefore(cycleDate, today) && !isSameDay(cycleDate, today)) return 'missed';
  if (isSameDay(cycleDate, today)) return 'due';
  return 'upcoming';
}

function emptyGroup(): Group {
  const id = uid('group');
  const m1 = { id: uid('m'), name: '' };
  const m2 = { id: uid('m'), name: '' };
  return {
    id,
    name: '',
    contributionAmount: 50000,
    frequency: 'monthly',
    members: [m1, m2],
    startDate: new Date().toISOString().slice(0, 10),
    rotationOrder: [m1.id, m2.id],
    leaderName: '',
    notes: '',
    variableAmounts: false,
    memberAmounts: {},
    cycles: [],
    createdAt: new Date().toISOString(),
  };
}

function formatNaira(amount: number): string {
  return `${NGN}${Math.round(amount).toLocaleString('en-NG')}`;
}

function statusBadgeClass(status: CycleStatus): string {
  switch (status) {
    case 'received':
      return 'bg-green-100 text-green-700';
    case 'due':
      return 'bg-amber-100 text-amber-700';
    case 'missed':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-gray-100 text-gray-600';
  }
}

function memberStatusClass(status: MemberStatus): string {
  switch (status) {
    case 'paid':
      return 'bg-green-100 text-green-700';
    case 'late':
      return 'bg-amber-100 text-amber-700';
    case 'defaulted':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-gray-100 text-gray-500';
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function NigeriaAjoEsusuTracker({ locale }: { locale: string }) {
  const [ackDisclaimer, setAckDisclaimer] = useState<boolean>(true);
  const [groupList, setGroupList] = useState<GroupListEntry[]>([]);
  const [group, setGroup] = useState<Group>(emptyGroup());
  const [tab, setTab] = useState<'setup' | 'schedule' | 'track' | 'summary'>('setup');
  const [displayCurrency, setDisplayCurrency] = useState<CurrencyCode>('NGN');
  const [rates, setRates] = useState<Record<string, number> | null>(null);
  const [rateError, setRateError] = useState<string | null>(null);
  const [shareCopied, setShareCopied] = useState(false);

  // Load ack + group list on mount
  useEffect(() => {
    try {
      const ack = localStorage.getItem(ACK_KEY);
      setAckDisclaimer(ack === 'true');

      const rawList = localStorage.getItem(LIST_KEY);
      const list: GroupListEntry[] = rawList ? JSON.parse(rawList) : [];
      setGroupList(list);

      if (list.length > 0) {
        const raw = localStorage.getItem(GROUP_KEY_PREFIX + list[0].id);
        if (raw) {
          const loaded: Group = JSON.parse(raw);
          setGroup(loaded);
        }
      }
    } catch {
      // localStorage unavailable (e.g. private mode) — fall back to in-memory state only
    }
  }, []);

  // Recalculate cycles whenever schedule-relevant inputs change
  useEffect(() => {
    const cycles = generateCycles(
      group.startDate,
      group.rotationOrder,
      group.frequency,
      group.contributionAmount,
      group.variableAmounts,
      group.memberAmounts,
      group.cycles
    );
    const today = new Date();
    const withStatus = cycles.map((c) => ({ ...c, status: computeCycleStatus(c, today) }));
    setGroup((g) => ({ ...g, cycles: withStatus }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group.startDate, group.rotationOrder, group.frequency, group.contributionAmount, group.variableAmounts, group.memberAmounts]);

  // Persist current group to localStorage
  useEffect(() => {
    if (!group.name && group.members.every((m) => !m.name)) return; // don't save totally empty group
    try {
      localStorage.setItem(GROUP_KEY_PREFIX + group.id, JSON.stringify(group));
      setGroupList((prev) => {
        const exists = prev.some((g) => g.id === group.id);
        const next = exists
          ? prev.map((g) => (g.id === group.id ? { id: group.id, name: group.name || 'Untitled group' } : g))
          : [...prev, { id: group.id, name: group.name || 'Untitled group' }];
        localStorage.setItem(LIST_KEY, JSON.stringify(next));
        return next;
      });
    } catch {
      // storage full or unavailable — data will only persist for this session
    }
  }, [group]);

  function acknowledgeDisclaimer() {
    setAckDisclaimer(true);
    try {
      localStorage.setItem(ACK_KEY, 'true');
    } catch {
      // ignore
    }
  }

  function switchGroup(id: string) {
    try {
      const raw = localStorage.getItem(GROUP_KEY_PREFIX + id);
      if (raw) setGroup(JSON.parse(raw));
    } catch {
      // ignore
    }
  }

  function startNewGroup() {
    setGroup(emptyGroup());
    setTab('setup');
  }

  function clearCurrentGroup() {
    try {
      localStorage.removeItem(GROUP_KEY_PREFIX + group.id);
      const next = groupList.filter((g) => g.id !== group.id);
      localStorage.setItem(LIST_KEY, JSON.stringify(next));
      setGroupList(next);
    } catch {
      // ignore
    }
    startNewGroup();
  }

  // --- member management ---
  function updateMember(id: string, patch: Partial<Member>) {
    setGroup((g) => ({ ...g, members: g.members.map((m) => (m.id === id ? { ...m, ...patch } : m)) }));
  }

  function addMember() {
    if (group.members.length >= 50) return;
    const m = { id: uid('m'), name: '' };
    setGroup((g) => ({ ...g, members: [...g.members, m], rotationOrder: [...g.rotationOrder, m.id] }));
  }

  function removeMember(id: string) {
    if (group.members.length <= 2) return;
    setGroup((g) => ({
      ...g,
      members: g.members.filter((m) => m.id !== id),
      rotationOrder: g.rotationOrder.filter((mid) => mid !== id),
    }));
  }

  function moveInOrder(id: string, direction: -1 | 1) {
    setGroup((g) => {
      const order = [...g.rotationOrder];
      const idx = order.indexOf(id);
      const target = idx + direction;
      if (target < 0 || target >= order.length) return g;
      [order[idx], order[target]] = [order[target], order[idx]];
      return { ...g, rotationOrder: order };
    });
  }

  function shuffleOrder() {
    if (!window.confirm('Shuffle rotation order? This will randomly reassign who receives each cycle.')) return;
    setGroup((g) => {
      const order = [...g.rotationOrder];
      for (let i = order.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [order[i], order[j]] = [order[j], order[i]];
      }
      return { ...g, rotationOrder: order };
    });
  }

  // --- cycle / member status updates ---
  function setMemberStatus(cycleIndex: number, memberId: string, status: MemberStatus) {
    setGroup((g) => ({
      ...g,
      cycles: g.cycles.map((c) =>
        c.index === cycleIndex
          ? { ...c, entries: c.entries.map((e) => (e.memberId === memberId ? { ...e, status } : e)) }
          : c
      ),
    }));
  }

  function setCycleNote(cycleIndex: number, memberId: string, note: string) {
    setGroup((g) => ({
      ...g,
      cycles: g.cycles.map((c) =>
        c.index === cycleIndex
          ? { ...c, entries: c.entries.map((e) => (e.memberId === memberId ? { ...e, note } : e)) }
          : c
      ),
    }));
  }

  function overrideCycleStatus(cycleIndex: number, status: CycleStatus) {
    setGroup((g) => ({
      ...g,
      cycles: g.cycles.map((c) => (c.index === cycleIndex ? { ...c, status } : c)),
    }));
  }

  // --- currency conversion (display only, NGN remains source of truth) ---
  async function loadRates() {
    setRateError(null);
    try {
      const res = await fetch('https://open.er-api.com/v6/latest/NGN');
      if (!res.ok) throw new Error('bad response');
      const data = await res.json();
      if (!data.rates) throw new Error('no rates');
      setRates(data.rates);
    } catch {
      setRateError('Live rates unavailable right now — showing amounts in NGN only.');
      setDisplayCurrency('NGN');
    }
  }

  function formatDisplay(amountNGN: number): string {
    if (displayCurrency === 'NGN' || !rates) return formatNaira(amountNGN);
    const rate = rates[displayCurrency];
    if (!rate) return formatNaira(amountNGN);
    const symbol = displayCurrency === 'USD' ? '$' : displayCurrency === 'GBP' ? '£' : '€';
    return `${symbol}${(amountNGN * rate).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  }

  // --- derived summary values ---
  const totalPotPerCycle = useMemo(
    () =>
      group.variableAmounts
        ? group.rotationOrder.reduce((sum, id) => sum + (group.memberAmounts[id] ?? group.contributionAmount), 0)
        : group.contributionAmount * group.rotationOrder.length,
    [group.variableAmounts, group.memberAmounts, group.contributionAmount, group.rotationOrder]
  );

  const totalContributed = useMemo(() => {
    return group.cycles.reduce((sum, c) => {
      const paidCount = c.entries.filter((e) => e.status === 'paid').length;
      const perHead = group.variableAmounts ? c.expectedPot / Math.max(c.entries.length, 1) : group.contributionAmount;
      return sum + paidCount * perHead;
    }, 0);
  }, [group.cycles, group.variableAmounts, group.contributionAmount]);

  const nextCycle = useMemo(
    () => group.cycles.find((c) => c.status === 'upcoming' || c.status === 'due'),
    [group.cycles]
  );

  const receivedCount = group.cycles.filter((c) => c.status === 'received').length;
  const progressPct = group.cycles.length ? Math.round((receivedCount / group.cycles.length) * 100) : 0;

  function memberName(id: string): string {
    return group.members.find((m) => m.id === id)?.name || 'Unnamed member';
  }

  // --- export ---
  function exportJSON() {
    const blob = new Blob([JSON.stringify(group, null, 2)], { type: 'application/json' });
    downloadBlob(blob, `${(group.name || 'ajo-group').replace(/\s+/g, '-').toLowerCase()}.json`);
  }

  function exportCSV() {
    const rows = [['Cycle', 'Date', 'Recipient', 'Expected Pot (NGN)', 'Cycle Status']];
    group.cycles.forEach((c) => {
      rows.push([
        String(c.index),
        format(parseISO(c.date), 'yyyy-MM-dd'),
        memberName(c.recipientId),
        String(Math.round(c.expectedPot)),
        c.status,
      ]);
    });
    const csv = rows.map((r) => r.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    downloadBlob(blob, `${(group.name || 'ajo-group').replace(/\s+/g, '-').toLowerCase()}.csv`);
  }

  function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function copyShareLink() {
    try {
      const minimal = {
        n: group.name,
        a: group.contributionAmount,
        f: group.frequency,
        m: group.members.map((m) => m.name),
        s: group.startDate,
      };
      const encoded = btoa(encodeURIComponent(JSON.stringify(minimal)));
      const url = `${window.location.origin}${window.location.pathname}?share=${encoded}`;
      navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2500);
    } catch {
      // clipboard may be unavailable — user can still copy manually via export
    }
  }

  const readyForSchedule = group.rotationOrder.length >= 2 && group.members.every((m) => m.name.trim().length > 0);

  // ---------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4">
      {!ackDisclaimer && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-3 shadow-xl">
            <h2 className="text-lg font-semibold text-gray-800">Before you start</h2>
            <ul className="text-sm text-gray-600 space-y-2 list-disc pl-4">
              <li>This tool is for record-keeping only. Ajo/Esusu is trust-based — the app never handles or holds funds.</li>
              <li>Unregistered groups have limited legal recourse under Nigerian law. Consider formal cooperative registration for larger sums.</li>
              <li>Record agreements in writing. Defaulting on contributions can carry legal consequences under the Criminal Code Act.</li>
              <li>This is not financial or legal advice. Results depend entirely on the accuracy of what you enter.</li>
            </ul>
            <button
              onClick={acknowledgeDisclaimer}
              className="w-full bg-indigo-600 text-white rounded-xl py-2 font-medium hover:bg-indigo-700 transition"
            >
              I understand, continue
            </button>
          </div>
        </div>
      )}

      {/* Persistent disclaimer banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-gray-600">
        Record-keeping only — this tool does not hold or move money. Ajo/Esusu groups are trust-based and mostly
        fall outside formal Nigerian cooperative law. Keep a written agreement and consider registration for large
        groups.
      </div>

      {/* Group switcher */}
      <div className="flex flex-wrap items-center gap-2 bg-white rounded-xl border border-gray-200 p-3">
        <select
          className="flex-1 min-w-[160px] border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
          value={group.id}
          onChange={(e) => switchGroup(e.target.value)}
        >
          {groupList.length === 0 && <option value={group.id}>{group.name || 'Untitled group'}</option>}
          {groupList.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
        <button onClick={startNewGroup} className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50">
          + New group
        </button>
        <button onClick={clearCurrentGroup} className="text-sm px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50">
          Clear group
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {(['setup', 'schedule', 'track', 'summary'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg ${
              tab === t ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'setup' ? 'Setup' : t === 'schedule' ? 'Schedule' : t === 'track' ? 'Track' : 'Summary'}
          </button>
        ))}
      </div>

      {/* ---------------- Setup tab ---------------- */}
      {tab === 'setup' && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Group name</label>
            <input
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="e.g. Lagos Market Traders Ajo"
              value={group.name}
              onChange={(e) => setGroup((g) => ({ ...g, name: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700">Contribution per member (₦)</label>
              <input
                type="number"
                min={0}
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                value={group.contributionAmount}
                onChange={(e) => setGroup((g) => ({ ...g, contributionAmount: Number(e.target.value) || 0 }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Cycle frequency</label>
              <select
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                value={group.frequency}
                onChange={(e) => setGroup((g) => ({ ...g, frequency: e.target.value as Frequency }))}
              >
                {(Object.keys(FREQUENCY_LABEL) as Frequency[]).map((f) => (
                  <option key={f} value={f}>
                    {FREQUENCY_LABEL[f]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Start date</label>
            <input
              type="date"
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={group.startDate}
              onChange={(e) => setGroup((g) => ({ ...g, startDate: e.target.value }))}
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={group.variableAmounts}
              onChange={(e) => setGroup((g) => ({ ...g, variableAmounts: e.target.checked }))}
            />
            Allow different contribution amounts per member
          </label>

          <div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Members ({group.members.length}/50)</label>
              <button onClick={addMember} className="text-xs px-2 py-1 rounded-lg border border-gray-300 hover:bg-gray-50">
                + Add member
              </button>
            </div>
            <div className="mt-2 space-y-2">
              {group.members.map((m) => (
                <div key={m.id} className="flex gap-2 items-center">
                  <input
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                    placeholder="Member name"
                    value={m.name}
                    onChange={(e) => updateMember(m.id, { name: e.target.value })}
                  />
                  <input
                    className="w-32 border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                    placeholder="Phone / note"
                    value={m.note || ''}
                    onChange={(e) => updateMember(m.id, { note: e.target.value })}
                  />
                  {group.variableAmounts && (
                    <input
                      type="number"
                      className="w-24 border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
                      placeholder="₦ amount"
                      value={group.memberAmounts[m.id] ?? group.contributionAmount}
                      onChange={(e) =>
                        setGroup((g) => ({
                          ...g,
                          memberAmounts: { ...g.memberAmounts, [m.id]: Number(e.target.value) || 0 },
                        }))
                      }
                    />
                  )}
                  <button
                    onClick={() => removeMember(m.id)}
                    disabled={group.members.length <= 2}
                    className="text-xs text-red-500 disabled:text-gray-300 px-2"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Rotation order (who receives which cycle)</label>
              <button onClick={shuffleOrder} className="text-xs px-2 py-1 rounded-lg border border-gray-300 hover:bg-gray-50">
                Shuffle
              </button>
            </div>
            <div className="mt-2 space-y-1">
              {group.rotationOrder.map((id, i) => (
                <div key={id} className="flex items-center gap-2 text-sm bg-gray-50 rounded-lg px-3 py-1.5">
                  <span className="w-6 text-gray-400">{i + 1}.</span>
                  <span className="flex-1">{memberName(id) || 'Unnamed member'}</span>
                  <button onClick={() => moveInOrder(id, -1)} disabled={i === 0} className="text-gray-500 disabled:text-gray-200">
                    ↑
                  </button>
                  <button
                    onClick={() => moveInOrder(id, 1)}
                    disabled={i === group.rotationOrder.length - 1}
                    className="text-gray-500 disabled:text-gray-200"
                  >
                    ↓
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700">Leader / organizer (optional)</label>
              <input
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                value={group.leaderName || ''}
                onChange={(e) => setGroup((g) => ({ ...g, leaderName: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Notes (e.g. service fee agreement)</label>
              <input
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                value={group.notes || ''}
                onChange={(e) => setGroup((g) => ({ ...g, notes: e.target.value }))}
              />
            </div>
          </div>

          {!readyForSchedule && (
            <p className="text-xs text-amber-600">
              Add a name for every member before moving to the Schedule tab.
            </p>
          )}
        </div>
      )}

      {/* ---------------- Schedule tab ---------------- */}
      {tab === 'schedule' && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
          <div>
            <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
              <span>Rotation progress</span>
              <span>{progressPct}%</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500" style={{ width: `${progressPct}%` }} />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-200">
                  <th className="py-2 pr-2">Cycle</th>
                  <th className="py-2 pr-2">Date</th>
                  <th className="py-2 pr-2">Recipient</th>
                  <th className="py-2 pr-2">Expected pot</th>
                  <th className="py-2 pr-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {group.cycles.map((c) => (
                  <tr key={c.index} className="border-b border-gray-100">
                    <td className="py-2 pr-2">{c.index}</td>
                    <td className="py-2 pr-2">{format(parseISO(c.date), 'dd MMM yyyy')}</td>
                    <td className="py-2 pr-2">{memberName(c.recipientId)}</td>
                    <td className="py-2 pr-2">{formatNaira(c.expectedPot)}</td>
                    <td className="py-2 pr-2">
                      <select
                        value={c.status}
                        onChange={(e) => overrideCycleStatus(c.index, e.target.value as CycleStatus)}
                        className={`text-xs rounded-full px-2 py-1 border-0 ${statusBadgeClass(c.status)}`}
                      >
                        <option value="upcoming">Upcoming</option>
                        <option value="due">Due</option>
                        <option value="received">Received</option>
                        <option value="missed">Missed</option>
                      </select>
                    </td>
                  </tr>
                ))}
                {group.cycles.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-gray-400">
                      Add members and a start date in Setup to generate the schedule.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-400">
            Dates are calculated automatically from your start date and frequency and are approximate around
            month-end — always confirm the exact contribution date with your group.
          </p>
        </div>
      )}

      {/* ---------------- Track tab ---------------- */}
      {tab === 'track' && (
        <div className="space-y-3">
          {group.cycles.map((c) => (
            <div key={c.index} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium text-gray-800">
                  Cycle {c.index} · {format(parseISO(c.date), 'dd MMM yyyy')} · Recipient: {memberName(c.recipientId)}
                </div>
                <span className={`text-xs rounded-full px-2 py-1 ${statusBadgeClass(c.status)}`}>{c.status}</span>
              </div>
              <div className="space-y-1">
                {c.entries.map((entry) => (
                  <div key={entry.memberId} className="flex items-center gap-2 text-sm">
                    <span className="flex-1">{memberName(entry.memberId)}</span>
                    <select
                      value={entry.status}
                      onChange={(e) => setMemberStatus(c.index, entry.memberId, e.target.value as MemberStatus)}
                      className={`text-xs rounded-full px-2 py-1 border-0 ${memberStatusClass(entry.status)}`}
                    >
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                      <option value="late">Late</option>
                      <option value="defaulted">Defaulted</option>
                    </select>
                    <input
                      className="w-40 border border-gray-200 rounded-lg px-2 py-1 text-xs"
                      placeholder="Note (optional)"
                      value={entry.note || ''}
                      onChange={(e) => setCycleNote(c.index, entry.memberId, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
          {group.cycles.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-gray-400 text-sm">
              No cycles yet — finish Setup first.
            </div>
          )}
        </div>
      )}

      {/* ---------------- Summary tab ---------------- */}
      {tab === 'summary' && (
        <div className="space-y-4">
          <div className="bg-indigo-50 rounded-xl p-4">
            <div className="text-sm text-gray-500">Next recipient</div>
            {nextCycle ? (
              <>
                <div className="text-lg font-semibold text-gray-800">{memberName(nextCycle.recipientId)}</div>
                <div className="text-sm text-gray-600">
                  Cycle {nextCycle.index} · {format(parseISO(nextCycle.date), 'dd MMM yyyy')} ·{' '}
                  {formatDisplay(nextCycle.expectedPot)}
                </div>
              </>
            ) : (
              <div className="text-sm text-gray-600">All cycles complete or none scheduled yet.</div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="text-sm text-gray-500">Total contributed so far</div>
              <div className="text-lg font-semibold text-gray-800">{formatDisplay(totalContributed)}</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="text-sm text-gray-500">Pot per cycle</div>
              <div className="text-lg font-semibold text-gray-800">{formatDisplay(totalPotPerCycle)}</div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="text-sm font-medium text-gray-700 mb-2">Member position overview</div>
            <div className="space-y-1 text-sm">
              {group.rotationOrder.map((id) => {
                const cycle = group.cycles.find((c) => c.recipientId === id);
                const received = cycle?.status === 'received';
                return (
                  <div key={id} className="flex justify-between border-b border-gray-100 py-1">
                    <span>{memberName(id)}</span>
                    <span className={received ? 'text-green-600' : 'text-gray-400'}>
                      {received ? 'Received' : 'Waiting'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Display currency</label>
              <select
                className="border border-gray-300 rounded-lg px-2 py-1 text-sm"
                value={displayCurrency}
                onChange={(e) => {
                  const val = e.target.value as CurrencyCode;
                  setDisplayCurrency(val);
                  if (val !== 'NGN' && !rates) loadRates();
                }}
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              {rateError && <span className="text-xs text-gray-400">{rateError}</span>}
            </div>

            <div className="flex flex-wrap gap-2">
              <button onClick={exportJSON} className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50">
                Export JSON
              </button>
              <button onClick={exportCSV} className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50">
                Export CSV
              </button>
              <button onClick={() => window.print()} className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50">
                Print / save as PDF
              </button>
              <button onClick={copyShareLink} className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50">
                {shareCopied ? 'Link copied!' : 'Copy share link'}
              </button>
            </div>
          </div>

          <p className="text-xs text-gray-400">
            Figures shown in currencies other than Naira use indicative exchange rates and will not exactly match
            what a bank or money-transfer service charges. All record-keeping remains in Naira.
          </p>
        </div>
      )}
    </div>
  );
}
