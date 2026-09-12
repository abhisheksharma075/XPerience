'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  CharacterAttributes,
  AttributeKey,
  VALID_ATTRIBUTES,
  ATTRIBUTE_METADATA,
  incrementAttribute,
} from '@/lib/attributes';

interface AttributeManagerProps {
  userId: string;
  initialAttributes: CharacterAttributes;
}

export default function AttributeManager({
  userId,
  initialAttributes,
}: AttributeManagerProps) {
  const router = useRouter();
  const [attributes, setAttributes] = useState<CharacterAttributes>(initialAttributes);
  const [upgradingAttr, setUpgradingAttr] = useState<AttributeKey | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleIncrement = async (attr: AttributeKey) => {
    setUpgradingAttr(attr);
    setError(null);
    setSuccess(null);

    // Optimistic update
    const prevAttributes = { ...attributes };
    setAttributes((prev) => ({
      ...prev,
      [attr]: prev[attr] + 1,
    }));

    try {
      const supabase = createClient();
      const { attributes: updated, error: incrementError } = await incrementAttribute(
        supabase,
        userId,
        attr,
        1
      );

      if (incrementError || !updated) {
        // Rollback
        setAttributes(prevAttributes);
        setError(incrementError || `Failed to upgrade ${ATTRIBUTE_METADATA[attr].label}`);
        setUpgradingAttr(null);
        return;
      }

      setAttributes(updated);
      setSuccess(`${ATTRIBUTE_METADATA[attr].label} increased to ${updated[attr]}!`);
      setUpgradingAttr(null);
      router.refresh();

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess((current) => (current ? null : current));
      }, 3000);
    } catch (err) {
      setAttributes(prevAttributes);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
      setUpgradingAttr(null);
    }
  };

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <span>Character Attributes</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold">
              Core Stats
            </span>
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Train and develop your core RPG disciplines. Attributes can never drop below 1.
          </p>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-xl bg-red-50 dark:bg-red-950/50 p-3 text-xs text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/50 flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-red-500 hover:text-red-700 font-bold ml-2"
          >
            ×
          </button>
        </div>
      )}

      {success && (
        <div className="mt-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 p-3 text-xs text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50">
          {success}
        </div>
      )}

      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {VALID_ATTRIBUTES.map((attrKey) => {
          const meta = ATTRIBUTE_METADATA[attrKey];
          const currentValue = attributes[attrKey];
          const isUpgrading = upgradingAttr === attrKey;

          return (
            <div
              key={attrKey}
              className="group p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                    <span>{meta.icon}</span>
                    <span>{meta.label}</span>
                  </span>
                  <span className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-100 font-mono">
                    {currentValue}
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">
                  {meta.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-200/60 dark:border-zinc-800/60 flex items-center justify-between">
                <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                  Level {currentValue}
                </span>
                <button
                  type="button"
                  onClick={() => handleIncrement(attrKey)}
                  disabled={upgradingAttr !== null}
                  className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 text-xs font-semibold shadow-xs disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1 cursor-pointer"
                >
                  {isUpgrading ? (
                    <span>Upgrading...</span>
                  ) : (
                    <>
                      <span>+1</span>
                      <span className="hidden xs:inline">Upgrade</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
