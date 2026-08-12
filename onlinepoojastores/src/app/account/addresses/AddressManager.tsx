'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Address } from '@/lib/types';
import AddressForm from './AddressForm';
import { deleteAddress, setDefaultAddress } from './actions';

export default function AddressManager({
  addresses,
}: {
  addresses: Address[];
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  return (
    <div className="mt-6 flex flex-col gap-4">
      {addresses.map((a) =>
        editing === a.id ? (
          <AddressForm
            key={a.id}
            existing={a}
            onDone={() => setEditing(null)}
          />
        ) : (
          <div
            key={a.id}
            className="flex items-start justify-between gap-4 rounded-xl border border-gold/40 bg-white p-4"
          >
            <div className="text-sm">
              <p className="font-semibold text-burgundy-dark">
                {a.full_name}{' '}
                <span className="ml-1 rounded bg-gold-soft px-2 py-0.5 text-xs font-medium capitalize text-burgundy-dark">
                  {a.label}
                </span>
                {a.is_default && (
                  <span className="ml-1 rounded bg-burgundy px-2 py-0.5 text-xs font-medium text-cream">
                    Default
                  </span>
                )}
              </p>
              <p className="mt-1 text-burgundy-dark/80">{a.phone}</p>
              <p className="text-burgundy-dark/80">
                {a.line1}
                {a.line2 ? `, ${a.line2}` : ''}, {a.city}, {a.state} —{' '}
                {a.pincode}
              </p>
              <div className="mt-2 flex gap-3 text-xs font-medium">
                <button
                  onClick={() => setEditing(a.id)}
                  className="text-burgundy hover:underline"
                >
                  Edit
                </button>
                {!a.is_default && (
                  <button
                    onClick={() =>
                      startTransition(async () => {
                        await setDefaultAddress(a.id);
                        router.refresh();
                      })
                    }
                    className="text-burgundy hover:underline"
                  >
                    Set as default
                  </button>
                )}
                <button
                  onClick={() => {
                    if (confirm('Delete this address?'))
                      startTransition(async () => {
                        await deleteAddress(a.id);
                        router.refresh();
                      });
                  }}
                  className="text-burgundy hover:underline"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ),
      )}

      {adding ? (
        <AddressForm onDone={() => setAdding(false)} />
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="w-fit rounded-lg border border-burgundy px-5 py-2 text-sm font-semibold text-burgundy hover:bg-burgundy hover:text-cream"
        >
          + Add a new address
        </button>
      )}
    </div>
  );
}
